import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { QueryAppointmentDto } from '../dto/query-appointment.dto';
import { AuditAction, AppointmentStatus } from '@prisma/client';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentEntity } from '../entities/appointment.entity';
import type { IAppointmentService } from '../interfaces/appointment-service.interface';
import type { IAppointmentEventEmitter } from '../interfaces/appointment-events.interface';

@Injectable()
export class AppointmentService implements IAppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly repository: AppointmentRepository,
    @Inject('IAppointmentEventEmitter')
    private readonly eventEmitter: IAppointmentEventEmitter,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AppointmentEntity> {
    // Validar que el tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createAppointmentDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createAppointmentDto.tenantId} not found`,
      );
    }

    // Validar que el calendar existe y pertenece al tenant
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: createAppointmentDto.calendarId },
    });

    if (!calendar) {
      throw new NotFoundException(
        `Calendar with ID ${createAppointmentDto.calendarId} not found`,
      );
    }

    if (calendar.tenantId !== createAppointmentDto.tenantId) {
      throw new BadRequestException(
        'Calendar does not belong to the specified tenant',
      );
    }

    // Validar que el cliente existe y es de tipo CLIENTE
    const client = await this.prisma.user.findUnique({
      where: { id: createAppointmentDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(
        `Client with ID ${createAppointmentDto.clientId} not found`,
      );
    }

    if (client.userType !== 'CLIENTE') {
      throw new BadRequestException('User must be of type CLIENTE');
    }

    // Validar que startTime es antes de endTime
    const startTime = new Date(createAppointmentDto.startTime);
    const endTime = new Date(createAppointmentDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validar que no hay conflictos con otras citas
    const conflicts = await this.repository.findConflicting(
      createAppointmentDto.calendarId,
      startTime,
      endTime,
    );

    if (conflicts.length > 0) {
      throw new ConflictException(
        'There is a time conflict with another appointment in this calendar',
      );
    }

    // Crear el appointment usando el repository
    const appointment = await this.repository.create({
      ...createAppointmentDto,
      startTime,
      endTime,
      designImages: createAppointmentDto.designImages || [],
    });

    // Registrar en auditoría
    await this.auditService.log({
      action: AuditAction.APPOINTMENT_CREATED,
      description: `Appointment created: ${appointment.title}`,
      actorId,
      actorType: 'USER',
      resourceId: appointment.id,
      resourceType: 'APPOINTMENT',
      resourceName: appointment.title,
      tenantId: appointment.tenantId,
      tenantName: tenant.name,
      ipAddress: ip,
      userAgent,
      metadata: {
        calendarId: appointment.calendarId,
        clientId: appointment.clientId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      },
    });

    // Emitir evento WebSocket
    this.eventEmitter.emitAppointmentCreated(appointment);

    return appointment;
  }

  async findAll(query: QueryAppointmentDto) {
    const { page = 1, limit = 10, search, startDate, endDate, ...filters } = query;

    return this.repository.findAll(
      {
        ...filters,
        search,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      { page, limit },
    );
  }

  async findOne(id: string): Promise<AppointmentEntity> {
    const appointment = await this.repository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AppointmentEntity> {
    const existingAppointment = await this.repository.findById(id);

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Validar fechas si se están actualizando
    let startTime = existingAppointment.startTime;
    let endTime = existingAppointment.endTime;
    let isRescheduled = false;

    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      startTime = updateAppointmentDto.startTime
        ? new Date(updateAppointmentDto.startTime)
        : existingAppointment.startTime;
      endTime = updateAppointmentDto.endTime
        ? new Date(updateAppointmentDto.endTime)
        : existingAppointment.endTime;

      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      // Verificar si cambió la fecha
      isRescheduled =
        startTime.getTime() !== existingAppointment.startTime.getTime() ||
        endTime.getTime() !== existingAppointment.endTime.getTime();

      // Validar conflictos solo si las fechas cambiaron
      if (isRescheduled) {
        const conflicts = await this.repository.findConflicting(
          existingAppointment.calendarId,
          startTime,
          endTime,
          id,
        );

        if (conflicts.length > 0) {
          throw new ConflictException(
            'There is a time conflict with another appointment in this calendar',
          );
        }
      }
    }

    // Actualizar usando el repository
    const updatedAppointment = await this.repository.update(id, {
      ...updateAppointmentDto,
      startTime: updateAppointmentDto.startTime
        ? new Date(updateAppointmentDto.startTime)
        : undefined,
      endTime: updateAppointmentDto.endTime
        ? new Date(updateAppointmentDto.endTime)
        : undefined,
    });

    // Determinar la acción de auditoría según el cambio
    let auditAction: AuditAction = AuditAction.APPOINTMENT_UPDATED;
    let auditDescription = `Appointment updated: ${updatedAppointment.title}`;
    const oldStatus = existingAppointment.status;
    const newStatus = updatedAppointment.status;

    if (updateAppointmentDto.status && oldStatus !== newStatus) {
      if (newStatus === AppointmentStatus.CANCELLED) {
        auditAction = AuditAction.APPOINTMENT_CANCELLED;
        auditDescription = `Appointment cancelled: ${updatedAppointment.title}`;
      } else if (newStatus === AppointmentStatus.CONFIRMED) {
        auditAction = AuditAction.APPOINTMENT_CONFIRMED;
        auditDescription = `Appointment confirmed: ${updatedAppointment.title}`;
      } else if (newStatus === AppointmentStatus.COMPLETED) {
        auditAction = AuditAction.APPOINTMENT_COMPLETED;
        auditDescription = `Appointment completed: ${updatedAppointment.title}`;
      }
      // Emitir evento de cambio de estado
      this.eventEmitter.emitStatusChanged(updatedAppointment, oldStatus, newStatus);
    } else if (isRescheduled) {
      auditAction = AuditAction.APPOINTMENT_RESCHEDULED;
      auditDescription = `Appointment rescheduled: ${updatedAppointment.title}`;
      // Emitir evento de reagendamiento
      this.eventEmitter.emitRescheduled(
        updatedAppointment,
        existingAppointment.startTime,
        existingAppointment.endTime,
      );
    } else {
      // Emitir evento de actualización general
      this.eventEmitter.emitAppointmentUpdated(updatedAppointment, updateAppointmentDto);
    }

    // Registrar en auditoría
    await this.auditService.log({
      action: auditAction,
      description: auditDescription,
      actorId,
      actorType: 'USER',
      resourceId: updatedAppointment.id,
      resourceType: 'APPOINTMENT',
      resourceName: updatedAppointment.title,
      tenantId: updatedAppointment.tenantId,
      tenantName: updatedAppointment.tenant?.name,
      ipAddress: ip,
      userAgent,
      oldValues: existingAppointment,
      newValues: updateAppointmentDto,
    });

    return updatedAppointment;
  }

  async remove(
    id: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const appointment = await this.repository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    await this.repository.delete(id);

    // Registrar en auditoría
    await this.auditService.log({
      action: AuditAction.APPOINTMENT_CANCELLED,
      description: `Appointment deleted: ${appointment.title}`,
      actorId,
      actorType: 'USER',
      resourceId: appointment.id,
      resourceType: 'APPOINTMENT',
      resourceName: appointment.title,
      tenantId: appointment.tenantId,
      tenantName: appointment.tenant?.name,
      ipAddress: ip,
      userAgent,
      metadata: {
        deletedAppointment: appointment,
      },
    });

    // Emitir evento WebSocket
    this.eventEmitter.emitAppointmentDeleted(appointment);
  }

  async getAppointmentsByCalendar(
    calendarId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AppointmentEntity[]> {
    return this.repository.findByCalendar(
      calendarId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async getUpcomingAppointments(
    tenantId: string,
    limit: number = 10,
  ): Promise<AppointmentEntity[]> {
    return this.repository.findUpcoming(tenantId, limit);
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { AppointmentRequestRepository } from '../repositories/appointment-request.repository';
import { AppointmentRequestEntity } from '../entities/appointment-request.entity';
import { CreateAppointmentRequestDto } from '../dto/create-appointment-request.dto';
import { IAppointmentRequestService } from '../interfaces/appointment-request-service.interface';
import { AppointmentRequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/services/mail.service';

@Injectable()
export class AppointmentRequestService implements IAppointmentRequestService {
  private readonly logger = new Logger(AppointmentRequestService.name);

  constructor(
    private readonly appointmentRequestRepository: AppointmentRequestRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  async create(
    dto: CreateAppointmentRequestDto,
    clientId: string,
  ): Promise<AppointmentRequestEntity> {
    this.logger.log(`Creating appointment request for client: ${clientId}`);

    // Verificar que el cliente existe y es de tipo CLIENTE
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.userType !== 'CLIENTE') {
      throw new BadRequestException('Only clients can create appointment requests');
    }

    // Crear la solicitud
    const request = await this.appointmentRequestRepository.create({
      ...dto,
      clientId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    });

    // Notificar a todos los tenants (enviar emails)
    await this.notifyTenantsOfNewRequest(request);

    // Auditar creación
    await this.auditService.log({
      action: 'APPOINTMENT_REQUEST_CREATED',
      severity: 'INFO',
      description: `Appointment request created: ${request.title}`,
      resourceId: request.id,
      resourceType: 'APPOINTMENT_REQUEST',
      resourceName: request.title,
      actorId: clientId,
      actorEmail: client.email,
      actorName: client.name,
      metadata: {
        budget: request.budget,
        designImagesCount: request.designImages.length,
      },
    });

    this.logger.log(`Appointment request created successfully: ${request.id}`);
    return request;
  }

  async findAll(
    clientId?: string,
    tenantId?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const { data, total } = await this.appointmentRequestRepository.findAll({
      clientId,
      tenantId,
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<AppointmentRequestEntity> {
    const request = await this.appointmentRequestRepository.findById(id);

    if (!request) {
      throw new NotFoundException('Appointment request not found');
    }

    return request;
  }

  async findByClient(clientId: string): Promise<AppointmentRequestEntity[]> {
    return this.appointmentRequestRepository.findByClient(clientId);
  }

  async findAvailableForTenant(tenantId: string): Promise<AppointmentRequestEntity[]> {
    return this.appointmentRequestRepository.findAvailableForTenant(tenantId);
  }

  async acceptRequest(
    requestId: string,
    tenantId: string,
    actorId: string,
  ): Promise<AppointmentRequestEntity> {
    this.logger.log(`Tenant ${tenantId} accepting request ${requestId}`);

    // Verificar que el tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Verificar que el actor pertenece al tenant
    const member = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: actorId,
        },
      },
    });

    if (!member && tenant.ownerId !== actorId) {
      throw new BadRequestException('Actor does not belong to this tenant');
    }

    // Obtener la solicitud
    const request = await this.findById(requestId);

    if (!request.canBeAccepted()) {
      throw new BadRequestException('Request cannot be accepted');
    }

    // Verificar que no haya sido aceptada por otro tenant
    if (request.acceptedByTenantId && request.acceptedByTenantId !== tenantId) {
      throw new BadRequestException('Request has already been accepted by another tenant');
    }

    // Aceptar la solicitud
    const updatedRequest = await this.appointmentRequestRepository.update(requestId, {
      status: AppointmentRequestStatus.ACCEPTED,
      acceptedByTenantId: tenantId,
    });

    // Notificar al cliente
    await this.notifyClientOfAcceptance(updatedRequest, tenant);

    // Auditar aceptación
    await this.auditService.log({
      action: 'APPOINTMENT_REQUEST_ACCEPTED',
      severity: 'INFO',
      description: `Appointment request accepted by tenant: ${tenant.name}`,
      resourceId: requestId,
      resourceType: 'APPOINTMENT_REQUEST',
      resourceName: request.title,
      actorId,
      tenantId,
      tenantName: tenant.name,
      metadata: {
        acceptedByTenantId: tenantId,
        clientId: request.clientId,
      },
    });

    this.logger.log(`Request ${requestId} accepted by tenant ${tenantId}`);
    return updatedRequest;
  }

  async cancelRequest(
    requestId: string,
    clientId: string,
  ): Promise<AppointmentRequestEntity> {
    const request = await this.findById(requestId);

    if (request.clientId !== clientId) {
      throw new BadRequestException('Only the client can cancel their request');
    }

    if (!request.canBeCancelled()) {
      throw new BadRequestException('Request cannot be cancelled');
    }

    const updatedRequest = await this.appointmentRequestRepository.update(requestId, {
      status: AppointmentRequestStatus.CANCELLED,
    });

    // Auditar cancelación
    await this.auditService.log({
      action: 'APPOINTMENT_REQUEST_CANCELLED',
      severity: 'INFO',
      description: `Appointment request cancelled: ${request.title}`,
      resourceId: requestId,
      resourceType: 'APPOINTMENT_REQUEST',
      resourceName: request.title,
      actorId: clientId,
      metadata: {
        cancelledBy: 'client',
      },
    });

    return updatedRequest;
  }

  async expireRequests(): Promise<number> {
    const expiredRequests = await this.appointmentRequestRepository.findExpired();

    let count = 0;
    for (const request of expiredRequests) {
      await this.appointmentRequestRepository.update(request.id, {
        status: AppointmentRequestStatus.EXPIRED,
      });
      count++;
    }

    this.logger.log(`Expired ${count} appointment requests`);
    return count;
  }

  async convertToAppointment(
    requestId: string,
    appointmentData: {
      startTime: string;
      endTime: string;
      calendarId: string;
      totalPrice?: number;
      notes?: string;
    },
    actorId: string,
  ): Promise<{ request: AppointmentRequestEntity; appointment: any }> {
    const request = await this.findById(requestId);

    if (request.status !== AppointmentRequestStatus.ACCEPTED) {
      throw new BadRequestException('Request must be accepted before converting to appointment');
    }

    if (request.acceptedByTenantId === null) {
      throw new BadRequestException('Request must have an accepted tenant');
    }

    // Verificar que el calendario pertenece al tenant
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: appointmentData.calendarId },
    });

    if (!calendar || calendar.tenantId !== request.acceptedByTenantId) {
      throw new BadRequestException('Calendar does not belong to the accepted tenant');
    }

    // Crear la cita
    const appointment = await this.prisma.appointment.create({
      data: {
        title: request.title,
        description: request.description,
        startTime: new Date(appointmentData.startTime),
        endTime: new Date(appointmentData.endTime),
        status: 'PENDING',
        deposit: 0,
        totalPrice: appointmentData.totalPrice || request.budget,
        notes: appointmentData.notes,
        designImages: request.designImages,
        tenantId: request.acceptedByTenantId,
        calendarId: appointmentData.calendarId,
        clientId: request.clientId,
        fromRequestId: requestId,
      },
    });

    // Actualizar la solicitud como completada
    const updatedRequest = await this.appointmentRequestRepository.update(requestId, {
      status: AppointmentRequestStatus.COMPLETED,
      resultingAppointmentId: appointment.id,
    });

    // Notificar al cliente
    await this.notifyClientOfAppointmentCreated(updatedRequest, appointment);

    // Auditar conversión
    await this.auditService.log({
      action: 'APPOINTMENT_CREATED_FROM_REQUEST',
      severity: 'INFO',
      description: `Appointment created from request: ${request.title}`,
      resourceId: appointment.id,
      resourceType: 'APPOINTMENT',
      resourceName: request.title,
      actorId,
      tenantId: request.acceptedByTenantId,
      metadata: {
        fromRequestId: requestId,
        calendarId: appointmentData.calendarId,
      },
    });

    return { request: updatedRequest, appointment };
  }

  private async notifyTenantsOfNewRequest(request: AppointmentRequestEntity): Promise<void> {
    try {
      // Obtener todos los tenants
      const tenants = await this.prisma.tenant.findMany({
        include: {
          owner: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      // Enviar notificación a cada tenant
      for (const tenant of tenants) {
        if (tenant.owner.email) {
          await this.mailService.sendMail({
            to: tenant.owner.email,
            subject: `Nueva solicitud de cita: ${request.title}`,
            template: 'new-appointment-request',
            templateData: {
              tenantName: tenant.name,
              clientName: request.client?.name,
              requestTitle: request.title,
              budget: request.budget,
              designImagesCount: request.designImages.length,
            },
          });
        }
      }

      this.logger.log(`Notified ${tenants.length} tenants about new request`);
    } catch (error) {
      this.logger.error('Failed to notify tenants of new request', error);
    }
  }

  private async notifyClientOfAcceptance(
    request: AppointmentRequestEntity,
    tenant: any,
  ): Promise<void> {
    try {
      if (request.client?.email) {
        await this.mailService.sendMail({
          to: request.client.email,
          subject: `Tu solicitud de cita ha sido aceptada`,
          template: 'appointment-request-accepted',
          templateData: {
            clientName: request.client.name,
            requestTitle: request.title,
            tenantName: tenant.name,
            tenantEmail: tenant.email,
            tenantPhone: tenant.phone,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to notify client of acceptance', error);
    }
  }

  private async notifyClientOfAppointmentCreated(
    request: AppointmentRequestEntity,
    appointment: any,
  ): Promise<void> {
    try {
      if (request.client?.email) {
        await this.mailService.sendMail({
          to: request.client.email,
          subject: `Tu cita ha sido agendada`,
          template: 'appointment-scheduled',
          templateData: {
            clientName: request.client.name,
            appointmentTitle: request.title,
            startTime: appointment.startTime.toISOString(),
            endTime: appointment.endTime.toISOString(),
            tenantName: request.acceptedByTenant?.name,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to notify client of appointment creation', error);
    }
  }
}
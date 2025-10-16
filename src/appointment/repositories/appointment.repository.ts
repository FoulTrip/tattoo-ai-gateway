import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentEntity } from '../entities/appointment.entity';
import { AppointmentMapper } from '../entities/appointment.mapper';
import {
  IAppointmentRepository,
  AppointmentFilter,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces/appointment-repository.interface';

@Injectable()
export class AppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(appointment: Partial<AppointmentEntity>): Promise<AppointmentEntity> {
    const data = AppointmentMapper.toPrismaCreate(appointment);
    const created = await this.prisma.appointment.create({
      data,
      include: this.getDefaultIncludes(),
    });
    return AppointmentMapper.toEntity(created);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });
    return appointment ? AppointmentMapper.toEntity(appointment) : null;
  }

  async findAll(
    filter: AppointmentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AppointmentEntity>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filter);

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: AppointmentMapper.toEntityArray(appointments),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCalendar(
    calendarId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AppointmentEntity[]> {
    const where: any = { calendarId };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    return AppointmentMapper.toEntityArray(appointments);
  }

  async findUpcoming(tenantId: string, limit: number): Promise<AppointmentEntity[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: new Date() },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      take: limit,
      orderBy: { startTime: 'asc' },
      include: this.getDefaultIncludes(),
    });

    return AppointmentMapper.toEntityArray(appointments);
  }

  async findConflicting(
    calendarId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<AppointmentEntity[]> {
    const where: any = {
      calendarId,
      status: { notIn: ['CANCELLED'] },
      OR: [
        {
          AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        {
          AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const appointments = await this.prisma.appointment.findMany({ where });
    return AppointmentMapper.toEntityArray(appointments);
  }

  async update(
    id: string,
    appointment: Partial<AppointmentEntity>,
  ): Promise<AppointmentEntity> {
    const data = AppointmentMapper.toPrismaUpdate(appointment);
    const updated = await this.prisma.appointment.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    });
    return AppointmentMapper.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  async count(filter: AppointmentFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.appointment.count({ where });
  }

  private buildWhereClause(filter: AppointmentFilter): any {
    const where: any = {};

    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.calendarId) where.calendarId = filter.calendarId;
    if (filter.clientId) where.clientId = filter.clientId;
    if (filter.status) where.status = filter.status;

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.startDate || filter.endDate) {
      where.AND = [];
      if (filter.startDate) {
        where.AND.push({ startTime: { gte: filter.startDate } });
      }
      if (filter.endDate) {
        where.AND.push({ endTime: { lte: filter.endDate } });
      }
    }

    return where;
  }

  private getDefaultIncludes() {
    return {
      tenant: {
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          phone: true,
          email: true,
        },
      },
      calendar: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    };
  }
}

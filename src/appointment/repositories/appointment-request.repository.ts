import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentRequestEntity } from '../entities/appointment-request.entity';
import { IAppointmentRequestRepository } from '../interfaces/appointment-request-repository.interface';
import { AppointmentRequestStatus } from '@prisma/client';

@Injectable()
export class AppointmentRequestRepository implements IAppointmentRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(request: Partial<AppointmentRequestEntity>): Promise<AppointmentRequestEntity> {
    const data = {
      id: request.id,
      title: request.title!,
      description: request.description,
      budget: request.budget!,
      designImages: request.designImages || [],
      preferences: request.preferences,
      status: request.status || AppointmentRequestStatus.PENDING,
      expiresAt: request.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días por defecto
      clientId: request.clientId!,
      acceptedByTenantId: request.acceptedByTenantId,
      resultingAppointmentId: request.resultingAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await this.prisma.appointmentRequest.create({
      data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        acceptedByTenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new AppointmentRequestEntity(created);
  }

  async findById(id: string): Promise<AppointmentRequestEntity | null> {
    const request = await this.prisma.appointmentRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        acceptedByTenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return request ? new AppointmentRequestEntity(request) : null;
  }

  async findAll(options: {
    clientId?: string;
    tenantId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AppointmentRequestEntity[]; total: number }> {
    const { clientId, tenantId, status, limit = 50, offset = 0 } = options;

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (tenantId) where.acceptedByTenantId = tenantId;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      this.prisma.appointmentRequest.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          acceptedByTenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.appointmentRequest.count({ where }),
    ]);

    return {
      data: requests.map(request => new AppointmentRequestEntity(request)),
      total,
    };
  }

  async findByClient(clientId: string): Promise<AppointmentRequestEntity[]> {
    const requests = await this.prisma.appointmentRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        acceptedByTenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return requests.map(request => new AppointmentRequestEntity(request));
  }

  async findAvailableForTenant(tenantId: string): Promise<AppointmentRequestEntity[]> {
    const requests = await this.prisma.appointmentRequest.findMany({
      where: {
        status: AppointmentRequestStatus.PENDING,
        expiresAt: { gt: new Date() },
        // Excluir solicitudes ya aceptadas por otros tenants
        acceptedByTenantId: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return requests.map(request => new AppointmentRequestEntity(request));
  }

  async findExpired(): Promise<AppointmentRequestEntity[]> {
    const requests = await this.prisma.appointmentRequest.findMany({
      where: {
        status: AppointmentRequestStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return requests.map(request => new AppointmentRequestEntity(request));
  }

  async update(id: string, request: Partial<AppointmentRequestEntity>): Promise<AppointmentRequestEntity> {
    const data: any = {
      updatedAt: new Date(),
    };

    // Solo incluir campos que no sean métodos
    if (request.title !== undefined) data.title = request.title;
    if (request.description !== undefined) data.description = request.description;
    if (request.budget !== undefined) data.budget = request.budget;
    if (request.designImages !== undefined) data.designImages = request.designImages;
    if (request.preferences !== undefined) data.preferences = request.preferences;
    if (request.status !== undefined) data.status = request.status;
    if (request.expiresAt !== undefined) data.expiresAt = request.expiresAt;
    if (request.acceptedByTenantId !== undefined) data.acceptedByTenantId = request.acceptedByTenantId;
    if (request.resultingAppointmentId !== undefined) data.resultingAppointmentId = request.resultingAppointmentId;

    const updated = await this.prisma.appointmentRequest.update({
      where: { id },
      data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        acceptedByTenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new AppointmentRequestEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointmentRequest.delete({
      where: { id },
    });
  }

  async count(options?: { clientId?: string; tenantId?: string; status?: string }): Promise<number> {
    const where: any = {};

    if (options?.clientId) where.clientId = options.clientId;
    if (options?.tenantId) where.acceptedByTenantId = options.tenantId;
    if (options?.status) where.status = options.status;

    return this.prisma.appointmentRequest.count({ where });
  }
}
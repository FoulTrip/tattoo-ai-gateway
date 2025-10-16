import { Appointment } from '@prisma/client';
import { AppointmentEntity } from './appointment.entity';

export class AppointmentMapper {
  static toEntity(prismaAppointment: any): AppointmentEntity {
    return new AppointmentEntity({
      id: prismaAppointment.id,
      title: prismaAppointment.title,
      description: prismaAppointment.description,
      startTime: prismaAppointment.startTime,
      endTime: prismaAppointment.endTime,
      status: prismaAppointment.status,
      deposit: prismaAppointment.deposit,
      totalPrice: prismaAppointment.totalPrice,
      notes: prismaAppointment.notes,
      designImages: prismaAppointment.designImages,
      tenantId: prismaAppointment.tenantId,
      calendarId: prismaAppointment.calendarId,
      clientId: prismaAppointment.clientId,
      createdAt: prismaAppointment.createdAt,
      updatedAt: prismaAppointment.updatedAt,
      tenant: prismaAppointment.tenant,
      calendar: prismaAppointment.calendar,
      client: prismaAppointment.client,
    });
  }

  static toEntityArray(prismaAppointments: any[]): AppointmentEntity[] {
    return prismaAppointments.map((appointment) => this.toEntity(appointment));
  }

  static toPrismaCreate(entity: Partial<AppointmentEntity>): any {
    return {
      title: entity.title,
      description: entity.description,
      startTime: entity.startTime,
      endTime: entity.endTime,
      status: entity.status,
      deposit: entity.deposit,
      totalPrice: entity.totalPrice,
      notes: entity.notes,
      designImages: entity.designImages || [],
      tenantId: entity.tenantId,
      calendarId: entity.calendarId,
      clientId: entity.clientId,
    };
  }

  static toPrismaUpdate(entity: Partial<AppointmentEntity>): any {
    const data: any = {};

    if (entity.title !== undefined) data.title = entity.title;
    if (entity.description !== undefined) data.description = entity.description;
    if (entity.startTime !== undefined) data.startTime = entity.startTime;
    if (entity.endTime !== undefined) data.endTime = entity.endTime;
    if (entity.status !== undefined) data.status = entity.status;
    if (entity.deposit !== undefined) data.deposit = entity.deposit;
    if (entity.totalPrice !== undefined) data.totalPrice = entity.totalPrice;
    if (entity.notes !== undefined) data.notes = entity.notes;
    if (entity.designImages !== undefined) data.designImages = entity.designImages;

    return data;
  }
}

import { AppointmentEntity } from '../entities/appointment.entity';
import { AppointmentStatus } from '@prisma/client';

export interface AppointmentFilter {
  tenantId?: string;
  calendarId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAppointmentRepository {
  create(appointment: Partial<AppointmentEntity>): Promise<AppointmentEntity>;
  findById(id: string): Promise<AppointmentEntity | null>;
  findAll(
    filter: AppointmentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AppointmentEntity>>;
  findByCalendar(
    calendarId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AppointmentEntity[]>;
  findUpcoming(tenantId: string, limit: number): Promise<AppointmentEntity[]>;
  findConflicting(
    calendarId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<AppointmentEntity[]>;
  update(
    id: string,
    appointment: Partial<AppointmentEntity>,
  ): Promise<AppointmentEntity>;
  delete(id: string): Promise<void>;
  count(filter: AppointmentFilter): Promise<number>;
}

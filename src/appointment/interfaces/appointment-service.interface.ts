import { AppointmentEntity } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { QueryAppointmentDto } from '../dto/query-appointment.dto';
import { PaginatedResult } from './appointment-repository.interface';

export interface IAppointmentService {
  create(
    dto: CreateAppointmentDto,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AppointmentEntity>;

  findAll(query: QueryAppointmentDto): Promise<PaginatedResult<AppointmentEntity>>;

  findOne(id: string): Promise<AppointmentEntity>;

  update(
    id: string,
    dto: UpdateAppointmentDto,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AppointmentEntity>;

  remove(
    id: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void>;

  getAppointmentsByCalendar(
    calendarId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AppointmentEntity[]>;

  getUpcomingAppointments(
    tenantId: string,
    limit?: number,
  ): Promise<AppointmentEntity[]>;
}

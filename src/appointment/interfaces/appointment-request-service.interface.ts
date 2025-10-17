import { AppointmentRequestEntity } from '../entities/appointment-request.entity';
import { CreateAppointmentRequestDto } from '../dto/create-appointment-request.dto';

export interface IAppointmentRequestService {
  create(
    dto: CreateAppointmentRequestDto,
    clientId: string,
  ): Promise<AppointmentRequestEntity>;

  findAll(
    clientId?: string,
    tenantId?: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    data: AppointmentRequestEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  findById(id: string): Promise<AppointmentRequestEntity>;

  findByClient(clientId: string): Promise<AppointmentRequestEntity[]>;

  findAvailableForTenant(tenantId: string): Promise<AppointmentRequestEntity[]>;

  acceptRequest(
    requestId: string,
    tenantId: string,
    actorId: string,
  ): Promise<AppointmentRequestEntity>;

  cancelRequest(
    requestId: string,
    clientId: string,
  ): Promise<AppointmentRequestEntity>;

  expireRequests(): Promise<number>;

  convertToAppointment(
    requestId: string,
    appointmentData: {
      startTime: string;
      endTime: string;
      calendarId: string;
      totalPrice?: number;
      notes?: string;
    },
    actorId: string,
  ): Promise<{ request: AppointmentRequestEntity; appointment: any }>;
}
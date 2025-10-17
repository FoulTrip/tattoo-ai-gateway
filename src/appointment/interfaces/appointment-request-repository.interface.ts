import { AppointmentRequestEntity } from '../entities/appointment-request.entity';

export interface IAppointmentRequestRepository {
  create(request: Partial<AppointmentRequestEntity>): Promise<AppointmentRequestEntity>;
  findById(id: string): Promise<AppointmentRequestEntity | null>;
  findAll(options: {
    clientId?: string;
    tenantId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AppointmentRequestEntity[]; total: number }>;
  findByClient(clientId: string): Promise<AppointmentRequestEntity[]>;
  findAvailableForTenant(tenantId: string): Promise<AppointmentRequestEntity[]>;
  findExpired(): Promise<AppointmentRequestEntity[]>;
  update(id: string, request: Partial<AppointmentRequestEntity>): Promise<AppointmentRequestEntity>;
  delete(id: string): Promise<void>;
  count(options?: { clientId?: string; tenantId?: string; status?: string }): Promise<number>;
}
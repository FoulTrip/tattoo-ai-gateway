import { AppointmentRequestStatus } from '@prisma/client';

export class AppointmentRequestEntity {
  id: string;
  title: string;
  description?: string | null;
  budget: number;
  designImages: string[];
  preferences?: any;
  status: AppointmentRequestStatus;
  expiresAt: Date;

  // Relaciones
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };

  acceptedByTenantId?: string | null;
  acceptedByTenant?: {
    id: string;
    name: string;
  } | null;

  resultingAppointmentId?: string | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AppointmentRequestEntity>) {
    Object.assign(this, partial);
  }

  // Métodos de negocio
  isPending(): boolean {
    return this.status === AppointmentRequestStatus.PENDING;
  }

  isAccepted(): boolean {
    return this.status === AppointmentRequestStatus.ACCEPTED;
  }

  isExpired(): boolean {
    return this.status === AppointmentRequestStatus.EXPIRED;
  }

  isCancelled(): boolean {
    return this.status === AppointmentRequestStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.status === AppointmentRequestStatus.COMPLETED;
  }

  canBeAccepted(): boolean {
    return this.isPending() && this.expiresAt > new Date();
  }

  canBeCancelled(): boolean {
    return this.isPending() && this.expiresAt > new Date();
  }

  accept(tenantId: string): void {
    this.status = AppointmentRequestStatus.ACCEPTED;
    this.acceptedByTenantId = tenantId;
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = AppointmentRequestStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  expire(): void {
    this.status = AppointmentRequestStatus.EXPIRED;
    this.updatedAt = new Date();
  }

  complete(appointmentId: string): void {
    this.status = AppointmentRequestStatus.COMPLETED;
    this.resultingAppointmentId = appointmentId;
    this.updatedAt = new Date();
  }

  getTimeUntilExpiration(): number {
    return this.expiresAt.getTime() - new Date().getTime();
  }

  isExpiringSoon(hours: number = 24): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration();
    return timeUntilExpiration > 0 && timeUntilExpiration <= (hours * 60 * 60 * 1000);
  }
}
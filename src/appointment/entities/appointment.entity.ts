import { AppointmentStatus } from '@prisma/client';

export class AppointmentEntity {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  deposit?: number;
  totalPrice?: number;
  notes?: string;
  designImages: string[];
  tenantId: string;
  calendarId: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones opcionales
  tenant?: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
  };

  calendar?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
  };

  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };

  constructor(partial: Partial<AppointmentEntity>) {
    Object.assign(this, partial);
  }

  // Métodos de negocio
  isUpcoming(): boolean {
    return this.startTime > new Date() && this.status !== AppointmentStatus.CANCELLED;
  }

  isPast(): boolean {
    return this.endTime < new Date();
  }

  isActive(): boolean {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now;
  }

  canBeCancelled(): boolean {
    return !this.isPast() && this.status !== AppointmentStatus.CANCELLED;
  }

  canBeRescheduled(): boolean {
    return this.status !== AppointmentStatus.COMPLETED && this.status !== AppointmentStatus.CANCELLED;
  }

  getDuration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  getDurationInMinutes(): number {
    return Math.floor(this.getDuration() / (1000 * 60));
  }

  hasConflictWith(other: AppointmentEntity): boolean {
    if (this.calendarId !== other.calendarId) {
      return false;
    }

    return (
      (this.startTime <= other.startTime && this.endTime > other.startTime) ||
      (this.startTime < other.endTime && this.endTime >= other.endTime) ||
      (this.startTime >= other.startTime && this.endTime <= other.endTime)
    );
  }
}

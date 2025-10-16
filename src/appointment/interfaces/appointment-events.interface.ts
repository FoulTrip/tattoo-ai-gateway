import { AppointmentEntity } from '../entities/appointment.entity';
import { AppointmentStatus } from '@prisma/client';

export enum AppointmentEventType {
  CREATED = 'appointment.created',
  UPDATED = 'appointment.updated',
  DELETED = 'appointment.deleted',
  STATUS_CHANGED = 'appointment.status.changed',
  RESCHEDULED = 'appointment.rescheduled',
  REMINDER = 'appointment.reminder',
}

export interface AppointmentEventPayload {
  appointmentId: string;
  tenantId: string;
  calendarId: string;
  clientId: string;
  eventType: AppointmentEventType;
  timestamp: Date;
  data: AppointmentEntity;
  changes?: {
    oldValue?: any;
    newValue?: any;
    field?: string;
  };
}

export interface AppointmentStatusChangePayload
  extends AppointmentEventPayload {
  oldStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
}

export interface AppointmentReminderPayload {
  appointmentId: string;
  tenantId: string;
  clientId: string;
  appointment: AppointmentEntity;
  reminderType: 'day_before' | 'hour_before' | 'custom';
  minutesUntilStart: number;
}

export interface IAppointmentEventEmitter {
  emitAppointmentCreated(appointment: AppointmentEntity): void;
  emitAppointmentUpdated(
    appointment: AppointmentEntity,
    changes?: any,
  ): void;
  emitAppointmentDeleted(appointment: AppointmentEntity): void;
  emitStatusChanged(
    appointment: AppointmentEntity,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
  ): void;
  emitRescheduled(
    appointment: AppointmentEntity,
    oldStartTime: Date,
    oldEndTime: Date,
  ): void;
}

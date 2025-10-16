import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AppointmentEntity } from '../entities/appointment.entity';
import {
  IAppointmentEventEmitter,
  AppointmentEventType,
  AppointmentEventPayload,
} from '../interfaces/appointment-events.interface';
import { AppointmentStatus } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especificar los orígenes permitidos
  },
  namespace: '/appointments',
})
export class AppointmentGateway
  implements
    IAppointmentEventEmitter,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppointmentGateway.name);
  private readonly connectedClients = new Map<string, Set<string>>(); // tenantId -> Set<socketId>

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remover cliente de todos los tenants
    this.connectedClients.forEach((clients) => {
      clients.delete(client.id);
    });
  }

  // Permite a los clientes suscribirse a eventos de un tenant específico
  @SubscribeMessage('subscribe:tenant')
  handleSubscribeToTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tenantId } = data;

    if (!tenantId) {
      client.emit('error', { message: 'tenantId is required' });
      return;
    }

    // Unir el cliente a la sala del tenant
    client.join(`tenant:${tenantId}`);

    // Registrar en el mapa de clientes conectados
    if (!this.connectedClients.has(tenantId)) {
      this.connectedClients.set(tenantId, new Set());
    }
    this.connectedClients.get(tenantId)!.add(client.id);

    this.logger.log(`Client ${client.id} subscribed to tenant ${tenantId}`);
    client.emit('subscribed', { tenantId });
  }

  // Permite a los clientes desuscribirse de eventos de un tenant
  @SubscribeMessage('unsubscribe:tenant')
  handleUnsubscribeFromTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tenantId } = data;

    if (!tenantId) {
      client.emit('error', { message: 'tenantId is required' });
      return;
    }

    client.leave(`tenant:${tenantId}`);

    // Remover del mapa de clientes conectados
    if (this.connectedClients.has(tenantId)) {
      this.connectedClients.get(tenantId)!.delete(client.id);
      if (this.connectedClients.get(tenantId)!.size === 0) {
        this.connectedClients.delete(tenantId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from tenant ${tenantId}`);
    client.emit('unsubscribed', { tenantId });
  }

  // Permite a los clientes suscribirse a eventos de un calendario específico
  @SubscribeMessage('subscribe:calendar')
  handleSubscribeToCalendar(
    @MessageBody() data: { calendarId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { calendarId } = data;

    if (!calendarId) {
      client.emit('error', { message: 'calendarId is required' });
      return;
    }

    client.join(`calendar:${calendarId}`);
    this.logger.log(`Client ${client.id} subscribed to calendar ${calendarId}`);
    client.emit('subscribed', { calendarId });
  }

  // Permite a los clientes desuscribirse de eventos de un calendario
  @SubscribeMessage('unsubscribe:calendar')
  handleUnsubscribeFromCalendar(
    @MessageBody() data: { calendarId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { calendarId } = data;

    if (!calendarId) {
      client.emit('error', { message: 'calendarId is required' });
      return;
    }

    client.leave(`calendar:${calendarId}`);
    this.logger.log(`Client ${client.id} unsubscribed from calendar ${calendarId}`);
    client.emit('unsubscribed', { calendarId });
  }

  // Implementación de IAppointmentEventEmitter

  emitAppointmentCreated(appointment: AppointmentEntity): void {
    const payload: AppointmentEventPayload = {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      calendarId: appointment.calendarId,
      clientId: appointment.clientId,
      eventType: AppointmentEventType.CREATED,
      timestamp: new Date(),
      data: appointment,
    };

    // Emitir a todos los clientes suscritos al tenant
    this.server.to(`tenant:${appointment.tenantId}`).emit('appointment:created', payload);

    // Emitir también al calendario específico
    this.server.to(`calendar:${appointment.calendarId}`).emit('appointment:created', payload);

    this.logger.debug(`Emitted appointment:created for ${appointment.id}`);
  }

  emitAppointmentUpdated(appointment: AppointmentEntity, changes?: any): void {
    const payload: AppointmentEventPayload = {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      calendarId: appointment.calendarId,
      clientId: appointment.clientId,
      eventType: AppointmentEventType.UPDATED,
      timestamp: new Date(),
      data: appointment,
      changes: changes ? { newValue: changes } : undefined,
    };

    this.server.to(`tenant:${appointment.tenantId}`).emit('appointment:updated', payload);
    this.server.to(`calendar:${appointment.calendarId}`).emit('appointment:updated', payload);

    this.logger.debug(`Emitted appointment:updated for ${appointment.id}`);
  }

  emitAppointmentDeleted(appointment: AppointmentEntity): void {
    const payload: AppointmentEventPayload = {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      calendarId: appointment.calendarId,
      clientId: appointment.clientId,
      eventType: AppointmentEventType.DELETED,
      timestamp: new Date(),
      data: appointment,
    };

    this.server.to(`tenant:${appointment.tenantId}`).emit('appointment:deleted', payload);
    this.server.to(`calendar:${appointment.calendarId}`).emit('appointment:deleted', payload);

    this.logger.debug(`Emitted appointment:deleted for ${appointment.id}`);
  }

  emitStatusChanged(
    appointment: AppointmentEntity,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
  ): void {
    const payload: AppointmentEventPayload = {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      calendarId: appointment.calendarId,
      clientId: appointment.clientId,
      eventType: AppointmentEventType.STATUS_CHANGED,
      timestamp: new Date(),
      data: appointment,
      changes: {
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
      },
    };

    this.server.to(`tenant:${appointment.tenantId}`).emit('appointment:status_changed', payload);
    this.server.to(`calendar:${appointment.calendarId}`).emit('appointment:status_changed', payload);

    this.logger.debug(
      `Emitted appointment:status_changed for ${appointment.id}: ${oldStatus} -> ${newStatus}`,
    );
  }

  emitRescheduled(
    appointment: AppointmentEntity,
    oldStartTime: Date,
    oldEndTime: Date,
  ): void {
    const payload: AppointmentEventPayload = {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      calendarId: appointment.calendarId,
      clientId: appointment.clientId,
      eventType: AppointmentEventType.RESCHEDULED,
      timestamp: new Date(),
      data: appointment,
      changes: {
        oldValue: {
          startTime: oldStartTime,
          endTime: oldEndTime,
        },
        newValue: {
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        },
      },
    };

    this.server.to(`tenant:${appointment.tenantId}`).emit('appointment:rescheduled', payload);
    this.server.to(`calendar:${appointment.calendarId}`).emit('appointment:rescheduled', payload);

    this.logger.debug(`Emitted appointment:rescheduled for ${appointment.id}`);
  }

  // Método adicional para enviar recordatorios
  emitReminder(appointmentId: string, tenantId: string, clientId: string, minutesUntil: number): void {
    const payload = {
      appointmentId,
      tenantId,
      clientId,
      minutesUntilStart: minutesUntil,
      timestamp: new Date(),
    };

    this.server.to(`tenant:${tenantId}`).emit('appointment:reminder', payload);

    this.logger.debug(`Emitted appointment:reminder for ${appointmentId} (${minutesUntil} minutes)`);
  }

  // Método para obtener estadísticas de conexiones
  getConnectionStats() {
    const stats = {
      totalConnections: this.server.sockets.sockets.size,
      tenantConnections: Array.from(this.connectedClients.entries()).map(
        ([tenantId, clients]) => ({
          tenantId,
          clientCount: clients.size,
        }),
      ),
    };
    return stats;
  }
}

// /**
//  * Ejemplo de cliente WebSocket para el módulo de Appointments
//  *
//  * Este archivo muestra cómo conectarse y usar los eventos en tiempo real
//  * del sistema de citas.
//  *
//  * Para usar en tu aplicación frontend:
//  * npm install socket.io-client
//  */

// import { io, Socket } from 'socket.io-client';

// // Tipos TypeScript para los payloads
// interface AppointmentData {
//   id: string;
//   title: string;
//   description?: string;
//   startTime: Date;
//   endTime: Date;
//   status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
//   deposit?: number;
//   totalPrice?: number;
//   notes?: string;
//   designImages: string[];
//   tenantId: string;
//   calendarId: string;
//   clientId: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// interface AppointmentEventPayload {
//   appointmentId: string;
//   tenantId: string;
//   calendarId: string;
//   clientId: string;
//   eventType: string;
//   timestamp: Date;
//   data: AppointmentData;
//   changes?: {
//     oldValue?: any;
//     newValue?: any;
//     field?: string;
//   };
// }

// class AppointmentWebSocketClient {
//   private socket: Socket;
//   private tenantId: string;
//   private subscribedCalendars: Set<string> = new Set();

//   constructor(serverUrl: string, tenantId: string) {
//     this.tenantId = tenantId;

//     // Conectar al namespace de appointments
//     this.socket = io(`${serverUrl}/appointments`, {
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     this.setupConnectionHandlers();
//     this.setupEventHandlers();
//   }

//   private setupConnectionHandlers(): void {
//     this.socket.on('connect', () => {
//       console.log('✅ Connected to Appointment WebSocket');
//       console.log('Socket ID:', this.socket.id);

//       // Auto-suscribirse al tenant al conectar
//       this.subscribeToTenant(this.tenantId);
//     });

//     this.socket.on('disconnect', (reason) => {
//       console.log('❌ Disconnected from Appointment WebSocket:', reason);
//     });

//     this.socket.on('connect_error', (error) => {
//       console.error('❌ Connection error:', error.message);
//     });

//     this.socket.on('error', (error) => {
//       console.error('❌ Socket error:', error);
//     });

//     this.socket.on('subscribed', (data) => {
//       console.log('✅ Subscribed successfully:', data);
//     });

//     this.socket.on('unsubscribed', (data) => {
//       console.log('ℹ️  Unsubscribed:', data);
//     });
//   }

//   private setupEventHandlers(): void {
//     // Evento: Cita creada
//     this.socket.on('appointment:created', (payload: AppointmentEventPayload) => {
//       console.log('🆕 New appointment created:', payload.data.title);
//       this.onAppointmentCreated(payload);
//     });

//     // Evento: Cita actualizada
//     this.socket.on('appointment:updated', (payload: AppointmentEventPayload) => {
//       console.log('📝 Appointment updated:', payload.data.title);
//       this.onAppointmentUpdated(payload);
//     });

//     // Evento: Cita eliminada
//     this.socket.on('appointment:deleted', (payload: AppointmentEventPayload) => {
//       console.log('🗑️  Appointment deleted:', payload.appointmentId);
//       this.onAppointmentDeleted(payload);
//     });

//     // Evento: Estado cambiado
//     this.socket.on('appointment:status_changed', (payload: AppointmentEventPayload) => {
//       console.log(
//         `📊 Status changed: ${payload.changes?.oldValue} → ${payload.changes?.newValue}`,
//       );
//       this.onStatusChanged(payload);
//     });

//     // Evento: Cita reagendada
//     this.socket.on('appointment:rescheduled', (payload: AppointmentEventPayload) => {
//       console.log('📅 Appointment rescheduled:', payload.data.title);
//       this.onAppointmentRescheduled(payload);
//     });

//     // Evento: Recordatorio
//     this.socket.on('appointment:reminder', (payload: any) => {
//       console.log(
//         `⏰ Reminder: Appointment in ${payload.minutesUntilStart} minutes`,
//       );
//       this.onReminder(payload);
//     });
//   }

//   // Métodos de suscripción
//   subscribeToTenant(tenantId: string): void {
//     this.socket.emit('subscribe:tenant', { tenantId });
//   }

//   unsubscribeFromTenant(tenantId: string): void {
//     this.socket.emit('unsubscribe:tenant', { tenantId });
//   }

//   subscribeToCalendar(calendarId: string): void {
//     this.socket.emit('subscribe:calendar', { calendarId });
//     this.subscribedCalendars.add(calendarId);
//   }

//   unsubscribeFromCalendar(calendarId: string): void {
//     this.socket.emit('unsubscribe:calendar', { calendarId });
//     this.subscribedCalendars.delete(calendarId);
//   }

//   // Handlers de eventos (sobrescribir estos métodos en tu aplicación)
//   protected onAppointmentCreated(payload: AppointmentEventPayload): void {
//     // Implementar lógica en tu app
//     // Ejemplo: Agregar la cita al estado de Redux/Zustand
//     // dispatch(addAppointment(payload.data));
//   }

//   protected onAppointmentUpdated(payload: AppointmentEventPayload): void {
//     // Implementar lógica en tu app
//     // Ejemplo: Actualizar la cita en el estado
//     // dispatch(updateAppointment(payload.data));
//   }

//   protected onAppointmentDeleted(payload: AppointmentEventPayload): void {
//     // Implementar lógica en tu app
//     // Ejemplo: Remover la cita del estado
//     // dispatch(removeAppointment(payload.appointmentId));
//   }

//   protected onStatusChanged(payload: AppointmentEventPayload): void {
//     // Implementar lógica en tu app
//     // Ejemplo: Mostrar notificación
//     // toast.info(`Appointment ${payload.changes?.newValue}`);
//   }

//   protected onAppointmentRescheduled(payload: AppointmentEventPayload): void {
//     // Implementar lógica en tu app
//     // Ejemplo: Actualizar calendario visual
//     // calendar.updateEvent(payload.data);
//   }

//   protected onReminder(payload: any): void {
//     // Implementar lógica en tu app
//     // Ejemplo: Mostrar notificación push
//     // showNotification(`Appointment in ${payload.minutesUntilStart} minutes`);
//   }

//   // Desconectar
//   disconnect(): void {
//     this.subscribedCalendars.forEach((calendarId) => {
//       this.unsubscribeFromCalendar(calendarId);
//     });
//     this.unsubscribeFromTenant(this.tenantId);
//     this.socket.disconnect();
//   }
// }

// // =============================================================================
// // Ejemplo de uso en React
// // =============================================================================

// /*
// import { useEffect, useState } from 'react';

// function AppointmentCalendar() {
//   const [client, setClient] = useState<AppointmentWebSocketClient | null>(null);
//   const tenantId = 'your-tenant-id';

//   useEffect(() => {
//     // Crear cliente WebSocket
//     const wsClient = new AppointmentWebSocketClient(
//       'http://localhost:3000',
//       tenantId
//     );

//     // Sobrescribir handlers para actualizar el estado de React
//     wsClient.onAppointmentCreated = (payload) => {
//       setAppointments(prev => [...prev, payload.data]);
//       toast.success('New appointment created!');
//     };

//     wsClient.onAppointmentUpdated = (payload) => {
//       setAppointments(prev =>
//         prev.map(apt => apt.id === payload.appointmentId ? payload.data : apt)
//       );
//     };

//     wsClient.onAppointmentDeleted = (payload) => {
//       setAppointments(prev =>
//         prev.filter(apt => apt.id !== payload.appointmentId)
//       );
//       toast.info('Appointment deleted');
//     };

//     setClient(wsClient);

//     // Suscribirse a calendarios
//     wsClient.subscribeToCalendar('calendar-id-1');
//     wsClient.subscribeToCalendar('calendar-id-2');

//     // Cleanup al desmontar
//     return () => {
//       wsClient.disconnect();
//     };
//   }, [tenantId]);

//   return (
//     <div>
//       {appointments.map(appointment => (
//         <AppointmentCard key={appointment.id} appointment={appointment} />
//       ))}
//     </div>
//   );
// }
// */

// // =============================================================================
// // Ejemplo de uso en Vue.js
// // =============================================================================

// /*
// import { ref, onMounted, onUnmounted } from 'vue';

// export default {
//   setup() {
//     const appointments = ref([]);
//     let wsClient = null;

//     onMounted(() => {
//       wsClient = new AppointmentWebSocketClient(
//         'http://localhost:3000',
//         'tenant-id'
//       );

//       wsClient.onAppointmentCreated = (payload) => {
//         appointments.value.push(payload.data);
//       };

//       wsClient.onAppointmentUpdated = (payload) => {
//         const index = appointments.value.findIndex(
//           apt => apt.id === payload.appointmentId
//         );
//         if (index !== -1) {
//           appointments.value[index] = payload.data;
//         }
//       };

//       wsClient.subscribeToCalendar('calendar-id');
//     });

//     onUnmounted(() => {
//       wsClient?.disconnect();
//     });

//     return { appointments };
//   }
// };
// */

// // =============================================================================
// // Ejemplo de uso vanilla JavaScript
// // =============================================================================

// /*
// // Crear instancia del cliente
// const client = new AppointmentWebSocketClient(
//   'http://localhost:3000',
//   'my-tenant-id'
// );

// // Sobrescribir handlers
// client.onAppointmentCreated = (payload) => {
//   const appointmentList = document.getElementById('appointments');
//   const li = document.createElement('li');
//   li.textContent = payload.data.title;
//   li.id = `appointment-${payload.data.id}`;
//   appointmentList.appendChild(li);
// };

// client.onAppointmentDeleted = (payload) => {
//   const element = document.getElementById(`appointment-${payload.appointmentId}`);
//   element?.remove();
// };

// // Suscribirse a un calendario
// client.subscribeToCalendar('calendar-uuid');

// // Desconectar cuando sea necesario
// // client.disconnect();
// */

// export default AppointmentWebSocketClient;

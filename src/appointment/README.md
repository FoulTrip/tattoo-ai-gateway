# Appointment Module

Este módulo gestiona las citas (appointments) del sistema, incluyendo CRUD completo, validaciones de negocio, auditoría y eventos en tiempo real mediante WebSocket.

## Estructura del Módulo

```
appointment/
├── dto/                          # Data Transfer Objects con validaciones Swagger
│   ├── create-appointment.dto.ts
│   ├── update-appointment.dto.ts
│   ├── query-appointment.dto.ts
│   ├── appointment-response.dto.ts
│   └── paginated-appointments.dto.ts
├── entities/                     # Entidades del dominio
│   ├── appointment.entity.ts     # Entidad principal con lógica de negocio
│   └── appointment.mapper.ts     # Mapper entre Prisma y Entidad
├── interfaces/                   # Interfaces y contratos
│   ├── appointment-repository.interface.ts
│   ├── appointment-service.interface.ts
│   └── appointment-events.interface.ts
├── repositories/                 # Capa de acceso a datos
│   └── appointment.repository.ts # Implementación del patrón repositorio
├── services/                     # Lógica de negocio
│   └── appointment.service.ts    # Servicio principal
├── gateways/                     # WebSocket Gateways
│   └── appointment.gateway.ts    # Gateway para eventos en tiempo real
├── appointment.controller.ts     # Controlador REST con Swagger
├── appointment.module.ts         # Módulo principal
└── README.md                     # Esta documentación
```

## Características

### 1. CRUD Completo
- ✅ Crear citas con validación de conflictos
- ✅ Listar citas con filtros y paginación
- ✅ Obtener citas por calendario
- ✅ Obtener próximas citas de un tenant
- ✅ Actualizar citas
- ✅ Eliminar citas

### 2. Validaciones de Negocio
- Validación de que el tenant existe
- Validación de que el calendar pertenece al tenant
- Validación de que el cliente es de tipo CLIENTE
- Validación de fechas (startTime < endTime)
- Detección de conflictos de horario
- Prevención de solapamiento de citas

### 3. Auditoría Completa
Todas las operaciones quedan registradas en el sistema de auditoría:
- `APPOINTMENT_CREATED`
- `APPOINTMENT_UPDATED`
- `APPOINTMENT_CANCELLED`
- `APPOINTMENT_CONFIRMED`
- `APPOINTMENT_COMPLETED`
- `APPOINTMENT_RESCHEDULED`

### 4. Eventos WebSocket en Tiempo Real

El módulo emite eventos WebSocket para mantener a los clientes actualizados en tiempo real.

## API REST Endpoints

### POST /appointments
Crea una nueva cita.

**Request Body:**
```json
{
  "title": "Dragon Tattoo Session",
  "description": "Full back dragon tattoo, first session",
  "startTime": "2025-11-01T10:00:00Z",
  "endTime": "2025-11-01T14:00:00Z",
  "status": "PENDING",
  "deposit": 100.0,
  "totalPrice": 500.0,
  "notes": "Client prefers afternoon sessions",
  "designImages": ["https://example.com/design1.jpg"],
  "tenantId": "uuid",
  "calendarId": "uuid",
  "clientId": "uuid"
}
```

### GET /appointments
Lista todas las citas con filtros opcionales.

**Query Parameters:**
- `tenantId`: Filtrar por tenant
- `calendarId`: Filtrar por calendario
- `clientId`: Filtrar por cliente
- `status`: Filtrar por estado (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- `startDate`: Fecha de inicio del rango
- `endDate`: Fecha de fin del rango
- `search`: Búsqueda por título o descripción
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)

### GET /appointments/:id
Obtiene una cita específica con toda su información relacionada.

### GET /appointments/calendar/:calendarId
Obtiene todas las citas de un calendario específico.

**Query Parameters:**
- `startDate`: Fecha de inicio (opcional)
- `endDate`: Fecha de fin (opcional)

### GET /appointments/tenant/:tenantId/upcoming
Obtiene las próximas citas de un tenant.

**Query Parameters:**
- `limit`: Número máximo de citas a retornar (default: 10)

### PATCH /appointments/:id
Actualiza una cita existente.

**Request Body:** (todos los campos opcionales)
```json
{
  "title": "Updated Title",
  "status": "CONFIRMED",
  "startTime": "2025-11-01T11:00:00Z",
  "endTime": "2025-11-01T15:00:00Z"
}
```

### DELETE /appointments/:id
Elimina una cita permanentemente.

## WebSocket Events

### Namespace
```
/appointments
```

### Conexión al WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/appointments');
```

### Suscripción a Eventos

#### Suscribirse a eventos de un Tenant
```javascript
socket.emit('subscribe:tenant', { tenantId: 'uuid' });

// Respuesta
socket.on('subscribed', (data) => {
  console.log('Subscribed to tenant:', data.tenantId);
});
```

#### Suscribirse a eventos de un Calendario
```javascript
socket.emit('subscribe:calendar', { calendarId: 'uuid' });

socket.on('subscribed', (data) => {
  console.log('Subscribed to calendar:', data.calendarId);
});
```

#### Desuscribirse
```javascript
socket.emit('unsubscribe:tenant', { tenantId: 'uuid' });
socket.emit('unsubscribe:calendar', { calendarId: 'uuid' });
```

### Eventos Emitidos por el Servidor

#### 1. appointment:created
Se emite cuando se crea una nueva cita.

```javascript
socket.on('appointment:created', (payload) => {
  console.log('New appointment:', payload);
  /*
  {
    appointmentId: "uuid",
    tenantId: "uuid",
    calendarId: "uuid",
    clientId: "uuid",
    eventType: "appointment.created",
    timestamp: "2025-10-15T...",
    data: { ...appointmentData }
  }
  */
});
```

#### 2. appointment:updated
Se emite cuando se actualiza una cita.

```javascript
socket.on('appointment:updated', (payload) => {
  console.log('Appointment updated:', payload);
  /*
  {
    appointmentId: "uuid",
    tenantId: "uuid",
    calendarId: "uuid",
    clientId: "uuid",
    eventType: "appointment.updated",
    timestamp: "2025-10-15T...",
    data: { ...updatedAppointment },
    changes: { newValue: { ...changes } }
  }
  */
});
```

#### 3. appointment:deleted
Se emite cuando se elimina una cita.

```javascript
socket.on('appointment:deleted', (payload) => {
  console.log('Appointment deleted:', payload);
});
```

#### 4. appointment:status_changed
Se emite cuando cambia el estado de una cita (PENDING → CONFIRMED, etc.).

```javascript
socket.on('appointment:status_changed', (payload) => {
  console.log('Status changed:', payload);
  /*
  {
    ...standardFields,
    changes: {
      field: "status",
      oldValue: "PENDING",
      newValue: "CONFIRMED"
    }
  }
  */
});
```

#### 5. appointment:rescheduled
Se emite cuando se reagenda una cita (cambio de fecha/hora).

```javascript
socket.on('appointment:rescheduled', (payload) => {
  console.log('Appointment rescheduled:', payload);
  /*
  {
    ...standardFields,
    changes: {
      oldValue: {
        startTime: "2025-11-01T10:00:00Z",
        endTime: "2025-11-01T14:00:00Z"
      },
      newValue: {
        startTime: "2025-11-02T10:00:00Z",
        endTime: "2025-11-02T14:00:00Z"
      }
    }
  }
  */
});
```

#### 6. appointment:reminder
Se emite para recordatorios programados.

```javascript
socket.on('appointment:reminder', (payload) => {
  console.log('Appointment reminder:', payload);
  /*
  {
    appointmentId: "uuid",
    tenantId: "uuid",
    clientId: "uuid",
    minutesUntilStart: 60,
    timestamp: "2025-10-15T..."
  }
  */
});
```

## Ejemplo de Integración Cliente

Para ver un ejemplo completo de cliente WebSocket en TypeScript, consulta: [websocket-client-example.ts](../../docs/websocket-client-example.ts)

```javascript
import { io } from 'socket.io-client';

class AppointmentClient {
  constructor(tenantId) {
    this.socket = io('http://localhost:3000/appointments');
    this.tenantId = tenantId;

    this.socket.on('connect', () => {
      console.log('Connected to appointments service');
      this.socket.emit('subscribe:tenant', { tenantId: this.tenantId });
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('appointment:created', (payload) => {
      // Actualizar UI con la nueva cita
      this.onAppointmentCreated(payload.data);
    });

    this.socket.on('appointment:updated', (payload) => {
      // Actualizar UI con los cambios
      this.onAppointmentUpdated(payload.data);
    });

    this.socket.on('appointment:status_changed', (payload) => {
      // Mostrar notificación de cambio de estado
      this.showNotification(`Appointment ${payload.changes.newValue}`);
    });

    this.socket.on('appointment:rescheduled', (payload) => {
      // Actualizar calendario visual
      this.updateCalendarView(payload.data);
    });

    this.socket.on('appointment:deleted', (payload) => {
      // Remover cita del UI
      this.removeAppointmentFromUI(payload.appointmentId);
    });
  }

  subscribeToCalendar(calendarId) {
    this.socket.emit('subscribe:calendar', { calendarId });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Uso
const client = new AppointmentClient('my-tenant-id');
client.subscribeToCalendar('my-calendar-id');
```

## Métodos de la Entidad Appointment

La entidad `AppointmentEntity` incluye métodos útiles de negocio:

```typescript
const appointment = new AppointmentEntity(data);

appointment.isUpcoming()           // ¿Es una cita futura?
appointment.isPast()               // ¿Ya pasó la cita?
appointment.isActive()             // ¿Está ocurriendo ahora?
appointment.canBeCancelled()       // ¿Se puede cancelar?
appointment.canBeRescheduled()     // ¿Se puede reagendar?
appointment.getDuration()          // Duración en milisegundos
appointment.getDurationInMinutes() // Duración en minutos
appointment.hasConflictWith(other) // ¿Hay conflicto con otra cita?
```

## Notas Importantes

1. **Autenticación JWT**: Actualmente el `actorId` es temporal. Se debe implementar la extracción del usuario autenticado desde el token JWT.

2. **Permisos**: Se recomienda agregar guards para verificar que:
   - Los tatuadores solo puedan gestionar citas de su tenant
   - Los clientes solo puedan ver sus propias citas
   - Solo el tenant owner pueda eliminar citas

3. **Recordatorios**: El evento `appointment:reminder` está disponible pero requiere implementar un job scheduler (e.g., Bull, node-cron) para enviar recordatorios automáticos.

4. **CORS**: En producción, configurar adecuadamente los orígenes permitidos en el WebSocket Gateway.

5. **Escalabilidad**: Para múltiples instancias del servidor, considerar usar Redis Adapter para Socket.io.

## Dependencias

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`
- `class-validator`
- `class-transformer`

## Testing

Ejemplo de test para el servicio:

```typescript
describe('AppointmentService', () => {
  it('should create an appointment', async () => {
    const dto = {
      title: 'Test Appointment',
      startTime: '2025-11-01T10:00:00Z',
      endTime: '2025-11-01T11:00:00Z',
      tenantId: 'uuid',
      calendarId: 'uuid',
      clientId: 'uuid',
    };

    const appointment = await service.create(dto, 'actor-id');
    expect(appointment.id).toBeDefined();
  });
});
```

## Roadmap

- [ ] Implementar sistema de recordatorios automáticos
- [ ] Agregar soporte para citas recurrentes
- [ ] Implementar bloqueo de horarios (time blocks)
- [ ] Agregar sistema de reservas con confirmación
- [ ] Implementar lista de espera
- [ ] Agregar integración con calendarios externos (Google Calendar, iCal)

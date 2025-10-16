# Flujo de Creación de Usuarios

Este documento explica el flujo automatizado de creación de usuarios, tenants y calendarios en el sistema.

## Resumen

Al crear un nuevo usuario, el sistema automáticamente crea los recursos necesarios según el tipo de usuario:

- **TATUADOR**: Se crea un Tenant + Calendar por defecto
- **CLIENTE**: El usuario puede agendar citas en los tenants de los tatuadores

## Flujo para Usuario TATUADOR

### 1. Creación del Usuario

```http
POST /users
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "userType": "TATUADOR"
}
```

### 2. Recursos Creados Automáticamente

#### a) Usuario TATUADOR
```json
{
  "id": "user-uuid",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "userType": "TATUADOR",
  "phone": "+1234567890"
}
```

#### b) Tenant (Estudio)
El sistema crea automáticamente un tenant con:
- **Nombre**: `{nombre del usuario} Studio`
- **Email**: Email del usuario
- **Phone**: Teléfono del usuario
- **OwnerId**: ID del usuario creado

```json
{
  "id": "tenant-uuid",
  "name": "Juan Pérez Studio",
  "email": "juan@example.com",
  "phone": "+1234567890",
  "ownerId": "user-uuid"
}
```

#### c) Calendar (Calendario Principal)
El sistema crea automáticamente un calendario por defecto con:
- **Nombre**: "Main Calendar"
- **Descripción**: "Default calendar for appointments"
- **Color**: "#3B82F6" (Azul)
- **isDefault**: true
- **TenantId**: ID del tenant creado

```json
{
  "id": "calendar-uuid",
  "name": "Main Calendar",
  "description": "Default calendar for appointments",
  "color": "#3B82F6",
  "isDefault": true,
  "tenantId": "tenant-uuid"
}
```

### 3. Respuesta del API

```json
{
  "id": "user-uuid",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+1234567890",
  "userType": "TATUADOR",
  "createdAt": "2025-10-15T08:00:00.000Z",
  "updatedAt": "2025-10-15T08:00:00.000Z",
  "tenant": {
    "id": "tenant-uuid",
    "name": "Juan Pérez Studio",
    "email": "juan@example.com"
  },
  "calendar": {
    "id": "calendar-uuid",
    "name": "Main Calendar",
    "color": "#3B82F6",
    "isDefault": true
  }
}
```

### 4. Auditoría Generada

El sistema registra 3 eventos de auditoría:

1. **USER_CREATED**: Registro de creación del usuario
2. **TENANT_CREATED**: Registro de creación del tenant
3. **CALENDAR_CREATED**: Registro de creación del calendar

## Flujo para Usuario CLIENTE

### 1. Creación del Usuario

```http
POST /users
Content-Type: application/json

{
  "name": "María González",
  "email": "maria@example.com",
  "password": "securePassword123",
  "phone": "+0987654321",
  "userType": "CLIENTE"
}
```

### 2. Recursos Creados

Para usuarios CLIENTE, solo se crea el usuario. No se crea un tenant ni un calendario personal.

**Razón**: Los clientes agendarán citas en los calendarios de los tatuadores (tenants), por lo que no necesitan su propio tenant ni calendario.

### 3. Respuesta del API

```json
{
  "id": "user-uuid",
  "name": "María González",
  "email": "maria@example.com",
  "phone": "+0987654321",
  "userType": "CLIENTE",
  "createdAt": "2025-10-15T08:00:00.000Z",
  "updatedAt": "2025-10-15T08:00:00.000Z"
}
```

### 4. Auditoría Generada

El sistema registra 1 evento de auditoría:

1. **USER_CREATED**: Registro de creación del usuario

## Casos de Uso

### Caso 1: Tatuador quiere agendar citas

```javascript
// 1. El tatuador se registra
const tatuador = await POST('/users', {
  name: 'Carlos Tattoo',
  userType: 'TATUADOR',
  // ...
});

// 2. El sistema crea automáticamente:
// - Tenant: "Carlos Tattoo Studio"
// - Calendar: "Main Calendar"

// 3. El tatuador puede compartir su tenantId y calendarId con clientes
const tenantId = tatuador.tenant.id;
const calendarId = tatuador.calendar.id;

// 4. Los clientes pueden agendar citas usando estos IDs
await POST('/appointments', {
  tenantId: tenantId,
  calendarId: calendarId,
  clientId: clienteId,
  title: 'Dragon Tattoo',
  startTime: '2025-11-01T10:00:00Z',
  endTime: '2025-11-01T14:00:00Z',
});
```

### Caso 2: Tatuador con múltiples calendarios

```javascript
// 1. El tatuador ya tiene su calendar por defecto
const mainCalendar = tatuador.calendar;

// 2. Puede crear calendarios adicionales para diferentes propósitos
await POST('/calendars', {
  tenantId: tatuador.tenant.id,
  name: 'Color Tattoos Calendar',
  color: '#EF4444',
  isDefault: false,
});

await POST('/calendars', {
  tenantId: tatuador.tenant.id,
  name: 'Black & White Calendar',
  color: '#000000',
  isDefault: false,
});
```

### Caso 3: Cliente agenda cita

```javascript
// 1. El cliente se registra
const cliente = await POST('/users', {
  name: 'Ana Cliente',
  userType: 'CLIENTE',
  // ...
});

// 2. El cliente busca tatuadores y obtiene sus datos
const tatuadores = await GET('/users?userType=TATUADOR');

// 3. El cliente selecciona un tatuador y obtiene sus calendarios
const calendarios = await GET(`/calendars?tenantId=${tatuador.tenant.id}`);

// 4. El cliente agenda una cita
await POST('/appointments', {
  tenantId: tatuador.tenant.id,
  calendarId: calendarios[0].id,
  clientId: cliente.id,
  title: 'Consulta inicial',
  startTime: '2025-11-01T10:00:00Z',
  endTime: '2025-11-01T11:00:00Z',
});
```

## Ventajas de Este Flujo

1. **Automatización**: No requiere pasos manuales adicionales después del registro
2. **Consistencia**: Todos los tatuadores tienen la misma estructura inicial
3. **Auditoría**: Todas las creaciones quedan registradas
4. **Escalabilidad**: Los tatuadores pueden crear calendarios adicionales después
5. **Simplicidad para clientes**: Los clientes solo necesitan un usuario, no un tenant

## Configuración Adicional (Opcional)

### Crear Calendar Personal para Clientes

Si en el futuro se requiere que los clientes tengan su propio calendario personal, descomentar el código en [user.service.ts:117-152](../src/user/user.service.ts#L117-L152):

```typescript
if (user.userType === UserType.CLIENTE) {
  createdCalendar = await this.prisma.calendar.create({
    data: {
      name: `${user.name}'s Calendar`,
      description: 'Personal calendar',
      color: '#10B981', // Green
      isDefault: true,
      tenantId: null, // Sin tenant, es personal
    },
  });
  // ... auditoría
}
```

## Personalización del Tenant

Los tatuadores pueden personalizar su tenant después de la creación:

```http
PATCH /tenants/{tenantId}
Content-Type: application/json

{
  "name": "Custom Studio Name",
  "description": "Professional tattoo studio",
  "address": "123 Main St, City",
  "logo": "https://example.com/logo.jpg"
}
```

## Personalización del Calendar

Los tatuadores pueden personalizar su calendario:

```http
PATCH /calendars/{calendarId}
Content-Type: application/json

{
  "name": "Appointments 2025",
  "color": "#10B981",
  "description": "Main appointment calendar"
}
```

## Diagrama de Flujo

```
Usuario TATUADOR
    │
    ├─> Crear User
    │       │
    │       ├─> Hash Password
    │       └─> Guardar en DB
    │
    ├─> Crear Tenant
    │       │
    │       ├─> name: "{user.name} Studio"
    │       ├─> ownerId: user.id
    │       └─> Auditar (TENANT_CREATED)
    │
    ├─> Crear Calendar
    │       │
    │       ├─> name: "Main Calendar"
    │       ├─> tenantId: tenant.id
    │       ├─> isDefault: true
    │       └─> Auditar (CALENDAR_CREATED)
    │
    └─> Respuesta con User + Tenant + Calendar


Usuario CLIENTE
    │
    ├─> Crear User
    │       │
    │       ├─> Hash Password
    │       └─> Guardar en DB
    │
    └─> Respuesta con User
```

## Logs Generados

### Para TATUADOR:

```
[UsersService] Creating user with email: juan@example.com
[UsersService] Tenant created for TATUADOR: user-uuid
[UsersService] Calendar created for Tenant: tenant-uuid
[UsersService] User created successfully: user-uuid
```

### Para CLIENTE:

```
[UsersService] Creating user with email: maria@example.com
[UsersService] User created successfully: user-uuid
```

## Consideraciones de Seguridad

1. **Password Hashing**: Las contraseñas se hashean con bcrypt (10 rounds)
2. **Email Único**: El sistema valida que no existan emails duplicados
3. **Auditoría Completa**: Todas las acciones quedan registradas
4. **Tenant Ownership**: Solo el owner puede modificar el tenant
5. **Calendar Permissions**: Solo usuarios del tenant pueden ver/modificar calendarios

## Testing

### Test de Creación de TATUADOR

```typescript
describe('User Creation - TATUADOR', () => {
  it('should create user, tenant and calendar', async () => {
    const dto = {
      name: 'Test Tattoo Artist',
      email: 'artist@test.com',
      password: 'password123',
      userType: 'TATUADOR',
    };

    const response = await userService.create(dto);

    expect(response.id).toBeDefined();
    expect(response.tenant).toBeDefined();
    expect(response.tenant.name).toBe('Test Tattoo Artist Studio');
    expect(response.calendar).toBeDefined();
    expect(response.calendar.name).toBe('Main Calendar');
    expect(response.calendar.isDefault).toBe(true);
  });
});
```

### Test de Creación de CLIENTE

```typescript
describe('User Creation - CLIENTE', () => {
  it('should create only user', async () => {
    const dto = {
      name: 'Test Client',
      email: 'client@test.com',
      password: 'password123',
      userType: 'CLIENTE',
    };

    const response = await userService.create(dto);

    expect(response.id).toBeDefined();
    expect(response.tenant).toBeUndefined();
    expect(response.calendar).toBeUndefined();
  });
});
```

## Endpoints Relacionados

- `POST /users` - Crear usuario (con creación automática)
- `GET /users/:id` - Obtener usuario
- `GET /users/:id/details` - Obtener usuario con relaciones (tenant, calendars, appointments)
- `PATCH /tenants/:id` - Actualizar tenant
- `GET /calendars?tenantId=xxx` - Listar calendarios de un tenant
- `POST /calendars` - Crear calendario adicional
- `POST /appointments` - Crear cita en un calendario

## Próximas Mejoras

- [ ] Agregar templates de tenant personalizables
- [ ] Permitir múltiples calendarios por defecto
- [ ] Agregar roles y permisos granulares
- [ ] Implementar invitaciones a tenant para colaboradores
- [ ] Agregar configuración de horarios disponibles por calendar

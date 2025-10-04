# Sistema de Gestión de Tatuajes - Schema Prisma MongoDB

Este documento explica la estructura de la base de datos para un sistema de gestión de estudios de tatuajes con dos tipos de usuarios: tatuadores y clientes.

## 📋 Índice

- [Visión General](#visión-general)
- [Modelos](#modelos)
- [Relaciones](#relaciones)
- [Casos de Uso](#casos-de-uso)

## 🎯 Visión General

El sistema permite:

- **Tatuadores**: Crear y gestionar sus propios estudios (tenants), unirse a otros estudios, publicar diseños, gestionar calendarios y citas
- **Clientes**: Agendar citas con tatuadores, ver portfolios públicos de diseños

### Características Principales

- Todos los IDs usan UUID para identificación única
- Sistema multi-tenant con roles
- Gestión de invitaciones entre tatuadores
- Portfolios públicos/privados de diseños
- Sistema completo de citas y calendarios

## 📦 Modelos

### User (Usuario)

Modelo central que representa tanto a tatuadores como a clientes.

**Campos principales:**
- `id`: UUID único (primary key)
- `email`: Email único del usuario
- `name`: Nombre completo
- `userType`: Enum que define si es `TATUADOR` o `CLIENTE`
- `phone`, `avatar`: Datos opcionales de contacto y perfil

**Relaciones:**
- Un tatuador puede **poseer un Tenant** (relación 1:1)
- Un tatuador puede ser **miembro de múltiples Tenants** (relación N:N)
- Un cliente puede tener **múltiples citas** (relación 1:N)

### Tenant (Estudio/Espacio del Tatuador)

Representa el estudio o espacio de trabajo de un tatuador.

**Campos principales:**
- `id`: UUID único
- `name`: Nombre del estudio
- `description`, `address`, `phone`, `email`: Información de contacto
- `logo`: URL del logo del estudio
- `invitationEnabled`: Si acepta nuevos miembros por invitación
- `requireApproval`: Si requiere aprobación manual de invitaciones

**Relaciones:**
- **Dueño único** (User de tipo TATUADOR)
- **Múltiples miembros** (otros tatuadores)
- **Colecciones de diseños**
- **Calendarios**
- **Citas**
- **Invitaciones pendientes**

### TenantMember (Membresía)

Tabla intermedia que conecta tatuadores con tenants donde son miembros (no dueños).

**Campos principales:**
- `id`: UUID único
- `role`: Rol dentro del tenant (`artist`, `manager`, `assistant`)
- `isActive`: Si la membresía está activa
- `joinedAt`: Fecha de ingreso al tenant

**Características:**
- Un tatuador puede ser miembro de múltiples tenants
- Un tenant puede tener múltiples miembros
- Constraint único: un usuario solo puede tener una membresía por tenant

### TenantInvitation (Invitación)

Gestiona las invitaciones enviadas por un tenant a otros tatuadores.

**Campos principales:**
- `id`: UUID único
- `email`: Email del tatuador invitado
- `role`: Rol ofrecido
- `status`: Estado de la invitación (`PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`)
- `token`: Token único para validar la invitación
- `expiresAt`: Fecha de expiración

**Flujo:**
1. El dueño del tenant envía invitación con email
2. Se genera token único
3. El tatuador invitado acepta/rechaza
4. Si acepta, se crea un TenantMember

### DesignCollection (Colección de Diseños)

Agrupa diseños en colecciones temáticas dentro de un tenant.

**Campos principales:**
- `id`: UUID único
- `name`: Nombre de la colección
- `description`: Descripción de la colección
- `coverImage`: Imagen de portada
- `visibility`: `PUBLIC` o `PRIVATE`
- `order`: Orden de visualización

**Características:**
- Cada colección pertenece a un tenant
- Puede contener múltiples diseños
- La visibilidad es independiente de los diseños individuales

### Design (Diseño)

Representa un diseño de tatuaje individual.

**Campos principales:**
- `id`: UUID único
- `title`: Título del diseño
- `description`: Descripción detallada
- `images`: Array de URLs de imágenes
- `tags`: Array de etiquetas para búsqueda
- `style`: Estilo del tatuaje (realismo, tradicional, minimalista, etc.)
- `bodyPart`: Parte del cuerpo sugerida
- `size`: Tamaño estimado (pequeño, mediano, grande)
- `duration`: Duración estimada en minutos
- `price`: Precio estimado
- `visibility`: `PUBLIC` o `PRIVATE`
- `order`: Orden dentro de la colección

**Características:**
- Pertenece a una colección
- Visibilidad independiente (un diseño puede ser privado en una colección pública)
- Metadata rica para mostrar en portfolios

### Calendar (Calendario)

Calendarios del tenant para organizar citas.

**Campos principales:**
- `id`: UUID único
- `name`: Nombre del calendario
- `description`: Descripción
- `color`: Color para visualización en UI
- `isDefault`: Si es el calendario predeterminado

**Características:**
- Un tenant puede tener múltiples calendarios
- Ejemplo: "Calendario Principal", "Calendario de Emergencias", por artista, etc.

### Appointment (Cita)

Representa una cita agendada entre un cliente y un tenant.

**Campos principales:**
- `id`: UUID único
- `title`: Título de la cita
- `description`: Descripción del trabajo a realizar
- `startTime`, `endTime`: Horario de la cita
- `status`: Estado (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`)
- `deposit`: Monto del depósito pagado
- `totalPrice`: Precio total del trabajo
- `notes`: Notas adicionales
- `designImages`: Referencias a diseños relacionados

**Relaciones:**
- Pertenece a un **Tenant**
- Asignada a un **Calendar**
- Solicitada por un **Cliente** (User)

### AuditLog (Registro de Auditoría)

Sistema de auditoría completo que registra todos los procesos críticos de la aplicación.

**Campos principales:**
- `id`: UUID único
- `action`: Tipo de acción (enum con 40+ acciones predefinidas)
- `severity`: Nivel de importancia (`INFO`, `WARNING`, `ERROR`, `CRITICAL`)
- `description`: Descripción detallada del evento

**Información del Actor (quién hizo la acción):**
- `actorId`: ID del usuario que ejecutó la acción
- `actorType`: Tipo de actor (`USER`, `SYSTEM`, `EXTERNAL_SERVICE`)
- `actorEmail`, `actorName`: Datos de referencia del actor

**Información del Recurso (qué fue afectado):**
- `resourceId`: ID del recurso modificado
- `resourceType`: Tipo de recurso (`USER`, `TENANT`, `APPOINTMENT`, etc.)
- `resourceName`: Nombre del recurso para referencia

**Contexto del Tenant:**
- `tenantId`: ID del tenant relacionado
- `tenantName`: Nombre del tenant

**Datos adicionales:**
- `metadata`: Objeto JSON con información adicional
- `oldValues`: Valores antes del cambio (para actualizaciones)
- `newValues`: Valores después del cambio

**Información de la solicitud:**
- `ipAddress`: IP de origen
- `userAgent`: Navegador/aplicación utilizada
- `endpoint`: API endpoint llamado
- `method`: Método HTTP

**Estado:**
- `success`: Si la operación fue exitosa
- `errorCode`, `errorMessage`: Información de errores
- `timestamp`: Momento exacto del evento

**Características:**
- Índices optimizados para búsquedas rápidas
- Almacena contexto completo de cada operación
- Permite auditorías de seguridad y compliance
- Útil para debugging y troubleshooting

**Acciones Cubiertas:**

1. **Usuarios**: Creación, actualización, login, cambio de contraseña, etc.
2. **Tenants**: Gestión completa de estudios
3. **Membresías**: Invitaciones, joins, cambios de rol
4. **Diseños**: CRUD de colecciones y diseños, cambios de visibilidad
5. **Citas**: Todo el ciclo de vida de una cita
6. **Pagos**: Depósitos, pagos completos, reembolsos
7. **Seguridad**: Intentos sospechosos, bloqueos, 2FA
8. **Sistema**: Errores, mantenimiento, backups

## 🔗 Relaciones

### Relación User - Tenant

```
User (TATUADOR) --[1:1 dueño]--> Tenant
User (TATUADOR) --[N:N miembro]--> Tenant (a través de TenantMember)
```

Un tatuador puede:
- Ser dueño de **UN** tenant
- Ser miembro de **VARIOS** tenants

### Relación Tenant - Diseños

```
Tenant --[1:N]--> DesignCollection --[1:N]--> Design
```

La visibilidad funciona en cascada pero es independiente:
- Colección PRIVATE → todos los diseños son privados (sin importar su configuración)
- Colección PUBLIC → los diseños pueden ser públicos o privados individualmente

### Relación Cliente - Citas

```
User (CLIENTE) --[1:N]--> Appointment --[N:1]--> Tenant
                                      --[N:1]--> Calendar
```

## 💡 Casos de Uso

### Caso 1: Tatuador crea su estudio

1. Usuario se registra con `userType: TATUADOR`
2. Crea un Tenant (se convierte en owner)
3. Crea colecciones y diseños
4. Configura calendarios

**Auditoría generada:**
```javascript
{
  action: "USER_CREATED",
  severity: "INFO",
  description: "Nuevo usuario registrado",
  actorId: userId,
  actorEmail: "juan@example.com",
  resourceType: "USER",
  metadata: { userType: "TATUADOR" }
}
// Luego...
{
  action: "TENANT_CREATED",
  severity: "INFO",
  description: "Estudio 'Ink Master' creado",
  actorId: userId,
  resourceType: "TENANT",
  resourceId: tenantId,
  tenantId: tenantId
}
```

### Caso 2: Tatuador invita a otro tatuador

1. Tatuador A (owner del Tenant) envía invitación con email de Tatuador B
2. Se crea TenantInvitation con token único
3. Tatuador B recibe invitación y acepta
4. Se crea TenantMember vinculando a Tatuador B con el Tenant

**Auditoría generada:**
```javascript
// Paso 1
{
  action: "INVITATION_SENT",
  severity: "INFO",
  actorId: tatuadorA_Id,
  resourceType: "INVITATION",
  resourceId: invitationId,
  tenantId: tenantId,
  metadata: { invitedEmail: "tatuadorB@example.com", role: "artist" }
}
// Paso 3
{
  action: "INVITATION_ACCEPTED",
  severity: "INFO",
  actorId: tatuadorB_Id,
  resourceType: "INVITATION",
  resourceId: invitationId,
  tenantId: tenantId
}
// Paso 4
{
  action: "MEMBER_JOINED",
  severity: "INFO",
  actorId: tatuadorB_Id,
  resourceType: "TENANT_MEMBER",
  tenantId: tenantId,
  metadata: { role: "artist" }
}
```

### Caso 3: Tatuador pertenece a múltiples estudios

```
Tatuador X
  ├── Owner de: "Estudio Ink Master" (Tenant A)
  ├── Miembro de: "Black Rose Tattoo" (Tenant B) - rol: artist
  └── Miembro de: "Urban Art Studio" (Tenant C) - rol: manager
```

### Caso 4: Cliente agenda cita

1. Cliente explora diseños públicos de un Tenant
2. Selecciona diseño y solicita cita
3. Se crea Appointment vinculada a:
   - El Tenant seleccionado
   - Un Calendar del tenant
   - El Cliente
4. Estado inicial: `PENDING`
5. Tatuador confirma: status → `CONFIRMED`

**Auditoría generada:**
```javascript
// Paso 3
{
  action: "APPOINTMENT_CREATED",
  severity: "INFO",
  actorId: clienteId,
  actorType: "USER",
  resourceType: "APPOINTMENT",
  resourceId: appointmentId,
  tenantId: tenantId,
  metadata: {
    startTime: "2025-10-15T14:00:00Z",
    designId: "uuid-design",
    deposit: 100
  }
}
// Paso 5
{
  action: "APPOINTMENT_CONFIRMED",
  severity: "INFO",
  actorId: tatuadorId,
  resourceType: "APPOINTMENT",
  resourceId: appointmentId,
  tenantId: tenantId,
  oldValues: { status: "PENDING" },
  newValues: { status: "CONFIRMED" }
}
```

### Caso 5: Gestión de visibilidad de diseños

**Portfolio público selectivo:**
```
Tenant: "Estudio XYZ"
  └── Collection: "Realismo" (PUBLIC)
      ├── Design: "Retrato 1" (PUBLIC) ✅ Visible
      ├── Design: "Retrato 2" (PRIVATE) ❌ No visible
      └── Design: "Retrato 3" (PUBLIC) ✅ Visible
  
  └── Collection: "Trabajos privados" (PRIVATE)
      ├── Design: "Cliente A" (PUBLIC) ❌ No visible (colección privada)
      └── Design: "Cliente B" (PUBLIC) ❌ No visible (colección privada)
```

**Auditoría generada:**
```javascript
{
  action: "COLLECTION_VISIBILITY_CHANGED",
  severity: "INFO",
  actorId: tatuadorId,
  resourceType: "COLLECTION",
  resourceId: collectionId,
  tenantId: tenantId,
  oldValues: { visibility: "PRIVATE" },
  newValues: { visibility: "PUBLIC" },
  metadata: { affectedDesigns: 15 }
}
```

### Caso 6: Intento de acceso sospechoso

Sistema detecta múltiples intentos de login fallidos.

**Auditoría generada:**
```javascript
{
  action: "SECURITY_SUSPICIOUS_LOGIN",
  severity: "WARNING",
  actorEmail: "usuario@example.com",
  resourceType: "USER",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  success: false,
  metadata: {
    failedAttempts: 5,
    timeWindow: "5 minutes"
  }
}
// Si continúa...
{
  action: "SECURITY_ACCOUNT_LOCKED",
  severity: "CRITICAL",
  actorType: "SYSTEM",
  resourceType: "USER",
  resourceId: userId,
  ipAddress: "192.168.1.100",
  metadata: {
    reason: "Multiple failed login attempts",
    lockDuration: "30 minutes"
  }
}
```

### Caso 7: Error en procesamiento de pago

**Auditoría generada:**
```javascript
{
  action: "PAYMENT_FAILED",
  severity: "ERROR",
  actorId: clienteId,
  resourceType: "APPOINTMENT",
  resourceId: appointmentId,
  tenantId: tenantId,
  success: false,
  errorCode: "INSUFFICIENT_FUNDS",
  errorMessage: "Payment gateway returned insufficient funds",
  metadata: {
    amount: 150,
    currency: "USD",
    paymentMethod: "credit_card"
  }
}
```

## 🔒 Reglas de Negocio

1. **Solo usuarios tipo TATUADOR pueden:**
   - Crear tenants
   - Ser miembros de tenants
   - Recibir invitaciones

2. **Solo usuarios tipo CLIENTE pueden:**
   - Agendar citas

3. **Un tatuador:**
   - Puede ser dueño de máximo UN tenant
   - Puede ser miembro de MÚLTIPLES tenants
   - No puede ser miembro de su propio tenant (ya es owner)

4. **Visibilidad:**
   - Si una colección es PRIVATE, todos sus diseños son privados
   - Si una colección es PUBLIC, cada diseño controla su propia visibilidad

5. **Eliminación en cascada:**
   - Si se elimina un User dueño → se elimina su Tenant y todo lo relacionado
   - Si se elimina un Tenant → se eliminan colecciones, diseños, calendarios, citas, membresías e invitaciones
   - Si se elimina un User miembro → se eliminan sus membresías pero no los tenants

6. **Auditoría obligatoria:**
   - Toda acción crítica debe generar un registro en AuditLog
   - Los logs no se eliminan, solo se archivan
   - Retención mínima recomendada: 1 año

## 🔍 Consultas Útiles de Auditoría

### Ver actividad reciente de un usuario
```javascript
await prisma.auditLog.findMany({
  where: { actorId: userId },
  orderBy: { timestamp: 'desc' },
  take: 50
})
```

### Ver todos los cambios en una cita específica
```javascript
await prisma.auditLog.findMany({
  where: {
    resourceType: 'APPOINTMENT',
    resourceId: appointmentId
  },
  orderBy: { timestamp: 'asc' }
})
```

### Detectar actividad sospechosa
```javascript
await prisma.auditLog.findMany({
  where: {
    severity: { in: ['WARNING', 'CRITICAL'] },
    action: { startsWith: 'SECURITY_' }
  },
  orderBy: { timestamp: 'desc' }
})
```

### Auditoría de un tenant específico
```javascript
await prisma.auditLog.findMany({
  where: { tenantId: tenantId },
  orderBy: { timestamp: 'desc' }
})
```

### Ver errores del sistema
```javascript
await prisma.auditLog.findMany({
  where: {
    success: false,
    severity: { in: ['ERROR', 'CRITICAL'] }
  },
  orderBy: { timestamp: 'desc' }
})
```

## 🚀 Configuración

### Instalación

```bash
npm install prisma @prisma/client
```

### Variables de entorno

```env
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/database"
```

### Generar cliente

```bash
npx prisma generate
```

### Sincronizar con base de datos

```bash
npx prisma db push
```

## 📝 Notas Técnicas

- Todos los IDs usan `uuid()` para compatibilidad y portabilidad
- Las relaciones usan `onDelete: Cascade` para mantener integridad referencial
- Los enums facilitan validación a nivel de base de datos
- Los arrays (`String[]`) son nativos de MongoDB para imágenes y tags
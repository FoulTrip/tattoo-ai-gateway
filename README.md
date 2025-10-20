# Tattoo AI Gateway

API Gateway para la plataforma de gestión de estudios de tatuajes con integración de IA.

## Descripción

Tattoo AI Gateway es una API REST construida con NestJS que proporciona servicios de autenticación, gestión de usuarios, administración de estudios de tatuajes (tenants), manejo de diseños y citas, además de integración con servicios externos de procesamiento de imágenes mediante IA. El sistema implementa una arquitectura multi-tenant que permite a tatuadores gestionar sus propios espacios de trabajo con miembros, portfolios y calendarios.

## Características Principales

### Arquitectura Multi-Tenant
- Sistema de tenants (estudios de tatuajes) con modelo propietario-miembros
- Gestión de invitaciones y roles (artist, manager, assistant)
- Configuración personalizada por tenant

### Gestión de Usuarios
- Dos tipos de usuarios: TATUADOR (artistas) y CLIENTE
- Autenticación JWT con tokens de acceso y refresco
- Cambio de contraseña y verificación de email
- Sistema completo de auditoría

### Portfolio y Diseños
- Colecciones organizadas de diseños
- Catálogo de tatuajes con imágenes, estilos, precios y metadatos
- Control de visibilidad (PUBLIC/PRIVATE)
- Tags, categorías y búsqueda

### Sistema de Citas
- Calendarios múltiples por tenant
- Estados de citas (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- Gestión de depósitos y precios
- Notas y referencias de diseño

### Procesamiento de Imágenes con IA
- Integración con backend externo para procesamiento de imágenes
- WebSockets (Socket.IO) para comunicación en tiempo real
- Upload de imágenes y visualización de resultados
- Sistema de jobs con seguimiento de progreso

### Auditoría Completa
- Registro detallado de todas las operaciones críticas
- Tracking de usuarios, recursos, IPs y metadata
- Niveles de severidad (INFO, WARNING, ERROR, CRITICAL)
- Más de 35 tipos de eventos auditables

## Tecnologías Utilizadas

### Backend
- **NestJS** - Framework Node.js progresivo
- **TypeScript** - Lenguaje de programación tipado
- **Prisma** - ORM moderno para MongoDB
- **MongoDB** - Base de datos NoSQL

### Autenticación y Seguridad
- **Passport.js** - Middleware de autenticación
- **JWT** - Tokens de autenticación
- **bcrypt** - Hashing de contraseñas
- **class-validator** - Validación de datos

### Comunicación en Tiempo Real
- **Socket.IO** - WebSockets para eventos en tiempo real
- **@nestjs/websockets** - Integración de WebSockets con NestJS

### Documentación y Validación
- **Swagger/OpenAPI** - Documentación automática de API
- **class-transformer** - Transformación de objetos

### DevOps
- **Docker** - Containerización multi-stage
- **ESLint** - Linter de código
- **Prettier** - Formateador de código
- **Jest** - Framework de testing

## Requisitos Previos

- Node.js >= 20.x
- npm >= 10.x
- MongoDB Atlas o instancia de MongoDB
- (Opcional) Docker para deployment

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd tattoo-ai-gateway
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# External Services
EXTERNAL_BACKEND_URL=http://localhost:8000

# Application
PORT=3000
```

**Nota de Seguridad:** Nunca commites el archivo `.env` al repositorio. Usa valores seguros en producción.

### 4. Generar cliente de Prisma

```bash
npx prisma generate
```

### 5. (Opcional) Ejecutar migraciones

```bash
npx prisma db push
```

## Ejecutar la Aplicación

### Modo desarrollo

```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

### Modo producción

```bash
npm run build
npm run start:prod
```

### Con Docker

```bash
# Construir imagen
docker build -t tattoo-ai-gateway .

# Ejecutar contenedor
docker run -p 8080:8080 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-secret" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e EXTERNAL_BACKEND_URL="http://external-service:8000" \
  tattoo-ai-gateway
```

## Documentación de la API

Una vez la aplicación esté corriendo, la documentación interactiva de Swagger estará disponible en:

```
http://localhost:3000/api
```

## Estructura del Proyecto

```
tattoo-ai-gateway/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos Prisma
├── src/
│   ├── app.module.ts          # Módulo principal de la aplicación
│   ├── main.ts                # Punto de entrada de la aplicación
│   ├── auth/                  # Módulo de autenticación
│   │   ├── auth.controller.ts # Endpoints: login, register, refresh, logout
│   │   ├── auth.service.ts    # Lógica de autenticación JWT
│   │   ├── guards/            # Guards de autenticación
│   │   └── dto/               # DTOs de autenticación
│   ├── user/                  # Módulo de usuarios
│   │   ├── user.controller.ts # CRUD de usuarios
│   │   ├── user.service.ts    # Lógica de negocio de usuarios
│   │   └── dto/               # DTOs de usuarios
│   ├── audit/                 # Módulo de auditoría
│   │   ├── audit.service.ts   # Servicio de logging de eventos
│   │   └── services/          # Servicios auxiliares de auditoría
│   ├── preview/               # Módulo de procesamiento de imágenes
│   │   ├── preview.controller.ts  # Upload de imágenes
│   │   ├── preview.service.ts     # Integración con backend externo
│   │   ├── preview.gateway.ts     # WebSocket gateway
│   │   ├── dto/               # DTOs de eventos y respuestas
│   │   └── interfaces/        # Interfaces de tipos
│   └── prisma/                # Módulo de Prisma
│       ├── prisma.module.ts   # Configuración de Prisma
│       └── prisma.service.ts  # Servicio de cliente Prisma
├── test/                      # Tests end-to-end
├── Dockerfile                 # Configuración Docker multi-stage
├── package.json               # Dependencias y scripts
└── tsconfig.json              # Configuración TypeScript
```

## Modelo de Datos

### Entidades Principales

#### User (Usuario)
- Tipos: TATUADOR o CLIENTE
- Campos: email, password, name, phone, avatar
- Relaciones: puede ser dueño de un tenant, miembro de múltiples tenants, tener citas

#### Tenant (Estudio de Tatuajes)
- Representa un estudio o espacio de trabajo
- Campos: name, description, address, logo, configuración
- Relaciones: owner, members, collections, calendars, appointments

#### TenantMember (Miembro del Tenant)
- Roles: artist, manager, assistant
- Estado activo/inactivo
- Relación many-to-many entre User y Tenant

#### TenantInvitation (Invitación)
- Estados: PENDING, ACCEPTED, REJECTED, EXPIRED
- Token único con fecha de expiración

#### DesignCollection (Colección de Diseños)
- Agrupación de diseños
- Visibilidad: PUBLIC o PRIVATE
- Orden personalizable

#### Design (Diseño)
- Portfolio de tatuajes
- Campos: title, images[], tags[], style, bodyPart, size, duration, price
- Metadata enriquecida para búsqueda

#### Calendar (Calendario)
- Calendarios múltiples por tenant
- Soporte para diferentes colores y propósitos

#### Appointment (Cita)
- Estados: PENDING, CONFIRMED, CANCELLED, COMPLETED
- Campos: fechas, precios, depósito, notas, imágenes de diseño
- Relaciones: tenant, calendar, client

#### AuditLog (Log de Auditoría)
- Registro completo de eventos del sistema
- Campos: action, severity, actor, resource, tenant, metadata
- Información de solicitud: IP, userAgent, endpoint

## API Endpoints

### Autenticación (`/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/refresh` | Refrescar tokens | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| POST | `/auth/change-password` | Cambiar contraseña | Sí |
| POST | `/auth/verify-email` | Verificar email | Sí |

### Usuarios (`/users`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Listar usuarios (paginado) | Sí |
| GET | `/users/statistics` | Estadísticas de usuarios | Sí |
| GET | `/users/:id` | Obtener usuario por ID | Sí |
| GET | `/users/:id/details` | Detalles con relaciones | Sí |
| PATCH | `/users/:id` | Actualizar usuario | Sí |
| DELETE | `/users/:id` | Eliminar usuario | Sí |

### Preview (Procesamiento de Imágenes) (`/preview`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/preview/process` | Procesar 2 imágenes con IA | Sí |
| POST | `/preview/webhook` | Webhook para resultados | No |

### WebSocket Events (`/preview` namespace)

**Cliente → Servidor:**
- `ping` - Verificar conexión
- `process-images` - Procesar imágenes vía WebSocket

**Servidor → Cliente:**
- `connected` - Confirmación de conexión
- `pong` - Respuesta a ping
- `processing:started` - Procesamiento iniciado
- `processing:progress` - Progreso del procesamiento
- `processing:completed` - Procesamiento completado
- `processing:error` - Error en procesamiento
- `error` - Error general

## Scripts Disponibles

```bash
# Desarrollo
npm run start          # Iniciar aplicación
npm run start:dev      # Modo watch (desarrollo)
npm run start:debug    # Modo debug

# Build
npm run build          # Compilar TypeScript

# Producción
npm run start:prod     # Ejecutar versión compilada

# Code Quality
npm run format         # Formatear código con Prettier
npm run lint           # Ejecutar ESLint
npm run lint:fix       # Corregir errores de ESLint

# Testing
npm run test           # Tests unitarios
npm run test:watch     # Tests en modo watch
npm run test:cov       # Cobertura de tests
npm run test:e2e       # Tests end-to-end
```

## Testing

### Tests Unitarios

```bash
npm run test
```

### Tests con Cobertura

```bash
npm run test:cov
```

### Tests End-to-End

```bash
npm run test:e2e
```

## Seguridad

### Medidas Implementadas

- Hashing de contraseñas con bcrypt (salt rounds: 10)
- Autenticación JWT con tokens de corta duración (1h)
- Refresh tokens para renovación segura (7d)
- Validación estricta de datos de entrada con class-validator
- Sanitización de campos con whitelist
- CORS habilitado con configuración personalizable
- Rate limiting en endpoints sensibles (recomendado en producción)
- Auditoría completa de acciones críticas

### Recomendaciones para Producción

1. Cambiar todos los secretos en variables de entorno
2. Implementar rate limiting
3. Configurar CORS específicamente para tus dominios
4. Habilitar HTTPS
5. Implementar refresh token rotation
6. Agregar helmet.js para headers de seguridad
7. Configurar logs en servicio externo
8. Implementar monitoreo y alertas

## Variables de Entorno

| Variable | Descripción | Requerida | Default |
|----------|-------------|-----------|---------|
| `MONGODB_URI` | URI de conexión a MongoDB | Sí | - |
| `JWT_SECRET` | Secreto para firmar tokens JWT | Sí | - |
| `JWT_EXPIRES_IN` | Duración del access token | No | `1h` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | Sí | - |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token | No | `7d` |
| `EXTERNAL_BACKEND_URL` | URL del servicio de procesamiento de imágenes | No | `http://localhost:8000` |
| `PORT` | Puerto de la aplicación | No | `3000` |

## Deployment

### Docker

El proyecto incluye un `Dockerfile` multi-stage optimizado:

- **Builder stage**: Compila la aplicación con todas las dependencias
- **Production stage**: Imagen final ligera solo con producción
- Usuario no-root para seguridad
- Health check incluido
- Ejecución automática de migraciones al inicio



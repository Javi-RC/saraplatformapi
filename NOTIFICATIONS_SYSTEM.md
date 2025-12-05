# Sistema de Notificaciones

Sistema flexible de notificaciones para la aplicación TFG Backend.

## Características

- **Múltiples canales de entrega**: In-App, Email, Push (preparado para futuras implementaciones)
- **Tipos de notificaciones extensibles**: Sistema, Autenticación, CV, Administrativas, etc.
- **Prioridades configurables**: Low, Medium, High, Urgent
- **Notificaciones masivas**: Envío a múltiples usuarios, roles específicos o todos los usuarios
- **Gestión completa**: Marcar como leído, archivar, eliminar
- **Estadísticas**: Conteo de no leídas, estadísticas por usuario
- **Expiración automática**: Notificaciones con tiempo de vida configurable
- **Preferencias de usuario**: Control individual de canales de notificación

## Arquitectura

El sistema sigue los principios SOLID:

- **Single Responsibility Principle (SRP)**: Cada clase tiene una responsabilidad única
- **Open/Closed Principle (OCP)**: Extensible para nuevos tipos y canales sin modificar código existente
- **Liskov Substitution Principle (LSP)**: Los canales son intercambiables
- **Interface Segregation Principle (ISP)**: Interfaces específicas para cada funcionalidad
- **Dependency Inversion Principle (DIP)**: Dependencias en abstracciones, no implementaciones concretas

### Componentes

1. **Modelo de Notificación** (`models/notification.model.js`)
   - Define la estructura de datos
   - Incluye métodos de instancia y estáticos
   - Maneja índices para optimizar consultas

2. **Canales de Notificación** (Strategy Pattern)
   - `NotificationChannel`: Clase base abstracta
   - `InAppChannel`: Notificaciones en la aplicación
   - `EmailChannel`: Notificaciones por correo electrónico
   - `PushChannel`: Placeholder para notificaciones push
   - `NotificationChannelFactory`: Factory para crear canales

3. **Servicio de Notificaciones** (`services/notification.service.js`)
   - Lógica de negocio centralizada
   - Gestión de creación y envío
   - Consultas y estadísticas

4. **Controlador** (`controllers/notification.controller.js`)
   - Manejo de peticiones HTTP
   - Validación de entrada
   - Respuestas estructuradas

5. **Validadores** (`utils/notificationValidator.js`)
   - Validación de datos de entrada
   - Middlewares reutilizables

## API Endpoints

### Endpoints de Usuario (Autenticados)

#### Obtener notificaciones
```http
GET /api/notifications
Authorization: Bearer {token}
Query Parameters:
  - page: número (default: 1)
  - limit: número (default: 20, max: 100)
  - status: pending | sent | delivered | read | failed
  - type: tipo de notificación
  - unreadOnly: boolean
  - includeArchived: boolean
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "...",
        "recipient": "...",
        "type": "cv_uploaded",
        "title": "CV Procesado",
        "message": "Tu CV ha sido procesado exitosamente",
        "status": "delivered",
        "priority": "medium",
        "channels": ["in_app", "email"],
        "readAt": null,
        "isArchived": false,
        "createdAt": "2025-12-05T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "Notificaciones obtenidas correctamente"
}
```

#### Obtener conteo de no leídas
```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "message": "Conteo obtenido correctamente"
}
```

#### Obtener estadísticas
```http
GET /api/notifications/stats
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "unread": 5,
    "read": 38,
    "failed": 2
  },
  "message": "Estadísticas obtenidas correctamente"
}
```

#### Marcar como leída
```http
PATCH /api/notifications/:id/read
Authorization: Bearer {token}
```

#### Marcar múltiples como leídas
```http
PATCH /api/notifications/read-multiple
Authorization: Bearer {token}
Content-Type: application/json

{
  "notificationIds": ["id1", "id2", "id3"]
}
```

#### Marcar todas como leídas
```http
PATCH /api/notifications/read-all
Authorization: Bearer {token}
```

#### Archivar notificación
```http
PATCH /api/notifications/:id/archive
Authorization: Bearer {token}
```

#### Eliminar notificación
```http
DELETE /api/notifications/:id
Authorization: Bearer {token}
```

### Endpoints Administrativos (Solo org_admin)

#### Crear notificación individual
```http
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "userId",
  "type": "system_update",
  "title": "Actualización del Sistema",
  "message": "El sistema será actualizado esta noche",
  "channels": ["in_app", "email"],
  "priority": "high",
  "actionUrl": "https://app.com/updates",
  "actionText": "Ver detalles",
  "metadata": {
    "version": "2.0.0"
  }
}
```

#### Enviar notificaciones masivas
```http
POST /api/notifications/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientIds": ["userId1", "userId2", "userId3"],
  "type": "admin_announcement",
  "title": "Anuncio importante",
  "message": "Habrá mantenimiento programado",
  "channels": ["in_app", "email"],
  "priority": "urgent"
}
```

#### Enviar a un rol específico
```http
POST /api/notifications/send-to-role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "employee",
  "type": "admin_announcement",
  "title": "Mensaje para empleados",
  "message": "Recordatorio para todos los empleados",
  "channels": ["in_app", "email"],
  "priority": "medium"
}
```

#### Enviar a todos los usuarios
```http
POST /api/notifications/send-to-all
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "system_update",
  "title": "Actualización general",
  "message": "Nuevas funcionalidades disponibles",
  "channels": ["in_app"],
  "priority": "low"
}
```

## Uso Programático

### Enviar una notificación desde el código

```javascript
const notificationService = require('./services/notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('./models/notification.model');

// Notificación simple
await notificationService.create({
  recipientId: userId,
  type: NotificationTypes.CV_UPLOADED,
  title: 'CV Subido',
  message: 'Tu CV ha sido subido exitosamente',
  channels: [NotificationChannels.IN_APP],
  priority: NotificationPriority.MEDIUM
});

// Notificación con acción
await notificationService.create({
  recipientId: userId,
  type: NotificationTypes.CV_ANALYSIS_READY,
  title: 'Análisis Completado',
  message: 'El análisis de tu CV está listo',
  channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
  priority: NotificationPriority.HIGH,
  actionUrl: '/dashboard/cv/analysis',
  actionText: 'Ver Análisis',
  metadata: {
    cvId: cvId,
    analysisId: analysisId
  }
});
```

### Notificaciones masivas

```javascript
// Enviar a múltiples usuarios
await notificationService.sendBulkNotifications(
  [userId1, userId2, userId3],
  {
    type: NotificationTypes.ADMIN_ANNOUNCEMENT,
    title: 'Anuncio',
    message: 'Mensaje importante',
    channels: [NotificationChannels.IN_APP]
  }
);

// Enviar a un rol
await notificationService.sendToRole('employee', {
  type: NotificationTypes.SYSTEM_UPDATE,
  title: 'Actualización',
  message: 'Nueva versión disponible',
  channels: [NotificationChannels.IN_APP]
});

// Enviar a todos
await notificationService.sendToAll({
  type: NotificationTypes.ADMIN_ANNOUNCEMENT,
  title: 'Mantenimiento',
  message: 'Mantenimiento programado',
  channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL]
});
```

## Tipos de Notificaciones

```javascript
NotificationTypes = {
  // Autenticación
  EMAIL_CONFIRMATION: 'email_confirmation',
  PASSWORD_RESET: 'password_reset',
  
  // Cuenta
  ACCOUNT_UPDATED: 'account_updated',
  ROLE_CHANGED: 'role_changed',
  
  // CV
  CV_UPLOADED: 'cv_uploaded',
  CV_PROCESSED: 'cv_processed',
  CV_ANALYSIS_READY: 'cv_analysis_ready',
  CV_ANALYSIS_FAILED: 'cv_analysis_failed',
  
  // Administrativas
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  SYSTEM_UPDATE: 'system_update',
  
  // Genéricas
  CUSTOM: 'custom'
}
```

## Prioridades

```javascript
NotificationPriority = {
  LOW: 'low',        // Información general
  MEDIUM: 'medium',  // Importante pero no urgente
  HIGH: 'high',      // Requiere atención pronto
  URGENT: 'urgent'   // Requiere atención inmediata
}
```

## Canales

```javascript
NotificationChannels = {
  IN_APP: 'in_app',  // Notificaciones en la aplicación
  EMAIL: 'email',    // Notificaciones por correo
  PUSH: 'push'       // Notificaciones push (futuro)
}
```

## Preferencias de Usuario

Los usuarios pueden configurar sus preferencias de notificación en su perfil:

```javascript
user.notificationPreferences = {
  email: true,   // Recibir notificaciones por email
  inApp: true,   // Recibir notificaciones in-app
  push: false    // Recibir notificaciones push (cuando esté disponible)
}
```

## Ejemplo de Integración con el Sistema de CV

```javascript
// En cv.service.js
const notificationService = require('./notification.service');
const { NotificationTypes, NotificationChannels } = require('../models/notification.model');

async function processCV(cvId, userId) {
  try {
    // Procesar CV...
    
    // Notificar éxito
    await notificationService.create({
      recipientId: userId,
      type: NotificationTypes.CV_PROCESSED,
      title: 'CV Procesado',
      message: 'Tu CV ha sido procesado y analizado exitosamente',
      channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
      actionUrl: `/cv/${cvId}`,
      actionText: 'Ver CV',
      metadata: { cvId }
    });
  } catch (error) {
    // Notificar error
    await notificationService.create({
      recipientId: userId,
      type: NotificationTypes.CV_ANALYSIS_FAILED,
      title: 'Error al Procesar CV',
      message: 'Hubo un problema al procesar tu CV. Por favor, intenta nuevamente.',
      channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
      priority: NotificationPriority.HIGH,
      metadata: { cvId, error: error.message }
    });
  }
}
```

## Limpieza de Notificaciones Antiguas

Se puede configurar un cron job para limpiar notificaciones archivadas antiguas:

```javascript
const notificationService = require('./services/notification.service');

// Eliminar notificaciones archivadas de más de 90 días
const deletedCount = await notificationService.cleanupOldNotifications(90);
console.log(`${deletedCount} notificaciones antiguas eliminadas`);
```

## Extensibilidad

### Agregar un nuevo tipo de notificación

1. Agregar el tipo en `models/notification.model.js`:
```javascript
const NotificationTypes = {
  // ... tipos existentes
  NEW_FEATURE: 'new_feature'
};
```

2. Usar el nuevo tipo:
```javascript
await notificationService.create({
  recipientId: userId,
  type: NotificationTypes.NEW_FEATURE,
  title: 'Nueva Funcionalidad',
  message: 'Explora nuestra nueva funcionalidad',
  channels: [NotificationChannels.IN_APP]
});
```

### Agregar un nuevo canal de notificación

1. Crear la clase del canal en `services/notificationChannels/`:
```javascript
const NotificationChannel = require('./NotificationChannel');

class SMSChannel extends NotificationChannel {
  async send(notification, recipient) {
    // Implementar lógica de envío por SMS
  }

  getChannelType() {
    return 'sms';
  }
}

module.exports = SMSChannel;
```

2. Registrar el canal en el factory:
```javascript
const SMSChannel = require('./SMSChannel');
const smsChannel = new SMSChannel();
NotificationChannelFactory.registerChannel('sms', smsChannel);
```

## Consideraciones de Rendimiento

- Las notificaciones se paginan automáticamente
- Índices optimizados para consultas frecuentes
- Notificaciones expiradas se eliminan automáticamente (TTL index)
- Envío de notificaciones masivas se realiza en paralelo
- Los canales se instancian una sola vez (singleton en factory)

## Seguridad

- Autenticación requerida en todos los endpoints
- Los usuarios solo pueden ver/modificar sus propias notificaciones
- Endpoints administrativos requieren rol `org_admin`
- Validación de entrada en todos los endpoints
- Sanitización de datos en validadores

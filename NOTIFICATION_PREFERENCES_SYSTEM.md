# Sistema de Preferencias de Notificaciones

## Resumen

El sistema de notificaciones **SÍ respeta las preferencias del usuario** configuradas en `notificationPreferences`. Cada canal de notificación verifica las preferencias antes de enviar.

## Preferencias Disponibles

Cada usuario tiene un objeto `notificationPreferences` con tres opciones:

```javascript
notificationPreferences: {
  email: true,    // Recibir notificaciones por correo electrónico
  inApp: true,    // Recibir notificaciones en la aplicación
  push: false     // Recibir notificaciones push (futuro)
}
```

### Valores por Defecto

Al crear un usuario nuevo, las preferencias por defecto son:

- **email**: `true` - Habilitado
- **inApp**: `true` - Habilitado
- **push**: `false` - Deshabilitado

## Cómo Funciona

### 1. Flujo de Envío de Notificaciones

Cuando se crea una notificación con `notificationService.create()`:

1. Se crea el registro en la base de datos
2. Se itera sobre cada canal especificado (email, inApp, push)
3. **Para cada canal se llama a `canSend(notification, recipient)`**
4. Si `canSend()` retorna `false`, el canal se omite
5. Si retorna `true`, se envía la notificación por ese canal

### 2. Verificación en Cada Canal

#### EmailChannel

```javascript
async canSend(notification, recipient) {
  // Verificar que el usuario tenga email
  if (!recipient.email) return false;
  
  // Verificar que el usuario tenga confirmado su email
  if (!recipient.isConfirmed) return false;

  // ✅ Verificar preferencias del usuario
  if (recipient.notificationPreferences) {
    return recipient.notificationPreferences.email !== false;
  }

  return true;
}
```

**Resultado**: Si `notificationPreferences.email === false`, **NO se envía el email**.

#### InAppChannel

```javascript
async canSend(notification, recipient) {
  if (!recipient || !recipient.isConfirmed) return false;

  // ✅ Verificar preferencias del usuario
  if (recipient.notificationPreferences) {
    return recipient.notificationPreferences.inApp !== false;
  }

  return true; // Por defecto permitir si no hay preferencias
}
```

**Resultado**: Si `notificationPreferences.inApp === false`, **NO se crea la notificación in-app**.

#### PushChannel

```javascript
async canSend(notification, recipient) {
  if (!recipient) return false;

  // ✅ Verificar preferencias del usuario
  if (recipient.notificationPreferences) {
    if (recipient.notificationPreferences.push === false) {
      return false;
    }
  }

  // TODO: Verificar tokens de dispositivos
  return false; // Por ahora no implementado
}
```

**Resultado**: Si `notificationPreferences.push === false`, **NO se envía push**.

## Actualizar Preferencias

### Desde el Frontend

```javascript
// Deshabilitar notificaciones por email
await fetch('/api/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notificationPreferences: {
      email: false,  // ✅ Deshabilitado
      inApp: true,   // Habilitado
      push: false    // Deshabilitado
    }
  })
});
```

### Efecto Inmediato

Los cambios tienen **efecto inmediato**. La próxima notificación respetará las nuevas preferencias.

## Ejemplos de Uso

### Ejemplo 1: Usuario deshabilita email

**Configuración del usuario:**
```javascript
notificationPreferences: {
  email: false,  // ❌ Deshabilitado
  inApp: true,   // ✅ Habilitado
  push: false
}
```

**Al enviar notificación:**
```javascript
await notificationService.create({
  recipientId: userId,
  type: NotificationTypes.CUSTOM,
  title: 'Test',
  message: 'Mensaje de prueba',
  channels: [NotificationChannels.EMAIL, NotificationChannels.IN_APP]
});
```

**Resultado:**
- ❌ Email: **NO se envía** (preferencia deshabilitada)
- ✅ In-App: **SÍ se crea** (preferencia habilitada)

### Ejemplo 2: Usuario solo quiere notificaciones críticas por email

**Configuración:**
```javascript
notificationPreferences: {
  email: true,
  inApp: false,  // ❌ Deshabilitado
  push: false
}
```

**Resultado:**
- ✅ Email: Se envía
- ❌ In-App: NO se crea
- ❌ Push: NO se envía

### Ejemplo 3: Usuario deshabilita todas las notificaciones

**Configuración:**
```javascript
notificationPreferences: {
  email: false,
  inApp: false,
  push: false
}
```

**Resultado:**
- ❌ NO recibe notificaciones por ningún canal
- Las notificaciones se crean en la BD pero se marcan como "no enviadas"

## Verificación de Estado

El sistema registra el estado de cada canal en la notificación:

```javascript
notification.deliveryStatus = [
  {
    channel: 'email',
    status: 'failed',
    statusMessage: 'Canal no disponible para este usuario',
    attemptedAt: '2026-01-03T...'
  },
  {
    channel: 'inApp',
    status: 'delivered',
    deliveredAt: '2026-01-03T...'
  }
]
```

## Casos Especiales

### Usuario sin preferencias configuradas

Si `notificationPreferences` es `undefined` o `null`:

- **Email**: Se envía (si tiene email y está confirmado)
- **InApp**: Se crea (si está confirmado)
- **Push**: NO se envía (canal no implementado)

### Usuario nuevo

Al crear un usuario:
- Las preferencias se inicializan con valores por defecto
- Puede cambiarlas inmediatamente con `PATCH /api/profile`

## Notificaciones que Ignoran Preferencias

**NINGUNA notificación ignora las preferencias del usuario.**

Todas las notificaciones respetan las preferencias configuradas. Si necesitas enviar notificaciones críticas que no se puedan deshabilitar, considera:

1. Usar un canal especial que no verifique preferencias
2. Documentar claramente que ciertas notificaciones son obligatorias
3. Permitir solo deshabilitar notificaciones "informativas" pero no "críticas"

## Pruebas

### Verificar que se respetan las preferencias

1. Crear usuario de prueba
2. Configurar preferencias específicas
3. Enviar notificación
4. Verificar que solo se envía por canales habilitados

```javascript
// Test example
const user = await User.findById(userId);
user.notificationPreferences = {
  email: false,
  inApp: true,
  push: false
};
await user.save();

const notification = await notificationService.create({
  recipientId: userId,
  title: 'Test',
  message: 'Test message',
  channels: [NotificationChannels.EMAIL, NotificationChannels.IN_APP]
});

// Verificar estado
console.log(notification.deliveryStatus);
// Email debe tener status: 'failed' con mensaje 'Canal no disponible'
// InApp debe tener status: 'delivered'
```

## Endpoints Relacionados

- `GET /api/profile` - Ver preferencias actuales
- `PATCH /api/profile` - Actualizar preferencias
- `GET /api/notifications` - Ver historial de notificaciones

## Conclusión

✅ **El sistema SÍ respeta las preferencias de notificaciones del usuario en todos los canales**:

- Email: Verifica `notificationPreferences.email`
- InApp: Verifica `notificationPreferences.inApp`
- Push: Verifica `notificationPreferences.push` (cuando se implemente)

El usuario tiene **control completo** sobre qué canales de notificaciones desea recibir.

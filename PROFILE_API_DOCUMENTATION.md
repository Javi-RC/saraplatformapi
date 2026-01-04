# API de Perfil de Usuario

Documentación completa de los endpoints para gestionar el perfil del usuario autenticado.

## Base URL

```
http://localhost:3000/api
```

## Autenticación

Todos los endpoints requieren un token JWT válido en el header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Obtener Perfil del Usuario

Obtiene la información completa del perfil del usuario autenticado.

**Endpoint:** `GET /api/profile`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "employee",
    "organization": "507f1f77bcf86cd799439012",
    "isConfirmed": true,
    "avatar": "https://...",
    "country": "España",
    "timezone": "Europe/Madrid",
    "flexibleSchedule": true,
    "preferredWorkingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "notificationPreferences": {
      "email": true,
      "inApp": true,
      "push": false
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "lastLogin": "2026-01-03T10:00:00.000Z"
  }
}
```

**Errores:**

- **404 Not Found:**
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

- **401 Unauthorized:**
```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

---

### 2. Actualizar Perfil del Usuario

Actualiza la información del perfil del usuario autenticado. Se pueden actualizar uno o varios campos a la vez.

**Endpoint:** `PATCH /api/profile`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body (todos los campos son opcionales):**
```json
{
  "name": "Juan Pérez García",
  "country": "España",
  "timezone": "Europe/Madrid",
  "flexibleSchedule": true,
  "preferredWorkingHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "notificationPreferences": {
    "email": true,
    "inApp": true,
    "push": false
  }
}
```

**Campos actualizables:**

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `name` | string | Nombre del usuario | 2-50 caracteres |
| `country` | string | País del usuario | No vacío |
| `timezone` | string | Zona horaria (formato IANA) | Ej: "Europe/Madrid", "America/New_York" |
| `flexibleSchedule` | boolean | Si tiene horario flexible | true/false |
| `preferredWorkingHours` | object | Horas preferidas de trabajo | Ver estructura abajo |
| `notificationPreferences` | object | Preferencias de notificaciones | Ver estructura abajo |

**Estructura de `preferredWorkingHours`:**
```json
{
  "start": "09:00",  // Formato HH:MM (24h)
  "end": "18:00"     // Formato HH:MM (24h)
}
```

**Estructura de `notificationPreferences`:**
```json
{
  "email": true,   // Notificaciones por email
  "inApp": true,   // Notificaciones en la aplicación
  "push": false    // Notificaciones push
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado correctamente",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez García",
    "country": "España",
    "timezone": "Europe/Madrid",
    "flexibleSchedule": true,
    "preferredWorkingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "notificationPreferences": {
      "email": true,
      "inApp": true,
      "push": false
    }
  }
}
```

**Errores:**

- **400 Bad Request (sin campos válidos):**
```json
{
  "success": false,
  "error": "No hay campos válidos para actualizar"
}
```

- **400 Bad Request (nombre inválido):**
```json
{
  "success": false,
  "error": "El nombre debe tener entre 2 y 50 caracteres"
}
```

- **400 Bad Request (hora inválida):**
```json
{
  "success": false,
  "error": "La hora de inicio debe estar en formato HH:MM (24h)"
}
```

- **404 Not Found:**
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

- **401 Unauthorized:**
```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Actualizar solo el nombre

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez García"
  }'
```

### Ejemplo 2: Actualizar ubicación y zona horaria

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "country": "México",
    "timezone": "America/Mexico_City"
  }'
```

### Ejemplo 3: Configurar horario de trabajo

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "flexibleSchedule": false,
    "preferredWorkingHours": {
      "start": "08:00",
      "end": "17:00"
    }
  }'
```

### Ejemplo 4: Cambiar preferencias de notificaciones

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "notificationPreferences": {
      "email": false,
      "inApp": true,
      "push": true
    }
  }'
```

### Ejemplo 5: Actualizar múltiples campos

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María González",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "flexibleSchedule": true,
    "preferredWorkingHours": {
      "start": "10:00",
      "end": "19:00"
    },
    "notificationPreferences": {
      "email": true,
      "inApp": true,
      "push": true
    }
  }'
```

---

## Campos No Editables

Los siguientes campos del modelo de usuario **NO** se pueden editar mediante este endpoint por motivos de seguridad:

- ❌ `email` (requiere verificación)
- ❌ `password` (requiere endpoint específico)
- ❌ `role` (solo administradores)
- ❌ `organization` (gestionado por administradores)
- ❌ `isConfirmed` (proceso automático)
- ❌ `oauthProvider`, `oauthId` (datos de OAuth)

---

## Notas Importantes

1. **Actualización parcial:** No es necesario enviar todos los campos, solo los que se desean actualizar.

2. **Validación de horarios:** Las horas deben estar en formato de 24 horas (HH:MM). Ejemplos válidos: "09:00", "14:30", "23:59".

3. **Zona horaria:** Se recomienda usar identificadores de zona horaria IANA (ej: "Europe/Madrid", "America/New_York", "Asia/Tokyo").

4. **Persistencia:** Todos los cambios se guardan inmediatamente en la base de datos.

5. **Respuesta:** La respuesta siempre incluye el objeto completo del usuario actualizado.

---

## Casos de Uso en el Frontend

### Flujo de completar perfil después del registro

1. Usuario se registra → recibe rol "unassigned"
2. Frontend detecta `user.role === 'unassigned'`
3. Redirige a página de "Completar Perfil"
4. Usuario llena formulario con país, zona horaria, horario
5. Frontend hace `PATCH /api/profile` con los datos
6. Usuario puede continuar usando la aplicación

### Página de configuración de perfil

1. Usuario accede a "Mi Perfil" o "Configuración"
2. Frontend hace `GET /api/profile` para cargar datos actuales
3. Muestra formulario con valores existentes
4. Usuario modifica campos deseados
5. Frontend hace `PATCH /api/profile` solo con campos modificados
6. Muestra mensaje de éxito

### Configuración de notificaciones

1. Usuario accede a "Preferencias de Notificaciones"
2. Frontend hace `GET /api/profile` para obtener preferencias actuales
3. Muestra toggles para email, inApp, push
4. Usuario cambia preferencias
5. Frontend hace `PATCH /api/profile` con solo `notificationPreferences`
6. Preferencias se actualizan inmediatamente

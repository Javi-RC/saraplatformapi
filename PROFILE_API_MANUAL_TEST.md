# Test Manual del Endpoint de Perfil

## Paso 1: Login para obtener token

```bash
# Reemplazar con credenciales de un usuario existente
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "pm@example.com", "password": "pmPassword123"}'
```

## Paso 2: Obtener perfil actual

```bash
# Reemplazar <TOKEN> con el token obtenido en el paso anterior
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>"
```

## Paso 3: Actualizar solo el nombre

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Project Manager Updated"}'
```

## Paso 4: Actualizar país y zona horaria

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "México",
    "timezone": "America/Mexico_City"
  }'
```

## Paso 5: Actualizar horario de trabajo

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "flexibleSchedule": false,
    "preferredWorkingHours": {
      "start": "08:00",
      "end": "17:00"
    }
  }'
```

## Paso 6: Actualizar preferencias de notificaciones

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationPreferences": {
      "email": true,
      "inApp": true,
      "push": true
    }
  }'
```

## Paso 7: Actualizar múltiples campos

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PM Full Name",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "flexibleSchedule": true,
    "preferredWorkingHours": {
      "start": "10:00",
      "end": "19:00"
    },
    "notificationPreferences": {
      "email": false,
      "inApp": true,
      "push": false
    }
  }'
```

## Pruebas de Validación

### Nombre inválido (muy corto)

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "A"}'
```

**Respuesta esperada:** Error 400

### Hora inválida

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredWorkingHours": {
      "start": "25:00",
      "end": "18:00"
    }
  }'
```

**Respuesta esperada:** Error 400

### Campo no editable (email)

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email": "nuevo@email.com"}'
```

**Respuesta esperada:** Error 400 (no hay campos válidos)

### Sin token

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

**Respuesta esperada:** Error 401

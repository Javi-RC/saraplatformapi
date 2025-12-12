# Big Five Inventory (BFI-44) - Documentación Técnica

## Descripción General

Implementación completa del Big Five Inventory (BFI-44), un cuestionario psicométrico que evalúa los cinco grandes rasgos de personalidad mediante 44 ítems con escala Likert.

## Arquitectura

La implementación sigue los principios SOLID y la arquitectura en capas del sistema existente:

```
┌─────────────────────────────────────────────┐
│          Routes (bfi44.routes.js)           │
│  - Definición de endpoints REST             │
│  - Middleware de autenticación              │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│      Controller (bfi44.controller.js)       │
│  - Manejo de peticiones HTTP                │
│  - Validación de entrada                    │
│  - Formateo de respuestas                   │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│       Service (bfi44.service.js)            │
│  - Lógica de negocio                        │
│  - Cálculo de factores                      │
│  - Inversión de ítems                       │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│        Model (bfi44.model.js)               │
│  - Schema de Mongoose                       │
│  - Validación de datos                      │
│  - Métodos de instancia                     │
└─────────────────────────────────────────────┘
```

## Endpoints API

### 1. GET /api/bfi-44/questions
Obtiene el cuestionario completo con los 44 ítems y la escala Likert.

**Autenticación:** Requerida

**Respuesta:**
```json
{
  "success": true,
  "inventory": "BFI-44",
  "scale": {
    "1": "Disagree strongly",
    "2": "Disagree a little",
    "3": "Neither agree nor disagree",
    "4": "Agree a little",
    "5": "Agree strongly"
  },
  "questions": [
    {"id": 1, "text": "Is talkative"},
    {"id": 2, "text": "Tends to find fault with others"},
    ...
    {"id": 44, "text": "Is sophisticated in art, music, or literature"}
  ]
}
```

### 2. POST /api/bfi-44/submit
Envía las respuestas del cuestionario y calcula automáticamente los 5 factores.

**Autenticación:** Requerida

**Body:**
```json
{
  "responses": {
    "1": 4,
    "2": 2,
    "3": 5,
    ...
    "44": 3
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cuestionario completado exitosamente",
  "userId": "USER_ID",
  "results": {
    "Extraversion": 28,
    "Agreeableness": 33,
    "Conscientiousness": 30,
    "Neuroticism": 21,
    "Openness": 37
  },
  "completedAt": "2025-12-12T10:30:00.000Z"
}
```

### 3. GET /api/bfi-44/my-profile
Obtiene el perfil BFI-44 del usuario autenticado.

**Autenticación:** Requerida

**Respuesta:**
```json
{
  "success": true,
  "userId": "USER_ID",
  "results": {
    "Extraversion": 28,
    "Agreeableness": 33,
    "Conscientiousness": 30,
    "Neuroticism": 21,
    "Openness": 37
  },
  "completedAt": "2025-12-12T10:30:00.000Z"
}
```

### 4. GET /api/bfi-44/has-profile
Verifica si el usuario autenticado tiene un perfil BFI-44 completado.

**Autenticación:** Requerida

**Respuesta:**
```json
{
  "success": true,
  "hasProfile": true
}
```

### 5. GET /api/bfi-44/profile/:userId
Obtiene el perfil BFI-44 de un usuario específico.

**Autenticación:** Requerida
**Autorización:** Propio usuario u org_admin

**Respuesta:** Igual que `/my-profile`

### 6. POST /api/bfi-44/recalculate/:responseId
Recalcula los resultados de un perfil existente.

**Autenticación:** Requerida
**Autorización:** Solo org_admin

**Respuesta:**
```json
{
  "success": true,
  "message": "Perfil recalculado exitosamente",
  "userId": "USER_ID",
  "results": {
    "Extraversion": 28,
    "Agreeableness": 33,
    "Conscientiousness": 30,
    "Neuroticism": 21,
    "Openness": 37
  },
  "recalculatedAt": "2025-12-12T11:00:00.000Z"
}
```

### 7. POST /api/bfi-44/notify-pending
Envía notificaciones in-App a todos los empleados que no han completado el test.

**Autenticación:** Requerida
**Autorización:** Solo org_admin

**Respuesta:**
```json
{
  "success": true,
  "message": "5 empleado(s) notificado(s)",
  "notified": 5,
  "employees": [
    {
      "id": "USER_ID_1",
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    {
      "id": "USER_ID_2",
      "name": "María García",
      "email": "maria@example.com"
    }
  ]
}
```

### 8. GET /api/bfi-44/employees-without-test
Obtiene la lista de empleados que no han completado el test.

**Autenticación:** Requerida
**Autorización:** Solo org_admin

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "employees": [
    {
      "id": "USER_ID_1",
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    {
      "id": "USER_ID_2",
      "name": "María García",
      "email": "maria@example.com"
    }
  ]
}
```

### 9. GET /api/bfi-44/organization-stats
Obtiene estadísticas de completación del test por organización.

**Autenticación:** Requerida
**Autorización:** Solo org_admin

**Respuesta:**
```json
{
  "success": true,
  "totalEmployees": 20,
  "completed": 15,
  "pending": 5,
  "completionRate": 75.0
}
```

## Modelo de Datos

### BFI44Response Schema

```javascript
{
  userId: ObjectId,           // Referencia al usuario
  responses: Map<String, Number>, // Map con 44 respuestas (1-5)
  results: {
    Extraversion: Number,
    Agreeableness: Number,
    Conscientiousness: Number,
    Neuroticism: Number,
    Openness: Number
  },
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Lógica de Cálculo

### Factores y sus Ítems

```javascript
{
  Extraversion: [1, 6, 11, 16, 21, 26, 31, 36],
  Agreeableness: [2, 7, 12, 17, 22, 27, 32, 37, 42],
  Conscientiousness: [3, 8, 13, 18, 23, 28, 33, 38, 43],
  Neuroticism: [4, 9, 14, 19, 24, 29, 34, 39],
  Openness: [5, 10, 15, 20, 25, 30, 35, 40, 41, 44]
}
```

### Ítems Invertidos (Reverse-Scored)

Fórmula: `reverse = 6 - original_value`

```javascript
{
  Extraversion: [6, 21, 31],
  Agreeableness: [2, 12, 27, 37],
  Conscientiousness: [8, 18, 23, 43],
  Neuroticism: [9, 24, 34],
  Openness: [35, 41]
}
```

### Proceso de Cálculo

1. **Validación:** Se verifica que existan 44 respuestas válidas (1-5)
2. **Inversión:** Se aplica la fórmula de inversión a los ítems correspondientes
3. **Suma:** Se suman los valores de los ítems de cada factor
4. **Almacenamiento:** Se guardan tanto las respuestas originales como los resultados

## Validaciones

### Validaciones de Entrada
- Exactamente 44 respuestas
- Cada respuesta debe estar en el rango 1-5
- Cada respuesta debe ser un número entero
- El objeto de respuestas no puede estar vacío

### Validaciones de Negocio
- El usuario debe estar autenticado
- Un usuario puede tener múltiples perfiles (histórico)
- Solo se muestra el perfil más reciente
- Solo org_admin puede recalcular perfiles

### Códigos de Error

```javascript
// Errores específicos de BFI-44
'INVALID_RESPONSE_COUNT': 'Deben existir exactamente 44 respuestas'
'BFI44_INVALID_RESPONSES_FORMAT': 'Formato de respuestas inválido'
'BFI44_INVALID_RESPONSE_COUNT': 'Deben existir exactamente 44 respuestas'
'BFI44_RESPONSE_NOT_FOUND': 'Respuesta BFI-44 no encontrada'
'BFI44_MISSING_QUESTION_{n}': 'Falta la pregunta {n}'
'BFI44_INVALID_VALUE_QUESTION_{n}': 'Valor inválido en pregunta {n}'
```

## Principios SOLID Aplicados

### Single Responsibility Principle (SRP)
- **Model:** Solo define la estructura de datos
- **Service:** Solo contiene lógica de negocio y cálculos
- **Controller:** Solo maneja HTTP y validaciones de entrada
- **Routes:** Solo define endpoints y middleware

### Open/Closed Principle (OCP)
- El servicio es extensible para nuevos cálculos sin modificar código existente
- Se pueden agregar nuevos endpoints sin modificar los existentes

### Liskov Substitution Principle (LSP)
- Sigue los patrones de servicios existentes (auth.service, cv.service)
- Intercambiable en la arquitectura

### Interface Segregation Principle (ISP)
- Métodos específicos y cohesivos
- No hay métodos innecesarios en las interfaces

### Dependency Inversion Principle (DIP)
- Dependencias inyectadas a través de require
- Bajo acoplamiento entre capas

## Seguridad

### Autenticación
- Todas las rutas requieren JWT válido
- Middleware `authMiddleware` valida token en cada request

### Autorización
- Los usuarios solo pueden ver su propio perfil
- org_admin puede ver cualquier perfil
- Solo org_admin puede recalcular perfiles

### Validación de Datos
- Validación en múltiples capas (Controller, Service, Model)
- Sanitización de entrada
- Validación de tipos y rangos

## Sistema de Notificaciones

### Notificaciones Implementadas

#### 1. Notificación de Test Pendiente (Automática) ⭐
Se envía **automáticamente** en los siguientes casos:
- Cuando un empleado confirma su cuenta por email
- Cuando un usuario es agregado a una organización como empleado
- Cuando el administrador ejecuta manualmente `/notify-pending`

**Tipo:** In-App  
**Prioridad:** Medium  
**Acción:** Link a `/bfi-44/test`

#### 2. Notificación de Test Completado (Automática) ⭐
Se envía automáticamente al empleado cuando completa el cuestionario.

**Tipo:** In-App  
**Prioridad:** Medium  
**Acción:** Link a `/bfi-44/my-profile`

#### 3. Recordatorio de Test
Se puede enviar como recordatorio después de X días sin completar.

**Tipo:** In-App  
**Prioridad:** High  
**Acción:** Link a `/bfi-44/test`

### Flujo de Notificaciones

#### Flujo Automático (Sin intervención del Admin)
```
1. Usuario se registra como empleado
   POST /auth/register (role: 'employee')
   
2. Usuario confirma su cuenta por email
   GET /auth/confirm?token=xxx
   
3. Sistema verifica automáticamente:
   - ¿Es empleado? ✓
   - ¿Tiene test completado? ✗
   
4. Sistema envía notificación automática
   "Completa tu Perfil de Personalidad"
   
5. Empleado ve notificación en su bandeja in-App

6. Empleado completa el test
   POST /api/bfi-44/submit

7. Sistema envía confirmación automática
   "Test BFI-44 Completado"
```

#### Flujo Manual (Admin notifica empleados)
```
1. Admin consulta empleados sin test
   GET /api/bfi-44/employees-without-test

2. Admin envía notificaciones masivas
   POST /api/bfi-44/notify-pending
   
3. Empleados reciben notificación in-App
   "Completa tu Perfil de Personalidad"

4. Empleado completa el test
   POST /api/bfi-44/submit

5. Empleado recibe confirmación
   "Test BFI-44 Completado"
```

## Testing

### Tests Recomendados

1. **Unit Tests:**
   - Cálculo de factores
   - Inversión de ítems
   - Validaciones
   - Lógica de notificaciones

2. **Integration Tests:**
   - Flujo completo de submit
   - Autenticación y autorización
   - Errores y edge cases
   - Sistema de notificaciones
   - Estadísticas de organización

## Ejemplo de Uso

### 1. Obtener el cuestionario
```bash
curl -X GET http://localhost:3000/api/bfi-44/questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Enviar respuestas
```bash
curl -X POST http://localhost:3000/api/bfi-44/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responses": {
      "1": 4, "2": 2, "3": 5, "4": 3, "5": 4,
      "6": 2, "7": 5, "8": 2, "9": 4, "10": 5,
      ...
      "44": 4
    }
  }'
```

### 3. Consultar perfil
```bash
curl -X GET http://localhost:3000/api/bfi-44/my-profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Consultar empleados sin test (Admin)
```bash
curl -X GET http://localhost:3000/api/bfi-44/employees-without-test \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 5. Notificar a empleados sin test (Admin)
```bash
curl -X POST http://localhost:3000/api/bfi-44/notify-pending \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 6. Consultar estadísticas de organización (Admin)
```bash
curl -X GET http://localhost:3000/api/bfi-44/organization-stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Integración con el Sistema Existente

El sistema BFI-44 se integra perfectamente con:
- Sistema de autenticación (JWT)
- Sistema de autorización (roles)
- Sistema de organizaciones
- Sistema de notificaciones (in-App, email, push)
- Validadores centralizados
- ResponseHandler para respuestas consistentes

### Arquitectura de Notificaciones

```
BFI44Service
   Dashboard de visualización de resultados
4. Comparación entre empleados (anonimizada)
5. Programación automática de recordatorios (cron jobs)
6. Notificaciones por email además de in-App
7. Análisis de tendencias de personalidad por departamento
8. Integración con sistemas de RRHH externos
     ↓
NotificationChannelFactory
     ↓
[InAppChannel, EmailChannel, PushChannel]
```

## Mantenimiento y Extensibilidad

### Posibles Extensiones Futuras
1. Exportación de resultados en PDF
2. Comparación con perfiles anteriores
3. Estadísticas a nivel de organización
4. Notificaciones al completar el cuestionario
5. Dashboard de visualización de resultados
6. Comparación entre empleados (anonimizada)

### Consideraciones
- Los datos son sensibles (personalidad)
- Cumplir con RGPD si aplica
- Considerar anonimización para análisis agregados
- Backup regular de respuestas

## Referencias

- [Big Five Inventory](https://www.ocf.berkeley.edu/~johnlab/bfi.htm)
- [Documentación Mongoose](https://mongoosejs.com/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

# Sistema de Notificaciones BFI-44

## Descripción General

Sistema automatizado de notificaciones in-App para gestionar la completación del cuestionario BFI-44 por parte de los empleados. Los administradores pueden monitorear y notificar a empleados pendientes.

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│              BFI44 Controller (API Layer)               │
│  - Endpoints REST para gestión de notificaciones       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               BFI44 Service (Business Logic)            │
│  - getEmployeesWithoutTest()                           │
│  - notifyEmployeesWithoutTest()                        │
│  - getOrganizationStats()                              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          BFI44NotificationHelper (Notifications)        │
│  - notifyTestPending()                                 │
│  - notifyTestCompleted()                               │
│  - notifyTestReminder()                                │
│  - notifyMultipleEmployeesPending()                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            NotificationService (Core System)            │
│  - create()                                            │
│  - send()                                              │
│  - markAsRead()                                        │
└─────────────────────────────────────────────────────────┘
```

## Tipos de Notificaciones

### 1. Test Pendiente (notifyTestPending)
**Cuándo se envía:** Cuando el administrador ejecuta la acción de notificar empleados pendientes

**Características:**
- **Canal:** In-App
- **Prioridad:** Medium
- **Título:** "Completa tu Perfil de Personalidad"
- **Mensaje:** Invitación personalizada con el nombre del empleado
- **Acción:** Link a `/bfi-44/test` con botón "Completar Test"
- **Metadata:** Incluye tipo de test y evento

**Código:**
```javascript
await bfi44NotificationHelper.notifyTestPending(userId, userName);
```

### 2. Test Completado (notifyTestCompleted)
**Cuándo se envía:** Automáticamente cuando un empleado completa el cuestionario

**Características:**
- **Canal:** In-App
- **Prioridad:** Medium
- **Título:** "Test BFI-44 Completado"
- **Mensaje:** Felicitación y confirmación de completación
- **Acción:** Link a `/bfi-44/my-profile` con botón "Ver Resultados"
- **Metadata:** Incluye tipo de test y evento

**Código:**
```javascript
await bfi44NotificationHelper.notifyTestCompleted(userId, userName);
```

### 3. Recordatorio (notifyTestReminder)
**Cuándo se envía:** Manualmente o programado para empleados con X días sin completar

**Características:**
- **Canal:** In-App
- **Prioridad:** High
- **Título:** "Recordatorio: Test BFI-44 Pendiente"
- **Mensaje:** Recordatorio amigable para completar el test
- **Acción:** Link a `/bfi-44/test` con botón "Completar Ahora"
- **Metadata:** Incluye días pendientes y tipo de test

**Código:**
```javascript
await bfi44NotificationHelper.notifyTestReminder(userId, userName, daysPending);
```

### 4. Notificación Masiva (notifyMultipleEmployeesPending)
**Cuándo se envía:** Cuando el administrador notifica a múltiples empleados simultáneamente

**Características:**
- Envía notificaciones de test pendiente a múltiples empleados
- Usa `Promise.allSettled` para no bloquear si una falla
- Retorna resumen de notificaciones enviadas

**Código:**
```javascript
await bfi44NotificationHelper.notifyMultipleEmployeesPending(employeeIds, employeeNames);
```

## Flujos de Trabajo

### Flujo 1: Administrador Notifica Empleados Pendientes

```
1. Admin inicia sesión y accede al dashboard
   ↓
2. Admin consulta estadísticas
   GET /api/bfi-44/organization-stats
   Respuesta: {totalEmployees: 20, completed: 15, pending: 5}
   ↓
3. Admin consulta lista de empleados pendientes
   GET /api/bfi-44/employees-without-test
   Respuesta: Lista de 5 empleados sin test
   ↓
4. Admin ejecuta notificación masiva
   POST /api/bfi-44/notify-pending
   ↓
5. Sistema envía notificaciones in-App a los 5 empleados
   - Cada empleado recibe: "Completa tu Perfil de Personalidad"
   - Notificación aparece en su bandeja
   - Incluye botón de acción directo al test
   ↓
6. Respuesta al Admin: "5 empleado(s) notificado(s)"
```

### Flujo 2: Empleado Completa el Test

```
1. Empleado recibe notificación in-App
   "Completa tu Perfil de Personalidad"
   ↓
2. Empleado hace clic en "Completar Test"
   Redirige a /bfi-44/test
   ↓
3. Empleado visualiza el cuestionario
   GET /api/bfi-44/questions
   ↓
4. Empleado completa las 44 preguntas
   ↓
5. Empleado envía respuestas
   POST /api/bfi-44/submit
   ↓
6. Sistema calcula resultados y guarda
   ↓
7. Sistema envía notificación de confirmación
   "Test BFI-44 Completado"
   ↓
8. Empleado hace clic en "Ver Resultados"
   Redirige a /bfi-44/my-profile
```

### Flujo 3: Monitoreo Continuo (Admin)

```
Ciclo de Monitoreo:

1. Admin consulta estadísticas periódicamente
   GET /api/bfi-44/organization-stats
   
2. Si completionRate < 80%:
   - Consultar empleados pendientes
   - Enviar recordatorios
   
3. Si completionRate >= 80%:
   - Continuar monitoreo pasivo
   
4. Repetir cada X días/semanas
```

## Endpoints Relacionados con Notificaciones

### POST /api/bfi-44/notify-pending
Envía notificaciones a todos los empleados sin test.

**Autorización:** org_admin  
**Request:** No requiere body  
**Response:**
```json
{
  "success": true,
  "message": "5 empleado(s) notificado(s)",
  "notified": 5,
  "employees": [
    {"id": "...", "name": "...", "email": "..."}
  ]
}
```

### GET /api/bfi-44/employees-without-test
Lista empleados que no han completado el test.

**Autorización:** org_admin  
**Response:**
```json
{
  "success": true,
  "count": 5,
  "employees": [
    {"id": "USER_ID", "name": "Juan Pérez", "email": "juan@example.com"}
  ]
}
```

### GET /api/bfi-44/organization-stats
Estadísticas de completación del test.

**Autorización:** org_admin  
**Response:**
```json
{
  "success": true,
  "totalEmployees": 20,
  "completed": 15,
  "pending": 5,
  "completionRate": 75.0
}
```

## Implementación Técnica

### BFI44NotificationHelper

```javascript
class BFI44NotificationHelper {
  // Extrae ID de usuario de manera segura
  _extractId(obj) { ... }
  
  // Notifica test pendiente a un empleado
  async notifyTestPending(userId, userName) {
    await notificationService.create({
      recipientId: userId,
      type: NotificationTypes.CUSTOM,
      title: 'Completa tu Perfil de Personalidad',
      message: `Hola ${userName}, te invitamos a completar...`,
      channels: [NotificationChannels.IN_APP],
      priority: NotificationPriority.MEDIUM,
      actionUrl: '/bfi-44/test',
      actionText: 'Completar Test'
    });
  }
  
  // Notifica test completado
  async notifyTestCompleted(userId, userName) { ... }
  
  // Envía recordatorio
  async notifyTestReminder(userId, userName, daysPending) { ... }
  
  // Notifica a múltiples empleados
  async notifyMultipleEmployeesPending(employeeIds, employeeNames) {
    const promises = employeeIds.map((userId, index) => 
      this.notifyTestPending(userId, employeeNames[index])
    );
    await Promise.allSettled(promises);
  }
}
```

### BFI44Service

```javascript
class BFI44Service {
  // Obtiene empleados sin test de una organización
  static async getEmployeesWithoutTest(organizationId) {
    const employees = await User.find({
      organization: organizationId,
      role: 'employee'
    });
    
    const employeesWithTest = await BFI44Response.distinct('userId', {
      userId: { $in: employees.map(e => e._id) }
    });
    
    return employees.filter(emp => 
      !employeesWithTest.some(id => id.toString() === emp._id.toString())
    );
  }
  
  // Notifica a empleados sin test
  static async notifyEmployeesWithoutTest(organizationId) {
    const employeesWithoutTest = await this.getEmployeesWithoutTest(organizationId);
    
    if (employeesWithoutTest.length === 0) {
      return { notified: 0, message: 'Todos los empleados han completado el test' };
    }
    
    await bfi44NotificationHelper.notifyMultipleEmployeesPending(
      employeesWithoutTest.map(e => e._id),
      employeesWithoutTest.map(e => e.name)
    );
    
    return { notified: employeesWithoutTest.length, employees: [...] };
  }
}
```

## Validaciones y Seguridad

### Validaciones de Autorización
1. Solo `org_admin` puede:
   - Ver empleados sin test
   - Notificar empleados pendientes
   - Ver estadísticas de organización

2. Empleados pueden:
   - Ver sus propias notificaciones
   - Completar el test
   - Ver sus propios resultados

### Validaciones de Negocio
1. Verificar que el admin pertenezca a una organización
2. Verificar que los empleados pertenezcan a la organización del admin
3. No enviar notificaciones duplicadas en corto período
4. Manejar errores de envío sin bloquear el proceso

### Manejo de Errores
```javascript
try {
  await bfi44NotificationHelper.notifyTestPending(userId, userName);
} catch (error) {
  console.error('Error enviando notificación:', error);
  // No lanzar error - registrar y continuar
}
```

## Configuración de Notificaciones

### Modelo de Notificación
```javascript
{
  recipientId: ObjectId,
  type: 'custom',
  title: String,
  message: String,
  channels: ['in_app'],
  priority: 'medium' | 'high' | 'low',
  status: 'pending' | 'sent' | 'read',
  actionUrl: String,
  actionText: String,
  metadata: {
    event: 'bfi44_test_pending',
    testType: 'BFI-44'
  }
}
```

### Canales Disponibles
- **IN_APP:** Notificaciones dentro de la aplicación ✅ Implementado
- **EMAIL:** Notificaciones por correo (opcional)
- **PUSH:** Notificaciones push (opcional)

## Mejores Prácticas

### 1. Notificaciones No Invasivas
- Usar prioridad `MEDIUM` para invitaciones iniciales
- Usar prioridad `HIGH` solo para recordatorios
- Evitar spam de notificaciones

### 2. Personalización
- Siempre incluir el nombre del usuario
- Mensajes claros y accionables
- Links directos a las acciones

### 3. Asincronía
```javascript
// Enviar notificación sin bloquear el flujo principal
bfi44NotificationHelper.notifyTestCompleted(userId, userName).catch(err => {
  console.error('Error enviando notificación:', err);
});
```

### 4. Batch Processing
```javascript
// Notificar múltiples usuarios eficientemente
await bfi44NotificationHelper.notifyMultipleEmployeesPending(
  employeeIds,
  employeeNames
);
```

## Métricas y Monitoreo

### Métricas Clave
1. **Tasa de Completación:** `completed / totalEmployees * 100`
2. **Empleados Pendientes:** `totalEmployees - completed`
3. **Tasa de Respuesta a Notificaciones:** Tests completados después de notificación
4. **Tiempo Promedio de Completación:** Desde notificación hasta completación

### Dashboard Sugerido para Admin
```javascript
{
  totalEmployees: 20,
  completed: 15,
  pending: 5,
  completionRate: 75.0,
  lastNotificationSent: "2025-12-12T10:00:00Z",
  avgCompletionTime: "2.5 días"
}
```

## Extensiones Futuras

### 1. Notificaciones Programadas (Cron Jobs)
```javascript
// Enviar recordatorios automáticamente cada 7 días
cron.schedule('0 9 * * 1', async () => {
  // Lógica para identificar y notificar empleados con test pendiente > 7 días
});
```

### 2. Notificaciones por Email
```javascript
channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL]
```

### 3. Escalado de Notificaciones
```
Día 0: Notificación inicial (Medium priority)
Día 7: Primer recordatorio (High priority)
Día 14: Segundo recordatorio (High priority)
Día 21: Notificación al admin (Admin notification)
```

### 4. Plantillas de Mensajes
```javascript
const messageTemplates = {
  initial: (name) => `Hola ${name}, te invitamos a completar...`,
  reminder1: (name) => `${name}, recordatorio amigable...`,
  reminder2: (name) => `${name}, última oportunidad...`
};
```

## Testing

### Tests Unitarios
```javascript
describe('BFI44NotificationHelper', () => {
  it('debe enviar notificación de test pendiente', async () => {
    await bfi44NotificationHelper.notifyTestPending('userId', 'Juan');
    expect(notificationService.create).toHaveBeenCalledWith({
      recipientId: 'userId',
      title: 'Completa tu Perfil de Personalidad',
      // ...
    });
  });
});
```

### Tests de Integración
```javascript
describe('POST /api/bfi-44/notify-pending', () => {
  it('debe notificar a empleados sin test', async () => {
    const response = await request(app)
      .post('/api/bfi-44/notify-pending')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.notified).toBeGreaterThan(0);
  });
});
```

## Conclusión

El sistema de notificaciones BFI-44 proporciona una solución completa y automatizada para gestionar la completación del cuestionario por parte de los empleados, con monitoreo en tiempo real para administradores y experiencia fluida para empleados.

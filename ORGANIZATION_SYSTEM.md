# Sistema de Gestión de Organizaciones

## Descripción General

Se ha implementado un sistema completo de gestión de organizaciones que permite a los administradores crear y gestionar organizaciones, recibir CVs de empleados y gestionar notificaciones automáticas.

## Características Implementadas

### 1. Modelo de Organización (`organization.model.js`)
- **Información básica**: nombre, descripción, identificación fiscal
- **Contacto**: email, teléfono, sitio web
- **Dirección**: completa con ciudad, estado, código postal y país
- **Clasificación**: industria y tamaño de la organización
- **Administradores**: administrador principal y administradores adicionales
- **Empleados**: lista con posición, departamento, fecha de ingreso y estado
- **Configuración personalizable**:
  - Permitir envío público de CVs
  - Requerir aprobación de empleados
  - Notificar al recibir CVs
  - Procesamiento automático con IA
- **Métodos útiles**:
  - `isAdmin()`: Verificar si un usuario es administrador
  - `isEmployee()`: Verificar si un usuario es empleado
  - `addEmployee()`: Agregar empleado con validaciones
  - `removeEmployee()`: Remover empleado
  - `updateEmployeeStatus()`: Cambiar estado de empleado

### 2. Servicio de Organizaciones (`organization.service.js`)
Implementa toda la lógica de negocio siguiendo principios SOLID:

#### Gestión de Organizaciones
- `createOrganization()`: Crea organización y asigna rol org_admin al creador
- `getOrganizationById()`: Obtiene organización con población de referencias
- `updateOrganization()`: Actualiza con validación de permisos
- `searchOrganizations()`: Búsqueda con filtros y paginación
- `deactivateOrganization()` / `activateOrganization()`: Gestión de estado

#### Gestión de Empleados
- `addEmployee()`: Agrega empleado con validaciones y actualización de roles
- `removeEmployee()`: Remueve empleado con verificaciones
- `updateEmployeeStatus()`: Cambia estado (pending/active/inactive)
- `getEmployees()`: Lista con filtros por estado, departamento, posición

#### Gestión Administrativa
- `addAdditionalAdmin()`: Agrega administradores adicionales
- `updateSettings()`: Actualiza configuración de la organización
- `getOrganizationStats()`: Estadísticas completas

### 3. Controlador de Organizaciones (`organization.controller.js`)
Maneja todas las peticiones HTTP con validaciones y manejo de errores:

- `POST /api/organizations` - Crear organización
- `GET /api/organizations/:id` - Obtener organización
- `PUT /api/organizations/:id` - Actualizar organización
- `GET /api/organizations/my-organizations` - Organizaciones del usuario
- `POST /api/organizations/:id/employees` - Agregar empleado
- `DELETE /api/organizations/:id/employees/:userId` - Remover empleado
- `PATCH /api/organizations/:id/employees/:userId/status` - Actualizar estado
- `POST /api/organizations/:id/admins` - Agregar administrador
- `GET /api/organizations/:id/employees` - Listar empleados
- `GET /api/organizations/search` - Buscar organizaciones
- `PATCH /api/organizations/:id/settings` - Actualizar configuración
- `GET /api/organizations/:id/stats` - Obtener estadísticas

### 4. Sistema de Notificaciones de Organizaciones (`organizationNotificationHelper.js`)
Notificaciones automáticas para todos los eventos importantes:

- `notifyCVSubmitted()`: Notifica a admins cuando llega un CV nuevo
- `notifyCVReviewed()`: Notifica al empleado sobre revisión de CV
- `notifyCVStatusChanged()`: Notifica cambios de estado del CV
- `notifyEmployeeAdded()`: Notifica al empleado agregado
- `notifyEmployeeStatusChanged()`: Notifica cambios de estado de empleado
- `notifyEmployeeRemoved()`: Notifica cuando se remueve un empleado
- `notifyAdminAdded()`: Notifica promoción a administrador
- `notifyAllAdmins()`: Envía notificación a todos los administradores

### 5. Gestión de CVs para Organizaciones (actualización de `cv.service.js`)
Nuevas funcionalidades para CVs:

- `submitCVToOrganization()`: Envía CV a una organización
- `getOrganizationCVs()`: Lista CVs recibidos con filtros y paginación
- `updateCVStatus()`: Actualiza estado del CV (pending/reviewed/accepted/rejected)
- `getOrganizationCV()`: Obtiene CV específico con validaciones

### 6. Actualización del Modelo de CV (`cv.model.js`)
Nuevos campos agregados:
- `organization`: Referencia a la organización
- `organizationStatus`: Estado del CV (pending/reviewed/accepted/rejected)
- `submittedToOrganizationAt`: Fecha de envío
- `organizationNotes`: Notas del administrador
- Índices optimizados para consultas de organización

### 7. Actualización del Modelo de Usuario (`user.model.js`)
- Campo `organization`: Referencia a organización del empleado
- Índice para optimizar consultas

### 8. Middleware de Autorización (`authorization.js`)
Middlewares de seguridad para control de acceso:

- `requireRole()`: Valida roles específicos
- `requireOrgAdmin()`: Solo administradores de organización
- `requireEmployee()`: Solo empleados
- `requireCompleteProfile()`: Perfil completo requerido
- `requireOwnerOrOrgAdmin()`: Usuario propietario o su admin
- `requireOrganizationAdmin()`: Admin de organización específica
- `requireOrganizationMember()`: Miembro (admin o empleado) de organización

### 9. Rutas de API (`organization.routes.js`)
Sistema completo de rutas REST con autenticación JWT:

#### Organizaciones
- Crear, leer, actualizar organizaciones
- Activar/desactivar organizaciones
- Buscar con filtros
- Obtener estadísticas

#### Empleados
- Agregar/remover empleados
- Actualizar estado
- Listar con filtros

#### CVs
- Listar CVs recibidos
- Ver CV específico
- Actualizar estado del CV

### 10. Actualización del Controlador de CVs
Nuevos endpoints agregados:
- `submitToOrganization()`: Enviar CV a organización
- `getOrganizationCVs()`: Obtener CVs de organización
- `getOrganizationCV()`: Obtener CV específico
- `updateCVStatus()`: Actualizar estado de CV

## Tipos de Notificaciones Agregados

```javascript
CV_SUBMITTED_TO_ORG: 'cv_submitted_to_org'
CV_REVIEWED: 'cv_reviewed'
CV_STATUS_CHANGED: 'cv_status_changed'
ORG_EMPLOYEE_ADDED: 'org_employee_added'
ORG_EMPLOYEE_REMOVED: 'org_employee_removed'
ORG_EMPLOYEE_STATUS_CHANGED: 'org_employee_status_changed'
ORG_ADMIN_ADDED: 'org_admin_added'
ORG_SETTINGS_UPDATED: 'org_settings_updated'
```

## Flujo de Trabajo

### Para Administradores de Organización:

1. **Crear Organización**
   ```
   POST /api/organizations
   {
     "name": "Mi Empresa",
     "contact": { "email": "info@empresa.com" },
     "industry": "technology",
     "size": "51-200"
   }
   ```

2. **Configurar Organización**
   ```
   PATCH /api/organizations/:id/settings
   {
     "notifyOnCVSubmission": true,
     "requireApproval": true
   }
   ```

3. **Recibir Notificaciones**
   - Automáticamente cuando empleados envían CVs
   - Notificaciones in-app y email

4. **Gestionar CVs Recibidos**
   ```
   GET /api/organizations/:id/cvs?status=pending
   PATCH /api/organizations/:id/cvs/:cvId/status
   {
     "status": "accepted",
     "notes": "Perfil interesante"
   }
   ```

5. **Gestionar Empleados**
   ```
   POST /api/organizations/:id/employees
   {
     "userId": "user_id",
     "position": "Developer",
     "department": "Engineering"
   }
   ```

### Para Empleados:

1. **Subir CV**
   ```
   POST /api/cv/upload
   (archivo PDF/TXT)
   ```

2. **Enviar CV a Organización**
   ```
   POST /api/cv/submit-to-organization
   {
     "organizationId": "org_id"
   }
   ```

3. **Recibir Notificaciones**
   - Cuando el CV es revisado
   - Cuando cambia el estado
   - Cuando es agregado a una organización

## Principios SOLID Aplicados

1. **Single Responsibility Principle (SRP)**
   - Cada servicio tiene una responsabilidad única
   - Separación clara entre modelos, servicios y controladores

2. **Open/Closed Principle (OCP)**
   - Sistema extensible sin modificar código existente
   - Nuevos tipos de notificaciones se agregan fácilmente

3. **Liskov Substitution Principle (LSP)**
   - Los middlewares son intercambiables
   - Servicios implementan interfaces consistentes

4. **Interface Segregation Principle (ISP)**
   - Métodos específicos para cada caso de uso
   - No hay métodos innecesarios en las interfaces

5. **Dependency Inversion Principle (DIP)**
   - Dependencias inyectadas en servicios
   - Abstracciones (modelos) en lugar de implementaciones concretas

## Seguridad

- Autenticación JWT en todas las rutas
- Validación de permisos en cada operación
- Middlewares de autorización por roles
- Validación de datos de entrada
- Manejo seguro de errores sin exponer información sensible

## Buenas Prácticas

- **Código limpio y documentado**: JSDoc en todas las funciones
- **Manejo de errores**: Try-catch con mensajes descriptivos
- **Validaciones**: En múltiples capas (middleware, servicio, modelo)
- **Índices de base de datos**: Para optimización de consultas
- **Paginación**: En todas las listas
- **Logging**: Console.log para debugging
- **Separación de responsabilidades**: Arquitectura en capas clara

## Próximos Pasos Recomendados

1. Implementar tests unitarios y de integración
2. Agregar documentación Swagger/OpenAPI
3. Implementar rate limiting
4. Agregar logs estructurados (Winston/Bunyan)
5. Implementar caché (Redis) para consultas frecuentes
6. Agregar webhooks para eventos importantes
7. Implementar búsqueda avanzada de CVs con filtros complejos
8. Dashboard con métricas en tiempo real

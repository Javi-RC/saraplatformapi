# API de Organizaciones - Documentación para Frontend

## Configuración Base

**Base URL:** `http://localhost:3000`

**Headers requeridos en todas las peticiones:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

---

## 1. GESTIÓN DE ORGANIZACIONES

### 1.1 Crear Organización
**Endpoint:** `POST /api/organizations`

**Requiere:** Usuario autenticado (cualquier rol)

**Body (JSON):**
```json
{
  "name": "DevRemote Solutions",
  "description": "Consultora de ingeniería de software con modelo de trabajo remoto e híbrido",
  "taxId": "B87654321",
  "contact": {
    "email": "contact@devremote.tech",
    "phone": "+34 911 234 567",
    "website": "https://devremote.tech"
  },
  "address": {
    "street": "Paseo de la Castellana, 95",
    "city": "Madrid",
    "state": "Madrid",
    "postalCode": "28046",
    "country": "España"
  },
  "industry": "technology",
  "size": "51-200"
}
```

**Campos obligatorios:**
- `name` (string, 2-100 caracteres)
- `contact.email` (string, formato email válido)

**Valores permitidos para `industry`:**
- `technology`
- `finance`
- `healthcare`
- `education`
- `retail`
- `manufacturing`
- `services`
- `construction`
- `agriculture`
- `energy`
- `transportation`
- `hospitality`
- `media`
- `telecommunications`
- `other`

**Valores permitidos para `size`:**
- `1-10`
- `11-50`
- `51-200`
- `201-500`
- `501-1000`
- `1000+`

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Organización creada exitosamente",
  "data": {
    "_id": "674a1234567890abcdef1234",
    "name": "DevRemote Solutions",
    "description": "Consultora de ingeniería de software con modelo de trabajo remoto e híbrido",
    "taxId": "B87654321",
    "contact": {
      "email": "contact@devremote.tech",
      "phone": "+34 911 234 567",
      "website": "https://devremote.tech"
    },
    "address": {
      "street": "Paseo de la Castellana, 95",
      "city": "Madrid",
      "state": "Madrid",
      "postalCode": "28046",
      "country": "España"
    },
    "industry": "technology",
    "size": "51-200",
    "admin": {
      "_id": "674a0987654321abcdef5678",
      "name": "Laura Fernández",
      "email": "laura.fernandez@devremote.tech",
      "avatar": "https://..."
    },
    "additionalAdmins": [],
    "employees": [],
    "settings": {
      "allowPublicCVSubmission": true,
      "requireApproval": true,
      "notifyOnCVSubmission": true,
      "autoProcessCV": true
    },
    "status": "active",
    "createdAt": "2024-12-05T10:30:00.000Z",
    "updatedAt": "2024-12-05T10:30:00.000Z",
    "lastActivityAt": "2024-12-05T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos
- `409`: El usuario ya administra otra organización activa
- `401`: No autenticado

---

### 1.2 Obtener Organización por ID
**Endpoint:** `GET /api/organizations/:id`

**Query Parameters (opcionales):**
- `includeEmployees=true` - Incluir lista completa de empleados con datos

**Ejemplo:** `GET /api/organizations/674a1234567890abcdef1234?includeEmployees=true`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "674a1234567890abcdef1234",
    "name": "DevRemote Solutions",
    "description": "Consultora de ingeniería de software con modelo de trabajo remoto e híbrido",
    "contact": { ... },
    "address": { ... },
    "admin": {
      "_id": "674a0987654321abcdef5678",
      "name": "Laura Fernández",
      "email": "laura.fernandez@devremote.tech",
      "avatar": null
    },
    "additionalAdmins": [],
    "employees": [
      {
        "_id": "674a111111111111111111",
        "user": {
          "_id": "674a222222222222222222",
          "name": "Carlos Rodríguez",
          "email": "carlos.rodriguez@devremote.tech",
          "avatar": null
        },
        "position": "Senior Software Engineer (Remoto)",
        "department": "Ingeniería de Software",
        "joinedAt": "2024-11-01T09:00:00.000Z",
        "status": "active"
      }
    ],
    "settings": { ... },
    "status": "active",
    "activeEmployeesCount": 5,
    "totalEmployeesCount": 6
  }
}
```

---

### 1.3 Actualizar Organización
**Endpoint:** `PUT /api/organizations/:id`

**Requiere:** Ser administrador de la organización

**Body (JSON) - Todos los campos son opcionales:**
```json
{
  "description": "Empresa especializada en desarrollo ágil de software y arquitecturas cloud con equipos distribuidos",
  "contact": {
    "phone": "+34 911 987 654"
  },
  "address": {
    "city": "Barcelona"
  },
  "industry": "technology",
  "size": "201-500",
  "logo": "https://devremote.tech/assets/logo.png"
}
```

**Nota:** Los campos `admin`, `employees`, `additionalAdmins` y `createdAt` no se pueden actualizar mediante este endpoint.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Organización actualizada exitosamente",
  "data": { /* organización actualizada */ }
}
```

**Errores posibles:**
- `403`: No tienes permisos (no eres administrador)
- `404`: Organización no encontrada

---

### 1.4 Obtener Mis Organizaciones
**Endpoint:** `GET /api/organizations/my-organizations`

**Descripción:** Devuelve las organizaciones donde el usuario es administrador o empleado.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1234567890abcdef1234",
      "name": "DevRemote Solutions",
      "admin": { ... },
      "status": "active",
      ...
    }
  ]
}
```

---

### 1.5 Buscar Organizaciones
**Endpoint:** `GET /api/organizations/search`

**Query Parameters (todos opcionales):**
```
?name=DevRemote
&industry=technology
&size=51-200
&status=active
&page=1
&limit=20
&sortBy=createdAt
&sortOrder=desc
```

**Ejemplo:** `GET /api/organizations/search?industry=technology&name=DevRemote&page=1&limit=10`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [
      { /* organización 1 */ },
      { /* organización 2 */ }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### 1.6 Obtener Estadísticas
**Endpoint:** `GET /api/organizations/:id/stats`

**Requiere:** Ser administrador de la organización

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "totalEmployees": 15,
    "activeEmployees": 12,
    "pendingEmployees": 2,
    "inactiveEmployees": 1,
    "totalAdmins": 2,
    "departments": ["Ingeniería de Software", "DevOps", "QA y Testing", "Arquitectura"],
    "isFullyConfigured": true,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "lastActivityAt": "2024-12-05T15:30:00.000Z"
  }
}
```

---

### 1.7 Actualizar Configuración
**Endpoint:** `PATCH /api/organizations/:id/settings`

**Requiere:** Ser administrador de la organización

**Body (JSON) - Todos los campos son opcionales:**
```json
{
  "allowPublicCVSubmission": false,
  "requireApproval": true,
  "notifyOnCVSubmission": true,
  "autoProcessCV": false
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración actualizada exitosamente",
  "data": { /* organización con configuración actualizada */ }
}
```

---

### 1.8 Desactivar Organización
**Endpoint:** `PATCH /api/organizations/:id/deactivate`

**Requiere:** Ser el administrador principal (no administradores adicionales)

**Body:** No requiere body

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Organización desactivada exitosamente",
  "data": { /* organización con status: "inactive" */ }
}
```

---

### 1.9 Activar Organización
**Endpoint:** `PATCH /api/organizations/:id/activate`

**Requiere:** Ser el administrador principal

**Body:** No requiere body

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Organización activada exitosamente",
  "data": { /* organización con status: "active" */ }
}
```

---

## 2. GESTIÓN DE EMPLEADOS

### 2.1 Agregar Empleado
**Endpoint:** `POST /api/organizations/:id/employees`

**Requiere:** Ser administrador de la organización

**Body (JSON):**
```json
{
  "userId": "674a222222222222222222",
  "position": "Full Stack Developer (Híbrido)",
  "department": "Ingeniería de Software"
}
```

**Campos obligatorios:**
- `userId` (string) - ID del usuario a agregar

**Campos opcionales:**
- `position` (string)
- `department` (string)

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Empleado agregado exitosamente",
  "data": { /* organización actualizada con el nuevo empleado */ }
}
```

**Notas:**
- Si la organización tiene `settings.requireApproval: true`, el empleado se agrega con `status: "pending"`
- Si es `false`, se agrega con `status: "active"`
- Se envía notificación automática al empleado
- El rol del usuario se actualiza a `employee` si era `unassigned`

---

### 2.2 Listar Empleados
**Endpoint:** `GET /api/organizations/:id/employees`

**Requiere:** Ser administrador o empleado de la organización

**Query Parameters (opcionales):**
```
?status=active
&department=Ingeniería de Software
&position=Backend Developer
```

**Ejemplo:** `GET /api/organizations/674a1234567890abcdef1234/employees?status=active&department=DevOps`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a111111111111111111",
      "user": {
        "_id": "674a222222222222222222",
        "name": "Carlos Rodríguez",
        "email": "carlos.rodriguez@devremote.tech",
        "avatar": null
      },
      "position": "Senior Software Engineer (Remoto)",
      "department": "Ingeniería de Software",
      "joinedAt": "2024-11-01T09:00:00.000Z",
      "status": "active"
    }
  ]
}
```

---

### 2.3 Actualizar Estado de Empleado
**Endpoint:** `PATCH /api/organizations/:id/employees/:userId/status`

**Requiere:** Ser administrador de la organización

**Body (JSON):**
```json
{
  "status": "active"
}
```

**Valores permitidos para `status`:**
- `pending`
- `active`
- `inactive`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Estado del empleado actualizado exitosamente",
  "data": { /* organización actualizada */ }
}
```

**Nota:** Se envía notificación automática al empleado.

---

### 2.4 Remover Empleado
**Endpoint:** `DELETE /api/organizations/:id/employees/:userId`

**Requiere:** Ser administrador de la organización

**Body:** No requiere body

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Empleado removido exitosamente",
  "data": { /* organización actualizada */ }
}
```

**Nota:** Se envía notificación automática al empleado removido.

---

## 3. GESTIÓN DE ADMINISTRADORES

### 3.1 Agregar Administrador Adicional
**Endpoint:** `POST /api/organizations/:id/admins`

**Requiere:** Ser el administrador principal (no administradores adicionales)

**Body (JSON):**
```json
{
  "userId": "674a333333333333333333"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Administrador agregado exitosamente",
  "data": {
    "_id": "674a1234567890abcdef1234",
    "name": "DevRemote Solutions",
    "admin": { ... },
    "additionalAdmins": [
      {
        "_id": "674a333333333333333333",
        "name": "Miguel Ángel Torres",
        "email": "miguel.torres@devremote.tech",
        "avatar": null
      }
    ]
  }
}
```

**Notas:**
- Solo el administrador principal puede agregar administradores adicionales
- El rol del usuario se actualiza a `org_admin`
- Se envía notificación automática al nuevo administrador

---

## 4. GESTIÓN DE CVs

### 4.1 Enviar CV a Organización (Empleado)
**Endpoint:** `POST /api/cv/submit-to-organization`

**Requiere:** Usuario autenticado con CV registrado

**Body (JSON):**
```json
{
  "organizationId": "674a1234567890abcdef1234"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "CV enviado exitosamente a la organización",
  "data": {
    "_id": "674a444444444444444444",
    "userId": "674a555555555555555555",
    "organization": "674a1234567890abcdef1234",
    "organizationStatus": "pending",
    "submittedToOrganizationAt": "2024-12-05T16:00:00.000Z",
    ...
  }
}
```

**Errores posibles:**
- `404`: CV no encontrado (el usuario no ha subido un CV)
- `404`: Organización no encontrada
- `403`: La organización no está activa
- `409`: Ya has enviado tu CV a esta organización

**Nota:** Se envían notificaciones automáticas a todos los administradores de la organización.

---

### 4.2 Obtener CVs de la Organización (Admin)
**Endpoint:** `GET /api/organizations/:id/cvs`

**Requiere:** Ser administrador de la organización

**Query Parameters (opcionales):**
```
?status=pending
&page=1
&limit=20
```

**Valores permitidos para `status`:**
- `pending`
- `reviewed`
- `accepted`
- `rejected`

**Ejemplo:** `GET /api/organizations/674a1234567890abcdef1234/cvs?status=pending&page=1`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "cvs": [
      {
        "_id": "674a444444444444444444",
        "userId": {
          "_id": "674a555555555555555555",
          "name": "Patricia Sánchez",
          "email": "patricia.sanchez@email.com",
          "avatar": null
        },
        "organization": "674a1234567890abcdef1234",
        "organizationStatus": "pending",
        "submittedToOrganizationAt": "2024-12-05T16:00:00.000Z",
        "organizationNotes": null,
        "contact": {
          "email": "patricia.sanchez@email.com",
          "phones": [
            {
              "number": "+34 678 901 234",
              "type": "mobile"
            }
          ]
        },
        "education": [ ... ],
        "experience": [ ... ],
        "skills": { ... },
        "languages": [ ... ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

### 4.3 Obtener CV Específico (Admin)
**Endpoint:** `GET /api/organizations/:id/cvs/:cvId`

**Requiere:** Ser administrador de la organización

**Ejemplo:** `GET /api/organizations/674a1234567890abcdef1234/cvs/674a444444444444444444`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "674a444444444444444444",
    "userId": {
      "_id": "674a555555555555555555",
      "name": "Patricia Sánchez",
      "email": "patricia.sanchez@email.com",
      "avatar": null
    },
    "organization": "674a1234567890abcdef1234",
    "organizationStatus": "pending",
    "submittedToOrganizationAt": "2024-12-05T16:00:00.000Z",
    "organizationNotes": null,
    "contact": { ... },
    "education": [ ... ],
    "experience": [ ... ],
    "skills": {
      "technical": [
        {
          "name": "Python",
          "normalizedName": "python",
          "level": "avanzado",
          "category": "lenguaje"
        },
        {
          "name": "Docker",
          "normalizedName": "docker",
          "level": "intermedio",
          "category": "herramienta"
        },
        {
          "name": "CI/CD",
          "normalizedName": "ci/cd",
          "level": "avanzado",
          "category": "herramienta"
        }
      ],
      "soft": ["Trabajo remoto", "Comunicación asíncrona", "Metodologías ágiles"]
    },
    "languages": [
      {
        "language": "Español",
        "level": "nativo"
      },
      {
        "language": "Inglés",
        "level": "C1"
      }
    ],
    "projects": [ ... ],
    "certifications": [ ... ],
    "originalFileName": "CV_Patricia_Sanchez.pdf",
    "processingDate": "2024-11-20T10:00:00.000Z",
**Body (JSON):**
```json
{
  "status": "accepted",
  "notes": "Excelente perfil técnico con experiencia en trabajo remoto. Conocimientos sólidos en DevOps y arquitecturas cloud. Contactar para entrevista técnica."
}
```
### 4.4 Actualizar Estado de CV (Admin)
**Endpoint:** `PATCH /api/organizations/:id/cvs/:cvId/status`

**Requiere:** Ser administrador de la organización

**Body (JSON):**
```json
{
  "status": "accepted",
  "notes": "Perfil muy interesante. Contactar para entrevista."
}
```

**Campos obligatorios:**
- `status` (string)

**Valores permitidos para `status`:**
- `pending`
  "data": {
    "_id": "674a444444444444444444",
    "organizationStatus": "accepted",
    "organizationNotes": "Excelente perfil técnico con experiencia en trabajo remoto. Conocimientos sólidos en DevOps y arquitecturas cloud. Contactar para entrevista técnica.",
    ...
  }notes` (string, máximo 2000 caracteres) - Notas del administrador

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Estado del CV actualizado exitosamente",
  "data": {
    "_id": "674a444444444444444444",
    "organizationStatus": "accepted",
    "organizationNotes": "Perfil muy interesante. Contactar para entrevista.",
    ...
  }
}
```

**Nota:** Se envía notificación automática al empleado informando del cambio de estado.

---

## 5. CÓDIGOS DE ERROR COMUNES

### Códigos HTTP
- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Datos inválidos o solicitud incorrecta
- `401`: No autenticado (JWT inválido o ausente)
- `403`: No autorizado (sin permisos)
- `404`: Recurso no encontrado
- `409`: Conflicto (recurso ya existe)
- `500`: Error interno del servidor

### Formato de Respuesta de Error
```json
{
  "success": false,
  "error": "Mensaje descriptivo del error"
}
```

---

## 6. EJEMPLOS DE USO CON FETCH

### Crear Organización
```javascript
const createOrganization = async (token, data) => {
  const response = await fetch('http://localhost:3000/api/organizations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
// Uso
try {
  const organization = await createOrganization(token, {
    name: "CodeLab Remote",
    description: "Desarrollo de software con equipos distribuidos globalmente",
    contact: {
      email: "hello@codelab.remote"
    },
    industry: "technology",
    size: "11-50"
  });
  console.log('Organización creada:', organization);
} catch (error) {
  console.error('Error:', error.message);
}ry {
  const organization = await createOrganization(token, {
    name: "Mi Empresa",
    contact: {
      email: "info@miempresa.com"
    },
    industry: "technology",
    size: "11-50"
  });
  console.log('Organización creada:', organization);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Enviar CV a Organización
```javascript
const submitCV = async (token, organizationId) => {
  const response = await fetch('http://localhost:3000/api/cv/submit-to-organization', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ organizationId })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error);
  }
  
  return result;
};
```

### Obtener CVs Recibidos (Admin)
```javascript
const getOrganizationCVs = async (token, organizationId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(
    `http://localhost:3000/api/organizations/${organizationId}/cvs?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error);
  }
  
  return result.data;
};

// Uso
const cvs = await getOrganizationCVs(token, orgId, {
  status: 'pending',
  page: 1,
  limit: 10
});
```

### Actualizar Estado de CV
```javascript
const updateCVStatus = async (token, organizationId, cvId, status, notes) => {
  const response = await fetch(
    `http://localhost:3000/api/organizations/${organizationId}/cvs/${cvId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, notes })
    }
  );
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error);
  }
  
  return result;
};
```

---

## 7. FLUJO COMPLETO DE TRABAJO

### Para un Administrador que crea una Organización:

1. **Autenticarse** (obtener JWT)
2. **Crear organización** → `POST /api/organizations`
3. **Configurar organización** → `PATCH /api/organizations/:id/settings`
4. **Ver CVs recibidos** → `GET /api/organizations/:id/cvs`
5. **Revisar CV específico** → `GET /api/organizations/:id/cvs/:cvId`
6. **Actualizar estado del CV** → `PATCH /api/organizations/:id/cvs/:cvId/status`
7. **Agregar empleados** → `POST /api/organizations/:id/employees`
8. **Ver estadísticas** → `GET /api/organizations/:id/stats`

### Para un Empleado que envía su CV:

1. **Autenticarse** (obtener JWT)
2. **Subir CV** → `POST /api/cv/upload`
3. **Buscar organizaciones** → `GET /api/organizations/search`
4. **Enviar CV a organización** → `POST /api/cv/submit-to-organization`
5. **Recibir notificaciones** → Automático cuando el admin revisa el CV

---

## 8. NOTIFICACIONES

Las notificaciones se envían automáticamente en los siguientes casos:

### Para Administradores:
- Cuando un empleado envía un CV → `CV_SUBMITTED_TO_ORG`
- Cuando se agrega un empleado → Interno
- Cuando cambia el estado de un empleado → Interno

### Para Empleados:
- Cuando son agregados a una organización → `ORG_EMPLOYEE_ADDED`
- Cuando su CV es revisado → `CV_REVIEWED`
- Cuando cambia el estado de su CV → `CV_STATUS_CHANGED`
- Cuando cambia su estado en la organización → `ORG_EMPLOYEE_STATUS_CHANGED`
- Cuando son removidos → `ORG_EMPLOYEE_REMOVED`
- Cuando son promovidos a admin → `ORG_ADMIN_ADDED`

Las notificaciones se pueden consultar en:
- `GET /api/notifications` (endpoint de notificaciones existente)

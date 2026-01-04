# Sistema de Recomendación de Equipos - Frontend

## 📋 Objetivo

Implementar en el frontend la funcionalidad que permita al **Project Manager (PM)** visualizar recomendaciones inteligentes de equipos para sus proyectos, basadas en el algoritmo de **Distancia Manhattan**. El PM debe poder ver, revisar, modificar y finalmente asignar el equipo manualmente.

---

## 🎯 Flujo de Usuario (UX)

### **Escenario 1: Durante la creación de un proyecto**

1. El PM llena el formulario de creación de proyecto con:
   - Nombre del proyecto
   - Descripción
   - Tecnologías principales (`mainTechnologies`)
   - Nivel de experiencia requerido (`requiredExperienceLevel`: junior/mid/senior/expert)
   - Complejidad del sistema (`systemComplexity`: low/medium/high)
   - Tamaño estimado del equipo (`estimatedTeamSize`)
   - Horas semanales por miembro (`weeklyHoursPerMember`)

2. **ANTES** de enviar el POST para crear el proyecto, mostrar un botón:
   ```
   [🔍 Ver Equipo Recomendado]
   ```

3. Al hacer clic, llamar al endpoint de sugerencias y mostrar modal/panel con:
   - Lista de empleados recomendados ordenados por score
   - Score individual de cada empleado (menor = mejor)
   - Skills que cubren vs. skills faltantes
   - Advertencias (equipo incompleto, skills faltantes, etc.)
   - Riesgos identificados

4. El PM puede:
   - Ver la recomendación y proceder a crear el proyecto
   - Ajustar parámetros y volver a solicitar recomendaciones
   - Cancelar y modificar requisitos del proyecto

### **Escenario 2: Después de crear un proyecto (sin equipo asignado)**

1. El PM entra a la vista de detalles del proyecto
2. Ver sección "Equipo del Proyecto" que muestra:
   ```
   ⚠️ Este proyecto aún no tiene equipo asignado
   
   [🤖 Ver Recomendaciones de Equipo]
   ```

3. Al hacer clic, llamar a `GET /api/projects/:id/team-analysis` y mostrar:
   - **Panel con empleados recomendados** (ordenados por mejor match)
   - Cada empleado muestra:
     - Avatar, nombre, email
     - **Score: 1.25** (menor es mejor)
     - ✅ Skills que cubre: React (avanzado), Node.js (intermedio)
     - ❌ Skills faltantes: MongoDB
     - Botón: `[➕ Asignar al Proyecto]`

4. El PM puede:
   - Asignar empleados uno por uno usando `POST /api/projects/:id/assign`
   - Especificar el rol de cada uno (Frontend Dev, Backend Dev, etc.)
   - Ignorar recomendaciones y buscar/asignar otros empleados manualmente

### **Escenario 3: Proyecto con equipo ya asignado**

1. Ver sección "Equipo Actual" con lista de empleados asignados
2. Botón: `[📊 Analizar Equipo Actual]`
3. Al hacer clic, mostrar:
   - Score de cada miembro del equipo actual
   - Análisis de cobertura de skills
   - Advertencias o recomendaciones de mejora
   - Opción de `[🔄 Ver Mejores Alternativas]`

---

## 🔌 Endpoints del Backend

### **1. Sugerir Equipo (Pre-creación o Exploración)**

```http
POST /api/projects/suggest-team
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "organizationId": "6745abc123def456789",
  "teamSize": 5,
  "projectRequirements": {
    "mainTechnologies": ["React", "Node.js", "MongoDB", "AWS"],
    "requiredExperienceLevel": "senior",
    "systemComplexity": "high",
    "weeklyHoursPerMember": 40
  }
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "team": [
      {
        "userId": "user123",
        "user": {
          "_id": "user123",
          "name": "Ana García",
          "email": "ana@company.com",
          "avatar": "https://..."
        },
        "cv": { /* Objeto CV completo */ },
        "score": "1.25",
        "details": {
          "skillsDistance": 0.5,
          "experienceDistance": 1.0,
          "complexityDistance": 0.75,
          "availabilityDistance": 0.0
        },
        "matchedSkills": [
          { "skill": "react", "level": "avanzado", "distance": 0 },
          { "skill": "nodejs", "level": "intermedio", "distance": 1 }
        ],
        "missingSkills": ["mongodb"]
      },
      // ... más empleados (total: 5)
    ],
    "summary": {
      "teamSize": 5,
      "averageScore": "1.85",
      "skillsCoverage": ["react", "nodejs", "aws"],
      "skillsGaps": ["mongodb"],
      "warnings": [
        "El equipo no cubre las siguientes tecnologías: mongodb"
      ],
      "members": [
        {
          "userId": "user123",
          "name": "Ana García",
          "email": "ana@company.com",
          "score": "1.25",
          "matchedSkills": [...],
          "missingSkills": ["mongodb"]
        }
      ]
    },
    "metadata": {
      "requestedSize": 5,
      "availableEmployees": 12,
      "selectedSize": 5,
      "isComplete": true,
      "shortage": 0,
      "allEmployeesInOrg": 15,
      "employeesWithAcceptedCV": 12
    },
    "risks": [
      {
        "type": "skill_gap",
        "title": "Tecnologías No Cubiertas",
        "description": "El equipo seleccionado no tiene experiencia en 1 tecnología(s) requerida(s): mongodb",
        "probability": 0.4,
        "severity": "low",
        "impact": {
          "schedule": "Retrasos por curva de aprendizaje",
          "quality": "Posibles errores por falta de experiencia",
          "cost": "Costos adicionales de capacitación"
        },
        "recommendations": [
          "Proporcionar capacitación en: mongodb",
          "Contratar consultores externos con estas skills",
          "Buscar empleados con estas tecnologías en otras organizaciones"
        ],
        "detectedBy": "team_selection",
        "confidence": 0.9,
        "missingSkills": ["mongodb"]
      }
    ]
  }
}
```

### **2. Analizar Equipo para Proyecto Existente**

```http
GET /api/projects/:projectId/team-analysis
Authorization: Bearer <JWT_TOKEN>
```

**Caso A: Proyecto SIN equipo asignado (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj123",
      "name": "Sistema de Ventas",
      "mainTechnologies": ["React", "Node.js"],
      "requiredExperienceLevel": "mid",
      "systemComplexity": "medium"
    },
    "suggestedTeam": [ /* Array igual que en suggest-team */ ],
    "summary": { /* Igual que arriba */ },
    "metadata": { /* Igual que arriba */ },
    "risks": [ /* Igual que arriba */ ],
    "message": "No team assigned yet. Here is the suggested optimal team."
  }
}
```

**Caso B: Proyecto CON equipo asignado (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj123",
      "name": "Sistema de Ventas",
      "mainTechnologies": ["React", "Node.js"],
      "requiredExperienceLevel": "mid",
      "systemComplexity": "medium"
    },
    "currentTeam": [
      {
        "userId": "user456",
        "user": { "name": "Carlos López", "email": "carlos@company.com" },
        "score": "2.10",
        "details": { /* ... */ },
        "matchedSkills": [ /* ... */ ],
        "missingSkills": ["nodejs"]
      }
    ],
    "summary": {
      "teamSize": 3,
      "averageScore": "2.35",
      "skillsCoverage": ["react"],
      "skillsGaps": ["nodejs"],
      "warnings": [
        "El equipo no cubre las siguientes tecnologías: nodejs",
        "El score promedio del equipo es alto (2.35), lo que indica un match subóptimo"
      ]
    }
  }
}
```

### **3. Asignar Empleado al Proyecto**

```http
POST /api/projects/:projectId/assign
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "employeeId": "user123",
  "assignedRole": "Frontend Developer"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Employee assigned successfully",
  "data": {
    /* Proyecto actualizado con el empleado en assignedEmployees */
  }
}
```

### **4. Remover Empleado del Proyecto**

```http
DELETE /api/projects/:projectId/employees/:employeeId
Authorization: Bearer <JWT_TOKEN>
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Employee removed successfully",
  "data": { /* Proyecto actualizado */ }
}
```

---

## 🎨 Componentes React Sugeridos

### **1. `TeamRecommendationModal.jsx`**

Modal que muestra las recomendaciones de equipo:

```jsx
<TeamRecommendationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  organizationId={orgId}
  projectRequirements={{
    mainTechnologies: ['React', 'Node.js'],
    requiredExperienceLevel: 'senior',
    systemComplexity: 'high',
    weeklyHoursPerMember: 40
  }}
  teamSize={5}
  onTeamSelected={(team) => {
    // Usuario confirmó que quiere usar este equipo
    // Guardar en estado para asignar después de crear proyecto
  }}
/>
```

**Estructura del modal:**
- **Header**: "🤖 Equipo Recomendado por IA"
- **Summary Section**: 
  - Score promedio del equipo
  - Skills cubiertas vs. faltantes
  - Alertas/Warnings
- **Team List**: Cards de cada empleado recomendado
- **Risks Section**: Lista de riesgos identificados (si existen)
- **Actions**: 
  - Botón: "Usar este equipo" (guarda selección)
  - Botón: "Ajustar parámetros" (vuelve al form)

### **2. `EmployeeRecommendationCard.jsx`**

Card individual de empleado recomendado:

```jsx
<EmployeeRecommendationCard
  employee={{
    userId: 'user123',
    user: { name: 'Ana García', email: 'ana@company.com', avatar: '...' },
    score: '1.25',
    matchedSkills: [...],
    missingSkills: [...],
    details: {...}
  }}
  onAssign={(userId, role) => handleAssignEmployee(userId, role)}
  isAssignable={true} // Si está en un proyecto ya creado
/>
```

**Estructura del card:**
- Avatar + Nombre + Email
- **Score Badge**: 
  - Verde si score < 2.0 (excelente match)
  - Amarillo si 2.0-3.0 (buen match)
  - Rojo si > 3.0 (match subóptimo)
- **Skills Section**:
  - ✅ Skills que cubre (con nivel: básico/intermedio/avanzado/experto)
  - ❌ Skills faltantes
- **Details Accordion** (expandible):
  - Score por categoría (skills, experiencia, complejidad, disponibilidad)
- **Action Button**:
  - Si es sugerencia: "➕ Ver Perfil"
  - Si es asignable: "➕ Asignar al Proyecto" + input para rol

### **3. `ProjectTeamSection.jsx`**

Sección en la página de detalles del proyecto:

```jsx
<ProjectTeamSection
  projectId={projectId}
  organizationId={orgId}
  currentTeam={project.assignedEmployees}
  projectRequirements={{
    mainTechnologies: project.mainTechnologies,
    requiredExperienceLevel: project.requiredExperienceLevel,
    systemComplexity: project.systemComplexity,
    weeklyHoursPerMember: project.weeklyHoursPerMember
  }}
  onTeamChange={() => refetchProject()}
/>
```

**Estructura:**
- **Tab 1: Equipo Actual**
  - Lista de empleados asignados
  - Score de cada uno
  - Botón para remover
  - Botón "📊 Analizar Equipo"
  
- **Tab 2: Recomendaciones**
  - Botón "🤖 Ver Recomendaciones"
  - Lista de empleados sugeridos
  - Botón para asignar cada uno

### **4. `TeamRisksAlert.jsx`**

Componente para mostrar riesgos del equipo:

```jsx
<TeamRisksAlert
  risks={[
    {
      type: 'skill_gap',
      title: 'Tecnologías No Cubiertas',
      severity: 'medium',
      probability: 0.6,
      description: '...',
      recommendations: [...]
    }
  ]}
/>
```

**Estructura:**
- Alert por cada riesgo con color según severity:
  - `critical` → Rojo
  - `high` → Naranja
  - `medium` → Amarillo
  - `low` → Azul
- Título del riesgo
- Descripción
- Accordion con recomendaciones

---

## 📊 Interpretación del Score

El score se calcula usando **Distancia Manhattan** en 4 dimensiones:

### **Fórmula:**
```
Score Total = (skillsDistance × 0.4) + (experienceDistance × 0.3) + 
              (complexityDistance × 0.2) + (availabilityDistance × 0.1)
```

### **Interpretación Visual:**

| Score | Badge | Significado |
|-------|-------|-------------|
| 0.0 - 1.5 | 🟢 Excelente | Match perfecto o casi perfecto |
| 1.5 - 2.5 | 🟡 Bueno | Buen match, pequeñas diferencias |
| 2.5 - 3.5 | 🟠 Aceptable | Match subóptimo, gaps significativos |
| 3.5+ | 🔴 Deficiente | Match pobre, grandes diferencias |

### **Componentes del Score:**

1. **skillsDistance** (40%): 
   - Evalúa si el empleado tiene las tecnologías requeridas
   - Penalización máxima (5.0) si no tiene la skill
   - Distancia basada en nivel (básico=1, intermedio=2, avanzado=3, experto=4)

2. **experienceDistance** (30%):
   - Compara años de experiencia del empleado vs. lo requerido
   - junior = 1 año, mid = 3 años, senior = 6 años, expert = 10 años

3. **complexityDistance** (20%):
   - Evalúa si el empleado puede manejar la complejidad del proyecto
   - Basado en certificaciones, skills avanzadas, proyectos previos

4. **availabilityDistance** (10%):
   - Evalúa si el empleado tiene horas disponibles
   - Calcula horas ocupadas en otros proyectos activos

---

## 🎨 UI/UX Recomendaciones

### **Paleta de Colores para Scores:**
```css
/* Excelente (0.0 - 1.5) */
.score-excellent {
  background: #dcfce7; /* green-100 */
  color: #166534; /* green-800 */
  border: 2px solid #22c55e; /* green-500 */
}

/* Bueno (1.5 - 2.5) */
.score-good {
  background: #fef3c7; /* yellow-100 */
  color: #854d0e; /* yellow-800 */
  border: 2px solid #eab308; /* yellow-500 */
}

/* Aceptable (2.5 - 3.5) */
.score-acceptable {
  background: #fed7aa; /* orange-100 */
  color: #9a3412; /* orange-800 */
  border: 2px solid #f97316; /* orange-500 */
}

/* Deficiente (3.5+) */
.score-poor {
  background: #fee2e2; /* red-100 */
  color: #991b1b; /* red-800 */
  border: 2px solid #ef4444; /* red-500 */
}
```

### **Iconografía Sugerida:**
- 🤖 IA/Recomendaciones
- 📊 Análisis/Estadísticas
- ✅ Skills cubiertas
- ❌ Skills faltantes
- ⚠️ Advertencias
- 🔴 Riesgos críticos
- 🟠 Riesgos altos
- 🟡 Riesgos medios
- 🔵 Riesgos bajos
- ➕ Asignar
- 🔄 Cambiar/Actualizar
- 🗑️ Remover

### **Mensajes Informativos:**

```jsx
// Si no hay empleados suficientes
<Alert variant="warning">
  ⚠️ La organización solo tiene {availableEmployees} empleados con CV aceptado, 
  pero el proyecto necesita {requestedSize}. 
  <strong>Faltan {shortage} miembros.</strong>
</Alert>

// Si hay skills faltantes
<Alert variant="info">
  ℹ️ Ningún empleado disponible tiene experiencia en: 
  <Badge>MongoDB</Badge> <Badge>AWS Lambda</Badge>
  <br />
  Considera capacitación o contratación externa.
</Alert>

// Si hay equipo incompleto
<Alert variant="error">
  🔴 <strong>Riesgo Crítico:</strong> Equipo insuficiente detectado. 
  Faltan {shortage} miembros del equipo requerido.
</Alert>
```

---

## 🔄 Flujo Completo de Ejemplo

### **Paso 1: PM crea proyecto**
```javascript
// Antes de crear proyecto, ver recomendaciones
const response = await fetch('/api/projects/suggest-team', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organizationId: '6745abc...',
    teamSize: 5,
    projectRequirements: {
      mainTechnologies: ['React', 'Node.js', 'PostgreSQL'],
      requiredExperienceLevel: 'mid',
      systemComplexity: 'medium',
      weeklyHoursPerMember: 40
    }
  })
});

const { data } = await response.json();
// Mostrar data.team, data.summary, data.risks en modal
```

### **Paso 2: PM crea el proyecto (sin equipo)**
```javascript
const projectResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    organizationId: '6745abc...',
    projectName: 'Sistema de Ventas',
    briefDescription: 'Sistema web para gestión de ventas',
    mainTechnologies: ['React', 'Node.js', 'PostgreSQL'],
    requiredExperienceLevel: 'mid',
    systemComplexity: 'medium',
    estimatedTeamSize: 5,
    weeklyHoursPerMember: 40,
    // ... otros campos requeridos
  })
});

const { data: project } = await projectResponse.json();
// Proyecto creado SIN equipo asignado
```

### **Paso 3: PM ve recomendaciones para proyecto existente**
```javascript
const analysisResponse = await fetch(`/api/projects/${projectId}/team-analysis`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await analysisResponse.json();
// data.suggestedTeam contiene el equipo recomendado
// Mostrar en UI para que PM pueda asignar
```

### **Paso 4: PM asigna empleados manualmente**
```javascript
for (const member of selectedEmployees) {
  await fetch(`/api/projects/${projectId}/assign`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      employeeId: member.userId,
      assignedRole: member.role || 'Developer'
    })
  });
}
```

### **Paso 5 (Opcional): PM analiza equipo actual**
```javascript
const currentTeamAnalysis = await fetch(`/api/projects/${projectId}/team-analysis`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await currentTeamAnalysis.json();
// data.currentTeam contiene análisis del equipo asignado
// data.summary.warnings muestra problemas detectados
```

---

## ✅ Checklist de Implementación

### **Servicios/API Client:**
- [ ] Función `suggestTeam(organizationId, projectRequirements, teamSize)`
- [ ] Función `getProjectTeamAnalysis(projectId)`
- [ ] Función `assignEmployeeToProject(projectId, employeeId, role)`
- [ ] Función `removeEmployeeFromProject(projectId, employeeId)`

### **Componentes:**
- [ ] `TeamRecommendationModal` - Modal de recomendaciones
- [ ] `EmployeeRecommendationCard` - Card de empleado individual
- [ ] `TeamScoreBadge` - Badge con score y color
- [ ] `SkillsMatchList` - Lista de skills cubiertas/faltantes
- [ ] `TeamRisksAlert` - Alertas de riesgos
- [ ] `TeamSummaryPanel` - Panel resumen del equipo
- [ ] `ProjectTeamSection` - Sección completa en proyecto

### **Páginas/Vistas:**
- [ ] Integrar en formulario de creación de proyecto
- [ ] Integrar en página de detalles de proyecto
- [ ] (Opcional) Página dedicada "Explorador de Equipos"

### **Estados/Store:**
- [ ] Estado para recomendaciones de equipo
- [ ] Estado para equipo seleccionado/temporal
- [ ] Estado para análisis de equipo actual

### **Testing:**
- [ ] Test con proyecto sin equipo → Ver sugerencias
- [ ] Test con proyecto con equipo → Ver análisis
- [ ] Test asignar empleado desde recomendación
- [ ] Test remover empleado del equipo
- [ ] Test con equipo incompleto (no hay suficientes empleados)
- [ ] Test con skills faltantes en toda la organización

---

## 🎯 Casos Edge a Considerar

1. **No hay empleados en la organización**
   - Mostrar: "No hay empleados disponibles. Invita empleados a la organización."

2. **No hay empleados con CV aceptado**
   - Mostrar: "Ningún empleado tiene CV aceptado. Los empleados deben crear y enviar su CV."

3. **Equipo incompleto (no hay suficientes empleados)**
   - Mostrar advertencia clara
   - Sugerir: contratar, reducir alcance, extender plazos

4. **Ningún empleado tiene las skills requeridas**
   - Mostrar lista de skills faltantes
   - Sugerir: capacitación, consultores externos, cambiar tecnologías

5. **Todos los empleados están sobrecargados**
   - Mostrar disponibilidad de cada uno
   - Sugerir: retrasar proyecto, redistribuir carga, contratar

---

## 📚 Recursos Adicionales

### **Documentación Backend:**
- `TEAM_SELECTION_MANHATTAN.md` - Explicación detallada del algoritmo
- `src/services/teamSelection.service.js` - Código del servicio
- `src/controllers/project.controller.js` - Endpoints implementados

### **Ejemplo de Request Completo:**
```bash
curl -X POST http://localhost:5000/api/projects/suggest-team \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1..." \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "6745abc123def456789",
    "teamSize": 5,
    "projectRequirements": {
      "mainTechnologies": ["React", "Node.js", "MongoDB", "AWS"],
      "requiredExperienceLevel": "senior",
      "systemComplexity": "high",
      "weeklyHoursPerMember": 40
    }
  }'
```

---

## 🚀 Mejoras Futuras (Opcional)

- [ ] Comparar múltiples configuraciones de equipo
- [ ] Simulador de "qué pasaría si..." (cambiar parámetros en vivo)
- [ ] Exportar recomendaciones a PDF
- [ ] Notificaciones push cuando se recomienda a un empleado
- [ ] Historial de equipos recomendados vs. equipos finales
- [ ] Métricas de éxito: equipos recomendados que completaron proyectos exitosamente

---

**¡Listo para implementar! 🎉**

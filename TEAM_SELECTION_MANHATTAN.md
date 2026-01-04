# Sistema de Selección Óptima de Equipos usando Distancia Manhattan

## Descripción General

El sistema selecciona automáticamente el equipo ideal para cada proyecto basándose en las habilidades técnicas requeridas vs las habilidades reales de los empleados de la organización, utilizando **distancia Manhattan** como métrica de similitud.

## ¿Qué es la Distancia Manhattan?

La distancia Manhattan (también llamada distancia L1 o de taxi) es una métrica que mide la suma de las diferencias absolutas entre componentes. En nuestro caso:

```
Distance = |skill1_required - skill1_actual| + |skill2_required - skill2_actual| + ...
```

**Menor distancia = Mejor match**

## Arquitectura del Sistema

### Flujo de Selección de Equipo

```
Creación de Proyecto
        ↓
Requisitos del Proyecto
  - mainTechnologies
  - requiredExperienceLevel
  - systemComplexity
  - weeklyHoursPerMember
        ↓
Team Selection Service
        ↓
1. Obtener empleados de la org
2. Filtrar CVs aceptados
3. Calcular score Manhattan por empleado
4. Ordenar por score (menor = mejor)
5. Seleccionar top N empleados
        ↓
Asignación Automática
```

### Componentes Principales

1. **teamSelection.service.js** - Servicio de selección
2. **project.service.js** - Integra selección en creación de proyectos
3. **project.controller.js** - Endpoints REST
4. **project.routes.js** - Rutas API

## Cálculo del Score Manhattan

El score se calcula usando **4 dimensiones** con pesos específicos:

### 1. Skills Técnicas (40%)

```javascript
Para cada tecnología requerida:
  - Si el empleado la tiene:
      distance = |nivel_empleado - 3| // 3 = nivel óptimo (avanzado)
      // Niveles: básico=1, intermedio=2, avanzado=3, experto=4
  
  - Si NO la tiene:
      distance = 5 // Penalización máxima

totalSkillsDistance = sum(distances) / num_required_techs
```

**Ejemplo:**
- Proyecto requiere: React, Node.js, MongoDB
- Empleado tiene:
  - React (avanzado) → distance = |3 - 3| = 0
  - Node.js (intermedio) → distance = |2 - 3| = 1
  - NO tiene MongoDB → distance = 5

```
skillsDistance = (0 + 1 + 5) / 3 = 2.0
```

### 2. Experiencia (30%)

```javascript
Años esperados por nivel:
- junior: 1 año
- mid: 3 años
- senior: 6 años
- expert: 10 años

experienceDistance = min(|años_empleado - años_requeridos| / 2, 5)
```

**Ejemplo:**
- Proyecto requiere: senior (6 años)
- Empleado tiene: 4 años de experiencia

```
experienceDistance = |4 - 6| / 2 = 1.0
```

### 3. Complejidad del Sistema (20%)

```javascript
Evalúa capacidad del empleado para manejar complejidad:
- low: 1
- medium: 2
- high: 3

Score basado en:
+ 0.5 si tiene ≥2 certificaciones
+ 0.5 si tiene ≥5 skills avanzadas/expertas
+ 0.5 si tiene ≥3 proyectos
+ 0.5 si tiene ≥5 años experiencia

complexityDistance = |employee_complexity_score - required_complexity| * 1.5
```

### 4. Disponibilidad (10%)

```javascript
Horas ocupadas = sum(weeklyHours de proyectos activos)
Horas disponibles = 40 - horas_ocupadas

Si horas_disponibles < horas_requeridas:
  availabilityDistance = min(shortage / 10, 5)
Else:
  availabilityDistance = 0
```

**Ejemplo:**
- Empleado trabajando 25h/semana en otros proyectos
- Proyecto requiere: 20h/semana

```
disponible = 40 - 25 = 15h
necesita = 20h
shortage = 5h

availabilityDistance = 5 / 10 = 0.5
```

### Score Total

```javascript
manhattanDistance = 
  (skillsDistance * 0.4) + 
  (experienceDistance * 0.3) + 
  (complexityDistance * 0.2) + 
  (availabilityDistance * 0.1)
```

## Normalización de Tecnologías

El sistema normaliza nombres de tecnologías para evitar problemas con variaciones:

```javascript
Aliases comunes:
- javascript → ['js', 'javascript', 'ecmascript']
- typescript → ['ts', 'typescript']
- react → ['react', 'reactjs', 'react.js']
- node → ['node', 'nodejs', 'node.js']
- mongodb → ['mongodb', 'mongo']
- postgresql → ['postgresql', 'postgres', 'pg']
- kubernetes → ['kubernetes', 'k8s']
```

## API Endpoints

### 1. Crear Proyecto (con selección automática)

```http
POST /api/projects
Content-Type: application/json
Authorization: Bearer <token>

{
  "organizationId": "507f1f77bcf86cd799439011",
  "projectName": "E-commerce Platform",
  "briefDescription": "Modern e-commerce solution",
  "estimatedStartDate": "2025-01-15",
  "estimatedEndDate": "2025-06-15",
  "expectedDuration": {
    "value": 6,
    "unit": "months"
  },
  "mainTechnologies": ["React", "Node.js", "MongoDB"],
  "requiredExperienceLevel": "mid",
  "systemComplexity": "high",
  "weeklyHoursPerMember": 30,
  "estimatedTeamSize": 5
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "projectName": "E-commerce Platform",
    "assignedEmployees": [
      {
        "user": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "María García",
          "email": "maria@example.com"
        },
        "assignedRole": "Developer",
        "assignedAt": "2025-12-16T10:00:00.000Z"
      },
      // ... 4 empleados más
    ],
    "organization": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Tech Corp"
    }
  }
}
```

### 2. Sugerir Equipo Óptimo

```http
POST /api/projects/suggest-team
Content-Type: application/json
Authorization: Bearer <token>

{
  "organizationId": "507f1f77bcf86cd799439011",
  "projectRequirements": {
    "mainTechnologies": ["React", "Node.js", "PostgreSQL"],
    "requiredExperienceLevel": "senior",
    "systemComplexity": "high",
    "weeklyHoursPerMember": 40
  },
  "teamSize": 3
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "team": [
      {
        "userId": "507f1f77bcf86cd799439013",
        "user": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "María García",
          "email": "maria@example.com"
        },
        "score": 0.85,
        "details": {
          "skillsDistance": 0.5,
          "experienceDistance": 0.8,
          "complexityDistance": 1.2,
          "availabilityDistance": 0
        },
        "matchedSkills": [
          {
            "skill": "react",
            "level": "avanzado",
            "distance": 0
          },
          {
            "skill": "node",
            "level": "avanzado",
            "distance": 0
          },
          {
            "skill": "postgresql",
            "level": "intermedio",
            "distance": 1
          }
        ],
        "missingSkills": []
      },
      // ... 2 empleados más
    ],
    "summary": {
      "teamSize": 3,
      "averageScore": "1.25",
      "skillsCoverage": ["react", "node", "postgresql"],
      "skillsGaps": [],
      "members": [
        {
          "userId": "507f1f77bcf86cd799439013",
          "name": "María García",
          "email": "maria@example.com",
          "score": "0.85",
          "matchedSkills": [...],
          "missingSkills": []
        }
      ]
    }
  }
}
```

### 3. Analizar Equipo Actual

```http
GET /api/projects/:projectId/team-analysis
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "507f1f77bcf86cd799439012",
      "name": "E-commerce Platform",
      "mainTechnologies": ["React", "Node.js", "MongoDB"],
      "requiredExperienceLevel": "mid",
      "systemComplexity": "high"
    },
    "currentTeam": [
      {
        "userId": "507f1f77bcf86cd799439013",
        "user": {...},
        "score": 1.2,
        "details": {...},
        "matchedSkills": [...],
        "missingSkills": [...]
      }
    ],
    "summary": {
      "teamSize": 5,
      "averageScore": "1.45",
      "skillsCoverage": ["react", "node", "mongodb"],
      "skillsGaps": [],
      "members": [...]
    }
  }
}
```

## Integración con Predicción de Riesgos

El sistema de predicción de riesgos usa automáticamente el equipo seleccionado:

```javascript
// En riskPrediction.service.js
async predictRisks(projectId) {
  // Si el proyecto no tiene equipo, lo asigna automáticamente
  if (!project.assignedEmployees || project.assignedEmployees.length === 0) {
    const optimalTeam = await teamSelectionService.selectOptimalTeam(
      project,
      project.organization._id,
      project.estimatedTeamSize || 5
    );
    
    // Asignar equipo
    for (const member of optimalTeam) {
      project.assignedEmployees.push({
        user: member.userId,
        assignedRole: 'Developer'
      });
    }
    
    await project.save();
  }
  
  // Continuar con predicción usando el equipo
  const teamAnalysis = await teamAnalysisService.getTeamAnalysis(projectId);
  // ...
}
```

## Criterios de Filtrado

### Empleados Elegibles

Para ser considerado en la selección, un empleado debe:

1. ✅ Ser miembro de la organización con rol `employee`
2. ✅ Tener CV enviado a la organización
3. ✅ CV con status `accepted` por la organización
4. ✅ CV con skills técnicas registradas

### Exclusiones

- ❌ Project Manager (ya asignado al crear el proyecto)
- ❌ Administradores de la organización (no son developers)
- ❌ CVs pendientes, rechazados o no enviados

## Ejemplo Completo de Selección

### Escenario

**Proyecto:**
- Tecnologías: React, Node.js, MongoDB
- Experiencia: mid (3 años)
- Complejidad: high
- Horas: 30h/semana
- Equipo: 3 personas

**Empleados Disponibles:**

| Empleado | Skills | Nivel | Experiencia | Proyectos Activos | Score Manhattan |
|----------|--------|-------|-------------|-------------------|-----------------|
| María | React (avanzado), Node (avanzado), MongoDB (intermedio) | 4 años | 1 proyecto (10h) | **0.85** ✅ |
| Carlos | React (intermedio), Node (básico) | 2 años | Sin proyectos | **2.45** |
| Ana | React (experto), Node (avanzado), MongoDB (avanzado), PostgreSQL (experto) | 8 años | 2 proyectos (35h) | **1.15** ✅ |
| Pedro | Java (experto), Spring (avanzado) | 5 años | 1 proyecto (20h) | **3.80** |
| Lucía | React (avanzado), Vue (experto), MongoDB (avanzado) | 3 años | Sin proyectos | **1.25** ✅ |

**Equipo Seleccionado (top 3):**
1. María (score: 0.85)
2. Ana (score: 1.15)
3. Lucía (score: 1.25)

### Desglose del Score de María

```javascript
// 1. Skills (peso 40%)
React (avanzado): |3 - 3| = 0
Node (avanzado): |3 - 3| = 0
MongoDB (intermedio): |2 - 3| = 1
skillsDistance = (0 + 0 + 1) / 3 = 0.33

// 2. Experiencia (peso 30%)
Tiene: 4 años
Requiere: 3 años (mid)
experienceDistance = |4 - 3| / 2 = 0.5

// 3. Complejidad (peso 20%)
Score empleado: 2.5 (buenas certificaciones y proyectos)
Requiere: 3 (high)
complexityDistance = |2.5 - 3| * 1.5 = 0.75

// 4. Disponibilidad (peso 10%)
Disponible: 40 - 10 = 30h
Requiere: 30h
availabilityDistance = 0

// Total
manhattanDistance = 
  (0.33 * 0.4) + (0.5 * 0.3) + (0.75 * 0.2) + (0 * 0.1)
= 0.132 + 0.15 + 0.15 + 0
= 0.432
```

## Ventajas del Sistema

1. **Objetivo y Basado en Datos**
   - Elimina sesgos humanos en la selección
   - Usa métricas cuantificables

2. **Automático**
   - Selección instantánea al crear proyecto
   - Ahorra tiempo de planificación

3. **Optimizado**
   - Considera múltiples dimensiones
   - Pesos configurables según prioridades

4. **Integrado con Predicción de Riesgos**
   - El equipo seleccionado se usa en análisis de riesgos
   - Coherencia en todo el sistema

5. **Flexible**
   - Normalización de tecnologías
   - Manejo de CVs incompletos
   - Disponibilidad en tiempo real

## Configuración y Personalización

### Ajustar Pesos

En `teamSelection.service.js`:

```javascript
// Cambiar en calculateEmployeeScore()
manhattanDistance += skillsDistance * 0.4;        // Skills: 40%
manhattanDistance += experienceDistance * 0.3;    // Exp: 30%
manhattanDistance += complexityDistance * 0.2;    // Complejidad: 20%
manhattanDistance += availabilityDistance * 0.1;  // Disponibilidad: 10%
```

### Añadir Tecnologías

```javascript
// En normalizeTechnology()
const aliases = {
  'vue': ['vue', 'vuejs', 'vue.js'],
  'nextjs': ['next', 'nextjs', 'next.js'],
  // ... añadir más
};
```

### Ajustar Penalizaciones

```javascript
// Skill faltante
totalDistance += 5; // Cambiar valor

// Shortage de disponibilidad
return Math.min(shortage / 10, 5); // Ajustar divisor
```

## Pruebas

### Test de Selección Manual

```bash
node test-team-selection.js
```

```javascript
// test-team-selection.js
const teamSelectionService = require('./src/services/teamSelection.service');

async function testSelection() {
  const projectRequirements = {
    mainTechnologies: ['React', 'Node.js', 'MongoDB'],
    requiredExperienceLevel: 'mid',
    systemComplexity: 'high',
    weeklyHoursPerMember: 30
  };

  const organizationId = '507f1f77bcf86cd799439011';
  const teamSize = 5;

  const team = await teamSelectionService.selectOptimalTeam(
    projectRequirements,
    organizationId,
    teamSize
  );

  const summary = teamSelectionService.getTeamSummary(team);
  
  console.log('Equipo seleccionado:', JSON.stringify(summary, null, 2));
}

testSelection();
```

## Mejoras Futuras

1. **Machine Learning**
   - Ajustar pesos automáticamente según resultados históricos
   - Predecir éxito del equipo

2. **Personalidad (BFI-44)**
   - Considerar compatibilidad de personalidades
   - Evitar equipos con altos niveles de neuroticismo

3. **Balance de Equipo**
   - Mix de junior/senior
   - Diversidad de skills

4. **Histórico de Proyectos**
   - Considerar éxito en proyectos anteriores
   - Trabajos previos juntos (sinergia)

5. **Preferencias**
   - Permitir que empleados indiquen preferencias de tecnologías
   - Respetar intereses personales

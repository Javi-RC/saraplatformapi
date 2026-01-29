# Guía de Integración Frontend - Nuevos Algoritmos de Riesgo

## Índice
1. [Nuevos Campos del Proyecto](#nuevos-campos-del-proyecto)
2. [Endpoints de Debug](#endpoints-de-debug)
3. [Nuevos Tipos de Riesgo](#nuevos-tipos-de-riesgo)
4. [Flujo de Predicción](#flujo-de-predicción)
5. [Ejemplos de Llamadas](#ejemplos-de-llamadas)

---

## Nuevos Campos del Proyecto

Al crear o editar un proyecto, ahora puedes incluir estos campos opcionales para activar los nuevos algoritmos de riesgo basados en Hofstede:

```javascript
{
  // Campos existentes...
  projectName: "Proyecto Ejemplo",
  startDate: "2026-02-01",
  
  // NUEVOS CAMPOS (opcionales)
  involvedCountries: ["Spain", "Germany", "USA"],  // Array de países involucrados
  commonLanguage: "English",                        // Idioma común del equipo
  requiredAutonomyLevel: 4,                         // 1-5: nivel de autonomía requerida
  requiredScheduleFlexibility: 3,                   // 1-5: flexibilidad horaria requerida
  requiredTravelAvailability: 2                     // 1-5: disponibilidad de viaje requerida
}
```

### Valores Válidos

**involvedCountries**: Array de strings con nombres de países. Países soportados:
- `"Spain"`, `"USA"`, `"Germany"`, `"France"`, `"UK"`, `"Italy"`, `"Netherlands"`, `"Sweden"`, `"Norway"`, `"Denmark"`, `"China"`, `"Japan"`, `"India"`, `"Brazil"`, `"Mexico"`, `"Argentina"`, `"Colombia"`, `"Chile"`, `"Canada"`, `"Australia"`, `"Russia"`, `"Poland"`, `"Turkey"`, `"South Korea"`, `"Singapore"`, `"Thailand"`, `"Vietnam"`, `"Indonesia"`, `"Philippines"`, `"Malaysia"`, `"New Zealand"`, `"South Africa"`

**commonLanguage**: String con el idioma común del proyecto (ej: `"English"`, `"Spanish"`, `"German"`)

**requiredAutonomyLevel**: Número del 1 al 5
- `1`: No se requiere autonomía (supervisión constante)
- `5`: Autonomía completa (trabajo independiente)

**requiredScheduleFlexibility**: Número del 1 al 5
- `1`: Horario rígido (mismo horario para todos)
- `5`: Horario completamente flexible

**requiredTravelAvailability**: Número del 1 al 5
- `1`: No se requieren viajes
- `5`: Viajes frecuentes requeridos

---

## Endpoints de Debug

### 1. Ver Todos los Tipos de Riesgo Posibles

**GET** `/api/risks/debug/all`

Devuelve el **catálogo completo** de todos los tipos de riesgo que el sistema puede generar con **metadata detallada** de cada uno.

```javascript
// Headers
Authorization: Bearer <jwt-token>

// Respuesta
{
  success: true,
  summary: {
    totalPossibleRiskTypes: 42,
    hofstedeRisksCount: 7,
    traditionalRisksCount: 35,
    categories: ["coordination", "technical", "team", "management", "organizational"],
    allSources: ["expert_rules", "expert_rules_enhanced", "expert_rules_hofstede", ...]
  },
  hofstedeRisks: [
    {
      type: "communication_tools_missing",
      title: "Herramientas de comunicación inadecuadas",
      algorithm: "Time Overlap + Binomial Coefficient",
      formula: "Max = C(n,2) × Z where n=countries, Z=tool count"
    },
    {
      type: "cultural_distance_risk",
      title: "Distancia cultural elevada",
      algorithm: "Hofstede 6D Euclidean Distance",
      formula: "sqrt(sum((dim1-dim2)^2)) across PDI, IDV, MAS, UAI, LTO, IND"
    }
    // ... 5 más
  ],
  data: [
    {
      type: "communication_breakdown",
      title: "Fallo de comunicación",
      description: "Problemas de comunicación que impiden la coordinación efectiva del equipo",
      category: "coordination",
      typicalSeverities: ["medium", "high", "critical"],
      possibleSources: ["expert_rules", "expert_rules_enhanced", "cbr", "combined"],
      isHofstedeRelated: false,
      triggerConditions: "Team size, remote work percentage, timezone differences",
      typicalIndicators: [
        "Retrasos en respuestas",
        "Información no compartida",
        "Malentendidos frecuentes"
      ],
      typicalRecommendations: [
        "Implementar actualizaciones asíncronas diarias",
        "Definir protocolos claros de escalación",
        "Usar herramientas de comunicación asíncrona efectivas",
        "Establecer normas de comunicación"
      ]
    },
    {
      type: "cultural_distance_risk",
      title: "Distancia cultural elevada",
      description: "Alta distancia cultural entre países del equipo según dimensiones de Hofstede",
      category: "team",
      typicalSeverities: ["medium", "high", "critical"],
      possibleSources: ["expert_rules_hofstede"],
      isHofstedeRelated: true,
      algorithm: "Hofstede 6D Euclidean Distance",
      formula: "sqrt(sum((dim1-dim2)^2)) across PDI, IDV, MAS, UAI, LTO, IND",
      triggerConditions: "involvedCountries (≥2 países)",
      supportedCountries: 32,
      typicalIndicators: [
        "Distancia cultural entre países del equipo",
        "Diferentes valores en dimensiones de Hofstede",
        "Posibles malentendidos culturales"
      ],
      typicalRecommendations: [
        "Implementar capacitación intercultural para el equipo",
        "Establecer normas de comunicación sensibles culturalmente",
        "Asignar mediadores culturales en el equipo"
      ]
    },
    {
      type: "team_autonomy_risk",
      title: "Riesgo de autonomía del equipo",
      description: "El nivel de autonomía del equipo no cumple con los requisitos del proyecto",
      category: "team",
      typicalSeverities: ["low", "medium", "high"],
      possibleSources: ["expert_rules_project_requirements"],
      isHofstedeRelated: true,
      algorithm: "1-5 Inverse Scale",
      formula: "Risk = 6 - requiredAutonomyLevel",
      triggerConditions: "requiredAutonomyLevel presente (1-5)",
      typicalIndicators: [
        "Nivel de autonomía requerido vs disponible",
        "Necesidad de supervisión constante"
      ],
      typicalRecommendations: [
        "Evaluar si el equipo puede trabajar con la autonomía requerida",
        "Proporcionar capacitación si es necesario",
        "Ajustar estructura de supervisión",
        "Asignar líderes técnicos si se requiere alta autonomía"
      ]
    }
    // ... 39 tipos más con toda su metadata
  ],
  timestamp: "2026-01-21T10:30:00.000Z"
}
```

**Campos de cada riesgo:**
- `type`: Identificador único del riesgo
- `title`: Nombre descriptivo en español
- `description`: Descripción completa del riesgo
- `category`: Categoría (coordination, technical, team, management, organizational)
- `typicalSeverities`: Severidades típicas que puede tener este riesgo
- `possibleSources`: Sources desde donde se puede generar
- `isHofstedeRelated`: Si es parte de los nuevos algoritmos
- `algorithm`: (Solo Hofstede) Algoritmo usado
- `formula`: (Solo Hofstede) Fórmula matemática
- `triggerConditions`: Condiciones que activan este riesgo
- `supportedCountries`: (Solo cultural) Países soportados
- `typicalIndicators`: Indicadores comunes de este riesgo
- `typicalRecommendations`: Recomendaciones típicas

### 2. Validar un Tipo de Riesgo Específico

**GET** `/api/risks/debug/by-type/:type`

Verifica si un tipo de riesgo existe en el sistema y devuelve su metadata.

```javascript
// Ejemplo
GET /api/risks/debug/by-type/cultural_distance_risk

// Headers
Authorization: Bearer <jwt-token>

// Respuesta (si existe)
{
  success: true,
  data: {
    type: "cultural_distance_risk",
    exists: true,
    isHofstedeRelated: true,
    possibleSeverities: ["low", "medium", "medium-high", "high", "critical", "emerging"],
    possibleCategories: ["coordination", "technical", "team", "management", "organizational"],
    possibleSources: [
      "expert_rules",
      "cbr",
      "combined",
      "seed_cases",
      "emerging_pattern",
      "manual",
      "expert_rules_early_warning",
      "expert_rules_hofstede",
      "expert_rules_linguistic",
      "expert_rules_project_requirements",
      "expert_rules_enhanced"
    ]
  },
  timestamp: "2026-01-21T10:30:00.000Z"
}

// Respuesta (si NO existe)
{
  success: false,
  message: "Risk type 'invalid_type' does not exist in the system",
  validTypes: [ /* array con todos los tipos válidos */ ],
  timestamp: "2026-01-21T10:30:00.000Z"
}
```

### 3. Ver Metadata Completa del Sistema de Riesgos

**GET** `/api/risks/debug/types-summary`

Devuelve toda la configuración del sistema: tipos, categorías, severidades, sources, y algoritmos implementados.

```javascript
// Headers
Authorization: Bearer <jwt-token>

// Respuesta
{
  success: true,
  data: {
    system: {
      totalRiskTypes: 42,
      totalCategories: 5,
      totalSeverityLevels: 6,
      totalSources: 11
    },
    riskTypes: {
      all: [ /* 42 tipos de riesgo */ ],
      hofstedeRelated: [
        "communication_tools_missing",
        "cultural_distance_risk",
        "linguistic_distance_risk",
        "linguistic_distance_no_common_language",
        "team_autonomy_risk",
        "schedule_flexibility_risk",
        "travel_availability_risk"
      ],
      traditional: [ /* 35 tipos tradicionales */ ]
    },
    categories: {
      all: ["coordination", "technical", "team", "management", "organizational"],
      descriptions: {
        coordination: "Coordination and communication risks",
        technical: "Technical skills and infrastructure risks",
        team: "Team dynamics and wellbeing risks",
        management: "Project management and planning risks",
        organizational: "Organizational culture and policy risks"
      }
    },
    severities: {
      all: ["low", "medium", "medium-high", "high", "critical", "emerging"],
      numericMapping: {
        low: 1,
        medium: 2,
        "medium-high": 3,
        high: 4,
        critical: 5,
        emerging: 2
      }
    },
    sources: {
      all: [ /* 11 sources */ ],
      descriptions: {
        expert_rules: "Traditional decision tree expert rules",
        expert_rules_enhanced: "Enhanced rules with time overlap + binomial coefficient",
        expert_rules_hofstede: "Hofstede cultural dimensions (6D Euclidean distance)",
        expert_rules_linguistic: "Linguistic distance analysis",
        expert_rules_project_requirements: "Project requirements mismatch (1-5 inverse scale)",
        expert_rules_early_warning: "Early warning indicators",
        cbr: "Case-based reasoning from historical projects",
        combined: "Combined DT + CBR weighted prediction",
        seed_cases: "From seed case database",
        emerging_pattern: "Detected emerging patterns",
        manual: "Manually entered by PM"
      }
    },
    algorithms: {
      hofstedeCulturalDistance: {
        formula: "sqrt(sum((dim1-dim2)^2)) for 6 dimensions",
        dimensions: ["PDI", "IDV", "MAS", "UAI", "LTO", "IND"],
        supportedCountries: 32,
        classification: "5 equal intervals (MUY BAJO to MUY ALTO)"
      },
      communicationTools: {
        formula: "Max = C(n,2) × Z where n=countries, Z=tool count",
        timeRules: "S≤2h (async+1,sync-1) | 2h<S<6h (all+1) | S≥6h (sync+1,async-1)"
      },
      linguisticDistance: {
        formula: "Score +1 per country speaking commonLanguage",
        intervals: "5 equal intervals from 0 to N (countries)"
      },
      projectRequirements: {
        formula: "6 - requiredLevel (inverse 1-5 scale)",
        types: ["autonomy", "scheduleFlexibility", "travelAvailability"]
      }
    }
  },
  timestamp: "2026-01-21T10:30:00.000Z"
}
```

---

## Nuevos Tipos de Riesgo

Los nuevos algoritmos pueden generar estos tipos de riesgo:

| Tipo | Descripción | Categoría |
|------|-------------|-----------|
| `communication_tools_missing` | Falta herramientas de comunicación adecuadas para el solapamiento horario | communication |
| `cultural_distance_risk` | Distancia cultural alta entre países del equipo (Hofstede) | team_composition |
| `linguistic_distance_risk` | Distancia lingüística entre países | communication |
| `linguistic_distance_no_common_language` | No hay idioma común entre el equipo | communication |
| `team_autonomy_risk` | Nivel de autonomía del equipo no cumple requisitos | team_composition |
| `schedule_flexibility_risk` | Flexibilidad horaria no cumple requisitos | schedule |
| `travel_availability_risk` | Disponibilidad de viaje no cumple requisitos | resource |

---

## Flujo de Predicción

### 1. Crear Proyecto con Nuevos Campos

```javascript
POST /api/projects

{
  projectName: "Proyecto Internacional",
  organizationId: "...",
  startDate: "2026-03-01",
  endDate: "2026-09-01",
  
  // Campos para activar nuevos algoritmos
  involvedCountries: ["Spain", "Germany", "China"],
  commonLanguage: "English",
  requiredAutonomyLevel: 4,
  requiredScheduleFlexibility: 3,
  requiredTravelAvailability: 2,
  
  // ... otros campos del proyecto
  teamSize: 8,
  budgetEuros: 200000,
  projectType: "software_development"
}
```

### 2. Predecir Riesgos

```javascript
POST /api/projects/:projectId/risks/predict

// Sin body (usa datos del proyecto)

// Respuesta incluye nuevos riesgos
{
  success: true,
  data: {
    risks: [
      {
        type: "cultural_distance_risk",
        severity: "ALTO",
        probability: 0.75,
        source: "expert_rules_hofstede",
        reasoning: "La distancia cultural total es de 245.67 entre 3 países (MUY ALTO)...",
        indicators: [
          "Distancia cultural entre países del equipo",
          "Diferentes valores en dimensiones de Hofstede"
        ],
        recommendations: [
          "Implementar capacitación intercultural para el equipo",
          "Establecer normas de comunicación sensibles culturalmente",
          "Asignar mediadores culturales en el equipo"
        ]
      },
      {
        type: "communication_tools_missing",
        severity: "MEDIO",
        probability: 0.65,
        source: "expert_rules_enhanced",
        reasoning: "Solapamiento horario de 2 horas entre países requiere 2 herramientas asíncronas y 0 síncronas...",
        recommendations: [
          "Implementar actualizaciones asíncronas diarias",
          "Definir protocolos claros de escalación",
          "Usar herramientas de comunicación asíncrona efectivas",
          "Establecer normas de comunicación"
        ]
      }
      // ... más riesgos
    ],
    weights: {
      decisionTree: 0.9,
      cbr: 0.1
    }
  }
}
```

### 3. Ver Riesgos del Proyecto

```javascript
GET /api/projects/:projectId/risks

// Query params opcionales
?status=active&occurred=false

// Respuesta: array de riesgos del proyecto
```

---

## Ejemplos de Llamadas

### Ejemplo 1: Proyecto con 3 Países Diferentes

```javascript
// 1. Crear proyecto
const project = await axios.post('/api/projects', {
  projectName: "Proyecto Multicultural",
  organizationId: orgId,
  startDate: "2026-04-01",
  involvedCountries: ["Spain", "China", "USA"],
  commonLanguage: "English",
  requiredAutonomyLevel: 5,
  teamSize: 10
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// 2. Predecir riesgos
const prediction = await axios.post(
  `/api/projects/${project.data.data._id}/risks/predict`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

// 3. Verificar riesgos culturales en debug
const culturalRisks = await axios.get(
  '/api/risks/debug/by-type/cultural_distance_risk',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Ejemplo 2: Proyecto con Idiomas Diferentes

```javascript
const project = await axios.post('/api/projects', {
  projectName: "Proyecto Multilingüe",
  involvedCountries: ["Spain", "France", "Italy", "Germany"],
  // SIN commonLanguage -> activará linguistic_distance_no_common_language
  requiredAutonomyLevel: 3,
  requiredScheduleFlexibility: 4
  // ... otros campos
});

// Predicción mostrará riesgo lingüístico alto
```

### Ejemplo 3: Verificar Catálogo de Riesgos Posibles

```javascript
// Ver TODOS los tipos de riesgo que el sistema puede generar
const catalog = await axios.get(
  '/api/risks/debug/all',
  { headers: { Authorization: `Bearer ${token}` } }
);

console.log(`Sistema puede generar ${catalog.data.totalPossibleRiskTypes} tipos de riesgo`);
console.log(`Nuevos riesgos de Hofstede: ${catalog.data.hofstedeRisksCount}`);
console.log(`Riesgos tradicionales: ${catalog.data.traditionalRisksCount}`);

// Ver metadata completa del sistema
const metadata = await axios.get(
  '/api/risks/debug/types-summary',
  { headers: { Authorization: `Bearer ${token}` } }
);

console.log('Algoritmos implementados:', metadata.data.data.algorithms);
console.log('Categorías:', metadata.data.data.categories.all);
console.log('Sources disponibles:', metadata.data.data.sources.all);
```

---

## Notas Importantes

### Activación de Algoritmos

- **Riesgos de comunicación basados en herramientas**: Se activan si el proyecto tiene `involvedCountries` (≥2 países)
- **Riesgo de distancia cultural**: Se activa si hay `involvedCountries` con al menos 2 países
- **Riesgo de distancia lingüística**: Se activa si hay `involvedCountries` y `commonLanguage`
- **Riesgo sin idioma común**: Se activa si hay `involvedCountries` pero NO hay `commonLanguage`
- **Riesgos de autonomía/flexibilidad/viaje**: Se activan si están presentes `requiredAutonomyLevel`, `requiredScheduleFlexibility`, o `requiredTravelAvailability`

### Compatibilidad

Los nuevos campos son **opcionales**. Si no se proporcionan, el sistema usa los algoritmos de riesgo tradicionales sin problemas.

### Autenticación

Todos los endpoints requieren token JWT en el header:
```
Authorization: Bearer <tu-token-jwt>
```

### Manejo de Errores

```javascript
try {
  const response = await axios.post('/api/projects/:id/risks/predict');
} catch (error) {
  if (error.response.status === 404) {
    // Proyecto no encontrado
  } else if (error.response.status === 400) {
    // Datos inválidos (ej: país no soportado)
    console.error(error.response.data.message);
  }
}
```

---

## Países Soportados

Para el campo `involvedCountries`, usa estos nombres exactos:

```javascript
const SUPPORTED_COUNTRIES = [
  "Spain", "USA", "Germany", "France", "UK", "Italy", 
  "Netherlands", "Sweden", "Norway", "Denmark", "China", 
  "Japan", "India", "Brazil", "Mexico", "Argentina", 
  "Colombia", "Chile", "Canada", "Australia", "Russia", 
  "Poland", "Turkey", "South Korea", "Singapore", "Thailand", 
  "Vietnam", "Indonesia", "Philippines", "Malaysia", 
  "New Zealand", "South Africa"
];
```

---

## Próximos Pasos

1. **Testing**: Usa los endpoints de debug para verificar que los riesgos se generan correctamente
2. **Validación**: Comprueba que los valores de severidad son coherentes con tus expectativas
3. **UI**: Decide cómo mostrar los nuevos tipos de riesgo en el frontend
4. **Feedback**: Ajusta los umbrales de clasificación si es necesario

Para más información sobre la implementación interna, consulta:
- `src/services/decisionTree.service.js` - Algoritmos de cálculo
- `src/models/project.model.js` - Esquema de datos del proyecto
- `src/models/risk.model.js` - Esquema de datos de riesgo

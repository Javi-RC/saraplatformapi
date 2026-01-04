# Sistema de Predicción de Riesgos - Resumen Ejecutivo

## ✅ Implementación Completa

Se ha implementado exitosamente un **sistema híbrido de predicción de riesgos** que combina:
- **Árbol de Decisión (Decision Tree)**: Reglas expertas basadas en mejores prácticas de gestión de proyectos
- **Razonamiento Basado en Casos (CBR)**: Aprendizaje continuo de proyectos históricos

---

## 📊 Arquitectura del Sistema

### Modelos de Datos

#### 1. `Risk` (src/models/risk.model.js)
Almacena predicciones de riesgos y resultados reales:
```javascript
{
  riskType: "communication_breakdown",
  severity: "high",
  confidence: 0.85,
  predictedImpact: "15% delay expected",
  mitigationStrategies: ["Daily standups", "Slack channels"],
  occurred: true,  // Se actualiza post-proyecto
  actualSeverity: "high",
  feedback: { usefulnessRating: 5, accuracyRating: 4 }
}
```

#### 2. `CaseBase` (src/models/caseBase.model.js)
Almacena casos históricos para aprendizaje:
```javascript
{
  type: "organizational",  // seed | generic | organizational
  problem: {
    projectName: "Multi-Region Project",
    teamSize: 25,
    geographicDistribution: "international",
    technologies: ["React", "Node.js"]
  },
  solution: {
    completed: true,
    delayDays: 21,
    budgetOverrun: 18,
    qualityScore: 3.5,
    actualRisks: [{ type: "communication_breakdown", severity: "high" }]
  },
  result: {
    lessonsLearned: ["Need timezone overlap hours"],
    successfulPractices: ["Daily async updates"],
    unsuccessfulPractices: ["Relying only on email"]
  }
}
```

#### 3. `Project` (src/models/project.model.js - ACTUALIZADO)
Añadidos campos para riesgos:
```javascript
{
  // Campos existentes...
  riskPredictions: [ObjectId],  // Referencias a Risk
  riskPredictionMetadata: {
    lastPredictionDate: Date,
    systemPhase: 2,
    treeWeight: 0.7,
    cbrWeight: 0.3,
    caseBaseSize: 12
  },
  projectOutcome: {
    actualDuration: { value: 65, unit: "days" },
    actualBudget: 115000,
    finalQuality: 4,
    actualRisks: [...],
    teamFeedback: {...},
    lessonsLearned: [...],
    capturedAt: Date
  }
}
```

---

## 🎯 Tipos de Riesgos Detectados

| Tipo | Descripción | Indicadores Clave |
|------|-------------|-------------------|
| `communication_breakdown` | Fallos de coordinación | Equipos distribuidos, alta necesidad de sincronización |
| `skill_gap` | Falta de experiencia técnica | Tecnologías nuevas, equipo junior |
| `team_overload` | Sobrecarga de recursos | Múltiples proyectos, equipo pequeño |
| `dependency_blockage` | Bloqueos entre equipos | Dependencias externas, integración compleja |
| `scope_creep` | Expansión de alcance | Requisitos vagos, stakeholders múltiples |
| `process_mismatch` | Conflicto metodológico | Metodología nueva, resistencia al cambio |
| `technical_infrastructure` | Problemas técnicos | Stack complejo, infraestructura nueva |
| `quality_degradation` | Sacrificio de calidad | Plazos ajustados, presión de entrega |

---

## 🔄 Fases del Sistema

El sistema evoluciona según el tamaño de la base de casos:

```
Fase 1 (0-5 casos):    90% Tree + 10% CBR   → Bootstrap con casos semilla
Fase 2 (6-15 casos):   70% Tree + 30% CBR   → Aprendizaje inicial
Fase 3 (16-30 casos):  50% Tree + 50% CBR   → Sistema balanceado
Fase 4 (31-50 casos):  40% Tree + 60% CBR   → Sistema maduro
Fase 5 (51+ casos):    30% Tree + 70% CBR   → Sistema experto
```

---

## 📡 API Endpoints

### Predicción de Riesgos

```http
POST /api/projects/:id/risks/predict
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "risks": [
      {
        "riskType": "communication_breakdown",
        "severity": "high",
        "confidence": 0.85,
        "description": "Distributed team may face coordination challenges",
        "indicators": ["International team", "5+ meetings/week"],
        "mitigationStrategies": [
          "Establish timezone overlap hours",
          "Use async documentation",
          "Daily standup meetings"
        ],
        "basedOnCases": [
          {
            "caseId": "abc123",
            "similarity": 0.92,
            "projectName": "Similar Multi-Region Project"
          }
        ]
      }
    ],
    "metadata": {
      "caseBaseSize": 12,
      "systemPhase": 2,
      "treeWeight": 0.7,
      "cbrWeight": 0.3
    },
    "systemRecommendations": [
      "System is in Phase 2 - predictions gaining accuracy",
      "12 historical cases available for learning"
    ]
  }
}
```

### Obtener Riesgos del Proyecto

```http
GET /api/projects/:id/risks
Query params: ?status=active&occurred=false
```

### Capturar Resultado Post-Proyecto

```http
POST /api/projects/:id/outcome
```
**Body:**
```json
{
  "actualEndDate": "2024-06-15",
  "actualDuration": { "value": 70, "unit": "days" },
  "actualBudget": 115000,
  "finalQuality": 4,
  "completionReason": "successful",
  "actualRisks": [
    {
      "riskType": "communication_breakdown",
      "severity": "medium",
      "description": "Some timezone coordination issues",
      "mitigationActions": ["Added daily standups", "Created Slack channels"],
      "impact": "Caused 5 day delay"
    }
  ],
  "teamFeedback": {
    "satisfactionLevel": 4,
    "workloadLevel": 3,
    "communicationQuality": 4,
    "comments": "Good project, some challenges"
  },
  "lessonsLearned": [
    "Need better initial timezone planning",
    "Async documentation is critical"
  ],
  "successfulPractices": [
    "Daily standups",
    "Code reviews"
  ],
  "unsuccessfulPractices": [
    "Relying only on email for critical decisions"
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "caseCreated": true,
    "caseId": "xyz789",
    "learningReport": {
      "accuracyImprovement": "+5%",
      "newPatterns": ["Timezone challenges in distributed teams"],
      "recommendations": ["Consider overlap hours for future projects"]
    }
  }
}
```

### Insights de Organización

```http
GET /api/organizations/:id/risks/insights
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "commonRisks": [
      {
        "type": "communication_breakdown",
        "frequency": 0.75,
        "avgSeverity": "high",
        "avgImpact": "18% delay"
      }
    ],
    "patterns": [
      "Projects with >3 timezones have 80% higher communication risk"
    ],
    "recommendations": [
      "Establish timezone overlap hours for international projects",
      "Invest in async communication tools"
    ],
    "predictionsVsActual": {
      "precision": 0.87,
      "recall": 0.82,
      "accuracy": 0.85
    }
  }
}
```

### Casos Similares

```http
GET /api/projects/:id/similar-cases?limit=5
```

### Estadísticas de Organización

```http
GET /api/organizations/:id/risks/stats
GET /api/organizations/:id/risks/accuracy
GET /api/organizations/:id/case-base/stats
GET /api/organizations/:id/case-base/cases
```

---

## 🚀 Guía de Inicio Rápido

### 1. Inicializar Sistema

```bash
# Cargar casos semilla en la base de datos
node scripts/setup-cbr-system.js

# O forzar recarga
FORCE_RELOAD=true node scripts/setup-cbr-system.js
```

### 2. Flujo Completo de Uso

```javascript
// 1. Crear proyecto (API existente)
const project = await Project.create({
  projectName: "New Distributed Project",
  estimatedStartDate: new Date(),
  estimatedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  expectedDuration: { value: 60, unit: "days" },
  estimatedBudget: 100000,
  organization: orgId,
  projectManager: pmId,
  
  // Factores de riesgo
  requiresSynchronousCommunication: "yes",
  realTimeCommunicationLevel: "high",
  teamGeographicDistribution: "international_multiple_continents",
  requiredTechnologies: ["React", "Node.js", "MongoDB"],
  teamSizeRange: "large"
});

// 2. Predecir riesgos
const prediction = await riskPredictionService.predictProjectRisks(project._id);
console.log(`Predicted ${prediction.risks.length} risks`);
prediction.risks.forEach(risk => {
  console.log(`- ${risk.riskType}: ${risk.severity} (confidence: ${risk.confidence})`);
  console.log(`  Mitigation: ${risk.mitigationStrategies[0]}`);
});

// 3. Durante el proyecto: dar feedback
const risk = await Risk.findOne({ project: project._id });
risk.feedback = {
  usefulnessRating: 5,
  accuracyRating: 4,
  comments: "Very helpful, we implemented the suggested mitigations",
  providedBy: userId
};
await risk.save();

// 4. Al completar: capturar resultado
const outcome = await postProjectService.captureProjectOutcome(
  project._id,
  {
    actualEndDate: new Date(),
    actualDuration: { value: 65, unit: "days" },
    actualBudget: 105000,
    finalQuality: 4,
    completionReason: "successful",
    actualRisks: [
      {
        riskType: "communication_breakdown",
        severity: "medium",
        description: "Timezone coordination was challenging",
        mitigationActions: ["Daily standups helped"],
        impact: "5 day delay"
      }
    ],
    teamFeedback: {
      satisfactionLevel: 4,
      workloadLevel: 3,
      communicationQuality: 4
    },
    lessonsLearned: ["Need overlap hours", "Async docs critical"],
    successfulPractices: ["Daily standups"],
    unsuccessfulPractices: ["Email-only decisions"]
  },
  pmId
);

console.log(`Case created: ${outcome.caseId}`);
console.log(`Learning report:`, outcome.learningReport);

// 5. Ver insights acumulados
const insights = await riskPredictionService.getOrganizationRiskInsights(orgId);
console.log(`Common risks:`, insights.commonRisks);
console.log(`Recommendations:`, insights.recommendations);
```

---

## 🧪 Testing

```bash
# Ejecutar tests de integración
npm test -- tests/integration/risk-prediction.integration.test.js

# Tests cubren:
# - Carga de casos semilla
# - Predicción en Fase 1 (solo seeds)
# - Captura de resultados
# - Creación de casos organizacionales
# - Predicción en Fase 2+ (con casos org)
# - Mejora de precisión
# - Insights de organización
```

---

## 📈 Cálculo de Similitud

Los casos se comparan en 5 dimensiones:

```javascript
similarity = 
  0.25 × coordinationSimilarity +  // Tamaño equipo, distribución, comunicación
  0.30 × technicalSimilarity +      // Tecnologías, complejidad, stack
  0.20 × teamSimilarity +           // Composición, experiencia, carga
  0.15 × managementSimilarity +     // Duración, presupuesto, metodología
  0.10 × organizationalSimilarity   // Tamaño org, industria, historial
```

### Ejemplo de Similitud:
```
Proyecto A: React + Node.js, equipo 15 personas, 3 zonas horarias
Proyecto B: React + Node.js, equipo 12 personas, 4 zonas horarias

Coordinación: 0.85 (equipos grandes distribuidos)
Técnico: 0.95 (mismo stack)
Equipo: 0.90 (tamaños similares)
Gestión: 0.80 (duraciones similares)
Organizacional: 1.0 (misma organización)

Similitud total: 0.89 (muy similar → alta confianza en predicción CBR)
```

---

## 📊 Métricas de Precisión

El sistema calcula automáticamente:

- **Precision**: ¿Cuántas predicciones fueron correctas?
- **Recall**: ¿Cuántos riesgos reales detectamos?
- **Accuracy**: Precisión general
- **Severity Accuracy**: ¿Qué tan cerca estuvo la severidad predicha?

### Ejemplo de Reporte:
```json
{
  "overallAccuracy": 0.85,
  "byRiskType": {
    "communication_breakdown": {
      "precision": 0.87,
      "recall": 0.82,
      "f1Score": 0.84,
      "predictions": 23,
      "truePositives": 20,
      "falsePositives": 3,
      "falseNegatives": 4
    }
  },
  "severityAccuracy": 0.78,
  "improvementTrend": "+12% vs last quarter"
}
```

---

## 💡 Explicabilidad

Cada predicción incluye explicación completa:

```json
{
  "riskType": "communication_breakdown",
  "confidence": 0.87,
  "reasoning": {
    "treeContribution": {
      "weight": 0.7,
      "triggered": true,
      "rule": "High synchronous communication + international team",
      "severity": "high"
    },
    "cbrContribution": {
      "weight": 0.3,
      "confidence": 0.85,
      "basedOnCases": [
        {
          "projectName": "Multi-Region API Project",
          "similarity": 0.92,
          "outcome": "21 days delay due to timezone issues",
          "whatWorked": ["Daily standups", "Overlap hours"],
          "whatDidntWork": ["Email-only communication"]
        }
      ]
    }
  }
}
```

---

## 📁 Archivos Creados

### Modelos
- `src/models/risk.model.js` (631 líneas)
- `src/models/caseBase.model.js` (568 líneas)
- `src/models/project.model.js` (actualizado con campos de riesgo)

### Servicios
- `src/services/decisionTree.service.js` (732 líneas) - 8 reglas expertas
- `src/services/cbr.service.js` (729 líneas) - 4Rs del CBR
- `src/services/riskPrediction.service.js` (466 líneas) - Orquestador
- `src/services/postProject.service.js` (420 líneas) - Captura de resultados
- `src/services/seedCases.service.js` (819 líneas) - 5 casos semilla

### API
- `src/controllers/risk.controller.js` (402 líneas)
- `src/routes/risk.routes.js` (212 líneas)
- `src/app.js` (actualizado con rutas de riesgos)

### Scripts y Docs
- `scripts/setup-cbr-system.js` - Script de inicialización
- `CBR_RISK_SYSTEM_DOCUMENTATION.md` - Documentación completa
- `tests/integration/risk-prediction.integration.test.js` - Tests completos

---

## ✅ Checklist de Implementación

- [x] Modelo Risk con tracking de precisión
- [x] Modelo CaseBase con indexación de similitud
- [x] Árbol de Decisión con 8 reglas expertas
- [x] CBR con 4Rs (Retrieve, Reuse, Revise, Retain)
- [x] Orquestador con pesos adaptativos
- [x] Captura de resultados post-proyecto
- [x] 5 casos semilla de literatura
- [x] Controladores REST completos
- [x] Rutas API documentadas
- [x] Actualización modelo Project
- [x] Tests de integración completos
- [x] Script de inicialización
- [x] Documentación exhaustiva

---

## 🎓 Referencias

- **CBR Theory**: Aamodt, A. & Plaza, E. (1994). Case-Based Reasoning: Foundational Issues
- **Project Management**: PMI PMBOK Guide (6th Edition)
- **Risk Data**: Standish Group Chaos Report 2020
- **Software Engineering**: IEEE SWEBOK v3.0

---

## 🔮 Próximos Pasos Sugeridos

1. **Integración Frontend**
   - Dashboard de riesgos en tiempo real
   - Visualización de casos similares
   - Formulario post-proyecto interactivo

2. **Monitoreo Activo**
   - Detección automática de indicadores de riesgo
   - Alertas en tiempo real
   - Recomendaciones proactivas

3. **Análisis Avanzado**
   - Simulaciones "what-if"
   - Análisis predictivo multi-proyecto
   - Benchmarking inter-organizacional

4. **Machine Learning**
   - Embeddings semánticos para similitud
   - Predicción de impacto con regression
   - Clustering de patrones de riesgo

---

**¡Sistema completamente funcional y listo para usar!** 🎉

Ejecuta `node scripts/setup-cbr-system.js` para inicializar.

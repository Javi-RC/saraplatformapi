# Frontend Risk Monitoring & Learning Guide

## Overview

Este documento describe los endpoints y flujos que el frontend necesita para:
1. **Monitorear riesgos durante la ejecución del proyecto**
2. **Marcar riesgos como ocurridos**
3. **Capturar el resultado final del proyecto**
4. **Permitir que el sistema aprenda (crear case en CBR)**

---

## ⚠️ IMPORTANTE: Arquitectura de Probabilidad

**DT (Decision Tree) NO tiene probability:**
- Solo: `severity`, `confidence`, `indicators`
- `confidence` = qué tan seguro está DT de la detección

**CBR (Case-Based Reasoning) SÍ tiene probability:**
- `probability` = similarity score (well-founded, basado en datos históricos)
- Solo presente cuando `source: "cbr"`

**En actualizedRisks (outcome):**
- NO enviar `probability` field
- Solo: `type`, `occurred`, `severity`, `scheduleDelayDays`, `budgetOverrunPercent`, `description`

---

## FASE 1: MONITOREO (Durante ejecución del proyecto)

### Objetivo
El PM ve riesgos predichos y marca cuáles ocurrieron realmente durante el proyecto.

### 1.1 Obtener riesgos predichos para un proyecto

**Endpoint**:
```
GET /api/projects/:projectId/risks
```

**Query Parameters**:
```
status=predicted     (opcional, filtra por estado)
occurred=false       (opcional, muestra solo no ocurridos)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "projectId": "65f8a3b2c1d2e3f4g5h6i7j8",
    "risks": [
      {
        "_id": "risk_001",
        "type": "communication_breakdown",
        "title": "Communication Breakdown Risk",
        "description": "Remote team spanning multiple time zones",
        "severity": "high",
        "confidence": 0.78,         // ← DT: confidence in detection
        "probability": 0.82,        // ← ONLY for CBR (source: "cbr")
        "source": "cbr",            // ← If "expert_rules", NO probability
        "indicators": ["Remote team", "No daily standups"],
        "recommendations": ["Establish daily standup", "Use async docs"],
        "occurred": null,           // ← null = no marcado aún
        "detectedAt": null,
        "status": "predicted"
      },
      // ... más riesgos
    ]
  }
}
```

**Campos Clave**:
- `occurred: null` = No marcado
- `status: "predicted"` = En predicción, no ocurrió aún
- `detectedAt: null` = No se ha registrado fecha de ocurrencia
- `confidence` = Confianza de detección (presente en DT, 0-1)
- `probability` = SOLO presente en riesgos CBR (`source: "cbr"`) = similarity score

---

### 1.2 Marcar un riesgo como OCURRIDO

Existen dos tipos de riesgos:

#### A. Riesgos Predichos (DT o CBR)
Para actualizar riesgos predichos, usar el endpoint para marcar como ocurrido.

**Endpoint** (Implementado ✅):
```
PATCH /api/risks/:riskId/mark-occurred
```

**Body**:
```json
{
  "occurred": true,
  "detectedAt": "2025-01-20T14:30:00Z",
  "actualSeverity": "high",
  "actualImpact": {
    "scheduleDelayDays": 3,
    "budgetOverrunPercent": 5,
    "qualityScore": 0.75,
    "description": "Team communication failed for 2 days"
  },
  "rootCause": "PM fue de vacaciones sin avisar",
  "mitigatedAt": "2025-01-22T10:00:00Z"  // opcional si fue mitigado
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "risk_001",
    "type": "communication_breakdown",
    "occurred": true,
    "detectedAt": "2025-01-20T14:30:00Z",
    "actualSeverity": "high",
    "actualImpact": {...},
    "status": "occurred"
  }
}
```

#### B. Riesgos Manuales (Agregados por PM)
Para riesgos que PM agrega durante el proyecto, usar endpoint existente:

**Endpoint**:
```
PUT /api/projects/:projectId/risks/:riskId
```

**Body**:
```json
{
  "occurred": true,
  "actualSeverity": "high",
  "detectedAt": "2025-01-20T14:30:00Z",
  "actualImpact": {
    "scheduleDelayDays": 2,
    "budgetOverrunPercent": 3
  },
  "mitigatedAt": "2025-01-22T10:00:00Z"  // opcional
}
```

---

### 1.3 Obtener riesgos que ocurrieron

**Endpoint**:
```
GET /api/projects/:projectId/risks?occurred=true
```

**Response**: Array de riesgos donde `occurred: true`

---

### 1.4 Estados de un Riesgo durante el Monitoreo

| Estado | Ocurrió | Mitigado | Significado |
|--------|---------|----------|------------|
| `predicted` | null | - | Predicho, aún monitoreando |
| `occurred` | true | null | Ocurrió, pero no mitigado |
| `mitigated` | true | Date | Ocurrió y fue mitigado |
| `closed` | true/false | Date | Proyecto terminó, riesgo cerrado |

---

## FASE 2: CIERRE (Cuando termina el proyecto)

### Objetivo
El PM reporta cuál fue el resultado final del proyecto. El sistema:
1. Marca el proyecto como "completed"
2. Actualiza riesgos reales
3. **Crea un CASE en la case base (CBR aprende)**
4. Próximos proyectos se benefician del aprendizaje

### 2.1 Marcar proyecto como COMPLETADO

**STEP 1**: Cambiar estado del proyecto a "completed"

**Endpoint**:
```
PATCH /api/projects/:projectId/complete
```

**Body**: (vacío o minimal)
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Project marked as completed",
  "data": {
    "_id": "65f8a3b2c1d2e3f4g5h6i7j8",
    "projectName": "Mobile App MVP",
    "status": "completed",  // ← CAMBIÓ
    "completedAt": "2025-01-30T17:00:00Z"
  }
}
```

**¿Por qué este paso?**
- Validación: No puedes capturar outcome si proyecto no está "completed"
- Auditoria: Registro de cuándo terminó

---

### 2.2 Capturar Resultado del Proyecto

**STEP 2**: Enviar datos de resultado

**Endpoint**:
```
POST /api/projects/:projectId/outcome
```

**Body** (Estructura Completa):
```json
{
  "completed": true,
  "actualCompletedDate": "2025-01-30",
  "actualHours": 320,
  "budgetOverrun": 2500,              // en dinero
  "qualityScore": 0.82,               // 0-1
  "clientSatisfaction": 4.5,          // 1-5 estrellas
  "teamMorale": 4.0,                  // 1-5 escala
  
  // ← CRUCIAL: Riesgos que realmente ocurrieron
  "actualizedRisks": [
    {
      "type": "communication_breakdown",
      "occurred": true,
      "severity": "high",
      "scheduleDelayDays": 3,
      "budgetOverrunPercent": 5,
      "description": "Team miscommunication in week 2"
    },
    {
      "type": "scope_creep",
      "occurred": true,
      "severity": "medium",
      "scheduleDelayDays": 2,
      "description": "Client requested extra features mid-project"
    },
    {
      "type": "skill_gap",
      "occurred": false              // ← Predicho pero NO ocurrió
    }
  ],
  
  // Learning data para el sistema
  "lessonsLearned": [
    "Daily standups should be 15min strict, not 30min",
    "Need better async documentation tool"
  ],
  "successfulPractices": [
    "Sprint planning con ejemplo live coding",
    "Code review buddy system"
  ],
  "unsuccessfulPractices": [
    "Slack-only communication (missed messages)",
    "Weekly retrospectives instead of daily"
  ],
  "recommendations": [
    "Implement team wiki for async docs",
    "Use video standups for remote teams",
    "Weekly team building activity"
  ],
  
  "metrics": {
    "velocityAvg": 45,
    "defectRate": 0.02,
    "codeReviewTime": 2.5
  }
}
```

### 2.3 Response - CBR Learning

**Response**:
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "65f8a3b2c1d2e3f4g5h6i7j8",
      "name": "Mobile App MVP",
      "outcome": {
        "completed": true,
        "onTime": false,
        "delayDays": 5,
        "budgetOverrun": 2500,
        "qualityScore": 0.82,
        "actualRisks": [...]
      }
    },
    
    "case": {
      "id": "case_12345",
      "caseId": "CASE-2025-001",
      "addedToKnowledgeBase": true    // ← ¡IMPORTANTE!
    },
    
    "predictionAccuracy": {
      "correctPredictions": 8,        // Riesgos que dijimos que ocurriría y ocurrieron
      "missedRisks": 1,               // Riesgos que no predijimos pero ocurrieron
      "falsePositives": 2,            // Predijimos pero no ocurrieron
      "accuracy": 0.73
    },
    
    "learningReport": {
      "newPatternsDiscovered": [
        "Remote teams need 2x communication overhead"
      ],
      "similarCasesNow": 15,          // Sistema tiene más data para próximos proyectos
      "accuracyImprovement": "+3%"
    }
  }
}
```

**¿Qué pasó en backend?**

1. ✅ Proyecto marcado como "completed"
2. ✅ Riesgos predichos actualizados con `occurred: true/false`
3. ✅ **NEW CASE creado en CaseBase** con:
   - Características del proyecto (team, tech, scope)
   - Resultado real (qué riesgos ocurrieron)
   - Lecciones aprendidas
4. ✅ Próximos proyectos **similares** tendrán predicciones mejoradas

---

### 2.4 Obtener Formulario Pre-rellenado

Antes de capturar outcome, puedes pre-llenar el formulario con predicciones vs actual:

**Endpoint**:
```
GET /api/projects/:projectId/outcome/form
```

**Response**:
```json
{
  "success": true,
  "data": {
    "predictedRisks": [
      {
        "type": "communication_breakdown",
        "title": "Communication Breakdown",
        "severity": "high",
        "confidence": 0.78,       // ← DT confidence (no probability field)
        "probability": 0.82       // ← Only if source: 'cbr' (similarity)
      },
      // ...
    ],
    "projectDates": {
      "startDate": "2025-01-01",
      "plannedEndDate": "2025-02-28",
      "estimatedHours": 300
    },
    "form": {
      // Fields pre-rellenados para que PM complete
      "actualCompletedDate": null,
      "actualHours": null,
      "qualityScore": null
    }
  }
}
```

---

## FLUJO TEMPORAL COMPLETO

```
INICIO (PM crea proyecto)
    ↓
[10 min] POST /risks/predict
    ├─ DT detecta: 12 riesgos
    ├─ CBR aprende: 7 riesgos
    └─ Se guardan en Risk collection

EJECUCIÓN (Semanas 1-4)
    ↓
[Día 5] Risk ocurre: Communication Breakdown
    ├─ Frontend: PATCH /risks/{riskId}/mark-occurred
    │   Body: {occurred: true, detectedAt: "...", actualSeverity: "high"}
    └─ Backend: Actualiza Risk.occurred = true

[Día 10] Otro risk mitigado
    ├─ Frontend: PUT /projects/{id}/risks/{riskId}
    │   Body: {mitigatedAt: "...", actualImpact: {...}}
    └─ Backend: Guarda mitigatedAt

FINALIZACIÓN (Fin de proyecto)
    ↓
[Día 28] PM marca proyecto como terminado
    ├─ Frontend: PATCH /projects/{id}/complete
    └─ Backend: status = "completed"

[Día 28] PM reporta resultado
    ├─ Frontend: POST /projects/{id}/outcome
    │   Body: {
    │     completed: true,
    │     actualizedRisks: [{type: X, occurred: true/false}],
    │     lessonsLearned: [...]
    │   }
    └─ Backend:
        ├─ Actualiza riesgos reales
        ├─ Crea NEW CASE en CaseBase
        └─ Próximos proyectos aprenden ✅

APRENDIZAJE (Próximos proyectos)
    ↓
[Nuevo proyecto similar] POST /risks/predict
    ├─ DT detecta: riesgos potenciales (indicators, sin probability)
    ├─ CBR encuentra casos anteriores similares
    ├─ CBR Similarity = 0.85 → Probability = 0.85 (well-founded)
    └─ Frontend recibe: DT indicators (confidence) + CBR risks (probability)
```

---

## ENDPOINTS RESUMEN

### Monitoring Phase
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/projects/:id/risks` | Obtener riesgos predichos | ✅ Existente |
| GET | `/api/projects/:id/risks?occurred=true` | Obtener riesgos que ocurrieron | ✅ Existente |
| PATCH | `/api/risks/:id/mark-occurred` | Marcar riesgo como ocurrido | ✅ Implementado |
| PUT | `/api/projects/:id/risks/:riskId` | Actualizar riesgo manual | ✅ Existente |

### Completion Phase
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| PATCH | `/api/projects/:id/complete` | Marcar proyecto como completado | ✅ Existente |
| POST | `/api/projects/:id/outcome` | Capturar resultado (crea CASE) | ✅ Existente |
| GET | `/api/projects/:id/outcome/form` | Pre-llenar formulario outcome | ✅ Existente |

---

## REQUIRED BODY STRUCTURES

### Marcar Riesgo como Ocurrido
```json
{
  "occurred": true,
  "detectedAt": "ISO8601 date",
  "actualSeverity": "low|medium|high|critical",
  "actualImpact": {
    "scheduleDelayDays": number,
    "budgetOverrunPercent": number,
    "qualityScore": 0-1,
    "description": "string"
  },
  "rootCause": "string",
  "mitigatedAt": "ISO8601 date (optional)"
}
```

### Capturar Outcome (CRUCIAL)
```json
{
  "completed": true,
  "actualCompletedDate": "YYYY-MM-DD",
  "actualHours": number,
  "budgetOverrun": number,
  "qualityScore": 0-1,
  "clientSatisfaction": 1-5,
  "teamMorale": 1-5,
  
  "actualizedRisks": [
    {
      "type": "string",
      "occurred": true|false,
      "severity": "high|medium|low",
      "scheduleDelayDays": number,
      "budgetOverrunPercent": number,
      "description": "string"
    }
  ],
  
  "lessonsLearned": ["string"],
  "successfulPractices": ["string"],
  "unsuccessfulPractices": ["string"],
  "recommendations": ["string"],
  
  "metrics": {
    "key": "value"
  }
}
```

---

## KEY CONCEPTS

### Probability vs Confidence
- **`confidence`** (0-1): Presente en TODOS los riesgos. Qué tan seguro está DT de la detección
- **`probability`** (0-1): SOLO en riesgos CBR (`source: "cbr"`). Basado en similarity de casos históricos
  - DT riesgos: NO tienen `probability` field (ej. `source: "expert_rules"`)
  - CBR riesgos: SÍ tienen `probability` (ej. `source: "cbr"`)

### `occurred: true` vs `occurred: false`
- **true**: Riesgo se materializó durante el proyecto
- **false**: Riesgo fue predicho pero NO ocurrió
- **null**: Aún monitoreando (no decidido)

### `actualizedRisks` en outcome
**CRÍTICO**: Lista todos los riesgos que realmente pasaron, INCLUYENDO:
- ✅ Riesgos que predijimos y ocurrieron
- ✅ Riesgos que predijimos PERO NO ocurrieron (occurred: false)
- ✅ Riesgos que NO predijimos pero ocurrieron (agregar en actualizedRisks)

**IMPORTANTE**: En `actualizedRisks` NO enviar `probability` field. Solo: type, occurred, severity, impact, description


### CaseBase Learning
Cuando se captura outcome:
1. Sistema crea un CASE con características del proyecto
2. Lo asocia con riesgos reales que ocurrieron
3. Calcula similarity vs otros proyectos
4. Próximos proyectos similares tendrán probabilidades basadas en estos datos reales

---

## ERROR HANDLING

### Common Errors

**"Project must be marked as completed first"**
- Solución: Hacer `PATCH /complete` antes de `POST /outcome`

**"Risk not found"**
- Verificar que riskId es válido
- Riesgos predichos tienen _id diferente a riesgos manuales

**"Not authorized"**
- Solo PM del proyecto puede marcar riesgos como ocurridos
- Solo PM o org_admin pueden capturar outcome

**"Project is already completed"**
- No se puede modificar proyecto después de outcome capturado
- Crear nuevo proyecto para nueva predicción

---

## TESTING CHECKLIST

- [ ] GET /projects/:id/risks retorna riesgos predichos
- [ ] PATCH /risks/:id/mark-occurred cambia occurred a true
- [ ] PUT /projects/:id/risks/:riskId actualiza riesgo manual
- [ ] PATCH /projects/:id/complete marca status como "completed"
- [ ] POST /projects/:id/outcome crea case en CaseBase
- [ ] Response de outcome incluye case.addedToKnowledgeBase = true
- [ ] Próximo proyecto similar tiene probabilidades mejoradas
- [ ] Accuracy metrics se calculan correctamente
- [ ] Validation: No permitir outcome si status !== "completed"
- [ ] Validation: actualizedRisks debe contener todos los riesgos ocurridos

---

## QUICK REFERENCE - Probability Rules

### DT Risks (source: "expert_rules")
```javascript
{
  type: "communication_breakdown",
  severity: "high",
  confidence: 0.78,           // ✅ Present
  // NO probability field     // ❌ Not included
}
```

### CBR Risks (source: "cbr")
```javascript
{
  type: "communication_breakdown",
  severity: "high",
  confidence: 0.78,           // ✅ Present
  probability: 0.82,          // ✅ Similarity-based
}
```

### actualizedRisks in POST /outcome
```javascript
{
  type: "communication_breakdown",
  occurred: true,
  severity: "high",
  scheduleDelayDays: 3,
  budgetOverrunPercent: 5,
  description: "..."
  // NO probability field     // ❌ Never include
}
```

---

## IMPORTANT NOTES

1. **Order matters**: Siempre hacer `PATCH /complete` antes de `POST /outcome`
2. **actualizedRisks is learning data**: Es el corazón del sistema CBR
3. **Lessons learned**: Realmente se usan para mejorar futuras predicciones
4. **Case creation**: Es automático en `POST /outcome`, no hay paso extra
5. **No manual case creation**: No llamar a endpoints de case base, el sistema lo hace


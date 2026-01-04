# PROMPT: Frontend para Sistema de Predicción de Riesgos CBR

## 🎯 Objetivo

Necesito que implementes la interfaz frontend completa para un **Sistema de Predicción de Riesgos** que usa inteligencia artificial (CBR + Árbol de Decisión) para predecir riesgos en proyectos.

El backend ya está completamente implementado y funcional. Tu tarea es crear todas las vistas, componentes y flujos de usuario necesarios.

---

## 📡 Backend API Disponible

Base URL: `/api`

### 1. PREDICCIÓN DE RIESGOS

#### POST `/projects/:id/risks/predict`
Predice riesgos para un proyecto.

**Response:**
```json
{
  "success": true,
  "data": {
    "risks": [
      {
        "_id": "risk123",
        "riskType": "communication_breakdown",
        "severity": "high",
        "confidence": 0.87,
        "description": "Distributed team may face coordination challenges",
        "indicators": [
          "International team across 3+ timezones",
          "High synchronous communication needs",
          "5+ weekly meetings required"
        ],
        "mitigationStrategies": [
          "Establish 3-hour timezone overlap window (9am-12pm UTC)",
          "Create comprehensive async documentation in Confluence",
          "Daily standup meetings via video call",
          "Use Slack channels for quick coordination"
        ],
        "estimatedImpact": "15-20% schedule delay, budget overrun possible",
        "basedOnCases": [
          {
            "caseId": "case456",
            "projectName": "Multi-Region API Project",
            "similarity": 0.92,
            "outcome": {
              "delayDays": 21,
              "budgetOverrun": 18,
              "description": "Team struggled with timezone coordination"
            },
            "lessonsLearned": [
              "Daily standups were critical",
              "Async documentation saved the project"
            ]
          }
        ],
        "reasoning": {
          "treeContribution": {
            "weight": 0.7,
            "triggered": true,
            "rule": "High sync communication + international team"
          },
          "cbrContribution": {
            "weight": 0.3,
            "confidence": 0.85,
            "similarCasesCount": 3
          }
        }
      }
    ],
    "metadata": {
      "predictionDate": "2024-01-15T10:30:00Z",
      "caseBaseSize": 12,
      "systemPhase": 2,
      "phaseDescription": "Initial Learning (6-15 cases)",
      "treeWeight": 0.7,
      "cbrWeight": 0.3
    },
    "systemRecommendations": [
      "System is in Phase 2 - predictions gaining accuracy as case base grows",
      "12 historical cases available for learning",
      "Consider reviewing similar past projects before starting"
    ]
  }
}
```

#### GET `/projects/:id/risks`
Obtiene todos los riesgos predichos para un proyecto.

**Query params:**
- `status` (opcional): `active` | `resolved`
- `occurred` (opcional): `true` | `false`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "risk123",
      "riskType": "communication_breakdown",
      "severity": "high",
      "confidence": 0.87,
      "status": "active",
      "occurred": null,
      "feedback": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET `/risks/:id`
Obtiene detalles completos de un riesgo específico.

#### PUT `/risks/:id/feedback`
Actualiza feedback sobre un riesgo.

**Body:**
```json
{
  "usefulnessRating": 5,
  "accuracyRating": 4,
  "comments": "Very helpful prediction, we implemented the suggested mitigations"
}
```

---

### 2. CAPTURA DE RESULTADOS POST-PROYECTO

#### GET `/projects/:id/outcome/form`
Obtiene formulario pre-llenado con las predicciones de riesgos.

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "projectName": "Multi-Region Project",
      "estimatedDuration": { "value": 60, "unit": "days" },
      "estimatedBudget": 100000,
      "estimatedEndDate": "2024-03-15"
    },
    "predictedRisks": [
      {
        "_id": "risk123",
        "riskType": "communication_breakdown",
        "severity": "high",
        "description": "Timezone coordination challenges"
      }
    ],
    "form": {
      "actualEndDate": null,
      "actualDuration": { "value": null, "unit": "days" },
      "actualBudget": null,
      "finalQuality": null,
      "completionReason": null
    }
  }
}
```

#### POST `/projects/:id/outcome`
Captura el resultado final del proyecto.

**Body:**
```json
{
  "actualEndDate": "2024-03-20",
  "actualDuration": {
    "value": 65,
    "unit": "days"
  },
  "actualBudget": 105000,
  "finalQuality": 4,
  "completionReason": "successful",
  "actualRisks": [
    {
      "riskType": "communication_breakdown",
      "severity": "medium",
      "description": "Some timezone coordination issues arose",
      "mitigationActions": [
        "Implemented daily standups",
        "Created Slack channels for quick sync"
      ],
      "impact": "Caused 5 day delay but quality maintained"
    }
  ],
  "teamFeedback": {
    "satisfactionLevel": 4,
    "workloadLevel": 3,
    "communicationQuality": 4,
    "comments": "Good project overall, timezone challenges were manageable"
  },
  "lessonsLearned": [
    "Need 3-hour timezone overlap minimum",
    "Async documentation is critical for distributed teams",
    "Daily standups prevent major coordination issues"
  ],
  "successfulPractices": [
    "Daily standup meetings",
    "Comprehensive Confluence documentation",
    "Code reviews with async feedback"
  ],
  "unsuccessfulPractices": [
    "Relying only on email for critical decisions",
    "Not establishing overlap hours upfront"
  ],
  "recommendations": [
    "For future distributed projects, establish overlap hours in kickoff meeting",
    "Invest in documentation tools early"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "caseCreated": true,
    "caseId": "case789",
    "learningReport": {
      "accuracyImprovement": "+5%",
      "newPatterns": [
        "3-hour timezone overlap reduces communication risks by 40%"
      ],
      "recommendations": [
        "System learned from this outcome - future predictions will be more accurate"
      ],
      "predictionAccuracy": {
        "truePositives": 1,
        "falsePositives": 2,
        "falseNegatives": 0,
        "precision": 0.33,
        "recall": 1.0
      }
    }
  }
}
```

---

### 3. CASOS SIMILARES

#### GET `/projects/:id/similar-cases?limit=5`
Encuentra proyectos históricos similares.

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj123",
    "projectName": "New Distributed Project",
    "similarCases": [
      {
        "caseId": "case456",
        "projectName": "Multi-Region API Project",
        "similarity": 0.92,
        "breakdown": {
          "coordination": 0.95,
          "technical": 0.88,
          "team": 0.90,
          "management": 0.85,
          "organizational": 1.0
        },
        "outcome": {
          "completed": true,
          "delayDays": 21,
          "budgetOverrun": 18,
          "qualityScore": 3.5
        },
        "risks": [
          {
            "type": "communication_breakdown",
            "severity": "high",
            "description": "Timezone coordination was challenging"
          }
        ],
        "lessonsLearned": [
          "Daily standups were critical for coordination",
          "Async documentation saved time and reduced confusion"
        ]
      }
    ]
  }
}
```

---

### 4. INSIGHTS Y ESTADÍSTICAS

#### GET `/organizations/:id/risks/insights`
Obtiene patrones de riesgos y recomendaciones.

**Response:**
```json
{
  "success": true,
  "data": {
    "commonRisks": [
      {
        "type": "communication_breakdown",
        "frequency": 0.75,
        "avgSeverity": "high",
        "avgImpact": "18% delay, 12% budget overrun",
        "occurrenceRate": 0.67
      }
    ],
    "patterns": [
      "Projects with >3 timezones have 80% higher communication risk",
      "Teams <5 people rarely experience overload issues",
      "New technology adoption correlates with 45% skill gap risk"
    ],
    "recommendations": [
      "For distributed teams: Establish timezone overlap hours",
      "For new technologies: Plan 20% extra time for learning curve",
      "For large teams (>15): Invest in collaboration tools early"
    ],
    "riskTrends": {
      "increasing": ["technical_infrastructure"],
      "decreasing": ["communication_breakdown"],
      "stable": ["scope_creep"]
    },
    "successFactors": [
      {
        "factor": "Daily standups for distributed teams",
        "impact": "40% reduction in communication issues"
      }
    ]
  }
}
```

#### GET `/organizations/:id/risks/stats`
Estadísticas generales de riesgos.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "occurred": 28,
    "avoided": 12,
    "pending": 5,
    "byStatus": {
      "active": 5,
      "resolved": 40
    },
    "byType": {
      "communication_breakdown": 15,
      "skill_gap": 10,
      "team_overload": 8,
      "dependency_blockage": 5,
      "scope_creep": 4,
      "process_mismatch": 2,
      "technical_infrastructure": 1,
      "quality_degradation": 0
    },
    "bySeverity": {
      "critical": 3,
      "high": 12,
      "medium": 20,
      "low": 10
    },
    "occurrenceRate": 0.62
  }
}
```

#### GET `/organizations/:id/risks/accuracy`
Reporte de precisión de predicciones.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "precision": 0.87,
      "recall": 0.82,
      "accuracy": 0.85,
      "f1Score": 0.84
    },
    "byRiskType": {
      "communication_breakdown": {
        "precision": 0.90,
        "recall": 0.85,
        "predictions": 15,
        "truePositives": 12,
        "falsePositives": 2,
        "falseNegatives": 3
      }
    },
    "severityAccuracy": 0.78,
    "trend": {
      "direction": "improving",
      "improvement": "+12% vs last quarter"
    },
    "systemMaturity": {
      "phase": 2,
      "caseBaseSize": 12,
      "confidenceLevel": "growing"
    }
  }
}
```

#### GET `/organizations/:id/case-base/stats`
Estadísticas de la base de casos.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "byType": {
      "seed": 5,
      "generic": 0,
      "organizational": 7
    },
    "avgQuality": 4.2,
    "avgUsefulnessScore": 0.85,
    "mostReusedCases": [
      {
        "caseId": "case456",
        "projectName": "Multi-Region API",
        "timesReused": 8
      }
    ],
    "recentAdditions": 3
  }
}
```

#### GET `/organizations/:id/case-base/cases`
Lista de todos los casos históricos.

**Query params:**
- `type` (opcional): `seed` | `generic` | `organizational`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "cases": [
      {
        "id": "case456",
        "caseId": "case456",
        "projectName": "Multi-Region API Project",
        "type": "organizational",
        "completed": true,
        "delayDays": 21,
        "budgetOverrun": 18,
        "qualityScore": 3.5,
        "timesReused": 8,
        "usefulnessScore": 0.92,
        "completedAt": "2023-12-15T00:00:00Z"
      }
    ]
  }
}
```

---

## 🎨 Componentes UI Requeridos

### 1. **Vista Principal: Risk Dashboard**

**Ubicación**: `/projects/:id/risks`

**Elementos visuales:**

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Risk Prediction Dashboard                           │
│  Project: Multi-Region API Development                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Predict Risks] [View Similar Projects] [Export]       │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📊 System Status                                 │   │
│  │  • Phase: 2 (Initial Learning)                   │   │
│  │  • Cases: 12 historical projects                 │   │
│  │  • Confidence: Growing (Tree 70% / CBR 30%)      │   │
│  │  • Last update: 2 days ago                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚠️  HIGH RISK - Communication Breakdown          │   │
│  │  Confidence: 87%                                 │   │
│  │                                                   │   │
│  │  Description:                                     │   │
│  │  Distributed team may face coordination          │   │
│  │  challenges across timezones                      │   │
│  │                                                   │   │
│  │  📍 Indicators:                                   │   │
│  │  • International team (3+ timezones)             │   │
│  │  • High sync communication needs                 │   │
│  │  • 5+ weekly meetings required                   │   │
│  │                                                   │   │
│  │  💡 Recommended Actions:                          │   │
│  │  1. Establish 3-hour overlap window (9am-12pm)   │   │
│  │  2. Create async documentation (Confluence)      │   │
│  │  3. Daily standups via video                     │   │
│  │  4. Slack channels for quick sync                │   │
│  │                                                   │   │
│  │  📈 Estimated Impact:                             │   │
│  │  15-20% schedule delay, budget overrun possible  │   │
│  │                                                   │   │
│  │  🔍 Based on 3 similar projects:                 │   │
│  │  [View Details] [Mark as Reviewed]               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚠️  MEDIUM RISK - Skill Gap                      │   │
│  │  Confidence: 65%                                 │   │
│  │  [Expand details...]                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Botón "Predict Risks" que llama a `POST /projects/:id/risks/predict`
- Expandir/colapsar cada riesgo
- Código de colores por severidad (critical=rojo, high=naranja, medium=amarillo, low=verde)
- Barra de confianza visual (0-100%)
- Modal con casos similares al hacer clic en "View Details"
- Botón feedback en cada riesgo

### 2. **Modal: Casos Similares**

```
┌─────────────────────────────────────────────────────┐
│  📚 Similar Historical Projects                      │
│                                                      │
│  These projects had similar characteristics:        │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Multi-Region API Project (2023)               │  │
│  │ Similarity: 92%                               │  │
│  │                                               │  │
│  │ 📊 Similarity Breakdown:                      │  │
│  │  Coordination:    ████████████░ 95%           │  │
│  │  Technical:       ████████░░░░░ 88%           │  │
│  │  Team:            █████████░░░░ 90%           │  │
│  │  Management:      ████████░░░░░ 85%           │  │
│  │  Organizational:  ██████████████ 100%         │  │
│  │                                               │  │
│  │ 📈 Outcome:                                   │  │
│  │  • Completed with delays                     │  │
│  │  • 21 days delay (35% over estimate)         │  │
│  │  • 18% budget overrun                        │  │
│  │  • Quality: 3.5/5                            │  │
│  │                                               │  │
│  │ 🎓 Lessons Learned:                           │  │
│  │  • Daily standups were critical              │  │
│  │  • Async documentation saved time            │  │
│  │  • Need 3-hour timezone overlap minimum      │  │
│  │                                               │  │
│  │ ✅ What Worked:                               │  │
│  │  • Daily standup meetings                    │  │
│  │  • Code reviews with async feedback          │  │
│  │                                               │  │
│  │ ❌ What Didn't:                               │  │
│  │  • Email-only for critical decisions         │  │
│  │  • No overlap hours established              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [View 2 more similar projects]                      │
│                                                      │
│  [Close]                                             │
└─────────────────────────────────────────────────────┘
```

### 3. **Formulario: Post-Project Outcome**

**Ubicación**: `/projects/:id/outcome`

```
┌─────────────────────────────────────────────────────────┐
│  📝 Project Completion Form                             │
│  Multi-Region API Development                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ℹ️  Capturing this outcome helps improve future        │
│     predictions for your organization                   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  PROJECT METRICS                                         │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Actual End Date: [2024-03-20____] 📅                   │
│                                                          │
│  Actual Duration:                                        │
│   Estimated: 60 days                                    │
│   Actual: [65_] days (⚠️ 5 days delay)                  │
│                                                          │
│  Budget:                                                 │
│   Estimated: $100,000                                   │
│   Actual: [$105,000____] (⚠️ 5% over budget)            │
│                                                          │
│  Final Quality:                                          │
│   ⭐⭐⭐⭐☆ (4/5)                                       │
│                                                          │
│  Completion Reason:                                      │
│   ○ Successful  ● Cancelled  ○ Partial Delivery         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  PREDICTED RISKS - WHAT HAPPENED?                        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  We predicted these risks. Please indicate what          │
│  actually occurred:                                      │
│                                                          │
│  ☑️ Communication Breakdown (predicted HIGH)             │
│     Did this occur? ● Yes  ○ No                         │
│     Actual severity: ● Medium ○ High ○ Critical         │
│                                                          │
│     Description: [Timezone coordination was             │
│     challenging but manageable________________]          │
│                                                          │
│     What actions did you take?                          │
│     • [Implemented daily standups____________]          │
│     • [Created Slack channels________________]          │
│     [+ Add action]                                      │
│                                                          │
│     Impact: [5 day delay, quality maintained___]        │
│                                                          │
│  ☐ Skill Gap (predicted MEDIUM)                         │
│     Did this occur? ○ Yes  ● No                         │
│                                                          │
│  [+ Add unlisted risk that occurred]                    │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  TEAM FEEDBACK                                           │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Team Satisfaction: ⭐⭐⭐⭐☆ (4/5)                     │
│  Workload Level: ⭐⭐⭐☆☆ (3/5)                         │
│  Communication Quality: ⭐⭐⭐⭐☆ (4/5)                  │
│                                                          │
│  Comments: [Good project overall, timezone              │
│  challenges were manageable with right tools___]         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  LESSONS LEARNED                                         │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  What did you learn?                                     │
│  • [Need 3-hour timezone overlap minimum______]         │
│  • [Async documentation is critical__________]          │
│  • [Daily standups prevent major issues______]          │
│  [+ Add lesson]                                         │
│                                                          │
│  What practices worked well? ✅                          │
│  • [Daily standup meetings___________________]          │
│  • [Comprehensive documentation______________]          │
│  [+ Add practice]                                       │
│                                                          │
│  What didn't work? ❌                                    │
│  • [Email-only for critical decisions________]          │
│  • [No overlap hours established upfront_____]          │
│  [+ Add practice]                                       │
│                                                          │
│  Recommendations for future projects:                    │
│  • [Establish overlap hours in kickoff meeting]         │
│  • [Invest in documentation tools early______]          │
│  [+ Add recommendation]                                 │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [Cancel]  [Save Draft]  [Submit & Learn] ✅            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Flujo:**
1. Al abrir, cargar datos con `GET /projects/:id/outcome/form`
2. Pre-llenar campos estimados vs actuales
3. Mostrar riesgos predichos con checkboxes
4. Validar campos requeridos
5. Al submit, llamar `POST /projects/:id/outcome`
6. Mostrar modal de confirmación con reporte de aprendizaje

### 4. **Modal: Learning Report**

Después de capturar outcome, mostrar:

```
┌─────────────────────────────────────────────────────┐
│  🎓 System Learning Report                           │
│                                                      │
│  ✅ Project outcome captured successfully!          │
│                                                      │
│  Your input has improved the prediction system:     │
│                                                      │
│  📊 Prediction Accuracy:                             │
│  • True Positives: 1 (predicted and occurred)       │
│  • False Positives: 2 (predicted but didn't occur)  │
│  • False Negatives: 0 (didn't predict but occurred) │
│  • Precision: 33% | Recall: 100%                    │
│                                                      │
│  🎯 Accuracy Improvement: +5%                        │
│                                                      │
│  🧠 New Patterns Learned:                            │
│  • 3-hour timezone overlap reduces communication    │
│    risks by 40%                                     │
│                                                      │
│  📈 Case Base Growth:                                │
│  • Before: 12 cases                                 │
│  • After: 13 cases                                  │
│  • System Phase: 2 → 2 (approaching Phase 3)        │
│                                                      │
│  💡 For Future Projects:                             │
│  • System will use this project's experience        │
│  • Similar projects will get better predictions     │
│  • Your organization's AI is learning!              │
│                                                      │
│  [View Organization Insights] [Close]                │
└─────────────────────────────────────────────────────┘
```

### 5. **Vista: Organization Insights**

**Ubicación**: `/organizations/:id/insights/risks`

```
┌─────────────────────────────────────────────────────────┐
│  📊 Organization Risk Intelligence                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Overview] [Trends] [Recommendations] [Case Base]      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎯 SYSTEM MATURITY                               │   │
│  │                                                  │   │
│  │  Phase: 2 - Initial Learning                    │   │
│  │  Progress: ████████░░░░░ 12/15 cases            │   │
│  │                                                  │   │
│  │  Next milestone: 3 more projects to Phase 3     │   │
│  │  Prediction confidence: Growing                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📈 COMMON RISKS                                  │   │
│  │                                                  │   │
│  │  1. Communication Breakdown        75% frequency │   │
│  │     └─ Usually HIGH severity                     │   │
│  │     └─ Avg impact: 18% delay, 12% overrun       │   │
│  │     └─ Occurs in 67% of predicted cases         │   │
│  │                                                  │   │
│  │  2. Skill Gap                      45% frequency │   │
│  │     └─ Usually MEDIUM severity                   │   │
│  │     └─ Avg impact: 10% delay                    │   │
│  │                                                  │   │
│  │  3. Team Overload                  30% frequency │   │
│  │     └─ Usually MEDIUM severity                   │   │
│  │     └─ Avg impact: 15% delay                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 DISCOVERED PATTERNS                           │   │
│  │                                                  │   │
│  │  • Projects with >3 timezones have 80% higher   │   │
│  │    communication risk                           │   │
│  │                                                  │   │
│  │  • Teams <5 people rarely experience overload   │   │
│  │                                                  │   │
│  │  • New technology adoption → 45% skill gap risk │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 💡 RECOMMENDATIONS                               │   │
│  │                                                  │   │
│  │  Based on your historical data:                 │   │
│  │                                                  │   │
│  │  🌍 For distributed teams:                       │   │
│  │  → Establish timezone overlap hours             │   │
│  │  → Impact: 40% reduction in comm. issues        │   │
│  │                                                  │   │
│  │  🚀 For new technologies:                        │   │
│  │  → Plan 20% extra time for learning             │   │
│  │  → Impact: Prevents scope creep                 │   │
│  │                                                  │   │
│  │  👥 For large teams (>15):                       │   │
│  │  → Invest in collaboration tools early          │   │
│  │  → Impact: Better coordination                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📊 PREDICTION ACCURACY                           │   │
│  │                                                  │   │
│  │  Overall: 85% ████████████████░░░░              │   │
│  │  Trend: ↗ +12% vs last quarter                  │   │
│  │                                                  │   │
│  │  By Risk Type:                                  │   │
│  │  • Communication: 90% ██████████████████░░      │   │
│  │  • Skill Gap: 78% ███████████████░░░░░          │   │
│  │  • Team Overload: 82% ████████████████░░░░      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 6. **Vista: Case Base Explorer**

```
┌─────────────────────────────────────────────────────────┐
│  📚 Historical Projects Case Base                        │
│                                                          │
│  Filter: [All Types ▼] [All Outcomes ▼] [Search...]     │
│                                                          │
│  Total: 12 cases  (5 seeds, 7 organizational)           │
│  Avg Quality: 4.2/5  |  Most reused: Multi-Region API   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏢 Multi-Region API Project                      │   │
│  │ Organizational Case  •  Completed Dec 2023       │   │
│  │                                                  │   │
│  │ Outcome: ⚠️ Delayed but successful               │   │
│  │ • 21 days delay (35% over estimate)             │   │
│  │ • 18% budget overrun                            │   │
│  │ • Quality: 3.5/5                                │   │
│  │                                                  │   │
│  │ Risks that occurred:                            │   │
│  │ • Communication Breakdown (HIGH)                │   │
│  │ • Process Mismatch (MEDIUM)                     │   │
│  │                                                  │   │
│  │ Reused 8 times  •  Usefulness: 92%              │   │
│  │                                                  │   │
│  │ [View Full Details]                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🌱 SEED: Distributed Team Pattern               │   │
│  │ Industry Benchmark  •  PMI PMBOK Study           │   │
│  │                                                  │   │
│  │ Generic pattern from literature                  │   │
│  │ Reused 12 times  •  Usefulness: 75%             │   │
│  │ [View Details]                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Elementos de Diseño

### Colores por Severidad
```css
.risk-critical { 
  background: #ef4444; /* red-500 */
  border: #dc2626; /* red-600 */
}
.risk-high { 
  background: #f97316; /* orange-500 */
  border: #ea580c; /* orange-600 */
}
.risk-medium { 
  background: #eab308; /* yellow-500 */
  border: #ca8a04; /* yellow-600 */
}
.risk-low { 
  background: #22c55e; /* green-500 */
  border: #16a34a; /* green-600 */
}
```

### Iconos
- 🎯 Risk prediction
- ⚠️ Risk alert
- 📊 Statistics/metrics
- 🔍 Similar cases/search
- 💡 Recommendations
- 📈 Trends/growth
- 🎓 Learning/lessons
- ✅ Success/completed
- ❌ Failure/unsuccessful
- 🌍 Geographic/distributed
- 🚀 Technology/innovation
- 👥 Team/people

---

## 🔄 Flujos de Usuario

### Flujo 1: Predecir Riesgos de Nuevo Proyecto

1. Usuario crea proyecto (flujo existente)
2. Usuario navega a `/projects/:id/risks`
3. Usuario ve prompt: "No risks predicted yet. Predict now?"
4. Usuario hace clic en "Predict Risks"
5. Loading spinner: "Analyzing project... Consulting 12 historical cases..."
6. Se muestran riesgos predichos con animación
7. Usuario puede expandir cada riesgo para ver detalles
8. Usuario puede hacer clic en "View Similar Projects"
9. Modal muestra 3-5 proyectos similares
10. Usuario puede dar feedback sobre la utilidad de cada riesgo

### Flujo 2: Monitorear Riesgos Durante Proyecto

1. Usuario navega a `/projects/:id/risks`
2. Ve lista de riesgos activos
3. Para cada riesgo puede:
   - Ver indicadores en tiempo real
   - Marcar como "En revisión"
   - Añadir notas
   - Dar rating de utilidad
   - Ver estrategias de mitigación

### Flujo 3: Capturar Outcome Post-Proyecto

1. Usuario completa proyecto (marca como completed)
2. Sistema muestra notificación: "Help us learn! Capture project outcome"
3. Usuario hace clic en notificación → va a `/projects/:id/outcome`
4. Formulario pre-llenado con:
   - Fechas estimadas vs espacio para actuales
   - Lista de riesgos predichos con checkboxes
   - Campos para feedback del equipo
5. Usuario completa formulario (10-15 minutos)
6. Usuario hace clic en "Submit & Learn"
7. Loading: "Processing outcome... Creating case... Updating predictions..."
8. Modal muestra Learning Report
9. Usuario puede:
   - Ver mejoras de precisión
   - Ver cómo este proyecto ayudará al futuro
   - Ir a Organization Insights

### Flujo 4: Analizar Insights de Organización

1. Usuario navega a `/organizations/:id/insights/risks`
2. Ve dashboard con:
   - Madurez del sistema
   - Riesgos más comunes
   - Patrones descubiertos
   - Recomendaciones basadas en datos
   - Precisión de predicciones
3. Usuario puede filtrar por:
   - Período de tiempo
   - Tipo de proyecto
   - Tipo de riesgo
4. Usuario puede exportar reportes

---

## 📋 Requisitos Técnicos

### Stack Sugerido
- **React** (o tu framework preferido)
- **React Query** o **SWR** para fetching
- **Recharts** o **Chart.js** para gráficas
- **Tailwind CSS** para estilos
- **React Hook Form** para formularios
- **Zustand** o **Context API** para estado global

### Consideraciones de UX

1. **Loading States**: Mostrar skeletons mientras carga
2. **Error Handling**: Mensajes claros si algo falla
3. **Empty States**: Mensajes útiles cuando no hay datos
4. **Optimistic Updates**: UI responsiva antes de confirmación backend
5. **Tooltips**: Explicar términos técnicos (precision, recall, CBR, etc.)
6. **Mobile Responsive**: Todo debe funcionar en móvil
7. **Accessibility**: ARIA labels, keyboard navigation
8. **Animations**: Transiciones suaves pero no excesivas

### Validaciones

**Formulario de Outcome:**
- Fecha actual no puede ser antes de fecha estimada inicio
- Budget actual debe ser número positivo
- Ratings deben estar entre 1-5
- Al menos un campo de "lessons learned" requerido
- Si un riesgo "occurred = true", descripción es obligatoria

### Gestión de Estado

```javascript
// Ejemplo de estructura de estado
const projectRisks = {
  isLoading: false,
  predictions: [],
  metadata: {
    phase: 2,
    caseBaseSize: 12,
    confidence: 'growing'
  },
  error: null
};

const organizationInsights = {
  commonRisks: [],
  patterns: [],
  recommendations: [],
  accuracy: {},
  isLoading: false
};
```

---

## 🎯 Casos de Uso Específicos

### Caso 1: Proyecto con Alto Riesgo
Usuario ve riesgo CRITICAL → expande detalles → ve 3 casos similares que también tuvieron ese riesgo → implementa las estrategias de mitigación sugeridas → da feedback positivo

### Caso 2: Sistema en Fase 1 (Bootstrap)
Usuario predice riesgos en proyecto nuevo → sistema muestra banner: "System is learning. Predictions based on industry best practices. Complete projects to improve accuracy."

### Caso 3: Sistema Maduro (Fase 4-5)
Usuario predice riesgos → sistema muestra alta confianza → predicciones incluyen múltiples casos organizacionales similares → recomendaciones muy específicas a la organización

### Caso 4: Post-Mortem Completo
PM completa formulario detallado → sistema crea caso rico en aprendizajes → próximo proyecto similar obtiene predicción precisa basada en este caso

---

## 🚀 Prioridad de Implementación

### MVP (Mínimo Viable)
1. ✅ Risk Dashboard (vista principal)
2. ✅ Botón "Predict Risks" funcional
3. ✅ Tarjetas de riesgo con detalles básicos
4. ✅ Formulario post-project outcome

### Fase 2
5. Modal de casos similares
6. Organization insights básico
7. Gráficas de estadísticas
8. Sistema de feedback en riesgos

### Fase 3
9. Case base explorer
10. Exportación de reportes
11. Notificaciones de seguimiento
12. Dashboard avanzado con trends

---

## 📊 Datos de Ejemplo para Testing

```javascript
// Mock data para desarrollo sin backend
const mockRiskPrediction = {
  risks: [
    {
      _id: "risk1",
      riskType: "communication_breakdown",
      severity: "high",
      confidence: 0.87,
      description: "Distributed team may face coordination challenges",
      indicators: [
        "International team across 3+ timezones",
        "High synchronous communication needs"
      ],
      mitigationStrategies: [
        "Establish 3-hour timezone overlap window",
        "Create comprehensive async documentation"
      ],
      basedOnCases: [
        {
          projectName: "Multi-Region API",
          similarity: 0.92
        }
      ]
    }
  ],
  metadata: {
    caseBaseSize: 12,
    systemPhase: 2,
    treeWeight: 0.7,
    cbrWeight: 0.3
  }
};
```

---

## ✅ Checklist de Implementación

Frontend debe incluir:

- [ ] Vista de dashboard de riesgos
- [ ] Llamada a API de predicción con loading state
- [ ] Tarjetas de riesgo con expand/collapse
- [ ] Modal de casos similares
- [ ] Barra de similitud visual (por dimensión)
- [ ] Formulario completo de captura de outcome
- [ ] Pre-llenado de campos con datos del proyecto
- [ ] Validaciones de formulario
- [ ] Modal de learning report post-submit
- [ ] Vista de organization insights
- [ ] Gráficas de estadísticas (chart library)
- [ ] Vista de case base explorer
- [ ] Sistema de feedback (star rating)
- [ ] Tooltips explicativos para términos técnicos
- [ ] Manejo de errores con mensajes útiles
- [ ] Estados vacíos con CTAs claros
- [ ] Responsive design (mobile + desktop)
- [ ] Accesibilidad básica (ARIA labels)
- [ ] Loading skeletons para mejor UX
- [ ] Animaciones suaves de transición

---

## 🎨 Referencias Visuales

**Inspiración de diseño:**
- Linear (para tarjetas de issues/risks)
- Notion (para forms y rich content)
- Vercel Dashboard (para stats y metrics)
- GitHub Insights (para gráficas y trends)

**Paleta de colores:**
- Use semantic colors (success, warning, danger, info)
- Dark mode opcional pero recomendado
- Énfasis en legibilidad de datos

---

## 📞 Integración con Backend

**Base URL**: Define en `.env`
```
REACT_APP_API_URL=http://localhost:3000/api
```

**Headers requeridos:**
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Manejo de errores:**
```javascript
// Ejemplo de error handling
try {
  const response = await fetch(`${API_URL}/projects/${id}/risks/predict`, {
    method: 'POST',
    headers: headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Prediction failed');
  }
  
  const data = await response.json();
  return data.data;
  
} catch (error) {
  // Show user-friendly error message
  toast.error('Failed to predict risks. Please try again.');
  console.error(error);
}
```

---

## ✨ Extras Opcionales

Si tienes tiempo, añade:

1. **Tour guiado**: Para primera vez que usuario ve el sistema
2. **Comparación de proyectos**: Comparar 2 proyectos lado a lado
3. **Export PDF**: Reportes exportables en PDF
4. **Real-time updates**: WebSocket para updates en tiempo real
5. **Risk timeline**: Línea de tiempo de cuando se identificó cada riesgo
6. **Colaboración**: Múltiples PMs pueden comentar en riesgos
7. **Plantillas**: Plantillas de estrategias de mitigación
8. **Integración calendario**: Recordatorios para revisar riesgos

---

**¡Implementa este sistema y tendrás una herramienta de IA predictiva de clase mundial para gestión de riesgos!** 🚀

El backend está 100% listo y testeado. Solo necesitas crear la UI que consuma estos endpoints.

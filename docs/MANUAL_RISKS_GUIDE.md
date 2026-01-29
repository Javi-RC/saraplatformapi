# Sistema de Riesgos Manuales - Guía de Uso

## 🎯 ¿Qué es?

Ahora el **Project Manager** puede:
1. **Añadir nuevos riesgos** descubiertos DURANTE la ejecución del proyecto
2. **Actualizar esos riesgos** a medida que evolucionan
3. **Eliminar riesgos** antes de que se complete el proyecto
4. **Al finalizar proyecto**: Estos riesgos se **incluyen automáticamente en el CBR** para aprender

---

## 📋 Flujo Completo

```
1. Proyecto creado
   ├─ Sistema predice riesgos automáticos (Decision Tree + CBR)
   └─ Estado: "predicted"

2. DURANTE EJECUCIÓN (Lo nuevo)
   ├─ PM descubre nuevos riesgos no predichos
   ├─ POST /api/projects/:id/risks/manual  ← Añade riesgo
   ├─ PUT /api/projects/:id/risks/:riskId   ← Actualiza riesgo
   ├─ GET /api/projects/:id/risks/manual    ← Ve riesgos manuales
   └─ DELETE /api/projects/:id/risks/:riskId ← Elimina riesgo

3. FINALIZAR PROYECTO
   ├─ POST /api/projects/:id/outcome  ← Captura resultados
   ├─ Los riesgos manuales se incluyen automáticamente
   └─ Se guardan en CaseBase para futuras predicciones

4. FUTURO PROYECTO SIMILAR
   └─ CBR predice esos riesgos manuales porque los aprendió
```

---

## 🔌 Endpoints

### 1️⃣ Añadir un riesgo manual

```bash
POST /api/projects/{projectId}/risks/manual
Authorization: Bearer {token}

Body:
{
  "type": "vendor_lock_in",           # O cualquier tipo del enum
  "title": "Dependencia de API externa",
  "description": "El proveedor X no garantiza uptime > 99%",
  "severity": "high",
  "probability": 0.65,                # 0-1
  "category": "technical",            # coordination|technical|team|management|organizational
  "rootCause": "Falta de alternativa en el mercado",
  "indicators": [
    "Sin contrato SLA",
    "Proveedor con antecedentes de downtime"
  ],
  "recommendations": [
    "Implementar cache local",
    "Investigar alternativas"
  ]
}

Response (201 Created):
{
  "success": true,
  "message": "Manual risk added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "project": "507f1f77bcf86cd799439012",
    "type": "vendor_lock_in",
    "title": "Dependencia de API externa",
    "severity": "high",
    "probability": 0.65,
    "source": "manual",           ← Marcado como manual
    "status": "monitoring",
    "createdAt": "2026-01-20T10:30:00Z"
  }
}
```

### 2️⃣ Obtener riesgos manuales de un proyecto

```bash
GET /api/projects/{projectId}/risks/manual
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "count": 3,
    "risks": [
      {
        "_id": "507f...",
        "type": "vendor_lock_in",
        "title": "Dependencia de API externa",
        "severity": "high",
        "probability": 0.65,
        "status": "monitoring",
        "createdAt": "2026-01-20T10:30:00Z"
      },
      // ... más riesgos
    ]
  }
}
```

### 3️⃣ Actualizar un riesgo manual

```bash
PUT /api/projects/{projectId}/risks/{riskId}
Authorization: Bearer {token}

Body:
{
  "severity": "critical",      # Se escaló la severidad
  "probability": 0.85,         # Aumentó la probabilidad
  "status": "occurred",        # Ya ocurrió el riesgo
  "rootCause": "Proveedor anunció discontinuidad del servicio"
}

Response (200 OK):
{
  "success": true,
  "message": "Risk updated successfully",
  "data": {
    // ... riesgo actualizado
  }
}
```

### 4️⃣ Eliminar un riesgo manual (antes de completar proyecto)

```bash
DELETE /api/projects/{projectId}/risks/{riskId}
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "message": "Risk deleted successfully"
}

# ❌ Error si proyecto ya está completado:
{
  "success": false,
  "error": "Cannot delete risks from completed projects"
}
```

### 5️⃣ Completar proyecto CON riesgos manuales

```bash
POST /api/projects/{projectId}/outcome
Authorization: Bearer {token}

Body:
{
  "completed": true,
  "qualityScore": 4,
  "clientSatisfaction": 4,
  "teamMorale": 3,
  "budgetOverrun": 3.5,
  
  # Los riesgos manuales se incluyen automáticamente si pasamos actualizedRisks
  "actualizedRisks": [
    {
      "type": "vendor_lock_in",
      "occurred": true,              # ✅ Este riesgo ocurrió
      "severity": "high",
      "scheduleDelayDays": 2,
      "budgetOverrunPercent": 3.5,
      "rootCause": "Downtime inesperado de API"
    }
  ],
  
  "lessonsLearned": [
    "Necesitamos redundancia en APIs críticas"
  ],
  "recommendations": [
    "Implementar circuit breaker pattern"
  ]
}

Response (200 OK):
{
  "success": true,
  "message": "Outcome captured successfully",
  "data": {
    "case": {
      "id": "507f...",
      "addedToKnowledgeBase": true   # ✅ Se guardó en CBR
    },
    "message": "Outcome captured successfully. System has learned from this project."
  }
}
```

---

## 📊 Cómo el CBR aprende

### Proyecto 1 (Ya completado)
```
PM añade manual: "vendor_lock_in" 
  → Proyecto completa con actualizedRisks
  → Se guarda en CaseBase.solution.actualRisks
```

### Proyecto 2 (Nuevo similar)
```
Sistema predice riesgos automáticos
  ↓
CBR busca casos similares
  ↓
Encuentra Proyecto 1 (similaridad 0.82)
  ↓
Ve que tuvo "vendor_lock_in"
  ↓
✅ PREDICE "vendor_lock_in" para Proyecto 2
  ↓
PM ve este riesgo en la predicción
  ↓
"Este riesgo es exacto, similar al proyecto anterior"
```

---

## 🔄 Flujo de Datos Completo

```
┌─────────────────────────────────────────────────┐
│ 1. Proyecto Creado - Auto Prediction            │
├─────────────────────────────────────────────────┤
│ Decision Tree: communication_breakdown (high)   │
│ CBR: (sin casos al inicio)                      │
│ Status: "predicted"                             │
└──────────────┬──────────────────────────────────┘
               │
        DURANTE EJECUCIÓN
               │
┌──────────────▼──────────────────────────────────┐
│ 2. PM Añade Riesgos Manuales                    │
├─────────────────────────────────────────────────┤
│ POST /api/projects/:id/risks/manual             │
│ Nuevo: vendor_lock_in (high)                    │
│ Status: "monitoring"                            │
│ Source: "manual"  ← Diferente a "expert_rules" │
└──────────────┬──────────────────────────────────┘
               │
        DURANTE EJECUCIÓN
               │
┌──────────────▼──────────────────────────────────┐
│ 3. Proyecto Completado - Outcome               │
├─────────────────────────────────────────────────┤
│ POST /api/projects/:id/outcome                  │
│ actualizedRisks: [                              │
│   {                                             │
│     type: "communication_breakdown",            │
│     occurred: true,  ✅ Ocurrió                │
│     severity: "high"                            │
│   },                                            │
│   {                                             │
│     type: "vendor_lock_in",                     │
│     occurred: true   ✅ Ocurrió                │
│   }                                             │
│ ]                                               │
└──────────────┬──────────────────────────────────┘
               │
        GUARDA EN CBR
               │
┌──────────────▼──────────────────────────────────┐
│ 4. CaseBase - Proyecto Guardado Como Caso      │
├─────────────────────────────────────────────────┤
│ solution.actualRisks: [                         │
│   - communication_breakdown                     │
│   - vendor_lock_in  ← Aprendió el riesgo manual│
│ ]                                               │
└──────────────┬──────────────────────────────────┘
               │
        FUTURO PROYECTO SIMILAR
               │
┌──────────────▼──────────────────────────────────┐
│ 5. CBR Predice Riesgos (Incluye Manuales)      │
├─────────────────────────────────────────────────┤
│ CBR Retrieval:                                  │
│   ✅ communication_breakdown (basado en caso)   │
│   ✅ vendor_lock_in (basado en riesgo manual!)  │
│ Source: "cbr"                                   │
│ Probability: 0.72 (basado en similaridad)       │
└─────────────────────────────────────────────────┘
```

---

## ✅ Validaciones

| Acción | Validación |
|--------|-----------|
| **Añadir riesgo** | Solo PM, proyecto no completado |
| **Actualizar riesgo** | Solo PM, riesgo manual, proyecto no completado |
| **Eliminar riesgo** | Solo PM, riesgo manual, proyecto NO completado |
| **Incluir en CBR** | Automático si pasas en `actualizedRisks` |

---

## 🚀 Casos de Uso Prácticos

### Caso 1: Descubrir nuevo riesgo en Semana 2

```javascript
// PM descubre: "El proveedor API tiene issues de rate-limiting"
POST /api/projects/123/risks/manual
{
  "type": "third_party_api_downtime",
  "title": "Rate-limiting no documentado en API",
  "description": "API de pagos rechaza peticiones después de 100/min",
  "severity": "high",
  "probability": 0.75,
  "category": "technical",
  "rootCause": "Falta de especificación en contrato"
}

// Se guarda inmediatamente
// PM y equipo ven este riesgo en el dashboard
// Se puede monitorear y actualizar
```

### Caso 2: El riesgo ocurrió, cambiar estado

```javascript
// Semana 4: API tuvo downtime de 2 horas
PUT /api/projects/123/risks/507f.../
{
  "status": "occurred",
  "severity": "critical"
}

// Al finalizar el proyecto:
POST /api/projects/123/outcome
{
  "actualizedRisks": [
    {
      "type": "third_party_api_downtime",
      "occurred": true,
      "scheduleDelayDays": 1,
      "budgetOverrunPercent": 2.5
    }
  ]
}

// CBR aprende: Este tipo de proyecto + este tipo de vendor = riesgo alto
```

### Caso 3: El riesgo NO ocurrió (falsa alarma)

```javascript
// Al finalizar:
POST /api/projects/123/outcome
{
  "actualizedRisks": [
    {
      "type": "third_party_api_downtime",
      "occurred": false,  // ❌ No pasó
      "avoidanceReason": "Implementamos cache y fue suficiente"
    }
  ]
}

// CBR aprende: Este riesgo puede mitigarse con cache
```

---

## 📈 Impacto en el CBR

| Métrica | Antes | Después |
|---------|-------|---------|
| **Riesgos predichos** | Solo automáticos | Automáticos + Manuales |
| **Precisión CBR** | Moderada | Mejor (aprender de reales) |
| **Cobertura** | Limitada a reglas | Expandida con experiencia |
| **Confianza** | 0.7-0.8 | 0.8-0.95 |

---

## 🛠️ Implementación Técnica

- **Archivo nuevo:** `src/services/manualRisk.service.js`
- **Endpoints nuevos:** 5 rutas en `src/routes/risk.routes.js`
- **Controllers nuevos:** 4 métodos en `src/controllers/risk.controller.js`
- **Integración CBR:** Automática en `captureProjectOutcome()`

---

## ⚡ Resumen

**Antes:**
- Riesgos solo automáticos → CBR no aprende casos nuevos → Sistema estancado

**Ahora:**
- PM añade riesgos reales → Se guardan en CBR → Futuras predicciones mejoran
- El sistema **aprende de la experiencia real** del equipo
- Cada proyecto contribuye al conocimiento colectivo

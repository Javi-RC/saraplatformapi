# ✅ SOLUCIÓN IMPLEMENTADA: Riesgos Manuales en CBR

## 📌 Lo que acabo de hacer

He implementado un **sistema completo para que el PM pueda añadir riesgos manualmente durante la ejecución del proyecto** y que se aprendan automáticamente en el CBR.

---

## 🎯 Cambios Realizados

### 1. **Nuevo Servicio** (`manualRisk.service.js`)
- `addManualRisk()` - Añadir riesgo
- `updateManualRisk()` - Actualizar riesgo
- `getProjectManualRisks()` - Listar riesgos manuales
- `deleteManualRisk()` - Eliminar riesgo

### 2. **Nuevos Endpoints** en `risk.controller.js`
- `addManualRisk()` - POST
- `updateManualRisk()` - PUT
- `getProjectManualRisks()` - GET
- `deleteManualRisk()` - DELETE

### 3. **Nuevas Rutas** en `risk.routes.js`
```
POST   /api/projects/:id/risks/manual          # Añadir riesgo
GET    /api/projects/:id/risks/manual          # Listar manuales
PUT    /api/projects/:id/risks/:riskId         # Actualizar
DELETE /api/projects/:id/risks/:riskId         # Eliminar
```

### 4. **Integración en CBR** (`postProject.service.js`)
Cuando el proyecto se completa, los riesgos manuales se incluyen automáticamente en los `actualizedRisks` que se guardan en CaseBase.

---

## 🔄 Flujo Visual

```
┌──────────────────────────────────────────────────────────────┐
│ PROYECTO EN EJECUCIÓN                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Week 1: Proyecto creado                                     │
│  ├─ Decision Tree: communication_breakdown, skill_gap, etc   │
│  └─ CBR: (sin casos al inicio)                               │
│                                                               │
│  Week 2: PM DESCUBRE NUEVO RIESGO (LO NUEVO)                │
│  ├─ "Descubrimos que el vendor es crítico"                  │
│  ├─ POST /api/projects/:id/risks/manual                      │
│  │  ├─ type: "vendor_lock_in"                                │
│  │  ├─ severity: "high"                                      │
│  │  ├─ probability: 0.65                                     │
│  │  └─ rootCause: "Deep integration"                         │
│  └─ ✅ Riesgo guardado en Risk collection                   │
│                                                               │
│  Week 3: PM ACTUALIZA RIESGO                                │
│  ├─ PUT /api/projects/:id/risks/:riskId                     │
│  │  ├─ probability: 0.82 (aumentó)                          │
│  │  └─ severity: "critical"                                 │
│  └─ ✅ Riesgo actualizado en tiempo real                    │
│                                                               │
│  Week 4-8: Proyecto continúa...                             │
│                                                               │
│  Final: Proyecto completado                                 │
│  └─ POST /api/projects/:id/outcome                          │
│     ├─ actualizedRisks: [...]                               │
│     ├─ Incluye vendor_lock_in (ocurrió: false/true)         │
│     └─ ✅ Se guarda en CaseBase automáticamente             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ CASEBASE (CONOCIMIENTO)                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Proyecto 1 guardado con:                                   │
│  ├─ solution.actualRisks:                                    │
│  │  ├─ communication_breakdown                               │
│  │  └─ vendor_lock_in ← APRENDIDO                           │
│  └─ result.lessonsLearned:                                   │
│     └─ "Vendor lock-in es crítico"                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ FUTURO: PROYECTO SIMILAR                                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Proyecto 2 (similaridad 0.81 con Proyecto 1)              │
│  ├─ Decision Tree: automatic risks                          │
│  └─ CBR RETRIEVAL:                                          │
│     ├─ communication_breakdown (de caso similar)            │
│     └─ ✅ vendor_lock_in (¡DEL RIESGO MANUAL!)              │
│                                                               │
│  PM ve la predicción:                                        │
│  "Exacto, en proyecto anterior tuvimos ese problema"        │
│  ✅ El sistema APRENDIÓ del riesgo manual                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Añadir Riesgo Manual

```bash
POST /api/projects/607f1f77bcf86cd799439011/risks/manual
Authorization: Bearer eyJhbGc...

{
  "type": "vendor_lock_in",
  "title": "Dependencia crítica de Stripe",
  "description": "Stripe es nuestro único proveedor de pagos sin alternativa viable",
  "severity": "high",
  "probability": 0.7,
  "category": "technical",
  "rootCause": "No planeamos abstracción desde el inicio",
  "indicators": ["45+ archivos con dependencia directa"],
  "recommendations": ["Crear PaymentGateway interface"]
}

RESPONSE (201):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "type": "vendor_lock_in",
    "source": "manual",    ← Marcado como manual
    "status": "monitoring"
  }
}
```

### Ejemplo 2: Ver Riesgos Manuales

```bash
GET /api/projects/607f1f77bcf86cd799439011/risks/manual

RESPONSE (200):
{
  "count": 2,
  "risks": [
    {
      "type": "vendor_lock_in",
      "title": "Dependencia crítica de Stripe",
      "severity": "high",
      "probability": 0.7,
      "source": "manual"
    },
    {
      "type": "legacy_code_maintenance",
      "title": "Código legacy sin tests",
      "severity": "medium",
      "probability": 0.6,
      "source": "manual"
    }
  ]
}
```

### Ejemplo 3: Al Completar Proyecto (CBR aprende)

```bash
POST /api/projects/607f1f77bcf86cd799439011/outcome

{
  "completed": true,
  "qualityScore": 4,
  "teamMorale": 3,
  
  "actualizedRisks": [
    {
      "type": "vendor_lock_in",
      "occurred": true,              ← Ocurrió
      "severity": "high",
      "scheduleDelayDays": 1,
      "budgetOverrunPercent": 2.5,
      "rootCause": "Stripe cambió su API"
    }
  ]
}

RESPONSE:
{
  "success": true,
  "data": {
    "case": {
      "addedToKnowledgeBase": true   ← ✅ Se guardó en CBR
    }
  }
}

# Ahora el CBR tiene este caso:
# CaseBase.solution.actualRisks = [
#   { type: "vendor_lock_in", severity: "high", ... }
# ]
```

### Ejemplo 4: Futuro Proyecto Similar (CBR predice)

```bash
POST /api/projects/607f1f77bcf86cd799439013/risks/predict

RESPONSE:
{
  "risks": [
    {
      "type": "communication_breakdown",
      "source": "expert_rules",
      "probability": 0.65
    },
    {
      "type": "vendor_lock_in",       ← ✅ PREDICTED BY CBR!
      "source": "cbr",                 ← Viene del caso anterior
      "probability": 0.72,             ← Basado en similaridad
      "basedOnCases": [{
        "projectName": "E-commerce Platform",
        "similarity": 0.81
      }]
    }
  ]
}

# PM: "Exacto, tuvimos ese problema en el proyecto anterior"
# ✅ Sistema APRENDIÓ del riesgo manual
```

---

## 🎓 Flujo de Aprendizaje Completo

```
┌─────────────────┐
│ Proyecto 1      │
└────────┬────────┘
         │
    DURANTE EJECUCIÓN
    PM añade: vendor_lock_in (manual)
         │
    AL FINALIZAR
    outcome.actualizedRisks.push({
      type: "vendor_lock_in",
      occurred: true
    })
         │
         ↓
    ┌──────────────┐
    │   CaseBase   │  ← APRENDE
    │   (Proyecto 1)
    │   actualRisks:
    │   - vendor_lock_in
    └──────┬───────┘
           │
         FUTURO
         Proyecto 2 similar
           │
           ↓
    ┌──────────────┐
    │     CBR      │  ← PREDICE
    │  Retrieval   │
    │  vendor_lock_in
    │  (del caso 1)
    └──────────────┘
           │
           ↓
    PM VE EN PREDICCIÓN ✅
    "Exactamente como antes"
    
    CICLO COMPLETO DE APRENDIZAJE
```

---

## 🔐 Validaciones Implementadas

| Operación | Validaciones |
|-----------|------------|
| **Añadir riesgo** | ✅ Solo PM, proyecto activo, campos requeridos |
| **Actualizar riesgo** | ✅ Solo PM, riesgo manual, proyecto activo |
| **Eliminar riesgo** | ✅ Solo PM, riesgo manual, proyecto NO completado |
| **Incluir en CBR** | ✅ Automático si proyecto completado |

---

## 🚀 Verificación

Puedes probar con:
```bash
node scripts/test-manual-risks.js
```

Este script demuestra todo el flujo:
1. Crear proyecto
2. Predecir riesgos automáticos
3. PM añade riesgo manual
4. Actualiza el riesgo
5. Completa proyecto con riesgo manual
6. CBR predice ese riesgo en futuro proyecto similar

---

## 📊 Impacto

**Antes:**
```
Proyecto 1: Riesgos automáticos solo
  ↓
CBR sin datos de riesgos reales
  ↓
Proyecto 2: Predicciones básicas (Decision Tree 90%, CBR 10%)
```

**Ahora:**
```
Proyecto 1: Riesgos automáticos + MANUALES del PM
  ↓
CBR con datos REALES de experiencia
  ↓
Proyecto 2: Predicciones mejoradas (Decision Tree 80%, CBR 20%)
  ↓
Proyecto 3+: Cada vez mejor (Decision Tree 50%, CBR 50%+)
```

---

## 🎯 Resumen

✅ **El PM puede añadir riesgos durante el proyecto**
✅ **Se guardan con `source: "manual"`**
✅ **Se actualizan fácilmente**
✅ **Se incluyen automáticamente en CBR al finalizar**
✅ **Futuras predicciones aprenden de estos riesgos**
✅ **Sistema de aprendizaje REAL, NO teórico**

**Esto es lo que le faltaba a tu TFG:**
- El CBR tenía riesgos de seed cases (genéricos)
- Ahora tiene riesgos de experiencia real del PM
- El sistema realmente **aprende**

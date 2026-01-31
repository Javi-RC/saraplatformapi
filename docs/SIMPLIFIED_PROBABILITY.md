# 📊 Simplificación de Cálculo de Probabilidad

## Cambios Realizados

### ❌ ANTES: Complejo (Pesos Acumulativos)

```javascript
// CBR
const probability = accumulatedWeight / totalWeight;
// Ejemplo: (0.92×1.0 + 0.78×1.0 + 0.65×0.6) / 2.35 = 0.84

// Combinación
const finalProb = (dtProb × 0.50) + (cbrProb × 0.50);
// Ejemplo: (0.65×0.50) + (0.73×0.50) = 0.69
```

### ✅ AHORA: Simple (Máximo entre Fuentes)

```javascript
// CBR
const probability = (0.92 + 0.78 + 0.65) / 3 = 0.78;
// Promedio simple de similaridades

// Combinación
const finalProb = Math.max(dtProb, cbrProb);
// Ejemplo: Math.max(0.65, 0.73) = 0.73 ← Escoger el mayor
```

---

## 1️⃣ CBR: Ahora Solo Usa Similaridad

### Cambio en `cbr.service.js` - `reuseSolution()`

```javascript
// ANTES
riskAggregation[key] = {
  weightSum: 0,           // ❌ Acumulaba pesos
  // ...
};
riskAggregation[key].weightSum += (similarity * weight);

const totalWeight = ...;
const probability = totalWeight > 0 ? aggRisk.weightSum / totalWeight : 0;

// AHORA
riskAggregation[key] = {
  similarityScores: [],   // ✅ Solo almacena similaridades
  // ...
};
riskAggregation[key].similarityScores.push(similarity);

const probability = aggRisk.similarityScores.length > 0
  ? aggRisk.similarityScores.reduce((a, b) => a + b, 0) / aggRisk.similarityScores.length
  : 0;
```

### Ejemplo Numérico

```
Proyecto Nuevo: "API REST - Java"

Casos Similares en CaseBase:
├─ Caso 1: similaridad = 0.92, riesgo "database_bottleneck"
├─ Caso 2: similaridad = 0.78, riesgo "database_bottleneck"
└─ Caso 3: similaridad = 0.65, riesgo "database_bottleneck"

CÁLCULO CBR:
probability = (0.92 + 0.78 + 0.65) / 3 = 0.78

✅ RESULTADO: database_bottleneck → probability = 0.78
```

---

## 2️⃣ Combinación: Escoger el Máximo

### Cambio en `riskPrediction.service.js` - `combineRisks()`

```javascript
// ANTES
riskMap.set(key, {
  ...existing,
  weightedProbability: existing.weightedProbability + (risk.probability * cbrWeight),
  weightedConfidence: existing.weightedConfidence + (risk.confidence * cbrWeight),
});

const probability = risk.weightedProbability;

// AHORA
riskMap.set(key, {
  ...existing,
  probability: Math.max(existing.probability, risk.probability),  // ✅ Máximo
  winnerSource: usesCbr ? 'cbr' : 'expert_rules'                 // Marcar ganador
});

const probability = risk.probability;  // Usa directamente el máximo
```

### Ejemplo Numérico

```
Riesgo: "skill_gap"

Decision Tree predice: probability = 0.65
CBR predice:           probability = 0.73

CÁLCULO ANTERIOR (Suma ponderada con FASE 3):
finalProb = (0.65 × 0.50) + (0.73 × 0.50) = 0.69

CÁLCULO NUEVO (Máximo):
finalProb = Math.max(0.65, 0.73) = 0.73 ← CBR Gana
winnerSource = 'cbr'

Beneficio: CBR aprende que sus predicciones son más precisas
```

---

## 3️⃣ Ventajas de esta Simplificación

### ✅ Ventajas

```
1. CLARIDAD
   ├─ El PM ve: "73% de probabilidad"
   ├─ Y sabe: "CBR fue el que predijo esto"
   └─ Razón: Basado en casos históricos similares

2. INTERPRETABILIDAD
   ├─ No hay ponderaciones complejas
   ├─ Solo: ¿Cuál fue mayor?
   └─ Fácil explicar por qué se eligió cada uno

3. PERFORMANCE
   ├─ Menos cálculos matemáticos
   ├─ Menos código (sin normalización)
   └─ Más rápido de computar

4. DEBUGGING
   ├─ Fácil ver cuál ganó (winnerSource)
   ├─ Si DT=0.65 y CBR=0.73 → es CBR
   └─ Si DT=0.80 y CBR=0.50 → es DT

5. APRENDIZAJE CBR
   ├─ Si CBR gana frecuentemente → sistema está aprendiendo
   ├─ Si DT sigue ganando → CaseBase necesita más casos
   └─ Métricas claras de evolución
```

---

## 4️⃣ Ejemplos Prácticos

### Ejemplo 1: Sistema Nuevo (0 casos)

```
Proyecto: "Web App - React + Java"
CaseBase: Vacío

DECISION TREE:
├─ skill_gap: 0.65
├─ communication: 0.50
└─ team_overload: 0.45

CBR:
└─ (No hay casos, devuelve vacío)

COMBINACIÓN (max):
├─ skill_gap: Math.max(0.65, null) = 0.65 ← DT gana
├─ communication: 0.50 ← DT
└─ team_overload: 0.45 ← DT

✅ Resultado: Solo riesgos de DT disponibles
```

### Ejemplo 2: Sistema Maduro (25 casos)

```
Proyecto: "Web App v2 - Similar al anterior"
CaseBase: 25 casos (buenos y diversos)

DECISION TREE:
├─ skill_gap: 0.65
├─ communication: 0.50
└─ third_party_integration: 0.40

CBR (encuentra 5 casos similares):
├─ skill_gap: 0.68
├─ communication: 0.48
├─ third_party_integration: 0.75 ← Alto, casos lo tuvieron
└─ database_bottleneck: 0.62 ← DT no lo vio

COMBINACIÓN (max):
├─ skill_gap: Math.max(0.65, 0.68) = 0.68 (CBR gana)
├─ communication: Math.max(0.50, 0.48) = 0.50 (DT gana)
├─ third_party_integration: Math.max(0.40, 0.75) = 0.75 (CBR gana)
└─ database_bottleneck: Math.max(null, 0.62) = 0.62 (CBR aporta)

✅ Resultado: CBR contribuye casos adicionales y mejora algunas predicciones
```

---

## 5️⃣ Respuesta en API

Cuando pida predicción ahora verá:

```json
{
  "risks": [
    {
      "type": "skill_gap",
      "probability": 0.73,
      "sources": ["expert_rules", "cbr"],
      "source": "combined",
      "winnerSource": "cbr",
      "reasoning": [
        "Team has no experience with required technology",
        "3 similar projects had this risk",
        "Average similarity: 0.78"
      ],
      "basedOnCases": [
        {
          "caseId": "case_001",
          "projectName": "Web App v1",
          "similarity": 0.82
        }
      ]
    },
    {
      "type": "communication_breakdown",
      "probability": 0.65,
      "sources": ["expert_rules", "cbr"],
      "source": "combined",
      "winnerSource": "expert_rules",
      "reasoning": [
        "High cultural diversity in team",
        "Multiple time zones involved"
      ]
    }
  ]
}
```

### Interpretación

- `probability: 0.73` ← El valor final (máximo de 0.65 y 0.73)
- `winnerSource: "cbr"` ← CBR fue el que predijo más alto
- Fácil de entender qué método ganó

---

## 6️⃣ Impacto en CBR Learning

### Escenario: Proyecto Completa

```
Proyecto: "Web App"
Predicción final incluía: skill_gap (0.73 por CBR)

PM ejecuta proyecto y reporta:
POST /api/projects/:id/outcome
{
  actualizedRisks: [
    {
      type: "skill_gap",
      occurred: true,        ← Ocurrió
      actualSeverity: "high",
      actualImpact: { scheduleDelayDays: 5 }
    }
  ]
}

CaseBase GUARDA:
├─ Riesgo: skill_gap
├─ Ocurrió: TRUE
├─ Casos que lo predijeron: 3
├─ Similaridad promedio: 0.78
└─ Impacto real: 5 días de delay

RESULTADO:
✅ CBR que predijo 0.73 fue CORRECTO
✅ Confianza en CBR aumenta para futuro
✅ Cuando proyecto similar, volverá a predecir 0.73
```

---

## 7️⃣ Migración de Datos

### No hay migración requerida

Los cambios son solo en lógica de cálculo:

- **Riesgos históricos**: Se mantienen igual en BD
- **CaseBase**: Sigue igual
- **Risk model**: Sin cambios
- **Solo lógica**: Cómo se calcula probability en TIEMPO DE PREDICCIÓN

---

## 8️⃣ Debugging: Ver el Proceso

Si quiere debuggear qué pasó:

```javascript
// En código
const risk = {
  type: "skill_gap",
  probability: 0.73,
  winnerSource: "cbr",
  treeData: { probability: 0.65 },      // ← Qué dijo DT
  cbrData: { probability: 0.73 },       // ← Qué dijo CBR
  sources: ["expert_rules", "cbr"]
};

console.log(`DT predijo: ${risk.treeData.probability}`);
console.log(`CBR predijo: ${risk.cbrData.probability}`);
console.log(`Final (max): ${risk.probability}`);
console.log(`Ganador: ${risk.winnerSource}`);

// Output:
// DT predijo: 0.65
// CBR predijo: 0.73
// Final (max): 0.73
// Ganador: cbr
```

---

## 9️⃣ Para tu TFG

**Cambios académicamente válidos:**

✅ **Simplicidad**: CBR now uses average similarity (standard practice)
✅ **Claridad**: Max selection is transparent and defensible
✅ **Teórico**: Still follows 4Rs cycle (Retrieve, Reuse, Revise, Retain)
✅ **Práctico**: Fácil de explicar y validar

**En tu presentación:**
- "Simplificamos el cálculo para mejorar interpretabilidad"
- "Seleccionamos máximo de predicciones de cada fuente"
- "CBR ahora usa similaridad promedio de casos históricos"
- "Sistema más limpio y más fácil de debuggear"

---

## 🔄 Resumen de Cambios

```
┌─────────────────────────────────────────────────────────┐
│ CBR: reuseSolution()                                    │
├─────────────────────────────────────────────────────────┤
│ ANTES: probability = weightSum / totalWeight            │
│ AHORA: probability = promedio(similarityScores)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Combinación: combineRisks()                             │
├─────────────────────────────────────────────────────────┤
│ ANTES: probability = (prob_DT × weight_DT) +            │
│                      (prob_CBR × weight_CBR)            │
│                                                          │
│ AHORA: probability = max(prob_DT, prob_CBR)            │
│        winnerSource = "cbr" o "expert_rules"           │
└─────────────────────────────────────────────────────────┘
```

¡Sistema más limpio, más simple, más interpretable! 🎯

# 📊 Cómo se Calcula la Probabilidad de un Riesgo

## Resumen Ejecutivo

La probabilidad de un riesgo se calcula de **3 formas diferentes** según su origen:

| Origen | Método | Rango | Ejemplo |
|--------|--------|-------|---------|
| **Expert Rules (Decision Tree)** | Puntuación acumulativa | 0.3 - 0.80 | skill_gap → 0.65 |
| **CBR (Case-Based Reasoning)** | Peso normalizado de casos similares | 0.3 - 1.0 | third_party_api_downtime → 0.68 |
| **Manual (PM añade)** | Especificada por PM | 0.0 - 1.0 | PM ingresa: 0.75 |
| **Combinada (DT + CBR)** | Suma ponderada de ambas | 0.3 - 1.0 | 0.65×0.5 + 0.68×0.5 = 0.665 |

---

## 1️⃣ DECISION TREE: Cálculo por Puntuación Acumulativa

### Concepto
La probabilidad se obtiene sumando "puntos de riesgo" basados en características del proyecto. A más puntos, mayor probabilidad.

### Ejemplo: Riesgo de Brecha de Habilidades (skill_gap)

```
┌─────────────────────────────────────────────────────────────────┐
│ PROYECTO: Web App - Stack: React + Rust Backend                 │
│ EQUIPO: 3 devs, 1 PM, 1 QA                                      │
│ ARQUITECTURA: Microservicios                                    │
└─────────────────────────────────────────────────────────────────┘

ANÁLISIS DE CVs:
├─ Dev 1: React expert ✅, NO tiene experiencia con Rust ❌
├─ Dev 2: Full-stack junior
├─ Dev 3: Devops
└─ Brecha: Backend Rust = CRÍTICO

CÁLCULO DE PUNTOS:
├─ Tecnología NUEVA para equipo (Rust)              → +4 puntos
├─ Complejidad arquitectura (Microservicios)        → +3 puntos
├─ Tamaño proyecto (estimado: 6 meses)              → +2 puntos
├─ Experiencia Dev1 (2+ años)                       → +0 puntos ✓
├─ Experiencia Dev2 (< 1 año, junior)               → +2 puntos
└─ Documentación disponible (Rust docs)             → +0 puntos ✓
                                          ─────────────
                                    TOTAL:  11 PUNTOS

MAPEO DE PUNTOS A PROBABILIDAD:
├─ riskScore >= 9  → probability = 0.85 (CRÍTICO)
├─ riskScore >= 7  → probability = 0.80
├─ riskScore >= 5  → probability = 0.65 ✅ ← NUESTRO CASO
├─ riskScore >= 3  → probability = 0.50
└─ riskScore < 3   → probability = 0.30 (BAJO)

RESULTADO: probability = 0.65 ← "Hay 65% de probabilidad de brecha de habilidades"
```

### Otro Ejemplo: Riesgo de Conflictos por Personalidad

```
┌─────────────────────────────────────────────────────────────────┐
│ ANÁLISIS BFI-44: Agreeableness (Cordialidad)                    │
│ Valores bajos = menos disposición a cooperar                    │
└─────────────────────────────────────────────────────────────────┘

DATOS BFI-44 DEL EQUIPO:
├─ Promedio Agreeableness: 2.3/5  (BAJO)  → +4 puntos
├─ Varianza: 1.8  (ALTA)                  → +3 puntos
├─ Diversidad cultural: HIGH              → +1 punto
├─ Equipos involucrados: 4                → +1 punto
└─ Dependencias críticas: 3               → +1 punto
                                 ─────────────
                              TOTAL:  10 PUNTOS

MAPEO A PROBABILIDAD:
├─ riskScore >= 7  → probability = 0.80 ✅ ← NUESTRO CASO
└─ riskScore >= 5  → probability = 0.65

RESULTADO: probability = 0.80 ← "Hay 80% de probabilidad de conflictos"
```

### Pseudocódigo: Fórmula de Decision Tree

```javascript
function calculateProbabilityDecisionTree(project, team) {
  let riskScore = 0;
  let probability = 0.3; // Base mínima
  
  // Acumular puntos según características
  if (teamHasNoExperienceWith(project.technology)) {
    riskScore += 4; // Crítico
  }
  
  if (projectArchitectureIsComplex(project)) {
    riskScore += 3; // Importante
  }
  
  if (projectDuration > 6 months) {
    riskScore += 2; // Moderado
  }
  
  // ... más evaluaciones
  
  // Mapear puntos a probabilidad
  if (riskScore >= 9) {
    probability = 0.85;
  } else if (riskScore >= 7) {
    probability = 0.80;
  } else if (riskScore >= 5) {
    probability = 0.65;
  } else if (riskScore >= 3) {
    probability = 0.50;
  }
  
  return probability;
}
```

---

## 2️⃣ CBR: Cálculo por Casos Similares

### Concepto
La probabilidad se basa en: "¿Qué tan similares son los proyectos pasados?" + "¿Qué riesgos tuvieron esos proyectos?"

### Fórmula Matemática

```
probability = Σ(similaridad × peso del caso) / Σ(todos los pesos)

Ejemplo numérico:
─────────────────────────────────────────────────────────────────

Proyecto Nuevo: "API REST Backend - Java"

Casos Similares en CaseBase:

Caso 1: "API REST Backend - Java"
├─ Similaridad: 0.92 (muy similar)
├─ Peso: 1.0 (caso real, no seed)
├─ Riesgos reales que tuvo: [third_party_api_downtime, database_bottleneck]
└─ Contribución: 0.92 × 1.0 = 0.92

Caso 2: "Microservices - Java"
├─ Similaridad: 0.78 (bastante similar)
├─ Peso: 1.0 (caso real)
├─ Riesgos reales que tuvo: [third_party_api_downtime, network_latency]
└─ Contribución: 0.78 × 1.0 = 0.78

Caso 3: "API REST - .NET"
├─ Similaridad: 0.65 (moderadamente similar)
├─ Peso: 0.6 (seed case, menos fiable)
├─ Riesgos que tenía: [third_party_api_downtime]
└─ Contribución: 0.65 × 0.6 = 0.39

CÁLCULO:
Riesgo: "third_party_api_downtime"
├─ Suma de contribuciones: 0.92 + 0.78 + 0.39 = 2.09
├─ Suma total de pesos: 0.92 + 0.78 + 0.39 = 2.09
└─ probability = 2.09 / 2.09 = 1.0 ← ¡CASI SEGURO!

Riesgo: "network_latency"
├─ Suma de contribuciones: 0.78
├─ Suma total de pesos: 2.09
└─ probability = 0.78 / 2.09 = 0.37 ← Se filtra (>0.3)
```

### Pseudocódigo: Algoritmo CBR

```javascript
function calculateProbabilityCBR(project, similarCases) {
  const riskAggregation = {};
  
  // Para cada caso similar
  similarCases.forEach(({ case: caseDoc, similarity, weight }) => {
    // Para cada riesgo actual que ocurrió en ese caso
    caseDoc.solution.actualRisks.forEach(risk => {
      const key = `${risk.type}`;
      
      if (!riskAggregation[key]) {
        riskAggregation[key] = { weightSum: 0, examples: [] };
      }
      
      // Acumular peso = similaridad × peso del caso
      const effectiveWeight = similarity * weight;
      riskAggregation[key].weightSum += effectiveWeight;
      
      // Guardar ejemplo para reasoning
      riskAggregation[key].examples.push({
        projectName: caseDoc.problem.projectName,
        similarity: similarity,
        actualImpact: risk.actualImpact
      });
    });
  });
  
  // Calcular peso total normalizado
  const totalWeight = similarCases.reduce((sum, sc) => 
    sum + (sc.similarity * sc.weight), 0
  );
  
  // Convertir a probabilidades
  const predictedRisks = Object.values(riskAggregation).map(aggRisk => {
    // probability = peso acumulado / peso total
    const probability = totalWeight > 0 
      ? aggRisk.weightSum / totalWeight 
      : 0;
    
    return {
      type: aggRisk.type,
      probability: probability,
      basedOnCases: aggRisk.examples
    };
  });
  
  // Filtrar por umbral mínimo (0.3)
  return predictedRisks.filter(r => r.probability > 0.3);
}
```

### Tabla de Similaridad

```
┌───────────────────────────────────────────────────────────┐
│ ¿QUÉ HACE QUE DOS PROYECTOS SEAN "SIMILARES"?            │
├───────────────────────────────────────────────────────────┤
│                                                            │
│ Factor                 Peso    Rango       Impacto       │
│ ─────────────────────────────────────────────────────    │
│ Coordinación           0.25    0-1         25%           │
│ Técnica                0.30    0-1         30%           │
│ Equipo                 0.20    0-1         20%           │
│ Gestión                0.15    0-1         15%           │
│ Organizacional         0.10    0-1         10%           │
│                                 ─────                    │
│                                 Similaridad: 0-1         │
│                                                            │
│ Ejemplo:                                                  │
│ ├─ Coordinación: 0.9 × 0.25 = 0.225                     │
│ ├─ Técnica: 0.85 × 0.30 = 0.255                         │
│ ├─ Equipo: 0.80 × 0.20 = 0.160                          │
│ ├─ Gestión: 0.75 × 0.15 = 0.113                         │
│ └─ Organizacional: 0.70 × 0.10 = 0.070                  │
│                              ─────                       │
│                    SIMILARIDAD = 0.823 ✅                │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

---

## 3️⃣ COMBINACIÓN: Decision Tree + CBR

### Concepto
Combina ambos métodos con "pesos adaptativos" que cambian según la madurez del CaseBase.

### Pesos Adaptativos según Fase de Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│ FASES DEL SISTEMA (Según casos en CaseBase)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ FASE 1: Bootstrapping (< 5 casos)                              │
│ ├─ Decision Tree: 90%  ← CONFIAMOS MÁS EN REGLAS EXPERTAS     │
│ ├─ CBR: 10%           ← Pocos datos para aprender             │
│ └─ Ejemplo: CaseBase vacío, solo reglas disponibles            │
│                                                                  │
│ FASE 2: Early Learning (5-15 casos)                            │
│ ├─ Decision Tree: 70%  ← Comenzamos a usar datos reales       │
│ ├─ CBR: 30%                                                    │
│ └─ Ejemplo: Proyecto 1-15 completados                          │
│                                                                  │
│ FASE 3: Balanced (15-30 casos)                                 │
│ ├─ Decision Tree: 50%  ← Equilibrio entre ambos               │
│ ├─ CBR: 50%                                                    │
│ └─ Ejemplo: Sistema con datos históricos significativos         │
│                                                                  │
│ FASE 4: CBR Maturing (> 30 casos, buena calidad)               │
│ ├─ Decision Tree: 25-35%  ← Priorizamos aprendizaje histórico │
│ ├─ CBR: 65-75%                                                 │
│ └─ Condiciones: promedio calidad > 0.7, diversidad > 0.6       │
│                                                                  │
│ FASE 5: Stable (> 30 casos, baja calidad)                      │
│ ├─ Decision Tree: 50%  ← Volvemos a equilibrio (datos ruidosos) │
│ └─ CBR: 50%                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ejemplo: Combinación en FASE 3 (Balanced)

```
┌─────────────────────────────────────────────────────────────────┐
│ PROYECTO: "Web App - React + Java Backend"                      │
│ ESTADO: 18 casos en CaseBase → FASE 3 (Balanced)                │
├─────────────────────────────────────────────────────────────────┤

RIESGO 1: "skill_gap"

Decision Tree predice:
├─ Type: skill_gap
├─ probability_DT = 0.65
└─ reasoning: "Team has no experience with required tech"

CBR predice (3 casos similares):
├─ Caso A: similaridad=0.82, peso=1.0, tuvo skill_gap
├─ Caso B: similaridad=0.75, peso=1.0, tuvo skill_gap
├─ Caso C: similaridad=0.68, peso=1.0, tuvo skill_gap
└─ probability_CBR = (0.82 + 0.75 + 0.68) / 2.25 = 0.73

COMBINACIÓN (FASE 3: DT 50% + CBR 50%):
├─ Weighted probability = (0.65 × 0.50) + (0.73 × 0.50)
├─ Weighted probability = 0.325 + 0.365
└─ Final probability = 0.69 ← RESULTADO FINAL

PM VE: "69% de probabilidad de skill_gap"


RIESGO 2: "third_party_api_downtime"

Decision Tree predice:
├─ probability_DT = 0.40 (no es su especialidad)
└─ Razón: Reglas de DT no saben mucho de APIs externas

CBR predice:
├─ Caso A: similaridad=0.82, tuvo este riesgo real
├─ probability_CBR = 0.82 (basado en caso histórico)
└─ Razón: El proyecto pasado tuvo exactamente este problema

COMBINACIÓN (FASE 3):
├─ Weighted probability = (0.40 × 0.50) + (0.82 × 0.50)
├─ Weighted probability = 0.20 + 0.41
└─ Final probability = 0.61 ← MEJORADO POR CBR

PM VE: "61% de probabilidad de api_downtime (similar project tuvo esto)"
```

### Pseudocódigo: Combinación

```javascript
function calculateProbabilityCombined(project, organizationId) {
  // 1. Obtener predicciones del Decision Tree
  const treeRisks = decisionTreeService.predictRisksWithRules(project);
  
  // 2. Obtener predicciones del CBR
  const cbrResult = cbrService.predictRisksWithCBR(project, organizationId);
  
  // 3. Calcular pesos adaptativos según CaseBase
  const caseBaseStats = await CaseBase.getCaseBaseStats(organizationId);
  const { treeWeight, cbrWeight } = calculateAdaptiveWeights(caseBaseStats);
  
  // 4. Combinar riesgos
  const riskMap = new Map();
  
  // Agregar riesgos de Decision Tree
  treeRisks.forEach(risk => {
    riskMap.set(risk.type, {
      ...risk,
      probability: risk.probability * treeWeight,
      weightedFrom: ['decisionTree']
    });
  });
  
  // Combinar con riesgos de CBR
  cbrResult.risks.forEach(risk => {
    if (riskMap.has(risk.type)) {
      // Riesgo detectado por AMBOS → sumar probabilidades ponderadas
      const existing = riskMap.get(risk.type);
      existing.probability += (risk.probability * cbrWeight);
      existing.weightedFrom.push('cbr');
    } else {
      // Riesgo solo de CBR → agregar con peso CBR
      riskMap.set(risk.type, {
        ...risk,
        probability: risk.probability * cbrWeight,
        weightedFrom: ['cbr']
      });
    }
  });
  
  return Array.from(riskMap.values());
}
```

---

## 4️⃣ MANUAL: Especificada por Project Manager

### Concepto
PM ingresa la probabilidad directamente al crear un riesgo manual.

```javascript
// PM añade riesgo manualmente
POST /api/projects/:id/risks/manual
{
  type: "third_party_api_downtime",
  title: "API provider tiene SLA débil",
  severity: "high",
  probability: 0.75,  ← PM especifica directamente
  description: "Descubrimos que el proveedor tiene SLA del 99%",
  source: "manual"
}

// El riesgo se guarda así
{
  type: "third_party_api_downtime",
  probability: 0.75,  ← Se usa tal cual
  confidence: 0.85,   ← Automático para manuales
  source: "manual",
  status: "monitoring"
}
```

### Ventajas y Limitaciones

```
✅ VENTAJAS:
├─ PM puede basarse en experiencia y conocimiento del dominio
├─ Flexible: puede capturar riesgos que DT y CBR no predicen
├─ Inmediato: no requiere análisis
└─ Aprendizaje: se incluye en CBR para futuras predicciones

❌ LIMITACIONES:
├─ Subjetivo: depende de percepciones del PM
├─ Variable: diferentes PMs pueden estimar diferente
├─ Histórico: no automático, requiere entrada activa
└─ Sesgo: PM puede sobre/sub-estimar

🔄 SOLUCIÓN EN EL SISTEMA:
├─ Se guarda con source: "manual" para identificar origen
├─ Se incluye en CaseBase con alta confianza (0.85)
├─ Futuras predicciones aprenden de estos valores
└─ Si ocurre realmente, se valida el estimado del PM
```

---

## 5️⃣ FLUJO COMPLETO: De Proyecto a Probabilidad

```
┌──────────────────────────────────────────────────────────────┐
│ NUEVO PROYECTO CREADO                                         │
│ "Mobile App - Swift + Firebase"                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ POST /api/projects/:id/risks/predict                         │
│ Orchestrador: riskPredictionService                          │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │Decision Tree │  │     CBR      │  │Manual Risk   │
          │(Expert Rules)│  │(Cases)       │  │(PM entrada)  │
          └──────────────┘  └──────────────┘  └──────────────┘
                    │         │              │
          ┌─────────┴─────────┴──────────────┘
          │
          ↓ Combinar con pesos adaptativos
    ┌──────────────────────────────────┐
    │ calculateProbability()           │
    │                                  │
    │ FOR cada riesgo:                 │
    │  prob_final = (prob_DT × w_DT) + │
    │              (prob_CBR × w_CBR) + │
    │              (prob_Manual × 1.0)  │
    │                                  │
    │ Filtrar: prob > 0.3              │
    │ Ordenar: por prob DESC            │
    └──────────────────────────────────┘
          │
          ↓
    ┌──────────────────────────────┐
    │ PREDICCIÓN FINAL             │
    ├──────────────────────────────┤
    │ • skill_gap: 0.72 ★          │
    │   (DT:0.65×0.5 + CBR:0.79×0.5│
    │                              │
    │ • communication: 0.58 ★      │
    │   (DT:0.58×0.5 + CBR:0.48×0.5│
    │                              │
    │ • third_party_api: 0.61 ★    │
    │   (DT:0.40×0.5 + CBR:0.82×0.5│
    │   Based on: Proyecto Similar  │
    │                              │
    │ • database_bottleneck: 0.42  │
    │   (DT:0.42×0.5 + CBR:0.42×0.5│
    └──────────────────────────────┘
          │
          ↓
    ┌──────────────────────────────┐
    │ PM VE EN DASHBOARD           │
    ├──────────────────────────────┤
    │ Top Risks (por probability):  │
    │ 1. skill_gap (72%)            │
    │ 2. communication (58%)        │
    │ 3. third_party_api (61%)      │
    │ 4. database_bottleneck (42%)  │
    │                              │
    │ Durante proyecto:             │
    │ PM puede AÑADIR más riesgos   │
    │ POST /risks/manual            │
    └──────────────────────────────┘
          │
          ↓
    Proyecto finaliza
          │
          ↓
    PM ingresa actualizedRisks
          │
          ↓ Se guardan en CaseBase
          │
          ↓ Futuro: CBR aprende
```

---

## 📈 Tabla Comparativa: Cálculo Probabilidad

```
┌──────────────┬─────────────┬──────────────┬──────────────┬────────────┐
│ Método       │ Entrada     │ Fórmula      │ Rango        │ Cuando usar│
├──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ Decision     │ Caract.     │ Puntos →     │ 0.3-0.85     │ Proyecto   │
│ Tree         │ Proyecto    │ Tablas       │              │ nuevo      │
│              │ + Equipo    │ lookup       │              │            │
├──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ CBR          │ Similaridad │ Σ(sim×peso) │ 0.3-1.0      │ Proyecto   │
│              │ + Casos     │ / Σ(pesos)  │              │ similar    │
│              │ históricos  │              │              │            │
├──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ Manual       │ PM ingresa  │ Directo      │ 0.0-1.0      │ Durante    │
│              │ directamente│              │              │ ejecución  │
├──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ Combinada    │ DT + CBR +  │ Σ(método_i × │ 0.3-1.0      │ Predicción │
│              │ adaptativo  │ peso_i)      │              │ final      │
└──────────────┴─────────────┴──────────────┴──────────────┴────────────┘
```

---

## 🎯 Ejemplos Prácticos del Cálculo

### Ejemplo 1: Proyecto NUEVO, CaseBase VACÍO

```
Proyecto: "E-commerce Platform"
CaseBase: 0 casos → FASE 1 (Bootstrapping)
Pesos: DT=90%, CBR=10%

DECISION TREE detecta:
├─ skill_gap: 0.65
├─ communication_breakdown: 0.50
└─ team_overload: 0.45

CBR (no hay casos):
└─ (vacío)

MANUAL (PM no ha añadido):
└─ (vacío)

CÁLCULO FINAL:
├─ skill_gap = (0.65 × 0.90) + (0 × 0.10) = 0.585 → 0.59
├─ communication = (0.50 × 0.90) + (0 × 0.10) = 0.45
└─ team_overload = (0.45 × 0.90) + (0 × 0.10) = 0.405 → 0.41

PM VE: Sistema nuevo, solo reglas experto disponibles
```

### Ejemplo 2: Proyecto SIMILAR, CaseBase CON CASOS

```
Proyecto: "E-commerce Platform v2"
CaseBase: 22 casos → FASE 3 (Balanced)
Pesos: DT=50%, CBR=50%

Casos similares encontrados: 5 (similaridad 0.8-0.9)

DECISION TREE detecta:
├─ skill_gap: 0.65
├─ communication_breakdown: 0.50
└─ database_bottleneck: 0.55

CBR (de casos históricos):
├─ skill_gap: 0.68 (ocurrió en 3 casos similares)
├─ database_bottleneck: 0.75 (muy frecuente)
├─ api_integration_failure: 0.62 (nuevo, DT no lo predijo)
└─ vendor_lock_in: 0.58

MANUAL (PM añadió):
└─ third_party_payment_delay: 0.70 (por experiencia)

CÁLCULO FINAL:
├─ skill_gap = (0.65×0.50) + (0.68×0.50) = 0.665 ✅ MEJORADO
├─ database_bottleneck = (0.55×0.50) + (0.75×0.50) = 0.65 ✅ MEJORADO
├─ communication = (0.50×0.50) + (0×0.50) = 0.25 → FILTRADO (<0.3)
├─ api_integration = (0×0.50) + (0.62×0.50) = 0.31 ✅ NUEVO
├─ vendor_lock_in = (0×0.50) + (0.58×0.50) = 0.29 → FILTRADO
└─ third_party_payment = 0.70 (manual directo) ✅ NUEVO

PM VE: 
├─ skill_gap (66%) - histórico
├─ database_bottleneck (65%) - histórico
├─ third_party_payment (70%) - experiencia actual
└─ api_integration (31%) - similar projects tuvieron esto

"Sistema aprendió de Proyecto 1"
```

---

## 🔍 Debugging: Ver Cómo Se Calculó

Cuando recibas un riesgo en la respuesta, verá:

```json
{
  "type": "skill_gap",
  "probability": 0.665,
  "sources": ["expert_rules", "cbr"],
  "confidence": 0.78,
  "source": "combined",
  
  "reasoning": [
    "Team has no experience with required technology",
    "Similar projects had this risk",
    "3 cases with >0.8 similarity had same risk"
  ],
  
  "basedOnCases": [
    {
      "caseId": "case_001",
      "projectName": "E-commerce v1",
      "similarity": 0.87,
      "description": "Team learned Rust during project"
    },
    {
      "caseId": "case_005",
      "projectName": "Mobile App",
      "similarity": 0.82,
      "description": "New framework caused delays"
    }
  ],
  
  "metadata": {
    "calculationMethod": "combined",
    "weights": {
      "decisionTree": 0.50,
      "cbr": 0.50
    },
    "caseBaseSize": 22,
    "systemPhase": "PHASE 3 - Balanced"
  }
}
```

**Interpretación:**
- `probability: 0.665` ← Resultado final
- `sources: ["expert_rules", "cbr"]` ← Detectado por ambos
- `basedOnCases` ← Prueba de por qué CBR predijo esto
- `metadata` ← Muestra cómo se calculó

---

## 📊 Resumen Visual

```
                    ENTRADA
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
    Características  Casos Reales   PM Manual
    del Proyecto     en CaseBase     Input
        │              │              │
        ↓              ↓              ↓
    Decision Tree    CBR Retrieval   Direct
    (Puntos)        (Similaridad)    (0-1)
        │              │              │
        ↓              ↓              ↓
    prob_DT ∈      prob_CBR ∈      prob_manual ∈
    [0.3, 0.85]    [0.3, 1.0]      [0.0, 1.0]
        │              │              │
        └──────────────┬──────────────┘
                       │
                       ↓
            Pesos Adaptativos (Matriz)
            ┌─ DT: 90% CBR: 10%  (< 5 casos)
            ├─ DT: 70% CBR: 30%  (5-15 casos)
            ├─ DT: 50% CBR: 50%  (15-30 casos)
            └─ DT: 25% CBR: 75%  (> 30 casos)
                       │
                       ↓
            prob_final = Σ(prob_i × weight_i)
                       │
                       ↓
            Filtrar: > 0.3
            Ordenar: DESC
                       │
                       ↓
                  SALIDA
            [risk_1: 0.72, risk_2: 0.61, ...]
```

---

## 🎓 Para tu TFG

**Puntos clave para explicar:**

1. **Decision Tree**: Reglas de expertos basadas en características → Puntuación acumulativa
2. **CBR**: Aprendizaje de casos similares → Probabilidad ponderada
3. **Combinación**: Pesos adaptativos según madurez del sistema → Ciclo 4Rs completo
4. **Manual**: PM captura experiencia real → Se incluye en aprendizaje futuro

**Validación académica:**
- Teoría: Algoritmo de CBR (4Rs) + Árboles de decisión ✅
- Práctica: Probabilidades calculadas matemáticamente ✅
- Aprendizaje: El sistema mejora con experiencia ✅
- Trazabilidad: Se puede ver por qué se predijo cada riesgo ✅

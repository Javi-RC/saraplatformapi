# Sistema Híbrido de Predicción de Riesgos: Expert Rules + CBR

## Índice
1. [Introducción](#introducción)
2. [Expert Rules (Árbol de Decisión)](#expert-rules-árbol-de-decisión)
3. [CBR (Case-Based Reasoning)](#cbr-case-based-reasoning)
4. [Sistema Híbrido](#sistema-híbrido)
5. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Introducción

El sistema de predicción de riesgos combina **dos metodologías complementarias**:

- **Expert Rules (Reglas Expertas)**: Conocimiento codificado por expertos en gestión de proyectos
- **CBR (Razonamiento Basado en Casos)**: Aprendizaje de experiencias pasadas

Esta combinación permite aprovechar tanto el **conocimiento experto** inicial como el **aprendizaje continuo** de proyectos reales.

---

## Expert Rules (Árbol de Decisión)

### ¿Qué son las Expert Rules?

Las Expert Rules son **reglas codificadas manualmente** basadas en conocimiento experto de gestión de proyectos. Funcionan como un árbol de decisión que evalúa diferentes aspectos del proyecto para identificar riesgos potenciales.

### Características Principales

- **Determinísticas**: Siempre producen el mismo resultado para las mismas condiciones
- **Explicables**: Cada riesgo tiene una razón clara (condición que lo disparó)
- **Independientes de datos históricos**: Funcionan desde el primer proyecto
- **Basadas en Best Practices**: Reflejan conocimiento acumulado de la industria

### Arquitectura

```
Project Data
    ↓
┌─────────────────────────────────────┐
│      8 Expert Rules (Reglas)        │
├─────────────────────────────────────┤
│ 1. Communication Breakdown          │
│ 2. Skill Gap                        │
│ 3. Team Overload                    │
│ 4. Dependency Blockage              │
│ 5. Scope Creep                      │
│ 6. Process Mismatch                 │
│ 7. Technical Infrastructure         │
│ 8. Quality Degradation              │
└─────────────────────────────────────┘
    ↓
Identified Risks
```

### Las 8 Reglas Expertas

#### Regla 1: Communication Breakdown (Ruptura de Comunicación)

**Condiciones que activan el riesgo:**

```javascript
// Alta comunicación requerida + equipo distribuido + poca superposición horaria
if (requiresSynchronousCommunication === 'yes' || 
    realTimeCommunicationLevel === 'high') {
  
  if (teamDistributed && timeOverlap < 4 horas) {
    // RIESGO ALTO: Equipo necesita comunicación sincrónica 
    // pero está en zonas horarias incompatibles
  }
}

// Idiomas no cubiertos por el equipo
if (project.requiredLanguages && !team.hasLanguageCoverage) {
  // RIESGO MEDIO-ALTO: Barreras idiomáticas
}

// Muchas reuniones semanales + equipo distribuido
if (weeklyMeetingsCount > 5 && teamDistributed) {
  // RIESGO MEDIO: Fatiga por reuniones virtuales
}
```

**Ejemplo Real:**
```
Proyecto: E-commerce Internacional
- Requiere: Comunicación sincrónica diaria
- Equipo: España (UTC+1), India (UTC+5:30), México (UTC-6)
- Superposición: 2 horas
- Idiomas requeridos: Inglés, Español
- Equipo habla: Español, Hindi

→ RIESGO DETECTADO: Communication Breakdown (Probabilidad: 0.75, Severidad: high)
```

#### Regla 2: Skill Gap (Brecha de Habilidades)

**Condiciones que activan el riesgo:**

```javascript
// Tecnologías requeridas vs skills reales del equipo
const requiredTechs = ['React', 'Node.js', 'MongoDB'];
const teamSkills = extractSkillsFromCVs(assignedEmployees);

const missingTechs = requiredTechs.filter(tech => 
  !teamSkills.find(skill => skill.name === tech && skill.level >= 'intermedio')
);

if (missingTechs.length > 0) {
  // RIESGO: Equipo no domina todas las tecnologías
  severity = missingTechs.length >= 3 ? 'high' : 'medium';
  probability = 0.6 + (missingTechs.length * 0.1);
}

// Experiencia del equipo vs complejidad del sistema
if (requiredExperienceLevel === 'senior' && 
    team.avgYearsExperience < 5) {
  // RIESGO: Equipo junior para proyecto complejo
}

// Nivel de proficiencia bajo
const avgProficiency = team.skills.reduce((sum, s) => 
  sum + s.proficiencyLevel, 0) / team.skills.length;

if (avgProficiency < 2) { // 1=básico, 2=intermedio, 3=avanzado
  // RIESGO: Skills generales bajas
}
```

**Ejemplo Real:**
```
Proyecto: Plataforma de Trading en Tiempo Real
- Tecnologías: React, WebSockets, Redis, Docker, AWS
- Experiencia requerida: Senior
- Complejidad: High

Equipo:
- María: React (avanzado), Node (intermedio), 4 años experiencia
- Carlos: Vue (avanzado), Express (básico), 2 años experiencia
- Ana: Angular (experto), MongoDB (avanzado), 3 años experiencia

Análisis:
✗ WebSockets: Nadie lo tiene
✗ Redis: Nadie lo tiene
✗ Docker: Nadie lo tiene
✗ AWS: Nadie lo tiene
✓ React: Solo María (pero otros usan frameworks diferentes)
✗ Experiencia promedio: 3 años (requiere 5+)

→ RIESGO DETECTADO: Skill Gap (Probabilidad: 0.85, Severidad: critical)
Recomendación: Capacitación urgente o contratar especialistas
```

#### Regla 3: Team Overload (Sobrecarga del Equipo)

**Condiciones que activan el riesgo:**

```javascript
// Horas semanales requeridas vs disponibilidad real
for (const member of assignedEmployees) {
  const otherProjects = await getActiveProjects(member.id);
  const occupiedHours = otherProjects.reduce((sum, p) => 
    sum + p.weeklyHoursPerMember, 0);
  
  const requiredHours = project.weeklyHoursPerMember;
  const availableHours = 40 - occupiedHours;
  
  if (requiredHours > availableHours) {
    // RIESGO: Miembro sobrecargado
    overloadedMembers.push(member);
  }
}

if (overloadedMembers.length > 0) {
  severity = overloadedMembers.length >= teamSize * 0.5 ? 'critical' : 'high';
  probability = 0.7 + (overloadedMembers.length * 0.05);
}

// Personalidad + carga de trabajo (usando BFI-44)
if (member.bfi44.neuroticism > 3.5 && occupiedHours > 35) {
  // RIESGO: Alta tendencia al estrés + alta carga = burnout
}

// Periodos de alta carga planificados
if (project.highLoadPeriods.length > 0) {
  highLoadPeriods.forEach(period => {
    if (period.expectedHoursPerWeek > 50) {
      // RIESGO: Crunch time planificado
    }
  });
}
```

**Ejemplo Real:**
```
Proyecto: Sistema de Facturación
- Horas requeridas: 30h/semana
- Equipo: 4 personas

Estado del equipo:
1. María: 
   - Proyecto A: 20h/semana
   - Proyecto B: 15h/semana
   - Total ocupado: 35h
   - Disponible: 5h
   - NECESITA: 30h
   → SOBRECARGA: -25h/semana

2. Carlos:
   - Proyecto C: 10h/semana
   - Total ocupado: 10h
   - Disponible: 30h
   - NECESITA: 30h
   → OK: Justo

3. Ana:
   - Proyecto D: 25h/semana
   - Total ocupado: 25h
   - Disponible: 15h
   - NECESITA: 30h
   → SOBRECARGA: -15h/semana

4. Pedro:
   - Sin proyectos
   - Disponible: 40h
   → OK: Sobra capacidad

Resultado: 2/4 miembros sobrecargados (50%)

→ RIESGO DETECTADO: Team Overload (Probabilidad: 0.80, Severidad: critical)
Recomendación: Reducir carga de María y Ana o añadir más recursos
```

#### Regla 4: Dependency Blockage (Bloqueo por Dependencias)

**Condiciones:**

```javascript
// Dependencias críticas identificadas
if (criticalDependencies.length > 3) {
  // RIESGO: Muchas dependencias críticas
}

// Dependencias de infraestructura compartida
if (sharedInfrastructureDependency) {
  // RIESGO: Recursos compartidos pueden causar cuellos de botella
}

// Dependencias externas (vendors)
if (hasExternalVendors && vendorReliability < 0.7) {
  // RIESGO: Dependencia de terceros poco confiables
}
```

#### Regla 5: Scope Creep (Expansión del Alcance)

**Condiciones:**

```javascript
// Alcance mal definido + cliente poco experimentado
if (scopeClarityLevel < 3 && clientExperience === 'low') {
  // RIESGO ALTO: Cambios de alcance frecuentes
}

// Metodología waterfall + requisitos incompletos
if (managementMethod === 'waterfall' && 
    documentationLevel === 'minimal') {
  // RIESGO: Sin flexibilidad para cambios + documentación pobre
}

// Muchos stakeholders con intereses distintos
if (stakeholderCount > 5 && decisionMakingProcess === 'distributed') {
  // RIESGO: Difícil consenso, cambios constantes
}
```

#### Regla 6: Process Mismatch (Desajuste de Procesos)

**Condiciones:**

```javascript
// Metodología del proyecto vs madurez de la organización
if (managementMethod === 'scrum' && 
    organization.maturity === 'ad_hoc') {
  // RIESGO: Intentar usar Scrum sin procesos establecidos
}

// Equipo sin experiencia en la metodología
if (managementMethod === 'agile' && 
    team.hasAgileExperience === false) {
  // RIESGO: Curva de aprendizaje de metodología
}

// Procesos muy estrictos + necesidad de flexibilidad
if (documentationStandardization === 'high' && 
    requiresRapidIteration === true) {
  // RIESGO: Burocracia ralentiza desarrollo
}
```

#### Regla 7: Technical Infrastructure (Infraestructura Técnica)

**Condiciones:**

```javascript
// Complejidad alta + infraestructura especializada
if (systemComplexity === 'high' && 
    requiresSpecializedTools.needed === true &&
    !team.hasToolExperience) {
  // RIESGO: Herramientas complejas desconocidas
}

// Dependencias de sistemas legados
if (hasLegacySystemIntegration && 
    legacyDocumentation === 'minimal') {
  // RIESGO: Integración con sistemas pobremente documentados
}
```

#### Regla 8: Quality Degradation (Degradación de Calidad)

**Condiciones:**

```javascript
// Presión de tiempo + consciencia baja (BFI-44)
if (timeline === 'aggressive' && 
    team.avgConscientiousness < 3.0) {
  // RIESGO: Atajos, código de baja calidad
}

// Sin procesos de QA establecidos
if (organization.hasQAProcesses === false && 
    systemComplexity === 'high') {
  // RIESGO: Bugs en producción
}

// Equipo sobrecargado + plazos ajustados
if (team.isOverloaded && deadlinePressure === 'high') {
  // RIESGO: Sacrificio de calidad por velocidad
}
```

### Salida de Expert Rules

Cada regla genera riesgos en formato estructurado:

```javascript
{
  type: 'communication_breakdown',
  category: 'coordination',
  severity: 'high',
  probability: 0.75,
  confidence: 0.9, // Alta confianza porque son reglas determinísticas
  source: 'expert_rules',
  reasoning: [
    'Equipo distribuido en 3 zonas horarias',
    'Superposición de horario: solo 2 horas',
    'Requiere comunicación sincrónica diaria',
    'Barreras idiomáticas detectadas'
  ],
  indicators: [
    'requiresSynchronousCommunication: yes',
    'timeOverlap: 2 hours',
    'teamRegions: 3',
    'languageBarriers: true'
  ],
  recommendations: [
    'Establecer horarios fijos de superposición',
    'Usar comunicación asíncrona cuando sea posible',
    'Implementar documentación exhaustiva',
    'Considerar capacitación en idiomas'
  ],
  predictedImpact: {
    schedule: 'Retrasos por comunicación deficiente',
    quality: 'Malentendidos en requisitos',
    team: 'Frustración por dificultad de coordinación'
  }
}
```

---

## CBR (Case-Based Reasoning)

### ¿Qué es CBR?

**Case-Based Reasoning** es una técnica de inteligencia artificial que resuelve problemas nuevos **recordando y adaptando soluciones de problemas similares pasados**.

### Principio Fundamental

> "Problemas similares tienen soluciones similares"

Si un proyecto anterior con características parecidas tuvo ciertos riesgos que se materializaron, es probable que el proyecto actual enfrente riesgos similares.

### El Ciclo de las 4Rs

CBR sigue un ciclo de 4 fases:

```
1. RETRIEVE (Recuperar)
   ↓
2. REUSE (Reutilizar)
   ↓
3. REVISE (Revisar)
   ↓
4. RETAIN (Retener)
```

#### 1. RETRIEVE - Recuperar Casos Similares

**Objetivo**: Encontrar proyectos pasados similares al actual.

**¿Cómo mide similitud?**

Calcula distancia Euclidiana entre vectores de características:

```javascript
// Características extraídas del proyecto
const projectFeatures = {
  // Numéricos (0-1 normalizados)
  teamSize: 0.6,              // 5 personas → 5/10 = 0.6
  duration: 0.5,              // 6 meses → 6/12 = 0.5
  complexity: 0.67,           // high → 2/3
  distributedTeam: 1.0,       // yes → 1
  communicationLevel: 0.67,   // high → 2/3
  
  // Categóricos (one-hot encoding)
  methodology_scrum: 1,
  methodology_waterfall: 0,
  
  // Team analysis (desde CVs y BFI-44)
  techMatchPercentage: 0.75,
  missingTechnologies: 2,
  avgProficiency: 2.8,
  actualExperienceLevel: 2,   // mid = 2
  experienceGap: 1,
  juniorRatio: 0.4,
  isOverloaded: 1,
  avgHoursPerWeek: 35,
  avgConscientiousness: 3.2,
  avgOpenness: 3.5,
  personalityConcerns: 1,
  hasLanguageBarriers: 0,
  languageCoverage: 1.0
};

// Buscar en Case Base
const similarCases = caseBase.map(oldCase => ({
  case: oldCase,
  similarity: calculateSimilarity(projectFeatures, oldCase.features)
}))
.sort((a, b) => b.similarity - a.similarity)
.slice(0, 5); // Top 5 más similares
```

**Cálculo de Similitud:**

```javascript
function calculateSimilarity(features1, features2) {
  // Distancia Euclidiana
  let sumSquaredDiff = 0;
  
  for (const key in features1) {
    const diff = features1[key] - features2[key];
    sumSquaredDiff += diff * diff;
  }
  
  const distance = Math.sqrt(sumSquaredDiff);
  
  // Convertir a similitud (0-1)
  // Máxima distancia posible ≈ sqrt(num_features)
  const maxDistance = Math.sqrt(Object.keys(features1).length);
  const similarity = 1 - (distance / maxDistance);
  
  return similarity;
}
```

**Ejemplo de Recuperación:**

```
Proyecto Nuevo:
- Equipo: 5 personas
- Duración: 6 meses
- Tecnologías: React, Node.js, MongoDB
- Complejidad: High
- Equipo distribuido: Sí
- Match técnico: 75%

Case Base (5000 casos):

Caso #1234 (Similitud: 0.92):
- Equipo: 5 personas
- Duración: 7 meses
- Tecnologías: React, Node.js, PostgreSQL
- Complejidad: High
- Equipo distribuido: Sí
- Match técnico: 80%
- Riesgos reales: Communication Breakdown (se materializó), Skill Gap (no)

Caso #2456 (Similitud: 0.89):
- Equipo: 6 personas
- Duración: 6 meses
- Tecnologías: Vue, Node.js, MongoDB
- Complejidad: Medium-High
- Equipo distribuido: Sí
- Match técnico: 70%
- Riesgos reales: Team Overload (se materializó), Skill Gap (se materializó)

Caso #3789 (Similitud: 0.85):
- Equipo: 4 personas
- Duración: 5 meses
- Tecnologías: React, Express, MongoDB
- Complejidad: High
- Equipo distribuido: No
- Match técnico: 85%
- Riesgos reales: Quality Degradation (se materializó)
```

#### 2. REUSE - Reutilizar Soluciones

**Objetivo**: Adaptar los riesgos de casos similares al proyecto actual.

```javascript
function reuseSimilarCases(similarCases, currentProject) {
  const predictedRisks = [];
  
  for (const { case: oldCase, similarity } of similarCases) {
    // Para cada riesgo que se materializó en el caso anterior
    for (const risk of oldCase.actualRisks) {
      
      // Ajustar probabilidad según similitud
      const adjustedProbability = risk.probability * similarity;
      
      // Ajustar severidad si el proyecto actual es más grande/complejo
      let adjustedSeverity = risk.severity;
      if (currentProject.complexity > oldCase.complexity) {
        adjustedSeverity = increaseSeverity(risk.severity);
      }
      
      predictedRisks.push({
        type: risk.type,
        probability: adjustedProbability,
        severity: adjustedSeverity,
        confidence: similarity, // La confianza es la similitud
        source: 'cbr',
        basedOnCases: [{
          caseId: oldCase._id,
          similarity: similarity,
          outcome: risk.actualOutcome
        }],
        reasoning: [
          `Basado en ${similarCases.length} casos similares`,
          `Caso más similar: ${oldCase.projectName} (similitud: ${(similarity*100).toFixed(1)}%)`,
          `En ese proyecto, este riesgo ${risk.materialized ? 'SÍ se materializó' : 'NO se materializó'}`
        ]
      });
    }
  }
  
  // Consolidar riesgos duplicados
  return consolidateRisks(predictedRisks);
}
```

**Ejemplo de Reutilización:**

```
Riesgo encontrado en Caso #1234 (similitud: 0.92):
- Tipo: Communication Breakdown
- Probabilidad original: 0.80
- Severidad: high
- Se materializó: SÍ
- Impacto real: Retrasos de 3 semanas

Adaptación para proyecto actual:
- Probabilidad ajustada: 0.80 * 0.92 = 0.736
- Severidad: high (sin cambio)
- Confianza: 0.92 (muy alta similitud)
- Reasoning: "En proyecto similar 'Sistema CRM' (92% similar), 
             este riesgo se materializó causando retrasos de 3 semanas"
```

#### 3. REVISE - Revisar Predicción

**Objetivo**: Ajustar la predicción usando Expert Rules como validación.

```javascript
function reviseWithTreeRules(cbrRisks, treeRisks) {
  const revisedRisks = [...cbrRisks];
  
  // Si Expert Rules también detecta el mismo riesgo → AUMENTAR confianza
  for (const cbrRisk of cbrRisks) {
    const treeRisk = treeRisks.find(r => r.type === cbrRisk.type);
    
    if (treeRisk) {
      // Ambos sistemas detectan el riesgo
      cbrRisk.confidence = Math.min(cbrRisk.confidence + 0.2, 1.0);
      cbrRisk.reasoning.push(
        'También detectado por reglas expertas',
        `Expert Rules: probability ${treeRisk.probability}`
      );
    }
  }
  
  // Si Expert Rules detecta un riesgo que CBR no → AÑADIR
  for (const treeRisk of treeRisks) {
    if (!cbrRisks.find(r => r.type === treeRisk.type)) {
      revisedRisks.push({
        ...treeRisk,
        reasoning: [
          ...treeRisk.reasoning,
          'No encontrado en casos históricos (proyecto único)'
        ]
      });
    }
  }
  
  return revisedRisks;
}
```

#### 4. RETAIN - Retener Nuevo Caso

**Objetivo**: Guardar el proyecto actual en la Case Base para futuros usos.

```javascript
async function retainCase(project, predictedRisks, actualOutcome) {
  // Esperar a que el proyecto termine
  if (project.status !== 'completed') {
    return;
  }
  
  // El PM reporta qué riesgos realmente ocurrieron
  const newCase = {
    projectId: project._id,
    organization: project.organization,
    features: extractProjectFeatures(project),
    predictedRisks: predictedRisks,
    actualRisks: actualOutcome.risks, // Los que realmente pasaron
    outcome: {
      success: actualOutcome.success,
      delayInWeeks: actualOutcome.delayInWeeks,
      budgetOverrun: actualOutcome.budgetOverrun,
      qualityIssues: actualOutcome.qualityIssues
    },
    accuracy: calculatePredictionAccuracy(predictedRisks, actualOutcome.risks),
    lessonLearned: actualOutcome.lessonsLearned,
    qualityScore: calculateCaseQuality(project, actualOutcome)
  };
  
  await CaseBase.create(newCase);
  
  console.log(`New case retained. Case Base now has ${await CaseBase.countDocuments()} cases`);
}
```

### Ventajas de CBR

1. **Aprende Continuamente**: Cada proyecto completado mejora el sistema
2. **Específico de la Organización**: Aprende patrones únicos de tu empresa
3. **Maneja Situaciones Nuevas**: Puede predecir en escenarios sin reglas explícitas
4. **Mejora con el Tiempo**: Más datos = mejores predicciones

### Desventajas de CBR

1. **Cold Start**: No funciona sin datos históricos
2. **Calidad de Datos**: Depende de outcomes reportados correctamente
3. **Menos Explicable**: "Porque pasó antes" vs "Porque se cumple condición X"

---

## Sistema Híbrido

### ¿Por qué combinar ambos?

| Aspecto | Expert Rules | CBR |
|---------|-------------|-----|
| **Funciona sin datos** | ✅ Sí | ❌ Necesita casos |
| **Aprende de experiencias** | ❌ No | ✅ Sí |
| **Explicabilidad** | ✅ Alta | ⚠️ Media |
| **Adaptabilidad** | ❌ Requiere actualización manual | ✅ Automática |
| **Maneja casos únicos** | ✅ Sí | ⚠️ Depende de similitud |
| **Precisión inicial** | ⚠️ Media | N/A |
| **Precisión con datos** | ⚠️ Media | ✅ Alta |

### Estrategia de Pesos Adaptativos

El sistema ajusta automáticamente la importancia de cada método según la madurez de la Case Base:

```javascript
function calculateAdaptiveWeights(caseBaseStats) {
  const caseCount = caseBaseStats.total;
  const avgQuality = caseBaseStats.avgQualityScore;
  const diversity = caseBaseStats.diversityIndex;
  
  let treeWeight, cbrWeight;
  
  // FASE 1: Cold Start (0-4 casos)
  if (caseCount < 5) {
    treeWeight = 0.90;  // 90% Expert Rules
    cbrWeight = 0.10;   // 10% CBR
    // Razón: Muy pocos datos, confiar principalmente en expertos
  }
  
  // FASE 2: Early Learning (5-14 casos)
  else if (caseCount < 15) {
    treeWeight = 0.70;  // 70% Expert Rules
    cbrWeight = 0.30;   // 30% CBR
    // Razón: Empezando a tener datos, pero aún insuficientes
  }
  
  // FASE 3: Balanced (15-29 casos)
  else if (caseCount < 30) {
    treeWeight = 0.50;  // 50% Expert Rules
    cbrWeight = 0.50;   // 50% CBR
    // Razón: Datos suficientes para equilibrar ambos métodos
  }
  
  // FASE 4: Mature (30+ casos)
  else {
    // Ajustar según calidad y diversidad
    if (avgQuality > 0.7 && diversity > 0.6) {
      treeWeight = 0.25;  // 25% Expert Rules
      cbrWeight = 0.75;   // 75% CBR
      // Razón: Base de casos madura y de alta calidad
    }
    else if (avgQuality > 0.6) {
      treeWeight = 0.35;  // 35% Expert Rules
      cbrWeight = 0.65;   // 65% CBR
      // Razón: Calidad buena pero no excelente
    }
    else {
      treeWeight = 0.50;  // 50% Expert Rules
      cbrWeight = 0.50;   // 50% CBR
      // Razón: Muchos casos pero calidad cuestionable
    }
  }
  
  return { treeWeight, cbrWeight };
}
```

### Combinación de Predicciones

```javascript
function combineRisks(treeRisks, cbrRisks, treeWeight, cbrWeight) {
  const riskMap = new Map();
  
  // 1. Agregar riesgos de Expert Rules con su peso
  treeRisks.forEach(risk => {
    riskMap.set(risk.type, {
      ...risk,
      sources: ['expert_rules'],
      weightedProbability: risk.probability * treeWeight,
      weightedConfidence: risk.confidence * treeWeight
    });
  });
  
  // 2. Agregar o combinar riesgos de CBR
  cbrRisks.forEach(risk => {
    if (riskMap.has(risk.type)) {
      // Riesgo detectado por AMBOS → Combinar
      const existing = riskMap.get(risk.type);
      
      riskMap.set(risk.type, {
        ...existing,
        sources: ['expert_rules', 'cbr'],
        weightedProbability: existing.weightedProbability + (risk.probability * cbrWeight),
        weightedConfidence: existing.weightedConfidence + (risk.confidence * cbrWeight),
        reasoning: [
          ...existing.reasoning,
          ...risk.reasoning
        ],
        basedOnCases: risk.basedOnCases || []
      });
    }
    else {
      // Riesgo solo detectado por CBR
      riskMap.set(risk.type, {
        ...risk,
        sources: ['cbr'],
        weightedProbability: risk.probability * cbrWeight,
        weightedConfidence: risk.confidence * cbrWeight
      });
    }
  });
  
  // 3. Convertir a array y normalizar
  return Array.from(riskMap.values()).map(risk => ({
    type: risk.type,
    probability: risk.weightedProbability,
    confidence: risk.weightedConfidence,
    source: risk.sources.length > 1 ? 'combined' : risk.sources[0],
    severity: risk.severity,
    reasoning: risk.reasoning,
    recommendations: risk.recommendations
  }));
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Primer Proyecto de la Organización

**Situación:**
- Case Base: 0 casos
- Proyecto: E-commerce con React, Node.js, MongoDB
- Equipo: 5 personas, distribuido globalmente

**Predicción:**

```
Pesos: Expert Rules 90%, CBR 10%

Riesgos Detectados (solo Expert Rules):

1. Communication Breakdown
   - Source: expert_rules
   - Probability: 0.75 * 0.90 = 0.675
   - Confidence: 0.90
   - Reasoning:
     * Equipo en 3 zonas horarias
     * Solo 3 horas de superposición
     * Requiere comunicación diaria

2. Skill Gap
   - Source: expert_rules
   - Probability: 0.60 * 0.90 = 0.54
   - Confidence: 0.90
   - Reasoning:
     * MongoDB: nadie en el equipo tiene experiencia
     * React: solo 2 de 5 miembros

3. Team Overload
   - Source: expert_rules
   - Probability: 0.50 * 0.90 = 0.45
   - Confidence: 0.85
   - Reasoning:
     * 2 miembros trabajando en otros proyectos
     * Disponibilidad limitada

CBR: No contribuye (no hay casos históricos)
```

### Ejemplo 2: Después de 20 Proyectos

**Situación:**
- Case Base: 20 casos
- Proyecto: Similar a Ejemplo 1
- Pesos: Expert Rules 50%, CBR 50%

**Predicción:**

```
Expert Rules detecta:
1. Communication Breakdown (P: 0.75)
2. Skill Gap (P: 0.60)
3. Team Overload (P: 0.50)

CBR recupera casos similares:
- Caso #5 (similitud 0.88): Communication Breakdown ocurrió
- Caso #12 (similitud 0.85): Skill Gap ocurrió
- Caso #17 (similitud 0.82): Team Overload NO ocurrió

CBR predice:
1. Communication Breakdown (P: 0.88 * 0.9 = 0.792)
2. Skill Gap (P: 0.85 * 0.8 = 0.68)
3. Team Overload (P: 0.82 * 0.3 = 0.246) ← Baja porque no pasó antes

Combinación (50/50):
1. Communication Breakdown
   - Sources: ['expert_rules', 'cbr']
   - Probability: (0.75 * 0.5) + (0.792 * 0.5) = 0.771
   - Confidence: 0.95 (ambos concuerdan)
   - Source: combined

2. Skill Gap
   - Sources: ['expert_rules', 'cbr']
   - Probability: (0.60 * 0.5) + (0.68 * 0.5) = 0.64
   - Confidence: 0.92
   - Source: combined

3. Team Overload
   - Sources: ['expert_rules', 'cbr']
   - Probability: (0.50 * 0.5) + (0.246 * 0.5) = 0.373
   - Confidence: 0.70 (conflicto entre métodos)
   - Source: combined
   - Note: Expert Rules dice alta probabilidad, 
           pero CBR dice baja (no pasó en casos similares)
```

### Ejemplo 3: Sistema Maduro (50+ Casos de Alta Calidad)

**Situación:**
- Case Base: 52 casos
- Calidad promedio: 0.85
- Diversidad: 0.72
- Pesos: Expert Rules 25%, CBR 75%

**Predicción:**

```
Expert Rules: (peso 25%)
1. Communication Breakdown (P: 0.75)
2. Skill Gap (P: 0.60)

CBR: (peso 75%) - Domina la predicción
Top 5 casos similares (avg similarity: 0.91)

Casos históricos muestran:
- Communication Breakdown: 4/5 veces ocurrió → P: 0.85
- Skill Gap: 3/5 veces ocurrió → P: 0.65
- Quality Degradation: 2/5 veces ocurrió → P: 0.50
  (Expert Rules NO lo detectó, pero CBR sí)

Combinación (25/75):
1. Communication Breakdown
   - Probability: (0.75 * 0.25) + (0.85 * 0.75) = 0.825
   - Confidence: 0.97
   - Reasoning:
     * Expert Rules: Detectado por reglas 1, 2, 3
     * CBR: Ocurrió en 4/5 casos similares
     * Acuerdo fuerte entre ambos métodos

2. Skill Gap
   - Probability: (0.60 * 0.25) + (0.65 * 0.75) = 0.6375
   - Confidence: 0.94
   
3. Quality Degradation (NUEVO - solo CBR)
   - Probability: 0.50 * 0.75 = 0.375
   - Confidence: 0.85
   - Source: cbr
   - Reasoning:
     * NO detectado por Expert Rules
     * Ocurrió en 2/5 proyectos similares
     * Patrón emergente: equipo sobrecargado + plazos ajustados
       → calidad sufre (aun sin regla explícita)
```

**Ventaja del Sistema Maduro:**
CBR descubre un patrón (Quality Degradation en equipos sobrecargados) que las Expert Rules no codificaron explícitamente. El sistema **aprende de la experiencia real** de la organización.

---

## Conclusión

### Fortalezas del Sistema Híbrido

1. **Funciona desde el día 1**: Expert Rules garantizan predicciones razonables sin datos
2. **Mejora continuamente**: CBR aprende de cada proyecto completado
3. **Adaptativo**: Pesos se ajustan automáticamente según madurez
4. **Robusto**: Si uno falla, el otro compensa
5. **Específico**: CBR captura patrones únicos de cada organización
6. **Explicable**: Expert Rules proporcionan razonamiento claro

### Evolución Típica

```
Mes 0-3: Expert Rules 90%, CBR 10%
  → Predicciones basadas en conocimiento experto
  → Precisión: ~60%

Mes 3-6: Expert Rules 70%, CBR 30%
  → Primeros casos completados
  → CBR empieza a contribuir
  → Precisión: ~65%

Mes 6-12: Expert Rules 50%, CBR 50%
  → Base de casos razonable
  → Balance entre métodos
  → Precisión: ~72%

Mes 12+: Expert Rules 25%, CBR 75%
  → Sistema maduro
  → CBR domina, experto valida
  → Precisión: ~80-85%
```

### Recomendaciones de Uso

1. **Al inicio**: Confía en Expert Rules, reporta outcomes fielmente
2. **Con 10+ casos**: Empieza a observar predicciones CBR
3. **Con 30+ casos**: CBR debe ser tu referencia principal
4. **Siempre**: Usa Expert Rules reasoning para entender "por qué"
5. **Mantén calidad**: Reporta outcomes precisos, son el combustible del sistema

---

## Referencias

- **CBR**: Aamodt, A., & Plaza, E. (1994). "Case-based reasoning: Foundational issues, methodological variations, and system approaches"
- **Decision Trees**: Quinlan, J. R. (1986). "Induction of decision trees"
- **Hybrid Systems**: Gómez-Gauchía, H., et al. (2004). "Combining case-based reasoning and rule-based reasoning in a judicial domain"

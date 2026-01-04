# Sistema de Aprendizaje CBR: Cómo el Sistema Mejora con Cada Proyecto

## Resumen Ejecutivo

**SÍ, el sistema CBR (Case-Based Reasoning) está completamente implementado y aprende automáticamente de cada proyecto completado.**

Cuando un proyecto finaliza, el sistema captura su resultado real (éxito, retrasos, riesgos materializados, etc.) y lo convierte en un **nuevo caso** en la base de conocimiento. Este caso se usa después para predecir riesgos en proyectos futuros similares.

---

## Tabla de Contenidos

1. [Flujo Completo del Aprendizaje](#flujo-completo-del-aprendizaje)
2. [Las 4 Fases del CBR (4Rs)](#las-4-fases-del-cbr-4rs)
3. [Implementación Técnica](#implementación-técnica)
4. [Ejemplo Práctico Completo](#ejemplo-práctico-completo)
5. [Endpoints Disponibles](#endpoints-disponibles)
6. [Mejora Continua del Sistema](#mejora-continua-del-sistema)

---

## Flujo Completo del Aprendizaje

### Fase 1: Inicio del Proyecto (Predicción)

```
┌────────────────────────┐
│  Nuevo Proyecto        │
│  - Nombre              │
│  - Tecnologías         │
│  - Equipo              │
│  - Complejidad         │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Sistema CBR           │
│  Busca casos similares │
│  en base de datos      │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Predicción de Riesgos │
│  - Communication       │
│  - Skill Gap           │
│  - Team Overload       │
│  + Probabilidades      │
└────────────────────────┘
```

### Fase 2: Durante el Proyecto

El proyecto se ejecuta. El equipo trabaja, surgen problemas reales, se documentan riesgos que efectivamente ocurrieron.

### Fase 3: Finalización del Proyecto (Aprendizaje)

```
┌────────────────────────┐
│  Proyecto Terminado    │
│  Status: Completed     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  PM captura resultado  │
│  POST /api/projects/   │
│       :id/outcome      │
│                        │
│  Datos capturados:     │
│  - ¿Se completó?       │
│  - Días de retraso     │
│  - Riesgos reales      │
│  - Calidad final       │
│  - Satisfacción        │
│  - Lecciones           │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  postProjectService    │
│  captureProjectOutcome │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  cbrService.retainCase │
│  Crea nuevo caso en    │
│  CaseBase              │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Base de Conocimiento  │
│  Nuevo caso guardado   │
│  +1 experiencia        │
└────────────────────────┘
```

### Fase 4: Siguiente Proyecto (Predicción Mejorada)

```
┌────────────────────────┐
│  Nuevo Proyecto        │
│  (Meses después)       │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Sistema CBR           │
│  Encuentra N+1 casos   │
│  (incluyendo el nuevo) │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Predicción MEJORADA   │
│  Mayor confianza       │
│  Más precisión         │
│  Basada en experiencia │
│  real de la org        │
└────────────────────────┘
```

---

## Las 4 Fases del CBR (4Rs)

El sistema implementa las 4 fases clásicas del Case-Based Reasoning:

### 1. **RETRIEVE** (Recuperar)

**¿Qué hace?**
Busca proyectos pasados similares al proyecto actual.

**Implementación:**
```javascript
// Archivo: src/services/cbr.service.js
async function retrieveSimilarCases(project, organizationId, k = 5, teamAnalysis) {
  // 1. Obtiene todos los casos reales de la organización
  const realCases = await CaseBase.find({
    organization: organizationId,
    type: 'real'
  });
  
  // 2. Obtiene casos semilla (genéricos)
  const seedCases = await CaseBase.find({
    type: 'seed'
  });
  
  // 3. Extrae características del proyecto actual
  const projectFeatures = extractProjectFeatures(project, teamAnalysis);
  
  // 4. Calcula similaridad con cada caso
  const similarities = allCases.map(caseDoc => ({
    case: caseDoc,
    similarity: calculateSimilarity(projectFeatures, caseDoc.problem.features)
  }));
  
  // 5. Ordena por similaridad y devuelve top K
  return similarities
    .filter(s => s.similarity > 0.3) // Umbral mínimo
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
```

**Cálculo de Similaridad:**
```javascript
// Compara 5 dimensiones con pesos diferentes:
const DIMENSION_WEIGHTS = {
  coordination: 0.25,  // Equipo distribuido, zonas horarias, idiomas
  technical: 0.30,     // Tecnologías, complejidad, skills
  team: 0.20,          // Tamaño, experiencia, carga de trabajo
  management: 0.15,    // Metodología, procesos
  organizational: 0.10 // Dependencias, stakeholders
};

// Similaridad total = suma ponderada de todas las dimensiones
totalSimilarity = Σ (similaridad_dimensión * peso_dimensión)
```

### 2. **REUSE** (Reutilizar)

**¿Qué hace?**
Usa las soluciones (riesgos) de los casos similares para predecir riesgos en el nuevo proyecto.

**Implementación:**
```javascript
// Archivo: src/services/cbr.service.js
function reuseSolution(similarCases, project) {
  const riskAggregation = {};
  
  // Acumula riesgos de todos los casos similares
  similarCases.forEach(({ case: caseDoc, similarity, weight }) => {
    caseDoc.solution.actualRisks.forEach(risk => {
      const key = `${risk.type}-${risk.severity}`;
      
      if (!riskAggregation[key]) {
        riskAggregation[key] = {
          type: risk.type,
          severity: risk.severity,
          weightSum: 0,
          examples: []
        };
      }
      
      // Acumula peso basado en similaridad
      const effectiveWeight = similarity * weight;
      riskAggregation[key].weightSum += effectiveWeight;
      
      // Guarda ejemplos para explicación
      riskAggregation[key].examples.push({
        caseId: caseDoc.caseId,
        projectName: caseDoc.problem.projectName,
        similarity,
        description: risk.description
      });
    });
  });
  
  // Calcula probabilidades normalizadas
  const totalWeight = similarCases.reduce((sum, sc) => 
    sum + (sc.similarity * sc.weight), 0
  );
  
  const predictedRisks = Object.values(riskAggregation).map(aggRisk => ({
    type: aggRisk.type,
    severity: aggRisk.severity,
    probability: aggRisk.weightSum / totalWeight, // Normalizado
    confidence: calculateRiskConfidence(aggRisk, similarCases.length),
    basedOnCases: aggRisk.examples,
    reasoning: generateReasoningFromCases(aggRisk.examples)
  }));
  
  return predictedRisks.filter(r => r.probability > 0.3);
}
```

**Ejemplo de Aggregación:**
```
Caso 1 (similaridad 0.8): Risk: Communication Breakdown (high)
Caso 2 (similaridad 0.7): Risk: Communication Breakdown (medium)  
Caso 3 (similaridad 0.9): Risk: Communication Breakdown (high)

Probabilidad final = (0.8 + 0.7 + 0.9) / (0.8 + 0.7 + 0.9 + otros_riesgos)
                   = 2.4 / 3.5 = 0.69 (69% probabilidad)

Severidad final = "high" (porque 2 de 3 casos lo reportaron como high)
```

### 3. **REVISE** (Revisar)

**¿Qué hace?**
Combina la predicción del CBR con las reglas expertas del árbol de decisión.

**Implementación:**
```javascript
// Archivo: src/services/cbr.service.js
function reviseWithTreeRules(cbrRisks, treeRisks) {
  const combinedRisks = new Map();
  
  // Añadir riesgos del CBR
  cbrRisks.forEach(risk => {
    combinedRisks.set(getRiskKey(risk), {
      ...risk,
      sources: ['cbr'],
      cbrConfidence: risk.confidence
    });
  });
  
  // Añadir o fusionar riesgos del árbol de decisión
  treeRisks.forEach(risk => {
    const key = getRiskKey(risk);
    
    if (combinedRisks.has(key)) {
      // Ya existe del CBR → AUMENTAR confianza
      const existing = combinedRisks.get(key);
      existing.sources.push('expert_rules');
      existing.confidence = Math.min(
        (existing.cbrConfidence + risk.confidence) / 2 + 0.1, // Bonus
        0.95
      );
      existing.reasoning.push(...risk.reasoning);
    } else {
      // Riesgo nuevo del árbol
      combinedRisks.set(key, {
        ...risk,
        sources: ['expert_rules']
      });
    }
  });
  
  return Array.from(combinedRisks.values());
}
```

**Ventaja del Sistema Híbrido:**
- **CBR** aprende de experiencias reales → Riesgos específicos de la organización
- **Expert Rules** detecta patrones conocidos → Riesgos universales
- **Fusión** maximiza detección → Mejor de ambos mundos

### 4. **RETAIN** (Retener)

**¿Qué hace?**
Guarda el nuevo proyecto completado como un caso en la base de conocimiento.

**Implementación completa:**

#### Paso 1: Captura del Resultado
```javascript
// Archivo: src/services/postProject.service.js
async function captureProjectOutcome(projectId, outcomeData, userId) {
  // 1. Obtiene el proyecto completo
  const project = await Project.findById(projectId)
    .populate('organization')
    .populate('riskPredictions');
  
  // 2. Valida permisos
  if (!canUpdateOutcome(project, userId)) {
    throw new Error('Not authorized');
  }
  
  // 3. Valida datos
  validateOutcomeData(outcomeData);
  
  // 4. Calcula métricas derivadas
  const derivedData = calculateDerivedMetrics(project, outcomeData);
  // → onTime, delayDays, durationDays
  
  // 5. Guarda resultado en el proyecto
  project.projectOutcome = {
    completed: outcomeData.completed,
    actualCompletedDate: new Date(),
    onTime: derivedData.onTime,
    delayDays: derivedData.delayDays,
    budgetOverrun: outcomeData.budgetOverrun,
    qualityScore: outcomeData.qualityScore,
    clientSatisfaction: outcomeData.clientSatisfaction,
    teamMorale: outcomeData.teamMorale,
    actualizedRisks: outcomeData.actualizedRisks,
    lessonsLearned: outcomeData.lessonsLearned
  };
  await project.save();
  
  // 6. Actualiza predicciones de riesgo con el resultado real
  await updateRiskPredictions(
    project.riskPredictions,
    outcomeData.actualizedRisks
  );
  
  // 7. 🎯 CONVIERTE A CASO CBR (APRENDIZAJE)
  const newCase = await cbrService.retainCase(
    project,
    {
      completed: outcomeData.completed,
      onTime: derivedData.onTime,
      delayDays: derivedData.delayDays,
      budgetOverrun: outcomeData.budgetOverrun,
      qualityScore: outcomeData.qualityScore,
      clientSatisfaction: outcomeData.clientSatisfaction,
      teamMorale: outcomeData.teamMorale,
      actualRisks: transformActualizedRisks(outcomeData.actualizedRisks),
      metrics: outcomeData.metrics,
      lessonsLearned: outcomeData.lessonsLearned
    },
    project.organization
  );
  
  // 8. Genera reporte de aprendizaje
  const learningReport = await generateLearningReport(project, newCase);
  
  return {
    project,
    case: newCase,
    predictionAccuracy: learningReport.accuracy,
    learningReport,
    message: 'System has learned from this project.'
  };
}
```

#### Paso 2: Creación del Caso
```javascript
// Archivo: src/services/cbr.service.js
async function retainCase(project, postProjectData, organization) {
  // 1. Extrae características del proyecto
  const features = extractProjectFeatures(project);
  // → coordination, technical, team, management, organizational
  
  // 2. Crea el nuevo caso
  const newCase = new CaseBase({
    caseId: project._id,
    organization: organization._id,
    type: 'real', // Caso real (no semilla)
    source: 'completed_project',
    
    // PROBLEMA (características del proyecto)
    problem: {
      projectName: project.projectName,
      briefDescription: project.briefDescription,
      estimatedDuration: project.expectedDuration,
      features // 🔥 Todas las características para similaridad
    },
    
    // SOLUCIÓN (lo que realmente pasó)
    solution: {
      completed: postProjectData.completed,
      onTime: postProjectData.onTime,
      delayDays: postProjectData.delayDays,
      budgetOverrun: postProjectData.budgetOverrun,
      qualityScore: postProjectData.qualityScore,
      clientSatisfaction: postProjectData.clientSatisfaction,
      teamMorale: postProjectData.teamMorale,
      actualRisks: postProjectData.actualRisks, // 🔥 Riesgos que SÍ ocurrieron
      metrics: postProjectData.metrics
    },
    
    // RESULTADO (lecciones aprendidas)
    result: {
      lessonsLearned: postProjectData.lessonsLearned,
      successfulPractices: postProjectData.successfulPractices,
      unsuccessfulPractices: postProjectData.unsuccessfulPractices,
      recommendations: postProjectData.recommendations
    },
    
    // METADATA
    metadata: {
      completedAt: new Date(),
      timesReused: 0,
      confidence: 1.0, // Caso real = confianza total
      isGeneric: false,
      tags: extractTags(project, postProjectData)
    }
  });
  
  // 3. Guarda en la base de datos
  await newCase.save();
  
  console.log(`✅ New case retained. Case Base now has ${await CaseBase.countDocuments()} cases`);
  
  return newCase;
}
```

---

## Implementación Técnica

### Modelo de Datos: CaseBase

```javascript
// Archivo: src/models/caseBase.model.js
const caseBaseSchema = new mongoose.Schema({
  caseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project',
    unique: true 
  },
  
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization' 
  },
  
  type: { 
    type: String, 
    enum: ['real', 'seed', 'synthetic'] 
  },
  
  // PROBLEMA (entrada)
  problem: {
    projectName: String,
    features: {
      coordination: {
        teamRegions: [String],
        timeOverlap: Number,
        requiresSyncComm: String,
        weeklyMeetings: Number,
        hasLanguageBarriers: Boolean,
        languageCoverage: Number
      },
      technical: {
        mainTechnologies: [String],
        experienceLevel: String,
        systemComplexity: String,
        techMatchPercentage: Number,
        missingTechnologies: Number
      },
      team: {
        size: Number,
        weeklyHours: Number,
        actualExperienceLevel: String,
        isOverloaded: Boolean,
        avgConscientiousness: Number,
        avgOpenness: Number
      },
      management: {
        methodology: String,
        hasOnboarding: String,
        hasCICD: String
      },
      organizational: {
        involvedTeams: Number,
        criticalDependencies: Number,
        stakeholdersCount: Number
      }
    }
  },
  
  // SOLUCIÓN (resultado real)
  solution: {
    completed: Boolean,
    onTime: Boolean,
    delayDays: Number,
    budgetOverrun: Number,
    qualityScore: Number,
    clientSatisfaction: Number,
    teamMorale: Number,
    
    // 🔥 RIESGOS QUE OCURRIERON
    actualRisks: [{
      type: String,
      severity: String,
      description: String,
      detectedAt: Date,
      actualImpact: {
        scheduleDelayDays: Number,
        budgetOverrunPercent: Number,
        qualityImpact: String
      }
    }]
  },
  
  // RESULTADO (aprendizajes)
  result: {
    lessonsLearned: [String],
    successfulPractices: [{
      practice: String,
      impact: String
    }],
    unsuccessfulPractices: [{
      practice: String,
      reason: String
    }]
  },
  
  // METADATA
  metadata: {
    completedAt: Date,
    timesReused: Number,
    confidence: Number,
    tags: [String]
  }
});
```

### Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    PROYECTO NUEVO                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/projects/:id/risks/predict                       │
│  → riskPrediction.service.predictProjectRisks()             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  cbr.service.predictRisksWithCBR()                          │
│  ├─ retrieveSimilarCases() → Busca en CaseBase             │
│  ├─ reuseSolution() → Predice riesgos                       │
│  └─ reviseWithTreeRules() → Combina con Expert Rules       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Predicción guardada en Risk model                          │
└─────────────────────────────────────────────────────────────┘

                    (TIEMPO PASA)
                    
┌─────────────────────────────────────────────────────────────┐
│              PROYECTO COMPLETADO                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/projects/:id/outcome                             │
│  Body: {                                                     │
│    completed: true,                                          │
│    delayDays: 15,                                            │
│    budgetOverrun: 5,                                         │
│    qualityScore: 4,                                          │
│    actualizedRisks: [...]                                    │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  postProject.service.captureProjectOutcome()                │
│  ├─ Valida datos                                            │
│  ├─ Calcula métricas                                        │
│  ├─ Actualiza proyecto                                      │
│  └─ Llama a cbr.service.retainCase() 🎯                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  cbr.service.retainCase()                                   │
│  ├─ Extrae características                                  │
│  ├─ Crea documento CaseBase                                 │
│  └─ Guarda en MongoDB                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  📚 CASO AÑADIDO A LA BASE DE CONOCIMIENTO                  │
│  → Disponible para futuras predicciones                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Ejemplo Práctico Completo

### Escenario: E-commerce con Equipo Distribuido

#### Proyecto 1 (Primera vez)

```javascript
// ============================================
// INICIO: Primera predicción
// ============================================

POST /api/projects
{
  "projectName": "E-commerce Global",
  "mainTechnologies": ["React", "Node.js", "MongoDB", "AWS"],
  "systemComplexity": "high",
  "requiredExperienceLevel": "senior",
  "teamRegions": ["Europe", "Asia", "America"],
  "expectedTimeOverlap": { "value": 3 },
  "requiresSynchronousCommunication": "yes",
  "weeklyMeetingsCount": 8
}

// CBR busca casos similares
// → Base de conocimiento vacía (primera vez)
// → Solo usa 15 casos SEED (genéricos)

POST /api/projects/123/risks/predict
Respuesta:
{
  "predictions": [
    {
      "type": "communication_breakdown",
      "severity": "high",
      "probability": 0.65,
      "confidence": 0.45, // 🔻 Baja confianza (solo casos genéricos)
      "source": "cbr",
      "basedOnCases": [
        {
          "caseId": "seed_001",
          "projectName": "Generic Distributed Project",
          "similarity": 0.62
        }
      ],
      "reasoning": [
        "Basado en casos genéricos de literatura",
        "No hay experiencia específica en tu organización"
      ]
    },
    {
      "type": "skill_gap",
      "severity": "medium",
      "probability": 0.55,
      "confidence": 0.40
    }
  ],
  "systemConfidence": 0.42, // 🔻 Baja confianza general
  "message": "Predictions based on 5 generic cases"
}

// ============================================
// EJECUCIÓN: Proyecto se desarrolla
// ============================================

// ... 6 meses después ...

// ============================================
// FINALIZACIÓN: Captura de resultado
// ============================================

POST /api/projects/123/outcome
{
  "completed": true,
  "actualCompletedDate": "2024-12-15",
  "delayDays": 25,
  "budgetOverrun": 15,
  "qualityScore": 3,
  "clientSatisfaction": 4,
  "teamMorale": 3,
  
  "actualizedRisks": [
    {
      "type": "communication_breakdown",
      "occurred": true,
      "severity": "high",
      "description": "Equipo en Asia no podía asistir a reuniones diarias",
      "detectedAt": "2024-08-01",
      "scheduleDelayDays": 20,
      "budgetOverrunPercent": 10,
      "rootCause": "Time zone overlap too small"
    },
    {
      "type": "skill_gap",
      "occurred": true,
      "severity": "medium",
      "description": "Equipo no dominaba AWS Lambda",
      "scheduleDelayDays": 5,
      "rootCause": "Lack of serverless experience"
    }
  ],
  
  "lessonsLearned": [
    "Equipos distribuidos en más de 2 zonas requieren > 4h overlap",
    "AWS requiere capacitación previa de al menos 2 semanas",
    "Reuniones diarias no funcionan con 3 regiones"
  ],
  
  "successfulPractices": [
    {
      "practice": "Documentación asíncrona en Notion",
      "impact": "Reduced meeting dependency by 40%",
      "replicable": true
    }
  ]
}

Respuesta:
{
  "success": true,
  "message": "System has learned from this project.",
  "data": {
    "case": {
      "id": "674a12...",
      "caseId": "123",
      "addedToKnowledgeBase": true
    },
    "predictionAccuracy": {
      "overall": 0.85, // 85% de precisión
      "correctPredictions": 2,
      "falsePositives": 0,
      "falseNegatives": 0
    },
    "learningReport": {
      "systemImpact": {
        "caseBaseSize": 1, // 🎯 Primer caso real
        "expectedConfidenceIncrease": 0.15
      }
    }
  }
}

// ============================================
// MongoDB: Nuevo documento en CaseBase
// ============================================

{
  "_id": "674a12...",
  "caseId": "123",
  "organization": "org_xyz",
  "type": "real",
  "source": "completed_project",
  
  "problem": {
    "projectName": "E-commerce Global",
    "features": {
      "coordination": {
        "teamRegions": ["Europe", "Asia", "America"],
        "timeOverlap": 3,
        "requiresSyncComm": "yes",
        "weeklyMeetings": 8
      },
      "technical": {
        "mainTechnologies": ["React", "Node.js", "MongoDB", "AWS"],
        "systemComplexity": "high",
        "experienceLevel": "senior"
      }
    }
  },
  
  "solution": {
    "completed": true,
    "onTime": false,
    "delayDays": 25,
    "budgetOverrun": 15,
    "qualityScore": 3,
    
    "actualRisks": [
      {
        "type": "communication_breakdown",
        "severity": "high",
        "actualImpact": {
          "scheduleDelayDays": 20
        }
      },
      {
        "type": "skill_gap",
        "severity": "medium",
        "actualImpact": {
          "scheduleDelayDays": 5
        }
      }
    ]
  },
  
  "result": {
    "lessonsLearned": [
      "Equipos distribuidos en más de 2 zonas requieren > 4h overlap",
      "AWS requiere capacitación previa"
    ]
  },
  
  "metadata": {
    "completedAt": "2024-12-15",
    "timesReused": 0,
    "confidence": 1.0,
    "isGeneric": false
  }
}
```

#### Proyecto 2 (6 meses después)

```javascript
// ============================================
// PROYECTO SIMILAR, 6 MESES DESPUÉS
// ============================================

POST /api/projects
{
  "projectName": "Mobile App Internacional",
  "mainTechnologies": ["React Native", "Node.js", "PostgreSQL", "Azure"],
  "systemComplexity": "high",
  "requiredExperienceLevel": "senior",
  "teamRegions": ["Europe", "Asia"], // Similar al anterior
  "expectedTimeOverlap": { "value": 4 },
  "requiresSynchronousCommunication": "yes",
  "weeklyMeetingsCount": 6
}

POST /api/projects/456/risks/predict

// ============================================
// CBR ahora encuentra casos reales
// ============================================

// RETRIEVE: Busca casos similares
CaseBase.find({ organization: "org_xyz", type: "real" })
// → Encuentra "E-commerce Global" (Proyecto 1)

// Calcula similaridad:
Coordination: 0.85 // Mismos problemas de zonas horarias
Technical: 0.70    // Tecnologías similares (React, Node, cloud)
Team: 0.75         // Mismo tamaño y experiencia
Management: 0.80   // Misma metodología
Organizational: 0.70

Similaridad Total: 0.76 (76% similar) ✅

Respuesta:
{
  "predictions": [
    {
      "type": "communication_breakdown",
      "severity": "high",
      "probability": 0.78, // 🔺 Probabilidad MÁS ALTA
      "confidence": 0.75,  // 🔺 Confianza MUCHO MAYOR
      "source": "cbr",
      "basedOnCases": [
        {
          "caseId": "123",
          "projectName": "E-commerce Global", // 🎯 TU PROYECTO ANTERIOR
          "similarity": 0.76,
          "description": "Equipo en Asia no podía asistir a reuniones diarias"
        }
      ],
      "reasoning": [
        "Proyecto 'E-commerce Global' (76% similar) sufrió este riesgo",
        "Retraso de 20 días por time zone overlap insuficiente",
        "Tu proyecto tiene overlap similar (4h vs 3h anterior)"
      ],
      "recommendations": [
        "Basado en E-commerce Global: Aumentar overlap a >4h o cambiar a comunicación asíncrona",
        "Implementar documentación asíncrona (funcionó en proyecto anterior)",
        "Evitar reuniones diarias síncronas con más de 2 regiones"
      ],
      "predictedImpact": {
        "scheduleDelayDays": 20, // Basado en caso anterior
        "budgetOverrunPercent": 10
      }
    }
  ],
  
  "systemConfidence": 0.72, // 🔺 Confianza SUBIÓ de 0.42 a 0.72
  
  "message": "Prediction based on 1 real organizational case + 5 generic cases",
  
  "learningInsights": {
    "organizationalExperience": "Tu organización ya completó 1 proyecto similar",
    "accuracyImprovement": "+30% compared to first prediction",
    "recommendationsQuality": "High (based on real lessons learned)"
  }
}
```

### Comparación de Resultados

| Aspecto | Proyecto 1 (sin experiencia) | Proyecto 2 (con 1 caso) |
|---------|------------------------------|--------------------------|
| **Casos similares** | 0 reales, 5 genéricos | 1 real, 5 genéricos |
| **Similaridad promedio** | 0.52 (casos seed) | 0.76 (caso real) |
| **Confianza del sistema** | 0.42 (42%) | 0.72 (72%) |
| **Calidad de recomendaciones** | Genéricas | Específicas y probadas |
| **Predicción de impacto** | Estimada | Basada en datos reales |
| **Lecciones aprendidas** | No disponibles | Disponibles y aplicables |

---

## Endpoints Disponibles

### 1. Capturar Resultado del Proyecto (APRENDIZAJE)

```http
POST /api/projects/:projectId/outcome
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true,
  "actualCompletedDate": "2024-12-15T00:00:00Z",
  "budgetOverrun": 15,
  "qualityScore": 4,
  "clientSatisfaction": 5,
  "teamMorale": 4,
  
  "actualizedRisks": [
    {
      "type": "communication_breakdown",
      "occurred": true,
      "severity": "high",
      "description": "Time zone conflicts",
      "detectedAt": "2024-08-01",
      "scheduleDelayDays": 20,
      "budgetOverrunPercent": 10,
      "rootCause": "Insufficient time overlap"
    }
  ],
  
  "lessonsLearned": [
    "Increase time overlap to >4 hours",
    "Use async documentation tools"
  ],
  
  "successfulPractices": [
    {
      "practice": "Daily async updates in Slack",
      "impact": "Reduced meeting dependency",
      "replicable": true
    }
  ],
  
  "metrics": {
    "avgVelocity": 25,
    "bugRate": 0.05,
    "deploymentFrequency": "weekly"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Outcome captured successfully. System has learned from this project.",
  "data": {
    "project": {
      "id": "674a...",
      "name": "E-commerce Global",
      "outcome": { ... }
    },
    "case": {
      "id": "674b...",
      "caseId": "674a...",
      "addedToKnowledgeBase": true
    },
    "predictionAccuracy": {
      "overall": 0.85,
      "correctPredictions": 2,
      "falsePositives": 0,
      "falseNegatives": 1
    },
    "learningReport": {
      "accuracy": { ... },
      "learnings": {
        "strengthenedBeliefs": [
          "Communication breakdown is highly likely in multi-region teams with <4h overlap"
        ],
        "newInsights": [
          "AWS Lambda requires 2 weeks training for mid-level developers"
        ]
      },
      "systemImpact": {
        "caseBaseSize": 5,
        "expectedConfidenceIncrease": 0.12
      }
    }
  }
}
```

### 2. Obtener Formulario de Post-Proyecto

```http
GET /api/projects/:projectId/outcome/form
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "projectInfo": {
      "id": "674a...",
      "name": "E-commerce Global",
      "estimatedEndDate": "2024-11-20",
      "status": "completed"
    },
    "predictedRisks": [
      {
        "type": "communication_breakdown",
        "severity": "high",
        "description": "Time zone conflicts..."
      }
    ],
    "requiredFields": [
      "completed",
      "qualityScore",
      "actualizedRisks"
    ],
    "optionalFields": [
      "lessonsLearned",
      "successfulPractices",
      "metrics"
    ]
  }
}
```

### 3. Ver Estadísticas de la Base de Casos

```http
GET /api/organizations/:orgId/case-base/stats
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "byType": {
      "real": 7,
      "seed": 5
    },
    "avgQualityScore": 3.8,
    "mostCommonRisks": [
      {
        "type": "communication_breakdown",
        "occurrences": 5,
        "avgSeverity": "high"
      },
      {
        "type": "skill_gap",
        "occurrences": 4,
        "avgSeverity": "medium"
      }
    ],
    "organizationalInsights": {
      "totalProjectsCompleted": 7,
      "avgDelayDays": 18,
      "avgBudgetOverrun": 12,
      "completionRate": 0.85
    },
    "systemMaturity": {
      "maturityLevel": "intermediate",
      "confidenceScore": 0.68,
      "message": "System has good organizational data"
    }
  }
}
```

### 4. Ver Precisión de Predicciones

```http
GET /api/organizations/:orgId/risks/accuracy
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "accuracy": 0.82,
      "correctPredictions": 23,
      "falsePositives": 3,
      "falseNegatives": 2
    },
    "byRiskType": {
      "communication_breakdown": {
        "accuracy": 0.90,
        "precision": 0.85,
        "recall": 0.95
      },
      "skill_gap": {
        "accuracy": 0.75,
        "precision": 0.80,
        "recall": 0.70
      }
    },
    "trend": {
      "improvementRate": 0.15,
      "message": "Accuracy improving as more cases are learned"
    }
  }
}
```

---

## Mejora Continua del Sistema

### Evolución de la Confianza

```
Proyecto 1:  Confianza = 0.42 (solo casos genéricos)
Proyecto 5:  Confianza = 0.58 (+38%)
Proyecto 10: Confianza = 0.72 (+71%)
Proyecto 20: Confianza = 0.85 (+102%)
Proyecto 30: Confianza = 0.90 (+114%)
```

**Factores que aumentan la confianza:**

1. **Cobertura de la Base de Casos** (20% del peso)
   ```javascript
   coverageScore = min(totalCases / 30, 1.0)
   // 10 casos → 0.33
   // 20 casos → 0.67
   // 30+ casos → 1.00
   ```

2. **Calidad de los Casos Similares** (30% del peso)
   ```javascript
   caseQualityScore = avgSimilarity > 0.7 ? avgSimilarity : avgSimilarity * 0.5
   // Similaridad 0.8 → 0.8
   // Similaridad 0.5 → 0.25
   ```

3. **Consenso entre Casos** (20% del peso)
   ```javascript
   consensusScore = risksInMajority / totalRisks
   // 5 de 5 casos predicen el mismo riesgo → 1.0
   // 3 de 5 casos predicen el mismo riesgo → 0.6
   ```

4. **Recencia de los Casos** (15% del peso)
   ```javascript
   recencyScore = 1 - (avgAgeMonths / 36)
   // Casos de hace 6 meses → 0.83
   // Casos de hace 18 meses → 0.50
   // Casos de hace 36+ meses → 0.0
   ```

5. **Historial de Precisión** (15% del peso)
   ```javascript
   trackRecordScore = correctPredictions / totalPredictions
   // 17 de 20 correctas → 0.85
   ```

### Ejemplo de Evolución Real

```javascript
// Organización recién creada
{
  "caseBaseSize": 0,
  "systemConfidence": 0.35,
  "predictionQuality": "low",
  "recommendationsSource": "generic literature"
}

// Después de 3 proyectos
{
  "caseBaseSize": 3,
  "systemConfidence": 0.52,
  "predictionQuality": "fair",
  "recommendationsSource": "mix of generic + organizational"
}

// Después de 10 proyectos
{
  "caseBaseSize": 10,
  "systemConfidence": 0.72,
  "predictionQuality": "good",
  "recommendationsSource": "primarily organizational",
  "insights": {
    "commonPatterns": [
      "Distributed teams with <4h overlap always face communication issues",
      "AWS projects require 2 weeks training for mid-level devs",
      "Scrum works better than Kanban for high-complexity projects"
    ]
  }
}

// Después de 30+ proyectos
{
  "caseBaseSize": 35,
  "systemConfidence": 0.88,
  "predictionQuality": "excellent",
  "recommendationsSource": "organizational best practices",
  "insights": {
    "organizationalDNA": {
      "strengthAreas": ["Cloud infrastructure", "React development"],
      "weaknessAreas": ["Mobile development", "Machine Learning"],
      "riskProfile": {
        "mostLikely": "communication_breakdown (45% of projects)",
        "leastLikely": "quality_degradation (5% of projects)"
      }
    },
    "predictiveAccuracy": 0.89,
    "averageImpactPredictionError": "±3 days"
  }
}
```

---

## Conclusión

El sistema CBR **está completamente implementado** y funciona de la siguiente manera:

1. **Inicio:** Sistema usa casos genéricos (seeds) para predicciones básicas
2. **Ejecución:** Proyectos se desarrollan normalmente
3. **Finalización:** PM captura resultado vía `POST /api/projects/:id/outcome`
4. **Aprendizaje:** Sistema convierte proyecto en caso CBR automáticamente
5. **Mejora:** Cada nuevo caso aumenta precisión y confianza
6. **Futuro:** Predicciones cada vez más personalizadas y precisas

**Ventajas del Sistema:**
- ✅ Aprende automáticamente de cada proyecto
- ✅ Mejora con el tiempo sin intervención manual
- ✅ Genera recomendaciones basadas en experiencia real
- ✅ Aumenta confianza progresivamente
- ✅ Detecta patrones específicos de cada organización
- ✅ Combina conocimiento experto + experiencia organizacional

**Estado Actual:**
- ✅ Modelo de datos implementado (`CaseBase`)
- ✅ Servicio CBR completo (`cbr.service.js`)
- ✅ Servicio de post-proyecto (`postProject.service.js`)
- ✅ Endpoints funcionales
- ✅ Sistema híbrido Expert Rules + CBR
- ✅ Reporting y analytics

**Para usarlo:**
1. Crea proyectos normalmente
2. Cuando finalicen, captura resultado con `POST /api/projects/:id/outcome`
3. El sistema aprende automáticamente
4. Futuras predicciones serán cada vez mejores

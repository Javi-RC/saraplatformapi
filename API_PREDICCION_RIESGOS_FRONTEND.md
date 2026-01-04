# API de Predicción de Riesgos - Guía para Frontend

## 🎯 Endpoint Principal

```http
POST /api/projects/:projectId/risks/predict
```

**Importante:** El frontend **NO necesita enviar datos en el body**. Solo el `projectId` en la URL.

---

## 📋 Pre-requisitos (Datos que DEBEN existir antes de predecir)

### 1️⃣ **Proyecto Configurado Completamente**

Antes de llamar al endpoint de predicción, el proyecto debe tener configurados estos campos **obligatorios**:

#### **A. Información General** ✅
```javascript
{
  projectName: "E-commerce Platform",
  briefDescription: "Full-stack e-commerce with React and Node.js...",
  estimatedStartDate: "2024-01-15",
  estimatedEndDate: "2024-06-30",
  expectedDuration: { value: 6, unit: "months" }
}
```

#### **B. Tecnologías y Complejidad** ⚠️ CRÍTICO
```javascript
{
  // Tecnologías requeridas (comparadas con CVs del equipo)
  mainTechnologies: ["React", "Node.js", "PostgreSQL", "Docker"],
  
  // Nivel de experiencia requerido
  requiredExperienceLevel: "senior",  // 'junior' | 'mid' | 'senior' | 'expert'
  
  // Complejidad del sistema
  systemComplexity: "high",  // 'low' | 'medium' | 'high'
  
  // Nivel de documentación
  documentationLevel: "partial"  // 'complete' | 'partial' | 'minimal' | 'none'
}
```

#### **C. Comunicación y Colaboración** ⚠️ CRÍTICO
```javascript
{
  // Regiones del equipo (para detectar riesgos de coordinación)
  teamRegions: ["Europe/Madrid", "America/New_York", "Asia/Tokyo"],
  
  // Solapamiento horario esperado
  expectedTimeOverlap: { value: 4, unit: "hours" },
  
  // Requiere comunicación síncrona
  requiresSynchronousCommunication: "yes",  // 'yes' | 'no' | 'only_critical_moments'
  
  // Nivel de comunicación en tiempo real
  realTimeCommunicationLevel: "high",  // 'low' | 'medium' | 'high'
  
  // Reuniones semanales
  weeklyMeetingsCount: 5,
  
  // Diversidad cultural
  culturalDiversityLevel: "high"  // 'low' | 'medium' | 'high'
}
```

#### **D. Idiomas Requeridos** ⚠️ CRÍTICO
```javascript
{
  // Idiomas necesarios (comparados con CVs)
  requiredLanguages: ["English", "Spanish"],
  
  // Proficiencia mínima
  minimumLanguageProficiency: "C1"  // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native'
}
```

#### **E. Roles y Disponibilidad**
```javascript
{
  // Horas semanales por miembro
  weeklyHoursPerMember: 40,
  
  // Requiere disponibilidad fuera de horario
  requiresAfterHoursAvailability: true,
  
  // Períodos de alta carga
  highLoadPeriods: [
    { startDate: "2024-03-01", endDate: "2024-03-15", description: "Launch period" }
  ]
}
```

#### **F. Procesos y Herramientas**
```javascript
{
  // Tiene procesos de onboarding
  hasOnboardingProcesses: "yes",  // 'yes' | 'no' | 'partial'
  
  // Tiene control de versiones y CI/CD
  hasVersionControlAndCICD: "yes",  // 'yes' | 'no' | 'partial'
  
  // Fragmentación de herramientas
  internalToolsFragmentation: "low",  // 'low' | 'medium' | 'high'
  
  // Nivel de experiencia en trabajo distribuido
  distributedWorkExperienceLevel: "medium"  // 'low' | 'medium' | 'high'
}
```

#### **G. Dependencias y Stakeholders**
```javascript
{
  // Equipos involucrados
  involvedTeams: 3,
  
  // Dependencias críticas
  criticalDependencies: 5,
  
  // Dirección del flujo de información
  informationFlowDirection: "bidirectional",  // 'top_down' | 'bottom_up' | 'bidirectional'
  
  // Stakeholders clave
  keyStakeholders: [
    { name: "John Doe", role: "Product Owner", influence: "high" }
  ]
}
```

#### **H. Equipo Asignado** ⚠️ CRÍTICO
```javascript
{
  // Empleados asignados al proyecto
  assignedEmployees: [
    {
      user: "userId1",  // ObjectId del empleado
      assignedRole: "Frontend Developer",
      assignedAt: "2024-01-01"
    },
    {
      user: "userId2",
      assignedRole: "Backend Developer",
      assignedAt: "2024-01-01"
    }
  ]
}
```

---

### 2️⃣ **Empleados con CVs Aceptados** ⚠️ CRÍTICO

Cada empleado en `assignedEmployees[]` DEBE tener:

#### **CV Aceptado por la Organización**
```javascript
// Estado del CV
{
  userId: "employeeId",
  organizationStatus: "accepted",  // ⚠️ DEBE ser 'accepted'
  
  // Skills técnicos (comparados con mainTechnologies)
  skills: [
    {
      name: "React",
      proficiency: "advanced",  // 'beginner' | 'intermediate' | 'advanced' | 'expert'
      category: "frameworks",
      yearsOfExperience: 3
    },
    {
      name: "Node.js",
      proficiency: "intermediate",
      category: "programming"
    }
  ],
  
  // Experiencia laboral (para calcular años y nivel)
  experience: [
    {
      company: "Tech Corp",
      position: "Senior Developer",
      startDate: "2020-01-01",
      endDate: "2023-12-31",
      technologies: ["React", "TypeScript", "Node.js"]
    }
  ],
  
  // Idiomas (comparados con requiredLanguages)
  languages: [
    {
      language: "English",
      proficiency: "C1"  // ⚠️ Comparado con minimumLanguageProficiency
    },
    {
      language: "Spanish",
      proficiency: "Native"
    }
  ]
}
```

#### **BFI-44 Completado (Opcional pero Recomendado)**
```javascript
{
  userId: "employeeId",
  results: {
    Extraversion: 3.5,      // 1-5
    Agreeableness: 4.2,     // 1-5
    Conscientiousness: 2.8, // ⚠️ < 2.5 = riesgo de calidad
    Neuroticism: 3.9,       // ⚠️ > 3.5 = riesgo de estrés
    Openness: 3.2           // 1-5
  }
}
```

---

## 🚀 Flujo Completo desde el Frontend

### **Paso 1: Verificar Pre-requisitos**

```javascript
// Frontend: Antes de predecir, verificar que el proyecto esté completo
async function checkProjectReadiness(projectId) {
  const project = await api.get(`/api/projects/${projectId}`);
  
  const warnings = [];
  
  // Check critical fields
  if (!project.mainTechnologies?.length) {
    warnings.push('⚠️ Falta configurar tecnologías requeridas');
  }
  
  if (!project.requiredExperienceLevel) {
    warnings.push('⚠️ Falta configurar nivel de experiencia requerido');
  }
  
  if (!project.assignedEmployees?.length) {
    warnings.push('⚠️ No hay empleados asignados al proyecto');
  }
  
  if (!project.requiredLanguages?.length) {
    warnings.push('⚠️ Falta configurar idiomas requeridos');
  }
  
  if (warnings.length > 0) {
    return {
      ready: false,
      warnings,
      message: 'Complete los datos faltantes antes de predecir riesgos'
    };
  }
  
  return { ready: true };
}
```

### **Paso 2: Llamar al Endpoint de Predicción**

```javascript
// Frontend: Realizar predicción
async function predictProjectRisks(projectId) {
  try {
    // 1. Verificar pre-requisitos
    const readiness = await checkProjectReadiness(projectId);
    
    if (!readiness.ready) {
      return {
        success: false,
        errors: readiness.warnings
      };
    }
    
    // 2. Llamar al endpoint (sin body!)
    const response = await api.post(`/api/projects/${projectId}/risks/predict`);
    
    return response.data;
    
  } catch (error) {
    console.error('Error predicting risks:', error);
    throw error;
  }
}
```

---

## 📥 Respuesta del Backend

### **Estructura de la Respuesta**

```javascript
{
  success: true,
  message: "Risk prediction completed successfully",
  data: {
    // Array de riesgos detectados
    risks: [
      {
        type: "skill_gap",
        category: "technical",
        severity: "high",              // 'low' | 'medium' | 'medium-high' | 'high'
        probability: 0.85,             // 0-1
        confidence: 0.85,              // 0-1 (con CVs es > 0.80)
        source: "expert_rules_with_cv_data",
        
        // Razones específicas
        reasoning: [
          "CRÍTICO: Equipo carece de 2 tecnologías: React, PostgreSQL",
          "Match tecnológico muy bajo: 33%",
          "Gap de experiencia: requiere senior, tiene mid"
        ],
        
        // Indicadores cuantitativos
        indicators: [
          "Complejidad: high",
          "Match tecnológico: 33%",
          "Gap experiencia: 1 niveles",
          "Tecnologías faltantes: 2",
          "Proficiencia: 1.5/5"
        ],
        
        // Impacto predicho
        predictedImpact: {
          scheduleDelay: {
            min: 20,
            max: 60,
            description: "Curva de aprendizaje, rework y training"
          },
          budgetOverrun: {
            min: 25,
            max: 50,
            description: "Costo de training, contrataciones y corrección"
          },
          qualityImpact: "high",         // 'low' | 'medium' | 'high'
          teamMoraleImpact: "medium"
        },
        
        // Recomendaciones accionables
        recommendations: [
          "URGENTE: Contratar especialistas en React y PostgreSQL",
          "Considerar training boot camp (4-6 semanas)",
          "Re-evaluar viabilidad del proyecto con equipo actual"
        ],
        
        // Señales de alerta temprana
        earlyWarningSignals: [
          {
            signal: "Bug rate > 0.15 per story point",
            threshold: "0.15",
            checkFrequency: "weekly"
          }
        ]
      },
      
      {
        type: "communication_breakdown",
        severity: "high",
        probability: 0.85,
        reasoning: [
          "CRÍTICO: Equipo no domina idiomas requeridos: German",
          "2 miembros con nivel de idioma insuficiente"
        ]
      },
      
      {
        type: "team_overload",
        severity: "high",
        probability: 0.90,
        reasoning: [
          "CRÍTICO: 1 miembros sobrecargados",
          "Carga promedio: 90h/semana"
        ]
      }
    ],
    
    // Metadata del sistema
    metadata: {
      predictionDate: "2024-01-15T10:30:00Z",
      
      // Confianza general
      overallConfidence: 0.85,
      
      // Fase del sistema (afecta weights)
      systemPhase: "mature",  // 'bootstrap' | 'growth' | 'mature'
      
      // Pesos adaptativos usados
      weights: {
        treeWeight: 0.30,  // Decision Tree
        cbrWeight: 0.70    // Case-Based Reasoning
      },
      
      // Estadísticas de la base de casos
      caseBaseStats: {
        total: 45,
        avgQuality: 0.82,
        diversityIndex: 0.75
      },
      
      // ⭐ Insights del equipo (NUEVO)
      teamInsights: [
        {
          type: "skill_gap",
          severity: "high",
          message: "Equipo carece de: React, PostgreSQL",
          recommendation: "Contratar especialistas o plan de formación urgente"
        },
        {
          type: "experience_gap",
          severity: "high",
          message: "Se requiere nivel senior, equipo tiene mid",
          recommendation: "Añadir mentores senior o reducir complejidad"
        },
        {
          type: "language_barrier",
          severity: "high",
          message: "Idiomas faltantes: German",
          recommendation: "Contratar miembros con idiomas requeridos"
        },
        {
          type: "team_overload",
          severity: "high",
          message: "1 miembros sobrecargados",
          recommendation: "Redistribuir carga o añadir recursos"
        }
      ],
      
      // Casos similares usados (si hay)
      similarCases: [
        {
          caseId: "CASE-2024-001",
          projectName: "Previous E-commerce Project",
          similarity: 0.87,
          outcome: {
            completed: true,
            delayDays: 30,
            budgetOverrun: 15
          }
        }
      ]
    },
    
    // Mensaje descriptivo
    message: "Se detectaron 3 riesgos de alta severidad. Revisa las recomendaciones."
  }
}
```

---

## 🎨 Ejemplo de UI en el Frontend

### **Dashboard de Riesgos**

```jsx
function RiskDashboard({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  
  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await predictProjectRisks(projectId);
      setPrediction(result.data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={handlePredict} disabled={loading}>
        {loading ? 'Analizando...' : 'Predecir Riesgos'}
      </button>
      
      {prediction && (
        <>
          {/* Overall Stats */}
          <StatsCard>
            <Stat label="Riesgos Detectados" value={prediction.risks.length} />
            <Stat label="Confianza" value={`${(prediction.metadata.overallConfidence * 100).toFixed(0)}%`} />
            <Stat label="Casos Similares" value={prediction.metadata.similarCases?.length || 0} />
          </StatsCard>
          
          {/* Team Insights */}
          <TeamInsightsPanel insights={prediction.metadata.teamInsights} />
          
          {/* Risks List */}
          <RisksList risks={prediction.risks} />
        </>
      )}
    </div>
  );
}

function TeamInsightsPanel({ insights }) {
  const highSeverity = insights.filter(i => i.severity === 'high');
  
  return (
    <Panel title="Análisis del Equipo" severity={highSeverity.length > 0 ? 'high' : 'medium'}>
      {insights.map((insight, idx) => (
        <InsightCard key={idx} severity={insight.severity}>
          <Icon type={insight.type} />
          <div>
            <h4>{insight.message}</h4>
            <p>{insight.recommendation}</p>
          </div>
        </InsightCard>
      ))}
    </Panel>
  );
}

function RisksList({ risks }) {
  const highRisks = risks.filter(r => r.severity === 'high');
  const mediumRisks = risks.filter(r => r.severity.includes('medium'));
  
  return (
    <div>
      {/* High Priority Risks */}
      {highRisks.length > 0 && (
        <RiskGroup title="Riesgos Críticos" severity="high">
          {highRisks.map((risk, idx) => (
            <RiskCard key={idx} risk={risk} />
          ))}
        </RiskGroup>
      )}
      
      {/* Medium Priority Risks */}
      {mediumRisks.length > 0 && (
        <RiskGroup title="Riesgos Moderados" severity="medium">
          {mediumRisks.map((risk, idx) => (
            <RiskCard key={idx} risk={risk} />
          ))}
        </RiskGroup>
      )}
    </div>
  );
}

function RiskCard({ risk }) {
  return (
    <Card severity={risk.severity}>
      <Header>
        <Badge severity={risk.severity}>{risk.severity}</Badge>
        <Title>{getRiskTypeLabel(risk.type)}</Title>
        <Probability>{(risk.probability * 100).toFixed(0)}%</Probability>
      </Header>
      
      {/* Reasoning */}
      <Section title="¿Por qué?">
        <ul>
          {risk.reasoning.map((reason, idx) => (
            <li key={idx}>{reason}</li>
          ))}
        </ul>
      </Section>
      
      {/* Impact */}
      <Section title="Impacto Esperado">
        <ImpactGrid>
          <ImpactItem 
            label="Retraso" 
            value={`${risk.predictedImpact.scheduleDelay.min}-${risk.predictedImpact.scheduleDelay.max} días`}
          />
          <ImpactItem 
            label="Sobrecosto" 
            value={`${risk.predictedImpact.budgetOverrun.min}-${risk.predictedImpact.budgetOverrun.max}%`}
          />
          <ImpactItem 
            label="Calidad" 
            value={risk.predictedImpact.qualityImpact}
          />
        </ImpactGrid>
      </Section>
      
      {/* Recommendations */}
      <Section title="Recomendaciones">
        <RecommendationsList>
          {risk.recommendations.map((rec, idx) => (
            <RecommendationItem key={idx} urgent={rec.startsWith('URGENTE')}>
              {rec}
            </RecommendationItem>
          ))}
        </RecommendationsList>
      </Section>
      
      {/* Early Warning Signals */}
      <Accordion title="Señales de Alerta">
        <SignalsList signals={risk.earlyWarningSignals} />
      </Accordion>
    </Card>
  );
}
```

---

## ❌ Manejo de Errores

### **Errores Comunes**

```javascript
// 1. Proyecto no encontrado
{
  success: false,
  error: "Project not found"
}
// → Verificar que projectId existe

// 2. No hay empleados asignados
{
  success: false,
  error: "No team members assigned to project"
}
// → Asignar empleados: POST /api/projects/:id/assign-employee

// 3. Empleados sin CVs aceptados
{
  success: false,
  error: "No accepted CVs found for team members"
}
// → Empleados deben:
//   1. Crear CV: POST /api/cv
//   2. Enviar a org: POST /api/cv/:id/submit-to-organization
//   3. Admin acepta: PATCH /api/organizations/:id/cv/:cvId/accept

// 4. Datos incompletos del proyecto
{
  success: true,
  data: {
    risks: [...],
    metadata: {
      confidence: 0.45,  // ⚠️ Baja confianza
      warnings: [
        "Project missing mainTechnologies",
        "Project missing requiredLanguages"
      ]
    }
  }
}
// → Completar campos faltantes del proyecto
```

---

## 📊 Checklist para el Frontend

Antes de habilitar el botón "Predecir Riesgos", verificar:

```javascript
const canPredict = (project) => {
  return (
    // Datos básicos
    project.projectName &&
    project.estimatedStartDate &&
    project.estimatedEndDate &&
    
    // Tecnología (CRÍTICO)
    project.mainTechnologies?.length > 0 &&
    project.requiredExperienceLevel &&
    project.systemComplexity &&
    
    // Equipo (CRÍTICO)
    project.assignedEmployees?.length > 0 &&
    
    // Comunicación
    project.requiredLanguages?.length > 0 &&
    project.teamRegions?.length > 0 &&
    
    // Procesos
    project.hasOnboardingProcesses &&
    project.hasVersionControlAndCICD
  );
};
```

---

## 🚀 Resumen para el Frontend

### **LO QUE EL FRONTEND ENVÍA:**
```javascript
// ¡NADA! Solo el projectId en la URL
POST /api/projects/507f1f77bcf86cd799439011/risks/predict
// Body: {} (vacío)
```

### **LO QUE EL BACKEND NECESITA (pre-configurado):**
1. ✅ Proyecto con todos los campos completos
2. ✅ Empleados asignados al proyecto
3. ✅ CVs aceptados de los empleados (con skills, experiencia, idiomas)
4. ✅ BFI-44 completado (opcional pero mejora precisión)

### **LO QUE EL FRONTEND RECIBE:**
```javascript
{
  risks: [...],              // Array de riesgos con severidad, probabilidad, recomendaciones
  metadata: {
    teamInsights: [...],     // Insights del equipo (gaps, sobrecarga, etc.)
    confidence: 0.85,        // Confianza de la predicción
    similarCases: [...]      // Casos históricos similares
  }
}
```

---

## 📞 Endpoints Relacionados

Para preparar el proyecto antes de predecir:

```javascript
// Crear proyecto
POST /api/projects

// Asignar empleados
POST /api/projects/:id/assign-employee
Body: { userId, assignedRole }

// Actualizar proyecto
PUT /api/projects/:id
Body: { mainTechnologies, requiredExperienceLevel, etc. }

// Verificar empleados tienen CVs
GET /api/organizations/:orgId/employees
// → Verificar que todos tengan CV con organizationStatus: 'accepted'

// Verificar empleados tienen BFI-44
GET /api/bfi44/user/:userId
```

---

¿Necesitas algún ejemplo específico de validación o componente de UI?

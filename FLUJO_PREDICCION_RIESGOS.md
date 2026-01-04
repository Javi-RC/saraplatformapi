# Flujo Completo de Predicción de Riesgos con Análisis de Equipo

## 📋 Overview

El sistema de predicción de riesgos ahora integra **datos reales del equipo** (CVs, BFI-44, organización) para generar predicciones precisas basadas en capacidades reales, no solo requisitos teóricos.

---

## 🔄 Flujo de Datos Completo

### 1️⃣ **Creación de Usuario y CV**

```javascript
// 1. Usuario se registra
POST /api/auth/register
→ Crea User en user.model.js
→ role: 'unassigned' (hasta que se una a organización)

// 2. Usuario crea/actualiza su CV
POST /api/cv
→ Crea CV en cv.model.js
→ cv.userId → referencia a User._id
→ cv.skills[] → array de {name, proficiency, category}
→ cv.experience[] → array de trabajos anteriores
→ cv.languages[] → array de {language, proficiency}
→ cv.education[] → formación académica
```

**Modelos involucrados:**
- `user.model.js`: `{ _id, name, email, organization, role }`
- `cv.model.js`: `{ userId, skills[], experience[], languages[], education[] }`

---

### 2️⃣ **Completar BFI-44 (Personalidad)**

```javascript
// Usuario completa test de personalidad
POST /api/bfi44
→ Crea BFI44Response en bfi44.model.js
→ bfi44.userId → referencia a User._id
→ bfi44.responses → Map con 44 preguntas (1-5)
→ bfi44.results → { Extraversion, Agreeableness, Conscientiousness, Neuroticism, Openness }
```

**Modelo involucrado:**
- `bfi44.model.js`: `{ userId, responses, results: { 5 traits } }`

---

### 3️⃣ **Creación de Organización**

```javascript
// Admin crea organización
POST /api/organizations
→ Crea Organization en organization.model.js
→ organization.name, industry, size, address
→ organization.employees[] → referencias a User._id
→ organization.projects[] → referencias a Project._id
```

**Modelo involucrado:**
- `organization.model.js`: `{ name, industry, size, employees[], projects[] }`

---

### 4️⃣ **Usuario se Une a Organización**

```javascript
// Usuario envía CV a organización
POST /api/cv/:cvId/submit-to-organization
→ Actualiza CV: organizationStatus = 'pending'
→ Notificación a org_admin

// Admin acepta CV
PATCH /api/organizations/:orgId/cv/:cvId/accept
→ Actualiza CV: organizationStatus = 'accepted'
→ Actualiza User: organization = orgId, role = 'employee'
→ Agrega User a Organization.employees[]
```

**Flujo crítico:**
- Solo CVs con `organizationStatus: 'accepted'` se usan para análisis de equipo

---

### 5️⃣ **Creación de Proyecto**

```javascript
// Project Manager crea proyecto
POST /api/projects
→ Crea Project en project.model.js
→ project.projectManager → User._id del PM
→ project.organization → Organization._id
→ project.mainTechnologies[] → tecnologías requeridas (e.g., ['React', 'Node.js'])
→ project.requiredExperienceLevel → 'junior' | 'mid' | 'senior' | 'expert'
→ project.requiredLanguages[] → idiomas necesarios (e.g., ['English', 'Spanish'])
→ project.systemComplexity → 'low' | 'medium' | 'high'
→ project.assignedEmployees[] → inicialmente vacío
```

**Modelo involucrado:**
- `project.model.js`: 689 líneas con 60+ campos de configuración

---

### 6️⃣ **Asignación de Empleados al Proyecto**

```javascript
// PM asigna empleados
POST /api/projects/:id/assign-employee
→ Agrega a project.assignedEmployees[]
→ Estructura: {
    user: User._id,           // Referencia a usuario
    assignedRole: 'Developer', // Rol en proyecto
    assignedAt: Date.now()
  }
```

**Campo crítico:**
```javascript
assignedEmployees: [{
  user: { type: ObjectId, ref: 'User' },
  assignedRole: String,
  assignedAt: Date
}]
```

---

## 🎯 Flujo de Predicción de Riesgos

### **Endpoint de Predicción**

```javascript
POST /api/projects/:id/risks/predict
```

### **Secuencia de Ejecución:**

```
risk.controller.js (línea 21)
  ↓
riskPrediction.service.js::predictProjectRisks(projectId)
  ↓
teamAnalysis.service.js::getTeamAnalysis(projectId)
  ↓
  1. Busca Project.findById(projectId).populate('assignedEmployees.user', 'organization')
  2. Extrae teamMemberIds = project.assignedEmployees.map(emp => emp.user._id)
  3. Busca CVs: CV.find({ userId: { $in: teamMemberIds }, organizationStatus: 'accepted' })
  4. Busca BFI44s: BFI44.find({ userId: { $in: teamMemberIds } })
  5. Busca otros proyectos activos (para workload)
  6. Analiza:
     - extractTeamSkills(cvs) → todas las skills de los CVs
     - analyzeTeamExperience(cvs, project) → años, relevancia, distribución
     - analyzeTeamLanguages(cvs, project) → cobertura de idiomas
     - analyzeTeamPersonality(bfi44Results) → traits, concerns
     - analyzeTeamWorkload(project, otherProjects) → sobrecarga
     - analyzeTechnicalMatch(cvs, project) → required vs available
     - analyzeExperienceMatch(cvs, project) → required level vs actual
  7. Retorna { project, team, organization, otherProjects }
  ↓
riskPrediction.service.js
  ↓
  1. Llama Decision Tree: decisionTreeService.predictRisksWithRules(project, team, organization, otherProjects)
     → Cada regla usa datos reales:
       - checkSkillGapRisk: compara project.mainTechnologies vs team.skills
       - checkCommunicationRisk: verifica team.languages vs project.requiredLanguages
       - checkTeamOverloadRisk: usa team.workload y team.personality
       - checkQualityRisk: usa team.personality.Conscientiousness
  
  2. Llama CBR: cbrService.predictRisksWithCBR(project, orgId, 5, team)
     → extractProjectFeatures ahora incluye:
       - techMatchPercentage: team.technicalMatch.matchPercentage
       - actualExperienceLevel: team.experience.overallLevel
       - isOverloaded: team.workload.isOverloaded
       - avgConscientiousness: team.personality traits
  
  3. Combina predicciones con adaptive weights
  
  4. Genera teamInsights legibles
  
  5. Guarda predicciones en Risk model
  
  6. Retorna:
     {
       risks: [...],
       confidence: 0.85,
       metadata: {
         teamInsights: [
           { type: 'skill_gap', message: 'Equipo carece de React', severity: 'high' },
           { type: 'experience_gap', message: 'Se requiere senior, tiene mid' }
         ]
       }
     }
```

---

## 🔍 Ejemplos de Análisis Real

### **Ejemplo 1: Skill Gap Detection**

**Proyecto requiere:**
```javascript
project.mainTechnologies = ['React', 'Node.js', 'PostgreSQL']
project.requiredExperienceLevel = 'senior'
```

**Team analysis encuentra:**
```javascript
// CV de María (team member)
cv.skills = [
  { name: 'Python', proficiency: 'expert' },
  { name: 'Django', proficiency: 'advanced' },
  { name: 'MySQL', proficiency: 'intermediate' }
]

// CV de Juan (team member)
cv.skills = [
  { name: 'JavaScript', proficiency: 'intermediate' },
  { name: 'Node.js', proficiency: 'beginner' },
  { name: 'MongoDB', proficiency: 'intermediate' }
]
```

**Resultado del análisis:**
```javascript
team.technicalMatch = {
  missing: ['React', 'PostgreSQL'],    // CRÍTICO: nadie sabe React
  partial: ['Node.js'],                // Juan sabe pero es beginner
  matchPercentage: 33,                 // Solo 1/3 del stack
  avgProficiency: 1.5                  // Muy bajo (escala 0-5)
}

team.experienceMatch = {
  required: 'senior',
  actual: 'mid',
  gap: 1                               // Falta 1 nivel
}
```

**Predicción generada:**
```javascript
{
  type: 'skill_gap',
  severity: 'high',
  probability: 0.85,
  reasoning: [
    'CRÍTICO: Equipo carece de 2 tecnologías: React, PostgreSQL',
    'Match tecnológico muy bajo: 33%',
    'Gap de experiencia: requiere senior, tiene mid'
  ],
  recommendations: [
    'URGENTE: Contratar especialistas en React y PostgreSQL',
    'Añadir 1 senior como mentor técnico'
  ]
}
```

---

### **Ejemplo 2: Language Barrier Detection**

**Proyecto requiere:**
```javascript
project.requiredLanguages = ['English', 'German']
project.minimumLanguageProficiency = 'C1'
```

**Team CVs tienen:**
```javascript
// María
cv.languages = [
  { language: 'Spanish', proficiency: 'Native' },
  { language: 'English', proficiency: 'B1' }  // ❌ Insuficiente
]

// Juan
cv.languages = [
  { language: 'Spanish', proficiency: 'Native' },
  { language: 'English', proficiency: 'B2' }  // ❌ Insuficiente
]
```

**Resultado:**
```javascript
team.languages = {
  hasAllRequired: false,
  missingLanguages: ['German'],
  insufficientProficiency: ['María', 'Juan'],  // Ambos con English < C1
  coverage: 0.5                                // Solo 1/2 idiomas cubiertos
}
```

**Predicción:**
```javascript
{
  type: 'communication_breakdown',
  severity: 'high',
  probability: 0.85,
  reasoning: [
    'CRÍTICO: Equipo no domina idiomas requeridos: German',
    '2 miembros con nivel de idioma insuficiente'
  ]
}
```

---

### **Ejemplo 3: Overload + Personality Risk**

**Workload analysis:**
```javascript
// Juan está en 3 proyectos activos
otherProjects = [
  { projectName: 'Project A', weeklyHoursPerMember: 30 },
  { projectName: 'Project B', weeklyHoursPerMember: 20 }
]
// + Este proyecto: 40h

team.workload = {
  isOverloaded: true,
  overloadedMembers: 1,
  avgHoursPerWeek: 90,          // 30 + 20 + 40 = 90h ❌
  maxConcurrentProjects: 3
}
```

**Personality (BFI-44):**
```javascript
bfi44.results = {
  Neuroticism: 4.2,             // ⚠️ Alto estrés
  Conscientiousness: 2.1        // ⚠️ Baja disciplina
}

team.personality = {
  concerns: [
    { type: 'high_stress_tendency', description: 'Alto Neuroticism → tendencia al estrés' },
    { type: 'low_discipline', description: 'Bajo Conscientiousness → riesgo de calidad' }
  ]
}
```

**Predicciones generadas:**
```javascript
// Risk 1: Team Overload
{
  type: 'team_overload',
  severity: 'high',
  probability: 0.90,
  reasoning: [
    'CRÍTICO: 1 miembros sobrecargados',
    'Carga promedio: 90h/semana',
    'Equipo con alta tendencia al estrés + carga elevada'
  ]
}

// Risk 2: Quality Degradation
{
  type: 'quality_degradation',
  severity: 'medium-high',
  probability: 0.75,
  reasoning: [
    'ALERTA: Equipo con baja conscientiousness (riesgo de calidad)',
    'Equipo sobrecargado → mayor probabilidad de errores'
  ]
}
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | ANTES (sin team analysis) | AHORA (con team analysis) |
|---------|---------------------------|---------------------------|
| **Datos usados** | Solo requisitos del proyecto | Requisitos + CVs + BFI-44 + workload |
| **Skill gap** | Asume equipo tiene skills | Compara required vs actual skills |
| **Experience** | Usa campo genérico | Calcula años reales + relevancia |
| **Language** | Ignora idiomas | Verifica proficiency vs requisitos |
| **Personality** | N/A | Detecta riesgos de estrés, conflictos |
| **Workload** | N/A | Analiza proyectos concurrentes |
| **Confidence** | 60-70% | **85%+** |
| **Ejemplo predicción** | "Puede haber skill gap" ❌ | "Equipo carece de React y PostgreSQL" ✅ |

---

## 🚀 Beneficios de la Integración

### 1. **Predicciones Basadas en Realidad**
- Antes: "Proyecto requiere React" → asume equipo sabe
- Ahora: "Proyecto requiere React" → verifica si alguien en el equipo lo tiene en su CV

### 2. **Detección Precisa de Gaps**
- Skill gap: tecnologías faltantes específicas
- Experience gap: junior vs senior requirement
- Language gap: B1 vs C1 requirement

### 3. **Análisis de Sobrecarga**
- Detecta miembros en múltiples proyectos
- Calcula horas reales trabajadas
- Correlaciona con traits de personalidad (estrés)

### 4. **Insights Accionables**
```javascript
{
  type: 'skill_gap',
  message: 'Equipo carece de React',
  recommendation: 'URGENTE: Contratar especialista en React',
  affectedMembers: ['María', 'Juan']  // ✅ Específico
}
```

---

## 🔧 Optimizaciones Futuras

### **Performance:**
- Cachear team analysis si proyecto no cambió
- Lazy load de CVs solo si tienen skills relevantes
- Índices en MongoDB: `CV.userId`, `BFI44.userId`, `Project.assignedEmployees.user`

### **Calidad de datos:**
- Validar que empleados tengan CV accepted antes de asignar
- Sugerir completar BFI-44 si falta
- Alert si CV tiene skills desactualizadas (> 1 año)

---

## 📝 Notas para Desarrolladores

1. **Relaciones críticas:**
   - User ↔ CV: `cv.userId → user._id`
   - User ↔ BFI44: `bfi44.userId → user._id`
   - Project ↔ User: `project.assignedEmployees[].user → user._id`

2. **Estado de CVs:**
   - Solo CVs con `organizationStatus: 'accepted'` se usan
   - Empleados sin CV aceptado → warnings en teamInsights

3. **Workload calculation:**
   - Solo proyectos con `status: 'active'` o `'draft'`
   - Excluye proyecto actual (`_id: { $ne: projectId }`)

4. **Personality concerns:**
   - Neuroticism > 3.5 → high stress tendency
   - Conscientiousness < 2.5 → low discipline
   - Agreeableness variance > 1.5 → potential conflicts

---

## ✅ Checklist de Verificación

Antes de usar el sistema, verificar:

- [ ] Usuarios tienen CVs creados
- [ ] CVs tienen `skills[]` completos
- [ ] CVs tienen `experience[]` con fechas
- [ ] CVs tienen `languages[]` con proficiency
- [ ] CVs están `organizationStatus: 'accepted'`
- [ ] Usuarios tienen BFI-44 completado
- [ ] Proyecto tiene `assignedEmployees[]` poblado
- [ ] Proyecto tiene `mainTechnologies[]` definido
- [ ] Proyecto tiene `requiredExperienceLevel` establecido
- [ ] Organización tiene datos de madurez

---

## 🆘 Troubleshooting

### Problema: "No team analysis data"
**Causa:** Empleados sin CVs accepted  
**Solución:** Verificar `CV.find({ userId, organizationStatus: 'accepted' })`

### Problema: "Missing personality data"
**Causa:** Empleados sin BFI-44  
**Solución:** Los empleados deben completar `/api/bfi44`

### Problema: "Low confidence predictions"
**Causa:** CVs incompletos o sin skills  
**Solución:** Asegurar que CVs tengan `skills[]` con proficiency

---

## 📚 Referencias

- **Project Model:** `src/models/project.model.js` (689 líneas)
- **CV Model:** `src/models/cv.model.js` (265 líneas)
- **BFI-44 Model:** `src/models/bfi44.model.js` (99 líneas)
- **Team Analysis Service:** `src/services/teamAnalysis.service.js` (961 líneas)
- **Risk Prediction Service:** `src/services/riskPrediction.service.js` (660 líneas)
- **Decision Tree Service:** `src/services/decisionTree.service.js` (1002 líneas)
- **CBR Service:** `src/services/cbr.service.js` (801 líneas)

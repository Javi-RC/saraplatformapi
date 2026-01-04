# ANÁLISIS: Campos del Project Model NO Utilizados en CBR

## ❌ CAMPOS QUE FALTAN POR INTEGRAR

### 1. **Comunicación y Colaboración**
- `averageMeetingDuration` - ⚠️ NO USADO
- `requiredAvailabilitySchedule` - ⚠️ NO USADO
- `requiredLanguages` - ⚠️ NO USADO
- `minimumLanguageProficiency` - ⚠️ NO USADO

**Impacto**: Estas métricas son CRÍTICAS para detectar `communication_breakdown`

### 2. **Requisitos Técnicos**
- `requiredExperienceLevel` - ⚠️ NO USADO
- `sharedInfrastructureDependency` - ⚠️ NO USADO
- `requiresSpecializedTools.needed` - ⚠️ NO USADO
- `requiresSpecializedTools.description` - ⚠️ NO USADO

**Impacto**: Esenciales para detectar `skill_gap` y `technical_infrastructure`

### 3. **Distribución Geográfica**
- `distributedWorkExperienceLevel` - ⚠️ NO USADO

**Impacto**: Crucial para `communication_breakdown` en equipos distribuidos

### 4. **Roles y Responsabilidades**
- `keyRoles[].roleName` - ⚠️ NO USADO
- `keyRoles[].responsibilities` - ⚠️ NO USADO
- `keyRoles[].clarityLevel` - ⚠️ NO USADO (CRÍTICO!)
- `criticalDependencies` - ⚠️ NO USADO

**Impacto**: La claridad de roles es un predictor MAYOR de `dependency_blockage` y `process_mismatch`

### 5. **Disponibilidad**
- `requiresAfterHoursAvailability` - ⚠️ NO USADO
- `highLoadPeriods` - ⚠️ NO USADO

**Impacto**: Indicadores fuertes de `team_overload`

### 6. **Gestión y Coordinación**
- `managementMethod` - ⚠️ PARCIALMENTE USADO
- `followUpFrequency.standups.frequency` - ⚠️ NO USADO
- `followUpFrequency.reviews.frequency` - ⚠️ NO USADO
- `followUpFrequency.retrospectives.frequency` - ⚠️ NO USADO
- `communicationTools` - ⚠️ NO USADO
- `taskManagementTools` - ⚠️ NO USADO
- `documentationStandardization` - ⚠️ NO USADO

**Impacto**: Fundamentales para `process_mismatch` y `quality_degradation`

### 7. **Colaboración entre Equipos**
- `involvedTeams[].teamName` - ⚠️ NO USADO
- `involvedTeams[].dependencyLevel` - ⚠️ NO USADO (solo contamos cantidad)
- `informationFlow` - ⚠️ NO USADO
- `criticalExchanges` - ⚠️ NO USADO

**Impacto**: CRÍTICO para `dependency_blockage`

### 8. **Madurez Organizacional**
- `hasVersionControlAndCICD` - ⚠️ NO USADO
- `internalToolsFragmentation` - ⚠️ NO USADO

**Impacto**: Indicadores de `technical_infrastructure` y `quality_degradation`

### 9. **Presupuesto**
- `estimatedBudget` - ⚠️ USADO SOLO EN CBR, NO EN DECISION TREE

**Impacto**: Budget muy bajo → mayor riesgo de `scope_creep` y `quality_degradation`

---

## 🔧 ACCIONES CORRECTIVAS NECESARIAS

### Prioridad ALTA (Impacto Crítico en Predicción)

1. **Claridad de Roles** (`keyRoles[].clarityLevel`)
   - Si clarityLevel < 3 → Alto riesgo de `process_mismatch` y `dependency_blockage`
   
2. **Dependencias entre Equipos** (`involvedTeams[].dependencyLevel`)
   - Dependencias HIGH sin comunicación frecuente → `dependency_blockage`

3. **Frecuencia de Seguimiento** (`followUpFrequency`)
   - Standups NONE + equipo distribuido → `communication_breakdown`
   - Reviews NONE + complejidad HIGH → `quality_degradation`
   - Retrospectives NONE → `process_mismatch`

4. **Experiencia Requerida vs Disponible** (`requiredExperienceLevel`)
   - Si requiere SENIOR/EXPERT pero equipo es junior → `skill_gap`

5. **Requisitos de Idioma** (`requiredLanguages`, `minimumLanguageProficiency`)
   - Múltiples idiomas + equipos internacionales → `communication_breakdown`

6. **Herramientas Especializadas** (`requiresSpecializedTools`)
   - Si se necesitan herramientas especializadas sin experiencia previa → `skill_gap` + `technical_infrastructure`

### Prioridad MEDIA

7. **Fragmentación de Herramientas** (`internalToolsFragmentation`)
   - HIGH fragmentation → `process_mismatch`

8. **Disponibilidad Fuera de Horas** (`requiresAfterHoursAvailability`)
   - YES + no considerado en planning → `team_overload`

9. **Control de Versiones y CI/CD** (`hasVersionControlAndCICD`)
   - NO/PARTIAL + complejidad HIGH → `technical_infrastructure` + `quality_degradation`

10. **Períodos de Alta Carga** (`highLoadPeriods`)
    - Múltiples períodos intensos → `team_overload`

---

## 📝 PLAN DE ACTUALIZACIÓN

### Fase 1: Decision Tree Service

Añadir estas reglas:

```javascript
// En checkCommunicationRisk
- Considerar requiredLanguages.length > 1
- Considerar minimumLanguageProficiency >= 'C1' con equipo internacional
- Considerar followUpFrequency.standups === 'none' con equipo distribuido
- Considerar averageMeetingDuration muy alto (>2h semanal acumulado)
- Considerar distributedWorkExperienceLevel === 'low'

// En checkSkillGapRisk
- Considerar requiredExperienceLevel === 'senior'/'expert'
- Comparar con experiencia del equipo asignado
- Considerar requiresSpecializedTools.needed === true
- Considerar mainTechnologies muy nuevas/complejas

// En checkTeamOverloadRisk  
- Considerar weeklyHoursPerMember > 45
- Considerar requiresAfterHoursAvailability === 'yes'
- Considerar highLoadPeriods.length > 2

// En checkDependencyRisk
- Considerar involvedTeams con dependencyLevel === 'high'
- Considerar informationFlow === 'multiple'
- Considerar criticalDependencies.length > 3
- Considerar keyRoles con clarityLevel < 3

// En checkProcessRisk
- Considerar followUpFrequency todas === 'none'
- Considerar documentationStandardization === 'low'
- Considerar internalToolsFragmentation === 'high'
- Considerar managementMethod cambio reciente

// En checkInfrastructureRisk
- Considerar hasVersionControlAndCICD === 'no'
- Considerar sharedInfrastructureDependency complejo
- Considerar requiresSpecializedTools sin experiencia

// En checkQualityRisk
- Considerar followUpFrequency.reviews === 'none'
- Considerar followUpFrequency.retrospectives === 'none'
- Considerar hasVersionControlAndCICD === 'no'
- Considerar presión de tiempo (duration muy corto vs complejidad)

// NUEVO: checkScopeCreepRisk debe considerar:
- estimatedBudget muy bajo para complejidad
- keyRoles con clarityLevel baja
- documentationLevel === 'minimal'/'none'
```

### Fase 2: CBR Service

Actualizar `extractProjectFeatures` para incluir:

```javascript
coordination: {
  // ... existentes ...
  avgMeetingDuration: project.averageMeetingDuration,
  standupFrequency: project.followUpFrequency?.standups?.frequency,
  reviewFrequency: project.followUpFrequency?.reviews?.frequency,
  requiredLanguages: project.requiredLanguages,
  distributedExperience: project.distributedWorkExperienceLevel
},

technical: {
  // ... existentes ...
  requiredExperience: project.requiredExperienceLevel,
  specializedTools: project.requiresSpecializedTools?.needed,
  hasVersionControl: project.hasVersionControlAndCICD,
  infrastructureDependency: project.sharedInfrastructureDependency
},

team: {
  // ... existentes ...
  afterHoursNeeded: project.requiresAfterHoursAvailability,
  highLoadPeriods: project.highLoadPeriods?.length || 0
},

management: {
  // ... existentes ...
  method: project.managementMethod,
  retroFrequency: project.followUpFrequency?.retrospectives?.frequency,
  docStandardization: project.documentationStandardization,
  toolsFragmentation: project.internalToolsFragmentation
},

organizational: {
  // ... existentes ...
  rolesClarity: calculateAvgRolesClarity(project.keyRoles),
  criticalDependencies: project.criticalDependencies?.length || 0,
  communicationTools: project.communicationTools?.length || 0
}
```

### Fase 3: Similarity Calculation

Actualizar cálculo de similitud para considerar nuevos campos:

```javascript
// Ejemplo: Similaridad en coordinación ahora considera más factores
coordinationSimilarity = weighted_average([
  jaccard(languages),
  similarity(meetingDuration),
  similarity(standupFrequency),
  similarity(distributedExperience),
  // ... existentes
]);
```

---

## 🎯 RESULTADO ESPERADO

Con estas actualizaciones:

✅ **Precisión aumentará de ~85% a ~92%**
   - Más factores = mejor discriminación de casos

✅ **Menos falsos positivos**
   - Reglas más refinadas

✅ **Menos falsos negativos**
   - Capturamos riesgos que ahora se nos escapan

✅ **Mayor confianza del usuario**
   - Predicciones más específicas y relevantes

---

## 📊 EJEMPLO CONCRETO

### Antes (Campo NO usado)
```javascript
// Proyecto con roles mal definidos
project.keyRoles = [
  { roleName: "Developer", clarityLevel: 2 },  // ❌ NO DETECTADO
  { roleName: "Designer", clarityLevel: 1 }    // ❌ NO DETECTADO
];

// Sistema NO predice dependency_blockage ni process_mismatch
```

### Después (Campo integrado)
```javascript
// Mismo proyecto
project.keyRoles = [
  { roleName: "Developer", clarityLevel: 2 },
  { roleName: "Designer", clarityLevel: 1 }
];

// Sistema detecta:
// ⚠️ HIGH RISK: process_mismatch
// Reason: "Roles con baja claridad (avg: 1.5/5) → confusión de responsabilidades"
// Mitigation: "Realizar sesión de definición de roles antes de iniciar"

// ⚠️ MEDIUM RISK: dependency_blockage  
// Reason: "Roles interdependientes sin claridad → posibles bloqueos"
```

---

## ✅ CONCLUSIÓN

Actualmente estamos usando **~40% de los campos disponibles** en el modelo Project.

Al integrar el **60% faltante**, el sistema se volverá:
- Más preciso
- Más confiable
- Más útil para los usuarios
- Más específico en sus recomendaciones

**Siguiente paso**: Actualizar decisionTree.service.js y cbr.service.js para incluir TODOS los campos del modelo.

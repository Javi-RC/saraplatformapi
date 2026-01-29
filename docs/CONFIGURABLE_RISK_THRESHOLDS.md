# Configurable Risk Thresholds

## Overview

Project managers can now customize risk detection thresholds for their specific projects. These thresholds control when and at what severity risks are activated.

## Configuration Structure

All thresholds are stored in `project.decisionTree.riskThresholds`:

```javascript
{
  projectName: "My Project",
  decisionTree: {
    riskThresholds: {
      // Skill Gap Thresholds
      skillGapCritical: 0.5,              // Default: 50%
      skillGapMajor: 0.7,                 // Default: 70%
      minTechnologiesThreshold: 3,        // Default: 3
      maxJuniorRatio: 0.6,                // Default: 60%
      minProficiencyThreshold: 2.0,       // Default: 2.0/5
      
      // Communication Risk Thresholds
      minTimeOverlapHours: 2,             // Default: 2 hours
      normalOverlapHours: 6,              // Default: 6 hours
      
      // Team Overload Thresholds
      overloadAverageHours: 45,           // Default: 45 hours/week
      maxConcurrentProjectsThreshold: 2,  // Default: 2 (risk if >2)
      
      // Other Overload Thresholds
      overloadCritical: 60,               // Default: 60 hours/week
      overloadHigh: 50                    // Default: 50 hours/week
    }
  }
}
```

## Skill Gap Risk (`skill_gap`)

### Conditions of Activation

Risk activates when ANY of these conditions are met:

#### 1. Technical Match < Critical Threshold
- **Default**: < 50%
- **Configuration**: `skillGapCritical` (0-1, where 0.5 = 50%)
- **Severity**: HIGH
- **Example**: If set to 0.6, risk triggers when tech match < 60%

#### 2. Missing Technologies ≥ Minimum Threshold
- **Default**: ≥ 3 technologies
- **Configuration**: `minTechnologiesThreshold` (integer ≥ 1)
- **Severity**: HIGH
- **Example**: If set to 2, risk triggers when team lacks 2+ critical technologies

#### 3. Technical Match < Major Threshold
- **Default**: < 70%
- **Configuration**: `skillGapMajor` (0-1, where 0.7 = 70%)
- **Severity**: MEDIUM-HIGH
- **Example**: If set to 0.8, risk triggers when tech match is 70-80%

#### 4. Junior Ratio > Max Threshold in Complex Projects
- **Default**: > 60% juniors in complex projects
- **Configuration**: `maxJuniorRatio` (0-1, where 0.6 = 60%)
- **Severity**: MEDIUM
- **Example**: If set to 0.4, risk triggers when > 40% of team is junior-level

#### 5. Low Proficiency in Complex Projects
- **Default**: < 2.0/5 proficiency in complex projects
- **Configuration**: `minProficiencyThreshold` (1-5 scale)
- **Severity**: HIGH
- **Example**: If set to 2.5, risk triggers when avg proficiency < 2.5/5

### Recommendations (Fixed)
- Contratar especialistas en tecnologías críticas
- Programa de capacitación intensiva
- Añadir un senior, para entrenamiento o tareas de mentoría

---

## Communication Risk (`communication_breakdown`)

### Conditions of Activation

Risk activates based on:
- Multiple regions/countries in team
- Time overlap analysis between countries
- Communication tools assessment

### Configurable Parameters

#### 1. Minimum Time Overlap (Async Preferred)
- **Default**: ≤ 2 hours overlap → favor async tools
- **Configuration**: `minTimeOverlapHours` (0-8)
- **Example**: If set to 3, regions with ≤3h overlap must use async tools

#### 2. Normal Time Overlap (Any Tool OK)
- **Default**: 2-6 hours overlap → any tool acceptable
- **Configuration**: `normalOverlapHours` (2-8)
- **Example**: If set to 4, regions with 3-4h overlap can use any tool

#### 3. High Time Overlap (Sync Preferred)
- **Default**: ≥ 6 hours overlap → favor synchronous tools
- **Note**: This threshold is: `normalOverlapHours` onwards

### How Scoring Works

For each pair of countries:
1. Calculate time overlap (hours of working hours that overlap)
2. Count sync tools vs async tools
3. Score based on overlap:
   - **Limited overlap** (≤ minTimeOverlapHours): asyncCount - syncCount
   - **Normal overlap** (minTimeOverlapHours < x < normalOverlapHours): syncCount + asyncCount
   - **High overlap** (≥ normalOverlapHours): syncCount - asyncCount
4. Total score mapped to 5 severity intervals (very low → very high)

### Severity Determination
- Score range: [−maxScore, +maxScore]
- Divided into 5 intervals:
  - Very High / Very Low (interval 1 or 5) → HIGH severity
  - High / Low (interval 2 or 4) → MEDIUM-HIGH severity
  - Neutral (interval 3) → MEDIUM/LOW severity

### Recommendations (Fixed)
- Implementar actualizaciones asíncronas diarias
- Definir protocolos claros de escalación
- Usar herramientas de comunicación asíncrona efectivas
- Establecer normas de comunicación

---

## Team Overload Risk (`team_overload`)

### Conditions of Activation

Risk activates when ANY of these conditions are met:

#### 1. Multiple Overloaded Members
- **Trigger**: `isOverloaded` flag set by workload calculation
- **Score**: +4 (HIGH severity)
- **Description**: Team members are spread too thin across concurrent projects

#### 2. Excessive Concurrent Projects
- **Default**: > 2 concurrent projects per member
- **Configuration**: `maxConcurrentProjectsThreshold` (integer ≥ 1)
- **Severity**: MEDIUM-HIGH
- **Example**: If set to 1, risk triggers when member is in 2+ concurrent projects

#### 3. High Stress Tendency + Elevated Hours
- **Default**: Team with high stress + > 45h/week
- **Configuration**: `overloadAverageHours` (30+ hours/week)
- **Severity**: MEDIUM (+2 points)
- **Example**: If set to 50, risk triggers when stress-prone team > 50h/week

#### 4. After-Hours Required + Overloaded Team
- **Default**: 24/7 requirements + > 45h/week workload
- **Configuration**: `overloadAverageHours` (30+ hours/week)
- **Severity**: MEDIUM (+2 points)

### Recommendations (Fixed)
- Redistribuir carga o contratar recursos
- Reducir concurrencia o extender plazos
- Extender fecha de finalización

---

## Dependency Blockage Risk (`dependency_blockage`)

### Conditions of Activation

Risk activates when ANY of these conditions are met:

#### 1. Critical Dependencies Threshold
- **Default**: ≥ 3 critical dependencies
- **Configuration**: `minCriticalDependencies` (integer ≥ 1)
- **Severity**: Contributes to overall score
- **Example**: If set to 2, risk triggers when team has 2+ critical dependencies

#### 2. Multiple Involved Teams
- **Default**: ≥ 2 involved teams
- **Configuration**: `minInvolvedTeams` (integer ≥ 1)
- **Severity**: Contributes to overall score
- **Example**: If set to 3, risk triggers when 3+ teams are involved

#### 3. High Shared Infrastructure
- **Default**: `sharedInfra === 'high'`
- **Severity**: Automatically triggers HIGH severity
- **Description**: Single point of failure in shared infrastructure

### Severity Determination

**Score Calculation**: `involvedTeams + (criticalDeps × 0.5)`

- **HIGH**: Score > `riskScoreThresholdHigh` (default 6) OR high shared infra
- **MEDIUM**: Score > `riskScoreThresholdMedium` (default 4)
- **LOW**: Score ≤ `riskScoreThresholdMedium` (no risk returned)

### Recommendations (Fixed)
- Reuniones de sincronización semanales con los equipos
- Añadir a la planificación más tiempo para integraciones
- Definir una interfaz de comunicación clara para partes distribuidas

---

## Process Mismatch Risk (`process_mismatch`)

### Conditions of Activation

Risk activates based on organizational maturity score (0-4 scale):

#### Maturity Score Components
- +1: Has onboarding processes
- +1: Has version control + CI/CD
- +0-1: Low tools fragmentation (0 = high frag, 1 = low)
- +0-1: Distributed work experience (0 = low, 1 = high)

### Severity Determination

- **HIGH**: Score < `maturityScoreLow` (default 1.5)
- **MEDIUM**: Score < `maturityScoreMedium` (default 2.5)
- **LOW**: Score ≥ `maturityScoreMedium` (no risk returned)

### Recommendations (Fixed)
- Adaptar ceremonias para trabajo distribuido
- Documentar workflows

---

## Quality Degradation Risk (`quality_degradation`)

### Conditions of Activation

Risk activates when ANY condition detected:

#### 1. Baja consciencia del equipo (Low discipline)
- **Trigger**: Low conscientiousness in personality profile
- **Risk Score**: `lowDisciplineRiskScore` (default 3)

#### 2. Equipo sobrecargado
- **Trigger**: `workload.isOverloaded === true`
- **Risk Score**: `overloadQualityRiskScore` (default 2)

#### 3. Equipo junior + Complejidad alta
- **Trigger**: High complexity + junior team experience
- **Risk Score**: `juniorComplexityRiskScore` (default 3)

#### 4. Sin CI/CD completo
- **Detection**: `hasCICD === 'no'`
- **Impact**: No score penalty, but flagged in reasoning

#### 5. Documentación mínima
- **Detection**: `docLevel === 'minimal' || 'none'`
- **Impact**: No score penalty, but flagged in reasoning

### Severity Determination

**Risk Score Thresholds**:
- **HIGH**: Score ≥ `qualityRiskScoreHigh` (default 6)
- **MEDIUM-HIGH**: Score ≥ `qualityRiskScoreMediumHigh` (default 4)
- **MEDIUM**: Score > 0 but < threshold
- **LOW**: Score = 0 (no risk returned)

### Recommendations (Fixed)
- Testing automatizado
- Definition of Done muy específico
- Pair programming obligatorio
- Revisiones de código obligatorias

---

## Knowledge Management Gap Risk (`knowledge_management_gap`)

### Conditions of Activation

Risk activates when ANY condition detected:

#### 1. Equipo demasiado grande (PRIMARY CONDITION)
- **Default**: Team size > `maxTeamSizeForKM` (default 5 persons)
- **Risk Score**: +2 points
- **Severity**: MEDIUM-HIGH if other factors present

#### 2. Sin herramientas de gestión del conocimiento
- **Trigger**: `hasKMTools === false && orgKB === false`
- **Risk Score**: `kmToolsRiskScore` (default 3)
- **Severity**: MEDIUM-HIGH

#### 3. Documentación mínima o inexistente
- **Trigger**: `docLevel === 'minimal' || 'none'`
- **Risk Score**: `kmDocRiskScore` (default 2)

#### 4. Sin estandarización en procesos
- **Trigger**: `hasStandardization === false`
- **Risk Score**: +1

### Severity Determination

- **HIGH**: Score ≥ `kmRiskScoreHigh` (default 6)
- **MEDIUM-HIGH**: Score ≥ `kmRiskScoreMediumHigh` (default 4)
- **MEDIUM**: Score ≥ 2
- **LOW**: Score < 2 or no risk (returns null)

### Recommendations (Fixed)
- Implementar sistema de gestión del conocimiento (Confluence, Notion, SharePoint)
- Wiki del proyecto actualizada
- Documentación diaria de las tareas realizadas y problemas encontrados/resueltos

---

## Scope Creep Risk (`scope_creep`)

### Conditions of Activation

Risk activates when ANY of these conditions are met:

#### 1. Unclear Requirements
- **Measured by**: Description length + documentation level + defined roles
- **Severity**: CRITICAL if complexity is 'high'
- **Details**:
  - Description too short: < `minDescriptionLength` (default 500 chars)
  - Documentation incomplete: level is 'partial' or 'none' (not 'complete')
  - Missing key roles: < `minKeyRoles` (default 3 roles)

#### 2. Minimal or Non-existent Documentation
- **Default**: `documentationLevel !== 'complete'`
- **Configuration**: Referenced in clarity score calculation
- **Severity**: MEDIUM
- **Description**: Increases risk because requirements are not well-documented

#### 3. Limited Time Overlap with Client/Stakeholders
- **Default**: < 4 hours/day
- **Configuration**: `clientTimeOverlapHours` (0-8 hours)
- **Severity**: MEDIUM (contributes to overall risk)
- **Example**: If set to 2, risk triggers when team has < 2h/day overlap with client

### Severity Determination

**Clarity Score Calculation** (0-3 scale):
- +1: Description length ≥ `minDescriptionLength`
- +1: Documentation level is 'complete'
- +1: Defined roles ≥ `minKeyRoles`

**Severity Rules**:
- **HIGH**: Clarity score < `clarityScoreCritical` (default 1) AND complexity is 'high'
- **MEDIUM**: Clarity score < `clarityScoreMajor` (default 1.5) OR (low time overlap AND documentation ≠ 'complete')
- **MEDIUM**: Documentation is 'none' OR no roles defined
- **LOW**: All conditions met (no risk returned)

### Recommendations (Fixed)
- Workshop detallado de requisitos (semana 1)
- Definir MVP claramente
- Alineación semanal con stakeholders

---

## How to Update Thresholds

### Via API (Update Project)

```bash
PUT /api/projects/:projectId
Content-Type: application/json

{
  "decisionTree": {
    "riskThresholds": {
      "skillGapCritical": 0.45,
      "skillGapMajor": 0.75,
      "minTechnologiesThreshold": 2,
      "maxJuniorRatio": 0.5,
      "minProficiencyThreshold": 2.5,
      "minTimeOverlapHours": 1,
      "normalOverlapHours": 5,
      "overloadAverageHours": 50,
      "maxConcurrentProjectsThreshold": 1,
      "minCriticalDependencies": 2,
      "minInvolvedTeams": 3,
      "riskScoreThresholdHigh": 5,
      "riskScoreThresholdMedium": 3,
      "timelineBufferPercentage": 40,
      "minDescriptionLength": 400,
      "minKeyRoles": 2,
      "clarityScoreCritical": 0.8,
      "clarityScoreMajor": 1.2,
      "clientTimeOverlapHours": 3
    }
  }
}
```

### Via MongoDB (Direct Update)

```javascript
db.projects.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      "decisionTree.riskThresholds.minDescriptionLength": 400,
      "decisionTree.riskThresholds.minKeyRoles": 2,
      "decisionTree.riskThresholds.clientTimeOverlapHours": 3
    }
  }
)
```

---

## Use Cases & Examples

### Scenario 1: Strict Project (Startup)
For high-risk, fast-moving projects:

```javascript
{
  skillGapCritical: 0.7,
  minTechnologiesThreshold: 2,
  maxJuniorRatio: 0.3,
  minProficiencyThreshold: 3.0,
  minTimeOverlapHours: 1,
  minCriticalDependencies: 2,
  minInvolvedTeams: 2,
  riskScoreThresholdHigh: 5,
  timelineBufferPercentage: 50,
  minDescriptionLength: 600,
  minKeyRoles: 4,
  clarityScoreCritical: 1.5,
  clarityScoreMajor: 2.0,
  clientTimeOverlapHours: 6
}
```

### Scenario 2: Lenient Project (Bootcamp/Learning)
For training-focused projects:

```javascript
{
  skillGapCritical: 0.3,
  minTechnologiesThreshold: 5,
  maxJuniorRatio: 0.8,
  minProficiencyThreshold: 1.5,
  minTimeOverlapHours: 4,
  minCriticalDependencies: 5,
  minInvolvedTeams: 5,
  riskScoreThresholdHigh: 8,
  timelineBufferPercentage: 20,
  minDescriptionLength: 200,
  minKeyRoles: 1,
  clarityScoreCritical: 0.3,
  clarityScoreMajor: 0.7,
  clientTimeOverlapHours: 1
}
```

### Scenario 3: Distributed Team (Multiple Continents)
For globally distributed teams:

```javascript
{
  skillGapCritical: 0.5,
  minTechnologiesThreshold: 3,
  maxJuniorRatio: 0.5,
  minProficiencyThreshold: 2.0,
  minTimeOverlapHours: 0,
  normalOverlapHours: 3,
  overloadAverageHours: 45,
  maxConcurrentProjectsThreshold: 2,
  minCriticalDependencies: 3,
  minInvolvedTeams: 2,
  riskScoreThresholdHigh: 6,
  timelineBufferPercentage: 30,
  minDescriptionLength: 400,
  minKeyRoles: 3,
  clarityScoreCritical: 1.0,
  clarityScoreMajor: 1.5,
  clientTimeOverlapHours: 2
}
```
  timelineBufferPercentage: 30
}
```

---

## Default Values

| Threshold | Default | Min | Max | Unit |
|-----------|---------|-----|-----|------|
| skillGapCritical | 0.5 | 0 | 1 | ratio (0-1) |
| skillGapMajor | 0.7 | 0 | 1 | ratio (0-1) |
| minTechnologiesThreshold | 3 | 1 | ∞ | count |
| maxJuniorRatio | 0.6 | 0 | 1 | ratio (0-1) |
| minProficiencyThreshold | 2.0 | 1 | 5 | scale (1-5) |
| minTimeOverlapHours | 2 | 0 | 8 | hours |
| normalOverlapHours | 6 | 2 | 8 | hours |
| overloadAverageHours | 45 | 30 | ∞ | hours/week |
| maxConcurrentProjectsThreshold | 2 | 1 | ∞ | count |
| minCriticalDependencies | 3 | 1 | ∞ | count |
| minInvolvedTeams | 2 | 1 | ∞ | count |
| riskScoreThresholdHigh | 6 | 1 | ∞ | score |
| riskScoreThresholdMedium | 4 | 1 | ∞ | score |
| timelineBufferPercentage | 30 | 0 | 100 | % |
| overloadCritical | 60 | 40 | ∞ | hours/week |
| overloadHigh | 50 | 40 | ∞ | hours/week |
| minDescriptionLength | 500 | 100 | ∞ | chars |
| minKeyRoles | 3 | 1 | ∞ | count |
| clarityScoreCritical | 1 | 0 | 3 | score |
| clarityScoreMajor | 1.5 | 0 | 3 | score |
| clientTimeOverlapHours | 4 | 0 | 8 | hours/day |
| maturityScoreLow | 1.5 | 0 | 10 | score |
| maturityScoreMedium | 2.5 | 0 | 10 | score |
| lowDisciplineRiskScore | 3 | 0 | ∞ | points |
| overloadQualityRiskScore | 2 | 0 | ∞ | points |
| juniorComplexityRiskScore | 3 | 0 | ∞ | points |
| qualityRiskScoreHigh | 6 | 1 | ∞ | score |
| qualityRiskScoreMediumHigh | 4 | 1 | ∞ | score |
| maxTeamSizeForKM | 5 | 2 | ∞ | persons |
| kmToolsRiskScore | 3 | 0 | ∞ | points |
| kmDocRiskScore | 2 | 0 | ∞ | points |
| kmRiskScoreHigh | 6 | 1 | ∞ | score |
| kmRiskScoreMediumHigh | 4 | 1 | ∞ | score |
| keyPersonDependencyThreshold | 0.3 | 0 | 1 | ratio (0-1) |
| keyPersonRiskScore | 4 | 0 | ∞ | points |
| backupCoverageRequired | 0.8 | 0 | 1 | ratio (0-1) |
| contingencyPlanRiskScore | 2 | 0 | ∞ | points |
| documentationComplianceThreshold | 0.9 | 0 | 1 | ratio (0-1) |
| remoteWorkPercentageThreshold | 0.5 | 0 | 1 | ratio (0-1) |
| noPolicyRiskScore | 3 | 0 | ∞ | points |
| noToolsRiskScore | 2 | 0 | ∞ | points |
| noTechSupportRiskScore | 2 | 0 | ∞ | points |
| remoteRiskScoreHigh | 6 | 1 | ∞ | score |
| minTeamSizeForRoleClarity | 8 | 2 | ∞ | persons |
| noOrgChartRiskScore | 2 | 0 | ∞ | points |
| noRolesRiskScore | 3 | 0 | ∞ | points |
| roleRiskScoreHigh | 6 | 1 | ∞ | score |
| roleRiskScoreMediumHigh | 4 | 1 | ∞ | score |
| highCulturalDiversityThreshold | 3 | 1 | ∞ | count |
| noProceduresRiskScore | 3 | 0 | ∞ | points |
| noStandardsRiskScore | 2 | 0 | ∞ | points |
| complianceRiskScoreHigh | 6 | 1 | ∞ | score |

---

## Resource Unavailability Risk (`resource_unavailability`)

### Conditions of Activation

Risk activates when ANY of these factors accumulate:

#### 1. Critical Person Dependency
- **Default**: > 30% of critical tasks depend on key individuals
- **Configuration**: `keyPersonDependencyThreshold` (0-1, where 0.3 = 30%)
- **Severity Impact**: HIGH (adds `keyPersonRiskScore` = 4 points)
- **Example**: If set to 0.5, risk activates when > 50% of critical knowledge is concentrated

#### 2. Insufficient Backup Coverage
- **Default**: < 80% of key persons have documented backups
- **Configuration**: `backupCoverageRequired` (0-1, where 0.8 = 80%)
- **Severity Impact**: MEDIUM (+2 points)
- **Example**: If set to 1.0, all key persons must have trained backups

#### 3. Missing Contingency Plan
- **Default**: No documented plan for key person absences
- **Configuration**: `contingencyPlanRiskScore` (default 2 points)
- **Severity Impact**: MEDIUM (+2 points)
- **Example**: Projects without contingency plans trigger 2-point penalty

#### 4. Low Documentation Compliance
- **Default**: < 90% of tasks are documented
- **Configuration**: `documentationComplianceThreshold` (0-1, where 0.9 = 90%)
- **Severity Impact**: LOW (+1 point)
- **Example**: If set to 0.95, tasks must be 95% documented to avoid penalty

#### 5. Insufficient Cross-Training
- **Default**: < 50% of team members are cross-trained
- **Configuration**: Implicit (5th factor, +1 point if < 50%)
- **Severity Impact**: LOW (+1 point)
- **Example**: Teams where only 30% can cover critical roles trigger this

### Severity Determination

- **HIGH**: Risk score ≥ 6 (keyPersonDependency + contingencyMissing + other factors)
- **MEDIUM-HIGH**: Risk score ≥ 4 (keyPersonDependency detected)
- **MEDIUM**: Risk score ≥ 2 (documentation or backup issues)
- **LOW**: Risk score < 2 (no significant factor detected)

### Recommendations (Only When Risk Detected)

When any risk factors accumulate, the following recommendations are added:

1. **Crear backups para personas críticas**
   - Documentar conocimiento de personas clave
   - Entrenar alternos/successors

2. **Plan de contingencia para ausencias**
   - Definir permisos y sustituciones
   - Crear plan para enfermedades/rotación

3. **Reducir dependencias de individuos**
   - Cross-training de equipo
   - Code review pairs
   - Knowledge sharing sessions

4. **Documentación diaria**
   - Tareas realizadas
   - Problemas encontrados/resueltos

---

## Remote Work Support Gap (`remote_work_support_gap`)

### Conditions of Activation

Risk activates when ANY of these conditions are detected:

#### 1. High Remote Work Percentage
- **Default**: > 50% of team works remotely
- **Configuration**: `remoteWorkPercentageThreshold` (0-1, where 0.5 = 50%)
- **Severity Impact**: Informational (sets baseline)
- **Example**: If set to 0.7, risk activates when > 70% remote

#### 2. No Remote Work Policies
- **Default**: Organization has not defined remote work policies
- **Configuration**: `noPolicyRiskScore` (default 3 points)
- **Severity Impact**: HIGH (+3 points)
- **Example**: Missing policies trigger HIGH contribution to risk score

#### 3. No Collaborative Tools
- **Default**: Team lacks collaborative/communication tools
- **Configuration**: `noToolsRiskScore` (default 2 points)
- **Severity Impact**: MEDIUM-HIGH (+2 points)
- **Example**: No Slack, Teams, Zoom configured

#### 4. No Technical Support
- **Default**: No home office tech support provided
- **Configuration**: `noTechSupportRiskScore` (default 2 points)
- **Severity Impact**: MEDIUM-HIGH (+2 points)
- **Example**: Employees setup their own equipment, no IT help desk

### Severity Determination

- **HIGH**: Risk score ≥ 6 (multiple factors missing)
- **MEDIUM-HIGH**: Risk score ≥ 4 (policies OR tools OR support missing)
- **MEDIUM**: Risk score ≥ 2 (single factor missing)
- **LOW**: Risk score < 2

### Recommendations (Only When Risk Detected)

1. **Definir políticas claras de trabajo remoto**
2. **Proveer herramientas software que apoyen al trabajo remoto**
3. **Soporte técnico para configuración home office (ergonomía)**

---

## Role Clarity Gap (`role_clarity_gap`)

### Conditions of Activation

Risk activates when team size exceeds threshold AND clarity issues detected:

#### 1. Large Team Without Clear Roles
- **Default**: Team size > 8 members
- **Configuration**: `minTeamSizeForRoleClarity` (default 8)
- **Severity Impact**: Baseline (only triggers for large teams)
- **Example**: If set to 10, role clarity only matters for teams > 10

#### 2. Roles Undefined for Team Members
- **Default**: < 80% of team members have defined roles
- **Configuration**: `noRolesRiskScore` (default 3 points)
- **Severity Impact**: HIGH (+3 points)
- **Example**: Team of 10 with only 5 roles defined

#### 3. No Organizational Chart
- **Default**: No org chart for project
- **Configuration**: `noOrgChartRiskScore` (default 2 points)
- **Severity Impact**: MEDIUM (+2 points)
- **Example**: Reporting lines and structure undefined

#### 4. Multiple Teams Involved
- **Default**: Project involves multiple teams
- **Configuration**: Implicit (+1 point if multiple teams)
- **Severity Impact**: LOW (+1 point)
- **Example**: Frontend, backend, and QA teams without integration points

### Severity Determination

- **HIGH**: Risk score ≥ 6 (no roles + no org chart + multiple teams)
- **MEDIUM-HIGH**: Risk score ≥ 4 (no roles detected)
- **MEDIUM**: Risk score ≥ 2 (org chart or role issues)
- **LOW**: Risk score < 2

### Recommendations (Only When Risk Detected)

1. **Definir roles y responsabilidades claras**
2. **Revisión de roles al inicio del proyecto con el equipo**

---

## Standards Compliance Gap (`standards_compliance_gap`)

### Conditions of Activation

Risk activates when high cultural diversity is detected:

#### 1. High Cultural Diversity
- **Default**: ≥ 3 unique cultures/regions in team
- **Configuration**: `highCulturalDiversityThreshold` (default 3)
- **Severity Impact**: Baseline (triggers risk investigation)
- **Example**: If set to 4, risk only matters with 4+ cultures

#### 2. No Standardized Procedures
- **Default**: No documented standardized procedures
- **Configuration**: `noProceduresRiskScore` (default 3 points)
- **Severity Impact**: HIGH (+3 points)
- **Example**: Different teams follow different processes

#### 3. No Documented Compliance Standards
- **Default**: No compliance standards documented
- **Configuration**: `noStandardsRiskScore` (default 2 points)
- **Severity Impact**: MEDIUM (+2 points)
- **Example**: Regulatory requirements not explicitly documented

### Severity Determination

- **HIGH**: Risk score ≥ 6 (no procedures + no standards + high diversity)
- **MEDIUM-HIGH**: Risk score ≥ 4 (no procedures detected)
- **MEDIUM**: Risk score ≥ 2 (standards issues)
- **LOW**: Risk score < 2

### Recommendations (Only When Risk Detected)

1. **Revisiones cruzadas entre equipos**
2. **Capacitación en estándares específicos**

---

## Implementation Details

### Source Code References

**Skill Gap Risk Logic**:
- [decisionTree.service.js - checkSkillGapRisk()](src/services/decisionTree.service.js#L1346)
- Reads: `project.decisionTree.riskThresholds.skillGap*`
- Uses: CV data, technical match percentage, junior/senior distribution

**Communication Risk Logic**:
- [decisionTree.service.js - checkCommunicationRisk()](src/services/decisionTree.service.js#L1180)
- Reads: `project.decisionTree.riskThresholds.minTimeOverlapHours`, `normalOverlapHours`
- Uses: Country data, timezone calculations, tool classification

**Team Overload Risk Logic**:
- [decisionTree.service.js - checkTeamOverloadRisk()](src/services/decisionTree.service.js#L1497)
- Reads: `project.decisionTree.riskThresholds.overloadAverageHours`, `maxConcurrentProjectsThreshold`
- Uses: Workload data, concurrent projects, personality profile, availability

**Dependency Blockage Risk Logic**:
- [decisionTree.service.js - checkDependencyRisk()](src/services/decisionTree.service.js#L1624)
- Reads: `project.decisionTree.riskThresholds.minCriticalDependencies`, `minInvolvedTeams`, `riskScoreThresholdHigh/Medium`, `timelineBufferPercentage`
- Uses: Dependencies data, involved teams count, shared infrastructure info

**Scope Creep Risk Logic**:
- [decisionTree.service.js - checkScopeCreepRisk()](src/services/decisionTree.service.js#L1725)
- Reads: `project.decisionTree.riskThresholds.minDescriptionLength`, `minKeyRoles`, `clarityScoreCritical`, `clarityScoreMajor`, `clientTimeOverlapHours`
- Uses: Description length, documentation level, defined roles, client time overlap

**Process Mismatch Risk Logic**:
- [decisionTree.service.js - checkProcessRisk()](src/services/decisionTree.service.js#L1842)
- Reads: `project.decisionTree.riskThresholds.maturityScoreLow`, `maturityScoreMedium`
- Uses: Onboarding presence, CI/CD status, tools fragmentation, distributed experience

**Quality Degradation Risk Logic**:
- [decisionTree.service.js - checkQualityRisk()](src/services/decisionTree.service.js#L2002)
- Reads: `project.decisionTree.riskThresholds.lowDisciplineRiskScore`, `overloadQualityRiskScore`, `juniorComplexityRiskScore`, `qualityRiskScoreHigh/MediumHigh`
- Uses: Team personality traits, workload, experience vs complexity, documentation, CI/CD status

**Knowledge Management Risk Logic**:
- [decisionTree.service.js - checkKnowledgeManagementRisk()](src/services/decisionTree.service.js#L2200)
- Reads: `project.decisionTree.riskThresholds.maxTeamSizeForKM`, `kmToolsRiskScore`, `kmDocRiskScore`, `kmRiskScoreHigh/MediumHigh`
- Uses: Team size, KM tools availability, documentation level, standardization, organization KM

**Resource Unavailability Risk Logic**:
- [decisionTree.service.js - checkResourceAvailabilityRisk()](src/services/decisionTree.service.js#L2350)
- Reads: `project.decisionTree.riskThresholds.keyPersonDependencyThreshold`, `keyPersonRiskScore`, `backupCoverageRequired`, `contingencyPlanRiskScore`, `documentationComplianceThreshold`
- Uses: Key person dependency ratio, backup coverage %, contingency plan status, documentation compliance, cross-training ratio

**Remote Work Support Risk Logic**:
- [decisionTree.service.js - checkRemoteWorkSupportRisk()](src/services/decisionTree.service.js#L2501)
- Reads: `project.decisionTree.riskThresholds.remoteWorkPercentageThreshold`, `noPolicyRiskScore`, `noToolsRiskScore`, `noTechSupportRiskScore`, `remoteRiskScoreHigh`
- Uses: Remote work percentage, policy presence, collaborative tools, tech support availability

**Role Clarity Risk Logic**:
- [decisionTree.service.js - checkRoleClarityRisk()](src/services/decisionTree.service.js#L2559)
- Reads: `project.decisionTree.riskThresholds.minTeamSizeForRoleClarity`, `noRolesRiskScore`, `noOrgChartRiskScore`, `roleRiskScoreHigh`, `roleRiskScoreMediumHigh`
- Uses: Team size, defined roles, organizational chart, multiple teams involvement

**Standards Compliance Risk Logic**:
- [decisionTree.service.js - checkStandardsComplianceRisk()](src/services/decisionTree.service.js#L2687)
- Reads: `project.decisionTree.riskThresholds.highCulturalDiversityThreshold`, `noProceduresRiskScore`, `noStandardsRiskScore`, `complianceRiskScoreHigh`
- Uses: Cultural diversity, standardized procedures, compliance standards documentation

**Model Schema**:
- [project.model.js - decisionTree.riskThresholds](src/models/project.model.js#L844)
- All thresholds stored with defaults, min/max constraints, descriptions

---

## Notes

- **Backward Compatibility**: All thresholds have defaults, so existing projects work without configuration
- **Runtime Updates**: Changes to thresholds are picked up on next risk prediction
- **Validation**: Model enforces min/max constraints at database level
- **Indicators**: All decisions are logged with threshold values in risk.reasoning array
- **Real-time Effect**: No cache invalidation needed—thresholds apply immediately
- **Score**: +4 (HIGH severity)
- **Description**: Team members are spread too thin across concurrent projects

#### 2. Excessive Concurrent Projects
- **Default**: > 2 concurrent projects per member
- **Configuration**: `maxConcurrentProjectsThreshold` (integer ≥ 1)
- **Severity**: MEDIUM-HIGH
- **Example**: If set to 1, risk triggers when member is in 2+ concurrent projects

#### 3. High Stress Tendency + Elevated Hours
- **Default**: Team with high stress + > 45h/week
- **Configuration**: `overloadAverageHours` (30+ hours/week)
- **Severity**: MEDIUM (+2 points)
- **Example**: If set to 50, risk triggers when stress-prone team > 50h/week

#### 4. After-Hours Required + Overloaded Team
- **Default**: 24/7 requirements + > 45h/week workload
- **Configuration**: `overloadAverageHours` (30+ hours/week)
- **Severity**: MEDIUM (+2 points)

### Recommendations (Fixed)
- Redistribuir carga o contratar recursos
- Reducir concurrencia o extender plazos
- Extender fecha de finalización
- Monitor team wellbeing weekly
- Prepare contingency plan if it worsens

---

## How to Update Thresholds

### Via API (Update Project)

```bash
PUT /api/projects/:projectId
Content-Type: application/json

{
  "decisionTree": {
    "riskThresholds": {
      "skillGapCritical": 0.45,                    // Lower = more sensitive
      "skillGapMajor": 0.75,                       // Adjust as needed
      "minTechnologiesThreshold": 2,               // Fewer = more sensitive
      "maxJuniorRatio": 0.5,                       // Lower = requires more seniors
      "minProficiencyThreshold": 2.5,              // Higher = more strict
      "minTimeOverlapHours": 1,                    // Lower = more regions need async tools
      "normalOverlapHours": 5,                     // Adjust overlap intervals
      "overloadAverageHours": 50,                  // Higher = more lenient
      "maxConcurrentProjectsThreshold": 1          // Lower = stricter on concurrent projects
    }
  }
}
```

### Via MongoDB (Direct Update)

```javascript
db.projects.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      "decisionTree.riskThresholds.skillGapCritical": 0.45,
      "decisionTree.riskThresholds.maxJuniorRatio": 0.5,
      "decisionTree.riskThresholds.overloadAverageHours": 50
    }
  }
)
```

---

## Use Cases & Examples

### Scenario 1: Strict Project (Startup)
For high-risk, fast-moving projects:

```javascript
{
  skillGapCritical: 0.7,                  // Very strict tech match (70%)
  minTechnologiesThreshold: 2,            // Trigger on 2+ missing techs
  maxJuniorRatio: 0.3,            // Max 30% juniors (need lots of seniors)
  minProficiencyThreshold: 3.0,   // Need high proficiency
  minTimeOverlapHours: 1          // Strongly favor async tools
}
```

### Scenario 2: Lenient Project (Bootcamp/Learning)
For training-focused projects:

```javascript
{
  skillGapCritical: 0.3,          // Lenient tech match (30%)
  minTechnologiesThreshold: 5,    // Only trigger on 5+ missing techs
  maxJuniorRatio: 0.8,            // OK with 80% juniors
  minProficiencyThreshold: 1.5,   // Lower proficiency OK
  minTimeOverlapHours: 4          // More flexible with time zones
}
```

### Scenario 3: Distributed Team (Multiple Continents)
For globally distributed teams:

```javascript
{
  skillGapCritical: 0.5,                  // Standard tech match
  minTechnologiesThreshold: 3,            // Standard threshold
  maxJuniorRatio: 0.5,                    // Need mid-level balance
  minProficiencyThreshold: 2.0,           // Standard proficiency
  minTimeOverlapHours: 0,                 // Very limited overlap → must use async
  normalOverlapHours: 3,                  // Narrow window for mixed tools
  overloadAverageHours: 45,               // Standard workload threshold
  maxConcurrentProjectsThreshold: 2       // Standard concurrency limit
}
```

---

## Default Values (Complete List - 44 Total Thresholds)

| Threshold | Default | Min | Max | Unit |
|-----------|---------|-----|-----|------|
| skillGapCritical | 0.5 | 0 | 1 | ratio (0-1) |
| skillGapMajor | 0.7 | 0 | 1 | ratio (0-1) |
| minTechnologiesThreshold | 3 | 1 | ∞ | count |
| maxJuniorRatio | 0.6 | 0 | 1 | ratio (0-1) |
| minProficiencyThreshold | 2.0 | 1 | 5 | scale (1-5) |
| minTimeOverlapHours | 2 | 0 | 8 | hours |
| normalOverlapHours | 6 | 2 | 8 | hours |
| overloadAverageHours | 45 | 30 | ∞ | hours/week |
| maxConcurrentProjectsThreshold | 2 | 1 | ∞ | count |
| overloadCritical | 60 | 40 | ∞ | hours/week |
| overloadHigh | 50 | 40 | ∞ | hours/week |
| minCriticalDependencies | 3 | 1 | ∞ | count |
| minInvolvedTeams | 2 | 1 | ∞ | count |
| riskScoreThresholdHigh | 6 | 1 | ∞ | score |
| riskScoreThresholdMedium | 4 | 1 | ∞ | score |
| timelineBufferPercentage | 30 | 0 | 100 | % |
| minDescriptionLength | 500 | 100 | ∞ | chars |
| minKeyRoles | 3 | 1 | ∞ | count |
| clarityScoreCritical | 1 | 0 | 3 | score |
| clarityScoreMajor | 1.5 | 0 | 3 | score |
| clientTimeOverlapHours | 4 | 0 | 8 | hours/day |
| maturityScoreLow | 1.5 | 0 | 10 | score |
| maturityScoreMedium | 2.5 | 0 | 10 | score |
| lowDisciplineRiskScore | 3 | 0 | ∞ | points |
| overloadQualityRiskScore | 2 | 0 | ∞ | points |
| juniorComplexityRiskScore | 3 | 0 | ∞ | points |
| qualityRiskScoreHigh | 6 | 1 | ∞ | score |
| qualityRiskScoreMediumHigh | 4 | 1 | ∞ | score |
| maxTeamSizeForKM | 5 | 2 | ∞ | persons |
| kmToolsRiskScore | 3 | 0 | ∞ | points |
| kmDocRiskScore | 2 | 0 | ∞ | points |
| kmRiskScoreHigh | 6 | 1 | ∞ | score |
| kmRiskScoreMediumHigh | 4 | 1 | ∞ | score |
| keyPersonDependencyThreshold | 0.3 | 0 | 1 | ratio (0-1) |
| keyPersonRiskScore | 4 | 0 | ∞ | points |
| backupCoverageRequired | 0.8 | 0 | 1 | ratio (0-1) |
| contingencyPlanRiskScore | 2 | 0 | ∞ | points |
| documentationComplianceThreshold | 0.9 | 0 | 1 | ratio (0-1) |
| minTimeOverlapHoursThreshold | 3 | 0 | 12 | hours |
| minTimezonesForRisk | 3 | 1 | ∞ | count |
| lowOverlapRiskScore | 3 | 0 | ∞ | points |
| multipleTimezonesRiskScore | 2 | 0 | ∞ | points |
| frequentMeetingsRiskScore | 2 | 0 | ∞ | points |
| timezoneRiskScoreHigh | 6 | 1 | ∞ | points |

---

## Implementation Details

### Source Code References

**Skill Gap Risk Logic**:
- [decisionTree.service.js - checkSkillGapRisk()](src/services/decisionTree.service.js#L1346)
- Reads: `project.decisionTree.riskThresholds.skillGap*`
- Uses: CV data, technical match percentage, junior/senior distribution

**Communication Risk Logic**:
- [decisionTree.service.js - checkCommunicationRisk()](src/services/decisionTree.service.js#L1180)
- Reads: `project.decisionTree.riskThresholds.minTimeOverlapHours`, `normalOverlapHours`
- Uses: Country data, timezone calculations, tool classification

**Team Overload Risk Logic**:
- [decisionTree.service.js - checkTeamOverloadRisk()](src/services/decisionTree.service.js#L1497)
- Reads: `project.decisionTree.riskThresholds.overloadAverageHours`, `maxConcurrentProjectsThreshold`
- Uses: Workload data, concurrent projects, personality profile, availability

**Timezone Scheduling Risk Logic**:
- [decisionTree.service.js - checkTimezoneSchedulingRisk()](src/services/decisionTree.service.js#L2956)
- Reads: `project.decisionTree.riskThresholds.minTimeOverlapHoursThreshold`, `minTimezonesForRisk`, etc.
- Uses: Time overlap data, timezone distribution, meeting requirements

**Model Schema**:
- [project.model.js - decisionTree.riskThresholds](src/models/project.model.js#L844)
- All thresholds stored with defaults, min/max constraints, descriptions

---

## Notes

- **Backward Compatibility**: All thresholds have defaults, so existing projects work without configuration
- **Runtime Updates**: Changes to thresholds are picked up on next risk prediction
- **Validation**: Model enforces min/max constraints at database level
- **Indicators**: All decisions are logged with threshold values in risk.reasoning array
- **Real-time Effect**: No cache invalidation needed—thresholds apply immediately


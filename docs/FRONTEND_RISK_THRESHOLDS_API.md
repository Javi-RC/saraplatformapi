# API Guide: Configure Risk Thresholds (Frontend)

## Overview

This guide explains how to configure the 29 most important risk detection thresholds from the frontend. These thresholds control when and at what severity risks are detected by the expert rules system.

---

## Endpoint

```http
PATCH /api/projects/:id/team-config/decision-tree
```

### Authentication
- **Required**: Bearer token (JWT)
- **Authorization**: Only the Project Manager can modify configuration

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Important Notes
- Use project `_id` (MongoDB ObjectId) in URL
- Method is `PATCH` (not PUT) for partial updates
- All 29 thresholds are optional in request body
- Unspecified thresholds retain current values

---

## Request Body Structure

```json
{
  "riskThresholds": {
    // Skill Gap Thresholds (5)
    "skillGapCritical": 0.5,
    "skillGapMajor": 0.7,
    "minTechnologiesThreshold": 3,
    "maxJuniorRatio": 0.6,
    "minProficiencyThreshold": 2.0,
    
    // Communication Thresholds (2)
    "minTimeOverlapHours": 2,
    "normalOverlapHours": 6,
    
    // Team Overload Thresholds (4)
    "overloadCritical": 60,
    "overloadHigh": 50,
    "overloadAverageHours": 45,
    "maxConcurrentProjectsThreshold": 2,
    
    // Scope Creep Thresholds (3)
    "minDescriptionLength": 500,
    "minKeyRoles": 3,
    "clientTimeOverlapHours": 4,
    
    // Dependency Thresholds (3)
    "minCriticalDependencies": 3,
    "minInvolvedTeams": 2,
    "timelineBufferPercentage": 30,
    
    // Knowledge Management Thresholds (2)
    "maxTeamSizeForKM": 5,
    "kmRiskScoreHigh": 6,
    
    // Process Maturity Thresholds (2)
    "maturityScoreLow": 1.5,
    "maturityScoreMedium": 2.5,
    
    // Cultural/Timezone Thresholds (3)
    "highCulturalDiversityThreshold": 3,
    "minTimezonesForRisk": 3,
    "minTimeOverlapHoursThreshold": 3
  },
  "personalityRiskThresholds": {
    "agreeablenessLow": 2.5,
    "agreeablenessVarianceHigh": 1.5,
    "neuroticismHigh": 3.5
  }
}
```

---

## Threshold Details & Valid Ranges

### 🎯 **TIER 1: Critical Thresholds (16)**

#### **Skill Gap Thresholds (5)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `skillGapCritical` | Number | 0.0 | 1.0 | 0.5 | Tech match ratio below this = CRITICAL risk (e.g., 0.5 = <50%) |
| `skillGapMajor` | Number | 0.0 | 1.0 | 0.7 | Tech match ratio below this = MAJOR risk (e.g., 0.7 = <70%) |
| `minTechnologiesThreshold` | Integer | 1 | 20 | 3 | Missing this many critical technologies = HIGH risk |
| `maxJuniorRatio` | Number | 0.0 | 1.0 | 0.6 | Max ratio of juniors in complex projects (0.6 = 60%) |
| `minProficiencyThreshold` | Number | 1.0 | 5.0 | 2.0 | Min avg proficiency for complex projects (1-5 scale) |

**Use case**: Adjust for industry skill requirements (consulting vs bootcamp).

---

#### **Communication Thresholds (2)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `minTimeOverlapHours` | Number | 0 | 8 | 2 | Hours overlap ≤ this → favor async tools |
| `normalOverlapHours` | Number | 2 | 8 | 6 | Hours overlap ≥ this → sync tools viable |

**Use case**: Adjust for distributed teams (remote-first vs hybrid).

**Logic**:
- Overlap ≤ `minTimeOverlapHours`: Use async tools (Slack, email)
- Overlap between thresholds: Any tool acceptable
- Overlap ≥ `normalOverlapHours`: Use sync tools (Zoom, Teams)

---

#### **Team Overload Thresholds (4)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `overloadCritical` | Integer | 40 | 100 | 60 | Weekly hours ≥ this = CRITICAL overload |
| `overloadHigh` | Integer | 40 | 100 | 50 | Weekly hours ≥ this = HIGH overload |
| `overloadAverageHours` | Integer | 30 | 100 | 45 | Avg team hours/week ≥ this = team overload risk |
| `maxConcurrentProjectsThreshold` | Integer | 1 | 10 | 2 | Concurrent projects > this = overload risk |

**Use case**: Adjust for organizational culture (startup vs corporate).

---

#### **Scope Creep Thresholds (3)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `minDescriptionLength` | Integer | 100 | 5000 | 500 | Brief description < this chars = unclear requirements |
| `minKeyRoles` | Integer | 1 | 20 | 3 | Defined key roles < this = scope creep risk |
| `clientTimeOverlapHours` | Number | 0 | 8 | 4 | Hours/day overlap with client < this = alignment issues |

**Use case**: Adjust for formality level (agile startup vs waterfall enterprise).

---

### 🟡 **TIER 2: Important Thresholds (10)**

#### **Dependency Thresholds (3)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `minCriticalDependencies` | Integer | 1 | 20 | 3 | Critical dependencies ≥ this = dependency blockage risk |
| `minInvolvedTeams` | Integer | 1 | 10 | 2 | Involved teams ≥ this = coordination risk |
| `timelineBufferPercentage` | Integer | 0 | 100 | 30 | Recommended timeline buffer % for integrations |

---

#### **Knowledge Management Thresholds (2)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `maxTeamSizeForKM` | Integer | 2 | 50 | 5 | Team size > this needs formal knowledge management |
| `kmRiskScoreHigh` | Integer | 1 | 20 | 6 | KM risk score ≥ this = HIGH severity |

---

#### **Process Maturity Thresholds (2)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `maturityScoreLow` | Number | 0 | 10 | 1.5 | Process maturity score < this = HIGH mismatch risk |
| `maturityScoreMedium` | Number | 0 | 10 | 2.5 | Process maturity score < this = MEDIUM mismatch risk |

**Note**: Maturity score is 0-4 scale based on: onboarding, CI/CD, tools, experience.

---

#### **Cultural/Timezone Thresholds (3)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `highCulturalDiversityThreshold` | Integer | 1 | 20 | 3 | Unique cultures ≥ this = compliance/standards risk |
| `minTimezonesForRisk` | Integer | 1 | 20 | 3 | Timezones ≥ this = timezone scheduling risk |
| `minTimeOverlapHoursThreshold` | Number | 0 | 12 | 3 | Overlap hours < this = timezone issues |

---

### 🧠 **Personality Thresholds (3)**

| Threshold | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| `agreeablenessLow` | Number | 1.0 | 5.0 | 2.5 | Avg agreeableness < this = conflict escalation risk |
| `agreeablenessVarianceHigh` | Number | 0 | 5.0 | 1.5 | Agreeableness variance > this = team conflict risk |
| `neuroticismHigh` | Number | 1.0 | 5.0 | 3.5 | Avg neuroticism > this = burnout susceptibility risk |

**Note**: Big Five traits are on 1-5 scale.

---

## Complete Examples

### Example 1: Strict Configuration (High-Risk Project)

**Scenario**: Fast-moving startup, tight deadlines, critical product launch.

```json
{
  "riskThresholds": {
    "skillGapCritical": 0.7,
    "skillGapMajor": 0.85,
    "minTechnologiesThreshold": 2,
    "maxJuniorRatio": 0.3,
    "minProficiencyThreshold": 3.0,
    "minTimeOverlapHours": 1,
    "normalOverlapHours": 4,
    "overloadCritical": 55,
    "overloadHigh": 45,
    "overloadAverageHours": 40,
    "maxConcurrentProjectsThreshold": 1,
    "minDescriptionLength": 800,
    "minKeyRoles": 5,
    "clientTimeOverlapHours": 6,
    "minCriticalDependencies": 2,
    "minInvolvedTeams": 2,
    "timelineBufferPercentage": 50,
    "maxTeamSizeForKM": 4,
    "kmRiskScoreHigh": 5,
    "maturityScoreLow": 2.0,
    "maturityScoreMedium": 3.0,
    "highCulturalDiversityThreshold": 2,
    "minTimezonesForRisk": 2,
    "minTimeOverlapHoursThreshold": 4
  },
  "personalityRiskThresholds": {
    "agreeablenessLow": 3.0,
    "agreeablenessVarianceHigh": 1.0,
    "neuroticismHigh": 3.0
  }
}
```

---

### Example 2: Lenient Configuration (Learning Environment)

**Scenario**: Bootcamp project, focus on learning, tolerant of skill gaps.

```json
{
  "riskThresholds": {
    "skillGapCritical": 0.3,
    "skillGapMajor": 0.5,
    "minTechnologiesThreshold": 5,
    "maxJuniorRatio": 0.9,
    "minProficiencyThreshold": 1.5,
    "minTimeOverlapHours": 4,
    "normalOverlapHours": 8,
    "overloadCritical": 70,
    "overloadHigh": 60,
    "overloadAverageHours": 55,
    "maxConcurrentProjectsThreshold": 3,
    "minDescriptionLength": 200,
    "minKeyRoles": 1,
    "clientTimeOverlapHours": 2,
    "minCriticalDependencies": 5,
    "minInvolvedTeams": 4,
    "timelineBufferPercentage": 20,
    "maxTeamSizeForKM": 8,
    "kmRiskScoreHigh": 8,
    "maturityScoreLow": 0.5,
    "maturityScoreMedium": 1.5,
    "highCulturalDiversityThreshold": 5,
    "minTimezonesForRisk": 5,
    "minTimeOverlapHoursThreshold": 1
  },
  "personalityRiskThresholds": {
    "agreeablenessLow": 2.0,
    "agreeablenessVarianceHigh": 2.0,
    "neuroticismHigh": 4.0
  }
}
```

---

### Example 3: Global Team (Multiple Continents)

**Scenario**: Distributed team across 3+ timezones, async-first culture.

```json
{
  "riskThresholds": {
    "skillGapCritical": 0.5,
    "skillGapMajor": 0.7,
    "minTechnologiesThreshold": 3,
    "maxJuniorRatio": 0.5,
    "minProficiencyThreshold": 2.5,
    "minTimeOverlapHours": 0,
    "normalOverlapHours": 3,
    "overloadCritical": 60,
    "overloadHigh": 50,
    "overloadAverageHours": 45,
    "maxConcurrentProjectsThreshold": 2,
    "minDescriptionLength": 600,
    "minKeyRoles": 4,
    "clientTimeOverlapHours": 2,
    "minCriticalDependencies": 3,
    "minInvolvedTeams": 2,
    "timelineBufferPercentage": 40,
    "maxTeamSizeForKM": 5,
    "kmRiskScoreHigh": 6,
    "maturityScoreLow": 1.5,
    "maturityScoreMedium": 2.5,
    "highCulturalDiversityThreshold": 3,
    "minTimezonesForRisk": 3,
    "minTimeOverlapHoursThreshold": 2
  },
  "personalityRiskThresholds": {
    "agreeablenessLow": 2.5,
    "agreeablenessVarianceHigh": 1.5,
    "neuroticismHigh": 3.5
  }
}
```

---

## Partial Updates

You can update only specific thresholds without sending all 29:

```json
{
  "riskThresholds": {
    "skillGapCritical": 0.6,
    "maxJuniorRatio": 0.5,
    "overloadCritical": 55
  }
}
```

**Note**: Unspecified thresholds will keep their current values (or defaults if not set).

---

## Response Format

### Success (200 OK)

```json
{
  "success": true,
  "message": "Decision Tree configuration updated successfully",
  "data": {
    "decisionTree": {
      "riskThresholds": {
        "skillGapCritical": 0.6,
        "skillGapMajor": 0.7,
        // ... all 29 thresholds
      },
      "personalityRiskThresholds": {
        "agreeablenessLow": 2.5,
        "agreeablenessVarianceHigh": 1.5,
        "neuroticismHigh": 3.5
      }
    }
  }
}
```

---

### Errors

#### 404 Not Found - Project doesn't exist
```json
{
  "success": false,
  "error": "Project not found"
}
```

#### 403 Forbidden - Not the project manager
```json
{
  "success": false,
  "error": "Only the project manager can modify configuration"
}
```

#### 400 Bad Request - Invalid configuration
```json
{
  "success": false,
  "error": "Invalid configuration after update",
  "validationErrors": [
    "skillGapCritical must be between 0 and 1",
    "minKeyRoles must be at least 1"
  ]
}
```

---

## Validation Rules

### Automatic Validations

The backend automatically validates:

1. **Type checking**: Number/Integer as specified
2. **Range enforcement**: Min/Max boundaries
3. **Logic validation**: 
   - `skillGapMajor` must be ≥ `skillGapCritical`
   - `normalOverlapHours` must be ≥ `minTimeOverlapHours`
   - `overloadHigh` must be ≤ `overloadCritical`

### Frontend Pre-validation Recommendations

Before sending:
1. Validate all numbers are within allowed ranges
2. Check logical relationships between thresholds
3. Show warnings for extreme values (e.g., `skillGapCritical: 0.9` is very strict)

---

## Use Cases by Industry

### **Tech Consulting / Professional Services**
- ✅ Strict skill gaps (`skillGapCritical: 0.7`)
- ✅ Tight workload controls (`overloadCritical: 55`)
- ✅ High formality (`minDescriptionLength: 800`)

### **Startup / Scale-up**
- ⚡ Moderate skill gaps (`skillGapCritical: 0.5`)
- ⚡ Flexible workload (`overloadCritical: 65`)
- ⚡ Low formality (`minDescriptionLength: 400`)

### **Enterprise / Government**
- 🏢 Moderate-strict skill gaps (`skillGapCritical: 0.6`)
- 🏢 Strict process maturity (`maturityScoreLow: 2.0`)
- 🏢 High documentation (`minDescriptionLength: 1000`)

### **Education / Training**
- 🎓 Very lenient skill gaps (`skillGapCritical: 0.3`)
- 🎓 High junior ratio (`maxJuniorRatio: 0.9`)
- 🎓 Minimal formality (`minDescriptionLength: 200`)

---

## Testing & Development

### Get Current Configuration

```http
GET /api/projects/:id
```

Returns full project details including `teamSelectionConfig.decisionTree`.

**Response structure:**
```json
{
  "success": true,
  "data": {
    "_id": "673abc123def456",
    "projectName": "My Project",
    // ... other project fields
    "teamSelectionConfig": {
      "decisionTree": {
        "riskThresholds": {
          "skillGapCritical": 0.5,
          // ... all 26 risk thresholds
        },
        "personalityRiskThresholds": {
          "agreeablenessLow": 2.5,
          "agreeablenessVarianceHigh": 1.5,
          "neuroticismHigh": 3.5
        }
      }
    }
  }
}
```

### Get Only Decision Tree Config

```http
GET /api/projects/:id/team-config
```

Returns only the team selection configuration.

**Response structure:**
```json
{
  "success": true,
  "data": {
    "decisionTree": {
      "riskThresholds": { /* ... */ },
      "personalityRiskThresholds": { /* ... */ }
    },
    "phase1": { /* ... */ },
    "phase2": { /* ... */ },
    "cbr": { /* ... */ }
  }
}
```

### Reset to Defaults

Send empty objects to reset to system defaults:

```http
PATCH /api/projects/:id/team-config/decision-tree
Content-Type: application/json

{
  "riskThresholds": {},
  "personalityRiskThresholds": {}
}
```

**Note**: This will restore all thresholds to their default values defined in [teamSelectionDefaults.js](../src/config/teamSelectionDefaults.js).

---

## Frontend Implementation Example (React/Vue)

```javascript
/**
 * Update risk detection thresholds for a project
 * @param {string} projectId - MongoDB ObjectId of the project
 * @param {Object} thresholds - Partial or complete threshold configuration
 * @returns {Promise<Object>} Updated configuration
 */
const updateRiskThresholds = async (projectId, thresholds) => {
  try {
    const response = await fetch(
      `${API_URL}/api/projects/${projectId}/team-config/decision-tree`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(thresholds)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }
    
    const result = await response.json();
    console.log('Thresholds updated:', result.data.decisionTree);
    return result.data;
    
  } catch (error) {
    console.error('Error updating thresholds:', error);
    throw error;
  }
};

// Usage Example 1: Update specific thresholds
await updateRiskThresholds('673abc123def456', {
  riskThresholds: {
    skillGapCritical: 0.6,
    maxJuniorRatio: 0.5
  }
});

// Usage Example 2: Update personality thresholds
await updateRiskThresholds('673abc123def456', {
  personalityRiskThresholds: {
    agreeablenessLow: 2.8,
    neuroticismHigh: 3.2
  }
});

// Usage Example 3: Update both at once
await updateRiskThresholds('673abc123def456', {
  riskThresholds: {
    skillGapCritical: 0.55,
    overloadCritical: 58
  },
  personalityRiskThresholds: {
    agreeablenessLow: 2.7
  }
});
```

### TypeScript Interface

```typescript
interface RiskThresholds {
  // Skill Gap (5)
  skillGapCritical?: number;              // 0.0-1.0
  skillGapMajor?: number;                 // 0.0-1.0
  minTechnologiesThreshold?: number;      // 1-20
  maxJuniorRatio?: number;                // 0.0-1.0
  minProficiencyThreshold?: number;       // 1.0-5.0
  
  // Communication (2)
  minTimeOverlapHours?: number;           // 0-8
  normalOverlapHours?: number;            // 2-8
  
  // Team Overload (4)
  overloadCritical?: number;              // 40-100
  overloadHigh?: number;                  // 40-100
  overloadAverageHours?: number;          // 30-100
  maxConcurrentProjectsThreshold?: number; // 1-10
  
  // Scope Creep (3)
  minDescriptionLength?: number;          // 100-5000
  minKeyRoles?: number;                   // 1-20
  clientTimeOverlapHours?: number;        // 0-8
  
  // Dependencies (3)
  minCriticalDependencies?: number;       // 1-20
  minInvolvedTeams?: number;              // 1-10
  timelineBufferPercentage?: number;      // 0-100
  
  // Knowledge Management (2)
  maxTeamSizeForKM?: number;              // 2-50
  kmRiskScoreHigh?: number;               // 1-20
  
  // Process Maturity (2)
  maturityScoreLow?: number;              // 0-10
  maturityScoreMedium?: number;           // 0-10
  
  // Cultural/Timezone (3)
  highCulturalDiversityThreshold?: number; // 1-20
  minTimezonesForRisk?: number;           // 1-20
  minTimeOverlapHoursThreshold?: number;  // 0-12
}

interface PersonalityThresholds {
  agreeablenessLow?: number;              // 1.0-5.0
  agreeablenessVarianceHigh?: number;     // 0-5.0
  neuroticismHigh?: number;               // 1.0-5.0
}

interface UpdateThresholdsRequest {
  riskThresholds?: Partial<RiskThresholds>;
  personalityRiskThresholds?: Partial<PersonalityThresholds>;
}

interface UpdateThresholdsResponse {
  success: boolean;
  message: string;
  data: {
    decisionTree: {
      riskThresholds: RiskThresholds;
      personalityRiskThresholds: PersonalityThresholds;
    };
  };
}
```

---

## Common Questions

### Q: Can I update thresholds after project starts?
**A**: Yes, thresholds can be updated anytime. Changes apply to the next risk prediction.

### Q: What happens if I send invalid values?
**A**: Backend returns 400 with validation errors. Thresholds are not updated.

### Q: Do changes affect past predictions?
**A**: No, only future risk predictions use the new thresholds.

### Q: Can I see which thresholds were used in a prediction?
**A**: Yes, check `risk.reasoning` array in prediction results for threshold values used.

### Q: Are there any thresholds dependencies?
**A**: Yes: `normalOverlapHours ≥ minTimeOverlapHours` and `overloadCritical ≥ overloadHigh`.

---

## Best Practices

1. **Start with defaults**: Test with system defaults before customizing
2. **Adjust gradually**: Change 2-3 thresholds at a time, observe impact
3. **Document rationale**: Keep notes on why thresholds were changed
4. **Review periodically**: Re-evaluate thresholds every quarter
5. **Test with simulation**: Use historical projects to test threshold impact
6. **Industry benchmarks**: Compare with similar organizations
7. **Team feedback**: Collect PM feedback on risk accuracy

---

## Support

For questions or issues:
- Check [CONFIGURABLE_RISK_THRESHOLDS.md](./CONFIGURABLE_RISK_THRESHOLDS.md) for detailed risk logic
- Review backend validation in `src/models/project.model.js`
- Contact backend team for threshold recommendations

## 🔧 CORRECCIÓN: Deep Merge en Actualizaciones de Configuración

### **Problema Identificado**

Los métodos PATCH para actualizar configuraciones parciales (`phase1`, `phase2`, `cbr`, `decisionTree`) estaban usando un merge superficial que causaba:

1. **Pérdida de valores personalizados** cuando se actualizaba solo una subsección
2. **Sobrescritura de objetos anidados completos** en lugar de merge selectivo
3. **Reset inesperado a valores por defecto** de campos no enviados en el request

#### **Ejemplo del Problema (CBR):**

```javascript
// ❌ ANTES (merge superficial incorrecto)
project.teamSelectionConfig.cbr = {
  ...DEFAULT_TEAM_SELECTION_CONFIG.cbr,     // 1. Defaults
  ...project.teamSelectionConfig.cbr,       // 2. Valores actuales
  ...req.body                                // 3. Nueva actualización
};

// Si el usuario envía:
{
  "dimensionWeights": {
    "coordination": 0.30,
    "technical": 0.30,
    "team": 0.20,
    "management": 0.10,
    "organizational": 0.10
  }
}

// Resultado: kSimilarCases y minSimilarityThreshold se resetean a defaults
// porque req.body no los incluye
```

### **Solución Implementada**

Se implementó un **deep merge** que preserva valores existentes y solo actualiza los campos específicamente enviados:

#### **1. updateCBRConfig** ✅

```javascript
// ✅ DESPUÉS (deep merge correcto)
const currentCBR = project.teamSelectionConfig.cbr;
const updates = req.body;

// Merge dimensionWeights profundamente
if (updates.dimensionWeights) {
  currentCBR.dimensionWeights = {
    ...(currentCBR.dimensionWeights || DEFAULT_TEAM_SELECTION_CONFIG.cbr.dimensionWeights),
    ...updates.dimensionWeights
  };
}

// Actualizar solo si se envían
if (updates.kSimilarCases !== undefined) {
  currentCBR.kSimilarCases = updates.kSimilarCases;
}
if (updates.minSimilarityThreshold !== undefined) {
  currentCBR.minSimilarityThreshold = updates.minSimilarityThreshold;
}
```

**Resultado:** 
- ✅ `dimensionWeights` se actualiza
- ✅ `kSimilarCases` mantiene su valor personalizado existente
- ✅ `minSimilarityThreshold` mantiene su valor personalizado existente

---

#### **2. updatePhase1Config** ✅

**Objetos anidados manejados:**
- `availabilityComponents` (4 campos)
- `complexityFactors` (4 campos)

```javascript
// Merge profundo de objetos anidados
if (updates.availabilityComponents) {
  currentPhase1.availabilityComponents = {
    ...(currentPhase1.availabilityComponents || DEFAULT_TEAM_SELECTION_CONFIG.phase1.availabilityComponents),
    ...updates.availabilityComponents
  };
}

// Actualización selectiva de campos simples
if (updates.skillsWeight !== undefined) currentPhase1.skillsWeight = updates.skillsWeight;
if (updates.experienceWeight !== undefined) currentPhase1.experienceWeight = updates.experienceWeight;
```

---

#### **3. updatePhase2Config** ✅

**Objetos anidados manejados:**
- `synergyWeights` (3 campos)
- `projectProfiles` (5 perfiles de personalidad)

```javascript
// Merge synergyWeights profundamente
if (updates.synergyWeights) {
  currentPhase2.synergyWeights = {
    ...(currentPhase2.synergyWeights || DEFAULT_TEAM_SELECTION_CONFIG.phase2.synergyWeights),
    ...updates.synergyWeights
  };
}

// Merge projectProfiles si se envía
if (updates.projectProfiles) {
  currentPhase2.projectProfiles = {
    ...(currentPhase2.projectProfiles || DEFAULT_TEAM_SELECTION_CONFIG.phase2.projectProfiles),
    ...updates.projectProfiles
  };
}
```

---

#### **4. updateDecisionTreeConfig** ✅

**Objetos anidados manejados:**
- `riskThresholds` (4 campos)
- `personalityRiskThresholds` (3 campos)

```javascript
// Merge riskThresholds profundamente
if (updates.riskThresholds) {
  currentDT.riskThresholds = {
    ...(currentDT.riskThresholds || DEFAULT_TEAM_SELECTION_CONFIG.decisionTree.riskThresholds),
    ...updates.riskThresholds
  };
}

// Merge personalityRiskThresholds profundamente
if (updates.personalityRiskThresholds) {
  currentDT.personalityRiskThresholds = {
    ...(currentDT.personalityRiskThresholds || DEFAULT_TEAM_SELECTION_CONFIG.decisionTree.personalityRiskThresholds),
    ...updates.personalityRiskThresholds
  };
}
```

---

### **Archivos Modificados**

- ✅ [`src/controllers/project.controller.js`](src/controllers/project.controller.js)
  - `updatePhase1Config` (líneas ~1228-1310)
  - `updatePhase2Config` (líneas ~1315-1370)
  - `updateCBRConfig` (líneas ~1372-1441)
  - `updateDecisionTreeConfig` (líneas ~1485-1550)

---

### **Prueba de Funcionamiento**

#### **Escenario de Prueba:**

1. Usuario tiene configuración personalizada de CBR:
   ```json
   {
     "dimensionWeights": { "coordination": 0.35, ... },
     "kSimilarCases": 10,
     "minSimilarityThreshold": 0.4
   }
   ```

2. Usuario actualiza solo `kSimilarCases`:
   ```json
   PATCH /api/projects/:id/team-config/cbr
   { "kSimilarCases": 8 }
   ```

3. **Resultado esperado:**
   ```json
   {
     "dimensionWeights": { "coordination": 0.35, ... },  // ✅ Preservado
     "kSimilarCases": 8,                                  // ✅ Actualizado
     "minSimilarityThreshold": 0.4                        // ✅ Preservado
   }
   ```

---

### **Beneficios de la Corrección**

✅ **Actualizaciones granulares**: Cambiar un solo campo sin afectar otros  
✅ **Preservación de configuración**: Valores personalizados no se pierden  
✅ **Experiencia de usuario mejorada**: No se resetea toda la configuración  
✅ **Consistencia**: Todos los endpoints PATCH funcionan de manera predecible  

---

### **Frontend: Cómo Enviar Actualizaciones**

El frontend ahora puede enviar **solo los campos que cambian**:

```javascript
// ✅ CORRECTO - Enviar solo lo que cambió
await fetch(`/api/projects/${id}/team-config/cbr`, {
  method: 'PATCH',
  body: JSON.stringify({
    dimensionWeights: {
      coordination: 0.30,
      technical: 0.30,
      team: 0.20,
      management: 0.10,
      organizational: 0.10
    }
    // kSimilarCases y minSimilarityThreshold se preservan automáticamente
  })
});
```

No es necesario enviar toda la configuración, solo las actualizaciones parciales.

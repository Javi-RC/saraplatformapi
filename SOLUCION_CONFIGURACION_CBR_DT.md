# Solución: Integración de Archivos de Configuración en CBR y Decision Tree

## Problema Identificado

Los servicios `cbr.service.js` y `decisionTree.service.js` tenían valores hardcodeados y no estaban utilizando los archivos de configuración disponibles en `teamSelectionDefaults.js`. Esto causaba que:

- Los umbrales de similitud configurados no se respetaban
- Los pesos de dimensiones no eran personalizables
- Los umbrales de riesgo del árbol de decisión no se podían ajustar

## Cambios Realizados

### 1. **cbr.service.js**

#### Importación del módulo de configuración
```javascript
const { getConfigSection } = require('../config/teamSelectionDefaults');
```

#### Uso dinámico de configuración CBR
- **`minSimilarityThreshold`**: Ahora se obtiene de la configuración del proyecto (default: 0.3)
- **`kSimilarCases`**: Número de casos similares configurable (default: 5)
- **`dimensionWeights`**: Pesos de dimensiones personalizables

**Funciones actualizadas:**
- `predictRisksWithCBR()`: Obtiene configuración CBR del proyecto
- `retrieveSimilarCases()`: Usa `minSimilarity` dinámico
- `calculateSimilarity()`: Usa pesos de dimensión desde configuración
- `getSimilarityBreakdown()`: Usa pesos configurables
- `reuseSolution()`: Filtra usando `minSimilarity` de configuración

#### Almacenamiento del proyecto en features
```javascript
function extractProjectFeatures(project, teamAnalysis = null) {
  return {
    _project: project, // Referencia para acceder a configuración
    coordination: { ... },
    // ...
  };
}
```

### 2. **decisionTree.service.js**

#### Importación del módulo de configuración
```javascript
const { getConfigSection } = require('../config/teamSelectionDefaults');
```

#### Eliminación de constante hardcodeada
- Eliminado: `DIMENSION_WEIGHTS` constante (ya no se usa)
- Eliminado de exports

**Nota:** Las reglas del árbol de decisión ya usaban `project.decisionTree?.riskThresholds` correctamente, por lo que solo fue necesario eliminar la constante obsoleta.

### 3. **riskPrediction.service.js**

#### Importación del módulo de configuración
```javascript
const { getConfigSection } = require('../config/teamSelectionDefaults');
```

#### Comentario explicativo
Agregado comentario indicando que el parámetro `k=5` será sobrescrito por la configuración del proyecto si está presente.

## Configuración Disponible

### Configuración por Defecto (teamSelectionDefaults.js)

```javascript
cbr: {
  dimensionWeights: {
    coordination: 0.25,
    technical: 0.30,
    team: 0.20,
    management: 0.15,
    organizational: 0.10
  },
  kSimilarCases: 5,
  minSimilarityThreshold: 0.3
},

decisionTree: {
  riskThresholds: {
    // TIER 1: Critical Thresholds
    skillGapCritical: 0.5,
    skillGapMajor: 0.7,
    minTimeOverlapHours: 2,
    overloadCritical: 60,
    // ... más umbrales
  }
}
```

### Configuración Personalizada por Proyecto

Para personalizar la configuración para un proyecto específico, agrega `teamSelectionConfig` al documento del proyecto:

```javascript
{
  projectName: "Mi Proyecto",
  // ... otros campos del proyecto
  
  teamSelectionConfig: {
    cbr: {
      minSimilarityThreshold: 0.5,  // Solo casos con >50% similitud
      kSimilarCases: 3,              // Top 3 casos más similares
      dimensionWeights: {
        coordination: 0.3,           // Mayor peso a coordinación
        technical: 0.3,
        team: 0.2,
        management: 0.1,
        organizational: 0.1
      }
    },
    decisionTree: {
      riskThresholds: {
        skillGapCritical: 0.4,       // Umbral más estricto
        overloadCritical: 50,        // Sobrecarga a 50h/semana
        minTimeOverlapHours: 4       // Requiere 4h de solapamiento
      }
    }
  }
}
```

## Ventajas de los Cambios

### ✅ **Flexibilidad**
- Cada proyecto puede tener su propia configuración de umbrales
- Permite adaptar el sistema a diferentes tipos de proyectos

### ✅ **Mantenibilidad**
- Configuración centralizada en un solo archivo
- Fácil de actualizar valores por defecto

### ✅ **Backward Compatibility**
- Si no se especifica configuración personalizada, usa valores por defecto
- Proyectos existentes seguirán funcionando sin cambios

### ✅ **Merge Inteligente**
- La configuración personalizada se fusiona con los defaults
- Solo necesitas especificar los valores que quieres cambiar

## Verificación

El archivo `test-config-usage.js` demuestra cómo funciona la configuración:

```bash
node test-config-usage.js
```

**Resultado esperado:**
- ✓ Configuración por defecto se carga correctamente
- ✓ Configuración personalizada sobrescribe valores
- ✓ Configuración parcial se fusiona con defaults
- ✓ Todos los umbrales del árbol de decisión están disponibles

## Ejemplo de Uso en Producción

### Proyecto con requisitos estrictos de calidad
```javascript
teamSelectionConfig: {
  cbr: {
    minSimilarityThreshold: 0.6,  // Solo casos muy similares
    kSimilarCases: 3               // Menos casos, más precisión
  },
  decisionTree: {
    riskThresholds: {
      skillGapCritical: 0.3,       // Muy estricto con skill gap
      overloadCritical: 45         // No permitir sobrecarga
    }
  }
}
```

### Proyecto experimental/innovador
```javascript
teamSelectionConfig: {
  cbr: {
    minSimilarityThreshold: 0.2,  // Aceptar casos menos similares
    kSimilarCases: 10              // Aprender de más casos
  },
  decisionTree: {
    riskThresholds: {
      skillGapCritical: 0.6,       // Más tolerante con gaps
      changeResistanceRiskScoreHigh: 9  // Menos sensible al cambio
    }
  }
}
```

## Logs y Debugging

Los servicios ahora registran los valores de configuración usados:

```
[CBR] Retrieving cases for organizationId: xxx, minSimilarity: 0.5
[CBR] After filtering (similarity > 0.5): 3 cases selected
```

Esto facilita verificar que se está usando la configuración correcta.

## Archivos Modificados

1. ✅ `src/services/cbr.service.js` - Usa configuración dinámica
2. ✅ `src/services/decisionTree.service.js` - Eliminada constante obsoleta
3. ✅ `src/services/riskPrediction.service.js` - Importa configuración
4. ✅ `test-config-usage.js` - Script de verificación creado

## Estado Final

✅ **Servidor arranca sin errores**
✅ **Configuración se carga correctamente**
✅ **Valores hardcodeados eliminados**
✅ **Backward compatibility mantenida**
✅ **Sistema completamente configurable**

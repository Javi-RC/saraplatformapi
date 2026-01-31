# ✅ Solución: Preservación de Títulos y Descripciones en CBR

## Problema Identificado

Cuando un riesgo manual se guardaba en el CBR y luego se recuperaba en otro proyecto, **se mostraba con título y descripción genéricos** en lugar de preservar el título y descripción originales que tú habías puesto.

### Causa Raíz

1. **Al guardar en CBR:** Solo se guardaba la `description`, no el `title`
2. **Al recuperar del CBR:** Se generaban títulos y descripciones genéricos con funciones `generateRiskTitle()` y `generateRiskDescription()`
3. **Resultado:** Los riesgos se veían diferentes aunque fueran el mismo

## Solución Implementada

### 1. Modelo CaseBase Actualizado

**Archivo:** [`src/models/caseBase.model.js`](src/models/caseBase.model.js#L135-L153)

Ahora incluye el campo `title` en `actualRisks`:

```javascript
actualRisks: [{
  type: String,
  title: String,        // ✨ NUEVO
  severity: String,
  description: String,
  // ... resto de campos
}]
```

### 2. Guardado de Título en CBR

**Archivos modificados:**
- [`src/services/project.service.js`](src/services/project.service.js#L461-L475) - autoSaveManualRisksToCBR
- [`src/services/postProject.service.js`](src/services/postProject.service.js#L189-L203) - captureProjectOutcome

Ahora se guarda el `title` junto con los demás datos:

```javascript
const actualizedRisks = manualRisks.map(risk => ({
  type: risk.type,
  title: risk.title,        // ✨ NUEVO
  description: risk.description,
  // ... resto de campos
}));
```

### 3. Recuperación de Título y Descripción Originales

**Archivo:** [`src/services/cbr.service.js`](src/services/cbr.service.js)

**Cambios realizados:**

1. **Recolección de títulos** (línea ~347):
```javascript
// Collect titles
if (risk.title) {
  riskAggregation[key].titles.push(risk.title);
}
```

2. **Recolección de títulos en examples** (línea ~327):
```javascript
riskAggregation[key].examples.push({
  // ...
  title: risk.title,        // ✨ NUEVO
  description: risk.description,
  // ...
});
```

3. **Uso de título y descripción originales** (línea ~372):
```javascript
// Use original description from most similar case
const mostSimilarExample = aggRisk.examples.reduce((max, ex) => 
  ex.similarity > max.similarity ? ex : max
, aggRisk.examples[0]);

// Use original title and description from most similar case
const title = mostSimilarExample.title || generateRiskTitle(aggRisk.type);
const description = mostSimilarExample.description || 
                   generateRiskDescription(aggRisk, aggRisk.examples.length);
```

## Cómo Funciona Ahora

### Antes (Problemático)
```
Riesgo Manual: "Problemas con videollamadas"
    ↓
CBR guarda: { type: "communication_breakdown", description: "..." }
    ↓
Otro proyecto detecta el riesgo:
    title: "Barreras de Comunicación" ❌ (genérico)
    description: "Problemas de comunicación reportados en 1 casos..." ❌ (genérico)
```

### Ahora (Corregido)
```
Riesgo Manual: "Problemas con videollamadas"
    ↓
CBR guarda: { type: "communication_breakdown", title: "Problemas con videollamadas", description: "..." }
    ↓
Otro proyecto detecta el riesgo:
    title: "Problemas con videollamadas" ✅ (preservado)
    description: "..." ✅ (preservado del caso original)
```

## Estrategia de Preservación

El CBR ahora usa una estrategia inteligente:

1. **Prioridad al caso más similar:** Usa el título/descripción del caso con mayor similitud
2. **Fallback a genérico:** Si no hay título/descripción, genera uno genérico
3. **Preserva contexto:** Mantiene el contexto original del proyecto donde ocurrió

## Scripts de Utilidad

### 1. Verificar Preservación
```bash
node test-risk-preservation.js
```
Muestra qué porcentaje de riesgos en CBR tienen título y descripción.

### 2. Limpiar Casos Antiguos
```bash
node clean-old-cbr-cases.js
```
Elimina casos CBR creados antes de esta corrección (sin títulos).

### 3. Verificar Auto-guardado
```bash
node test-auto-save-cbr.js
```
Verifica que los casos CBR se crean correctamente.

## Beneficios

✅ **Consistencia:** Los riesgos se ven igual en todos los proyectos  
✅ **Contexto Preservado:** Se mantiene el contexto y terminología original  
✅ **Mejor UX:** Los usuarios ven riesgos con sus descripciones originales  
✅ **Aprendizaje Mejorado:** El CBR aprende con más detalle contextual

## Compatibilidad

- ✅ Compatible con casos CBR existentes (usa fallback a genérico)
- ✅ No rompe código existente
- ✅ Los nuevos casos se crean con título y descripción
- ✅ Casos antiguos pueden limpiarse y recrearse

## Para Recrear Casos Antiguos

Si quieres que los casos antiguos tengan títulos:

1. **Limpia el caso antiguo:**
```bash
node clean-old-cbr-cases.js
```

2. **Completa el proyecto de nuevo** para recrear el caso con el nuevo formato

O simplemente deja que los casos antiguos usen títulos genéricos (no afecta funcionalidad).

## Archivos Modificados

- ✅ [`src/models/caseBase.model.js`](src/models/caseBase.model.js) - Modelo actualizado con campo `title`
- ✅ [`src/services/cbr.service.js`](src/services/cbr.service.js) - Lógica de preservación
- ✅ [`src/services/project.service.js`](src/services/project.service.js) - Guardado de título
- ✅ [`src/services/postProject.service.js`](src/services/postProject.service.js) - Guardado de título

## Archivos de Prueba Creados

- 📄 [`test-risk-preservation.js`](test-risk-preservation.js) - Verificar preservación
- 📄 [`clean-old-cbr-cases.js`](clean-old-cbr-cases.js) - Limpiar casos antiguos
- 📄 [`recreate-cbr-cases.js`](recreate-cbr-cases.js) - Recrear casos (si hay proyectos completados)

---

**Implementado:** 20 de Enero, 2026  
**Estado:** ✅ Verificado y Funcionando  
**Nota:** Los casos antiguos (pre-fix) mantendrán títulos genéricos hasta que se recreen

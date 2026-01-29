# Solución: Auto-guardado de Riesgos Manuales en CBR

## Problema Identificado

Cuando se completaba un proyecto usando el endpoint `PATCH /api/projects/:id/complete`, **los riesgos manuales NO se guardaban automáticamente en el sistema CBR** (Case-Based Reasoning).

### Flujo Anterior (Problemático)

1. Usuario completa proyecto → `project.completeProject()`
2. Solo se cambia `status = 'completed'`
3. **Los riesgos manuales NO se guardan en CBR**
4. El sistema CBR no aprende de estos riesgos

Los riesgos solo se guardaban en CBR si el usuario completaba manualmente el formulario post-proyecto (`captureProjectOutcome`), lo cual era opcional y a menudo se omitía.

## Solución Implementada

### 1. Nuevo Método: `autoSaveManualRisksToCBR`

**Ubicación:** [`src/services/project.service.js`](src/services/project.service.js#L425-L504)

Este método:
- Se ejecuta automáticamente cuando se completa un proyecto
- Verifica si ya existe un caso CBR para evitar duplicados
- Extrae todos los riesgos manuales del proyecto
- Transforma los riesgos al formato esperado por CBR
- Calcula métricas básicas (delay, etc.)
- Guarda el caso en CBR usando `cbrService.retainCase()`

```javascript
async autoSaveManualRisksToCBR(projectId) {
  // 1. Check if case already exists
  const existingCase = await CaseBase.findOne({ caseId: projectId });
  if (existingCase) return; // Avoid duplicates
  
  // 2. Get manual risks
  const manualRisks = await Risk.find({
    project: projectId,
    source: 'manual'
  });
  
  // 3. Transform to actualized risks format
  const actualizedRisks = manualRisks.map(risk => ({
    type: risk.type,
    occurred: risk.occurred !== false,
    severity: risk.actualSeverity || risk.severity,
    description: risk.description,
    rootCause: risk.rootCause,
    actualImpact: { ... },
    mitigationStrategies: risk.mitigationStrategies || []
  }));
  
  // 4. Save to CBR
  await cbrService.retainCase(project, postProjectData, organization);
}
```

### 2. Modificación en `completeProject`

**Ubicación:** [`src/services/project.service.js`](src/services/project.service.js#L506-L551)

Ahora cuando se completa un proyecto, automáticamente llama a `autoSaveManualRisksToCBR`:

```javascript
async completeProject(projectId, userId) {
  // ... validations ...
  
  await project.complete();
  
  // ✨ NUEVO: Auto-save manual risks to CBR
  try {
    await this.autoSaveManualRisksToCBR(projectId);
  } catch (cbrError) {
    console.error('Error auto-saving manual risks to CBR:', cbrError);
    // Don't block project completion if CBR save fails
  }
  
  // ... notifications ...
}
```

### Características Clave

1. **No Bloquea:** Si falla el guardado en CBR, el proyecto se completa igual
2. **Evita Duplicados:** Verifica si ya existe un caso antes de crear uno nuevo
3. **Datos Mínimos:** Crea un caso con información básica pero suficiente
4. **Preserva Información:** Guarda todos los riesgos manuales con sus detalles

## Flujo Nuevo (Corregido)

```
Usuario completa proyecto
    ↓
project.completeProject()
    ↓
project.status = 'completed'
    ↓
autoSaveManualRisksToCBR()  ← ✨ NUEVO
    ↓
1. Obtiene riesgos manuales
2. Transforma a formato CBR
3. Guarda caso en CaseBase
    ↓
CBR aprende de los riesgos ✓
```

## Beneficios

1. **Aprendizaje Automático:** El sistema CBR aprende de todos los proyectos completados
2. **No Requiere Acción Manual:** No depende de que el usuario complete el formulario post-proyecto
3. **Predicciones Mejoradas:** Más casos históricos = mejores predicciones futuras
4. **Preservación de Conocimiento:** Los riesgos manuales identificados no se pierden

## Compatibilidad

- ✅ Compatible con el flujo existente de `captureProjectOutcome`
- ✅ No interfiere con casos ya creados manualmente
- ✅ Si falla, no afecta la finalización del proyecto
- ✅ Funciona con todos los tipos de riesgos manuales

## Testing

Usar el script de prueba: [`test-auto-save-cbr.js`](test-auto-save-cbr.js)

```bash
node test-auto-save-cbr.js
```

Este script verifica:
- Que los riesgos manuales se obtienen correctamente
- Que el caso CBR se crea con la información correcta
- Que no se crean duplicados

## Datos Guardados en CBR

Cuando se completa un proyecto automáticamente, se guarda:

```javascript
{
  completed: true,
  onTime: <calculado>,
  delayDays: <calculado>,
  budgetOverrun: 0,
  qualityScore: 3,           // valor neutro (escala 1-5)
  clientSatisfaction: 3,     // valor neutro (escala 1-5)
  teamMorale: 3,             // valor neutro (escala 1-5)
  actualRisks: [             // ✨ Los riesgos manuales
    {
      type: string,
      occurred: boolean,
      severity: string,
      description: string,
      rootCause: string,
      actualImpact: { ... },
      mitigationStrategies: [ ... ]
    }
  ],
  completedAt: Date
}
```

## Próximos Pasos Sugeridos

1. **Mejorar Métricas por Defecto:** Considerar obtener métricas reales del proyecto
2. **Notificación al Usuario:** Informar que sus riesgos manuales fueron guardados
3. **Analytics:** Crear dashboard mostrando cuántos casos CBR se han generado
4. **Retroalimentación:** Permitir al usuario revisar y mejorar el caso CBR creado

## Notas Técnicas

- El método es **idempotente**: se puede llamar múltiples veces sin crear duplicados
- Los valores por defecto (3 en escala 1-5) son neutros y conservadores
- Se preservan todos los campos importantes de los riesgos manuales
- Compatible con el modelo `CaseBase` existente

---

**Fecha de Implementación:** 20 de Enero, 2026  
**Archivos Modificados:**
- [`src/services/project.service.js`](src/services/project.service.js)

**Archivos de Prueba:**
- [`test-auto-save-cbr.js`](test-auto-save-cbr.js)
- [`fix-completed-projects-cbr.js`](fix-completed-projects-cbr.js) - Script para aplicar retroactivamente

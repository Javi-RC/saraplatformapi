# Work Modes Configuration

## Overview

El sistema ahora soporta 5 modalidades de trabajo diferentes que permiten una configuración más granular de las políticas de trabajo presencial/remoto tanto a nivel de organización como de proyecto.

## Los 5 Modos de Trabajo

### 1. `office_mode` - 100% Presencial
- Todo el trabajo se realiza de forma presencial
- No se permite trabajo remoto
- Equipos ubicados en las oficinas de la organización

### 2. `office_first` - Presencialidad Prioritaria
- La presencialidad es la norma
- Se permite trabajo remoto de forma puntual/excepcional
- Ejemplo: 1 día remoto por semana

### 3. `office_remote_mix` - Híbrido Flexible
- Los empleados pueden alternar libremente entre trabajo presencial y remoto
- No hay restricciones estrictas sobre días en oficina vs remoto
- Ejemplo: Modelo 3-2, 2-3, o totalmente flexible

### 4. `remote_first` - Remoto Prioritario
- El trabajo remoto es la modalidad predominante
- Se permite presencialidad de forma excepcional
- Reuniones presenciales ocasionales (ej: kickoffs, retrospectivas trimestrales)

### 5. `remote_mode` - 100% Remoto
- Todo el trabajo se realiza de forma remota
- No existe oficina física o no se requiere presencia
- Equipos distribuidos globalmente

## Implementación en Modelos

### A Nivel de Organización

```javascript
// En organization.model.js
workModePolicy: {
  type: String,
  enum: [
    'office_mode',
    'office_first',
    'office_remote_mix',
    'remote_first',
    'remote_mode'
  ],
  default: 'office_mode',
  description: 'Default work mode policy for the organization'
}
```

**Uso:** Define la política general de la organización. Todos los proyectos heredan esta configuración por defecto.

### A Nivel de Proyecto

```javascript
// En project.model.js
workMode: {
  type: String,
  enum: [
    'inherit_from_organization',
    'office_mode',
    'office_first',
    'office_remote_mix',
    'remote_first',
    'remote_mode'
  ],
  default: 'inherit_from_organization',
  description: 'Work mode for this specific project'
},
workModeDetails: {
  type: String,
  trim: true,
  maxlength: 500,
  description: 'Additional details or clarifications about the work mode'
}
```

**Uso:** 
- Permite que proyectos específicos sobrescriban la política organizacional
- `inherit_from_organization`: El proyecto usa la política de la organización
- Otros valores: El proyecto define su propia modalidad

## Funciones Helper en Decision Tree Service

### `getEffectiveWorkMode(project, organization)`
Determina el modo de trabajo efectivo, manejando la herencia desde la organización.

```javascript
const workMode = getEffectiveWorkMode(project, organization);
// Retorna: 'office_mode', 'office_first', etc.
```

### `isRemotePredominant(workMode)`
Verifica si el modo es principalmente remoto.

```javascript
if (isRemotePredominant(workMode)) {
  // Aplica lógica para remote_first o remote_mode
}
```

### `isOfficePredominant(workMode)`
Verifica si el modo es principalmente presencial.

```javascript
if (isOfficePredominant(workMode)) {
  // Aplica lógica para office_mode u office_first
}
```

## Impacto en Predicción de Riesgos

Los diferentes modos de trabajo afectan directamente la evaluación de riesgos:

### Riesgos afectados:

1. **Remote Work Support Risk** (`checkRemoteWorkSupportRisk`)
   - Solo aplica si hay componente remoto (no `office_mode`)
   - Evalúa políticas, herramientas y soporte técnico

2. **Team Isolation Risk** (`checkTeamIsolationRisk`)
   - Crítico para `remote_mode` y `remote_first`
   - Evalúa actividades de team building y comunicación social

3. **Work-Life Boundary Blur** (`checkWorkLifeBoundaryBlur`)
   - Mayor riesgo en `remote_mode` y `remote_first`
   - Evalúa políticas de desconexión y horarios definidos

4. **Meeting Fatigue** (`checkMeetingFatigue`)
   - Reporta el modo en indicadores
   - Ayuda a contextualizar la carga de reuniones

## Ejemplos de Uso

### Ejemplo 1: Organización tradicional con proyecto remoto

```javascript
// Organización
{
  name: "Traditional Corp",
  workModePolicy: "office_mode"
}

// Proyecto específico
{
  projectName: "Global Expansion",
  workMode: "remote_first",  // Override organization policy
  workModeDetails: "Equipo distribuido en 3 continentes"
}
```

### Ejemplo 2: Startup flexible

```javascript
// Organización
{
  name: "Flexible Startup",
  workModePolicy: "office_remote_mix"
}

// Proyectos heredan automáticamente
{
  projectName: "Product Launch",
  workMode: "inherit_from_organization"  // Usa office_remote_mix
}
```

### Ejemplo 3: Empresa completamente remota

```javascript
// Organización
{
  name: "Remote Company",
  workModePolicy: "remote_mode",
  remoteWorkConfiguration: {
    hasRemoteWorkPolicy: true,
    providesTechSupport: true,
    remoteWorkTools: ["Zoom", "Slack", "Notion"]
  }
}

// Proyectos
{
  projectName: "All Projects",
  workMode: "inherit_from_organization"  // Todos remotos
}
```

## Migración desde el Sistema Anterior

### Sistema Anterior (Deprecated)
```javascript
workModel: {
  type: { type: String, enum: ['remote', 'hybrid', 'on-site'] },
  remotePercentage: { type: Number, min: 0, max: 100 }
}
```

### Mapeo Sugerido
- `on-site` (0% remote) → `office_mode`
- `on-site` (<30% remote) → `office_first`
- `hybrid` (30-70% remote) → `office_remote_mix`
- `hybrid` (>70% remote) → `remote_first`
- `remote` (100%) → `remote_mode`

## Consideraciones

### Coherencia con políticas organizacionales
- Si una organización tiene `workModePolicy: 'office_mode'` pero no tiene oficinas físicas, es inconsistente
- Si `workModePolicy: 'remote_mode'` pero `remoteWorkConfiguration.hasRemoteWorkPolicy: false`, genera alertas

### Recomendaciones
1. Establecer la política organizacional primero
2. Permitir que proyectos la hereden por defecto
3. Solo sobrescribir cuando el proyecto tenga requisitos específicos diferentes
4. Documentar en `workModeDetails` las razones del override

## Validaciones Futuras

Se recomienda implementar validaciones que:
- Verifiquen coherencia entre `workModePolicy` y `remoteWorkConfiguration`
- Alerten si proyectos override excesivamente la política organizacional
- Sugieran cambios en la política organizacional si muchos proyectos requieren override

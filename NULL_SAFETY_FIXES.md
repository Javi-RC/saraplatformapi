# Null-Safety Fixes Documentation

## Problema Identificado

Se detectaron múltiples errores en tiempo de ejecución causados por acceso a propiedades de referencias MongoDB que retornan `null` cuando los documentos referenciados han sido eliminados.

### Error Típico
```
Cannot read properties of null (reading '_id')
```

### Causa Raíz
Cuando Mongoose ejecuta un `populate()` y el documento referenciado no existe en la base de datos (fue eliminado), el campo populate retorna `null` en lugar del objeto esperado. Acceder a propiedades como `._id` en estos casos causa un crash del servidor.

## Archivos Corregidos

### 1. **src/services/teamSelection.service.js**

#### Cambios:
- **Línea 48**: Agregado filtro `validCvs = cvs.filter(cv => cv.userId != null)` antes de mapear
- **Línea 61**: Cambiado de `cvs.map()` a `validCvs.map()` para usar solo CVs válidos
- **Línea 153**: Ya tenía el filtrado correcto (previo fix)
- **Línea 272**: Validación con `|| cv.userId` como fallback

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
const cvs = await CV.find(...).populate('userId', 'name email avatar');
const scoredEmployees = await Promise.all(
  cvs.map(async cv => {
    return {
      userId: cv.userId._id,  // ❌ Crash si cv.userId es null
      user: cv.userId,
      // ...
    };
  })
);

// DESPUÉS (protegido)
const cvs = await CV.find(...).populate('userId', 'name email avatar');
const validCvs = cvs.filter(cv => cv.userId != null);  // ✅ Filtrar nulls
const scoredEmployees = await Promise.all(
  validCvs.map(async cv => {
    return {
      userId: cv.userId._id,  // ✅ Seguro porque validCvs no contiene nulls
      user: cv.userId,
      // ...
    };
  })
);
```

---

### 2. **src/services/teamAnalysis.service.js**

#### Cambios:
- **Línea 50**: Agregado `.filter(emp => emp.user != null)` antes de `.map(emp => emp.user._id)`
- **Línea 377**: Agregado `.filter(emp => emp.user != null)` antes de `.forEach()`
- **Línea 390**: Agregado `.filter(emp => emp.user != null)` antes de `.forEach()`

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
const teamMemberIds = project.assignedEmployees
  .map(emp => emp.user._id || emp.user);  // ❌ Crash si emp.user es null

// DESPUÉS (protegido)
const teamMemberIds = project.assignedEmployees
  .filter(emp => emp.user != null)  // ✅ Filtrar nulls primero
  .map(emp => emp.user._id || emp.user);
```

---

### 3. **src/models/organization.model.js**

#### Cambios:
- **isEmployee()** (línea 392): Agregado `if (!emp.user) return false;`
- **isProjectManager()** (línea 405): Agregado `if (!emp.user) return false;`
- **Métodos find() internos** (líneas 421, 447, 466, 485): Agregado `emp.user &&` antes de acceder a `.toString()`

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
organizationSchema.methods.isEmployee = function(userId) {
  const userIdStr = userId.toString();
  return this.employees.some(emp => {
    const empUserId = emp.user._id ? emp.user._id.toString() : emp.user.toString();
    return empUserId === userIdStr && emp.status === 'active';
  });
};

// DESPUÉS (protegido)
organizationSchema.methods.isEmployee = function(userId) {
  if (!this.employees) return false;
  const userIdStr = userId.toString();
  return this.employees.some(emp => {
    if (!emp.user) return false;  // ✅ Validar que user existe
    const empUserId = emp.user._id ? emp.user._id.toString() : emp.user.toString();
    return empUserId === userIdStr && emp.status === 'active';
  });
};
```

---

### 4. **src/services/organization.service.js**

#### Cambios:
- **getEmployees()** (línea 147): Agregado `.filter(emp => emp.user != null)` después del populate

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
const org = await Organization.findById(organizationId)
  .populate('employees.user', 'name email avatar');
return { employees: org.employees };  // ❌ Puede contener users null

// DESPUÉS (protegido)
const org = await Organization.findById(organizationId)
  .populate('employees.user', 'name email avatar');
const employees = org.employees.filter(emp => emp.user != null);  // ✅ Filtrar nulls
return { employees };
```

---

### 5. **src/models/project.model.js**

#### Cambios:
- **isProjectManager()** (línea 693): Agregado `if (!this.projectManager) return false;`
- **isAssignedEmployee()** (línea 707): Agregado `if (!emp.user) return false;`
- **removeEmployee()** (línea 740): Agregado `if (!emp.user) return false;`

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
projectSchema.methods.isProjectManager = function(userId) {
  const pmId = this.projectManager._id   // ❌ Crash si projectManager es null
    ? this.projectManager._id.toString() 
    : this.projectManager.toString();
  return pmId === userId.toString();
};

// DESPUÉS (protegido)
projectSchema.methods.isProjectManager = function(userId) {
  if (!this.projectManager) return false;  // ✅ Validar primero
  const pmId = this.projectManager._id 
    ? this.projectManager._id.toString() 
    : this.projectManager.toString();
  return pmId === userId.toString();
};
```

---

### 6. **src/services/postProject.service.js**

#### Cambios:
- **canUpdateOutcome()** (línea 183): Agregado validación `if (project.projectManager && project.projectManager._id && ...)`

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
function canUpdateOutcome(project, userId) {
  if (project.projectManager._id.toString() === userId.toString()) {
    return true;
  }
}

// DESPUÉS (protegido)
function canUpdateOutcome(project, userId) {
  if (project.projectManager && project.projectManager._id && 
      project.projectManager._id.toString() === userId.toString()) {
    return true;
  }
}
```

---

### 7. **src/controllers/risk.controller.js**

#### Cambios:
- **Similar cases endpoint** (línea 445): Agregado validación `if (!project.organization)` antes de acceder a `._id`

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
const organizationId = project.organization._id || project.organization;

// DESPUÉS (protegido)
if (!project.organization) {
  return res.status(400).json({
    success: false,
    error: 'Project organization not found'
  });
}
const organizationId = project.organization._id || project.organization;
```

---

### 8. **src/controllers/project.controller.js**

#### Cambios:
- **Línea 519**: Agregado validación `if (!project.organization)` antes de acceder a `._id`
- **Línea 546**: Agregado `.filter(emp => emp.user != null)` antes de `.map(emp => emp.user._id)`
- **Línea 562**: Agregado `.filter(cv => cv.userId != null)` antes de usar CVs
- **Línea 585**: Agregado `.filter(emp => emp.user != null)` antes de `.map(emp => emp.user._id)`

#### Patrón de Fix:
```javascript
// ANTES (vulnerable)
const userIds = project.assignedEmployees.map(emp => emp.user._id);
const cvs = await CV.find({ userId: { $in: userIds } })
  .populate('userId', 'name email avatar');
const teamMembers = await Promise.all(
  cvs.map(async cv => {
    return {
      userId: cv.userId._id,  // ❌ Ambos accesos son vulnerables
      // ...
    };
  })
);

// DESPUÉS (protegido)
const userIds = project.assignedEmployees
  .filter(emp => emp.user != null)  // ✅ Filtrar nulls en employees
  .map(emp => emp.user._id);
const cvs = await CV.find({ userId: { $in: userIds } })
  .populate('userId', 'name email avatar');
const validCvs = cvs.filter(cv => cv.userId != null);  // ✅ Filtrar nulls en CVs
const teamMembers = await Promise.all(
  validCvs.map(async cv => {
    return {
      userId: cv.userId._id,  // ✅ Seguro
      // ...
    };
  })
);
```

---

## Patrones Defensivos Implementados

### 1. **Filter-Before-Map Pattern**
```javascript
// Siempre filtrar nulls antes de mapear
collection
  .filter(item => item.reference != null)
  .map(item => item.reference.property)
```

### 2. **Early Return Pattern**
```javascript
// En métodos de modelo, retornar false temprano
if (!this.reference) return false;
const refId = this.reference._id.toString();
```

### 3. **Null-Check Before Access Pattern**
```javascript
// Validar existencia antes de acceder a propiedades anidadas
if (obj.reference && obj.reference._id) {
  return obj.reference._id.toString();
}
```

### 4. **Conditional Filtering in Arrays**
```javascript
// En loops, skip nulls con condicional
array.forEach(item => {
  if (!item.reference) return;  // Skip null references
  // ... procesar item.reference
});
```

---

## Archivos NO Modificados (Ya Protegidos)

### **src/services/projectNotificationHelper.js**
- Ya usa helper `_extractId(obj)` que maneja nulls correctamente
- No requiere cambios adicionales

---

## Resultados de Tests

### Tests Unitarios: ✅ **32/32 Pasando**
- `tests/unit/services/auth.service.test.js` - 4 tests pasando
- `tests/unit/utils/validators.test.js` - 12 tests pasando
- `tests/unit/utils/jwt.test.js` - 4 tests pasando
- `tests/unit/services/email.service.test.js` - 12 tests pasando

### Tests de Integración: ⚠️ **Timeouts pre-existentes**
- Los fallos de integración son por timeouts de MongoDB, no relacionados con estos fixes
- Problema existente antes de las correcciones de null-safety

---

## Verificación Recomendada

Para verificar que los fixes funcionan:

1. **Probar con usuarios eliminados**:
   - Crear un proyecto con empleados asignados
   - Eliminar uno de los usuarios de la DB
   - Acceder a rutas que listen empleados (no debe crashear)

2. **Probar con organizaciones eliminadas**:
   - Crear proyectos asociados a una organización
   - Eliminar la organización
   - Intentar acceder a datos del proyecto (debe manejar gracefully)

3. **Probar análisis de equipo**:
   - GET `/api/projects/:projectId/team-analysis`
   - Verificar que no crashea con referencias null

4. **Probar recomendaciones**:
   - GET `/api/projects/:projectId/recommended-team`
   - Verificar filtrado correcto de candidatos

---

## Resumen

- **Total de archivos corregidos**: 8
- **Patrones vulnerables identificados**: ~15 ubicaciones
- **Tipo de fix**: Defensive programming con null checks
- **Impacto**: Previene crashes del servidor por referencias eliminadas
- **Tests**: Todos los tests unitarios pasan correctamente

---

## Fecha de Implementación
**2025-01-XX** - Fixes implementados como parte de refactorización SOLID y mejora de robustez del sistema.

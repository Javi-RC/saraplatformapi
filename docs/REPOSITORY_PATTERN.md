# Arquitectura de Repositorios - Patrón Repository

## Introducción

Se ha implementado el **patrón Repository** para separar correctamente la lógica de negocio del acceso a datos, siguiendo los principios SOLID y mejorando la arquitectura general del proyecto.

## Problema Previo

Antes de esta refactorización, los servicios accedían directamente a los modelos de Mongoose:

```javascript
// ❌ ANTES (Problema)
class UserService {
  async deleteAccount(userId) {
    const user = await User.findById(userId);  // Acceso directo al modelo
    await User.deleteOne({ _id: userId });      // Acceso directo al modelo
  }
}
```

**Problemas identificados:**
- ❌ Violación del Principio de Separación de Responsabilidades
- ❌ Dificulta el testing (necesita base de datos real)
- ❌ Lógica de acceso a datos duplicada en múltiples servicios
- ❌ Acoplamiento fuerte con Mongoose (cambiar ORM requiere modificar todos los servicios)
- ❌ Manejo inconsistente de transacciones
- ❌ Imposible mockear fácilmente en tests

## Solución Implementada

### Nueva Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│          Controllers (HTTP)             │
│   (Manejan Request/Response)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│            Services                      │
│   (Lógica de Negocio Pura)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          Repositories                    │
│   (Acceso a Datos - ÚNICA CAPA)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│            Models                        │
│   (Definiciones de Esquemas)            │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────┐
        │ MongoDB  │
        └──────────┘
```

### Estructura de Archivos

```
src/
├── repositories/
│   ├── base.repository.js          # Repositorio base con operaciones CRUD
│   ├── user.repository.js          # Operaciones específicas de usuarios
│   ├── project.repository.js       # Operaciones específicas de proyectos
│   ├── organization.repository.js  # Operaciones específicas de organizaciones
│   ├── cv.repository.js
│   ├── bfi44.repository.js
│   ├── notification.repository.js
│   ├── caseBase.repository.js
│   ├── risk.repository.js
│   └── index.js                    # Exporta todos los repositorios
├── services/                        # Servicios refactorizados
├── controllers/                     # Sin cambios
└── models/                          # Sin cambios
```

## Implementación

### 1. BaseRepository

Proporciona operaciones CRUD genéricas que heredan todos los repositorios:

```javascript
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) { /* ... */ }
  async findOne(criteria, options = {}) { /* ... */ }
  async find(criteria = {}, options = {}) { /* ... */ }
  async create(data, options = {}) { /* ... */ }
  async updateById(id, data, options = {}) { /* ... */ }
  async deleteById(id, options = {}) { /* ... */ }
  async count(criteria = {}) { /* ... */ }
  async exists(criteria) { /* ... */ }
  async startSession() { /* ... */ }
  // ... más métodos genéricos
}
```

### 2. Repositorios Específicos

Extienden `BaseRepository` y añaden métodos específicos del dominio:

```javascript
class UserRepository extends BaseRepository {
  constructor() {
    super(User); // Inyecta el modelo
  }

  // Métodos específicos del dominio
  async findByEmail(email, options = {}) {
    return this.findOne({ email }, options);
  }

  async findByOrganization(organizationId, options = {}) {
    return this.find({ organization: organizationId }, options);
  }

  async updateVerificationStatus(userId, isVerified, options = {}) {
    return this.updateById(userId, {
      isVerified,
      verificationToken: null,
      verifiedAt: isVerified ? new Date() : null
    }, options);
  }
}

// Exportar como singleton
module.exports = new UserRepository();
```

### 3. Servicios Refactorizados

Los servicios ahora dependen de repositorios en lugar de modelos:

```javascript
// ✅ DESPUÉS (Solución)
const { userRepository, organizationRepository } = require('../repositories');

class UserService {
  async deleteAccount(userId, password) {
    const session = await userRepository.startSession();
    session.startTransaction();

    try {
      // Acceso a datos a través del repositorio
      const user = await userRepository.findById(userId, { select: '+passwordHash' });
      
      if (!user) {
        throw AppError.notFound('USER_NOT_FOUND', 'User not found');
      }

      // Validaciones y lógica de negocio
      await this._validateCanDelete(userId);
      
      // Operaciones de datos a través del repositorio
      await userRepository.deleteById(userId, { session });
      
      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

## Ventajas de la Nueva Arquitectura

### ✅ Separación de Responsabilidades
- **Services**: Solo lógica de negocio
- **Repositories**: Solo acceso a datos
- **Models**: Solo definición de esquemas

### ✅ Facilita el Testing

```javascript
// Ahora es fácil mockear repositorios
const userRepository = require('../repositories/user.repository');
jest.mock('../repositories/user.repository');

describe('UserService', () => {
  it('should delete user', async () => {
    userRepository.findById.mockResolvedValue({ _id: '123', email: 'test@test.com' });
    userRepository.deleteById.mockResolvedValue({ deletedCount: 1 });
    
    const result = await userService.deleteAccount('123', 'password');
    expect(result.success).toBe(true);
  });
});
```

### ✅ Reutilización de Código
- Métodos comunes en `BaseRepository`
- Evita duplicación de queries
- Consistencia en operaciones de BD

### ✅ Mantenibilidad
- Cambiar ORM solo requiere modificar repositorios
- Servicios permanecen intactos
- Punto único de modificación

### ✅ Transacciones Consistentes
- Método `startSession()` centralizado
- Patrones consistentes de transacciones

## Servicios Refactorizados

### Completamente Refactorizados ✅
- [x] `user.service.js`
- [x] `auth.service.js`
- [x] `project.service.js` (parcial)
- [x] `organization.service.js` (parcial)

### Imports Actualizados (pendiente refactorización completa)
- [x] `bfi44.service.js`
- [x] `cv.service.js`
- [x] `notification.service.js`

### Pendientes de Refactorización
- [ ] `riskPrediction.service.js`
- [ ] `cbr.service.js`
- [ ] `teamSelection.service.js`
- [ ] `teamAnalysis.service.js`
- [ ] Otros servicios menores

## Uso en Nuevos Servicios

Al crear nuevos servicios, siempre usar repositorios:

```javascript
// ✅ CORRECTO
const { userRepository, projectRepository } = require('../repositories');

class MyNewService {
  async myMethod() {
    const user = await userRepository.findById(userId);
    const projects = await projectRepository.findByOrganization(orgId);
  }
}
```

```javascript
// ❌ INCORRECTO - NO HACER
const User = require('../models/user.model');
const Project = require('../models/project.model');

class MyNewService {
  async myMethod() {
    const user = await User.findById(userId);  // ❌ Acceso directo
    const projects = await Project.find({ organization: orgId }); // ❌
  }
}
```

## Creación de Nuevos Repositorios

Si necesitas un nuevo repositorio:

1. **Crear el archivo** en `src/repositories/`:

```javascript
// src/repositories/myModel.repository.js
const BaseRepository = require('./base.repository');
const MyModel = require('../models/myModel.model');

class MyModelRepository extends BaseRepository {
  constructor() {
    super(MyModel);
  }

  // Añadir métodos específicos del dominio
  async findByCustomCriteria(value, options = {}) {
    return this.find({ customField: value }, options);
  }
}

module.exports = new MyModelRepository();
```

2. **Exportar** en `src/repositories/index.js`:

```javascript
const myModelRepository = require('./myModel.repository');

module.exports = {
  // ... otros repositorios
  myModelRepository
};
```

## Migración Progresiva

La refactorización se está haciendo de forma **progresiva**:

1. ✅ Crear capa de repositorios
2. ✅ Refactorizar servicios críticos (User, Auth)
3. 🔄 Refactorizar servicios principales (Project, Organization)
4. ⏳ Refactorizar servicios restantes
5. ⏳ Actualizar tests

**No es necesario refactorizar todo de una vez**. Los servicios que aún usan modelos directamente seguirán funcionando mientras se migran progresivamente.

## Conclusión

Esta refactorización mejora significativamente la arquitectura del proyecto:

- ✅ **Código más limpio y mantenible**
- ✅ **Mejor testing** (fácil mockear repositorios)
- ✅ **Separación clara de responsabilidades**
- ✅ **Preparado para cambios futuros** (cambiar ORM, añadir caché, etc.)
- ✅ **Sigue principios SOLID**

La inversión en esta refactorización pagará dividendos en mantenibilidad y escalabilidad a largo plazo.

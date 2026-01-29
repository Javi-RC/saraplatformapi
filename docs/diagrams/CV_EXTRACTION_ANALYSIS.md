# Análisis del Flujo de Extracción de CV con Gemini AI

## 📊 Diagrama de Secuencia

El diagrama PlantUML se encuentra en: [cv-extraction-sequence.puml](cv-extraction-sequence.puml)

---

## 🔐 Análisis de Seguridad

### ✅ Aspectos Positivos

| Aspecto | Descripción |
|---------|-------------|
| **Autenticación JWT** | Se utiliza Passport.js con estrategia JWT para autenticar usuarios antes de permitir la subida |
| **Verificación de Consentimiento GDPR** | Se valida `user.hasCVProcessingConsent()` antes de procesar con IA |
| **Validación de Archivos** | Multer valida tipo MIME (PDF/TXT) y tamaño máximo (5MB) |
| **API Key en Variables de Entorno** | `GEMINI_API_KEY` se almacena en variables de entorno |
| **Normalización de Datos** | Los valores enum se normalizan para prevenir inyección de datos malformados |

### ⚠️ Problemas de Seguridad Identificados

#### 1. **Exposición de API Key en Logs de Error**
```javascript
// En aiExtractor.service.js línea ~188
const response = await fetch(`${endpoint}?key=${this.apiKey}`, {...});
```
**Riesgo**: Si hay errores HTTP y se loguea la URL completa, la API key queda expuesta.

**Recomendación**: Usar headers de autenticación en lugar de query parameters:
```javascript
headers: {
  'Content-Type': 'application/json',
  'x-goog-api-key': this.apiKey
}
```

#### 2. **Doble Consulta a Usuario**
```javascript
// Controller verifica usuario
const user = await User.findById(userId);
// ...
// Luego AIService vuelve a consultar
const user = await User.findById(userId);
```
**Riesgo**: Duplicación innecesaria de queries y posible inconsistencia de datos.

**Recomendación**: Pasar el objeto usuario ya validado al servicio.

#### 3. **Texto Crudo del CV Almacenado**
```javascript
rawText: textContent, // Se guarda el texto completo
```
**Riesgo**: Información sensible (direcciones, teléfonos personales) se almacena sin encriptar.

**Recomendación**: Considerar encriptar `rawText` o no almacenarlo después del procesamiento.

#### 4. **Sin Rate Limiting en Endpoint**
El endpoint `/api/cv/upload` no tiene rate limiting explícito.

**Recomendación**: Implementar rate limiting por usuario/IP.

---

## 🏗️ Análisis de Arquitectura

### ✅ Aspectos Positivos

| Principio SOLID | Implementación |
|-----------------|----------------|
| **Single Responsibility** | Separación clara entre Controller, Service y Model |
| **Open/Closed** | Sistema de fallback de modelos extensible |
| **Dependency Injection** | Uso de repositories en cv.service.js |
| **Interface Segregation** | Validadores específicos (CVCompletenessValidator) |

### ⚠️ Problemas de Arquitectura Identificados

#### 1. **Acoplamiento Directo con Modelos en AIExtractorService**
```javascript
// aiExtractor.service.js
const CV = require('../models/cv.model');
const User = require('../models/user.model');
```
**Problema**: El servicio de IA tiene dependencia directa con modelos, violando la arquitectura de repositorios usada en otros servicios.

**Solución Propuesta**:
```javascript
// Usar repositories como en cv.service.js
const { cvRepository, userRepository } = require('../repositories');
```

#### 2. **Duplicación de Servicios de CV**
Existen dos servicios que procesan CVs:
- `cv.service.js` - Usa extractores manuales (regex)
- `aiExtractor.service.js` - Usa Gemini AI

**Problema**: Código duplicado para validación, limpieza y guardado.

**Solución Propuesta**: Extraer la lógica común a un servicio base:
```
CVBaseService (abstract)
├── CVManualService (extends)
└── AIExtractorService (extends)
```

#### 3. **Notificaciones No Transaccionales**
```javascript
cvNotificationHelper.notifyCVUploaded(...).catch(err => {
  console.error('Error enviando notificación:', err);
});
```
**Problema**: Las notificaciones son fire-and-forget. Si fallan, solo se loguea el error.

**Recomendación**: Implementar cola de notificaciones (Bull/RabbitMQ) para reintentos.

#### 4. **Manejo de Errores Inconsistente**
```javascript
// AIExtractorService
throw new Error('ERROR_PROCESSING_CV');

// Controller
return responseHandler.handleError(error, res);
```
**Problema**: Se pierden detalles del error original al hacer throw genérico.

**Recomendación**: Usar `AppError` custom con códigos de error específicos:
```javascript
const AppError = require('../utils/AppError');
throw new AppError('GEMINI_RATE_LIMIT', 429, 'API rate limit exceeded');
```

#### 5. **Prompt Hardcodeado**
El prompt de Gemini está hardcodeado en `_buildPrompt()`.

**Recomendación**: Externalizar a archivo de configuración o template para facilitar ajustes sin modificar código.

---

## 📝 Métodos Involucrados en el Flujo

### Router Layer
- `cv.routes.js` → POST `/api/cv/upload`
- `passport.authenticate('jwt', {session: false})`
- `multer.upload.single('cv')`

### Controller Layer
- `CVController.uploadCV(req, res)`
- `pdfParse(dataBuffer)` (para PDFs)

### Service Layer
- `AIExtractorService.processCV(userId, textContent, originalFileName)`
- `AIExtractorService._extractWithAI(textContent)`
- `AIExtractorService._canUseCurrentModel()`
- `AIExtractorService._switchToNextModel()`
- `AIExtractorService._buildPrompt(cvText)`
- `AIExtractorService._normalizeEnumValues(data)`
- `AIExtractorService._cleanEmptyFields(cvData)`
- `AIExtractorService._validateRequiredFields(cvData)`
- `AIExtractorService._saveOrUpdateCV(userId, cvData)`
- `validateCVCompleteness(cv)` (cvCompletenessValidator.service.js)
- `cvNotificationHelper.notifyCVUploaded()`
- `cvNotificationHelper.notifyCVProcessed()`

### Model Layer
- `User.findById(userId)`
- `User.hasCVProcessingConsent()`
- `CV.findOne({ userId })`
- `cv.save()`
- `cv.getSummary()`

### External Services
- `Gemini API` → `POST /v1beta/models/{model}:generateContent`

---

## 🔄 Sistema de Fallback de Modelos

El servicio implementa un sistema robusto de fallback entre modelos de Gemini:

```
┌─────────────────────────┐
│ gemini-2.0-flash (15 RPM) │ ← Principal
└────────────┬────────────┘
             │ 429/503
┌────────────▼────────────┐
│ gemini-2.0-flash-lite   │ ← Fallback 1
│        (30 RPM)         │
└────────────┬────────────┘
             │ 429/503
┌────────────▼────────────┐
│ gemini-2.5-flash (10 RPM) │ ← Fallback 2
└────────────┬────────────┘
             │ 429/503
┌────────────▼────────────┐
│ gemini-2.5-flash-lite   │ ← Fallback 3
│        (15 RPM)         │
└────────────┬────────────┘
             │ 429/503
┌────────────▼────────────┐
│ gemini-2.5-pro (2 RPM)  │ ← Último recurso
└─────────────────────────┘
```

**Características:**
- Cooldown de 60 segundos por modelo después de fallo
- Contador de fallos por modelo
- Máximo de reintentos = número de modelos disponibles

---

## 📋 Recomendaciones Prioritarias

1. **Alta Prioridad**
   - [ ] Mover API key a headers en lugar de query params
   - [ ] Implementar rate limiting en endpoint
   - [ ] Unificar uso de repositories en AIExtractorService

2. **Media Prioridad**
   - [ ] Refactorizar servicios de CV para herencia/composición
   - [ ] Implementar cola de notificaciones
   - [ ] Externalizar prompt a configuración

3. **Baja Prioridad**
   - [ ] Considerar encriptar rawText
   - [ ] Mejorar logging con niveles y contexto
   - [ ] Añadir métricas de uso de modelos

# Sistema de Internacionalización (i18n)

Este documento describe el sistema de internacionalización implementado para los riesgos del proyecto.

## 📋 Características

- ✅ Soporte para **español (es)** e **inglés (en)**
- ✅ Traducción automática de títulos, descripciones e indicadores de riesgos
- ✅ Preferencia de idioma a nivel de usuario
- ✅ Idioma por defecto a nivel de organización
- ✅ Detección automática desde header `Accept-Language`
- ✅ Override mediante query parameter `?lang=en`

## 🌍 Idiomas Soportados

| Código | Idioma  | Por defecto |
|--------|---------|-------------|
| `es`   | Español | ✅          |
| `en`   | Inglés  |             |

## 🔧 Configuración

### 1. Preferencia de Usuario

Los usuarios pueden establecer su idioma preferido:

**PATCH** `/api/profile/language`
```json
{
  "language": "en"
}
```

**GET** `/api/profile/language`
```json
{
  "success": true,
  "data": {
    "preferredLanguage": "en",
    "organizationDefaultLanguage": "es",
    "effectiveLanguage": "en",
    "supportedLanguages": ["es", "en"]
  }
}
```

### 2. Idioma por Defecto de Organización

Los administradores pueden establecer el idioma por defecto para toda su organización modificando el campo `defaultLanguage` en el modelo de organización.

### 3. Override con Query Parameter

Todos los endpoints de riesgos aceptan el parámetro `?lang=en`:

```bash
GET /api/projects/:id/risks?lang=en
POST /api/projects/:id/risks/predict?lang=en
GET /api/risks/:id?lang=en
```

## 📚 Uso en el Código

### Importar el servicio i18n

```javascript
const i18n = require('../i18n/i18n.service');
```

### Obtener idioma desde una petición

```javascript
const lang = i18n.getLanguageFromRequest(req);
// Prioridad: query param > user preference > org default > Accept-Language > 'es'
```

### Traducir un riesgo completo

```javascript
const translatedRisk = i18n.translateRiskObject(risk, 'en');
```

### Traducir elementos específicos

```javascript
// Título y descripción
const riskData = i18n.translateRisk('communication_breakdown', 'en');
console.log(riskData.title); // "Communication Breakdown"

// Indicadores
const indicators = i18n.translateIndicators('communication_breakdown', 'en');
// ["Response delays", "Information not shared", "Frequent misunderstandings"]

// Recomendaciones
const recommendations = i18n.translateRecommendations('skill_gap', 'en');
// ["Hire specialists in critical technologies", ...]

// Severidad
const severity = i18n.translateSeverity('high', 'en'); // "High"

// Categoría
const category = i18n.translateCategory('coordination', 'en'); // "Coordination"

// Fuente
const source = i18n.translateSource('expert_rules', 'en'); // "Expert rules"

// Descripción de fase
const phaseDesc = i18n.translatePhaseDescription(2, 25, 'en');
// "Combining expert rules with experience from 25 projects (prioritizing DT)"
```

## 🎯 Endpoints Principales

### Predicción de Riesgos

```bash
POST /api/projects/:id/risks/predict?lang=en
```

Respuesta incluye campo `language`:
```json
{
  "success": true,
  "data": {
    "risks": [...],
    "metadata": {...}
  },
  "language": "en"
}
```

### Obtener Riesgos de Proyecto

```bash
GET /api/projects/:id/risks?lang=en
```

### Obtener Riesgo Específico

```bash
GET /api/risks/:riskId?lang=en
```

## 🔍 Prioridad de Detección de Idioma

El sistema detecta el idioma en el siguiente orden de prioridad:

1. **Query parameter**: `?lang=en`
2. **Preferencia de usuario**: `user.preferredLanguage`
3. **Idioma de organización**: `organization.defaultLanguage`
4. **Header Accept-Language**: `Accept-Language: en-US,en`
5. **Por defecto**: `es`

## 📁 Estructura de Archivos

```
src/i18n/
├── i18n.service.js    # Servicio principal de traducción
├── es.js              # Traducciones en español
└── en.js              # Traducciones en inglés
```

## ➕ Añadir Nuevas Traducciones

### 1. Añadir un nuevo riesgo

Edita `src/i18n/es.js` y `src/i18n/en.js`:

```javascript
// es.js
module.exports = {
  risks: {
    nuevo_riesgo: {
      title: 'Título en español',
      description: 'Descripción en español',
      indicators: {
        indicator1: 'Indicador 1 en español',
        indicator2: 'Indicador 2 en español'
      },
      recommendations: {
        rec1: 'Recomendación 1 en español',
        rec2: 'Recomendación 2 en español'
      }
    }
  }
};

// en.js
module.exports = {
  risks: {
    nuevo_riesgo: {
      title: 'Title in English',
      description: 'Description in English',
      indicators: {
        indicator1: 'Indicator 1 in English',
        indicator2: 'Indicator 2 in English'
      },
      recommendations: {
        rec1: 'Recommendation 1 in English',
        rec2: 'Recommendation 2 in English'
      }
    }
  }
};
```

### 2. Añadir un nuevo idioma

1. Crear `src/i18n/fr.js` (ejemplo para francés)
2. Añadir `'fr'` a `SUPPORTED_LANGUAGES` en `i18n.service.js`
3. Importar y añadir al objeto `translations`
4. Actualizar el enum en los modelos de User y Organization

```javascript
// user.model.js y organization.model.js
preferredLanguage: {
  type: String,
  enum: ['es', 'en', 'fr'],  // Añadir 'fr'
  default: 'es',
  trim: true
}
```

## 🧪 Ejemplos de Uso

### Cambiar idioma de usuario

```javascript
// Frontend
const response = await fetch('/api/profile/language', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ language: 'en' })
});
```

### Obtener riesgos en inglés

```javascript
// Frontend
const response = await fetch('/api/projects/123/risks?lang=en', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.language); // "en"
console.log(data.data[0].title); // "Communication Breakdown"
```

### Predicción con idioma específico

```javascript
// Frontend
const response = await fetch('/api/projects/123/risks/predict?lang=en', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📝 Notas Importantes

1. **Backward Compatibility**: El sistema es totalmente compatible con código existente. Si no se especifica idioma, usa español por defecto.

2. **Fallback**: Si falta una traducción, el sistema usa el texto original del catálogo de riesgos.

3. **Performance**: Las traducciones se cargan en memoria al inicio, sin impacto en rendimiento.

4. **Extensibilidad**: Fácil añadir nuevos idiomas sin modificar lógica de negocio.

## 🚀 Actualización de Modelos Existentes

Para usuarios y organizaciones existentes, el campo `preferredLanguage` / `defaultLanguage` se establecerá automáticamente en `'es'` (valor por defecto).

No se requiere migración de datos.

## 🔒 Seguridad

- Los idiomas soportados están validados en el backend
- No se permiten valores arbitrarios
- El sistema ignora idiomas no soportados y usa el fallback

## 📞 Soporte

Para añadir más traducciones o reportar problemas con traducciones existentes, contacta al equipo de desarrollo.

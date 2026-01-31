# Solución: Internacionalización de Riesgos

## Problema
Los riesgos siempre se devolvían en castellano, independientemente del parámetro de idioma (`lang=en` o `lang=es`) en la petición.

## Causa Raíz
Había **dos problemas principales**:

### 1. **`normalizeRiskFromCatalog` usaba el catálogo hardcoded en español**
En [src/services/riskPrediction.service.js](src/services/riskPrediction.service.js), la función `normalizeRiskFromCatalog` obtenía títulos, descripciones y recomendaciones del archivo `riskCatalog.js`, que está hardcoded en español.

**Antes:**
```javascript
const catalogRecommendations = Array.isArray(metadata?.typicalRecommendations)
  ? metadata.typicalRecommendations  // ← Español del catálogo
  : [];

return {
  ...risk,
  title: translated?.title || metadata?.title || risk?.title,  // ← Fallback al español
  description: translated?.description || metadata?.description || risk?.description,
  recommendations: catalogRecommendations.length > 0 
    ? catalogRecommendations  // ← Siempre español
    : i18n.translateRecommendations(risk?.type, lang)
};
```

**Después:**
```javascript
const translatedRecommendations = i18n.translateRecommendations(risk?.type, lang);
const recommendations = Array.isArray(translatedRecommendations) && translatedRecommendations.length > 0
  ? translatedRecommendations  // ← Traducciones dinámicas
  : [];

return {
  ...risk,
  title: translated?.title || risk?.title,  // ← Solo traducciones
  description: translated?.description || risk?.description,
  recommendations
};
```

### 2. **`translateRiskObject` preservaba textos guardados en la BD**
En [src/i18n/i18n.service.js](src/i18n/i18n.service.js), la función `translateRiskObject` tenía lógica para preservar las recomendaciones e indicadores que venían de la base de datos, incluso si estaban en un idioma diferente al solicitado.

**Antes:**
```javascript
return {
  ...risk,
  title: translated.title || risk.title,
  description: translated.description || risk.description,
  indicators: risk.indicators && risk.indicators.length > 0 
    ? risk.indicators  // ← Preserva lo guardado en BD (español)
    : translateIndicators(risk.type, lang),
  recommendations: risk.recommendations && risk.recommendations.length > 0 
    ? risk.recommendations  // ← Preserva lo guardado en BD (español)
    : translateRecommendations(risk.type, lang)
};
```

**Después:**
```javascript
return {
  ...risk,
  title: translated.title || risk.title,
  description: translated.description || risk.description,
  indicators: translateIndicators(risk.type, lang),  // ← SIEMPRE traduce
  recommendations: translateRecommendations(risk.type, lang)  // ← SIEMPRE traduce
};
```

## Archivos Modificados

### 1. `src/services/riskPrediction.service.js`
- Función `normalizeRiskFromCatalog` ahora usa exclusivamente el servicio i18n
- Ya no depende del catálogo hardcoded en español

### 2. `src/i18n/i18n.service.js`
- Función `translateRiskObject` ahora **siempre traduce** dinámicamente
- No preserva textos de la base de datos que puedan estar en otro idioma

## Flujo de Traducción Correcto

```
1. Cliente hace petición: GET /api/projects/:id/risks?lang=en
                          ↓
2. Controller extrae idioma: lang = i18n.getLanguageFromRequest(req)
                          ↓
3. Service predice riesgos: predictProjectRisks(projectId, lang)
                          ↓
4. Normaliza riesgos: normalizeRiskFromCatalog(risk, lang)
   - Usa i18n.translateRisk() para título/descripción
   - Usa i18n.translateRecommendations() para recomendaciones
                          ↓
5. Guarda en BD con textos traducidos (español o inglés)
                          ↓
6. Al leer de BD: translateRiskObject(risk, lang)
   - SIEMPRE traduce dinámicamente según el idioma solicitado
   - Ignora los textos guardados en la BD
                          ↓
7. Respuesta al cliente con textos en el idioma correcto
```

## Tests Ejecutados

✓ **test-risk-translation.js**: Verifica traducciones básicas de riesgos
✓ **test-normalize-risk.js**: Verifica normalización con diferentes idiomas
✓ **test-get-language.js**: Verifica extracción del idioma desde request
✓ **test-full-translation-flow.js**: Verifica flujo completo de traducción

## Resultado

Ahora los riesgos se devuelven correctamente en el idioma solicitado:

- **`?lang=en`**: Communication Breakdown, High Cultural Distance, etc.
- **`?lang=es`**: Fallo de comunicación, Distancia cultural elevada, etc.

Los riesgos se traducen dinámicamente en cada petición basándose en:
1. Parámetro de query `?lang=en` o `?lang=es`
2. Preferencia del usuario `user.preferredLanguage`
3. Idioma de la organización `organization.defaultLanguage`
4. Header `Accept-Language`
5. Por defecto: español (`es`)

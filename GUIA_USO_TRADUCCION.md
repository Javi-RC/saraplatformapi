# Guía de Uso: Sistema de Traducción de Riesgos

## ✅ Sistema Funcionando Correctamente

El sistema de internacionalización **está funcionando correctamente**. Los riesgos se traducen dinámicamente según el idioma solicitado en cada petición.

## Cómo Usar el Sistema

### 1. Predicción de Riesgos

```http
POST /api/projects/:id/risks/predict?lang=en
POST /api/projects/:id/risks/predict?lang=es
```

**Importante**: Los riesgos se **guardan en la base de datos** con los textos traducidos al idioma especificado. Cada nueva predicción **sobrescribe** los riesgos anteriores.

### 2. Consulta de Riesgos

```http
GET /api/projects/:id/risks?lang=en
GET /api/projects/:id/risks?lang=es
```

**Los riesgos se traducen dinámicamente** al idioma solicitado, **sin importar en qué idioma fueron guardados** originalmente.

## Ejemplo de Flujo Completo

### Escenario 1: Predecir en Español, Consultar en Inglés

```bash
# 1. Predecir riesgos en español
POST /api/projects/123/risks/predict?lang=es
→ Riesgos guardados en BD con textos en español

# 2. Consultar riesgos en inglés
GET /api/projects/123/risks?lang=en
→ Riesgos traducidos dinámicamente a inglés ✅
→ Respuesta: "Communication Breakdown", "Implement daily asynchronous updates"
```

### Escenario 2: Predecir en Inglés, Consultar en Español

```bash
# 1. Predecir riesgos en inglés
POST /api/projects/123/risks/predict?lang=en
→ Riesgos guardados en BD con textos en inglés

# 2. Consultar riesgos en español
GET /api/projects/123/risks?lang=es
→ Riesgos traducidos dinámicamente a español ✅
→ Respuesta: "Fallo de comunicación", "Implementar actualizaciones asíncronas diarias"
```

## Formas de Especificar el Idioma

El sistema busca el idioma en este orden de prioridad:

1. **Parámetro de query** `?lang=en` o `?lang=es` (RECOMENDADO)
2. **Preferencia del usuario** `user.preferredLanguage`
3. **Idioma de la organización** `organization.defaultLanguage`
4. **Header Accept-Language** (del navegador)
5. **Por defecto** español (`es`)

## ⚠️ Problemas Comunes

### "Los riesgos no cambian de idioma"

**Causas posibles:**

1. **No estás pasando el parámetro `?lang=`**
   ```bash
   # ❌ Incorrecto (usa idioma por defecto: español)
   GET /api/projects/123/risks
   
   # ✅ Correcto
   GET /api/projects/123/risks?lang=en
   ```

2. **Caché del navegador/frontend**
   - Limpia la caché del navegador
   - Verifica en las herramientas de desarrollo (Network tab) que la petición incluya `?lang=en`
   - Verifica la respuesta del servidor en el Network tab

3. **Múltiples predicciones seguidas**
   - Cada predicción SOBRESCRIBE los riesgos anteriores
   - Si predices en español y luego en inglés, los riesgos en BD estarán en inglés
   - Pero al consultar con `?lang=es`, se traducirán correctamente a español

### Verificación Manual

Puedes verificar que el sistema funciona usando `curl` o Postman:

```bash
# Predecir en español
curl -X POST "http://localhost:3000/api/projects/123/risks/predict?lang=es" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Consultar en inglés (debe traducir)
curl "http://localhost:3000/api/projects/123/risks?lang=en" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Idiomas Soportados

- `es` - Español (por defecto)
- `en` - English

## Campos Traducidos

Los siguientes campos se traducen dinámicamente:

- ✅ `title` - Título del riesgo
- ✅ `description` - Descripción del riesgo
- ✅ `recommendations` - Array de recomendaciones
- ✅ `indicators` - Array de indicadores

Los siguientes campos NO se traducen (son valores técnicos):

- `type` - Identificador técnico del riesgo
- `category` - Categoría técnica
- `severity` - Nivel de severidad
- `source` - Origen de la predicción

## Ejemplos de Respuesta

### Español (`?lang=es`)
```json
{
  "success": true,
  "data": {
    "risks": [
      {
        "type": "communication_breakdown",
        "title": "Fallo de comunicación",
        "description": "Problemas de comunicación que impiden la coordinación efectiva del equipo",
        "recommendations": [
          "Implementar actualizaciones asíncronas diarias",
          "Definir protocolos claros de escalación"
        ]
      }
    ]
  },
  "language": "es"
}
```

### Inglés (`?lang=en`)
```json
{
  "success": true,
  "data": {
    "risks": [
      {
        "type": "communication_breakdown",
        "title": "Communication Breakdown",
        "description": "Communication problems that prevent effective team coordination",
        "recommendations": [
          "Implement daily asynchronous updates",
          "Define clear escalation protocols"
        ]
      }
    ]
  },
  "language": "en"
}
```

## Frontend: Cómo Implementar

### React/Vue/Angular

```javascript
// Almacenar idioma preferido del usuario
const userLanguage = localStorage.getItem('language') || 'es';

// Incluir en todas las peticiones de riesgos
const response = await fetch(
  `/api/projects/${projectId}/risks?lang=${userLanguage}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log('Risks in', data.language, ':', data.data.risks);
```

### Cambiar Idioma Dinámicamente

```javascript
// Componente de selector de idioma
function LanguageSelector({ projectId }) {
  const [language, setLanguage] = useState('es');
  
  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    
    // Recargar riesgos en el nuevo idioma
    const response = await fetch(
      `/api/projects/${projectId}/risks?lang=${newLang}`
    );
    const data = await response.json();
    
    // Actualizar UI con riesgos traducidos
    updateRisks(data.data.risks);
  };
  
  return (
    <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
}
```

## Tests Ejecutados

Todos los tests pasan correctamente:

✅ `test-risk-translation.js` - Traducciones básicas
✅ `test-normalize-risk.js` - Normalización con diferentes idiomas
✅ `test-get-language.js` - Extracción del idioma desde request
✅ `test-complete-translation-flow.js` - Flujo completo de traducción

## Conclusión

El sistema de traducción **funciona correctamente**. Si experimentas problemas:

1. Verifica que estás pasando el parámetro `?lang=en` o `?lang=es`
2. Limpia la caché del navegador
3. Verifica en Network tab que la petición y respuesta son correctas
4. Revisa los logs del servidor para confirmar el idioma utilizado

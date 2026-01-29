# Actualización: Endpoints de Debug con Soporte Multiidioma

## Problema Resuelto

Los endpoints de debug del panel `secret-risks-debug-panel-2026` no estaban respetando el parámetro `?lang=en` o `?lang=es`. Siempre devolvían los textos en español desde el catálogo hardcoded.

## Endpoints Actualizados

### 1. `GET /api/risks/debug/all?lang=en`

**Antes:**
- Devolvía títulos y descripciones del catálogo hardcoded en español
- No aceptaba parámetro de idioma

**Después:**
- ✅ Acepta `?lang=en` o `?lang=es`
- ✅ Traduce dinámicamente: `title`, `description`, `typicalIndicators`, `typicalRecommendations`
- ✅ Incluye campo `language` en la respuesta

**Ejemplo de uso:**
```bash
GET /api/risks/debug/all?lang=en
```

**Respuesta:**
```json
{
  "success": true,
  "language": "en",
  "summary": {
    "totalPossibleRiskTypes": 50
  },
  "data": [
    {
      "type": "communication_breakdown",
      "title": "Communication Breakdown",
      "description": "Communication problems that prevent effective team coordination",
      "typicalIndicators": [
        "Response delays",
        "Information not shared",
        "Frequent misunderstandings"
      ],
      "typicalRecommendations": [
        "Implement daily asynchronous updates",
        "Define clear escalation protocols"
      ]
    }
  ]
}
```

### 2. `GET /api/risks/debug/by-type/:type?lang=en`

**Antes:**
- Solo devolvía metadatos técnicos
- No incluía información traducida

**Después:**
- ✅ Acepta `?lang=en` o `?lang=es`
- ✅ Traduce: `title`, `description`, `indicators`, `recommendations`
- ✅ Incluye información técnica adicional: `algorithm`, `formula`, `triggerConditions`

**Ejemplo de uso:**
```bash
GET /api/risks/debug/by-type/communication_breakdown?lang=en
```

**Respuesta:**
```json
{
  "success": true,
  "language": "en",
  "data": {
    "type": "communication_breakdown",
    "title": "Communication Breakdown",
    "description": "Communication problems that prevent effective team coordination",
    "indicators": {
      "delays": "Response delays",
      "infoNotShared": "Information not shared",
      "misunderstandings": "Frequent misunderstandings"
    },
    "recommendations": {
      "asyncUpdates": "Implement daily asynchronous updates",
      "escalationProtocols": "Define clear escalation protocols"
    },
    "exists": true,
    "isHofstedeRelated": false,
    "algorithm": "Team size + remote work + timezone",
    "triggerConditions": "Team size, remote work percentage, timezone differences"
  }
}
```

### 3. `GET /api/risks/debug/types-summary?lang=en`

Este endpoint no necesitaba cambios porque solo devuelve metadatos técnicos (tipos, categorías, severidades, etc.) que no requieren traducción.

## Cambios en el Código

### Archivo: `src/controllers/risk.controller.js`

1. **`debugGetAllRisks`** - Líneas ~867-900
   - Añadido: `const lang = i18n.getLanguageFromRequest(req);`
   - Añadido: Traducción de cada riesgo usando `i18n.translateRisk(type, lang)`
   - Añadido: `typicalIndicators` y `typicalRecommendations` traducidos

2. **`debugGetRisksByType`** - Líneas ~922-975
   - Añadido: `const lang = i18n.getLanguageFromRequest(req);`
   - Añadido: Traducción completa del riesgo específico
   - Añadido: Información técnica adicional del catálogo

## Testing

Ejecuta el test para verificar:
```bash
node test-debug-endpoints.js
```

**Resultados esperados:**
- ✅ `?lang=en` → Textos en inglés
- ✅ `?lang=es` → Textos en español
- ✅ Sin parámetro → Idioma por defecto (español)

## Uso en Frontend

### Llamada desde el panel de debug:

```javascript
// En secret-risks-debug-panel-2026
const language = localStorage.getItem('language') || 'en';

// 1. Get all risks
const response = await fetch(
  `/api/risks/debug/all?lang=${language}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// 2. Get specific risk type
const response = await fetch(
  `/api/risks/debug/by-type/communication_breakdown?lang=${language}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### Selector de idioma:

```javascript
function DebugPanel() {
  const [language, setLanguage] = useState('en');
  
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Recargar datos con nuevo idioma
    loadAllRisks(newLang);
  };
  
  return (
    <div>
      <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
      
      {/* Panel content */}
    </div>
  );
}
```

## Verificación en Producción

1. Abre el panel de debug: `secret-risks-debug-panel-2026`
2. Abre DevTools (F12) → Pestaña Network
3. Verifica que las peticiones incluyan `?lang=en` o `?lang=es`
4. Verifica que las respuestas incluyan campo `"language": "en"` o `"language": "es"`
5. Verifica que los títulos y descripciones estén en el idioma correcto

## Endpoints Relacionados

Los siguientes endpoints también soportan multiidioma:

- ✅ `POST /api/projects/:id/risks/predict?lang=en`
- ✅ `GET /api/projects/:id/risks?lang=en`
- ✅ `GET /api/risks/:id?lang=en`
- ✅ `GET /api/risks/debug/all?lang=en` (NUEVO)
- ✅ `GET /api/risks/debug/by-type/:type?lang=en` (NUEVO)

## Notas

- El idioma se detecta en este orden: query param → user preference → organization default → Accept-Language header → default (es)
- Los textos se traducen dinámicamente en cada petición
- No es necesario reiniciar el servidor para cambiar de idioma
- Los metadatos técnicos (type, category, severity) no se traducen

# Guía de Debugging Frontend - Problema de Riesgos Vacíos

## 🔍 Problema Identificado
El backend devuelve correctamente 7 riesgos, pero el frontend muestra:
```
Risks Count: 0
Risks Array: []
```

## ✅ Confirmación Backend
- ✅ El servidor funciona correctamente
- ✅ Endpoint `/api/projects/:id/risks` devuelve 7 riesgos
- ✅ Estructura de respuesta correcta
- ✅ Los riesgos sin `probability` están bien (son de reglas expertas)

---

## 📋 Posibles Errores en el Frontend

### 1. ❌ **ERROR: Acceso Incorrecto a la Estructura de Datos**

**Estructura real de la respuesta del backend:**
```javascript
{
  success: true,
  data: {
    projectId: "696f6ab457cf89417a8ca48c",
    projectName: "Esto es una prueba",
    risks: [ /* array de 7 riesgos */ ],
    metadata: { caseBaseSize: 0, treeWeight: 0.9, cbrWeight: 0.1 },
    summary: { total: 7, bySeverity: {...}, ... }
  }
}
```

**❌ INCORRECTO:**
```javascript
// Intentar acceder directamente a response.risks
const risks = response.risks; // undefined!
```

**✅ CORRECTO:**
```javascript
// Acceder a través de response.data.data.risks
const risks = response.data.data.risks;
// O con desestructuración
const { data: { risks } } = response.data;
```

---

### 2. ❌ **ERROR: Filtrado que Excluye Riesgos sin Probabilidad**

Los riesgos de reglas expertas tienen `probability: undefined`. Si el frontend filtra por probabilidad, los elimina todos.

**❌ INCORRECTO:**
```javascript
// Esto elimina TODOS los riesgos de reglas expertas
const filteredRisks = risks.filter(risk => risk.probability > 0);
const validRisks = risks.filter(risk => risk.probability);
```

**✅ CORRECTO:**
```javascript
// Manejar correctamente los valores undefined
const filteredRisks = risks.filter(risk => 
  risk.probability === undefined || risk.probability > 0
);

// O verificar si existe antes de filtrar
const validRisks = risks.filter(risk => 
  risk.probability !== null && risk.probability !== undefined
);
```

---

### 3. ❌ **ERROR: Validación de Tipo Estricta**

**❌ INCORRECTO:**
```javascript
// Validación que rechaza undefined
if (typeof risk.probability === 'number') {
  // Esto excluye todos los riesgos sin probabilidad
  displayRisk(risk);
}
```

**✅ CORRECTO:**
```javascript
// Aceptar tanto números como undefined
if (risk.probability === undefined || typeof risk.probability === 'number') {
  displayRisk(risk);
}

// O mostrar un valor por defecto
const probability = risk.probability ?? 'N/A';
```

---

### 4. ❌ **ERROR: Manejo de Estado Asíncrono**

**❌ INCORRECTO:**
```javascript
// React: actualizar estado antes de que llegue la respuesta
const [risks, setRisks] = useState([]);

fetchRisks(projectId);
console.log('Risks:', risks); // [] - aún no se actualizó
```

**✅ CORRECTO:**
```javascript
const [risks, setRisks] = useState([]);

useEffect(() => {
  async function loadRisks() {
    try {
      const response = await axios.get(`/api/projects/${projectId}/risks`);
      const risksData = response.data.data.risks;
      console.log('Loaded risks:', risksData); // Aquí verás los datos
      setRisks(risksData);
    } catch (error) {
      console.error('Error loading risks:', error);
      setRisks([]); // Fallback en caso de error
    }
  }
  loadRisks();
}, [projectId]);
```

---

### 5. ❌ **ERROR: Condición de Renderizado Incorrecta**

**❌ INCORRECTO:**
```javascript
// Solo renderiza si hay probabilidad
{risks.length > 0 && risks[0].probability && (
  <RisksList risks={risks} />
)}

// O verificación estricta
{risks.length > 0 && risks.every(r => r.probability !== undefined) && (
  <RisksList risks={risks} />
)}
```

**✅ CORRECTO:**
```javascript
// Renderizar si hay riesgos, sin importar la probabilidad
{risks.length > 0 && (
  <RisksList risks={risks} />
)}

// O con mensaje informativo
{risks.length > 0 ? (
  <RisksList risks={risks} />
) : (
  <p>No hay riesgos identificados para este proyecto</p>
)}
```

---

### 6. ❌ **ERROR: Transformación de Datos que Elimina Campos**

**❌ INCORRECTO:**
```javascript
// Mapear solo si tiene todos los campos
const transformedRisks = risks
  .filter(risk => risk.probability && risk.confidence && risk.severity)
  .map(risk => ({
    ...risk,
    score: risk.probability * risk.confidence // undefined * number = NaN
  }));
```

**✅ CORRECTO:**
```javascript
// Manejar valores opcionales
const transformedRisks = risks.map(risk => ({
  ...risk,
  score: risk.probability 
    ? risk.probability * risk.confidence 
    : risk.confidence, // Usar solo confidence si no hay probability
  displayProbability: risk.probability ?? 'N/A'
}));
```

---

### 7. ❌ **ERROR: Ordenamiento que Falla con undefined**

**❌ INCORRECTO:**
```javascript
// Esto puede dar NaN o comportamiento inesperado
const sortedRisks = risks.sort((a, b) => b.probability - a.probability);
```

**✅ CORRECTO:**
```javascript
// Manejar undefined en el ordenamiento
const sortedRisks = [...risks].sort((a, b) => {
  const probA = a.probability ?? -1; // undefined al final
  const probB = b.probability ?? -1;
  return probB - probA;
});

// O por severidad primero
const sortedRisks = [...risks].sort((a, b) => {
  const severityOrder = { critical: 5, high: 4, 'medium-high': 3, medium: 2, low: 1 };
  return severityOrder[b.severity] - severityOrder[a.severity];
});
```

---

### 8. ❌ **ERROR: Caché de Axios/HTTP Client**

**Posible problema:**
```javascript
// Axios podría estar devolviendo datos en caché
const response = await axios.get(`/api/projects/${projectId}/risks`);
```

**✅ SOLUCIÓN:**
```javascript
// Deshabilitar caché
const response = await axios.get(`/api/projects/${projectId}/risks`, {
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

// O agregar timestamp
const response = await axios.get(
  `/api/projects/${projectId}/risks?t=${Date.now()}`
);
```

---

### 9. ❌ **ERROR: Token de Autenticación Inválido/Expirado**

**Verificar:**
```javascript
try {
  const response = await axios.get(`/api/projects/${projectId}/risks`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('Status:', response.status);
  console.log('Data:', response.data);
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Token inválido o expirado');
    // Redirigir al login
  } else if (error.response?.status === 403) {
    console.error('Sin permisos para ver este proyecto');
  }
  console.error('Error completo:', error.response?.data);
}
```

---

### 10. ❌ **ERROR: CORS o Proxy Mal Configurado**

**Verificar en la consola del navegador:**
- Errores CORS: `Access-Control-Allow-Origin`
- Errores de red: `Network Error`
- Errores 404: URL incorrecta

**Solución común (React/Vite):**
```javascript
// vite.config.js o package.json proxy
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
```

---

## 🔧 Herramientas de Debugging

### 1. **Console.log Estratégico**
```javascript
async function loadRisks(projectId) {
  console.log('1. Cargando riesgos para proyecto:', projectId);
  
  try {
    const response = await axios.get(`/api/projects/${projectId}/risks`);
    console.log('2. Respuesta completa:', response);
    console.log('3. response.data:', response.data);
    console.log('4. response.data.data:', response.data.data);
    console.log('5. Risks array:', response.data.data.risks);
    console.log('6. Número de riesgos:', response.data.data.risks?.length);
    
    if (response.data.data.risks?.length > 0) {
      console.log('7. Primer riesgo:', response.data.data.risks[0]);
    }
    
    return response.data.data.risks;
  } catch (error) {
    console.error('❌ Error cargando riesgos:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}
```

### 2. **Verificar en Network Tab**
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Busca la request a `/api/projects/.../risks`
4. Verifica:
   - Status: debe ser 200
   - Response: debe contener los 7 riesgos
   - Headers: verifica Authorization

### 3. **React DevTools**
```javascript
// Agregar en el componente
useEffect(() => {
  console.log('Estado de risks actualizado:', risks);
}, [risks]);
```

### 4. **Test Manual con cURL**
```bash
# Reemplaza TOKEN con tu JWT
curl -X GET "http://localhost:3000/api/projects/696f6ab457cf89417a8ca48c/risks" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 📊 Checklist de Verificación

- [ ] La respuesta del backend contiene `data.data.risks`
- [ ] El array de riesgos NO está vacío en la respuesta HTTP
- [ ] El frontend accede correctamente a `response.data.data.risks`
- [ ] NO hay filtros que excluyan riesgos sin `probability`
- [ ] El componente se re-renderiza después de cargar los datos
- [ ] NO hay errores en la consola del navegador
- [ ] NO hay errores 401/403 (autenticación)
- [ ] El token JWT es válido y no ha expirado
- [ ] NO hay errores CORS
- [ ] El estado se actualiza correctamente (React/Vue/Angular)

---

## 🎯 Ejemplo Completo Correcto (React)

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProjectRisks({ projectId }) {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRisks() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/api/projects/${projectId}/risks`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        // ✅ CORRECTO: Acceso a la estructura anidada
        const risksData = response.data.data.risks || [];
        
        console.log('Riesgos cargados:', risksData.length);
        setRisks(risksData);
        
      } catch (err) {
        console.error('Error cargando riesgos:', err);
        setError(err.response?.data?.error || 'Error cargando riesgos');
        setRisks([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId) {
      fetchRisks();
    }
  }, [projectId]);

  if (loading) return <div>Cargando riesgos...</div>;
  if (error) return <div>Error: {error}</div>;
  if (risks.length === 0) return <div>No hay riesgos identificados</div>;

  return (
    <div>
      <h2>Riesgos del Proyecto ({risks.length})</h2>
      {risks.map(risk => (
        <div key={risk._id} className={`risk-${risk.severity}`}>
          <h3>{risk.title}</h3>
          <p>{risk.description}</p>
          <div>
            <span>Severidad: {risk.severity}</span>
            <span>
              Probabilidad: {risk.probability ?? 'N/A'}
            </span>
            <span>Confianza: {(risk.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProjectRisks;
```

---

## 🚀 Próximos Pasos

1. **Revisa la consola del navegador** buscando errores
2. **Agrega console.log** en cada paso del flujo de datos
3. **Verifica la pestaña Network** en DevTools
4. **Comprueba que accedes a** `response.data.data.risks` no `response.risks`
5. **Verifica que NO filtras** por `probability`
6. **Comprueba el token JWT** y permisos
7. Si todo falla, comparte el código del componente frontend para análisis específico

---

## 📝 Estructura Exacta del Endpoint

```
GET /api/projects/:id/risks

Response (200 OK):
{
  "success": true,
  "data": {
    "projectId": "696f6ab457cf89417a8ca48c",
    "projectName": "Esto es una prueba",
    "risks": [
      {
        "_id": "696ff6470c8576f1c6357f98",
        "type": "team_overload",
        "title": "Insufficient Team",
        "description": "...",
        "severity": "critical",
        "probability": undefined,  // ⚠️ Puede ser undefined para reglas expertas
        "confidence": 0.95,
        "source": "expert_rules",
        "status": "predicted",
        "occurred": null,
        // ... más campos
      },
      // ... 6 riesgos más
    ],
    "metadata": {
      "caseBaseSize": 0,
      "treeWeight": 0.9,
      "cbrWeight": 0.1
    },
    "summary": {
      "total": 7,
      "bySeverity": {
        "critical": 1,
        "high": 1,
        "medium-high": 1,
        "medium": 3,
        "low": 1
      },
      "byCategory": {...},
      "highPriority": [...],
      "avgProbability": 0,
      "avgConfidence": 0.69
    }
  }
}
```

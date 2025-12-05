# Sistema de Extracción de CVs con IA

## 🚀 Inicio Rápido

### 1. Obtener API Key de Gemini (100% GRATIS)

1. Ve a: **https://aistudio.google.com/app/apikey**
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la clave generada

### 2. Configurar

Agrega en tu archivo `.env`:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

### 3. ¡Listo!

Reinicia el servidor y el sistema funcionará automáticamente.

```bash
npm start
```

---

## ✨ Características

- ✅ **100% Gratuito**: Usa Gemini 1.5 Flash de Google
- ✅ **Rápido**: 2-3 segundos por CV
- ✅ **Inteligente**: Maneja CUALQUIER formato de CV
- ✅ **Multiidioma**: Español, inglés, francés, etc.
- ✅ **Sin cambios en API**: Mismo formato JSON de respuesta

---

## 📋 Límites Gratuitos

- **15 peticiones por minuto**
- **1 millón de tokens al mes**
- **~220 CVs procesables al mes gratis**

Para más capacidad, considera implementar una cola de procesamiento.

---

## 🔧 Cómo Funciona

1. Usuario sube un CV (PDF/TXT)
2. Se extrae el texto con `pdf-parse`
3. El texto se envía a Gemini con un prompt estructurado
4. La IA devuelve un JSON con toda la información extraída
5. Se valida y guarda en MongoDB

---

## 📝 Ejemplo de Uso

```javascript
// El sistema automáticamente extrae:
{
  contact: { email, phones, linkedin, github, location },
  education: [{ institution, degree, dates, achievements }],
  experience: [{ company, position, dates, responsibilities, technologies }],
  skills: { technical: [], soft: [] },
  languages: [{ language, level }],
  projects: [{ name, description, technologies, url }],
  certifications: [{ name, issuer, date, credentialId }],
  achievements: { publications, awards, hackathons }
}
```

---

## 🛠️ Solución de Problemas

### "GEMINI_API_KEY no configurada"
→ Agrega la variable en `.env` y reinicia el servidor

### "Error en API Gemini: 429"
→ Límite de 15 peticiones/min alcanzado. Espera 1 minuto.

### "No se pudo parsear la respuesta"
→ Revisa los logs del servidor para ver la respuesta completa de la IA

---

## 🌐 Alternativas

Si prefieres no usar servicios externos:

- **Ollama** (local): Modelos como `llama3.2` o `mistral`
- **Hugging Face**: API gratuita con modelos open source

---

## 📖 Más Información

Lee `MIGRATION_GUIDE.md` para detalles completos sobre:
- Arquitectura del sistema
- Personalización del prompt
- Cambio de modelos
- Monitoreo y optimización

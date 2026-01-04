# Sistema de Consentimiento para Procesamiento de CVs con IA

## Introducción

Este documento describe el sistema de consentimiento implementado para cumplir con el RGPD y otras regulaciones de privacidad al procesar CVs con servicios de IA de terceros (Google Gemini API).

## 🎯 Objetivo

Garantizar que el usuario:
1. **Está informado** sobre el uso de IA de terceros para procesar su CV
2. **Da su consentimiento explícito** antes de subir cualquier CV
3. **Puede revocar** su consentimiento en cualquier momento
4. **Tiene trazabilidad** de su decisión (fecha, hora, IP)

## 🏗️ Arquitectura

### 1. Modelo de Usuario Actualizado

Se ha añadido el campo `cvProcessingConsent` al modelo de usuario:

```javascript
cvProcessingConsent: {
  // Aceptación general
  accepted: Boolean,           // Si ha aceptado o no
  acceptedAt: Date,            // Fecha y hora de aceptación
  version: String,             // Versión de términos (ej: "1.0")
  ipAddress: String,           // IP desde donde aceptó
  
  // Detalles específicos del consentimiento
  details: {
    aiProcessing: Boolean,           // Procesamiento con IA
    thirdPartySharing: Boolean,      // Compartir con terceros (Google)
    dataRetention: Boolean           // Retención de datos
  }
}
```

### 2. Método de Validación

Nuevo método en el modelo de usuario:

```javascript
user.hasCVProcessingConsent() // Retorna true/false
```

Verifica que:
- `cvProcessingConsent.accepted === true`
- `cvProcessingConsent.details.aiProcessing === true`

## 📡 Endpoints API

### 1. Obtener Estado del Consentimiento

**Endpoint:** `GET /api/cv-consent`

**Requiere:** Token de autenticación

**Respuesta:**
```json
{
  "success": true,
  "consent": {
    "accepted": false,
    "version": "1.0"
  },
  "hasConsent": false
}
```

**Uso:** Para verificar si el usuario ya dio consentimiento antes de mostrar el formulario.

---

### 2. Aceptar/Actualizar Consentimiento

**Endpoint:** `POST /api/cv-consent`

**Requiere:** Token de autenticación

**Body (Aceptar):**
```json
{
  "accepted": true,
  "aiProcessing": true,
  "thirdPartySharing": true,
  "dataRetention": true
}
```

**Body (Revocar):**
```json
{
  "accepted": false
}
```

**Respuesta Exitosa (Aceptar):**
```json
{
  "success": true,
  "message": "Consentimiento aceptado correctamente. Ahora puedes subir tu CV.",
  "consent": {
    "accepted": true,
    "acceptedAt": "2026-01-03T12:00:00.000Z",
    "version": "1.0",
    "ipAddress": "192.168.1.1",
    "details": {
      "aiProcessing": true,
      "thirdPartySharing": true,
      "dataRetention": true
    }
  },
  "hasConsent": true
}
```

**Respuesta Exitosa (Revocar):**
```json
{
  "success": true,
  "message": "Consentimiento revocado. No podrás subir CVs hasta que lo aceptes nuevamente.",
  "hasConsent": false
}
```

**Errores:**

- **400 Bad Request (falta campo accepted):**
```json
{
  "success": false,
  "error": "El campo 'accepted' es obligatorio y debe ser un booleano"
}
```

- **400 Bad Request (falta aiProcessing):**
```json
{
  "success": false,
  "error": "Debes aceptar el procesamiento con IA para continuar"
}
```

---

### 3. Subir CV (Modificado)

**Endpoint:** `POST /api/cv/upload`

**Requiere:** 
- Token de autenticación
- **Consentimiento previo aceptado**

**Error si no hay consentimiento:**
```json
{
  "success": false,
  "error": "Debes aceptar el consentimiento para el procesamiento de CVs con IA antes de subir tu CV. Por favor, acepta los términos en tu perfil de privacidad."
}
```

Status Code: `403 Forbidden`

## 🔄 Flujo de Usuario

### Flujo Completo

```
1. Usuario se registra/inicia sesión
   ↓
2. Navega a "Subir CV"
   ↓
3. Frontend verifica: GET /api/cv-consent
   ↓
4a. Si hasConsent = true → Mostrar formulario de subida
   ↓
5a. Usuario sube CV → POST /api/cv/upload
   ↓
6a. Backend procesa con IA ✅

4b. Si hasConsent = false → Mostrar modal de consentimiento
   ↓
5b. Usuario acepta términos → POST /api/cv-consent
   ↓
6b. Consentimiento guardado → Mostrar formulario de subida
   ↓
7b. Usuario sube CV → POST /api/cv/upload
   ↓
8b. Backend procesa con IA ✅
```

### Flujo de Revocación

```
1. Usuario va a "Configuración de Privacidad"
   ↓
2. Visualiza su consentimiento actual
   ↓
3. Hace clic en "Revocar Consentimiento"
   ↓
4. Confirma acción
   ↓
5. Frontend envía: POST /api/cv-consent { accepted: false }
   ↓
6. Consentimiento revocado ✅
   ↓
7. Si intenta subir CV → Error 403
```

## 💻 Implementación Frontend

### Ejemplo: Verificar Consentimiento Antes de Subir CV

```javascript
async function checkConsentBeforeUpload() {
  try {
    const response = await fetch('/api/cv-consent', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.hasConsent) {
      // Mostrar modal de consentimiento
      showConsentModal();
    } else {
      // Permitir subir CV
      showUploadForm();
    }
  } catch (error) {
    console.error('Error verificando consentimiento:', error);
  }
}
```

### Ejemplo: Aceptar Consentimiento

```javascript
async function acceptConsent() {
  try {
    const response = await fetch('/api/cv-consent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accepted: true,
        aiProcessing: true,
        thirdPartySharing: true,
        dataRetention: true
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Cerrar modal y mostrar formulario de subida
      closeConsentModal();
      showUploadForm();
    }
  } catch (error) {
    console.error('Error aceptando consentimiento:', error);
  }
}
```

### Ejemplo: Modal de Consentimiento (HTML)

```html
<div id="consent-modal" class="modal">
  <div class="modal-content">
    <h2>Consentimiento para Procesamiento de CV con IA</h2>
    
    <p>
      Para procesar tu CV y extraer información relevante, utilizamos 
      <strong>Google Gemini API</strong>, un servicio de inteligencia artificial 
      de terceros.
    </p>
    
    <h3>¿Qué significa esto?</h3>
    <ul>
      <li>El texto de tu CV se enviará a Google para su análisis</li>
      <li>Google procesará la información según sus términos de servicio</li>
      <li>Los datos extraídos se guardarán en nuestra base de datos</li>
      <li>Puedes revocar este consentimiento en cualquier momento</li>
    </ul>
    
    <h3>Términos específicos:</h3>
    <label>
      <input type="checkbox" id="consent-ai" required>
      Acepto el procesamiento de mi CV con inteligencia artificial
    </label>
    
    <label>
      <input type="checkbox" id="consent-third-party" required>
      Acepto compartir mi información con Google Gemini API
    </label>
    
    <label>
      <input type="checkbox" id="consent-retention" required>
      Acepto la retención de datos procesados en la base de datos
    </label>
    
    <p class="privacy-link">
      Lee nuestra <a href="/privacy-policy" target="_blank">Política de Privacidad</a> 
      y los <a href="https://ai.google.dev/terms" target="_blank">Términos de Google AI</a>
    </p>
    
    <div class="modal-actions">
      <button onclick="acceptConsent()">Aceptar y Continuar</button>
      <button onclick="closeConsentModal()">Cancelar</button>
    </div>
  </div>
</div>
```

## 🔒 Seguridad y Cumplimiento

### Validaciones Implementadas

1. **En el Frontend:**
   - Verificar consentimiento antes de mostrar formulario de subida
   - Mostrar modal de consentimiento si no existe
   - Validar que todos los checkboxes estén marcados

2. **En el Backend:**
   - Controller verifica consentimiento antes de procesar
   - Service verifica consentimiento antes de llamar a IA
   - Doble validación para mayor seguridad

### Trazabilidad

Cada consentimiento registra:
- ✅ Fecha y hora exacta (`acceptedAt`)
- ✅ Versión de términos (`version`)
- ✅ Dirección IP (`ipAddress`)
- ✅ Detalles específicos aceptados

### Revocación

El usuario puede revocar en cualquier momento:
- Se actualiza `accepted: false`
- Se limpian los detalles
- No podrá subir nuevos CVs hasta volver a aceptar

## 📝 Textos Legales Recomendados

### Política de Privacidad (Extracto)

```
**Procesamiento de CVs con Inteligencia Artificial**

Cuando subes un CV a nuestra plataforma, utilizamos Google Gemini API para 
extraer y estructurar automáticamente la información contenida en el documento. 

**¿Qué datos se procesan?**
- Nombre, contacto (email, teléfono)
- Educación y experiencia laboral
- Habilidades técnicas y soft skills
- Idiomas, certificaciones y proyectos

**¿Quién procesa los datos?**
- Procesador primario: [Tu Empresa]
- Subprocesador: Google LLC (Gemini API)

**Base legal:**
- Consentimiento explícito (RGPD Art. 6.1.a)

**Derechos del usuario:**
- Acceso: Puedes ver tu CV en cualquier momento
- Rectificación: Puedes editar la información extraída
- Eliminación: Puedes eliminar tu CV completamente
- Revocación: Puedes revocar el consentimiento en tu perfil

**Contacto:**
- Email: privacy@tuempresa.com
- DPO: dpo@tuempresa.com
```

### Términos de Consentimiento

```
Al aceptar, confirmas que:

1. Has leído y comprendes cómo se procesará tu CV
2. Aceptas el uso de Google Gemini API para analizar tu CV
3. Entiendes que los datos se enviarán a servidores de Google
4. Puedes revocar este consentimiento en cualquier momento desde tu perfil
5. La revocación no afecta el procesamiento ya realizado

Versión de términos: 1.0
Fecha de última actualización: 3 de enero de 2026
```

## 🧪 Testing

### Test Manual

1. **Verificar que nuevo usuario NO tiene consentimiento:**
```bash
curl -X GET http://localhost:3000/api/cv-consent \
  -H "Authorization: Bearer <token>"

# Esperado: hasConsent = false
```

2. **Intentar subir CV sin consentimiento:**
```bash
curl -X POST http://localhost:3000/api/cv/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@cv.pdf"

# Esperado: Error 403 con mensaje sobre consentimiento
```

3. **Aceptar consentimiento:**
```bash
curl -X POST http://localhost:3000/api/cv-consent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "accepted": true,
    "aiProcessing": true,
    "thirdPartySharing": true,
    "dataRetention": true
  }'

# Esperado: success = true, hasConsent = true
```

4. **Subir CV con consentimiento:**
```bash
curl -X POST http://localhost:3000/api/cv/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@cv.pdf"

# Esperado: success = true, CV procesado
```

5. **Revocar consentimiento:**
```bash
curl -X POST http://localhost:3000/api/cv-consent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "accepted": false
  }'

# Esperado: hasConsent = false
```

## 📊 Migración de Usuarios Existentes

Si ya tienes usuarios con CVs subidos **SIN** consentimiento previo:

### Opción 1: Solicitar Consentimiento Retroactivo

```javascript
// Script de migración
const users = await User.find({ 'cvProcessingConsent.accepted': { $ne: true } });

for (const user of users) {
  // Enviar notificación solicitando consentimiento
  await notificationService.create({
    recipientId: user._id,
    title: 'Actualización de Política de Privacidad',
    message: 'Por favor, revisa y acepta los nuevos términos de procesamiento de CVs.',
    actionUrl: '/privacy/cv-consent',
    priority: 'HIGH'
  });
}
```

### Opción 2: Aceptar Automáticamente con Notificación

```javascript
// Solo si los términos previos lo permitían
const users = await User.find({ 'cvProcessingConsent.accepted': { $ne: true } });

for (const user of users) {
  user.cvProcessingConsent = {
    accepted: true,
    acceptedAt: new Date(),
    version: '1.0',
    details: {
      aiProcessing: true,
      thirdPartySharing: true,
      dataRetention: true
    }
  };
  
  await user.save();
  
  // Notificar sobre actualización
  await notificationService.create({
    recipientId: user._id,
    title: 'Términos Actualizados',
    message: 'Hemos actualizado nuestros términos de privacidad. Puedes revisarlos en tu perfil.'
  });
}
```

## 📋 Checklist de Implementación Frontend

- [ ] Crear página/modal de consentimiento
- [ ] Verificar consentimiento antes de mostrar formulario de CV
- [ ] Añadir enlaces a Política de Privacidad
- [ ] Añadir enlaces a Términos de Google AI
- [ ] Implementar sección de "Gestión de Privacidad" en perfil
- [ ] Mostrar estado actual del consentimiento
- [ ] Permitir revocación desde el perfil
- [ ] Mostrar fecha de aceptación
- [ ] Implementar banner/aviso si no hay consentimiento
- [ ] Testing en diferentes navegadores

## 🎓 Conclusión

Este sistema proporciona:

✅ **Cumplimiento legal**: Consentimiento explícito según RGPD
✅ **Trazabilidad**: Registro completo de decisiones del usuario
✅ **Control al usuario**: Puede aceptar/revocar en cualquier momento
✅ **Transparencia**: Usuario informado sobre uso de IA
✅ **Seguridad**: Validación en múltiples capas

**Próximos pasos:**
1. Implementar el frontend del sistema de consentimiento
2. Crear la Política de Privacidad completa
3. Enviar notificaciones a usuarios existentes
4. Documentar en el onboarding de nuevos usuarios

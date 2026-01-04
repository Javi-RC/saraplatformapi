const CV = require('../models/cv.model');
const User = require('../models/user.model');
const cvNotificationHelper = require('./cvNotificationHelper');

/**
 * Servicio de extracción de CVs usando IA
 * Utiliza Gemini API (gratuita) de Google para extraer información estructurada
 * Implementa sistema de fallback automático entre modelos
 */
class AIExtractorService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    // Lista de modelos disponibles ordenados por preferencia
    this.models = [
      'gemini-2.0-flash',           // Principal: 15 RPM, 200 RPD
      'gemini-2.0-flash-lite',      // Fallback 1: 30 RPM, más rápido
      'gemini-2.5-flash',           // Fallback 2: 10 RPM
      'gemini-2.5-flash-lite',      // Fallback 3: 15 RPM
      'gemini-2.5-pro'              // Fallback 4: 2 RPM, más preciso pero lento
    ];
    
    this.currentModelIndex = 0;
    this.modelFailures = {}; // Contador de fallos por modelo
    this.modelCooldown = {}; // Timestamp de cooldown por modelo
  }

  /**
   * Obtiene el endpoint para el modelo actual
   */
  _getApiEndpoint() {
    const model = this.models[this.currentModelIndex];
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  /**
   * Obtiene el nombre del modelo actual
   */
  _getCurrentModel() {
    return this.models[this.currentModelIndex];
  }

  /**
   * Verifica si podemos usar el modelo actual (no está en cooldown)
   */
  _canUseCurrentModel() {
    const model = this._getCurrentModel();
    if (!this.modelCooldown[model]) return true;
    if (Date.now() > this.modelCooldown[model]) {
      delete this.modelCooldown[model];
      return true;
    }
    return false;
  }

  /**
   * Cambia al siguiente modelo disponible
   */
  _switchToNextModel() {
    const previousModel = this._getCurrentModel();
    
    // Marcar cooldown de 60 segundos para el modelo actual
    this.modelCooldown[previousModel] = Date.now() + 60000;
    
    // Incrementar contador de fallos
    this.modelFailures[previousModel] = (this.modelFailures[previousModel] || 0) + 1;
    
    // Buscar siguiente modelo que no esté en cooldown
    const startIndex = this.currentModelIndex;
    do {
      this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
      const nextModel = this._getCurrentModel();
      
      // Si el modelo no está en cooldown o el cooldown expiró, usarlo
      if (!this.modelCooldown[nextModel] || Date.now() > this.modelCooldown[nextModel]) {
        console.log(`🔄 Cambiando de ${previousModel} a ${nextModel}`);
        return true;
      }
      
      // Si dimos la vuelta completa, todos están en cooldown
      if (this.currentModelIndex === startIndex) {
        console.warn('⚠️ Todos los modelos están en cooldown. Esperando...');
        return false;
      }
    } while (true);
  }

  /**
   * Procesa un CV usando IA y guarda la información extraída
   * Requiere que el usuario haya dado consentimiento previo
   */
  async processCV(userId, textContent, originalFileName) {
    try {
      // Validar que tenemos la API key
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY no configurada en variables de entorno');
      }

      // Verificar consentimiento del usuario
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.hasCVProcessingConsent()) {
        throw new Error('CONSENT_REQUIRED: El usuario no ha dado consentimiento para el procesamiento de CVs con IA');
      }

      // Extraer información usando IA
      const extractedData = await this._extractWithAI(textContent);

      // Construir objeto CV con los datos extraídos
      const cvData = {
        userId,
        originalFileName,
        rawText: textContent,
        contact: extractedData.contact || {},
        education: extractedData.education || [],
        experience: extractedData.experience || [],
        skills: extractedData.skills || { technical: [], soft: [] },
        languages: extractedData.languages || [],
        projects: extractedData.projects || [],
        certifications: extractedData.certifications || [],
        achievements: extractedData.achievements || { publications: [], awards: [], hackathons: [] }
      };

      // Debug: mostrar datos extraídos
      console.log('=== DATOS EXTRAÍDOS POR IA ===');
      console.log('Contacto:', cvData.contact?.email ? 'SI' : 'NO');
      console.log('Educación:', cvData.education?.length || 0, 'entradas');
      console.log('Experiencia:', cvData.experience?.length || 0, 'entradas');
      console.log('Skills técnicas:', cvData.skills?.technical?.length || 0);
      console.log('Idiomas:', cvData.languages?.length || 0);
      console.log('Proyectos:', cvData.projects?.length || 0);
      console.log('Certificaciones:', cvData.certifications?.length || 0);

      // Validar y limpiar datos vacíos
      this._cleanEmptyFields(cvData);
      
      // Validar campos obligatorios
      this._validateRequiredFields(cvData);

      // Guardar en base de datos
      const cv = await this._saveOrUpdateCV(userId, cvData);

      // Enviar notificación In-App de CV procesado exitosamente
      // Reutilizamos la variable 'user' que ya obtuvimos al inicio para validar consentimiento
      const userName = user?.name || 'Usuario';
      cvNotificationHelper.notifyCVProcessed(userId, userName, cv._id).catch(err => {
        console.error('Error enviando notificación de CV procesado:', err);
      });

      return cv;
    } catch (error) {
      console.error('Error procesando CV con IA:', error);
      
      // Intentar enviar notificación de fallo
      try {
        const userForNotification = await User.findById(userId);
        if (userForNotification) {
          cvNotificationHelper.notifyCVAnalysisFailed(
            userId, 
            userForNotification.name || 'Usuario', 
            null, 
            'Error al procesar el CV con IA'
          ).catch(err => console.error('Error enviando notificación de fallo:', err));
        }
      } catch (notifyError) {
        console.error('Error al notificar fallo de CV:', notifyError);
      }
      
      throw new Error('ERROR_PROCESSING_CV');
    }
  }

  /**
   * Extrae información del CV usando la API de Gemini
   * Implementa retry automático con cambio de modelo
   */
  async _extractWithAI(textContent) {
    const maxRetries = this.models.length;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Verificar si podemos usar el modelo actual
        if (!this._canUseCurrentModel()) {
          console.log(`⏳ Modelo ${this._getCurrentModel()} en cooldown, cambiando...`);
          if (!this._switchToNextModel()) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          continue;
        }

        const model = this._getCurrentModel();
        const endpoint = this._getApiEndpoint();
        
        console.log(`🤖 Usando modelo: ${model} (intento ${attempt + 1}/${maxRetries})`);
        
        const prompt = this._buildPrompt(textContent);

        const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 1,
              maxOutputTokens: 4096,
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: { message: errorText } };
          }

          if (response.status === 429 || response.status === 503) {
            console.warn(`⚠️ Modelo ${model} alcanzó límite (${response.status}). Cambiando...`);
            this._switchToNextModel();
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          if (response.status === 404) {
            console.warn(`⚠️ Modelo ${model} no encontrado. Cambiando...`);
            this._switchToNextModel();
            continue;
          }

          console.error(`❌ Error de API Gemini con ${model}:`, errorData);
          throw new Error(`Error en API Gemini: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('Respuesta inválida de la API');
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                          aiResponse.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          console.error('No se pudo extraer JSON de la respuesta:', aiResponse);
          throw new Error('No se pudo parsear la respuesta de la IA');
        }

        const jsonText = jsonMatch[1] || jsonMatch[0];
        const extractedData = JSON.parse(jsonText);

        console.log(`✅ Extracción exitosa con ${model}`);
        return extractedData;

      } catch (error) {
        lastError = error;
        console.error(`❌ Error en intento ${attempt + 1} con ${this._getCurrentModel()}:`, error.message);
        
        if (attempt < maxRetries - 1) {
          this._switchToNextModel();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error('❌ Todos los modelos fallaron');
    throw lastError || new Error('No se pudo procesar el CV con ningún modelo disponible');
  }

  /**
   * Construye el prompt para la IA
   */
  _buildPrompt(cvText) {
    return `Eres un experto en análisis y extracción de información de CVs. Tu tarea es extraer TODA la información relevante del siguiente CV y estructurarla en formato JSON.

IMPORTANTE: 
- Extrae TODOS los datos presentes, no inventes información que no esté
- Mantén los nombres originales de empresas, instituciones, tecnologías
- Respeta los formatos de fechas tal como aparecen
- Si un campo no tiene información, usa null o array vacío []

CV A ANALIZAR:
${cvText}

FORMATO DE SALIDA REQUERIDO (JSON):
{
  "contact": {
    "email": "string o null",
    "phones": [{"number": "string", "type": "mobile|home|work"}],
    "links": {
      "linkedin": "string o null",
      "github": "string o null", 
      "portfolio": "string o null",
      "other": []
    },
    "location": {
      "city": "string o null",
      "country": "string o null",
      "fullLocation": "string o null"
    }
  },
  "education": [
    {
      "institution": "string (REQUERIDO)",
      "degree": "string (REQUERIDO)",
      "fieldOfStudy": "string o null",
      "startDate": "string o null",
      "endDate": "string o null",
      "current": false,
      "achievements": ["string"]
    }
  ],
  "experience": [
    {
      "company": "string (REQUERIDO)",
      "position": "string (REQUERIDO)",
      "startDate": "string o null",
      "endDate": "string o null (usar 'Presente' si es actual)",
      "current": true/false,
      "description": "string o null",
      "responsibilities": ["string"],
      "technologies": ["string"]
    }
  ],
  "skills": {
    "technical": [
      {
        "name": "string (REQUERIDO)",
        "normalizedName": "string en minúsculas",
        "level": "básico|intermedio|avanzado|experto o vacío",
        "category": "lenguaje|framework|herramienta|base_datos|cloud|runtime|devops|testing|mobile|frontend|backend|seguridad|ia_ml|otro"
      }
    ],
    "soft": ["string"]
  },
  "languages": [
    {
      "language": "string (REQUERIDO)",
      "level": "nativo|bilingüe|fluido|avanzado|intermedio|básico|A1|A2|B1|B2|C1|C2"
    }
  ],
  "projects": [
    {
      "name": "string (REQUERIDO)",
      "description": "string o null",
      "technologies": ["string"],
      "url": "string o null",
      "repositoryUrl": "string o null",
      "startDate": "string o null",
      "endDate": "string o null"
    }
  ],
  "certifications": [
    {
      "name": "string (REQUERIDO)",
      "issuer": "string o null",
      "dateObtained": "string o null",
      "expirationDate": "string o null",
      "credentialId": "string o null",
      "url": "string o null"
    }
  ],
  "achievements": {
    "publications": [
      {
        "title": "string",
        "type": "artículo|conferencia|libro|blog|otro",
        "date": "string o null",
        "url": "string o null"
      }
    ],
    "awards": [
      {
        "name": "string",
        "issuer": "string o null",
        "date": "string o null",
        "description": "string o null"
      }
    ],
    "hackathons": [
      {
        "name": "string",
        "position": "string o null",
        "date": "string o null",
        "description": "string o null"
      }
    ]
  }
}

INSTRUCCIONES ESPECÍFICAS:
1. Para "skills.technical.category": clasifica cada tecnología en su categoría correcta
2. Para "skills.technical.normalizedName": convierte el nombre a minúsculas sin espacios extra
3. Para "experience.technologies": extrae TODAS las tecnologías mencionadas en cada experiencia
4. Para "languages.level": usa el nivel exacto mencionado o infiere basado en descriptores
5. Si encuentras fechas como "Actual", "Presente", "Present", usa "Presente" y marca current: true

Devuelve ÚNICAMENTE el JSON válido, sin explicaciones adicionales.`;
  }

  async getUserCV(userId) {
    const cv = await CV.findOne({ userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }
    return cv;
  }

  async getAllCVs(filters = {}) {
    const query = {};
    
    if (filters.skills) {
      query['skills.technical.normalizedName'] = { 
        $in: filters.skills.map(s => s.toLowerCase()) 
      };
    }
    
    if (filters.languages) {
      query['languages.language'] = { $in: filters.languages };
    }

    const cvs = await CV.find(query).populate('userId', 'name email');
    return cvs;
  }

  async updateCV(userId, cvId, updates) {
    const cv = await CV.findOne({ _id: cvId, userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }

    Object.assign(cv, updates);
    await cv.save();
    return cv;
  }

  async deleteCV(userId, cvId) {
    const cv = await CV.findOneAndDelete({ _id: cvId, userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }
    return { message: 'CV eliminado exitosamente' };
  }

  async searchCVs(criteria) {
    const query = {};

    if (criteria.skills && criteria.skills.length > 0) {
      query['skills.technical.normalizedName'] = {
        $in: criteria.skills.map(s => s.toLowerCase())
      };
    }

    if (criteria.languages && criteria.languages.length > 0) {
      query['languages.language'] = { $in: criteria.languages };
    }

    if (criteria.minExperience) {
      query['experience'] = {
        $exists: true,
        $not: { $size: 0 }
      };
    }

    const cvs = await CV.find(query).populate('userId', 'name email');
    return cvs;
  }

  _validateRequiredFields(cvData) {
    if (cvData.education && cvData.education.length > 0) {
      cvData.education = cvData.education.filter(edu => 
        edu.institution && edu.degree
      );
      if (cvData.education.length === 0) delete cvData.education;
    }
    
    if (cvData.experience && cvData.experience.length > 0) {
      cvData.experience = cvData.experience.filter(exp => 
        exp.company && exp.position
      );
      if (cvData.experience.length === 0) delete cvData.experience;
    }
    
    if (cvData.projects && cvData.projects.length > 0) {
      cvData.projects = cvData.projects.filter(proj => proj.name);
      if (cvData.projects.length === 0) delete cvData.projects;
    }
    
    if (cvData.certifications && cvData.certifications.length > 0) {
      cvData.certifications = cvData.certifications.filter(cert => cert.name);
      if (cvData.certifications.length === 0) delete cvData.certifications;
    }

    if (cvData.skills?.technical && cvData.skills.technical.length > 0) {
      // Categorías válidas según el modelo CV
      const validCategories = ['lenguaje', 'framework', 'herramienta', 'base_datos', 'cloud', 'runtime', 'devops', 'testing', 'mobile', 'frontend', 'backend', 'seguridad', 'ia_ml', 'otro'];
      
      cvData.skills.technical = cvData.skills.technical
        .filter(skill => skill.name)
        .map(skill => ({
          ...skill,
          // Sanitizar categoría: si no es válida, usar 'otro'
          category: validCategories.includes(skill.category) ? skill.category : 'otro'
        }));
      if (cvData.skills.technical.length === 0) delete cvData.skills.technical;
    }

    if (cvData.languages && cvData.languages.length > 0) {
      cvData.languages = cvData.languages.filter(lang => lang.language && lang.level);
      if (cvData.languages.length === 0) delete cvData.languages;
    }
  }

  _cleanEmptyFields(cvData) {
    if (cvData.education && cvData.education.length === 0) delete cvData.education;
    if (cvData.experience && cvData.experience.length === 0) delete cvData.experience;
    if (cvData.languages && cvData.languages.length === 0) delete cvData.languages;
    if (cvData.projects && cvData.projects.length === 0) delete cvData.projects;
    if (cvData.certifications && cvData.certifications.length === 0) delete cvData.certifications;

    if (cvData.skills) {
      if (cvData.skills.technical && cvData.skills.technical.length === 0) {
        delete cvData.skills.technical;
      }
      if (cvData.skills.soft && cvData.skills.soft.length === 0) {
        delete cvData.skills.soft;
      }
      if (!cvData.skills.technical && !cvData.skills.soft) {
        delete cvData.skills;
      }
    }

    if (cvData.achievements) {
      if (cvData.achievements.publications && cvData.achievements.publications.length === 0) {
        delete cvData.achievements.publications;
      }
      if (cvData.achievements.awards && cvData.achievements.awards.length === 0) {
        delete cvData.achievements.awards;
      }
      if (cvData.achievements.hackathons && cvData.achievements.hackathons.length === 0) {
        delete cvData.achievements.hackathons;
      }
      if (!cvData.achievements.publications && 
          !cvData.achievements.awards && 
          !cvData.achievements.hackathons) {
        delete cvData.achievements;
      }
    }
  }

  async _saveOrUpdateCV(userId, cvData) {
    let cv = await CV.findOne({ userId });

    if (cv) {
      Object.assign(cv, cvData);
      await cv.save();
    } else {
      cv = new CV(cvData);
      await cv.save();
    }

    return cv;
  }
}

module.exports = new AIExtractorService();

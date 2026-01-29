const { cvRepository, userRepository } = require('../repositories');
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
      const user = await userRepository.findById(userId);
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
        const userForNotification = await userRepository.findById(userId);
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
          if (!this._switchToNextModel()) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          continue;
        }

        const model = this._getCurrentModel();
        const endpoint = this._getApiEndpoint();
        
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
              maxOutputTokens: 8192, // Aumentado para CVs largos
              responseMimeType: "application/json" // Forzar respuesta en JSON
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
          throw new Error('Invalid API response');
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                          aiResponse.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          console.error('Could not extract JSON from response:', aiResponse.substring(0, 500));
          throw new Error('Could not parse AI response');
        }

        const jsonText = jsonMatch[1] || jsonMatch[0];
        
        // Intentar limpiar el JSON antes de parsearlo
        let cleanedJson = jsonText.trim();
        
        // Remover comas finales antes de } o ]
        cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
        
        // Validar que el JSON esté completo (debe terminar con } o ])
        if (!cleanedJson.endsWith('}') && !cleanedJson.endsWith(']')) {
          console.error('JSON incompleto detectado. Últimos 100 caracteres:', cleanedJson.substring(cleanedJson.length - 100));
          throw new Error('JSON incompleto en la respuesta de la IA');
        }
        
        let extractedData;
        try {
          extractedData = JSON.parse(cleanedJson);
        } catch (parseError) {
          console.error(`❌ Error parseando JSON: ${parseError.message}`);
          
          // Extraer la posición del error
          const errorPos = parseInt(parseError.message.match(/\d+/)?.[0] || '0');
          const start = Math.max(0, errorPos - 150);
          const end = Math.min(cleanedJson.length, errorPos + 150);
          
          console.error('─'.repeat(60));
          console.error('Fragmento del JSON cerca del error:');
          console.error('─'.repeat(60));
          console.error(cleanedJson.substring(start, end));
          console.error('─'.repeat(60));
          console.error(`Posición del error: ${errorPos}`);
          console.error(`Longitud total: ${cleanedJson.length}`);
          
          throw new Error(`JSON malformado en posición ${errorPos}: ${parseError.message}`);
        }

        // Normalizar valores enum antes de devolver
        this._normalizeEnumValues(extractedData);
        
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
    throw lastError || new Error('Could not process CV with any available model');
  }

  /**
   * Normaliza los valores enum para asegurar que cumplan con el esquema del modelo
   */
  _normalizeEnumValues(data) {
    // Normalizar phone types
    if (data.contact?.phones) {
      const validPhoneTypes = ['mobile', 'home', 'work'];
      data.contact.phones = data.contact.phones.map(phone => {
        const type = phone.type?.toLowerCase();
        if (!validPhoneTypes.includes(type)) {
          phone.type = 'mobile'; // Default
        }
        return phone;
      });
    }

    // Normalizar skills
    if (data.skills?.technical) {
      const validCategories = ['language', 'framework', 'tool', 'database', 'cloud', 'runtime', 'devops', 'testing', 'mobile', 'frontend', 'backend', 'security', 'ai_ml', 'other'];
      const validLevels = ['basic', 'intermediate', 'advanced', 'expert', ''];

      data.skills.technical = data.skills.technical.map(skill => {
        // Normalizar category
        if (!validCategories.includes(skill.category)) {
          skill.category = 'other';
        }
        
        // Normalizar level - si no es válido, dejarlo vacío
        if (skill.level && !validLevels.includes(skill.level)) {
          const levelLower = skill.level.toLowerCase();
          // Intentar mapear variaciones comunes
          if (levelLower.includes('expert') || levelLower.includes('experto')) {
            skill.level = 'expert';
          } else if (levelLower.includes('advanced') || levelLower.includes('avanzado')) {
            skill.level = 'advanced';
          } else if (levelLower.includes('intermediate') || levelLower.includes('intermedio') || levelLower.includes('medio')) {
            skill.level = 'intermediate';
          } else if (levelLower.includes('basic') || levelLower.includes('básico') || levelLower.includes('beginner')) {
            skill.level = 'basic';
          } else {
            skill.level = ''; // Por defecto vacío
          }
        }
        
        // Asegurar que normalizedName esté en minúsculas
        if (skill.name && !skill.normalizedName) {
          skill.normalizedName = skill.name.toLowerCase().trim();
        }
        
        return skill;
      });
    }

    // Normalizar languages
    if (data.languages) {
      const validLevels = ['native', 'bilingual', 'fluent', 'advanced', 'intermediate', 'basic', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      data.languages = data.languages.map(lang => {
        if (!validLevels.includes(lang.level)) {
          const levelLower = lang.level.toLowerCase();
          
          // Mapear variaciones comunes
          if (levelLower.includes('native') || levelLower.includes('nativ') || levelLower.includes('lengua materna') || levelLower.includes('mother tongue')) {
            lang.level = 'native';
          } else if (levelLower.includes('bilingual') || levelLower.includes('bilingü')) {
            lang.level = 'bilingual';
          } else if (levelLower.includes('fluent') || levelLower.includes('fluid') || levelLower.includes('fluency')) {
            lang.level = 'fluent';
          } else if (levelLower.includes('advanced') || levelLower.includes('avanzado')) {
            lang.level = 'advanced';
          } else if (levelLower.includes('intermediate') || levelLower.includes('intermedio') || levelLower.includes('medium')) {
            lang.level = 'intermediate';
          } else if (levelLower.includes('basic') || levelLower.includes('básico') || levelLower.includes('beginner') || levelLower.includes('elementary')) {
            lang.level = 'basic';
          } else {
            // Por defecto intermedio si no se puede mapear
            lang.level = 'intermediate';
          }
        }
        return lang;
      });
    }

    // Normalizar publication types
    if (data.achievements?.publications) {
      const validTypes = ['article', 'conference', 'book', 'blog', 'other'];
      
      data.achievements.publications = data.achievements.publications.map(pub => {
        if (!validTypes.includes(pub.type)) {
          const typeLower = pub.type?.toLowerCase() || '';
          
          if (typeLower.includes('article') || typeLower.includes('paper') || typeLower.includes('journal') || typeLower.includes('artículo')) {
            pub.type = 'article';
          } else if (typeLower.includes('conference') || typeLower.includes('talk') || typeLower.includes('presentation') || typeLower.includes('conferencia')) {
            pub.type = 'conference';
          } else if (typeLower.includes('book') || typeLower.includes('libro') || typeLower.includes('chapter')) {
            pub.type = 'book';
          } else if (typeLower.includes('blog') || typeLower.includes('post')) {
            pub.type = 'blog';
          } else {
            pub.type = 'other';
          }
        }
        return pub;
      });
    }
  }

  /**
   * Construye el prompt para la IA
   */
  _buildPrompt(cvText) {
    return `Eres un experto en análisis y extracción de información de CVs. Tu tarea es extraer TODA la información relevante del siguiente CV y estructurarla en formato JSON válido.

REGLAS CRÍTICAS:
- SOLO devuelve un objeto JSON válido, sin texto adicional
- NO uses comas finales en arrays u objetos
- CIERRA todos los arrays [] y objetos {} correctamente
- Si un campo no tiene información, usa null o array vacío []
- NO inventes información que no esté en el CV
- Mantén los nombres originales tal como aparecen
- IMPORTANTE: Para campos enum, usa EXACTAMENTE los valores especificados

CV A ANALIZAR:
${cvText}

FORMATO DE SALIDA REQUERIDO (respeta EXACTAMENTE esta estructura):
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
        "name": "string (REQUIRED)",
        "normalizedName": "string in lowercase without extra spaces",
        "level": "",
        "category": "language|framework|tool|database|cloud|runtime|devops|testing|mobile|frontend|backend|security|ai_ml|other"
      }
    ],
    "soft": ["string"]
  },
  "languages": [
    {
      "language": "string (REQUIRED)",
      "level": "native|bilingual|fluent|advanced|intermediate|basic|A1|A2|B1|B2|C1|C2"
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
        "type": "article|conference|book|blog|other",
        "date": "string or null",
        "url": "string or null"
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

INSTRUCCIONES ESPECÍFICAS PARA CAMPOS ENUM:

1. phones.type: Usar SOLO "mobile", "home" o "work". Si no está claro, usar "mobile"

2. skills.technical.level: Dejar SIEMPRE vacío (""). El sistema lo clasificará automáticamente

3. skills.technical.category: Use EXACTLY one of these values:
   - "language": JavaScript, Python, Java, C++, TypeScript, Go, Rust, PHP, Ruby, etc.
   - "framework": React, Angular, Vue, Django, Flask, Spring, Express, Laravel, .NET, etc.
   - "tool": Git, Docker, Postman, VS Code, IntelliJ, Jira, Figma, etc.
   - "database": MySQL, PostgreSQL, MongoDB, Redis, Oracle, SQL Server, etc.
   - "cloud": AWS, Azure, GCP, Heroku, Vercel, Netlify, DigitalOcean, etc.
   - "runtime": Node.js, Deno, Bun, etc.
   - "devops": Kubernetes, Jenkins, GitHub Actions, GitLab CI, Terraform, Ansible, etc.
   - "testing": Jest, Mocha, Pytest, JUnit, Selenium, Cypress, etc.
   - "mobile": React Native, Flutter, Swift, Kotlin, Xamarin, etc.
   - "frontend": HTML, CSS, Sass, Bootstrap, Tailwind, Material-UI, etc.
   - "backend": REST, GraphQL, gRPC, Microservices, etc.
   - "security": OAuth, JWT, SSL/TLS, Penetration Testing, etc.
   - "ai_ml": TensorFlow, PyTorch, scikit-learn, OpenAI, Hugging Face, etc.
   - "other": For any technology that doesn't fit the above categories

4. languages.level: Use EXACTLY one of these values:
   - If mentions: "Native", "Nativo", "Mother tongue" → use "native"
   - If mentions: "Bilingual", "Bilingüe" → use "bilingual"
   - If mentions: "Fluent", "Fluido", "Fluency" → use "fluent"
   - If mentions: "Advanced", "Avanzado" → use "advanced"
   - If mentions: "Intermediate", "Intermedio", "Medium" → use "intermediate"
   - If mentions: "Basic", "Básico", "Beginner" → use "basic"
   - If mentions CEFR levels: "A1", "A2", "B1", "B2", "C1", "C2" → use as is

5. achievements.publications.type: Use EXACTLY one of these:
   - "article": For papers, scientific articles, journals
   - "conference": For conference presentations, talks
   - "book": For books, ebooks, book chapters
   - "blog": For blog posts, web articles
   - "other": For any other type of publication

VALIDACIÓN FINAL:
- Asegúrate de que TODOS los arrays y objetos estén cerrados
- NO uses comas después del último elemento de un array u objeto
- Verifica que el JSON sea COMPLETO y VÁLIDO antes de responder
- Verifica que TODOS los campos enum usen los valores EXACTOS especificados

Devuelve ÚNICAMENTE el JSON válido sin bloques de código markdown ni explicaciones.`;
  }

  async getUserCV(userId) {
    const cv = await cvRepository.findByUser(userId);
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }
    return cv;
  }

  async getAllCVs(filters = {}, user = null) {
    const query = {};
    
    // Si el usuario es org_admin, solo mostrar CVs de su organización
    if (user && user.role === 'org_admin' && user.organization) {
      query.organization = user.organization;
    }
    
    if (filters.skills) {
      query['skills.technical.normalizedName'] = { 
        $in: filters.skills.map(s => s.toLowerCase()) 
      };
    }
    
    if (filters.languages) {
      query['languages.language'] = { $in: filters.languages };
    }

    const cvs = await cvRepository.find(query, {
      populate: [{ path: 'userId', select: 'name email' }]
    });
    return cvs;
  }

  async updateCV(userId, cvId, updates) {
    const cv = await cvRepository.findOne({ _id: cvId, userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }

    Object.assign(cv, updates);
    await cv.save();
    return cv;
  }

  async deleteCV(userId, cvId) {
    const cv = await cvRepository.deleteOne({ _id: cvId, userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }
    return { message: 'CV eliminado exitosamente' };
  }

  async searchCVs(criteria, user = null) {
    const query = {};

    // Si el usuario es org_admin, solo buscar en CVs de su organización
    if (user && user.role === 'org_admin' && user.organization) {
      query.organization = user.organization;
    }

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

    const cvs = await cvRepository.find(query, {
      populate: [{ path: 'userId', select: 'name email' }]
    });
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
      const validCategories = ['language', 'framework', 'tool', 'database', 'cloud', 'runtime', 'devops', 'testing', 'mobile', 'frontend', 'backend', 'security', 'ai_ml', 'other'];
      const validLevels = ['basic', 'intermediate', 'advanced', 'expert', ''];
      
      cvData.skills.technical = cvData.skills.technical
        .filter(skill => skill.name)
        .map(skill => {
          // Normalizar category: si no es válida, usar 'other'
          if (!validCategories.includes(skill.category)) {
            console.warn(`⚠️ Categoría inválida "${skill.category}" para skill "${skill.name}". Usando "other".`);
            skill.category = 'other';
          }
          
          // Normalizar level: si no es válido, dejarlo vacío
          if (skill.level && !validLevels.includes(skill.level)) {
            console.warn(`⚠️ Level inválido "${skill.level}" para skill "${skill.name}". Dejando vacío.`);
            skill.level = '';
          }
          
          // Asegurar normalizedName
          if (!skill.normalizedName && skill.name) {
            skill.normalizedName = skill.name.toLowerCase().trim();
          }
          
          return skill;
        });
      
      if (cvData.skills.technical.length === 0) delete cvData.skills.technical;
    }

    if (cvData.languages && cvData.languages.length > 0) {
      const validLevels = ['native', 'bilingual', 'fluent', 'advanced', 'intermediate', 'basic', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      cvData.languages = cvData.languages
        .filter(lang => lang.language && lang.level)
        .map(lang => {
          // Validar que el level sea válido
          if (!validLevels.includes(lang.level)) {
            console.warn(`⚠️ Level de idioma inválido "${lang.level}" para "${lang.language}". Usando "intermediate".`);
            lang.level = 'intermediate';
          }
          return lang;
        });
      
      if (cvData.languages.length === 0) delete cvData.languages;
    }

    // Validar contact.phones type
    if (cvData.contact?.phones && cvData.contact.phones.length > 0) {
      const validPhoneTypes = ['mobile', 'home', 'work'];
      
      cvData.contact.phones = cvData.contact.phones.map(phone => {
        if (!validPhoneTypes.includes(phone.type)) {
          console.warn(`⚠️ Phone type inválido "${phone.type}". Usando "mobile".`);
          phone.type = 'mobile';
        }
        return phone;
      });
    }

    // Validar publication types
    if (cvData.achievements?.publications && cvData.achievements.publications.length > 0) {
      const validTypes = ['article', 'conference', 'book', 'blog', 'other'];
      
      cvData.achievements.publications = cvData.achievements.publications.map(pub => {
        if (!validTypes.includes(pub.type)) {
          console.warn(`⚠️ Publication type inválido "${pub.type}" para "${pub.title}". Usando "other".`);
          pub.type = 'other';
        }
        return pub;
      });
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
    let cv = await cvRepository.findByUser(userId);

    if (cv) {
      Object.assign(cv, cvData);
      await cv.save();
    } else {
      cv = await cvRepository.create(cvData);
    }

    return cv;
  }
}

module.exports = new AIExtractorService();

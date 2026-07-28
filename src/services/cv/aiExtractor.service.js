const { cvRepository, userRepository } = require('../../repositories');
const cvNotificationHelper = require('../notification/helpers/cv.helper');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../config/roles');

function _createOpenAICompatibleProvider(baseUrl) {
  return {
    baseUrl,
    headers(apiKey) {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
    },
    buildBody(model, prompt) {
      return {
        model,
        messages: [
          { role: 'system', content: 'You are a CV analysis expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: 'json_object' }
      };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content;
    }
  };
}

class AIExtractorService {
  constructor() {
    this.providers = {
      gemini: {
        _endpoint(model) {
          return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        },
        headers(apiKey) {
          return { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
        },
        buildBody(_model, prompt) {
          return {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 1,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          };
        },
        parseResponse(data) {
          return data.candidates?.[0]?.content?.parts?.[0]?.text;
        }
      },
      groq: _createOpenAICompatibleProvider('https://api.groq.com/openai/v1/chat/completions'),
      mistral: _createOpenAICompatibleProvider('https://api.mistral.ai/v1/chat/completions')
    };

    this.models = [
      // Gemini (free, no card)
      { name: 'gemini-2.0-flash', provider: 'gemini', keyEnv: 'GEMINI_API_KEY' },
      { name: 'gemini-2.5-flash-lite', provider: 'gemini', keyEnv: 'GEMINI_API_KEY' },
      { name: 'gemini-2.0-flash-lite', provider: 'gemini', keyEnv: 'GEMINI_API_KEY' },
      { name: 'gemini-2.5-flash', provider: 'gemini', keyEnv: 'GEMINI_API_KEY' },
      { name: 'gemini-2.5-pro', provider: 'gemini', keyEnv: 'GEMINI_API_KEY' },
      // Groq (free, no card)
      { name: 'llama-3.3-70b-versatile', provider: 'groq', keyEnv: 'GROQ_API_KEY' },
      { name: 'llama-3.1-8b-instant', provider: 'groq', keyEnv: 'GROQ_API_KEY' },
      { name: 'mixtral-8x7b-32768', provider: 'groq', keyEnv: 'GROQ_API_KEY' },
      // Mistral (free, no card)
      { name: 'open-mistral-nemo', provider: 'mistral', keyEnv: 'MISTRAL_API_KEY' },
      { name: 'mistral-tiny-latest', provider: 'mistral', keyEnv: 'MISTRAL_API_KEY' }
    ];

    this.currentModelIndex = 0;
    this.modelFailures = {};
    this.modelCooldown = {};
  }

  _getCurrentModel() {
    return this.models[this.currentModelIndex];
  }

  _getProvider() {
    return this.providers[this._getCurrentModel().provider];
  }

  _getApiEndpoint() {
    const provider = this._getProvider();
    const model = this._getCurrentModel();
    if (provider._endpoint) return provider._endpoint(model.name);
    return provider.baseUrl;
  }

  _canUseCurrentModel() {
    const model = this._getCurrentModel();
    if (!process.env[model.keyEnv]) return false;
    if (!this.modelCooldown[model.name]) return true;
    if (Date.now() > this.modelCooldown[model.name]) {
      delete this.modelCooldown[model.name];
      return true;
    }
    return false;
  }

  _switchToNextModel() {
    const model = this._getCurrentModel();
    this.modelCooldown[model.name] = Date.now() + 60000;
    this.modelFailures[model.name] = (this.modelFailures[model.name] || 0) + 1;

    const startIndex = this.currentModelIndex;
    do {
      this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
      const nextModel = this._getCurrentModel();
      if (!process.env[nextModel.keyEnv]) continue;
      if (!this.modelCooldown[nextModel.name] || Date.now() > this.modelCooldown[nextModel.name]) {
        return true;
      }
      if (this.currentModelIndex === startIndex) {
        return false;
      }
    } while (true);
  }

  async processCV(userId, textContent, originalFileName) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('USER_NOT_FOUND', 'User not found');
      }
      if (!user.hasCVProcessingConsent()) {
        throw AppError.badRequest('CONSENT_REQUIRED', 'User has not given consent for AI CV processing');
      }

      const sanitizedText = this._sanitizeText(textContent);
      const extractedData = await this._extractWithAI(sanitizedText);

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

      this._cleanEmptyFields(cvData);
      this._validateRequiredFields(cvData);

      const cv = await this._saveOrUpdateCV(userId, cvData);

      const userName = user?.name || 'User';
      cvNotificationHelper.notifyCVProcessed(userId, userName, cv._id).catch(err => {
        console.error('Error sending CV processed notification:', err);
      });

      return cv;
    } catch (error) {
      console.error('Error processing CV with AI:', error);
      try {
        const userForNotification = await userRepository.findById(userId);
        if (userForNotification) {
          cvNotificationHelper.notifyCVAnalysisFailed(
            userId,
            userForNotification.name || 'User',
            null,
            'Error processing CV with AI'
          ).catch(err => console.error('Error sending failure notification:', err));
        }
      } catch (notifyError) {
        console.error('Error notifying CV failure:', notifyError);
      }
      throw AppError.badRequest('ERROR_PROCESSING_CV', 'ERROR_PROCESSING_CV');
    }
  }

  async _extractWithAI(textContent) {
    const maxRetries = this.models.length;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this._canUseCurrentModel()) {
          if (!this._switchToNextModel()) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          continue;
        }

        const model = this._getCurrentModel();
        const provider = this._getProvider();
        const endpoint = this._getApiEndpoint();
        const apiKey = process.env[model.keyEnv];
        const prompt = this._buildPrompt(textContent);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: provider.headers(apiKey),
          body: JSON.stringify(provider.buildBody(model.name, prompt))
        });

        if (!response.ok) {
          const errorText = await response.text();

          if (response.status === 429 || response.status === 503) {
            console.warn(`Model ${model.name} reached limit (${response.status}). Switching...`);
            this._switchToNextModel();
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

          if (response.status === 404) {
            console.warn(`Model ${model.name} not found. Switching...`);
            this._switchToNextModel();
            continue;
          }

          console.error(`API error with ${model.name}: status ${response.status}`);
          throw AppError.badRequest('AI_API_ERROR', `API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = provider.parseResponse(data);

        if (!aiResponse) {
          throw AppError.badRequest('INVALID_AI_RESPONSE', 'Invalid API response');
        }

        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                          aiResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          console.error('Could not extract JSON from response:', aiResponse.substring(0, 500));
          throw AppError.badRequest('AI_RESPONSE_UNPARSEABLE', 'Could not parse AI response');
        }

        const jsonText = jsonMatch[1] || jsonMatch[0];
        let cleanedJson = jsonText.trim();
        cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');

        if (!cleanedJson.endsWith('}') && !cleanedJson.endsWith(']')) {
          console.error('Incomplete JSON detected. Last 100 characters:', cleanedJson.substring(cleanedJson.length - 100));
          throw AppError.badRequest('INCOMPLETE_JSON', 'Incomplete JSON in AI response');
        }

        let extractedData;
        try {
          extractedData = JSON.parse(cleanedJson);
        } catch (parseError) {
          const errorPos = parseInt(parseError.message.match(/\d+/)?.[0] || '0', 10);
          const start = Math.max(0, errorPos - 150);
          const end = Math.min(cleanedJson.length, errorPos + 150);
          console.error('-'.repeat(60));
          console.error('JSON fragment near the error:');
          console.error('-'.repeat(60));
          console.error(cleanedJson.substring(start, end));
          console.error('-'.repeat(60));
          throw AppError.badRequest('MALFORMED_JSON', `Malformed JSON at position ${errorPos}: ${parseError.message}`);
        }

        this._normalizeEnumValues(extractedData);
        return extractedData;

      } catch (error) {
        lastError = error;
        console.error('Error on attempt %d with %s:', attempt + 1, this._getCurrentModel().name, error.message);
        if (attempt < maxRetries - 1) {
          this._switchToNextModel();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error('All models failed');
    throw lastError || AppError.badRequest('AI_PROCESSING_FAILED', 'Could not process curriculum with any available model');
  }

  _normalizeEnumValues(data) {
    if (data.contact?.phones) {
      const validPhoneTypes = ['mobile', 'home', 'work'];
      data.contact.phones = data.contact.phones.map(phone => {
        const type = phone.type?.toLowerCase();
        if (!validPhoneTypes.includes(type)) {
          phone.type = 'mobile';
        }
        return phone;
      });
    }

    if (data.skills?.technical) {
      const validCategories = ['language', 'framework', 'tool', 'database', 'cloud', 'runtime', 'devops', 'testing', 'mobile', 'frontend', 'backend', 'security', 'ai_ml', 'other'];
      const validLevels = ['basic', 'intermediate', 'advanced', 'expert', ''];

      data.skills.technical = data.skills.technical.map(skill => {
        if (!validCategories.includes(skill.category)) {
          skill.category = 'other';
        }
        if (skill.level && !validLevels.includes(skill.level)) {
          const levelLower = skill.level.toLowerCase();
          if (levelLower.includes('expert') || levelLower.includes('experto')) {
            skill.level = 'expert';
          } else if (levelLower.includes('advanced') || levelLower.includes('avanzado')) {
            skill.level = 'advanced';
          } else if (levelLower.includes('intermediate') || levelLower.includes('intermedio') || levelLower.includes('medio')) {
            skill.level = 'intermediate';
          } else if (levelLower.includes('basic') || levelLower.includes('básico') || levelLower.includes('beginner')) {
            skill.level = 'basic';
          } else {
            skill.level = '';
          }
        }
        if (skill.name && !skill.normalizedName) {
          skill.normalizedName = skill.name.toLowerCase().trim();
        }
        return skill;
      });
    }

    if (data.languages) {
      const validLevels = ['native', 'bilingual', 'fluent', 'advanced', 'intermediate', 'basic', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      data.languages = data.languages.map(lang => {
        if (!validLevels.includes(lang.level)) {
          const levelLower = lang.level.toLowerCase();
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
            lang.level = 'intermediate';
          }
        }
        return lang;
      });
    }

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

  _sanitizeText(text) {
    const patterns = [
      { regex: /[\w.-]+@[\w.-]+\.\w+/g, replacement: '[EMAIL]' },
      { regex: /(\+34)?[ -]?\d{3}[ -]?\d{3}[ -]?\d{3}/g, replacement: '[PHONE]' },
      { regex: /\b\d{9}\b/g, replacement: '[PHONE]' },
      { regex: /\b\d{5}\b/g, replacement: '[ZIP]' },
      { regex: /\bhttps?:\/\/\S+\b/g, replacement: '[URL]' },
      { regex: /\b(?:Calle|C\/|Avda|Avenida|Plaza|Paseo|Carrer|Rúa|Street|Road|Ave|Blvd|Drive|Lane|Way)\s[^,\n]*(?:,|\n|$)/gi, replacement: '[ADDRESS]' },
      { regex: /\b(?:\d{1,3}\s)?(?:Calle|C\/|Avda|Avenida|Plaza|Paseo|Carrer|Rúa|Street|Road|Ave|Blvd|Drive|Lane|Way)\b/gi, replacement: '[ADDRESS]' },
      { regex: /\b\d{8}[A-Z]\b/g, replacement: '[DNI]' },
      { regex: /\b(?:DNI|NIF|NIE)\s*[:]\s*\S+/gi, replacement: '[ID]' },
    ];
    let sanitized = text;
    for (const { regex, replacement } of patterns) {
      sanitized = sanitized.replace(regex, replacement);
    }
    sanitized = sanitized.replace(/[EMAIL]\s*[EMAIL]/g, '[EMAIL]');
    sanitized = sanitized.replace(/[PHONE]\s*[PHONE]/g, '[PHONE]');
    let prev;
    do {
      prev = sanitized;
      sanitized = sanitized.replace(/\[ADDRESS\],?\s*\[ADDRESS\]/g, '[ADDRESS]');
    } while (sanitized !== prev);
    return sanitized;
  }

  _buildPrompt(cvText) {
    return `You are an expert in CV analysis and information extraction. Your task is to extract ALL relevant information from the following CV and structure it in valid JSON format.

CRITICAL RULES:
- ONLY return a valid JSON object, no additional text
- DO NOT use trailing commas in arrays or objects
- CLOSE all arrays [] and objects {} correctly
- If a field has no information, use null or empty array []
- DO NOT invent information that is not in the CV
- Keep original names exactly as they appear
- IMPORTANT: For enum fields, use EXACTLY the specified values

CV TO ANALYZE:
${cvText}

REQUIRED OUTPUT FORMAT (follow this structure EXACTLY):
{
  "contact": {
    "email": "string or null",
    "phones": [{"number": "string", "type": "mobile|home|work"}],
    "links": {
      "linkedin": "string or null",
      "github": "string or null",
      "portfolio": "string or null",
      "other": []
    },
    "location": {
      "city": "string or null",
      "country": "string or null",
      "fullLocation": "string or null"
    }
  },
  "education": [
    {
      "institution": "string (REQUIRED)",
      "degree": "string (REQUIRED)",
      "fieldOfStudy": "string or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "current": false,
      "achievements": ["string"]
    }
  ],
  "experience": [
    {
      "company": "string (REQUIRED)",
      "position": "string (REQUIRED)",
      "startDate": "string or null",
      "endDate": "string or null (use 'Present' if current)",
      "current": true/false,
      "description": "string or null",
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
      "name": "string (REQUIRED)",
      "description": "string or null",
      "technologies": ["string"],
      "url": "string or null",
      "repositoryUrl": "string or null",
      "startDate": "string or null",
      "endDate": "string or null"
    }
  ],
  "certifications": [
    {
      "name": "string (REQUIRED)",
      "issuer": "string or null",
      "dateObtained": "string or null",
      "expirationDate": "string or null",
      "credentialId": "string or null",
      "url": "string or null"
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
        "issuer": "string or null",
        "date": "string or null",
        "description": "string or null"
      }
    ],
    "hackathons": [
      {
        "name": "string",
        "position": "string or null",
        "date": "string or null",
        "description": "string or null"
      }
    ]
  }
}

SPECIFIC INSTRUCTIONS FOR ENUM FIELDS:

1. phones.type: Use ONLY "mobile", "home" or "work". If not clear, use "mobile"

2. skills.technical.level: ALWAYS leave empty (""). The system will classify it automatically

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
   - If mentions: "Native", "Nativo", "Mother tongue" -> use "native"
   - If mentions: "Bilingual", "Bilingüe" -> use "bilingual"
   - If mentions: "Fluent", "Fluido", "Fluency" -> use "fluent"
   - If mentions: "Advanced", "Avanzado" -> use "advanced"
   - If mentions: "Intermediate", "Intermedio", "Medium" -> use "intermediate"
   - If mentions: "Basic", "Básico", "Beginner" -> use "basic"
   - If mentions CEFR levels: "A1", "A2", "B1", "B2", "C1", "C2" -> use as is

5. achievements.publications.type: Use EXACTLY one of these:
   - "article": For papers, scientific articles, journals
   - "conference": For conference presentations, talks
   - "book": For books, ebooks, book chapters
   - "blog": For blog posts, web articles
   - "other": For any other type of publication

FINAL VALIDATION:
- Make sure ALL arrays and objects are closed
- DO NOT use commas after the last element of an array or object
- Verify that JSON is COMPLETE and VALID before responding
- Verify that ALL enum fields use the EXACT specified values

Return ONLY the valid JSON without markdown code blocks or explanations.`;
  }

  async getUserCV(userId) {
    const cv = await cvRepository.findByUser(userId);
    if (!cv) {
      throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
    }
    return cv;
  }

  async getAllCVs(filters = {}, user = null) {
    const query = {};
    if (user && user.role === ROLES.ORG_ADMIN && user.organization) {
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
      throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
    }
    const allowedFields = [
      'contact', 'education', 'experience', 'skills', 'languages',
      'projects', 'certifications', 'achievements', 'availability',
      'availabilityDetails', 'crossCulturalExperience'
    ];
    const filteredUpdates = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }
    Object.assign(cv, filteredUpdates);
    await cv.save();
    return cv;
  }

  async deleteCV(userId, cvId) {
    const cv = await cvRepository.deleteOne({ _id: cvId, userId });
    if (!cv) {
      throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
    }
    return { message: 'CV deleted successfully' };
  }

  async searchCVs(criteria, user = null) {
    const query = {};
    if (user && user.role === ROLES.ORG_ADMIN && user.organization) {
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
          if (!validCategories.includes(skill.category)) {
            console.warn(`Invalid category "${skill.category}" for skill "${skill.name}". Using "other".`);
            skill.category = 'other';
          }
          if (skill.level && !validLevels.includes(skill.level)) {
            console.warn(`Invalid level "${skill.level}" for skill "${skill.name}". Leaving empty.`);
            skill.level = '';
          }
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
          if (!validLevels.includes(lang.level)) {
            console.warn(`Invalid language level "${lang.level}" for "${lang.language}". Using "intermediate".`);
            lang.level = 'intermediate';
          }
          return lang;
        });
      if (cvData.languages.length === 0) delete cvData.languages;
    }
    if (cvData.contact?.phones && cvData.contact.phones.length > 0) {
      const validPhoneTypes = ['mobile', 'home', 'work'];
      cvData.contact.phones = cvData.contact.phones.map(phone => {
        if (!validPhoneTypes.includes(phone.type)) {
          console.warn(`Invalid phone type "${phone.type}". Using "mobile".`);
          phone.type = 'mobile';
        }
        return phone;
      });
    }
    if (cvData.achievements?.publications && cvData.achievements.publications.length > 0) {
      const validTypes = ['article', 'conference', 'book', 'blog', 'other'];
      cvData.achievements.publications = cvData.achievements.publications.map(pub => {
        if (!validTypes.includes(pub.type)) {
          console.warn(`Invalid publication type "${pub.type}" for "${pub.title}". Using "other".`);
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

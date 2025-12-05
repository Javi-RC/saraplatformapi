/**
 * Utilidades para extracción de información de CVs
 * Contiene funciones para extraer y normalizar datos usando regex
 */

class CVUtils {
  /**
   * Extrae emails del texto usando regex
   */
  extractEmails(text) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailRegex) || [];
    return [...new Set(emails.map(email => email.toLowerCase().trim()))];
  }

  /**
   * Extrae números de teléfono del texto
   * Soporta formatos internacionales con código de país
   */
  extractPhones(text) {
    // Patrones para teléfonos con código de país y varios formatos
    const phonePatterns = [
      /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
      /\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}/g,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g
    ];

    const phones = new Set();
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(phone => phones.add(phone.trim()));
    });

    return Array.from(phones);
  }

  /**
   * Extrae URLs del texto
   */
  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = text.match(urlRegex) || [];
    return [...new Set(urls)];
  }

  /**
   * Extrae URLs específicas de LinkedIn
   */
  extractLinkedIn(text) {
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
    const matches = text.match(linkedinRegex) || [];
    return matches[0] || null;
  }

  /**
   * Extrae URLs específicas de GitHub
   */
  extractGitHub(text) {
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;
    const matches = text.match(githubRegex) || [];
    return matches[0] || null;
  }

  /**
   * Extrae fechas en varios formatos
   * Soporta: YYYY, MM/YYYY, Mes YYYY, YYYY-MM, presente, actualidad
   */
  extractDates(text) {
    const datePatterns = [
      /\b(20\d{2}|19\d{2})\b/g, // YYYY
      /\b(0?[1-9]|1[0-2])\/(20\d{2}|19\d{2})\b/g, // MM/YYYY
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(20\d{2}|19\d{2})\b/gi, // Mes YYYY
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(20\d{2}|19\d{2})\b/gi, // Mon YYYY
      /\b(20\d{2}|19\d{2})-(0?[1-9]|1[0-2])\b/g // YYYY-MM
    ];

    const dates = new Set();
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(date => dates.add(date.trim()));
    });

    // Detectar palabras clave para "presente"
    const currentKeywords = ['presente', 'actualidad', 'actual', 'present', 'current'];
    const textLower = text.toLowerCase();
    currentKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        dates.add('Presente');
      }
    });

    return Array.from(dates);
  }

  /**
   * Normaliza texto: elimina tabulaciones, espacios dobles, y caracteres especiales
   */
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .replace(/\t/g, ' ')            // Reemplazar tabs por espacios
      .replace(/\r\n/g, '\n')         // Normalizar saltos de línea
      .replace(/\r/g, '\n')           // Normalizar saltos de línea
      .replace(/[ \t]{2,}/g, ' ')      // Reemplazar múltiples espacios (no saltos de línea)
      .replace(/\n{3,}/g, '\n\n')     // Mantener al menos un salto en secciones
      .replace(/[^\S\n]+$/gm, '')     // Eliminar espacios al final de líneas
      .trim();
  }

  /**
   * Divide el texto por secciones basándose en encabezados comunes
   */
  splitIntoSections(text, sectionKeywords) {
    const normalizedText = this.normalizeText(text);
    const lines = normalizedText.split('\n');
    const sections = {};
    let currentSection = 'other';
    let currentContent = [];

    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase().trim();
      const lineUpper = line.toUpperCase().trim();
      let foundSection = false;

      // Buscar si la línea es un encabezado de sección
      if (line.trim().length > 0) {
        // Detectar si es una línea de título
        // Debe ser corta (max 8 palabras) Y cumplir al menos uno de estos criterios:
        // 1. Todo en mayúsculas
        // 2. Empieza con mayúscula y no tiene puntos/comas al final
        const words = line.trim().split(/\s+/);
        const isShort = words.length <= 8;
        const isUppercase = lineUpper === line.trim();
        const startsCapital = /^[A-ZÁÉÍÓÚÑ]/.test(line.trim());
        const noPunctuation = !line.trim().endsWith('.') && !line.trim().endsWith(',');
        const hasColon = line.trim().endsWith(':');
        
        const looksLikeTitle = isShort && (
          isUppercase || // Todo en mayúsculas como "EDUCACIÓN"
          (startsCapital && noPunctuation && words.length <= 5) || // Título corto capitalizado
          hasColon // Termina con dos puntos como "Habilidades:"
        );

        if (looksLikeTitle) {
          for (const [sectionKey, keywords] of Object.entries(sectionKeywords)) {
            const matchesKeyword = keywords.some(keyword => {
              const keywordLower = keyword.toLowerCase();
              const keywordWords = keywordLower.split(' ');
              
              // Coincidencia exacta
              if (lineLower === keywordLower) return true;
              
              // Contiene el keyword
              if (lineLower.includes(keywordLower)) return true;
              
              // Contiene todas las palabras del keyword
              if (keywordWords.every(word => lineLower.includes(word))) return true;
              
              return false;
            });
            
            if (matchesKeyword) {
              // Guardar sección anterior
              if (currentContent.length > 0) {
                if (!sections[currentSection]) sections[currentSection] = [];
                sections[currentSection].push(currentContent.join('\n'));
              }
              // Iniciar nueva sección
              currentSection = sectionKey;
              currentContent = [];
              foundSection = true;
              break;
            }
          }
        }
      }

      // Si no es un encabezado, agregar al contenido actual
      if (!foundSection && line.trim()) {
        currentContent.push(line);
      }
    });

    // Guardar última sección
    if (currentContent.length > 0) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(currentContent.join('\n'));
    }

    return sections;
  }

  /**
   * Limpia caracteres especiales innecesarios
   */
  cleanSpecialCharacters(text) {
    if (!text) return '';
    
    return text
      .replace(/[•●○◆◇■□▪▫]/g, '')    // Bullets
      .replace(/[─┬┼┴├┤┐┘└┌]/g, '')    // Caracteres de tablas
      .replace(/\u00A0/g, ' ')          // Non-breaking space
      .trim();
  }

  /**
   * Valida que un campo tenga al menos un valor
   */
  validateField(field) {
    if (Array.isArray(field)) {
      return field.length > 0;
    }
    if (typeof field === 'object' && field !== null) {
      return Object.values(field).some(val => 
        val !== null && 
        val !== undefined && 
        val !== '' && 
        (Array.isArray(val) ? val.length > 0 : true)
      );
    }
    return field !== null && field !== undefined && field !== '';
  }

  /**
   * Extrae ubicación (ciudad/país) comparando con diccionario
   */
  extractLocation(text, locationDictionary) {
    const textLower = text.toLowerCase();
    const locations = [];

    // Buscar ciudades
    if (locationDictionary.cities) {
      locationDictionary.cities.forEach(city => {
        if (textLower.includes(city.toLowerCase())) {
          locations.push({ type: 'city', value: city });
        }
      });
    }

    // Buscar países
    if (locationDictionary.countries) {
      locationDictionary.countries.forEach(country => {
        if (textLower.includes(country.toLowerCase())) {
          locations.push({ type: 'country', value: country });
        }
      });
    }

    return locations;
  }

  /**
   * Normaliza nombres de tecnologías
   */
  normalizeTechnology(tech, technologyDictionary) {
    const techLower = tech.toLowerCase().trim();
    
    // Buscar en diccionario de normalizaciones
    if (technologyDictionary && technologyDictionary[techLower]) {
      return technologyDictionary[techLower];
    }

    return tech.trim();
  }

  /**
   * Extrae líneas que probablemente sean descripciones de responsabilidades
   * (líneas largas o que empiezan con bullets)
   */
  extractResponsibilities(text) {
    const lines = text.split('\n');
    const responsibilities = [];

    lines.forEach(line => {
      const cleaned = line.trim();
      // Líneas largas (más de 30 caracteres) o que empiezan con bullets comunes
      if (cleaned.length > 30 || /^[-•●○◆▪]/.test(cleaned)) {
        responsibilities.push(this.cleanSpecialCharacters(cleaned));
      }
    });

    return responsibilities;
  }
}

module.exports = new CVUtils();

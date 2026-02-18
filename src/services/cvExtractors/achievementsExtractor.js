const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de logros, publicaciones y premios
 * Responsabilidad única: extraer achievements del currículo
 */
class AchievementsExtractor {
  /**
   * Extrae información de logros del texto de la sección correspondiente
   */
  extract(sectionText) {
    if (!sectionText || sectionText.trim().length === 0) {
      return {
        publications: [],
        awards: [],
        hackathons: []
      };
    }

    const achievements = {
      publications: [],
      awards: [],
      hackathons: []
    };

    const normalizedText = cvUtils.normalizeText(sectionText);
    const textLower = normalizedText.toLowerCase();

    // Detectar tipo de contenido
    if (this._containsPublicationKeywords(textLower)) {
      achievements.publications = this._extractPublications(normalizedText);
    }

    if (this._containsAwardKeywords(textLower)) {
      achievements.awards = this._extractAwards(normalizedText);
    }

    if (this._containsHackathonKeywords(textLower)) {
      achievements.hackathons = this._extractHackathons(normalizedText);
    }

    // Si no se detectó tipo específico, tratar como premios generales
    if (achievements.publications.length === 0 && 
        achievements.awards.length === 0 && 
        achievements.hackathons.length === 0) {
      achievements.awards = this._extractGenericAchievements(normalizedText);
    }

    return achievements;
  }

  /**
   * Verifica si contiene palabras clave de publicaciones
   */
  _containsPublicationKeywords(text) {
    const keywords = ['publicación', 'publication', 'artículo', 'article', 'paper', 
                     'conferencia', 'conference', 'libro', 'book', 'blog'];
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Verifica si contiene palabras clave de premios
   */
  _containsAwardKeywords(text) {
    const keywords = ['premio', 'award', 'reconocimiento', 'recognition', 'mención'];
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Verifica si contiene palabras clave de hackathons
   */
  _containsHackathonKeywords(text) {
    const keywords = ['hackathon', 'hackaton', 'hack day', 'coding competition'];
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extrae publicaciones
   */
  _extractPublications(text) {
    const publications = [];
    const blocks = this._splitIntoBlocks(text);

    blocks.forEach(block => {
      const entry = {
        title: null,
        type: this._detectPublicationType(block),
        date: null,
        url: null
      };

      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        entry.title = cvUtils.cleanSpecialCharacters(lines[0]);
      }

      const dates = cvUtils.extractDates(block);
      if (dates.length > 0) {
        entry.date = dates[0];
      }

      const urls = cvUtils.extractUrls(block);
      if (urls.length > 0) {
        entry.url = urls[0];
      }

      if (entry.title) {
        publications.push(entry);
      }
    });

    return publications;
  }

  /**
   * Detecta el tipo de publicación
   */
  _detectPublicationType(text) {
    const textLower = text.toLowerCase();
    if (textLower.includes('artículo') || textLower.includes('article') || textLower.includes('paper')) {
      return 'artículo';
    }
    if (textLower.includes('conferencia') || textLower.includes('conference')) {
      return 'conferencia';
    }
    if (textLower.includes('libro') || textLower.includes('book')) {
      return 'libro';
    }
    if (textLower.includes('blog')) {
      return 'blog';
    }
    return 'otro';
  }

  /**
   * Extrae premios
   */
  _extractAwards(text) {
    const awards = [];
    const blocks = this._splitIntoBlocks(text);

    blocks.forEach(block => {
      const entry = {
        name: null,
        issuer: null,
        date: null,
        description: null
      };

      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        entry.name = cvUtils.cleanSpecialCharacters(lines[0]);
      }

      if (lines.length > 1) {
        entry.description = lines.slice(1).map(line => cvUtils.cleanSpecialCharacters(line)).join(' ');
      }

      const dates = cvUtils.extractDates(block);
      if (dates.length > 0) {
        entry.date = dates[0];
      }

      // Intentar encontrar el emisor
      const issuerPattern = /(?:por|by|emitido por|issued by)\s+(.+)/i;
      const issuerMatch = block.match(issuerPattern);
      if (issuerMatch) {
        entry.issuer = cvUtils.cleanSpecialCharacters(issuerMatch[1]);
      }

      if (entry.name) {
        if (!entry.description) delete entry.description;
        if (!entry.issuer) delete entry.issuer;
        if (!entry.date) delete entry.date;
        awards.push(entry);
      }
    });

    return awards;
  }

  /**
   * Extrae hackathons
   */
  _extractHackathons(text) {
    const hackathons = [];
    const blocks = this._splitIntoBlocks(text);

    blocks.forEach(block => {
      const entry = {
        name: null,
        position: null,
        date: null,
        description: null
      };

      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        entry.name = cvUtils.cleanSpecialCharacters(lines[0]);
      }

      // Buscar posición (1er lugar, ganador, etc.)
      const positionPattern = /(\d+º|primer|segundo|tercer|first|second|third|ganador|winner)/i;
      const positionMatch = block.match(positionPattern);
      if (positionMatch) {
        entry.position = positionMatch[1];
      }

      const dates = cvUtils.extractDates(block);
      if (dates.length > 0) {
        entry.date = dates[0];
      }

      if (lines.length > 1) {
        entry.description = lines.slice(1).map(line => cvUtils.cleanSpecialCharacters(line)).join(' ');
      }

      if (entry.name) {
        if (!entry.position) delete entry.position;
        if (!entry.date) delete entry.date;
        if (!entry.description) delete entry.description;
        hackathons.push(entry);
      }
    });

    return hackathons;
  }

  /**
   * Extrae logros genéricos cuando no se puede clasificar
   */
  _extractGenericAchievements(text) {
    const awards = [];
    const blocks = this._splitIntoBlocks(text);

    blocks.forEach(block => {
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const entry = {
          name: cvUtils.cleanSpecialCharacters(lines[0]),
          description: lines.length > 1 ? lines.slice(1).join(' ') : null,
          date: null
        };

        const dates = cvUtils.extractDates(block);
        if (dates.length > 0) {
          entry.date = dates[0];
        }

        if (!entry.description) delete entry.description;
        if (!entry.date) delete entry.date;
        
        awards.push(entry);
      }
    });

    return awards;
  }

  /**
   * Divide el texto en bloques
   */
  _splitIntoBlocks(text) {
    return text.split('\n\n').filter(block => block.trim());
  }
}

module.exports = new AchievementsExtractor();

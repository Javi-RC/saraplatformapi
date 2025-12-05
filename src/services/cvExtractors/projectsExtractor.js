const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de proyectos
 * Responsabilidad única: extraer proyectos del CV
 */
class ProjectsExtractor {
  /**
   * Extrae información de proyectos del texto de la sección correspondiente
   */
  extract(sectionText, technologyDictionary) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const projects = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Dividir por bloques
    const blocks = this._splitIntoBlocks(normalizedText);

    blocks.forEach(block => {
      const entry = this._extractProjectEntry(block, technologyDictionary);
      if (entry && cvUtils.validateField(entry)) {
        projects.push(entry);
      }
    });

    return projects;
  }

  /**
   * Divide el texto en bloques que representan diferentes proyectos
   */
  _splitIntoBlocks(text) {
    const blocks = [];
    const lines = text.split('\n');
    let currentBlock = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || (currentBlock.length > 0 && this._looksLikeProjectStart(trimmedLine))) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
        if (trimmedLine) {
          currentBlock.push(trimmedLine);
        }
      } else {
        currentBlock.push(trimmedLine);
      }
    });

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks;
  }

  /**
   * Verifica si una línea parece ser el inicio de un nuevo proyecto
   */
  _looksLikeProjectStart(line) {
    // Líneas cortas (menos de 50 chars) que parecen títulos
    return line.length < 50 && !line.includes(',');
  }

  /**
   * Extrae una entrada de proyecto de un bloque de texto
   */
  _extractProjectEntry(block, technologyDictionary) {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    const entry = {
      name: null,
      description: null,
      technologies: [],
      url: null,
      repositoryUrl: null,
      startDate: null,
      endDate: null
    };

    // La primera línea es el nombre del proyecto
    entry.name = cvUtils.cleanSpecialCharacters(lines[0]);

    // Extraer URLs
    const urls = cvUtils.extractUrls(block);
    urls.forEach(url => {
      if (url.includes('github.com') || url.includes('gitlab.com') || url.includes('bitbucket.org')) {
        entry.repositoryUrl = url;
      } else if (!entry.url) {
        entry.url = url;
      }
    });

    // Extraer fechas
    const dates = cvUtils.extractDates(block);
    if (dates.length >= 2) {
      const sortedDates = dates.sort();
      entry.startDate = sortedDates[0];
      entry.endDate = sortedDates[sortedDates.length - 1];
    } else if (dates.length === 1) {
      entry.startDate = dates[0];
    }

    // El resto es descripción
    if (lines.length > 1) {
      entry.description = lines.slice(1).map(line => cvUtils.cleanSpecialCharacters(line)).join(' ');
    }

    // Extraer tecnologías
    if (technologyDictionary) {
      entry.technologies = this._extractTechnologies(block, technologyDictionary);
    }

    // Limpiar campos vacíos
    if (!entry.url) delete entry.url;
    if (!entry.repositoryUrl) delete entry.repositoryUrl;
    if (!entry.startDate) delete entry.startDate;
    if (!entry.endDate) delete entry.endDate;
    if (entry.technologies.length === 0) delete entry.technologies;

    return entry;
  }

  /**
   * Extrae tecnologías del texto
   */
  _extractTechnologies(text, technologyDictionary) {
    const allTechs = technologyDictionary.getAllTechnologies();
    const foundTechnologies = new Set();

    allTechs.forEach(tech => {
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(text)) {
        const normalized = cvUtils.normalizeTechnology(tech, technologyDictionary.technologyNormalizations);
        foundTechnologies.add(normalized);
      }
    });

    return Array.from(foundTechnologies);
  }
}

module.exports = new ProjectsExtractor();

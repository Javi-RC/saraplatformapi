const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de experiencia laboral
 * Responsabilidad única: extraer historial laboral del CV
 */
class ExperienceExtractor {
  /**
   * Extrae información de experiencia laboral del texto de la sección correspondiente
   */
  extract(sectionText, technologyDictionary) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const experience = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Dividir por bloques (cada trabajo es un bloque)
    const blocks = this._splitIntoBlocks(normalizedText);

    blocks.forEach(block => {
      const entry = this._extractExperienceEntry(block, technologyDictionary);
      if (entry && cvUtils.validateField(entry)) {
        experience.push(entry);
      }
    });

    return experience;
  }

  /**
   * Divide el texto en bloques que representan diferentes trabajos
   */
  _splitIntoBlocks(text) {
    const blocks = [];
    const lines = text.split('\n');
    let currentBlock = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Si encontramos una línea vacía y ya tenemos contenido, guardar el bloque
      if (!trimmedLine) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
      } else if (currentBlock.length > 0 && this._startsWithDate(trimmedLine)) {
        // Si encontramos una nueva fecha y ya tenemos contenido, es un nuevo trabajo
        blocks.push(currentBlock.join('\n'));
        currentBlock = [trimmedLine];
      } else {
        currentBlock.push(trimmedLine);
      }
    });

    // Agregar último bloque
    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks;
  }

  /**
   * Verifica si una línea empieza con un patrón de fecha
   */
  _startsWithDate(line) {
    const datePattern = /^(20\d{2}|19\d{2})|^(0?[1-9]|1[0-2])\/(20\d{2}|19\d{2})/;
    return datePattern.test(line);
  }

  /**
   * Extrae una entrada de experiencia laboral de un bloque de texto
   */
  _extractExperienceEntry(block, technologyDictionary) {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    const entry = {
      company: null,
      position: null,
      startDate: null,
      endDate: null,
      current: false,
      description: null,
      responsibilities: [],
      technologies: []
    };

    // Extraer fechas del bloque completo
    const dates = cvUtils.extractDates(block);
    if (dates.length > 0) {
      // Si hay "Presente", trabaja actualmente aquí
      if (dates.some(d => d.toLowerCase().includes('presente'))) {
        entry.current = true;
        entry.endDate = 'Presente';
        // La otra fecha es el inicio
        const otherDates = dates.filter(d => !d.toLowerCase().includes('presente'));
        if (otherDates.length > 0) {
          entry.startDate = otherDates[0];
        }
      } else if (dates.length >= 2) {
        // Ordenar fechas (la menor es inicio, la mayor es fin)
        const sortedDates = dates.sort();
        entry.startDate = sortedDates[0];
        entry.endDate = sortedDates[sortedDates.length - 1];
      } else if (dates.length === 1) {
        entry.startDate = dates[0];
      }
    }

    // La primera línea suele ser el puesto o la empresa
    // La segunda línea suele ser la otra
    const firstLine = lines[0];
    const secondLine = lines.length > 1 ? lines[1] : null;

    // Heurística: si la primera línea tiene palabras clave de puesto, es el puesto
    const positionKeywords = ['developer', 'engineer', 'ingeniero', 'desarrollador', 
                             'analista', 'consultant', 'consultor', 'manager', 'jefe',
                             'director', 'arquitecto', 'architect', 'diseñador', 'designer',
                             'senior', 'junior', 'lead', 'specialist', 'especialista'];
    
    const firstLineLower = firstLine.toLowerCase();
    const isPositionInFirst = positionKeywords.some(keyword => firstLineLower.includes(keyword));

    if (isPositionInFirst) {
      entry.position = cvUtils.cleanSpecialCharacters(firstLine);
      if (secondLine) {
        entry.company = cvUtils.cleanSpecialCharacters(secondLine);
      }
    } else {
      // Asumir que la primera es empresa y la segunda es puesto
      entry.company = cvUtils.cleanSpecialCharacters(firstLine);
      if (secondLine) {
        entry.position = cvUtils.cleanSpecialCharacters(secondLine);
      }
    }

    // Validar que tengamos al menos company o position
    if (!entry.company && !entry.position) {
      // Si no hay ninguno, buscar cualquier texto que pueda servir
      const nonEmptyLines = lines.filter(l => l.trim().length > 3);
      if (nonEmptyLines.length > 0) {
        entry.company = cvUtils.cleanSpecialCharacters(nonEmptyLines[0]);
        if (nonEmptyLines.length > 1) {
          entry.position = cvUtils.cleanSpecialCharacters(nonEmptyLines[1]);
        } else {
          entry.position = entry.company;
        }
      }
    }
    
    // Si no se pudo determinar el puesto, usar la empresa como puesto
    if (!entry.position && entry.company) {
      entry.position = entry.company;
    }
    
    // Si no se pudo determinar la empresa, usar el puesto como empresa
    if (!entry.company && entry.position) {
      entry.company = entry.position;
    }
    
    // Si después de todo esto no tenemos company, retornar null
    if (!entry.company || !entry.position) {
      return null;
    }

    // Extraer responsabilidades y descripción del resto
    const remainingText = lines.slice(2).join('\n');
    entry.responsibilities = cvUtils.extractResponsibilities(remainingText);
    
    // Si hay responsabilidades, crear una descripción general
    if (entry.responsibilities.length > 0) {
      entry.description = entry.responsibilities.join(' ');
    }

    // Extraer tecnologías
    entry.technologies = this._extractTechnologies(block, technologyDictionary);

    // Limpiar campos vacíos
    if (entry.responsibilities.length === 0) delete entry.responsibilities;
    if (entry.technologies.length === 0) delete entry.technologies;
    if (!entry.description) delete entry.description;

    return entry;
  }

  /**
   * Extrae tecnologías del texto comparando con el diccionario
   */
  _extractTechnologies(text, technologyDictionary) {
    if (!technologyDictionary) return [];

    const textLower = text.toLowerCase();
    const foundTechnologies = new Set();

    // Obtener todas las tecnologías del diccionario
    const allTechs = technologyDictionary.getAllTechnologies();

    allTechs.forEach(tech => {
      // Buscar la tecnología como palabra completa
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(text)) {
        const normalized = cvUtils.normalizeTechnology(tech, technologyDictionary.technologyNormalizations);
        foundTechnologies.add(normalized);
      }
    });

    return Array.from(foundTechnologies);
  }
}

module.exports = new ExperienceExtractor();

const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de información de educación
 * Responsabilidad única: extraer estudios académicos del CV
 */
class EducationExtractor {
  /**
   * Extrae información de educación del texto de la sección correspondiente
   */
  extract(sectionText) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const education = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Dividir por bloques (generalmente separados por líneas vacías o años)
    const blocks = this._splitIntoBlocks(normalizedText);

    blocks.forEach(block => {
      const entry = this._extractEducationEntry(block);
      if (entry && cvUtils.validateField(entry)) {
        education.push(entry);
      }
    });

    return education;
  }

  /**
   * Divide el texto en bloques que representan diferentes estudios
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
        // Si encontramos una nueva fecha y ya tenemos contenido, es un nuevo estudio
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
   * Extrae una entrada de educación de un bloque de texto
   */
  _extractEducationEntry(block) {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    const entry = {
      institution: null,
      degree: null,
      fieldOfStudy: null,
      startDate: null,
      endDate: null,
      current: false,
      achievements: []
    };

    // Extraer fechas del bloque completo
    const dates = cvUtils.extractDates(block);
    if (dates.length > 0) {
      // Si hay "Presente", está cursando actualmente
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
        entry.endDate = dates[0];
      }
    }

    // La primera línea suele ser el título o la institución
    // La segunda línea suele ser la otra
    let firstLine = lines[0];
    let secondLine = lines.length > 1 ? lines[1] : null;

    // Heurística: si la primera línea tiene palabras clave de título, es el título
    const degreeKeywords = ['grado', 'licenciatura', 'ingeniería', 'máster', 'master', 'mba', 
                           'doctorado', 'phd', 'bachillerato', 'técnico', 'certificado',
                           'diplomatura', 'degree', 'bachelor'];
    
    const firstLineLower = firstLine.toLowerCase();
    const isDegreeInFirst = degreeKeywords.some(keyword => firstLineLower.includes(keyword));

    if (isDegreeInFirst) {
      entry.degree = cvUtils.cleanSpecialCharacters(firstLine);
      if (secondLine) {
        entry.institution = cvUtils.cleanSpecialCharacters(secondLine);
      }
    } else {
      // Asumir que la primera es institución y la segunda es título
      entry.institution = cvUtils.cleanSpecialCharacters(firstLine);
      if (secondLine) {
        entry.degree = cvUtils.cleanSpecialCharacters(secondLine);
      }
    }

    // Buscar área de estudio en el resto de líneas
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      if (lineLower.includes('especialidad') || 
          lineLower.includes('especialización') ||
          lineLower.includes('área') ||
          lineLower.includes('field of study')) {
        entry.fieldOfStudy = cvUtils.cleanSpecialCharacters(line);
      } else if (lineLower.includes('beca') || 
                 lineLower.includes('mención') || 
                 lineLower.includes('honor') ||
                 lineLower.includes('promedio') ||
                 lineLower.includes('scholarship')) {
        entry.achievements.push(cvUtils.cleanSpecialCharacters(line));
      }
    }

    if (entry.achievements.length === 0) {
      delete entry.achievements;
    }

    return entry;
  }
}

module.exports = new EducationExtractor();

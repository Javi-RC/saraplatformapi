const cvUtils = require('../../../utils/cvUtils');

/**
 * Education information extractor
 * Single responsibility: extract academic studies from curriculum
 */
class EducationExtractor {
  /**
   * Extracts education information from the corresponding section text
   */
  extract(sectionText) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const education = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Split into blocks (usually separated by empty lines or years)
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
   * Splits text into blocks representing different studies
   */
  _splitIntoBlocks(text) {
    const blocks = [];
    const lines = text.split('\n');
    let currentBlock = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // If we find an empty line and already have content, save the block
      if (!trimmedLine) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
      } else if (currentBlock.length > 0 && this._startsWithDate(trimmedLine)) {
        // If we find a new date and already have content, it's a new study
        blocks.push(currentBlock.join('\n'));
        currentBlock = [trimmedLine];
      } else {
        currentBlock.push(trimmedLine);
      }
    });

    // Add last block
    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks;
  }

  /**
   * Checks if a line starts with a date pattern
   */
  _startsWithDate(line) {
    const datePattern = /^(20\d{2}|19\d{2})|^(0?[1-9]|1[0-2])\/(20\d{2}|19\d{2})/;
    return datePattern.test(line);
  }

  /**
   * Extracts an education entry from a text block
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

    // Extract dates from the full block
    const dates = cvUtils.extractDates(block);
    if (dates.length > 0) {
      // If there's "Present", currently studying
      if (dates.some(d => d.toLowerCase().includes('presente'))) {
        entry.current = true;
        entry.endDate = 'Presente';
        // The other date is the start date
        const otherDates = dates.filter(d => !d.toLowerCase().includes('presente'));
        if (otherDates.length > 0) {
          entry.startDate = otherDates[0];
        }
      } else if (dates.length >= 2) {
        // Sort dates (smallest is start, largest is end)
        const sortedDates = dates.sort();
        entry.startDate = sortedDates[0];
        entry.endDate = sortedDates[sortedDates.length - 1];
      } else if (dates.length === 1) {
        entry.endDate = dates[0];
      }
    }

    // The first line is usually the degree or the institution
    // The second line is usually the other
    let firstLine = lines[0];
    let secondLine = lines.length > 1 ? lines[1] : null;

    // Heuristic: if the first line has degree keywords, it's the degree
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
      // Assume the first is institution and the second is degree
      entry.institution = cvUtils.cleanSpecialCharacters(firstLine);
      if (secondLine) {
        entry.degree = cvUtils.cleanSpecialCharacters(secondLine);
      }
    }

    // Search for field of study in the remaining lines
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

const cvUtils = require('../../../utils/cvUtils');

/**
 * Work experience extractor
 * Single responsibility: extract work history from curriculum
 */
class ExperienceExtractor {
  /**
   * Extracts work experience information from the corresponding section text
   */
  extract(sectionText, technologyDictionary) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const experience = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Split into blocks (each job is a block)
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
   * Splits text into blocks representing different jobs
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
        // If we find a new date and already have content, it's a new job
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
   * Extracts a work experience entry from a text block
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

    // Extract dates from the full block
    const dates = cvUtils.extractDates(block);
    if (dates.length > 0) {
      // If there's "Present", the person currently works here
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
        entry.startDate = dates[0];
      }
    }

    // The first line is usually the position or the company
    // The second line is usually the other
    const firstLine = lines[0];
    const secondLine = lines.length > 1 ? lines[1] : null;

    // Heuristic: if the first line has position keywords, it's the position
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
      // Assume the first is company and the second is position
      entry.company = cvUtils.cleanSpecialCharacters(firstLine);
      if (secondLine) {
        entry.position = cvUtils.cleanSpecialCharacters(secondLine);
      }
    }

    // Validate that we have at least company or position
    if (!entry.company && !entry.position) {
      // If neither exists, look for any text that might work
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
    
    // If position couldn't be determined, use company as position
    if (!entry.position && entry.company) {
      entry.position = entry.company;
    }
    
    // If company couldn't be determined, use position as company
    if (!entry.company && entry.position) {
      entry.company = entry.position;
    }
    
    // If after all this we still don't have company, return null
    if (!entry.company || !entry.position) {
      return null;
    }

    // Extract responsibilities and description from the rest
    const remainingText = lines.slice(2).join('\n');
    entry.responsibilities = cvUtils.extractResponsibilities(remainingText);
    
    // If there are responsibilities, create a general description
    if (entry.responsibilities.length > 0) {
      entry.description = entry.responsibilities.join(' ');
    }

    // Extract technologies
    entry.technologies = this._extractTechnologies(block, technologyDictionary);

    // Clean up empty fields
    if (entry.responsibilities.length === 0) delete entry.responsibilities;
    if (entry.technologies.length === 0) delete entry.technologies;
    if (!entry.description) delete entry.description;

    return entry;
  }

  /**
   * Extracts technologies from text by comparing with the dictionary
   */
  _extractTechnologies(text, technologyDictionary) {
    if (!technologyDictionary) return [];

    const textLower = text.toLowerCase();
    const foundTechnologies = new Set();

    // Get all technologies from the dictionary
    const allTechs = technologyDictionary.getAllTechnologies();

    allTechs.forEach(tech => {
      // Search for the technology as a whole word
      const regex = cvUtils.createWordBoundaryRegex(tech);
      if (regex && regex.test(text)) {
        const normalized = cvUtils.normalizeTechnology(tech, technologyDictionary.technologyNormalizations);
        foundTechnologies.add(normalized);
      }
    });

    return Array.from(foundTechnologies);
  }
}

module.exports = new ExperienceExtractor();

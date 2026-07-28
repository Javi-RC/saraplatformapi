const cvUtils = require('../../../utils/cvUtils');

/**
 * Projects extractor
 * Single responsibility: extract projects from curriculum
 */
class ProjectsExtractor {
  /**
   * Extracts project information from the corresponding section text
   */
  extract(sectionText, technologyDictionary) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const projects = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Split into blocks
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
   * Splits text into blocks representing different projects
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
   * Checks if a line looks like the start of a new project
   */
  _looksLikeProjectStart(line) {
    // Short lines (less than 50 chars) that look like titles
    return line.length < 50 && !line.includes(',');
  }

  /**
   * Extracts a project entry from a text block
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

    // The first line is the project name
    entry.name = cvUtils.cleanSpecialCharacters(lines[0]);

    // Extract URLs
    const urls = cvUtils.extractUrls(block);
    urls.forEach(url => {
      if (url.includes('github.com') || url.includes('gitlab.com') || url.includes('bitbucket.org')) {
        entry.repositoryUrl = url;
      } else if (!entry.url) {
        entry.url = url;
      }
    });

    // Extract dates
    const dates = cvUtils.extractDates(block);
    if (dates.length >= 2) {
      const sortedDates = dates.sort();
      entry.startDate = sortedDates[0];
      entry.endDate = sortedDates[sortedDates.length - 1];
    } else if (dates.length === 1) {
      entry.startDate = dates[0];
    }

    // The rest is description
    if (lines.length > 1) {
      entry.description = lines.slice(1).map(line => cvUtils.cleanSpecialCharacters(line)).join(' ');
    }

    // Extract technologies
    if (technologyDictionary) {
      entry.technologies = this._extractTechnologies(block, technologyDictionary);
    }

    // Clean up empty fields
    if (!entry.url) delete entry.url;
    if (!entry.repositoryUrl) delete entry.repositoryUrl;
    if (!entry.startDate) delete entry.startDate;
    if (!entry.endDate) delete entry.endDate;
    if (entry.technologies.length === 0) delete entry.technologies;

    return entry;
  }

  /**
   * Extracts technologies from text
   */
  _extractTechnologies(text, technologyDictionary) {
    const allTechs = technologyDictionary.getAllTechnologies();
    const foundTechnologies = new Set();

    allTechs.forEach(tech => {
      const regex = cvUtils.createWordBoundaryRegex(tech);
      if (regex && regex.test(text)) {
        const normalized = cvUtils.normalizeTechnology(tech, technologyDictionary.technologyNormalizations);
        foundTechnologies.add(normalized);
      }
    });

    return Array.from(foundTechnologies);
  }
}

module.exports = new ProjectsExtractor();

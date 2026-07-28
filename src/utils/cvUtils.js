/**
 * Utilities for extracting information from resumes
 * Contains functions to extract and normalize data using regex
 */

class CVUtils {
  /**
   * Creates a safe word-boundary regex for matching a term in text.
   * Escapes the term to prevent ReDoS and validates it's a simple alphanumeric string.
   */
  static createWordBoundaryRegex(term) {
    if (typeof term !== 'string' || term.length === 0 || term.length > 100) {
      return null;
    }
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'gi');
  }

  /**
   * Extracts emails from text using regex
   */
  extractEmails(text) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailRegex) || [];
    return [...new Set(emails.map(email => email.toLowerCase().trim()))];
  }

  /**
   * Extracts phone numbers from text
   * Supports international formats with country code
   */
  extractPhones(text) {
    // Phone patterns with country code and various formats
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
   * Extracts URLs from text
   */
  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = text.match(urlRegex) || [];
    return [...new Set(urls)];
  }

  /**
   * Extracts LinkedIn-specific URLs
   */
  extractLinkedIn(text) {
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
    const matches = text.match(linkedinRegex) || [];
    return matches[0] || null;
  }

  /**
   * Extracts GitHub-specific URLs
   */
  extractGitHub(text) {
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;
    const matches = text.match(githubRegex) || [];
    return matches[0] || null;
  }

  /**
   * Extracts dates in various formats
   * Supports: YYYY, MM/YYYY, Month YYYY, YYYY-MM, present, current
   */
  extractDates(text) {
    const datePatterns = [
      /\b(20\d{2}|19\d{2})\b/g, // YYYY
      /\b(0?[1-9]|1[0-2])\/(20\d{2}|19\d{2})\b/g, // MM/YYYY
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(20\d{2}|19\d{2})\b/gi, // Month YYYY (Spanish)
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(20\d{2}|19\d{2})\b/gi, // Mon YYYY
      /\b(20\d{2}|19\d{2})-(0?[1-9]|1[0-2])\b/g // YYYY-MM
    ];

    const dates = new Set();
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(date => dates.add(date.trim()));
    });

    // Detect keywords for "present"
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
   * Normalizes text: removes tabs, double spaces, and special characters
   */
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .replace(/\t/g, ' ')            // Replace tabs with spaces
      .replace(/\r\n/g, '\n')         // Normalize line breaks
      .replace(/\r/g, '\n')           // Normalize line breaks
      .replace(/[ \t]{2,}/g, ' ')      // Replace multiple spaces (not line breaks)
      .replace(/\n{3,}/g, '\n\n')     // Keep at least one break between sections
      .replace(/[^\S\n]+$/gm, '')     // Remove trailing spaces from lines
      .trim();
  }

  /**
   * Splits text into sections based on common headings
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

      // Check if the line is a section heading
      if (line.trim().length > 0) {
        // Detect if it is a title line
        // Must be short (max 8 words) AND meet at least one of these criteria:
        // 1. All uppercase
        // 2. Starts with a capital letter and has no periods/commas at the end
        const words = line.trim().split(/\s+/);
        const isShort = words.length <= 8;
        const isUppercase = lineUpper === line.trim();
        const startsCapital = /^[A-ZÁÉÍÓÚÑ]/.test(line.trim());
        const noPunctuation = !line.trim().endsWith('.') && !line.trim().endsWith(',');
        const hasColon = line.trim().endsWith(':');
        
        const looksLikeTitle = isShort && (
          isUppercase || // All uppercase like "EDUCATION"
          (startsCapital && noPunctuation && words.length <= 5) || // Short capitalized title
          hasColon // Ends with colon like "Skills:"
        );

        if (looksLikeTitle) {
          for (const [sectionKey, keywords] of Object.entries(sectionKeywords)) {
            const matchesKeyword = keywords.some(keyword => {
              const keywordLower = keyword.toLowerCase();
              const keywordWords = keywordLower.split(' ');
              
              // Exact match
              if (lineLower === keywordLower) return true;
              
              // Contains the keyword
              if (lineLower.includes(keywordLower)) return true;
              
              // Contains all words of the keyword
              if (keywordWords.every(word => lineLower.includes(word))) return true;
              
              return false;
            });
            
            if (matchesKeyword) {
              // Save previous section
              if (currentContent.length > 0) {
                if (!sections[currentSection]) sections[currentSection] = [];
                sections[currentSection].push(currentContent.join('\n'));
              }
              // Start new section
              currentSection = sectionKey;
              currentContent = [];
              foundSection = true;
              break;
            }
          }
        }
      }

      // If not a heading, add to current content
      if (!foundSection && line.trim()) {
        currentContent.push(line);
      }
    });

    // Save last section
    if (currentContent.length > 0) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(currentContent.join('\n'));
    }

    return sections;
  }

  /**
   * Removes unnecessary special characters
   */
  cleanSpecialCharacters(text) {
    if (!text) return '';
    
    return text
      .replace(/[•●○◆◇■□▪▫]/g, '')    // Bullets
      .replace(/[─┬┼┴├┤┐┘└┌]/g, '')    // Table characters
      .replace(/\u00A0/g, ' ')          // Non-breaking space
      .trim();
  }

  /**
   * Validates that a field has at least one value
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
   * Extracts location (city/country) by comparing with a dictionary
   */
  extractLocation(text, locationDictionary) {
    const textLower = text.toLowerCase();
    const locations = [];

    // Search for cities
    if (locationDictionary.cities) {
      locationDictionary.cities.forEach(city => {
        if (textLower.includes(city.toLowerCase())) {
          locations.push({ type: 'city', value: city });
        }
      });
    }

    // Search for countries
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
   * Normalizes technology names
   */
  normalizeTechnology(tech, technologyDictionary) {
    const techLower = tech.toLowerCase().trim();
    
    // Search in normalization dictionary
    if (technologyDictionary && technologyDictionary[techLower]) {
      return technologyDictionary[techLower];
    }

    return tech.trim();
  }

  /**
   * Extracts lines that are likely responsibility descriptions
   * (long lines or lines starting with bullets)
   */
  extractResponsibilities(text) {
    const lines = text.split('\n');
    const responsibilities = [];

    lines.forEach(line => {
      const cleaned = line.trim();
      // Long lines (more than 30 characters) or lines starting with common bullets
      if (cleaned.length > 30 || /^[-•●○◆▪]/.test(cleaned)) {
        responsibilities.push(this.cleanSpecialCharacters(cleaned));
      }
    });

    return responsibilities;
  }
}

module.exports = new CVUtils();

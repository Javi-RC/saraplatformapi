const cvUtils = require('../../../utils/cvUtils');

/**
 * Certifications extractor
 * Single responsibility: extract certifications from curriculum
 */
class CertificationsExtractor {
  /**
   * Extracts certification information from the corresponding section text
   */
  extract(sectionText) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const certifications = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Split into blocks or lines
    const blocks = this._splitIntoBlocks(normalizedText);

    blocks.forEach(block => {
      const entry = this._extractCertificationEntry(block);
      if (entry && cvUtils.validateField(entry)) {
        certifications.push(entry);
      }
    });

    return certifications;
  }

  /**
   * Splits text into blocks
   */
  _splitIntoBlocks(text) {
    const blocks = [];
    const lines = text.split('\n');
    let currentBlock = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || (currentBlock.length > 0 && this._looksLikeCertificationStart(trimmedLine))) {
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
   * Checks if a line looks like the start of a new certification
   */
  _looksLikeCertificationStart(line) {
    const certKeywords = ['certified', 'certificado', 'certification', 'certificación', 
                         'professional', 'associate', 'expert', 'specialist'];
    const lineLower = line.toLowerCase();
    return certKeywords.some(keyword => lineLower.includes(keyword)) && line.length < 80;
  }

  /**
   * Extracts a certification entry from a text block
   */
  _extractCertificationEntry(block) {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    const entry = {
      name: null,
      issuer: null,
      dateObtained: null,
      expirationDate: null,
      credentialId: null,
      url: null
    };

    // The first line is the certification name
    entry.name = cvUtils.cleanSpecialCharacters(lines[0]);

    // The second line could be the issuer
    if (lines.length > 1) {
      const secondLine = lines[1];
      // If it doesn't contain dates, it's probably the issuer
      if (!cvUtils.extractDates(secondLine).length) {
        entry.issuer = cvUtils.cleanSpecialCharacters(secondLine);
      }
    }

    // Extract dates from the block
    const dates = cvUtils.extractDates(block);
    if (dates.length > 0) {
      entry.dateObtained = dates[0];
      if (dates.length > 1) {
        entry.expirationDate = dates[1];
      }
    }

    // Search for credential ID
    const credentialPattern = /credential\s*(?:id|#)?:?\s*([\w-]+)/i;
    const credentialMatch = block.match(credentialPattern);
    if (credentialMatch) {
      entry.credentialId = credentialMatch[1];
    }

    // Extract URL
    const urls = cvUtils.extractUrls(block);
    if (urls.length > 0) {
      entry.url = urls[0];
    }

    // Clean up empty fields
    if (!entry.issuer) delete entry.issuer;
    if (!entry.dateObtained) delete entry.dateObtained;
    if (!entry.expirationDate) delete entry.expirationDate;
    if (!entry.credentialId) delete entry.credentialId;
    if (!entry.url) delete entry.url;

    return entry;
  }
}

module.exports = new CertificationsExtractor();

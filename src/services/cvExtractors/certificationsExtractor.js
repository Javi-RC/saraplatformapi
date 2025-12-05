const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de certificaciones
 * Responsabilidad única: extraer certificaciones del CV
 */
class CertificationsExtractor {
  /**
   * Extrae información de certificaciones del texto de la sección correspondiente
   */
  extract(sectionText) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const certifications = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    
    // Dividir por bloques o líneas
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
   * Divide el texto en bloques
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
   * Verifica si una línea parece ser el inicio de una nueva certificación
   */
  _looksLikeCertificationStart(line) {
    const certKeywords = ['certified', 'certificado', 'certification', 'certificación', 
                         'professional', 'associate', 'expert', 'specialist'];
    const lineLower = line.toLowerCase();
    return certKeywords.some(keyword => lineLower.includes(keyword)) && line.length < 80;
  }

  /**
   * Extrae una entrada de certificación de un bloque de texto
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

    // La primera línea es el nombre de la certificación
    entry.name = cvUtils.cleanSpecialCharacters(lines[0]);

    // La segunda línea podría ser el emisor
    if (lines.length > 1) {
      const secondLine = lines[1];
      // Si no contiene fechas, probablemente es el emisor
      if (!cvUtils.extractDates(secondLine).length) {
        entry.issuer = cvUtils.cleanSpecialCharacters(secondLine);
      }
    }

    // Extraer fechas del bloque
    const dates = cvUtils.extractDates(block);
    if (dates.length > 0) {
      entry.dateObtained = dates[0];
      if (dates.length > 1) {
        entry.expirationDate = dates[1];
      }
    }

    // Buscar credential ID
    const credentialPattern = /credential\s*(?:id|#)?:?\s*([\w-]+)/i;
    const credentialMatch = block.match(credentialPattern);
    if (credentialMatch) {
      entry.credentialId = credentialMatch[1];
    }

    // Extraer URL
    const urls = cvUtils.extractUrls(block);
    if (urls.length > 0) {
      entry.url = urls[0];
    }

    // Limpiar campos vacíos
    if (!entry.issuer) delete entry.issuer;
    if (!entry.dateObtained) delete entry.dateObtained;
    if (!entry.expirationDate) delete entry.expirationDate;
    if (!entry.credentialId) delete entry.credentialId;
    if (!entry.url) delete entry.url;

    return entry;
  }
}

module.exports = new CertificationsExtractor();

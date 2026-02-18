const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de idiomas
 * Responsabilidad única: extraer idiomas y sus niveles del currículo
 */
class LanguagesExtractor {
  /**
   * Extrae información de idiomas del texto de la sección correspondiente
   */
  extract(sectionText, languageDictionary) {
    if (!sectionText || sectionText.trim().length === 0) {
      return [];
    }

    const languages = [];
    const normalizedText = cvUtils.normalizeText(sectionText);
    const lines = normalizedText.split('\n');

    lines.forEach(line => {
      const entry = this._extractLanguageEntry(line, languageDictionary);
      if (entry && cvUtils.validateField(entry)) {
        languages.push(entry);
      }
    });

    return languages;
  }

  /**
   * Extrae un idioma y su nivel de una línea
   */
  _extractLanguageEntry(line, languageDictionary) {
    const lineLower = line.toLowerCase();
    let foundLanguage = null;
    let foundLevel = null;

    // Buscar idioma en el diccionario
    if (languageDictionary && languageDictionary.commonLanguages) {
      for (const lang of languageDictionary.commonLanguages) {
        if (lineLower.includes(lang.toLowerCase())) {
          foundLanguage = lang;
          break;
        }
      }
    }

    if (!foundLanguage) return null;

    // Buscar nivel en la misma línea
    if (languageDictionary && languageDictionary.languageLevels) {
      for (const [levelKey, levelKeywords] of Object.entries(languageDictionary.languageLevels)) {
        for (const keyword of levelKeywords) {
          if (lineLower.includes(keyword.toLowerCase())) {
            foundLevel = this._normalizeLevel(levelKey, keyword);
            break;
          }
        }
        if (foundLevel) break;
      }
    }

    // Si no se encontró nivel, intentar con patrones comunes
    if (!foundLevel) {
      const levelPatterns = {
        'nativo': /nativ[oa]|lengua materna|native/i,
        'bilingüe': /bilingüe|bilingual/i,
        'fluido': /fluid[oa]|fluent/i,
        'C2': /c2/i,
        'C1': /c1/i,
        'B2': /b2/i,
        'B1': /b1/i,
        'A2': /a2/i,
        'A1': /a1/i,
        'avanzado': /avanzad[oa]|advanced/i,
        'intermedio': /intermedi[oa]|intermediate/i,
        'básico': /básic[oa]|basic/i
      };

      for (const [level, pattern] of Object.entries(levelPatterns)) {
        if (pattern.test(line)) {
          foundLevel = level;
          break;
        }
      }
    }

    // Si aún no hay nivel, poner "intermedio" por defecto
    if (!foundLevel) {
      foundLevel = 'intermedio';
    }

    return {
      language: foundLanguage,
      level: foundLevel
    };
  }

  /**
   * Normaliza el nivel del idioma
   */
  _normalizeLevel(levelKey, keyword) {
    const normalizationMap = {
      'spanish': 'nativo',
      'bilingual': 'bilingüe',
      'fluent': 'fluido',
      'advanced': 'avanzado',
      'intermediate': 'intermedio',
      'basic': 'básico'
    };

    // Si el keyword es un nivel del marco común europeo (A1, A2, etc.), devolverlo directamente
    if (/^[abc][12]$/i.test(keyword)) {
      return keyword.toUpperCase();
    }

    return normalizationMap[levelKey] || keyword;
  }
}

module.exports = new LanguagesExtractor();

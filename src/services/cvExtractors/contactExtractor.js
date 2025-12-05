const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de información de contacto
 * Responsabilidad única: extraer emails, teléfonos, URLs y ubicación
 */
class ContactExtractor {
  /**
   * Extrae toda la información de contacto del texto
   */
  extract(text) {
    const contact = {
      email: null,
      phones: [],
      links: {
        linkedin: null,
        github: null,
        portfolio: null,
        other: []
      },
      location: {
        city: null,
        country: null,
        fullLocation: null
      }
    };

    // Extraer emails (tomar el primero)
    const emails = cvUtils.extractEmails(text);
    if (emails.length > 0) {
      contact.email = emails[0];
    }

    // Extraer teléfonos
    const phones = cvUtils.extractPhones(text);
    contact.phones = phones.map(phone => ({
      number: phone,
      type: 'mobile'
    }));

    // Extraer LinkedIn
    const linkedin = cvUtils.extractLinkedIn(text);
    if (linkedin) {
      contact.links.linkedin = linkedin;
    }

    // Extraer GitHub
    const github = cvUtils.extractGitHub(text);
    if (github) {
      contact.links.github = github;
    }

    // Extraer otras URLs (portfolio)
    const urls = cvUtils.extractUrls(text);
    urls.forEach(url => {
      if (!url.includes('linkedin.com') && !url.includes('github.com')) {
        // La primera URL que no sea LinkedIn/GitHub la consideramos portfolio
        if (!contact.links.portfolio) {
          contact.links.portfolio = url;
        } else {
          contact.links.other.push(url);
        }
      }
    });

    // Limpiar campos vacíos
    if (contact.phones.length === 0) delete contact.phones;
    if (contact.links.other.length === 0) delete contact.links.other;

    return cvUtils.validateField(contact) ? contact : null;
  }

  /**
   * Extrae ubicación del texto usando un diccionario
   */
  extractWithLocation(text, locationDictionary) {
    const contact = this.extract(text);
    if (!contact) return null;

    const locations = cvUtils.extractLocation(text, locationDictionary);
    
    locations.forEach(loc => {
      if (loc.type === 'city') {
        contact.location.city = loc.value;
      } else if (loc.type === 'country') {
        contact.location.country = loc.value;
      }
    });

    // Construir ubicación completa
    if (contact.location.city || contact.location.country) {
      const parts = [contact.location.city, contact.location.country].filter(Boolean);
      contact.location.fullLocation = parts.join(', ');
    } else {
      delete contact.location;
    }

    return contact;
  }
}

module.exports = new ContactExtractor();

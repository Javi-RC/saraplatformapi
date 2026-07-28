const cvUtils = require('../../../utils/cvUtils');

/**
 * Contact information extractor
 * Single responsibility: extract emails, phones, URLs, and location
 */
class ContactExtractor {
  /**
   * Extracts all contact information from text
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

    // Extract emails (take the first one)
    const emails = cvUtils.extractEmails(text);
    if (emails.length > 0) {
      contact.email = emails[0];
    }

    // Extract phones
    const phones = cvUtils.extractPhones(text);
    contact.phones = phones.map(phone => ({
      number: phone,
      type: 'mobile'
    }));

    // Extract LinkedIn
    const linkedin = cvUtils.extractLinkedIn(text);
    if (linkedin) {
      contact.links.linkedin = linkedin;
    }

    // Extract GitHub
    const github = cvUtils.extractGitHub(text);
    if (github) {
      contact.links.github = github;
    }

    // Extract other URLs (portfolio)
    const urls = cvUtils.extractUrls(text);
    urls.forEach(url => {
      if (!url.includes('linkedin.com') && !url.includes('github.com')) {
        // The first URL that isn't LinkedIn/GitHub is considered the portfolio
        if (!contact.links.portfolio) {
          contact.links.portfolio = url;
        } else {
          contact.links.other.push(url);
        }
      }
    });

    // Clean up empty fields
    if (contact.phones.length === 0) delete contact.phones;
    if (contact.links.other.length === 0) delete contact.links.other;

    return cvUtils.validateField(contact) ? contact : null;
  }

  /**
   * Extracts location from text using a dictionary
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

    // Build full location
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

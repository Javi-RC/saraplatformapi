const legalService = require('../legal/terms');

class LegalController {
  getTerms(req, res) {
    const rawLocale = (req.query.locale || 'en').toString().trim().toLowerCase();
    const format = (req.query.format || 'json').toString().toLowerCase();

    const document = legalService.getTermsAndConditions(rawLocale);

    if (format === 'text') {
      return res.type('text/plain').send(document.content);
    }

    if (format === 'markdown') {
      return res.type('text/markdown').send(document.content);
    }

    return res.json({
      success: true,
      document: {
        type: 'terms',
        version: document.version,
        locale: document.locale,
        lastUpdated: document.lastUpdated,
        format: 'markdown',
        content: document.content
      }
    });
  }
}

module.exports = new LegalController();

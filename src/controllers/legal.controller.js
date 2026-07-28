const legalService = require('../legal/terms');
const { handleErrorCatch } = require('../utils/errorHelper');

class LegalController {
  async getTerms(req, res) {
    try {
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
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }
}

module.exports = new LegalController();

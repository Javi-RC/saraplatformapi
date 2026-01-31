/**
 * i18n Index
 * Export all i18n functionality from a single entry point
 */

const i18nService = require('./i18n.service');
const es = require('./es');
const en = require('./en');

module.exports = {
  ...i18nService,
  translations: {
    es,
    en
  }
};

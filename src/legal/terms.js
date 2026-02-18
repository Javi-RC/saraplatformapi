/**
 * Legal documents module
 * Separates legal content from controllers (SRP)
 */

const TERMS_VERSION = '1.0';
const TERMS_LAST_UPDATED = '2026-01-03';

/**
 * Get terms and conditions content
 * @param {string} locale - Language locale (currently only 'en' supported)
 * @returns {Object} Document metadata and content
 */
function getTermsAndConditions(locale = 'en') {
  // Normalize locale and fallback to English
  const normalizedLocale = (locale.split(/[-_]/)[0] || 'en') === 'en' ? 'en' : 'en';

  const contentMarkdown = `# Terms & Conditions (v${TERMS_VERSION})

**Last updated:** ${TERMS_LAST_UPDATED}

> Notice: this is a generic text for an academic project (Bachelor's Thesis / TFG) and does not constitute legal advice.

## 1. Identification

This application (the "Platform") is software developed for academic purposes within the scope of a university final project. The Platform provides features related to user management, organizations, projects, notifications, and analysis of professional information.

## 2. Acceptance of these terms

By registering, accessing, or using the Platform, you agree to these Terms & Conditions. If you do not agree, you must not use the Platform.

## 3. Service description

The Platform may include, among others, the following features:

- User registration and login.
- Organization and project management.
- Notification management and display.
- Uploading and processing résumés/curricula to extract structured information.
- Decision-support services based on rules and/or models.

Features may evolve over time.

## 4. Age and legal capacity

The Platform is intended for users who have legal capacity to accept these Terms. If you are under the age of majority, you must have authorization from your legal guardian.

## 5. User accounts

- You are responsible for the information you provide during registration.
- You must keep your credentials confidential.
- You agree to notify any unauthorized use of your account.
- The Platform may suspend or terminate accounts in case of misuse or violations of these Terms.

## 6. Permitted and prohibited use

### 6.1 Permitted use

You may use the Platform only for lawful purposes and in accordance with these Terms.

### 6.2 Prohibited use

You must not:

- Engage in illegal or fraudulent activities.
- Attempt to access systems, accounts, or data without authorization.
- Introduce malware or run harmful scripts, or perform attacks (DoS/DDoS).
- Interfere with the normal operation of the Platform.
- Impersonate others or provide false information.
- Upload content that infringes third-party rights.

## 7. User content (including curricula)

### 7.1 Ownership and responsibility

- Content you upload (e.g., curricula, text, files) remains yours or belongs to the rights holder.
- You confirm you have the right to upload such content.
- You are responsible for the accuracy and legality of the content.

### 7.2 Limited license to operate the service

You grant the Platform a limited, non-exclusive, royalty-free license to store, process, and display your content to the extent necessary to provide the service.

## 8. Automated processing and third-party services

The Platform may perform automated processing of content (for example, extracting information from a curriculum). Some features may require third-party services (for example, AI providers).

- Where required, the Platform will request your explicit consent before sending information to third parties.
- The Platform will aim to minimize data sharing to what is strictly necessary.

## 9. Privacy and personal data

Personal data processing is governed by the Platform's Privacy Policy and applicable regulations. Consent may be requested for specific processing activities (for example, AI-based curriculum analysis).

## 10. Availability and maintenance

The Platform is provided "as is" and may be subject to interruptions, maintenance, changes, or discontinuation—especially because it is an academic project.

## 11. Disclaimer of warranties

To the maximum extent permitted by law:

- The Platform does not guarantee uninterrupted, error-free, or fully secure service.
- Any analysis, predictions, or recommendations are informational and do not constitute professional advice.

## 12. Limitation of liability

To the maximum extent permitted by law, the Platform will not be liable for:

- Indirect damages, data loss, loss of profits, or service interruptions.
- Decisions made by users based on Platform outputs.
- Incidents arising from third-party service usage.

## 13. Suspension and termination

The Platform may suspend or terminate access if it detects use contrary to these Terms or for technical/operational reasons.

## 14. Changes to these terms

These Terms may be updated. The current version will be published via this endpoint along with its update date.

## 15. Governing law and jurisdiction

These Terms are governed by the laws applicable in the location where the project is operated. In case of disputes, the parties will attempt an amicable resolution before resorting to courts.

## 16. Contact

For questions related to these Terms, use the contact channels provided in the Platform or the project documentation.
`;

  return {
    version: TERMS_VERSION,
    lastUpdated: TERMS_LAST_UPDATED,
    locale: normalizedLocale,
    content: contentMarkdown
  };
}

module.exports = {
  getTermsAndConditions,
  TERMS_VERSION,
  TERMS_LAST_UPDATED
};

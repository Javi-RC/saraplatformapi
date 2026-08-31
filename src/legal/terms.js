/**
 * Legal documents module
 * Separates legal content from controllers (SRP)
 */

const TERMS_VERSION = '1.0';
const TERMS_LAST_UPDATED = '2026-01-03';

const SUPPORTED_LOCALES = ['en', 'es'];
const DEFAULT_LOCALE = 'es';

/**
 * Normalize and resolve locale with fallback
 * @param {string} locale - Raw locale string
 * @returns {string} Resolved locale code
 */
function resolveLocale(locale) {
  const base = (locale || '').split(/[-_]/)[0].toLowerCase();
  return SUPPORTED_LOCALES.includes(base) ? base : DEFAULT_LOCALE;
}

/**
 * Get terms content in English
 * @returns {string} Markdown content
 */
function getTermsEN() {
  return `# Terms & Conditions (v${TERMS_VERSION})

**Last updated:** ${TERMS_LAST_UPDATED}

> Notice: this text is provided for informational purposes and does not constitute legal advice.

## 1. Identification

This application ("SARA") is software developed for academic purposes within the scope of a university final project. SARA provides features related to user management, organizations, projects, notifications, and analysis of professional information.

## 2. Acceptance of these terms

By registering, accessing, or using SARA, you agree to these Terms & Conditions. If you do not agree, you must not use SARA.

## 3. Service description

SARA may include, among others, the following features:

- User registration and login.
- Organization and project management.
- Notification management and display.
- Uploading and processing résumés/curricula to extract structured information.
- Decision-support services based on rules and/or models.

Features may evolve over time.

## 4. Age and legal capacity

SARA is intended for users who have legal capacity to accept these Terms. If you are under the age of majority, you must have authorization from your legal guardian.

## 5. User accounts

- You are responsible for the information you provide during registration.
- You must keep your credentials confidential.
- You agree to notify any unauthorized use of your account.
- SARA may suspend or terminate accounts in case of misuse or violations of these Terms.

## 6. Permitted and prohibited use

### 6.1 Permitted use

You may use SARA only for lawful purposes and in accordance with these Terms.

### 6.2 Prohibited use

You must not:

- Engage in illegal or fraudulent activities.
- Attempt to access systems, accounts, or data without authorization.
- Introduce malware or run harmful scripts, or perform attacks (DoS/DDoS).
- Interfere with the normal operation of SARA.
- Impersonate others or provide false information.
- Upload content that infringes third-party rights.

## 7. User content
### 7.1 Ownership and responsibility

- Content you upload (e.g., curricula, text, files) remains yours or belongs to the rights holder.
- You confirm you have the right to upload such content.
- You are responsible for the accuracy and legality of the content.

### 7.2 Limited license to operate the service

You grant SARA a limited, non-exclusive, royalty-free license to store, process, and display your content to the extent necessary to provide the service.

## 8. Automated processing and third-party services

SARA may perform automated processing of content (for example, extracting information from a curriculum). Some features may require third-party services (for example, AI providers).

- Where required, SARA will request your explicit consent before sending information to third parties.
- SARA will aim to minimize data sharing to what is strictly necessary.

## 9. Privacy and personal data

Personal data processing is governed by SARA's Privacy Policy and applicable regulations. Consent may be requested for specific processing activities (for example, AI-based curriculum analysis).

## 10. Availability and maintenance

SARA is provided "as is" and may be subject to interruptions, maintenance, changes, or discontinuation—especially because it is an academic project.

## 11. Disclaimer of warranties

To the maximum extent permitted by law:

- SARA does not guarantee uninterrupted, error-free, or fully secure service.
- Any analysis, predictions, or recommendations are informational and do not constitute professional advice.

## 12. Limitation of liability

To the maximum extent permitted by law, SARA will not be liable for:

- Indirect damages, data loss, loss of profits, or service interruptions.
- Decisions made by users based on SARA outputs.
- Incidents arising from third-party service usage.

## 13. Suspension and termination

SARA may suspend or terminate access if it detects use contrary to these Terms or for technical/operational reasons.

## 14. Changes to these terms

These Terms may be updated. The current version will be published via this web along with its update date.

## 15. Governing law and jurisdiction

These Terms are governed by the laws applicable in the location where the project is operated. In case of disputes, the parties will attempt an amicable resolution before resorting to courts.

## 16. Contact

For questions related to these Terms, use the contact channels provided in SARA or the project documentation.
`;
}

/**
 * Get terms content in Spanish
 * @returns {string} Markdown content
 */
function getTermsES() {
  return `# Términos y Condiciones (v${TERMS_VERSION})

**Última actualización:** ${TERMS_LAST_UPDATED}

> Aviso: este texto se proporciona con fines informativos y no constituye asesoramiento legal.

## 1. Identificación

Esta aplicación ("SARA") es un software desarrollado con fines académicos en el marco de un Trabajo de Fin de Grado universitario. SARA ofrece funcionalidades relacionadas con la gestión de usuarios, organizaciones, proyectos, notificaciones y análisis de información profesional.

## 2. Aceptación de estos términos

Al registrarse, acceder o utilizar SARA, usted acepta estos Términos y Condiciones. Si no está de acuerdo, no debe utilizar SARA.

## 3. Descripción del servicio

SARA puede incluir, entre otras, las siguientes funcionalidades:

- Registro e inicio de sesión de usuarios.
- Gestión de organizaciones y proyectos.
- Gestión y visualización de notificaciones.
- Carga y procesamiento de currículos para extraer información estructurada.
- Servicios de apoyo a la toma de decisiones basados en reglas y/o modelos.

Las funcionalidades pueden evolucionar con el tiempo.

## 4. Edad y capacidad legal

SARA está destinada a usuarios que tengan capacidad legal para aceptar estos Términos. Si usted es menor de edad, debe contar con la autorización de su tutor legal.

## 5. Cuentas de usuario

- Usted es responsable de la información que proporciona durante el registro.
- Debe mantener sus credenciales de acceso de forma confidencial.
- Se compromete a notificar cualquier uso no autorizado de su cuenta.
- SARA podrá suspender o cancelar cuentas en caso de uso indebido o incumplimiento de estos Términos.

## 6. Uso permitido y prohibido

### 6.1 Uso permitido

Solo podrá utilizar SARA con fines lícitos y de acuerdo con estos Términos.

### 6.2 Uso prohibido

No deberá:

- Realizar actividades ilegales o fraudulentas.
- Intentar acceder a sistemas, cuentas o datos sin autorización.
- Introducir malware, ejecutar scripts dañinos o realizar ataques (DoS/DDoS).
- Interferir con el funcionamiento normal de SARA.
- Suplantar la identidad de otros o proporcionar información falsa.
- Subir contenido que infrinja derechos de terceros.

## 7. Contenido del usuario

### 7.1 Propiedad y responsabilidad

- El contenido que suba (por ejemplo, currículos, textos, archivos) sigue siendo suyo o pertenece al titular de los derechos.
- Usted confirma que tiene derecho a subir dicho contenido.
- Usted es responsable de la exactitud y legalidad del contenido.

### 7.2 Licencia limitada para operar el servicio

Usted otorga a SARA una licencia limitada, no exclusiva y gratuita para almacenar, procesar y mostrar su contenido en la medida necesaria para prestar el servicio.

## 8. Procesamiento automatizado y servicios de terceros

SARA puede realizar un procesamiento automatizado del contenido (por ejemplo, extraer información de un currículo). Algunas funcionalidades pueden requerir servicios de terceros (por ejemplo, proveedores de IA).

- Cuando sea necesario, SARA solicitará su consentimiento explícito antes de enviar información a terceros.
- SARA procurará minimizar el intercambio de datos a lo estrictamente necesario.

## 9. Privacidad y datos personales

El tratamiento de datos personales se rige por la Política de Privacidad de SARA y la normativa aplicable. Se podrá solicitar consentimiento para actividades de tratamiento específicas (por ejemplo, análisis de currículos basado en IA).

## 10. Disponibilidad y mantenimiento

SARA se proporciona "tal cual" y puede estar sujeta a interrupciones, mantenimiento, cambios o discontinuación, especialmente al tratarse de un proyecto académico.

## 11. Exclusión de garantías

En la máxima medida permitida por la ley:

- SARA no garantiza un servicio ininterrumpido, libre de errores o completamente seguro.
- Cualquier análisis, predicción o recomendación tiene carácter informativo y no constituye asesoramiento profesional.

## 12. Limitación de responsabilidad

En la máxima medida permitida por la ley, SARA no será responsable de:

- Daños indirectos, pérdida de datos, lucro cesante o interrupciones del servicio.
- Decisiones tomadas por los usuarios basándose en los resultados de SARA.
- Incidentes derivados del uso de servicios de terceros.

## 13. Suspensión y terminación

SARA podrá suspender o cancelar el acceso si detecta un uso contrario a estos Términos o por motivos técnicos u operativos.

## 14. Modificaciones de estos términos

Estos Términos podrán ser actualizados. La versión vigente se publicará a través de esta web junto con su fecha de actualización.

## 15. Legislación aplicable y jurisdicción

Estos Términos se rigen por la legislación aplicable en el lugar donde se opera el proyecto. En caso de controversias, las partes intentarán una resolución amistosa antes de acudir a los tribunales.

## 16. Contacto

Para consultas relacionadas con estos Términos, utilice los canales de contacto proporcionados en SARA o en la documentación del proyecto.
`;
}

const TERMS_CONTENT = {
  en: getTermsEN,
  es: getTermsES
};

/**
 * Get terms and conditions content
 * @param {string} locale - Language locale ('en' or 'es', defaults to 'es')
 * @returns {Object} Document metadata and content
 */
function getTermsAndConditions(locale = 'es') {
  const normalizedLocale = resolveLocale(locale);
  const contentMarkdown = TERMS_CONTENT[normalizedLocale]();

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

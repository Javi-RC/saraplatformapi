/**
 * Risk Routes
 * REST API endpoints for risk prediction and case-based reasoning
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const riskController = require('../controllers/risk.controller');
const { requireOrganizationMember, requireRole } = require('../middleware/authorization');

const authenticate = passport.authenticate('jwt', { session: false });

/**
 * POST /api/projects/:id/risks/predict
 * Predict risks for a project
 * Requires: Project access
 */
router.post(
  '/projects/:id/risks/predict',
  authenticate,
  riskController.predictRisks
);

/**
 * GET /api/projects/:id/risks
 * Get all risk predictions for a project
 * Query params: status (active|resolved), occurred (true|false)
 * Requires: Project access
 */
router.get(
  '/projects/:id/risks',
  authenticate,
  riskController.getProjectRisks
);

/**
 * POST /api/projects/:id/risks/manual
 * Add a manual risk (discovered during project execution)
 * Requires: Project Manager
 */
router.post(
  '/projects/:id/risks/manual',
  authenticate,
  riskController.addManualRisk
);

/**
 * GET /api/projects/:id/risks/manual
 * Get manual risks for a project
 * Requires: Project access
 */
router.get(
  '/projects/:id/risks/manual',
  authenticate,
  riskController.getProjectManualRisks
);

/**
 * PUT /api/projects/:id/risks/:riskId
 * Update a manual risk during project execution
 * Requires: Project Manager
 */
router.put(
  '/projects/:id/risks/:riskId',
  authenticate,
  riskController.updateManualRisk
);

/**
 * DELETE /api/projects/:id/risks/:riskId
 * Delete a manual risk (only before project completion)
 * Requires: Project Manager
 */
router.delete(
  '/projects/:id/risks/:riskId',
  authenticate,
  riskController.deleteManualRisk
);

/**
 * GET /api/risks/:id
 * Get specific risk by ID
 * Requires: Authentication
 */
router.get(
  '/risks/:id',
  authenticate,
  riskController.getRiskById
);

/**
 * PUT /api/risks/:id/feedback
 * Update risk feedback (usefulness, accuracy)
 * Body: { usefulnessRating, accuracyRating, comments }
 * Requires: Authentication
 */
router.put(
  '/risks/:id/feedback',
  authenticate,
  riskController.updateRiskFeedback
);

/**
 * POST /api/projects/:id/outcome
 * Capture post-project outcome
 * Body: { actualEndDate, actualDuration, actualBudget, finalQuality, actualRisks, teamFeedback }
 * Requires: Project access
 */
router.post(
  '/projects/:id/outcome',
  authenticate,
  riskController.captureOutcome
);

/**
 * GET /api/projects/:id/outcome/form
 * Get pre-filled post-project form with predictions
 * Requires: Project access
 */
router.get(
  '/projects/:id/outcome/form',
  authenticate,
  riskController.getOutcomeForm
);

/**
 * GET /api/projects/:id/similar-cases
 * Find similar historical cases
 * Query params: limit (default: 5)
 * Requires: Project access
 */
router.get(
  '/projects/:id/similar-cases',
  authenticate,
  riskController.findSimilarCases
);

/**
 * GET /api/organizations/:id/risks/insights
 * Get risk insights for organization
 * Returns: common risks, patterns, recommendations
 * Requires: Organization access
 */
router.get(
  '/organizations/:id/risks/insights',
  authenticate,
  requireOrganizationMember,
  riskController.getOrganizationInsights
);

/**
 * GET /api/organizations/:id/risks/stats
 * Get risk statistics for organization
 * Returns: total risks, occurred, avoided, by type
 * Requires: Organization access
 */
router.get(
  '/organizations/:id/risks/stats',
  authenticate,
  requireOrganizationMember,
  riskController.getOrganizationStats
);

/**
 * GET /api/organizations/:id/risks/accuracy
 * Get prediction accuracy report
 * Returns: precision, recall, false positives/negatives
 * Requires: Organization access
 */
router.get(
  '/organizations/:id/risks/accuracy',
  authenticate,
  requireOrganizationMember,
  riskController.getAccuracyReport
);

/**
 * GET /api/organizations/:id/case-base/stats
 * Get case base statistics
 * Returns: total cases, by type, quality scores
 * Requires: Organization access
 */
router.get(
  '/organizations/:id/case-base/stats',
  authenticate,
  requireOrganizationMember,
  riskController.getCaseBaseStats
);

/**
 * GET /api/organizations/:id/case-base/cases
 * Get all cases for organization
 * Query params: type (organizational|generic|seed)
 * Requires: Organization access
 */
router.get(
  '/organizations/:id/case-base/cases',
  authenticate,
  requireOrganizationMember,
  riskController.getOrganizationCases
);

/**
 * GET /api/case-base/:id
 * Get specific case by ID
 * Requires: Authentication
 */
router.get(
  '/case-base/:id',
  authenticate,
  riskController.getCaseById
);

/**
 * POST /api/case-base/seed
 * Load seed cases into database
 * Requires: Admin role
 */
router.post(
  '/case-base/seed',
  authenticate,
  requireRole('org_admin'),
  riskController.loadSeedCases
);

/**
 * GET /api/case-base/seed
 * Get all seed cases
 * Requires: Admin role
 */
router.get(
  '/case-base/seed',
  authenticate,
  requireRole('org_admin'),
  riskController.getSeedCases
);

/**
 * GET /api/projects/:id/risks/cbr
 * NEW: Get CBR risks filtered by similarity threshold
 * Query params: minSimilarity (0.0-1.0, default 0.5)
 * Used by PM to select which learned risks to monitor
 * Requires: Project access
 */
router.get(
  '/projects/:id/risks/cbr',
  authenticate,
  riskController.getCBRRisks
);

/**
 * GET /api/projects/:id/risks/indicators
 * NEW: Get Decision Tree indicators (early warning signs)
 * Shows what CAN happen based on project patterns
 * Requires: Project access
 */
router.get(
  '/projects/:id/risks/indicators',
  authenticate,
  riskController.getDTIndicators
);

/**
 * POST /api/projects/:id/risks/accept
 * NEW: Accept specific CBR risks for active monitoring
 * Body: { riskIds: ['risk_type_1', 'risk_type_2'] }
 * Used by PM to confirm which learned risks to monitor
 * Requires: Project Manager role
 */
router.post(
  '/projects/:id/risks/accept',
  authenticate,
  riskController.acceptRisks
);

/**
 * DEBUG ENDPOINTS
 * Secret endpoints for development and testing
 */

/**
 * GET /api/risks/debug/all
 * Get all risks with full structure
 * For debugging and development only
 * Requires: Authentication
 */
router.get(
  '/risks/debug/all',
  authenticate,
  riskController.debugGetAllRisks
);

/**
 * GET /api/risks/debug/by-type/:type
 * Get all risks of a specific type
 * For debugging and development only
 * Requires: Authentication
 */
router.get(
  '/risks/debug/by-type/:type',
  authenticate,
  riskController.debugGetRisksByType
);

/**
 * GET /api/risks/debug/types-summary
 * Get summary statistics by risk type
 * For debugging and development only
 * Requires: Authentication
 */
router.get(
  '/risks/debug/types-summary',
  authenticate,
  riskController.debugGetRiskTypesSummary
);

module.exports = router;

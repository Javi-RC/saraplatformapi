/**
 * Risk Routes
 * REST API endpoints for risk prediction and case-based reasoning
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const riskController = require('../controllers/risk.controller');
const { requireOrganizationMember } = require('../middleware/authorization');

// Authentication middleware
const authenticate = passport.authenticate('jwt', { session: false });

// ========================================
// RISK PREDICTION ENDPOINTS
// ========================================

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

// ========================================
// PROJECT OUTCOME ENDPOINTS
// ========================================

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

// ========================================
// SIMILAR CASES ENDPOINT
// ========================================

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

// ========================================
// ORGANIZATION INSIGHTS ENDPOINTS
// ========================================

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

// ========================================
// CASE BASE ENDPOINTS
// ========================================

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

// ========================================
// SEED CASES ENDPOINTS (Admin)
// ========================================

/**
 * POST /api/case-base/seed
 * Load seed cases into database
 * Requires: Admin role
 */
router.post(
  '/case-base/seed',
  authenticate,
  // TODO: Add admin middleware
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
  // TODO: Add admin middleware
  riskController.getSeedCases
);

module.exports = router;

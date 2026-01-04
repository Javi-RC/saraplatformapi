/**
 * DOCUMENTATION: CBR + Decision Tree Risk Prediction System
 * ==========================================================
 * 
 * This system predicts project risks using a hybrid approach combining
 * expert rules (Decision Tree) with case-based reasoning (CBR).
 * 
 * ARCHITECTURE OVERVIEW
 * =====================
 * 
 * 1. MODELS (src/models/)
 *    - risk.model.js: Stores risk predictions and actual outcomes
 *    - caseBase.model.js: Stores historical project cases for learning
 *    - project.model.js: Updated with risk fields (riskPredictions, projectOutcome)
 * 
 * 2. SERVICES (src/services/)
 *    - decisionTree.service.js: Expert rules for 8 risk types
 *    - cbr.service.js: CBR 4Rs implementation (Retrieve, Reuse, Revise, Retain)
 *    - riskPrediction.service.js: Orchestrator combining both approaches
 *    - postProject.service.js: Captures outcomes and converts to cases
 *    - seedCases.service.js: Bootstrap with 5 generic industry cases
 * 
 * 3. API LAYER (src/controllers/ & src/routes/)
 *    - risk.controller.js: HTTP request handlers
 *    - risk.routes.js: REST API endpoints
 * 
 * HOW IT WORKS
 * ============
 * 
 * Phase 1: Bootstrap (0-5 cases)
 * -------------------------------
 * - Load seed cases from literature (PMI PMBOK, Standish Group)
 * - Decision Tree weight: 90%, CBR weight: 10%
 * - System relies mostly on expert rules
 * 
 * Phase 2: Initial Learning (6-15 cases)
 * ---------------------------------------
 * - Begin learning from organizational projects
 * - Decision Tree weight: 70%, CBR weight: 30%
 * - CBR starts contributing
 * 
 * Phase 3: Balanced (16-30 cases)
 * --------------------------------
 * - Equal contribution from both
 * - Decision Tree weight: 50%, CBR weight: 50%
 * 
 * Phase 4: Mature (31-50 cases)
 * ------------------------------
 * - CBR becomes dominant
 * - Decision Tree weight: 40%, CBR weight: 60%
 * 
 * Phase 5: Expert (51+ cases)
 * ----------------------------
 * - System relies heavily on experience
 * - Decision Tree weight: 30%, CBR weight: 70%
 * 
 * RISK TYPES
 * ==========
 * 
 * 1. communication_breakdown: Team coordination issues
 * 2. skill_gap: Missing technical expertise
 * 3. team_overload: Resource allocation problems
 * 4. dependency_blockage: Cross-team integration issues
 * 5. scope_creep: Requirements expansion
 * 6. process_mismatch: Methodology conflicts
 * 7. technical_infrastructure: Tech stack problems
 * 8. quality_degradation: Quality vs speed tradeoffs
 * 
 * API ENDPOINTS
 * =============
 * 
 * PREDICTION
 * ----------
 * POST /api/projects/:id/risks/predict
 *   - Predicts risks for a project
 *   - Returns: { risks, metadata, systemRecommendations }
 * 
 * GET /api/projects/:id/risks
 *   - Get all risk predictions for a project
 *   - Query params: status, occurred
 * 
 * GET /api/risks/:id
 *   - Get specific risk details
 * 
 * PUT /api/risks/:id/feedback
 *   - Update risk feedback (usefulness, accuracy)
 *   - Body: { usefulnessRating, accuracyRating, comments }
 * 
 * OUTCOME CAPTURE
 * ---------------
 * POST /api/projects/:id/outcome
 *   - Capture post-project outcome
 *   - Body: { actualEndDate, actualDuration, actualBudget, finalQuality, actualRisks, teamFeedback }
 *   - Automatically converts to CBR case
 * 
 * GET /api/projects/:id/outcome/form
 *   - Get pre-filled post-project form
 *   - Returns form with predicted risks
 * 
 * INSIGHTS
 * --------
 * GET /api/organizations/:id/risks/insights
 *   - Get risk patterns and recommendations
 * 
 * GET /api/organizations/:id/risks/stats
 *   - Get risk statistics (total, occurred, avoided)
 * 
 * GET /api/organizations/:id/risks/accuracy
 *   - Get prediction accuracy report (precision, recall)
 * 
 * CASE BASE
 * ---------
 * GET /api/organizations/:id/case-base/stats
 *   - Get case base statistics
 * 
 * GET /api/organizations/:id/case-base/cases
 *   - Get all cases for organization
 *   - Query params: type (organizational|generic|seed)
 * 
 * GET /api/case-base/:id
 *   - Get specific case details
 * 
 * GET /api/projects/:id/similar-cases
 *   - Find similar historical cases
 *   - Query params: limit (default: 5)
 * 
 * SEED CASES (Admin)
 * ------------------
 * POST /api/case-base/seed
 *   - Load seed cases into database
 * 
 * GET /api/case-base/seed
 *   - Get all seed cases
 * 
 * USAGE WORKFLOW
 * ==============
 * 
 * 1. SYSTEM INITIALIZATION
 *    - Load seed cases: POST /api/case-base/seed
 *    - Verify: GET /api/case-base/seed
 * 
 * 2. CREATE PROJECT
 *    - Create project normally through existing API
 *    - Project should have all required fields
 * 
 * 3. PREDICT RISKS
 *    - POST /api/projects/{projectId}/risks/predict
 *    - System returns predicted risks with:
 *      * Risk type and severity
 *      * Confidence score
 *      * Mitigation strategies
 *      * Based on similar cases (if any)
 * 
 * 4. MONITOR RISKS
 *    - GET /api/projects/{projectId}/risks
 *    - View all predicted risks
 *    - Provide feedback on risks as they occur or are avoided
 * 
 * 5. COMPLETE PROJECT
 *    - GET /api/projects/{projectId}/outcome/form
 *    - Fill out post-project form
 *    - POST /api/projects/{projectId}/outcome
 *    - System:
 *      * Updates risk prediction accuracy
 *      * Creates new CBR case
 *      * Generates learning report
 * 
 * 6. ANALYZE INSIGHTS
 *    - GET /api/organizations/{orgId}/risks/insights
 *    - View common risk patterns
 *    - Get system recommendations
 * 
 * SIMILARITY CALCULATION
 * ======================
 * 
 * Cases are compared across 5 dimensions:
 * 
 * 1. Coordination (25% weight)
 *    - Team size
 *    - Geographic distribution
 *    - Communication patterns
 * 
 * 2. Technical (30% weight)
 *    - Technologies used
 *    - Technical complexity
 *    - Infrastructure requirements
 * 
 * 3. Team (20% weight)
 *    - Team composition
 *    - Experience levels
 *    - Workload distribution
 * 
 * 4. Management (15% weight)
 *    - Project duration
 *    - Budget
 *    - Methodology
 * 
 * 5. Organizational (10% weight)
 *    - Organization size
 *    - Industry sector
 *    - Previous project count
 * 
 * Overall similarity = weighted sum of all dimensions
 * 
 * LEARNING PROCESS
 * ================
 * 
 * 1. Project starts with predictions from tree + CBR
 * 2. Project manager monitors risks during execution
 * 3. Project completes
 * 4. PM captures actual outcome:
 *    - Which predicted risks occurred?
 *    - Which new risks emerged?
 *    - What were the impacts?
 *    - What worked/didn't work?
 * 5. System updates:
 *    - Risk prediction accuracy
 *    - Creates new case in case base
 *    - Adjusts weights if needed
 * 6. Next project benefits from this learning
 * 
 * ACCURACY TRACKING
 * =================
 * 
 * For each risk prediction:
 * - True Positive: Predicted and occurred
 * - False Positive: Predicted but didn't occur
 * - False Negative: Didn't predict but occurred
 * - True Negative: Didn't predict and didn't occur
 * 
 * Metrics calculated:
 * - Precision: TP / (TP + FP) - How many predictions were correct?
 * - Recall: TP / (TP + FN) - How many actual risks were caught?
 * - Accuracy: (TP + TN) / Total - Overall correctness
 * - Severity accuracy: How close was predicted severity to actual?
 * 
 * EXPLAINABILITY
 * ==============
 * 
 * Every prediction includes:
 * 
 * 1. Risk details:
 *    - Type, severity, confidence
 *    - Description, indicators
 *    - Mitigation strategies
 * 
 * 2. Reasoning:
 *    - Tree-based reasoning (rule that triggered)
 *    - CBR-based reasoning (similar cases)
 *    - Weight distribution (tree vs CBR)
 * 
 * 3. Supporting evidence:
 *    - Similar historical cases
 *    - Similarity breakdown by dimension
 *    - Lessons learned from past projects
 * 
 * CONFIGURATION
 * =============
 * 
 * Key parameters (in riskPrediction.service.js):
 * 
 * - PHASE_THRESHOLDS: Case count thresholds for each phase
 * - PHASE_WEIGHTS: Tree/CBR weights for each phase
 * - MIN_SIMILARITY: Minimum similarity to consider a case (0.3)
 * - TOP_K_CASES: Number of similar cases to retrieve (5)
 * 
 * Dimension weights (in cbr.service.js):
 * - COORDINATION: 0.25
 * - TECHNICAL: 0.30
 * - TEAM: 0.20
 * - MANAGEMENT: 0.15
 * - ORGANIZATIONAL: 0.10
 * 
 * TESTING
 * =======
 * 
 * Test the system:
 * 
 * 1. Load seed cases
 * 2. Create test project with known risk factors
 * 3. Predict risks - verify you get expected risks
 * 4. Complete project and capture outcome
 * 5. Verify case was created in case base
 * 6. Create similar project
 * 7. Predict risks - verify previous project influences predictions
 * 8. Check insights and stats endpoints
 * 
 * TROUBLESHOOTING
 * ===============
 * 
 * "No cases found"
 * - Load seed cases first
 * - Check organization ID is correct
 * 
 * "Low confidence predictions"
 * - Normal in Phase 1 (0-5 cases)
 * - Will improve as case base grows
 * 
 * "Inaccurate predictions"
 * - Capture outcomes to improve learning
 * - Check project data completeness
 * - Verify similar projects exist
 * 
 * "Case not created after outcome"
 * - Check all required fields in outcome
 * - Verify user has permissions
 * - Check logs for errors
 * 
 * FUTURE ENHANCEMENTS
 * ===================
 * 
 * Potential improvements:
 * 
 * 1. Automated risk monitoring during project execution
 * 2. Real-time risk alerts when indicators detected
 * 3. Integration with project management tools
 * 4. Advanced similarity algorithms (ML embeddings)
 * 5. Cross-organization learning (anonymized)
 * 6. Predictive analytics dashboard
 * 7. Risk simulation and "what-if" scenarios
 * 8. Automated mitigation plan generation
 * 
 * REFERENCES
 * ==========
 * 
 * - Aamodt, A. & Plaza, E. (1994). Case-Based Reasoning: Foundational Issues
 * - PMI PMBOK Guide (6th Edition)
 * - Standish Group Chaos Report
 * - IEEE Software Engineering Body of Knowledge (SWEBOK)
 * 
 * SUPPORT
 * =======
 * 
 * For questions or issues:
 * - Check this documentation
 * - Review code comments in service files
 * - Check API response error messages
 * - Enable debug logging for detailed traces
 */

module.exports = {
  version: '1.0.0',
  name: 'CBR Risk Prediction System',
  description: 'Hybrid Decision Tree + CBR system for project risk prediction'
};

/**
 * Integration Test: CBR + Decision Tree Risk Prediction System
 * Tests the complete workflow from seed cases to predictions to outcome capture
 */

const mongoose = require('mongoose');
const Risk = require('../../src/models/risk.model');
const CaseBase = require('../../src/models/caseBase.model');
const Project = require('../../src/models/project.model');
const User = require('../../src/models/user.model');
const Organization = require('../../src/models/organization.model');
const seedCasesService = require('../../src/services/seedCases.service');
const riskPredictionService = require('../../src/services/riskPrediction.service');
const postProjectService = require('../../src/services/postProject.service');

describe('CBR Risk Prediction System - Integration Tests', () => {
  let testOrg;
  let testPM;
  let testProject;
  
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tfg-test');
    }
  });
  
  afterAll(async () => {
    // Clean up and disconnect
    await Risk.deleteMany({});
    await CaseBase.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Clean collections before each test
    await Risk.deleteMany({});
    await CaseBase.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
    
    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Organization',
      industry: 'technology',
      size: 'medium',
      country: 'Spain'
    });
    
    // Create test project manager
    testPM = await User.create({
      name: 'Test PM',
      email: 'pm@test.com',
      password: 'hashedpassword123',
      role: 'project_manager',
      isConfirmed: true
    });
  });
  
  describe('Phase 1: Bootstrap with Seed Cases', () => {
    test('should load seed cases successfully', async () => {
      const result = await seedCasesService.loadSeedCases();
      
      expect(result.success).toBe(true);
      expect(result.loaded).toBe(5);
      
      const seedCases = await CaseBase.find({ type: 'seed' });
      expect(seedCases).toHaveLength(5);
      
      // Verify seed case structure
      const firstCase = seedCases[0];
      expect(firstCase.problem).toBeDefined();
      expect(firstCase.solution).toBeDefined();
      expect(firstCase.result).toBeDefined();
      expect(firstCase.metadata.isGeneric).toBe(true);
    });
    
    test('should get seed cases', async () => {
      await seedCasesService.loadSeedCases();
      
      const seeds = await seedCasesService.getSeedCases();
      expect(seeds).toHaveLength(5);
      
      // Verify each seed has all risk types covered
      const riskTypes = seeds.flatMap(s => s.solution.actualRisks.map(r => r.type));
      expect(riskTypes).toContain('communication_breakdown');
      expect(riskTypes).toContain('skill_gap');
      expect(riskTypes).toContain('team_overload');
    });
  });
  
  describe('Phase 2: Risk Prediction', () => {
    beforeEach(async () => {
      await seedCasesService.loadSeedCases();
    });
    
    test('should predict risks for project with distributed team', async () => {
      // Create project with high communication risk factors
      testProject = await Project.create({
        projectName: 'Distributed Team Project',
        briefDescription: 'Multi-region development project',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 90, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        
        // Communication risk factors
        requiresSynchronousCommunication: 'yes',
        realTimeCommunicationLevel: 'high',
        weeklyMeetingsCount: 5,
        teamGeographicDistribution: 'international_multiple_continents',
        teamSizeRange: 'large',
        
        // Technology
        requiredTechnologies: ['Node.js', 'React', 'MongoDB'],
        technicalComplexity: 'high',
        
        status: 'draft'
      });
      
      const prediction = await riskPredictionService.predictProjectRisks(testProject._id);
      
      expect(prediction).toBeDefined();
      expect(prediction.risks).toBeDefined();
      expect(prediction.risks.length).toBeGreaterThan(0);
      
      // Should detect communication risk
      const commRisk = prediction.risks.find(r => r.riskType === 'communication_breakdown');
      expect(commRisk).toBeDefined();
      expect(commRisk.severity).toBe('high');
      expect(commRisk.confidence).toBeGreaterThan(0);
      
      // Verify metadata
      expect(prediction.metadata.caseBaseSize).toBe(5); // Only seed cases
      expect(prediction.metadata.systemPhase).toBe(1);
      expect(prediction.metadata.treeWeight).toBeGreaterThan(prediction.metadata.cbrWeight);
      
      // Verify recommendations
      expect(prediction.systemRecommendations).toBeDefined();
      expect(prediction.systemRecommendations.length).toBeGreaterThan(0);
    });
    
    test('should predict skill gap for new technology adoption', async () => {
      testProject = await Project.create({
        projectName: 'New Framework Project',
        briefDescription: 'Adopting new technology stack',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 60, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        
        // Skill gap factors
        requiredTechnologies: ['Rust', 'WebAssembly', 'GraphQL'], // New/uncommon
        technicalComplexity: 'high',
        teamSizeRange: 'small',
        teamComposition: {
          seniority: 'junior_majority',
          specialization: 'generalist'
        },
        
        status: 'draft'
      });
      
      const prediction = await riskPredictionService.predictProjectRisks(testProject._id);
      
      const skillGapRisk = prediction.risks.find(r => r.riskType === 'skill_gap');
      expect(skillGapRisk).toBeDefined();
      expect(['medium', 'high', 'critical']).toContain(skillGapRisk.severity);
    });
    
    test('should predict team overload for multi-project scenario', async () => {
      testProject = await Project.create({
        projectName: 'Concurrent Projects',
        briefDescription: 'Team working on multiple projects',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 45, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        
        // Overload factors
        teamSizeRange: 'small',
        expectedDuration: { value: 45, unit: 'days' },
        technicalComplexity: 'high',
        estimatedBudget: 50000,
        
        status: 'draft'
      });
      
      // Create another active project to simulate overload
      await Project.create({
        projectName: 'Another Active Project',
        briefDescription: 'Competing for resources',
        estimatedStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 40, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'active'
      });
      
      const prediction = await riskPredictionService.predictProjectRisks(testProject._id);
      
      const overloadRisk = prediction.risks.find(r => r.riskType === 'team_overload');
      expect(overloadRisk).toBeDefined();
    });
  });
  
  describe('Phase 3: Risk Monitoring and Feedback', () => {
    beforeEach(async () => {
      await seedCasesService.loadSeedCases();
    });
    
    test('should save risk predictions to database', async () => {
      testProject = await Project.create({
        projectName: 'Test Project',
        briefDescription: 'Testing risk storage',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 30, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'draft'
      });
      
      const prediction = await riskPredictionService.predictProjectRisks(testProject._id);
      
      // Verify risks saved to database
      const savedRisks = await Risk.find({ project: testProject._id });
      expect(savedRisks.length).toBe(prediction.risks.length);
      
      // Verify project updated with risk references
      const updatedProject = await Project.findById(testProject._id);
      expect(updatedProject.riskPredictions).toBeDefined();
      expect(updatedProject.riskPredictions.length).toBe(prediction.risks.length);
      expect(updatedProject.riskPredictionMetadata).toBeDefined();
    });
    
    test('should retrieve project risk predictions', async () => {
      testProject = await Project.create({
        projectName: 'Test Project',
        briefDescription: 'Testing risk retrieval',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 30, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'draft'
      });
      
      await riskPredictionService.predictProjectRisks(testProject._id);
      
      const risks = await riskPredictionService.getProjectRiskPredictions(testProject._id);
      
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
      expect(risks[0].project).toBeDefined();
    });
    
    test('should update risk with feedback', async () => {
      testProject = await Project.create({
        projectName: 'Test Project',
        briefDescription: 'Testing feedback',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 30, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'draft'
      });
      
      await riskPredictionService.predictProjectRisks(testProject._id);
      
      const risks = await Risk.find({ project: testProject._id });
      const firstRisk = risks[0];
      
      // Add feedback
      firstRisk.feedback = {
        usefulnessRating: 5,
        accuracyRating: 4,
        comments: 'Very helpful prediction',
        providedBy: testPM._id,
        providedAt: new Date()
      };
      
      await firstRisk.save();
      
      const updatedRisk = await Risk.findById(firstRisk._id);
      expect(updatedRisk.feedback.usefulnessRating).toBe(5);
      expect(updatedRisk.feedback.accuracyRating).toBe(4);
    });
  });
  
  describe('Phase 4: Outcome Capture and Learning', () => {
    beforeEach(async () => {
      await seedCasesService.loadSeedCases();
    });
    
    test('should capture project outcome and create case', async () => {
      // Create and predict
      testProject = await Project.create({
        projectName: 'Completed Project',
        briefDescription: 'Testing outcome capture',
        estimatedStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        estimatedEndDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 55, unit: 'days' },
        estimatedBudget: 100000,
        organization: testOrg._id,
        projectManager: testPM._id,
        actualStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        actualEndDate: new Date(),
        status: 'completed',
        requiredTechnologies: ['Node.js', 'React'],
        teamSizeRange: 'medium',
        technicalComplexity: 'medium'
      });
      
      await riskPredictionService.predictProjectRisks(testProject._id);
      
      // Capture outcome
      const outcomeData = {
        actualEndDate: new Date(),
        actualDuration: { value: 70, unit: 'days' }, // 15 days delay
        actualBudget: 115000, // 15% over budget
        finalQuality: 4,
        completionReason: 'successful',
        actualRisks: [
          {
            riskType: 'communication_breakdown',
            severity: 'medium',
            description: 'Some coordination issues arose',
            mitigationActions: ['Daily standups', 'Slack channels'],
            impact: 'Caused 5 day delay'
          }
        ],
        teamFeedback: {
          satisfactionLevel: 4,
          workloadLevel: 3,
          communicationQuality: 4,
          comments: 'Good project overall, some challenges'
        },
        lessonsLearned: ['Need better initial planning', 'More frequent check-ins'],
        successfulPractices: ['Daily standups', 'Code reviews'],
        unsuccessfulPractices: ['Async-only communication']
      };
      
      const result = await postProjectService.captureProjectOutcome(
        testProject._id,
        outcomeData,
        testPM._id
      );
      
      expect(result.success).toBe(true);
      expect(result.caseCreated).toBe(true);
      expect(result.caseId).toBeDefined();
      expect(result.learningReport).toBeDefined();
      
      // Verify case was created
      const newCase = await CaseBase.findById(result.caseId);
      expect(newCase).toBeDefined();
      expect(newCase.type).toBe('organizational');
      expect(newCase.solution.delayDays).toBe(15);
      expect(newCase.solution.budgetOverrun).toBe(15);
      expect(newCase.result.lessonsLearned).toHaveLength(2);
      
      // Verify case base size increased
      const allCases = await CaseBase.find({});
      expect(allCases.length).toBe(6); // 5 seeds + 1 new
    });
    
    test('should update risk prediction accuracy after outcome', async () => {
      testProject = await Project.create({
        projectName: 'Test Accuracy',
        briefDescription: 'Testing accuracy tracking',
        estimatedStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        estimatedEndDate: new Date(),
        expectedDuration: { value: 30, unit: 'days' },
        estimatedBudget: 50000,
        organization: testOrg._id,
        projectManager: testPM._id,
        actualStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        actualEndDate: new Date(),
        status: 'completed',
        requiredTechnologies: ['Node.js'],
        teamSizeRange: 'small'
      });
      
      await riskPredictionService.predictProjectRisks(testProject._id);
      
      const outcomeData = {
        actualEndDate: new Date(),
        actualDuration: { value: 32, unit: 'days' },
        actualBudget: 52000,
        finalQuality: 5,
        completionReason: 'successful',
        actualRisks: [
          {
            riskType: 'skill_gap',
            severity: 'low',
            description: 'Minor learning curve',
            mitigationActions: ['Training sessions']
          }
        ],
        teamFeedback: {
          satisfactionLevel: 5,
          workloadLevel: 3,
          communicationQuality: 5
        }
      };
      
      await postProjectService.captureProjectOutcome(
        testProject._id,
        outcomeData,
        testPM._id
      );
      
      // Check if risks were updated
      const risks = await Risk.find({ project: testProject._id });
      const occurredRisks = risks.filter(r => r.occurred !== undefined);
      
      expect(occurredRisks.length).toBeGreaterThan(0);
    });
  });
  
  describe('Phase 5: Learning Validation', () => {
    beforeEach(async () => {
      await seedCasesService.loadSeedCases();
    });
    
    test('should use new organizational case in next prediction', async () => {
      // Create and complete first project
      const project1 = await Project.create({
        projectName: 'First Project',
        briefDescription: 'Communication heavy project',
        estimatedStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        estimatedEndDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 60, unit: 'days' },
        estimatedBudget: 100000,
        organization: testOrg._id,
        projectManager: testPM._id,
        actualStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        actualEndDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'completed',
        
        // High communication factors
        requiresSynchronousCommunication: 'yes',
        realTimeCommunicationLevel: 'high',
        weeklyMeetingsCount: 5,
        teamGeographicDistribution: 'international_multiple_continents',
        requiredTechnologies: ['React', 'Node.js'],
        teamSizeRange: 'large'
      });
      
      await riskPredictionService.predictProjectRisks(project1._id);
      
      // Capture outcome with communication breakdown
      await postProjectService.captureProjectOutcome(
        project1._id,
        {
          actualEndDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          actualDuration: { value: 75, unit: 'days' },
          actualBudget: 120000,
          finalQuality: 3,
          completionReason: 'successful',
          actualRisks: [{
            riskType: 'communication_breakdown',
            severity: 'high',
            description: 'Major timezone coordination issues',
            impact: 'Caused 15 day delay and quality issues'
          }],
          teamFeedback: {
            satisfactionLevel: 3,
            workloadLevel: 4,
            communicationQuality: 2,
            comments: 'Timezone challenges were significant'
          },
          lessonsLearned: ['Need overlap hours', 'Better async documentation']
        },
        testPM._id
      );
      
      // Create similar new project
      const project2 = await Project.create({
        projectName: 'Similar Project',
        briefDescription: 'Another communication heavy project',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 60, unit: 'days' },
        estimatedBudget: 100000,
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'draft',
        
        // Similar factors
        requiresSynchronousCommunication: 'yes',
        realTimeCommunicationLevel: 'high',
        weeklyMeetingsCount: 5,
        teamGeographicDistribution: 'international_multiple_continents',
        requiredTechnologies: ['React', 'Node.js'],
        teamSizeRange: 'large'
      });
      
      const prediction2 = await riskPredictionService.predictProjectRisks(project2._id);
      
      // Should have higher CBR weight now (6 cases total)
      expect(prediction2.metadata.caseBaseSize).toBe(6);
      expect(prediction2.metadata.systemPhase).toBe(2); // Phase 2: 6-15 cases
      expect(prediction2.metadata.cbrWeight).toBeGreaterThan(0.1);
      
      // Should predict communication breakdown with high confidence
      const commRisk = prediction2.risks.find(r => r.riskType === 'communication_breakdown');
      expect(commRisk).toBeDefined();
      expect(commRisk.basedOnCases).toBeDefined();
      expect(commRisk.basedOnCases.length).toBeGreaterThan(0);
      
      // Should reference our organizational case
      const orgCase = commRisk.basedOnCases.find(bc => {
        return bc.caseType === 'organizational';
      });
      expect(orgCase).toBeDefined();
    });
    
    test('should improve accuracy over multiple projects', async () => {
      // Simulate multiple project cycles
      for (let i = 0; i < 3; i++) {
        const project = await Project.create({
          projectName: `Learning Project ${i + 1}`,
          briefDescription: `Project ${i + 1} for learning`,
          estimatedStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          estimatedEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          expectedDuration: { value: 50, unit: 'days' },
          estimatedBudget: 75000,
          organization: testOrg._id,
          projectManager: testPM._id,
          actualStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          status: 'completed',
          requiredTechnologies: ['Node.js', 'React'],
          teamSizeRange: 'medium',
          technicalComplexity: 'medium'
        });
        
        await riskPredictionService.predictProjectRisks(project._id);
        
        await postProjectService.captureProjectOutcome(
          project._id,
          {
            actualEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            actualDuration: { value: 50 + i * 5, unit: 'days' },
            actualBudget: 75000 + i * 5000,
            finalQuality: 4,
            completionReason: 'successful',
            actualRisks: [],
            teamFeedback: {
              satisfactionLevel: 4,
              workloadLevel: 3,
              communicationQuality: 4
            }
          },
          testPM._id
        );
      }
      
      // Now case base should have 8 cases (5 seeds + 3 organizational)
      const caseBaseStats = await CaseBase.getCaseBaseStats();
      expect(caseBaseStats.total).toBe(8);
      expect(caseBaseStats.byType.organizational).toBe(3);
      
      // System should be in Phase 2
      const finalProject = await Project.create({
        projectName: 'Final Test Project',
        briefDescription: 'Testing improved predictions',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 50, unit: 'days' },
        estimatedBudget: 75000,
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'draft',
        requiredTechnologies: ['Node.js', 'React'],
        teamSizeRange: 'medium'
      });
      
      const finalPrediction = await riskPredictionService.predictProjectRisks(finalProject._id);
      
      expect(finalPrediction.metadata.systemPhase).toBe(2);
      expect(finalPrediction.metadata.cbrWeight).toBeGreaterThan(0.25);
    });
  });
  
  describe('Phase 6: Organization Insights', () => {
    beforeEach(async () => {
      await seedCasesService.loadSeedCases();
    });
    
    test('should generate organization risk insights', async () => {
      // Create multiple projects with outcomes
      for (let i = 0; i < 3; i++) {
        const project = await Project.create({
          projectName: `Insight Project ${i + 1}`,
          briefDescription: `Project for insights`,
          estimatedStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          estimatedEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          expectedDuration: { value: 50, unit: 'days' },
          organization: testOrg._id,
          projectManager: testPM._id,
          actualStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          status: 'completed',
          requiredTechnologies: ['Node.js'],
          teamSizeRange: 'medium'
        });
        
        await riskPredictionService.predictProjectRisks(project._id);
      }
      
      const insights = await riskPredictionService.getOrganizationRiskInsights(testOrg._id);
      
      expect(insights).toBeDefined();
      expect(insights.commonRisks).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(Array.isArray(insights.recommendations)).toBe(true);
    });
    
    test('should calculate organization risk statistics', async () => {
      const project = await Project.create({
        projectName: 'Stats Project',
        briefDescription: 'Project for stats',
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedDuration: { value: 30, unit: 'days' },
        organization: testOrg._id,
        projectManager: testPM._id,
        status: 'draft',
        requiredTechnologies: ['Node.js'],
        teamSizeRange: 'small'
      });
      
      await riskPredictionService.predictProjectRisks(project._id);
      
      const stats = await Risk.getOrganizationStats(testOrg._id);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byType).toBeDefined();
    });
  });
});

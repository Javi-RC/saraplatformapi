const mongoose = require('mongoose');
require('dotenv').config();

async function debugRiskDetection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Project = require('./src/models/project.model');
    const decisionTreeService = require('./src/services/decisionTree.service');
    const teamAnalysisService = require('./src/services/teamAnalysis.service');
    
    const project = await Project.findOne({ 
      projectName: /E-Commerce Platform Modernization/i 
    }).populate('organization');
    
    console.log('📋 Project Configuration:');
    console.log('  Dependencies:', project.dependencies?.length || 0);
    console.log('  Involved Teams:', project.involvedTeams?.length || 0);
    console.log('  Shared Infra:', project.sharedInfrastructureDependency);
    console.log('  Work Mode:', project.workMode || 'inherit_from_organization');
    console.log('  CI/CD:', project.hasVersionControlAndCICD);
    console.log('  Documentation:', project.documentationLevel);
    console.log('  Complexity:', project.systemComplexity);
    console.log('  Description length:', project.briefDescription?.length);
    console.log('  Has Standardization:', project.hasStandardization);
    
    console.log('\n\ud83c\udfe2 Organization Configuration:');
    console.log('  Name:', project.organization?.name);
    console.log('  Work Mode Policy:', project.organization?.workModePolicy);
    console.log('  Provides Equipment:', project.organization?.providesHomeOfficeEquipment);
    console.log('  Provides Ergonomics:', project.organization?.providesErgonomicsSupport);
    console.log('  Provides Internet:', project.organization?.providesInternetStipend);
    
    const teamAnalysis = await teamAnalysisService.getTeamAnalysis(project._id);
    
    console.log('\n🔍 Testing Individual Risk Rules:');
    
    // Test Dependency Risk
    const depRisk = decisionTreeService.checkDependencyRisk(project);
    console.log('  Dependency Risk:', depRisk ? `✓ ${depRisk.severity}` : '✗ Not detected');
    
    // Test Scope Creep
    const scopeRisk = decisionTreeService.checkScopeCreepRisk(project);
    console.log('  Scope Creep Risk:', scopeRisk ? `✓ ${scopeRisk.severity}` : '✗ Not detected');
    
    // Test Infrastructure
    const infraRisk = decisionTreeService.checkInfrastructureRisk(project);
    console.log('  Infrastructure Risk:', infraRisk ? `✓ ${infraRisk.severity}` : '✗ Not detected');
    
    // Test Knowledge Management
    const kmRisk = decisionTreeService.checkKnowledgeManagementRisk(project, teamAnalysis.team, teamAnalysis.organization);
    console.log('  Knowledge Mgmt Risk:', kmRisk ? `✓ ${kmRisk.severity}` : '✗ Not detected');
    
    // Test Home Infrastructure Gap
    const homeRisk = decisionTreeService.checkHomeInfrastructureGap(project, teamAnalysis.team, teamAnalysis.organization);
    console.log('  Home Infra Risk:', homeRisk ? `✓ ${homeRisk.severity}` : '✗ Not detected');
    
    // Test Process Risk
    const processRisk = decisionTreeService.checkProcessRisk(project, teamAnalysis.team);
    console.log('  Process Risk:', processRisk ? `✓ ${processRisk.severity}` : '✗ Not detected');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugRiskDetection();

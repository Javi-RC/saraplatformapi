const mongoose = require('mongoose');
require('dotenv').config();

async function editProjectForMaxRisks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const Project = require('./src/models/project.model');
    const Organization = require('./src/models/organization.model');
    
    // Find the project
    const project = await Project.findOne({ 
      projectName: /E-Commerce Platform Modernization/i 
    }).populate('organization');
    
    if (!project) {
      console.log('❌ Project not found');
      process.exit(1);
    }
    
    console.log('✓ Found project:', project.projectName);
    console.log('  Current complexity:', project.systemComplexity);
    console.log('  Current CI/CD:', project.hasVersionControlAndCICD);
    
    // Configure project to trigger ALL risks without team
    project.briefDescription = 'Project'; // Very short description
    project.requiredExperienceLevel = 'expert';
    project.documentationLevel = 'none';
    project.rolesAndResponsibilities = []; // No roles defined
    project.hasVersionControlAndCICD = 'no';
    project.hasOnboardingProcesses = 'no';
    project.sharedInfrastructureDependency = 'high';
    project.internalToolsFragmentation = 'high';
    project.requiresSpecializedTools = {
      needed: true,
      description: 'Complex DevOps and Legacy System Integration tools required'
    };
    project.workMode = 'remote_mode';
    project.distributedWorkExperienceLevel = 'low';
    project.mainMethodology = 'waterfall';
    
    // Add multiple dependencies
    project.dependencies = [
      {
        name: 'Payment Gateway Team',
        type: 'critical',
        criticality: 'critical',
        provider: 'Payment Team',
        description: 'Payment processing integration'
      },
      {
        name: 'Legacy Database Migration',
        type: 'critical',
        criticality: 'critical',
        provider: 'DBA Team',
        description: 'Database schema migration'
      },
      {
        name: 'Authentication Service',
        type: 'critical',
        criticality: 'critical',
        provider: 'Security Team',
        description: 'OAuth integration'
      },
      {
        name: 'CDN Infrastructure',
        type: 'critical',
        criticality: 'critical',
        provider: 'Infrastructure Team',
        description: 'Content delivery setup'
      }
    ];
    
    project.involvedTeams = [
      { teamName: 'Payment Gateway Team', dependencyLevel: 'high' },
      { teamName: 'DBA Team', dependencyLevel: 'high' },
      { teamName: 'Security Team', dependencyLevel: 'high' },
      { teamName: 'Infrastructure Team', dependencyLevel: 'high' },
      { teamName: 'Frontend Team', dependencyLevel: 'medium' }
    ];
    project.hasStandardization = false;
    project.expectedDuration = { value: 12, unit: 'months' };
    
    await project.save();
    console.log('\n✅ Project updated successfully');
    
    // Update organization for remote work risks
    if (project.organization) {
      const org = await Organization.findById(project.organization._id || project.organization);
      if (org) {
        org.workModePolicy = 'remote_mode';
        org.providesHomeOfficeEquipment = false;
        org.providesErgonomicsSupport = false;
        org.providesInternetStipend = false;
        await org.save();
        console.log('✅ Organization updated for remote work risks');
      }
    }
    
    console.log('\n📋 Project configured to trigger maximum risks:');
    console.log('  - Very short description (Scope Creep)');
    console.log('  - High complexity without documentation');
    console.log('  - No CI/CD (Infrastructure Risk)');
    console.log('  - 4 critical dependencies (Dependency Risk)');
    console.log('  - High shared infrastructure');
    console.log('  - No standardization (Knowledge Management)');
    console.log('  - Fully remote without equipment (Home Infrastructure)');
    console.log('  - High tool fragmentation');
    console.log('  - Long duration without processes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

editProjectForMaxRisks();

/**
 * Team Analysis Service
 * Analyzes team composition, skills, experience, personality and organization context
 * Used by Decision Tree and CBR services for accurate risk prediction
 * 
 * Enhanced with personality synergy analysis for better team insights
 */

const { userRepository, cvRepository, bfi44Repository, organizationRepository, projectRepository } = require('../../repositories');
const teamSynergyService = require('./teamSynergy.service');
const AppError = require('../../utils/AppError');
const { getConfigSection } = require('../../config/teamSelectionDefaults');

/**
 * Helper function to extract organization ID
 * Handles both populated and non-populated organization fields
 */
function getOrganizationId(organization) {
  if (!organization) return null;
  return organization._id || organization;
}

/**
 * Get complete team analysis for a project
 * Includes technical analysis and personality synergy metrics
 * 
 * @param {ObjectId} projectId - Project ID
 * @param {boolean} includeSynergyAnalysis - Include personality synergy analysis (default: true)
 * @returns {Promise<Object>} Complete team analysis
 */
async function getTeamAnalysis(projectId, includeSynergyAnalysis = true) {
  try {
    const project = await projectRepository.findById(projectId, {
      populate: [
        {
          path: 'assignedEmployees.user',
          select: 'name email role organization'
        },
        {
          path: 'organization',
          select: 'name industry size address employees projects'
        },
        {
          path: 'projectManager',
          select: 'name email'
        }
      ]
    });
      
    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }
    
    const teamMemberIds = project.assignedEmployees
      .filter(emp => emp.user != null)
      .map(emp => emp.user._id || emp.user);
    
    const cvs = await cvRepository.find({ 
      userId: { $in: teamMemberIds },
      organizationStatus: 'accepted'
    });
    
    const bfi44Results = await bfi44Repository.find({
      userId: { $in: teamMemberIds }
    });
    
    const organizationId = getOrganizationId(project.organization);
    
    const otherProjects = await projectRepository.find({
      organization: organizationId,
      _id: { $ne: projectId },
      status: { $in: ['active', 'draft'] },
      'assignedEmployees.user': { $in: teamMemberIds }
    }, {
      select: 'projectName assignedEmployees expectedDuration estimatedEndDate'
    });
    
    const teamAnalysis = analyzeTeamComposition(project, cvs, bfi44Results, otherProjects);
    
    // Analyze organization context for risk detection
    const organizationContext = analyzeOrganizationContext(project.organization, project);
    
    let synergyAnalysis = null;
    if (includeSynergyAnalysis && teamAnalysis.personality.available) {
      try {
        synergyAnalysis = await teamSynergyService.explainTeamSynergy(
          project.assignedEmployees,
          {
            projectType: project.projectType,
            requiredExperienceLevel: project.requiredExperienceLevel,
            expectedDuration: project.expectedDuration,
            isInnovative: project.isInnovative,
            isMaintenance: project.isMaintenance,
            synergyWeights: getConfigSection(project, 'phase2')?.synergyWeights
          }
        );
      } catch (error) {
        console.error('Error calculating team synergy:', error);
      }
    }
    
    return {
      project,
      team: teamAnalysis,
      organization: organizationContext,
      synergy: synergyAnalysis,
      otherProjects
    };
    
  } catch (error) {
    console.error('Error in team analysis:', error);
    throw error;
  }
}

/**
 * Analyze team composition, skills, experience, and personality
 */
function analyzeTeamComposition(project, cvs, bfi44Results, otherProjects) {
  const analysis = {
    size: project.assignedEmployees.length,
    skills: extractTeamSkills(cvs),
    experience: analyzeTeamExperience(cvs, project),
    languages: analyzeTeamLanguages(cvs, project),
    personality: analyzeTeamPersonality(bfi44Results),
    workload: analyzeTeamWorkload(project, otherProjects),
    technicalMatch: analyzeTechnicalMatch(cvs, project),
    experienceMatch: analyzeExperienceMatch(cvs, project),
    availability: analyzeTeamAvailability(project, otherProjects)
  };
  
  return analysis;
}

/**
 * Extract all technical skills from team curricula
 */
function extractTeamSkills(cvs) {
  const allSkills = new Set();
  const skillLevels = {};
  const skillCategories = {
    programming: new Set(),
    frameworks: new Set(),
    databases: new Set(),
    tools: new Set(),
    cloud: new Set(),
    other: new Set()
  };
  
  cvs.forEach(cv => {
    if (cv.skills && cv.skills.technical && Array.isArray(cv.skills.technical)) {
      cv.skills.technical.forEach(skill => {
        const skillName = skill.name.toLowerCase();
        allSkills.add(skillName);
        
        const proficiency = skill.level || 'intermedio';
        if (!skillLevels[skillName] || 
            getProficiencyScore(proficiency) > getProficiencyScore(skillLevels[skillName])) {
          skillLevels[skillName] = proficiency;
        }
        
        categorizeSkill(skillName, skill.category || 'other', skillCategories);
      });
    }
  });
  
  return {
    all: Array.from(allSkills),
    levels: skillLevels,
    categories: {
      programming: Array.from(skillCategories.programming),
      frameworks: Array.from(skillCategories.frameworks),
      databases: Array.from(skillCategories.databases),
      tools: Array.from(skillCategories.tools),
      cloud: Array.from(skillCategories.cloud),
      other: Array.from(skillCategories.other)
    },
    count: allSkills.size
  };
}

/**
 * Analyze team experience levels
 */
function analyzeTeamExperience(cvs, project) {
  const experiences = [];
  let totalYears = 0;
  let relevantExperience = 0;
  
  cvs.forEach(cv => {
    if (cv.experience && Array.isArray(cv.experience)) {
      cv.experience.forEach(exp => {
        const years = calculateYearsOfExperience(exp.startDate, exp.endDate);
        totalYears += years;
        
        if (isRelevantExperience(exp, project)) {
          relevantExperience += years;
        }
        
        experiences.push({
          title: exp.title,
          years: years,
          technologies: exp.technologies || [],
          relevant: isRelevantExperience(exp, project)
        });
      });
    }
  });
  
  const avgYearsPerPerson = cvs.length > 0 ? totalYears / cvs.length : 0;
  
  let overallLevel = 'junior';
  if (avgYearsPerPerson >= 7) overallLevel = 'expert';
  else if (avgYearsPerPerson >= 5) overallLevel = 'senior';
  else if (avgYearsPerPerson >= 2) overallLevel = 'mid';
  
  return {
    totalYears,
    avgYearsPerPerson,
    relevantExperience,
    overallLevel,
    distribution: {
      junior: experiences.filter(e => e.years < 2).length,
      mid: experiences.filter(e => e.years >= 2 && e.years < 5).length,
      senior: experiences.filter(e => e.years >= 5 && e.years < 7).length,
      expert: experiences.filter(e => e.years >= 7).length
    }
  };
}

/**
 * Analyze team language proficiencies
 */
function analyzeTeamLanguages(cvs, project) {
  const languageCoverage = new Map();
  const requiredLanguages = project.requiredLanguages || [];
  const minProficiency = project.minimumLanguageProficiency || 'B1';
  
  cvs.forEach(cv => {
    if (cv.languages && Array.isArray(cv.languages)) {
      cv.languages.forEach(lang => {
        const langName = lang.language.toLowerCase();
        const proficiencyScore = getLanguageProficiencyScore(lang.level);
        
        if (!languageCoverage.has(langName)) {
          languageCoverage.set(langName, {
            speakers: 0,
            maxProficiency: lang.level,
            maxScore: proficiencyScore
          });
        }
        
        const current = languageCoverage.get(langName);
        current.speakers++;
        
        if (proficiencyScore > current.maxScore) {
          current.maxProficiency = lang.level;
          current.maxScore = proficiencyScore;
        }
      });
    }
  });
  

  const missingLanguages = [];
  const insufficientProficiency = [];
  
  requiredLanguages.forEach(reqLang => {
    const langName = reqLang.toLowerCase();
    const coverage = languageCoverage.get(langName);
    
    if (!coverage) {
      missingLanguages.push(reqLang);
    } else {
      const minScore = getLanguageProficiencyScore(minProficiency);
      if (coverage.maxScore < minScore) {
        insufficientProficiency.push({
          language: reqLang,
          required: minProficiency,
          actual: coverage.maxProficiency
        });
      }
    }
  });
  
  return {
    coverage: Object.fromEntries(languageCoverage),
    missingLanguages,
    insufficientProficiency,
    hasAllRequired: missingLanguages.length === 0 && insufficientProficiency.length === 0
  };
}

/**
 * Analyze team personality traits (BFI-44)
 */
function analyzeTeamPersonality(bfi44Results) {
  if (!bfi44Results || bfi44Results.length === 0) {
    return {
      available: false,
      message: 'No personality data available'
    };
  }
  
  const traits = {
    Extraversion: [],
    Agreeableness: [],
    Conscientiousness: [],
    Neuroticism: [],
    Openness: []
  };
  
  bfi44Results.forEach(result => {
    Object.keys(traits).forEach(trait => {
      if (result.results && result.results[trait] !== undefined) {
        traits[trait].push(result.results[trait]);
      }
    });
  });
  
  const analysis = {};
  Object.keys(traits).forEach(trait => {
    if (traits[trait].length > 0) {
      const avg = traits[trait].reduce((a, b) => a + b, 0) / traits[trait].length;
      const min = Math.min(...traits[trait]);
      const max = Math.max(...traits[trait]);
      const variance = calculateVariance(traits[trait]);
      
      analysis[trait] = {
        average: avg,
        min,
        max,
        variance,
        distribution: traits[trait]
      };
    }
  });
  
  const concerns = [];
  
  if (analysis.Neuroticism && analysis.Neuroticism.average > 3.5) {
    concerns.push({
      type: 'high_stress_tendency',
      severity: 'medium',
      description: 'Team has high average neuroticism - may struggle under pressure'
    });
  }
  
  if (analysis.Conscientiousness && analysis.Conscientiousness.average < 2.5) {
    concerns.push({
      type: 'low_discipline',
      severity: 'high',
      description: 'Team has low conscientiousness - quality and deadline risks'
    });
  }
  
  if (analysis.Agreeableness && analysis.Agreeableness.variance > 1.5) {
    concerns.push({
      type: 'personality_conflict',
      severity: 'medium',
      description: 'Wide variance in agreeableness - potential for interpersonal conflicts'
    });
  }
  
  if (analysis.Openness && analysis.Openness.average < 2.5) {
    concerns.push({
      type: 'low_adaptability',
      severity: 'medium',
      description: 'Team has low openness - may resist new technologies or methods'
    });
  }
  
  return {
    available: true,
    traits: analysis,
    concerns,
    teamCoverage: (bfi44Results.length / traits.Extraversion.length) * 100
  };
}

/**
 * Analyze team workload across multiple projects
 */
function analyzeTeamWorkload(project, otherProjects) {
  const memberWorkload = new Map();
  
  project.assignedEmployees
    .filter(emp => emp.user != null)
    .forEach(emp => {
      const userId = (emp.user._id || emp.user).toString();
      memberWorkload.set(userId, {
        projects: 1,
        totalHours: project.weeklyHoursPerMember || 40,
        projectNames: [project.projectName]
      });
    });
  
  // Add workload from other active projects
  otherProjects.forEach(otherProject => {
    otherProject.assignedEmployees
      .filter(emp => emp.user != null)
      .forEach(emp => {
      const userId = (emp.user._id || emp.user).toString();
      
      if (memberWorkload.has(userId)) {
        const current = memberWorkload.get(userId);
        current.projects++;
        current.totalHours += otherProject.weeklyHoursPerMember || 40;
        current.projectNames.push(otherProject.projectName);
      }
    });
  });
  
  // Analyze overload
  let overloadedMembers = 0;
  let maxProjects = 0;
  let maxHours = 0;
  
  memberWorkload.forEach(workload => {
    if (workload.totalHours > 45 || workload.projects > 2) {
      overloadedMembers++;
    }
    maxProjects = Math.max(maxProjects, workload.projects);
    maxHours = Math.max(maxHours, workload.totalHours);
  });
  
  return {
    memberWorkload: Object.fromEntries(memberWorkload),
    overloadedMembers,
    maxConcurrentProjects: maxProjects,
    maxWeeklyHours: maxHours,
    avgProjectsPerMember: Array.from(memberWorkload.values()).reduce((sum, w) => sum + w.projects, 0) / memberWorkload.size,
    isOverloaded: overloadedMembers > 0
  };
}

/**
 * Analyze technical skills match with project requirements
 */
function analyzeTechnicalMatch(cvs, project) {
  const requiredTechs = project.mainTechnologies || [];
  const teamSkills = extractTeamSkills(cvs);
  
  // Early return if no technologies are defined in the project
  if (requiredTechs.length === 0) {
    return {
      matches: [],
      missing: [],
      partial: [],
      matchPercentage: null, // Changed from 100 to null to indicate no comparison possible
      hasAllRequired: false,
      avgProficiency: 0,
      noProjectTechnologies: true, // Flag to indicate project has no technologies defined
      teamHasSkills: teamSkills.count > 0,
      teamSkillCount: teamSkills.count
    };
  }
  
  // Early return if team has no skills
  if (teamSkills.count === 0) {
    return {
      matches: [],
      missing: requiredTechs.map(tech => tech),
      partial: [],
      matchPercentage: 0,
      hasAllRequired: false,
      avgProficiency: 0,
      noTeamSkills: true, // Flag to indicate team has no skills
      projectTechCount: requiredTechs.length
    };
  }
  
  const matches = [];
  const missing = [];
  const partial = [];
  
  requiredTechs.forEach(tech => {
    const techLower = tech.toLowerCase();
    
    if (teamSkills.all.includes(techLower)) {
      const proficiency = teamSkills.levels[techLower];
      matches.push({
        technology: tech,
        proficiency,
        proficiencyScore: getProficiencyScore(proficiency)
      });
    } else {
      // Check for similar/related technologies
      const related = findRelatedSkills(techLower, teamSkills.all);
      
      if (related.length > 0) {
        partial.push({
          technology: tech,
          relatedSkills: related
        });
      } else {
        missing.push(tech);
      }
    }
  });
  
  const matchPercentage = requiredTechs.length > 0 
    ? (matches.length / requiredTechs.length) * 100 
    : 100;
    
  return {
    matches,
    missing,
    partial,
    matchPercentage,
    hasAllRequired: missing.length === 0,
    avgProficiency: matches.length > 0
      ? matches.reduce((sum, m) => sum + m.proficiencyScore, 0) / matches.length
      : 0,
    noProjectTechnologies: false,
    noTeamSkills: false
  };
}

/**
 * Analyze experience match with project requirements
 */
function analyzeExperienceMatch(cvs, project) {
  const required = project.requiredExperienceLevel || 'mid';
  const teamExp = analyzeTeamExperience(cvs, project);
  
  const requiredScore = getExperienceLevelScore(required);
  const actualScore = getExperienceLevelScore(teamExp.overallLevel);
  
  return {
    required,
    actual: teamExp.overallLevel,
    match: actualScore >= requiredScore,
    gap: requiredScore - actualScore,
    relevantExperienceYears: teamExp.relevantExperience
  };
}

/**
 * Analyze team availability considering all project commitments
 */
function analyzeTeamAvailability(project, otherProjects) {
  const requiredHours = project.weeklyHoursPerMember || 40;
  const afterHours = project.requiresAfterHoursAvailability;
  const hasHighLoadPeriods = project.highLoadPeriods && project.highLoadPeriods.length > 0;
  
  // Check if team members are stretched across multiple projects
  const concurrentProjects = otherProjects.length;
  
  let availabilityScore = 100;
  const issues = [];
  
  if (concurrentProjects > 1) {
    availabilityScore -= concurrentProjects * 15;
    issues.push(`Team members on ${concurrentProjects + 1} concurrent projects`);
  }
  
  if (requiredHours > 40) {
    availabilityScore -= (requiredHours - 40) * 2;
    issues.push(`Requires ${requiredHours}h/week (above standard 40h)`);
  }
  
  if (afterHours === 'yes') {
    availabilityScore -= 20;
    issues.push('Requires after-hours availability');
  }
  
  if (hasHighLoadPeriods) {
    availabilityScore -= 15;
    issues.push('Has high-load periods planned');
  }
  
  return {
    score: Math.max(0, availabilityScore),
    issues,
    concurrentProjects,
    requiredHours,
    afterHoursRequired: afterHours === 'yes',
    isStretched: availabilityScore < 50
  };
}

/**
 * Analyze organization context
 */
function analyzeOrganizationContext(organization, project) {
  if (!organization) {
    return {
      available: false
    };
  }
  
  return {
    available: true,
    size: organization.size || 'unknown',
    industry: organization.industry || 'unknown',
    maturity: analyzeOrgMaturity(organization, project),
    hasOnboarding: project.hasOnboardingProcesses === 'yes',
    hasVersionControl: project.hasVersionControlAndCICD === 'yes',
    toolsFragmentation: project.internalToolsFragmentation || 'medium',
    employeeCount: organization.employees?.length || 0,
    activeProjectsCount: organization.projects?.filter(p => p.status === 'active').length || 0
  };
}

/**
 * Analyze organization maturity based on practices
 */
function analyzeOrgMaturity(organization, project) {
  let maturityScore = 0;
  
  if (project.hasOnboardingProcesses === 'yes') maturityScore += 2;
  else if (project.hasOnboardingProcesses === 'partial') maturityScore += 1;
  
  if (project.hasVersionControlAndCICD === 'yes') maturityScore += 2;
  else if (project.hasVersionControlAndCICD === 'partial') maturityScore += 1;
  
  if (project.documentationLevel === 'complete') maturityScore += 2;
  else if (project.documentationLevel === 'partial') maturityScore += 1;
  
  if (project.internalToolsFragmentation === 'low') maturityScore += 2;
  else if (project.internalToolsFragmentation === 'medium') maturityScore += 1;
  
  if (maturityScore >= 7) return 'high';
  if (maturityScore >= 4) return 'medium';
  return 'low';
}

function calculateYearsOfExperience(startDate, endDate) {
  if (!startDate) return 0;
  
  const end = endDate || new Date();
  const start = new Date(startDate);
  const diffMs = end - start;
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365));
}

function isRelevantExperience(experience, project) {
  const projectTechs = (project.mainTechnologies || []).map(t => t.toLowerCase());
  const expTechs = (experience.technologies || []).map(t => t.toLowerCase());
  
  return expTechs.some(tech => projectTechs.includes(tech));
}

function categorizeSkill(skillName, category, categories) {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('program') || categoryLower.includes('language')) {
    categories.programming.add(skillName);
  } else if (categoryLower.includes('framework') || categoryLower.includes('library')) {
    categories.frameworks.add(skillName);
  } else if (categoryLower.includes('database') || categoryLower.includes('db')) {
    categories.databases.add(skillName);
  } else if (categoryLower.includes('cloud') || categoryLower.includes('aws') || 
             categoryLower.includes('azure') || categoryLower.includes('gcp')) {
    categories.cloud.add(skillName);
  } else if (categoryLower.includes('tool')) {
    categories.tools.add(skillName);
  } else {
    categories.other.add(skillName);
  }
}

function getProficiencyScore(level) {
  const scores = {
    'básico': 1,
    'basic': 1,
    'beginner': 1,
    'intermedio': 2,
    'intermediate': 2,
    'avanzado': 3,
    'advanced': 3,
    'experto': 4,
    'expert': 4
  };
  const levelLower = (level || '').toLowerCase();
  return scores[levelLower] || 2;
}

function getLanguageProficiencyScore(level) {
  const levelUpper = (level || '').toUpperCase();
  const levelLower = (level || '').toLowerCase();
  
  const scores = {
    'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6,
    'básico': 1,
    'intermedio': 3,
    'avanzado': 5,
    'fluido': 6,
    'bilingüe': 7,
    'bilingual': 7,
    'nativo': 7,
    'native': 7
  };
  
  return scores[levelUpper] || scores[levelLower] || 3;
}

function getExperienceLevelScore(level) {
  const scores = {
    'junior': 1,
    'mid': 2,
    'senior': 3,
    'expert': 4
  };
  return scores[level] || 2;
}

function calculateVariance(values) {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function findRelatedSkills(targetSkill, availableSkills) {
  // Map of related technologies
  const relatedTechMap = {
    'react': ['vue', 'angular', 'svelte'],
    'vue': ['react', 'angular'],
    'angular': ['react', 'vue'],
    'node.js': ['express', 'nest.js', 'fastify'],
    'express': ['node.js', 'koa', 'fastify'],
    'mongodb': ['postgresql', 'mysql', 'couchdb'],
    'postgresql': ['mysql', 'mongodb', 'oracle'],
    'mysql': ['postgresql', 'mariadb', 'mongodb'],
    'python': ['javascript', 'java', 'ruby'],
    'java': ['kotlin', 'scala', 'groovy'],
    'javascript': ['typescript', 'python', 'java'],
    'typescript': ['javascript']
  };
  
  const related = relatedTechMap[targetSkill] || [];
  return availableSkills.filter(skill => related.includes(skill));
}

module.exports = {
  getTeamAnalysis,
  analyzeTeamComposition,
  analyzeTeamExperience,
  analyzeTeamLanguages,
  analyzeTeamPersonality,
  analyzeTeamWorkload,
  analyzeTechnicalMatch,
  analyzeExperienceMatch,
  analyzeTeamAvailability,
  analyzeOrganizationContext,
  extractTeamSkills // Export for debugging purposes
};

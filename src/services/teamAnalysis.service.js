/**
 * Team Analysis Service
 * Analyzes team composition, skills, experience, personality and organization context
 * Used by Decision Tree and CBR services for accurate risk prediction
 */

const User = require('../models/user.model');
const CV = require('../models/cv.model');
const BFI44 = require('../models/bfi44.model');
const Organization = require('../models/organization.model');
const Project = require('../models/project.model');

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
 * @param {ObjectId} projectId - Project ID
 * @returns {Promise<Object>} Complete team analysis
 */
async function getTeamAnalysis(projectId) {
  try {
    // Get project with all populated data
    const project = await Project.findById(projectId)
      .populate({
        path: 'assignedEmployees.user',
        select: 'name email role organization'
      })
      .populate({
        path: 'organization',
        select: 'name industry size address employees projects'
      })
      .populate({
        path: 'projectManager',
        select: 'name email'
      });
      
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Get team member IDs
    const teamMemberIds = project.assignedEmployees.map(emp => emp.user._id || emp.user);
    
    // Fetch CVs for all team members
    const cvs = await CV.find({ 
      userId: { $in: teamMemberIds },
      organizationStatus: 'accepted'
    });
    
    // Fetch BFI-44 results for all team members
    const bfi44Results = await BFI44.find({
      userId: { $in: teamMemberIds }
    });
    
    // Get organization ID safely
    const organizationId = getOrganizationId(project.organization);
    
    // Get other active projects in organization (for workload analysis)
    const otherProjects = await Project.find({
      organization: organizationId,
      _id: { $ne: projectId },
      status: { $in: ['active', 'draft'] },
      'assignedEmployees.user': { $in: teamMemberIds }
    }).select('projectName assignedEmployees expectedDuration estimatedEndDate');
    
    // Analyze team composition
    const teamAnalysis = analyzeTeamComposition(project, cvs, bfi44Results, otherProjects);
    
    // Analyze organization context
    const orgAnalysis = analyzeOrganizationContext(project.organization, project);
    
    return {
      project,
      team: teamAnalysis,
      organization: orgAnalysis,
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
 * Extract all technical skills from team CVs
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
    if (cv.skills && Array.isArray(cv.skills)) {
      cv.skills.forEach(skill => {
        const skillName = skill.name.toLowerCase();
        allSkills.add(skillName);
        
        // Track highest proficiency level for each skill
        const proficiency = skill.proficiency || 'intermediate';
        if (!skillLevels[skillName] || 
            getProficiencyScore(proficiency) > getProficiencyScore(skillLevels[skillName])) {
          skillLevels[skillName] = proficiency;
        }
        
        // Categorize skills
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
        
        // Check if experience is relevant to project technologies
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
  
  // Determine experience level
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
        const proficiencyScore = getLanguageProficiencyScore(lang.proficiency);
        
        if (!languageCoverage.has(langName)) {
          languageCoverage.set(langName, {
            speakers: 0,
            maxProficiency: lang.proficiency,
            maxScore: proficiencyScore
          });
        }
        
        const current = languageCoverage.get(langName);
        current.speakers++;
        
        if (proficiencyScore > current.maxScore) {
          current.maxProficiency = lang.proficiency;
          current.maxScore = proficiencyScore;
        }
      });
    }
  });
  
  // Check coverage of required languages
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
  
  // Calculate averages and distribution
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
  
  // Detect potential issues
  const concerns = [];
  
  // High neuroticism average → stress risk
  if (analysis.Neuroticism && analysis.Neuroticism.average > 3.5) {
    concerns.push({
      type: 'high_stress_tendency',
      severity: 'medium',
      description: 'Team has high average neuroticism - may struggle under pressure'
    });
  }
  
  // Low conscientiousness → quality risk
  if (analysis.Conscientiousness && analysis.Conscientiousness.average < 2.5) {
    concerns.push({
      type: 'low_discipline',
      severity: 'high',
      description: 'Team has low conscientiousness - quality and deadline risks'
    });
  }
  
  // High variance in agreeableness → conflict risk
  if (analysis.Agreeableness && analysis.Agreeableness.variance > 1.5) {
    concerns.push({
      type: 'personality_conflict',
      severity: 'medium',
      description: 'Wide variance in agreeableness - potential for interpersonal conflicts'
    });
  }
  
  // Low openness + high complexity → innovation risk
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
    teamCoverage: (bfi44Results.length / traits.Extraversion.length) * 100 // % of team with BFI data
  };
}

/**
 * Analyze team workload across multiple projects
 */
function analyzeTeamWorkload(project, otherProjects) {
  const memberWorkload = new Map();
  
  // Initialize with current project
  project.assignedEmployees.forEach(emp => {
    const userId = (emp.user._id || emp.user).toString();
    memberWorkload.set(userId, {
      projects: 1,
      totalHours: project.weeklyHoursPerMember || 40,
      projectNames: [project.projectName]
    });
  });
  
  // Add workload from other active projects
  otherProjects.forEach(otherProject => {
    otherProject.assignedEmployees.forEach(emp => {
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
      : 0
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
  
  // Max score: 8
  if (maturityScore >= 7) return 'high';
  if (maturityScore >= 4) return 'medium';
  return 'low';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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
  
  // Check if any technology overlaps
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

function getProficiencyScore(proficiency) {
  const scores = {
    'beginner': 1,
    'basic': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
  };
  return scores[proficiency.toLowerCase()] || 2;
}

function getLanguageProficiencyScore(proficiency) {
  const scores = {
    'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6,
    'native': 7, 'bilingual': 7
  };
  return scores[proficiency] || 3;
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
  analyzeOrganizationContext
};

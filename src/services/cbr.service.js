/**
 * CBR (Case-Based Reasoning) Service
 * Implements the 4Rs: Retrieve, Reuse, Revise, Retain
 * Core of the learning system for risk prediction
 */

const CaseBase = require('../models/caseBase.model');
const { getConfigSection } = require('../config/teamSelectionDefaults');

/**
 * Maximum difference values for numeric normalization
 */
const MAX_DIFFERENCES = {
  teamSize: 50,
  weeklyHours: 80,
  timeOverlap: 24,
  weeklyMeetings: 20,
  involvedTeams: 10,
  criticalDependencies: 20,
  stakeholdersCount: 20
};

/**
 * Main CBR prediction function
 * NOW ACCEPTS: teamAnalysis parameter
 */
async function predictRisksWithCBR(project, organizationId, k = 5, teamAnalysis = null) {
  try {
    // Get CBR configuration from project with defaults
    const cbrConfig = getConfigSection(project, 'cbr');
    const kCases = cbrConfig.kSimilarCases || k;
    const minSimilarity = cbrConfig.minSimilarityThreshold || 0.3;
    
    console.log(`[CBR] Configuration:`, {
      projectId: project._id,
      projectName: project.projectName,
      kCases,
      minSimilarity,
      hasCustomConfig: !!project.teamSelectionConfig,
      cbrConfig: project.teamSelectionConfig?.cbr
    });
    
    const similarCases = await retrieveSimilarCases(project, organizationId, kCases, teamAnalysis, minSimilarity);
    
    if (!similarCases || similarCases.length === 0) {
      return {
        risks: [],
        confidence: 0,
        message: 'No hay casos similares en la base de conocimiento'
      };
    }
    
    const predictedRisks = reuseSolution(similarCases, project);
    
    const confidence = calculateCBRConfidence(similarCases, organizationId);
    
    return {
      risks: predictedRisks,
      confidence,
      similarCases: similarCases.map(sc => ({
        caseId: sc.case.caseId,
        projectName: sc.case.problem.projectName,
        similarity: sc.similarity,
        outcome: {
          completed: sc.case.solution.completed,
          delayDays: sc.case.solution.delayDays,
          budgetOverrun: sc.case.solution.budgetOverrun
        }
      })),
      message: `Predicción basada en ${similarCases.length} casos similares`
    };
  } catch (error) {
    console.error('Error in CBR prediction:', error);
    throw new Error(`CBR prediction failed: ${error.message}`);
  }
}

/**
 * Retrieve K most similar cases from the case base
 * NOW ACCEPTS: teamAnalysis parameter and minSimilarity threshold
 */
async function retrieveSimilarCases(project, organizationId, k = 5, teamAnalysis = null, minSimilarity = 0.3) {
  console.log(`[CBR] Retrieving cases for organizationId: ${organizationId}, minSimilarity: ${minSimilarity}`);
  
  // Get all cases for the organization (real + seed)
  const realCases = await CaseBase.find({
    organization: organizationId,
    type: 'real'
  });
  
  const seedCases = await CaseBase.find({
    type: 'seed'
  });
  
  console.log(`[CBR] Found ${realCases.length} real cases and ${seedCases.length} seed cases`);
  
  // Extract features from the current project (with team analysis)
  const projectFeatures = extractProjectFeatures(project, teamAnalysis);
  
  // Calculate similarity for real cases
  const similaritiesReal = realCases.map(caseDoc => {
    const similarity = calculateSimilarity(projectFeatures, caseDoc.problem.features);
    const breakdown = getSimilarityBreakdown(projectFeatures, caseDoc.problem.features);
    
    return {
      case: caseDoc,
      similarity,
      breakdown,
      weight: 1.0, // Full weight for real cases
      isGeneric: false
    };
  });
  
  // Calculate similarity for seed cases
  const similaritiesSeeds = seedCases.map(caseDoc => {
    const similarity = calculateSimilarity(projectFeatures, caseDoc.problem.features);
    const breakdown = getSimilarityBreakdown(projectFeatures, caseDoc.problem.features);
    
    return {
      case: caseDoc,
      similarity,
      breakdown,
      weight: 1.0,
      isGeneric: true
    };
  });
  
  // Combine and sort by similarity
  const allSimilarities = [...similaritiesReal, ...similaritiesSeeds];
  allSimilarities.sort((a, b) => b.similarity - a.similarity);
  
  console.log(`[CBR] Top 5 similarities:`, allSimilarities.slice(0, 5).map(s => ({
    projectName: s.case.problem.projectName,
    similarity: s.similarity.toFixed(3),
    isGeneric: s.isGeneric
  })));
  
  // Filter by minimum similarity threshold (from config) and take top K
  // Using >= instead of > to allow exact matches when minSimilarity is 1.0
  const topCases = allSimilarities
    .filter(s => s.similarity >= minSimilarity)
    .slice(0, k);
  
  console.log(`[CBR] After filtering (similarity >= ${minSimilarity}): ${topCases.length} cases selected`);
  
  // Mark cases as reused
  topCases.forEach(async (sc) => {
    if (!sc.isGeneric) {
      await sc.case.markAsReused();
    }
  });
  
  return topCases;
}

/**
 * Extract features from a project for similarity calculation
 * NOW ACCEPTS: teamAnalysis parameter with curriculum, BFI-44, org data
 */
function extractProjectFeatures(project, teamAnalysis = null) {
  return {
    _project: project, // Store project reference to access configuration
    coordination: {
      involvedCountries: project.involvedCountries || [],
      timeOverlap: project.expectedTimeOverlap?.value || 24,
      requiresSyncComm: project.requiresSynchronousCommunication || 'no',
      weeklyMeetings: project.weeklyMeetingsCount || 0,
      culturalDiversity: project.culturalDiversityLevel || 'low',
      realTimeCommunicationLevel: project.realTimeCommunicationLevel || 'low',
      hasLanguageBarriers: teamAnalysis?.languages ? !teamAnalysis.languages.hasAllRequired : false,
      languageCoverage: teamAnalysis?.languages?.coverage || 0
    },
    
    technical: {
      mainTechnologies: project.mainTechnologies || [],
      experienceLevel: project.requiredExperienceLevel || 'mid',
      documentationLevel: project.documentationLevel || 'partial',
      requiresSpecializedTools: project.requiresSpecializedTools?.needed || false,
      sharedInfrastructureDependency: project.sharedInfrastructureDependency || 'medium',
      techMatchPercentage: teamAnalysis?.technicalMatch?.matchPercentage || 0,
      missingTechnologies: teamAnalysis?.technicalMatch?.missing?.length || 0,
      avgProficiency: teamAnalysis?.technicalMatch?.avgProficiency || 0
    },
    
    team: {
      size: project.assignedEmployees?.length || 0,
      weeklyHours: project.weeklyHoursPerMember || 40,
      distributedExperience: project.distributedWorkExperienceLevel || 'medium',
      requiredLanguages: project.requiredLanguages || [],
      languageProficiency: project.minimumLanguageProficiency || 'B1',
      actualExperienceLevel: teamAnalysis?.experience?.overallLevel || 'mid',
      experienceGap: teamAnalysis?.experienceMatch?.gap || 0,
      juniorRatio: teamAnalysis?.experience?.distribution ? 
        (teamAnalysis.experience.distribution.junior / 
         (teamAnalysis.experience.distribution.junior + 
          teamAnalysis.experience.distribution.mid + 
          teamAnalysis.experience.distribution.senior + 
          teamAnalysis.experience.distribution.expert)) : 0,
      isOverloaded: teamAnalysis?.workload?.isOverloaded || false,
      avgHoursPerWeek: teamAnalysis?.workload?.avgHoursPerWeek || 40,
      avgConscientiousness: teamAnalysis?.personality?.traits?.Conscientiousness?.average || 3,
      avgOpenness: teamAnalysis?.personality?.traits?.Openness?.average || 3,
      personalityConcerns: teamAnalysis?.personality?.concerns?.length || 0
    },
    
    management: {
      methodology: project.mainMethodology || 'agile',
      hasOnboarding: project.hasOnboardingProcesses || 'partial',
      hasCICD: project.hasVersionControlAndCICD || 'partial',
      toolsFragmentation: project.internalToolsFragmentation || 'medium',
      clarityOfRequirements: getClarityLevel(project)
    },
    
    organizational: {
      involvedTeams: Array.isArray(project.involvedTeams) ? project.involvedTeams.length : 0,
      criticalDependencies: Array.isArray(project.criticalDependencies) ? project.criticalDependencies.length : 0,
      informationFlow: project.informationFlow || 'bidirectional',
      stakeholdersCount: Array.isArray(project.keyStakeholders) ? project.keyStakeholders.length : 0
    }
  };
}

/**
 * Calculate overall similarity between two projects
 * Uses dimension weights from project configuration (stored in features1.project)
 */
function calculateSimilarity(features1, features2) {
  if (!features2) return 0;
  
  // Get dimension weights from project configuration
  const project = features1._project;
  const cbrConfig = project ? getConfigSection(project, 'cbr') : null;
  const dimensionWeights = cbrConfig?.dimensionWeights || {
    coordination: 0.25,
    technical: 0.30,
    team: 0.20,
    management: 0.15,
    organizational: 0.10
  };
  
  let totalSimilarity = 0;
  
  // Calculate similarity for each dimension with its weight
  for (const [dimension, weight] of Object.entries(dimensionWeights)) {
    if (features1[dimension] && features2[dimension]) {
      const dimSimilarity = calculateDimensionSimilarity(
        features1[dimension],
        features2[dimension],
        dimension
      );
      totalSimilarity += dimSimilarity * weight;
    }
  }
  
  return Math.min(Math.max(totalSimilarity, 0), 1); // Clamp to [0, 1]
}

/**
 * Calculate similarity for a specific dimension
 */
function calculateDimensionSimilarity(features1, features2, dimension) {
  let matches = 0;
  let total = 0;
  
  for (const [key, value1] of Object.entries(features1)) {
    const value2 = features2[key];
    
    if (value2 === undefined || value2 === null) continue;
    
    total++;
    
    // Different strategies based on data type
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      // Numeric similarity (normalized)
      const maxDiff = getMaxDifference(key, dimension);
      const diff = Math.abs(value1 - value2);
      matches += Math.max(0, 1 - (diff / maxDiff));
      
    } else if (Array.isArray(value1) && Array.isArray(value2)) {
      // Jaccard similarity for arrays
      if (value1.length === 0 && value2.length === 0) {
        matches += 1;
      } else {
        const intersection = value1.filter(v => 
          value2.some(v2 => 
            v.toLowerCase() === v2.toLowerCase()
          )
        ).length;
        const union = new Set([
          ...value1.map(v => v.toLowerCase()),
          ...value2.map(v => v.toLowerCase())
        ]).size;
        matches += union > 0 ? intersection / union : 0;
      }
      
    } else if (typeof value1 === 'string' && typeof value2 === 'string') {
      // String matching
      if (value1.toLowerCase() === value2.toLowerCase()) {
        matches += 1;
      } else if (areSimilarStrings(value1, value2)) {
        matches += 0.5; // Partial match
      }
      
    } else if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      // Boolean exact match
      matches += value1 === value2 ? 1 : 0;
    }
  }
  
  return total > 0 ? matches / total : 0;
}

/**
 * Get similarity breakdown by dimension
 */
function getSimilarityBreakdown(features1, features2) {
  // Get dimension weights from project configuration
  const project = features1._project;
  const cbrConfig = project ? getConfigSection(project, 'cbr') : null;
  const dimensionWeights = cbrConfig?.dimensionWeights || {
    coordination: 0.25,
    technical: 0.30,
    team: 0.20,
    management: 0.15,
    organizational: 0.10
  };
  
  const breakdown = {};
  
  for (const dimension of Object.keys(dimensionWeights)) {
    if (features1[dimension] && features2[dimension]) {
      breakdown[dimension] = calculateDimensionSimilarity(
        features1[dimension],
        features2[dimension],
        dimension
      );
    } else {
      breakdown[dimension] = 0;
    }
  }
  
  return breakdown;
}

/**
 * Reuse solutions from similar cases to predict risks
 */
function reuseSolution(similarCases, project) {
  if (!similarCases || similarCases.length === 0) {
    console.log('[CBR] No similar cases to reuse');
    return [];
  }
  
  console.log(`[CBR] Reusing solutions from ${similarCases.length} similar cases (Nearest Neighbor approach)`);
  
  // Group risks by type across all cases
  const risksByType = {};
  
  similarCases.forEach(({ case: caseDoc, similarity }) => {
    console.log(`[CBR]   Case: ${caseDoc.problem.projectName}, Similarity: ${similarity.toFixed(3)}, Risks: ${caseDoc.solution.actualRisks.length}`);
    
    caseDoc.solution.actualRisks.forEach(risk => {
      if (!risksByType[risk.type]) {
        risksByType[risk.type] = [];
      }
      
      risksByType[risk.type].push({
        caseId: caseDoc.caseId,
        projectName: caseDoc.problem.projectName,
        similarity,
        risk: risk,
        originalSource: risk.originalSource || 'unknown'
      });
    });
  });
  
  console.log(`[CBR] Found ${Object.keys(risksByType).length} unique risk types across cases`);
  
  // For each risk type, use the one from the most similar case
  const predictedRisks = [];
  
  Object.entries(risksByType).forEach(([riskType, occurrences]) => {
    // Sort by similarity (highest first)
    occurrences.sort((a, b) => b.similarity - a.similarity);
    
    // Take the risk from the most similar case
    const primary = occurrences[0];
    const otherCases = occurrences.slice(1);
    
    console.log(`[CBR]   Risk "${riskType}" from ${primary.projectName} (similarity: ${primary.similarity.toFixed(3)}, source: ${primary.originalSource})`);
    if (otherCases.length > 0) {
      console.log(`[CBR]     Also found in ${otherCases.length} other case(s)`);
    }
    
    predictedRisks.push({
      type: primary.risk.type,
      title: primary.risk.title,
      description: primary.risk.description,
      category: getCategoryForRiskType(primary.risk.type),
      severity: primary.risk.severity,
      similarity: primary.similarity,
      source: 'cbr',
      originalSource: primary.originalSource,
      rootCause: primary.risk.rootCause,
      basedOnCases: occurrences.map(occ => ({
        caseId: occ.caseId,
        projectName: occ.projectName,
        similarity: occ.similarity,
        description: occ.risk.description,
        originalSource: occ.originalSource
      })),
      reasoning: [
        `Basado en proyecto "${primary.projectName}" (similaridad: ${(primary.similarity * 100).toFixed(0)}%)`,
        ...(otherCases.length > 0 ? [`También ocurrió en ${otherCases.length} proyecto(s) similar(es)`] : [])
      ],
      indicators: [
        `Origen: ${primary.originalSource === 'manual' ? 'Identificado manualmente' : 'Predicho y confirmado'}`,
        `Encontrado en ${occurrences.length} proyecto(s) similar(es)`
      ],
      recommendations: primary.risk.mitigationStrategies || [],
      earlyWarningSignals: []
    });
  });
  
  // Get minSimilarity from project configuration
  const cbrConfig = getConfigSection(project, 'cbr');
  const minSimilarity = cbrConfig.minSimilarityThreshold || 0.3;
  
  // Filter by minimum similarity threshold and sort by similarity
  const filtered = predictedRisks
    .filter(r => r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
  
  console.log(`[CBR] After filtering (similarity >= ${minSimilarity}): ${filtered.length} risks returned`);
  filtered.forEach(r => {
    console.log(`[CBR]   - ${r.type}: similarity=${r.similarity.toFixed(3)}, from ${r.basedOnCases[0].projectName}`);
  });
  
  return filtered;
}

/**
 * Revise CBR predictions with decision tree rules
 */
function reviseWithTreeRules(cbrRisks, treeRisks) {
  const revisedRisks = [...cbrRisks];
  
  // Add tree risks that CBR didn't detect
  treeRisks.forEach(treeRisk => {
    const existsInCBR = cbrRisks.some(r => r.type === treeRisk.type);
    
    if (!existsInCBR) {
      revisedRisks.push({
        ...treeRisk,
        source: 'decision_tree',
        note: 'Detectado por reglas expertas (no visto en casos similares)'
      });
    }
  });
  
  return revisedRisks;
}

/**
 * Create a new case from a completed project
 */
async function retainCase(project, postProjectData, organization) {
  const features = extractProjectFeatures(project);
  
  // Check if case already exists for this project
  let existingCase = await CaseBase.findOne({ caseId: project._id });
  
  console.log(`[CBR] Retaining case for project ${project.projectName} (${project._id})`);
  console.log(`[CBR]   Organization: ${organization._id}`);
  console.log(`[CBR]   Actual risks: ${postProjectData.actualRisks?.length || 0}`);
  
  if (existingCase) {
    console.log(`[CBR]   Updating existing case`);
    // Update existing case instead of creating a new one
    existingCase.problem = {
      projectName: project.projectName,
      briefDescription: project.briefDescription,
      estimatedDuration: project.expectedDuration,
      features
    };
    
    existingCase.solution = {
      completed: postProjectData.completed,
      onTime: postProjectData.onTime,
      delayDays: postProjectData.delayDays || 0,
      budgetOverrun: postProjectData.budgetOverrun || 0,
      qualityScore: postProjectData.qualityScore,
      clientSatisfaction: postProjectData.clientSatisfaction,
      teamMorale: postProjectData.teamMorale,
      actualRisks: postProjectData.actualRisks || [],
      metrics: postProjectData.metrics || {}
    };
    
    existingCase.result = {
      lessonsLearned: postProjectData.lessonsLearned || [],
      successfulPractices: postProjectData.successfulPractices || [],
      unsuccessfulPractices: postProjectData.unsuccessfulPractices || [],
      recommendations: postProjectData.recommendations || []
    };
    
    existingCase.metadata.completedAt = postProjectData.completedAt || new Date();
    existingCase.metadata.tags = extractTags(project, postProjectData);
    existingCase.updatedAt = new Date();
    
    await existingCase.save();
    console.log(`[CBR]   Case updated successfully with ${existingCase.solution.actualRisks.length} actual risks`);
    
    return existingCase;
  }
  
  // Create new case if it doesn't exist
  const newCase = new CaseBase({
    caseId: project._id,
    organization: organization._id,
    type: 'real',
    source: 'completed_project',
    
    problem: {
      projectName: project.projectName,
      briefDescription: project.briefDescription,
      estimatedDuration: project.expectedDuration,
      features
    },
    
    solution: {
      completed: postProjectData.completed,
      onTime: postProjectData.onTime,
      delayDays: postProjectData.delayDays || 0,
      budgetOverrun: postProjectData.budgetOverrun || 0,
      qualityScore: postProjectData.qualityScore,
      clientSatisfaction: postProjectData.clientSatisfaction,
      teamMorale: postProjectData.teamMorale,
      actualRisks: postProjectData.actualRisks || [],
      metrics: postProjectData.metrics || {}
    },
    
    result: {
      lessonsLearned: postProjectData.lessonsLearned || [],
      successfulPractices: postProjectData.successfulPractices || [],
      unsuccessfulPractices: postProjectData.unsuccessfulPractices || [],
      recommendations: postProjectData.recommendations || []
    },
    
    metadata: {
      completedAt: postProjectData.completedAt || new Date(),
      timesReused: 0,
      usefulnessScore: null,
      confidence: 1.0, // Real case = full confidence
      isGeneric: false,
      tags: extractTags(project, postProjectData)
    }
  });
  
  await newCase.save();
  console.log(`[CBR]   New case created successfully with ${newCase.solution.actualRisks.length} actual risks`);
  
  return newCase;
}
// CBR System Confidence

/**
 * Calculate overall CBR system confidence
 */
async function calculateCBRConfidence(similarCases, organizationId) {
  const caseBaseStats = await CaseBase.getCaseBaseStats(organizationId);
  
  // Factor 1: Quality of similar cases (average similarity)
  const avgSimilarity = similarCases.reduce((sum, sc) => 
    sum + sc.similarity, 0
  ) / similarCases.length;
  const caseQualityScore = avgSimilarity > 0.7 ? avgSimilarity : avgSimilarity * 0.5;
  
  // Factor 2: Coverage (how many cases in base)
  const totalCases = caseBaseStats.total;
  const similarCount = similarCases.length;
  const coverageScore = Math.min(similarCount / 10, 1.0) * 
                        Math.min(totalCases / 30, 1.0);
  
  // Factor 3: Consensus (agreement among cases)
  const consensusScore = calculateConsensus(similarCases);
  
  // Factor 4: Recency (how fresh are the cases)
  const recencyScore = calculateRecency(similarCases);
  
  // Weighted combination (redistributed without trackRecordScore)
  const confidence = (
    caseQualityScore * 0.35 +
    coverageScore * 0.25 +
    consensusScore * 0.25 +
    recencyScore * 0.15
  );
  
  return Math.min(Math.max(confidence, 0), 1);
}

/**
 * Calculate consensus among similar cases
 */
function calculateConsensus(similarCases) {
  if (similarCases.length < 2) return 0.5;
  
  // Check if cases agree on main risks
  const riskTypes = new Map();
  
  similarCases.forEach(sc => {
    sc.case.solution.actualRisks.forEach(risk => {
      riskTypes.set(risk.type, (riskTypes.get(risk.type) || 0) + 1);
    });
  });
  
  // Consensus = risks that appear in majority of cases
  const majorityThreshold = similarCases.length * 0.6;
  const consensusRisks = Array.from(riskTypes.values())
    .filter(count => count >= majorityThreshold).length;
  
  return consensusRisks > 0 ? Math.min(consensusRisks / 5, 1) : 0.3;
}

/**
 * Calculate recency score
 */
function calculateRecency(similarCases) {
  const now = Date.now();
  const ages = similarCases
    .filter(sc => sc.case.metadata.completedAt)
    .map(sc => {
      const ageMonths = (now - sc.case.metadata.completedAt) / (1000 * 60 * 60 * 24 * 30);
      return ageMonths;
    });
  
  if (ages.length === 0) return 0.5;
  
  const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
  
  // Score decreases as average age increases (decay over 36 months)
  return Math.max(0, 1 - (avgAge / 36));
}
// Helper Functions

function getMaxDifference(key, dimension) {
  return MAX_DIFFERENCES[key] || 10;
}

function areSimilarStrings(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return true;
  }
  
  // Check for common patterns
  const patterns = [
    ['yes', 'yes'],
    ['no', 'no'],
    ['partial', 'medium'],
    ['complete', 'high'],
    ['minimal', 'low']
  ];
  
  return patterns.some(([p1, p2]) => 
    (s1.includes(p1) && s2.includes(p2)) ||
    (s1.includes(p2) && s2.includes(p1))
  );
}

function getCategoryForRiskType(type) {
  const categoryMap = {
    'communication_breakdown': 'coordination',
    'skill_gap': 'technical',
    'team_overload': 'team',
    'dependency_blockage': 'organizational',
    'scope_creep': 'management',
    'process_mismatch': 'management'
  };
  return categoryMap[type] || 'management';
}

function getClarityLevel(project) {
  const descLength = project.briefDescription?.length || 0;
  const docLevel = project.documentationLevel || 'none';
  
  if (descLength > 500 && docLevel === 'complete') return 'high';
  if (descLength > 300 && docLevel === 'partial') return 'medium';
  return 'low';
}

function extractTags(project, postProjectData) {
  const tags = [];
  
  // Add technology tags
  if (project.mainTechnologies) {
    tags.push(...project.mainTechnologies.slice(0, 3));
  }
  
  // Add experience level tag
  tags.push(project.requiredExperienceLevel || 'mid');
  
  // Add outcome tags
  if (postProjectData) {
    tags.push(postProjectData.completed ? 'completed' : 'failed');
    if (postProjectData.onTime) tags.push('on-time');
    if (postProjectData.delayDays > 30) tags.push('delayed');
  }
  
  // Add distributed tag
  if (project.involvedCountries && project.involvedCountries.length > 1) {
    tags.push('distributed');
  }
  
  return tags;
}

function getImpactRange(examples) {
  const delays = examples
    .filter(ex => ex.impact?.scheduleDelayDays)
    .map(ex => ex.impact.scheduleDelayDays);
  
  if (delays.length === 0) return 'No data';
  
  const min = Math.min(...delays);
  const max = Math.max(...delays);
  
  return `${min}-${max} días de retraso`;
}

function getMostCommonQualityImpact(impacts) {
  const qualityImpacts = impacts
    .filter(i => i.qualityImpact)
    .map(i => i.qualityImpact);
  
  if (qualityImpacts.length === 0) return 'medium';
  
  // Count occurrences
  const counts = {};
  qualityImpacts.forEach(qi => {
    counts[qi] = (counts[qi] || 0) + 1;
  });
  
  // Return most common
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b
  );
}

module.exports = {
  predictRisksWithCBR,
  retrieveSimilarCases,
  reuseSolution,
  reviseWithTreeRules,
  retainCase,
  calculateCBRConfidence,
  extractProjectFeatures,
  calculateSimilarity
};

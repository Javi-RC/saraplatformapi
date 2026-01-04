/**
 * CBR (Case-Based Reasoning) Service
 * Implements the 4Rs: Retrieve, Reuse, Revise, Retain
 * Core of the learning system for risk prediction
 */

const CaseBase = require('../models/caseBase.model');
const { DIMENSION_WEIGHTS } = require('./decisionTree.service');

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
    // Step 1: RETRIEVE similar cases (pass team analysis)
    const similarCases = await retrieveSimilarCases(project, organizationId, k, teamAnalysis);
    
    if (!similarCases || similarCases.length === 0) {
      return {
        risks: [],
        confidence: 0,
        message: 'No hay casos similares en la base de conocimiento'
      };
    }
    
    // Step 2: REUSE solutions from similar cases
    const predictedRisks = reuseSolution(similarCases, project);
    
    // Step 3: Calculate overall confidence
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

// ============================================
// PHASE 1: RETRIEVE - Find Similar Cases
// ============================================

/**
 * Retrieve K most similar cases from the case base
 * NOW ACCEPTS: teamAnalysis parameter
 */
async function retrieveSimilarCases(project, organizationId, k = 5, teamAnalysis = null) {
  // Get all cases for the organization (real + seed)
  const realCases = await CaseBase.find({
    organization: organizationId,
    type: 'real'
  });
  
  const seedCases = await CaseBase.find({
    type: 'seed'
  });
  
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
  
  // Calculate similarity for seed cases (with reduced weight)
  const similaritiesSeeds = seedCases.map(caseDoc => {
    const similarity = calculateSimilarity(projectFeatures, caseDoc.problem.features);
    const breakdown = getSimilarityBreakdown(projectFeatures, caseDoc.problem.features);
    
    return {
      case: caseDoc,
      similarity: similarity * 0.6, // Reduce similarity by 40%
      breakdown,
      weight: 0.6,
      isGeneric: true
    };
  });
  
  // Combine and sort by similarity
  const allSimilarities = [...similaritiesReal, ...similaritiesSeeds];
  allSimilarities.sort((a, b) => b.similarity - a.similarity);
  
  // Filter by minimum similarity threshold (0.3) and take top K
  const topCases = allSimilarities
    .filter(s => s.similarity > 0.3)
    .slice(0, k);
  
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
 * NOW ACCEPTS: teamAnalysis parameter with CV, BFI-44, org data
 */
function extractProjectFeatures(project, teamAnalysis = null) {
  return {
    coordination: {
      teamRegions: project.teamRegions || [],
      timeOverlap: project.expectedTimeOverlap?.value || 24,
      requiresSyncComm: project.requiresSynchronousCommunication || 'no',
      weeklyMeetings: project.weeklyMeetingsCount || 0,
      culturalDiversity: project.culturalDiversityLevel || 'low',
      realTimeCommunicationLevel: project.realTimeCommunicationLevel || 'low',
      // ===== NEW: Language barriers from CVs =====
      hasLanguageBarriers: teamAnalysis?.languages ? !teamAnalysis.languages.hasAllRequired : false,
      languageCoverage: teamAnalysis?.languages?.coverage || 0
    },
    
    technical: {
      mainTechnologies: project.mainTechnologies || [],
      experienceLevel: project.requiredExperienceLevel || 'mid',
      systemComplexity: project.systemComplexity || 'medium',
      documentationLevel: project.documentationLevel || 'partial',
      requiresSpecializedTools: project.requiresSpecializedTools?.needed || false,
      sharedInfrastructureDependency: project.sharedInfrastructureDependency || 'medium',
      // ===== NEW: Actual team skills from CVs =====
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
      // ===== NEW: Experience level from work history =====
      actualExperienceLevel: teamAnalysis?.experience?.overallLevel || 'mid',
      experienceGap: teamAnalysis?.experienceMatch?.gap || 0,
      juniorRatio: teamAnalysis?.experience?.distribution ? 
        (teamAnalysis.experience.distribution.junior / 
         (teamAnalysis.experience.distribution.junior + 
          teamAnalysis.experience.distribution.mid + 
          teamAnalysis.experience.distribution.senior + 
          teamAnalysis.experience.distribution.expert)) : 0,
      // ===== NEW: Workload from other projects =====
      isOverloaded: teamAnalysis?.workload?.isOverloaded || false,
      avgHoursPerWeek: teamAnalysis?.workload?.avgHoursPerWeek || 40,
      // ===== NEW: Personality traits from BFI-44 =====
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
 */
function calculateSimilarity(features1, features2) {
  if (!features2) return 0;
  
  let totalSimilarity = 0;
  
  // Calculate similarity for each dimension with its weight
  for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
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
  const breakdown = {};
  
  for (const dimension of Object.keys(DIMENSION_WEIGHTS)) {
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

// ============================================
// PHASE 2: REUSE - Adapt Solutions
// ============================================

/**
 * Reuse solutions from similar cases to predict risks
 */
function reuseSolution(similarCases, project) {
  if (!similarCases || similarCases.length === 0) {
    return [];
  }
  
  // Aggregate risks from similar cases
  const riskAggregation = {};
  
  similarCases.forEach(({ case: caseDoc, similarity, weight }) => {
    caseDoc.solution.actualRisks.forEach(risk => {
      const key = `${risk.type}-${risk.severity}`;
      
      if (!riskAggregation[key]) {
        riskAggregation[key] = {
          type: risk.type,
          severity: risk.severity,
          category: getCategoryForRiskType(risk.type),
          weightSum: 0,
          examples: [],
          impacts: [],
          descriptions: []
        };
      }
      
      // Accumulate weight (similarity * case weight)
      const effectiveWeight = similarity * weight;
      riskAggregation[key].weightSum += effectiveWeight;
      
      // Collect examples
      riskAggregation[key].examples.push({
        caseId: caseDoc.caseId,
        projectName: caseDoc.problem.projectName,
        similarity,
        description: risk.description,
        rootCause: risk.rootCause,
        impact: risk.actualImpact
      });
      
      // Collect impacts for averaging
      if (risk.actualImpact) {
        riskAggregation[key].impacts.push(risk.actualImpact);
      }
      
      // Collect descriptions
      if (risk.description) {
        riskAggregation[key].descriptions.push(risk.description);
      }
    });
  });
  
  // Calculate total weight for probability normalization
  const totalWeight = similarCases.reduce((sum, sc) => 
    sum + (sc.similarity * sc.weight), 0
  );
  
  // Convert aggregated risks to predictions
  const predictedRisks = Object.values(riskAggregation).map(aggRisk => {
    // Probability = accumulated weight / total weight
    const probability = totalWeight > 0 ? aggRisk.weightSum / totalWeight : 0;
    
    // Calculate confidence based on number of examples and agreement
    const confidence = calculateRiskConfidence(aggRisk, similarCases.length);
    
    // Generate recommendations from case history
    const recommendations = generateRecommendationsFromCases(aggRisk.examples);
    
    // Calculate predicted impact from historical data
    const predictedImpact = calculatePredictedImpact(aggRisk.impacts);
    
    // Generate title and description based on risk type
    const title = generateRiskTitle(aggRisk.type);
    const description = generateRiskDescription(aggRisk, aggRisk.examples.length);
    
    return {
      type: aggRisk.type,
      title,
      description,
      category: aggRisk.category,
      severity: aggRisk.severity,
      probability,
      confidence,
      source: 'cbr',
      basedOnCases: aggRisk.examples.map(ex => ({
        caseId: ex.caseId,
        similarity: ex.similarity,
        description: ex.description
      })),
      reasoning: generateReasoningFromCases(aggRisk.examples),
      indicators: generateIndicatorsFromCases(aggRisk.examples),
      predictedImpact,
      recommendations,
      earlyWarningSignals: []
    };
  });
  
  // Filter by minimum probability threshold and sort
  return predictedRisks
    .filter(r => r.probability > 0.3)
    .sort((a, b) => b.probability - a.probability);
}

/**
 * Calculate confidence for a specific risk based on case evidence
 */
function calculateRiskConfidence(aggRisk, totalCases) {
  const exampleCount = aggRisk.examples.length;
  
  // Factor 1: Number of examples (more examples = higher confidence)
  const coverageFactor = Math.min(exampleCount / totalCases, 1);
  
  // Factor 2: Similarity of examples (higher similarity = higher confidence)
  const avgSimilarity = aggRisk.examples.reduce((sum, ex) => 
    sum + ex.similarity, 0
  ) / exampleCount;
  
  // Factor 3: Consistency (all examples have same severity = higher confidence)
  const severities = new Set(aggRisk.examples.map(ex => ex.severity));
  const consistencyFactor = 1 / severities.size;
  
  // Combined confidence
  const confidence = (
    coverageFactor * 0.4 +
    avgSimilarity * 0.4 +
    consistencyFactor * 0.2
  );
  
  return Math.min(Math.max(confidence, 0.3), 0.95);
}

/**
 * Generate recommendations based on case history
 */
function generateRecommendationsFromCases(examples) {
  const recommendations = [];
  
  // Extract unique recommendations from successful mitigations
  const mitigationStrategies = new Map();
  
  examples.forEach(ex => {
    if (ex.impact && ex.impact.scheduleDelayDays < 10) {
      // This case handled the risk well
      recommendations.push(
        `Basado en ${ex.projectName}: ${ex.rootCause || 'implementar mitigación temprana'}`
      );
    }
  });
  
  // If no specific recommendations, add generic one
  if (recommendations.length === 0) {
    recommendations.push(
      `Este riesgo ocurrió en ${examples.length} proyectos similares - requiere atención`
    );
  }
  
  return recommendations.slice(0, 5); // Max 5 recommendations
}

/**
 * Generate reasoning from case examples
 */
function generateReasoningFromCases(examples) {
  const reasoning = [];
  
  // Top 3 most similar cases
  const topCases = examples
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
  
  topCases.forEach((ex, idx) => {
    reasoning.push(
      `Caso ${idx + 1}: "${ex.projectName}" (similaridad ${(ex.similarity * 100).toFixed(0)}%) - ${ex.description}`
    );
  });
  
  return reasoning;
}

/**
 * Generate indicators from case examples
 */
function generateIndicatorsFromCases(examples) {
  return [
    `Basado en ${examples.length} casos similares`,
    `Similaridad promedio: ${(examples.reduce((sum, ex) => sum + ex.similarity, 0) / examples.length * 100).toFixed(0)}%`,
    `Rango de impacto histórico: ${getImpactRange(examples)}`
  ];
}

/**
 * Calculate predicted impact from historical impacts
 */
function calculatePredictedImpact(impacts) {
  if (!impacts || impacts.length === 0) {
    return {
      scheduleDelay: { min: 5, max: 20, description: 'Sin datos históricos' },
      budgetOverrun: { min: 10, max: 25, description: 'Sin datos históricos' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    };
  }
  
  // Calculate delay statistics
  const delays = impacts
    .filter(i => i.scheduleDelayDays)
    .map(i => i.scheduleDelayDays);
  
  const budgets = impacts
    .filter(i => i.budgetOverrunPercent)
    .map(i => i.budgetOverrunPercent);
  
  return {
    scheduleDelay: {
      min: delays.length > 0 ? Math.min(...delays) : 5,
      max: delays.length > 0 ? Math.max(...delays) : 20,
      description: `Basado en ${delays.length} casos históricos`
    },
    budgetOverrun: {
      min: budgets.length > 0 ? Math.min(...budgets) : 10,
      max: budgets.length > 0 ? Math.max(...budgets) : 25,
      description: `Basado en ${budgets.length} casos históricos`
    },
    qualityImpact: getMostCommonQualityImpact(impacts),
    teamMoraleImpact: 'medium'
  };
}

// ============================================
// PHASE 3: REVISE - Validate and Adapt
// ============================================

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
        confidence: Math.min(treeRisk.confidence || 0.6, 0.7), // Lower confidence
        note: 'Detectado por reglas expertas (no visto en casos similares)'
      });
    }
  });
  
  return revisedRisks;
}

// ============================================
// PHASE 4: RETAIN - Store New Case
// ============================================

/**
 * Create a new case from a completed project
 */
async function retainCase(project, postProjectData, organization) {
  const features = extractProjectFeatures(project);
  
  // Check if case already exists for this project
  let existingCase = await CaseBase.findOne({ caseId: project._id });
  
  if (existingCase) {
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
  
  return newCase;
}

// ============================================
// CBR System Confidence
// ============================================

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
  
  // Factor 5: Track record (historical accuracy)
  const trackRecordScore = caseBaseStats.avgQualityScore || 0.5;
  
  // Weighted combination
  const confidence = (
    caseQualityScore * 0.30 +
    coverageScore * 0.20 +
    consensusScore * 0.20 +
    recencyScore * 0.15 +
    trackRecordScore * 0.15
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

// ============================================
// Helper Functions
// ============================================

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
    'process_mismatch': 'management',
    'technical_infrastructure': 'technical',
    'quality_degradation': 'technical'
  };
  return categoryMap[type] || 'other';
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
  
  // Add complexity tag
  tags.push(project.systemComplexity);
  
  // Add outcome tags
  if (postProjectData) {
    tags.push(postProjectData.completed ? 'completed' : 'failed');
    if (postProjectData.onTime) tags.push('on-time');
    if (postProjectData.delayDays > 30) tags.push('delayed');
  }
  
  // Add distributed tag
  if (project.teamRegions && project.teamRegions.length > 1) {
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

/**
 * Generate a human-readable title for a risk type
 */
function generateRiskTitle(riskType) {
  const titles = {
    'communication_breakdown': 'Barreras de Comunicación',
    'skill_gap': 'Brecha de Habilidades Técnicas',
    'team_overload': 'Sobrecarga del Equipo',
    'dependency_blockage': 'Bloqueos por Dependencias',
    'scope_creep': 'Alcance Inestable (Scope Creep)',
    'process_mismatch': 'Procesos Inadecuados',
    'technical_infrastructure': 'Infraestructura Técnica Deficiente',
    'quality_degradation': 'Degradación de Calidad',
    'vendor_issue': 'Problemas con Proveedores',
    'security_compliance': 'Incumplimiento de Seguridad',
    'budget_overrun': 'Sobrecosto Presupuestario',
    'resource_unavailability': 'Recursos No Disponibles',
    'knowledge_management_gap': 'Brecha en Gestión del Conocimiento',
    'remote_work_support_gap': 'Soporte Inadecuado para Trabajo Remoto',
    'role_clarity_gap': 'Falta de Claridad en Roles',
    'standards_compliance_gap': 'Brecha en Cumplimiento de Estándares',
    'timezone_scheduling_gap': 'Problemas de Programación por Zonas Horarias'
  };
  
  return titles[riskType] || 'Riesgo Detectado';
}

/**
 * Generate a description based on similar cases
 */
function generateRiskDescription(aggRisk, caseCount) {
  const type = aggRisk.type;
  const severity = aggRisk.severity;
  
  // Base description on case history
  let baseDesc = `Riesgo detectado en ${caseCount} proyecto(s) similar(es)`;
  
  // Add type-specific details
  if (type === 'communication_breakdown') {
    baseDesc = `Problemas de comunicación reportados en ${caseCount} casos similares, resultando en coordinación ineficiente`;
  } else if (type === 'skill_gap') {
    baseDesc = `Brecha de habilidades identificada en ${caseCount} proyectos similares, impactando capacidad de ejecución`;
  } else if (type === 'team_overload') {
    baseDesc = `Sobrecarga de equipo documentada en ${caseCount} casos similares, causando burnout y retrasos`;
  } else if (type === 'dependency_blockage') {
    baseDesc = `Bloqueos por dependencias en ${caseCount} proyectos similares, generando retrasos en cascada`;
  } else if (type === 'scope_creep') {
    baseDesc = `Cambios de alcance no controlados en ${caseCount} casos históricos, aumentando costos y timeline`;
  }
  
  // Add severity context
  if (severity === 'high' || severity === 'critical') {
    baseDesc += `. Requiere atención inmediata`;
  }
  
  return baseDesc;
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

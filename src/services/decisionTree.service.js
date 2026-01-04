/**
 * Decision Tree Service
 * Implements expert rules for risk prediction
 * Phase 1: 90% weight, Phase 4: 20-30% weight
 */

const Project = require('../models/project.model');
const User = require('../models/user.model');

/**
 * Configuration for dimension weights in risk calculation
 */
const DIMENSION_WEIGHTS = {
  coordination: 0.25,
  technical: 0.30,
  team: 0.20,
  management: 0.15,
  organizational: 0.10
};

/**
 * Main prediction function - applies all expert rules
 */
async function predictRisksWithRules(project, team, organization, otherProjects = []) {
  const risks = [];
  
  try {
    // Apply all existing expert rules
    const communicationRisk = checkCommunicationRisk(project, team);
    if (communicationRisk) risks.push(communicationRisk);
    
    const skillGapRisk = checkSkillGapRisk(project, team);
    if (skillGapRisk) risks.push(skillGapRisk);
    
    const overloadRisk = await checkTeamOverloadRisk(project, team, otherProjects);
    if (overloadRisk) risks.push(overloadRisk);
    
    const dependencyRisk = checkDependencyRisk(project);
    if (dependencyRisk) risks.push(dependencyRisk);
    
    const scopeRisk = checkScopeCreepRisk(project);
    if (scopeRisk) risks.push(scopeRisk);
    
    const processRisk = checkProcessRisk(project, team);
    if (processRisk) risks.push(processRisk);
    
    const infrastructureRisk = checkInfrastructureRisk(project);
    if (infrastructureRisk) risks.push(infrastructureRisk);
    
    const qualityRisk = checkQualityRisk(project, team);
    if (qualityRisk) risks.push(qualityRisk);

    // Apply NEW enhanced expert rules
    const kmRisk = checkKnowledgeManagementRisk(project, team, organization);
    if (kmRisk) risks.push(kmRisk);

    const remoteWorkRisk = checkRemoteWorkSupportRisk(project, team, organization);
    if (remoteWorkRisk) risks.push(remoteWorkRisk);

    const roleClarityRisk = checkRoleClarityRisk(project, team);
    if (roleClarityRisk) risks.push(roleClarityRisk);

    const complianceRisk = checkStandardsComplianceRisk(project, team);
    if (complianceRisk) risks.push(complianceRisk);

    const timezoneSchedulingRisk = checkTimezoneSchedulingRisk(project, team);
    if (timezoneSchedulingRisk) risks.push(timezoneSchedulingRisk);

    // ===== NEW: Personality-driven risk types (Big Five) =====
    const conflictRisk = checkConflictEscalationRisk(project, team);
    if (conflictRisk) risks.push(conflictRisk);

    const changeResistanceRisk = checkChangeResistanceRisk(project, team);
    if (changeResistanceRisk) risks.push(changeResistanceRisk);

    const burnoutRisk = checkBurnoutSusceptibilityRisk(project, team);
    if (burnoutRisk) risks.push(burnoutRisk);
    
    // Sort by priority (severity * probability)
    risks.sort((a, b) => {
      const scoreA = getSeverityScore(a.severity) * a.probability;
      const scoreB = getSeverityScore(b.severity) * b.probability;
      return scoreB - scoreA;
    });
    
  } catch (error) {
    console.error('Error applying expert rules:', error);
    throw new Error(`Decision tree prediction failed: ${error.message}`);
  }
  
  return risks;
}

function getPersonalityConfidence(teamAnalysis) {
  const personality = teamAnalysis?.personality;
  if (!personality || !personality.available) return 0.4;

  // If teamCoverage is missing or unreliable, keep default confidence.
  const rawCoverage = Number(personality.teamCoverage);
  if (!Number.isFinite(rawCoverage)) return 0.7;

  // Clamp to [0, 1] in case it comes in as ratio or percentage.
  const coverageRatio = rawCoverage > 1 ? rawCoverage / 100 : rawCoverage;
  const clamped = Math.min(Math.max(coverageRatio, 0), 1);

  // Confidence ramps with coverage. 30% coverage -> ~0.55, 100% -> 0.85
  return 0.45 + (clamped * 0.40);
}

/**
 * NEW RULE: Conflict Escalation Risk (Personality-driven)
 * Detects elevated likelihood of interpersonal conflict affecting delivery.
 * Uses Big Five agreeableness (low average or high variance) as the core signal.
 */
function checkConflictEscalationRisk(project, teamAnalysis) {
  const personality = teamAnalysis?.personality;
  const traits = personality?.traits;
  const agreeableness = traits?.Agreeableness;

  if (!personality?.available || !agreeableness) return null;

  const reasoning = [];
  const recommendations = [];
  const indicators = [];
  let riskScore = 0;
  let severity = 'low';
  let probability = 0.3;

  const avg = Number(agreeableness.average);
  const variance = Number(agreeableness.variance);

  // Core personality signals
  if (Number.isFinite(avg) && avg < 2.5) {
    riskScore += 4;
    reasoning.push('Baja agreeableness promedio → mayor fricción interpersonal');
  }

  if (Number.isFinite(variance) && variance > 1.5) {
    riskScore += 3;
    reasoning.push('Alta variabilidad en agreeableness → estilos de interacción incompatibles');
  }

  // Context amplifiers (keep lightweight)
  const culturalDiversity = project?.culturalDiversityLevel || 'low';
  const involvedTeams = Array.isArray(project?.involvedTeams) ? project.involvedTeams.length : 0;
  const criticalDependencies = Array.isArray(project?.criticalDependencies) ? project.criticalDependencies.length : 0;

  if (culturalDiversity === 'high') {
    riskScore += 1;
    reasoning.push('Alta diversidad cultural amplifica malentendidos');
  }

  if (involvedTeams >= 3) {
    riskScore += 1;
    reasoning.push(`${involvedTeams} equipos involucrados → más interfaces sociales`);
  }

  if (criticalDependencies >= 3) {
    riskScore += 1;
    reasoning.push(`${criticalDependencies} dependencias críticas → más puntos de fricción`);
  }

  if (riskScore >= 7) {
    severity = 'high';
    probability = 0.80;
  } else if (riskScore >= 5) {
    severity = 'medium-high';
    probability = 0.65;
  } else if (riskScore >= 3) {
    severity = 'medium';
    probability = 0.50;
  }

  if (severity === 'low') return null;

  recommendations.push('Acordar normas de comunicación (tono, tiempos de respuesta, escalado)');
  recommendations.push('Definir un proceso explícito de resolución de conflictos (1:1 → mediación → escalado)');
  recommendations.push('Asegurar claridad de roles y ownership para decisiones');

  indicators.push(`Agreeableness avg: ${Number.isFinite(avg) ? avg.toFixed(2) : 'N/A'}`);
  indicators.push(`Agreeableness variance: ${Number.isFinite(variance) ? variance.toFixed(2) : 'N/A'}`);
  indicators.push(`Cultural diversity: ${culturalDiversity}`);
  indicators.push(`Involved teams: ${involvedTeams}`);
  indicators.push(`Critical dependencies: ${criticalDependencies}`);

  return {
    type: 'conflict_escalation_risk',
    title: 'Escalada de Conflictos (Personalidad)',
    description: 'Composición de personalidad sugiere riesgo elevado de conflictos que afecten coordinación, motivación y plazos.',
    category: 'team',
    severity,
    probability,
    confidence: getPersonalityConfidence(teamAnalysis),
    source: 'expert_rules_big_five',
    reasoning,
    indicators,
    predictedImpact: {
      scheduleDelay: { min: 5, max: 20, description: 'Retrasos por fricción, escalados y rework por mala coordinación' },
      budgetOverrun: { min: 5, max: 15, description: 'Coste de coordinación extra, rotación o mediación' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Conflictos o escalados recurrentes', threshold: '> 2 / sprint', checkFrequency: 'per sprint' },
      { signal: 'Bloqueos por decisiones', threshold: '> 24h sin owner', checkFrequency: 'weekly' },
      { signal: 'Feedback negativo entre pares', threshold: 'subjective', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * NEW RULE: Change Resistance Risk (Personality-driven)
 * Detects likely resistance to adopting new tech/processes, increasing process mismatch and learning risks.
 */
function checkChangeResistanceRisk(project, teamAnalysis) {
  const personality = teamAnalysis?.personality;
  const traits = personality?.traits;
  const openness = traits?.Openness;

  if (!personality?.available || !openness) return null;

  const reasoning = [];
  const recommendations = [];
  const indicators = [];
  let riskScore = 0;
  let severity = 'low';
  let probability = 0.3;

  const avgOpenness = Number(openness.average);
  if (Number.isFinite(avgOpenness) && avgOpenness < 2.5) {
    riskScore += 4;
    reasoning.push('Baja openness promedio → posible resistencia a nuevas herramientas, prácticas o enfoques');
  }

  // Amplifiers: if the project implies learning / change.
  const complexity = project?.systemComplexity || 'medium';
  const requiresTools = project?.requiresSpecializedTools?.needed || false;
  const techMissing = teamAnalysis?.technicalMatch?.missing?.length || 0;
  const experienceGap = Number(teamAnalysis?.experienceMatch?.gap || 0);

  if (complexity === 'high') {
    riskScore += 1;
    reasoning.push('Alta complejidad aumenta demanda de adaptación');
  }

  if (requiresTools) {
    riskScore += 1;
    reasoning.push('Herramientas especializadas requeridas aumentan curva de adopción');
  }

  if (techMissing > 0) {
    riskScore += 1;
    reasoning.push(`${techMissing} tecnología(s) faltante(s) en el equipo requieren aprendizaje/adopción`);
  }

  if (Number.isFinite(experienceGap) && experienceGap > 0) {
    riskScore += 1;
    reasoning.push(`Gap de experiencia detectado (${experienceGap}) → más esfuerzo de cambio`);
  }

  if (riskScore >= 7) {
    severity = 'high';
    probability = 0.75;
  } else if (riskScore >= 5) {
    severity = 'medium-high';
    probability = 0.60;
  } else if (riskScore >= 3) {
    severity = 'medium';
    probability = 0.45;
  }

  if (severity === 'low') return null;

  recommendations.push('Plan de adopción: checklist por sprint (herramientas, prácticas, definición de done)');
  recommendations.push('Training corto y práctico + pairing/mentoring en las áreas nuevas');
  recommendations.push('Limitar cambios simultáneos (una gran transición a la vez)');

  indicators.push(`Openness avg: ${Number.isFinite(avgOpenness) ? avgOpenness.toFixed(2) : 'N/A'}`);
  indicators.push(`Complexity: ${complexity}`);
  indicators.push(`Specialized tools: ${requiresTools ? 'Yes' : 'No'}`);
  indicators.push(`Missing technologies: ${techMissing}`);
  indicators.push(`Experience gap: ${Number.isFinite(experienceGap) ? experienceGap : 'N/A'}`);

  return {
    type: 'change_resistance_risk',
    title: 'Resistencia al Cambio (Personalidad)',
    description: 'Baja apertura del equipo sugiere riesgo de resistencia a cambios técnicos o de proceso, con impacto en adopción y coordinación.',
    category: 'management',
    severity,
    probability,
    confidence: getPersonalityConfidence(teamAnalysis),
    source: 'expert_rules_big_five',
    reasoning,
    indicators,
    predictedImpact: {
      scheduleDelay: { min: 5, max: 25, description: 'Retrasos por baja adopción, fricción con procesos y rework' },
      budgetOverrun: { min: 5, max: 20, description: 'Coste de training extra y pérdida de eficiencia' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Rechazo a prácticas acordadas', threshold: '> 2 incidencias / sprint', checkFrequency: 'per sprint' },
      { signal: 'Tiempo de onboarding alto', threshold: '> 2 semanas', checkFrequency: 'monthly' },
      { signal: 'Baja adopción de tooling', threshold: '< 70% uso', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * NEW RULE: Burnout Susceptibility Risk (Personality-driven)
 * Detects elevated burnout risk from high neuroticism combined with sustained workload pressure.
 */
function checkBurnoutSusceptibilityRisk(project, teamAnalysis) {
  const personality = teamAnalysis?.personality;
  const traits = personality?.traits;
  const neuroticism = traits?.Neuroticism;

  if (!personality?.available || !neuroticism) return null;

  const reasoning = [];
  const recommendations = [];
  const indicators = [];
  let riskScore = 0;
  let severity = 'low';
  let probability = 0.3;

  const avgNeuroticism = Number(neuroticism.average);
  if (Number.isFinite(avgNeuroticism) && avgNeuroticism > 3.5) {
    riskScore += 4;
    reasoning.push('Neuroticism promedio alto → mayor vulnerabilidad al estrés sostenido');
  }

  const workload = teamAnalysis?.workload;
  const avgHours = Number(workload?.avgHoursPerWeek ?? project?.weeklyHoursPerMember ?? 40);
  const overloaded = Boolean(workload?.isOverloaded);

  if (overloaded) {
    riskScore += 2;
    reasoning.push('Equipo con sobrecarga detectada');
  }

  if (Number.isFinite(avgHours) && avgHours > 45) {
    riskScore += 2;
    reasoning.push(`Carga promedio alta (${avgHours.toFixed(1)}h/semana)`);
  } else if (Number.isFinite(avgHours) && avgHours > 40) {
    riskScore += 1;
    reasoning.push(`Carga moderada-alta (${avgHours.toFixed(1)}h/semana)`);
  }

  // Extra amplifier: low time overlap with sync dependency increases pressure.
  const overlap = project?.expectedTimeOverlap?.value;
  const requiresSync = project?.requiresSynchronousCommunication;
  if (requiresSync === 'yes' && Number.isFinite(Number(overlap)) && Number(overlap) < 4) {
    riskScore += 1;
    reasoning.push('Comunicación síncrona requerida con bajo solape horario → presión adicional');
  }

  if (riskScore >= 7) {
    severity = 'high';
    probability = 0.80;
  } else if (riskScore >= 5) {
    severity = 'medium-high';
    probability = 0.65;
  } else if (riskScore >= 3) {
    severity = 'medium';
    probability = 0.50;
  }

  if (severity === 'low') return null;

  recommendations.push('Definir límites de carga (cap de horas) y rotación de guardias si aplica');
  recommendations.push('Seguimiento semanal de bienestar (1:1) y ajuste de plan si sube la presión');
  recommendations.push('Aumentar buffer de planificación y reducir WIP en periodos críticos');

  indicators.push(`Neuroticism avg: ${Number.isFinite(avgNeuroticism) ? avgNeuroticism.toFixed(2) : 'N/A'}`);
  indicators.push(`Avg hours/week: ${Number.isFinite(avgHours) ? avgHours.toFixed(1) : 'N/A'}`);
  indicators.push(`Team overloaded: ${overloaded ? 'Yes' : 'No'}`);
  indicators.push(`Requires sync: ${requiresSync || 'unknown'}`);
  indicators.push(`Time overlap: ${overlap?.value ?? overlap ?? 'N/A'}`);

  return {
    type: 'burnout_susceptibility',
    title: 'Susceptibilidad a Burnout (Personalidad)',
    description: 'Combinación de vulnerabilidad al estrés y presión sostenida sugiere riesgo de burnout, rotación y degradación de rendimiento.',
    category: 'team',
    severity,
    probability,
    confidence: getPersonalityConfidence(teamAnalysis),
    source: 'expert_rules_big_five',
    reasoning,
    indicators,
    predictedImpact: {
      scheduleDelay: { min: 3, max: 25, description: 'Caída de rendimiento, ausencias, rotación y rework' },
      budgetOverrun: { min: 5, max: 25, description: 'Coste de rotación, reemplazos y pérdida de productividad' },
      qualityImpact: 'medium-high',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Aumento de ausencias o retrasos', threshold: '> 1 / mes', checkFrequency: 'monthly' },
      { signal: 'Horas extra sostenidas', threshold: '> 2 semanas', checkFrequency: 'weekly' },
      { signal: 'Bajada de satisfacción del equipo', threshold: 'subjective', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * RULE 1: Communication and Coordination Risk
 * Detects risks related to geographic distribution and communication
 * NOW USES: team.languages from CVs
 */
function checkCommunicationRisk(project, teamAnalysis) {
  const regions = project.teamRegions?.length || 0;
  const overlap = project.expectedTimeOverlap?.value || 24;
  const culturalDiversity = project.culturalDiversityLevel || 'low';
  const requiresSync = project.requiresSynchronousCommunication;
  const weeklyMeetings = project.weeklyMeetingsCount || 0;
  
  // Calculate risk score
  let riskScore = 0;
  let severity = 'low';
  let probability = 0.3;
  const reasoning = [];
  const recommendations = [];
  
  // ===== NEW: Check language barriers from CVs =====
  const teamLanguages = teamAnalysis?.languages;
  if (teamLanguages && !teamLanguages.hasAllRequired) {
    riskScore += 4;
    severity = 'high';
    probability = 0.85;
    reasoning.push(`CRÍTICO: Equipo no domina idiomas requeridos: ${teamLanguages.missingLanguages?.join(', ') || 'varios'}`);
    recommendations.push('URGENTE: Contratar miembros con idiomas requeridos');
    recommendations.push('Proveer servicios de traducción o formación lingüística');
  }
  
  if (teamLanguages && teamLanguages.insufficientProficiency && teamLanguages.insufficientProficiency.length > 0) {
    riskScore += 2;
    reasoning.push(`${teamLanguages.insufficientProficiency.length} miembros con nivel de idioma insuficiente`);
    recommendations.push('Reforzar competencias lingüísticas del equipo');
  }
  
  // Factor 1: Geographic dispersion
  if (regions >= 3) {
    riskScore += 3;
    reasoning.push(`${regions} regiones geográficas (alta dispersión)`);
  } else if (regions >= 2) {
    riskScore += 2;
    reasoning.push(`${regions} regiones geográficas (dispersión moderada)`);
  }
  
  // Factor 2: Time overlap
  if (overlap < 4 && regions >= 2) {
    riskScore += 3;
    reasoning.push(`Solo ${overlap}h de solapamiento horario (crítico)`);
    recommendations.push('URGENTE: Establecer core hours de al menos 4h');
  } else if (overlap < 6 && regions >= 2) {
    riskScore += 2;
    reasoning.push(`${overlap}h de solapamiento horario (limitado)`);
    recommendations.push('Considerar extender core hours a 6h mínimo');
  }
  
  // Factor 3: Cultural diversity
  if (culturalDiversity === 'high') {
    riskScore += 2;
    reasoning.push('Alta diversidad cultural (riesgo de malentendidos)');
    
    // NEW: Check for cultural mediator or multicultural experience
    let hasMediatorOrExperience = false;
    if (teamAnalysis && teamAnalysis.members) {
      const mediators = teamAnalysis.members.filter(m => 
        m.cv?.crossCulturalExperience?.mediationSkills
      );
      const experiencedMembers = teamAnalysis.members.filter(m => 
        m.cv?.crossCulturalExperience?.hasExperience &&
        m.cv?.crossCulturalExperience?.multiculturalProjects > 0
      );
      
      if (mediators.length > 0) {
        hasMediatorOrExperience = true;
        reasoning.push(`Positivo: ${mediators.length} mediador(es) cultural(es) identificado(s)`);
        recommendations.push(`Aprovechar experiencia de ${mediators[0].user?.name || 'mediador'} como facilitador`);
      } else if (experiencedMembers.length >= teamAnalysis.members.length * 0.5) {
        hasMediatorOrExperience = true;
        reasoning.push(`${experiencedMembers.length} miembros con experiencia multicultural`);
      } else {
        recommendations.push('Considerar designar un mediador cultural o coordinador');
        recommendations.push('Proveer formación en diversidad cultural');
      }
    }
    
    if (!hasMediatorOrExperience) {
      riskScore += 1;
      reasoning.push('Sin mediador cultural ni experiencia multicultural significativa');
    }
    
    recommendations.push('Implementar protocolos de comunicación claros');
    recommendations.push('Fomentar empatía y comunicación abierta');
  }
  
  // Factor 4: Synchronous communication requirements
  if (requiresSync === 'yes' && regions >= 2 && overlap < 6) {
    riskScore += 2;
    reasoning.push('Requiere comunicación síncrona con poco overlap');
    recommendations.push('Reconsiderar requisitos síncronos o aumentar overlap');
  }
  
  // Factor 5: Too many meetings
  if (weeklyMeetings > 5 && regions >= 2) {
    riskScore += 1;
    reasoning.push(`${weeklyMeetings} reuniones/semana (overhead alto)`);
    recommendations.push('Reducir meetings y adoptar async-first approach');
  }
  
  // Determine severity and probability based on score
  if (riskScore >= 7) {
    severity = 'high';
    probability = 0.85;
  } else if (riskScore >= 4) {
    severity = 'medium-high';
    probability = 0.65;
  } else if (riskScore >= 2) {
    severity = 'medium';
    probability = 0.45;
  } else {
    return null; // No significant risk
  }
  
  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push('Implementar daily async updates');
    recommendations.push('Definir protocolos de escalación claros');
    recommendations.push('Usar herramientas de comunicación asíncrona efectivas');
  }
  
  return {
    type: 'communication_breakdown',
    title: 'Barreras de Comunicación',
    description: `El equipo distribuido en ${regions} ${regions === 1 ? 'región' : 'regiones'} con ${overlap}h de solapamiento horario presenta riesgos de coordinación`,
    category: 'coordination',
    severity,
    probability,
    confidence: 0.75, // High confidence in expert rules
    source: 'expert_rules',
    reasoning,
    indicators: [
      `${regions} regiones`,
      `${overlap}h overlap`,
      `Cultural diversity: ${culturalDiversity}`,
      `${weeklyMeetings} meetings/week`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 30 : 15,
        description: 'Retrasos por coordinación y decisiones lentas'
      },
      budgetOverrun: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 25 : 15,
        description: 'Tiempo extra en meetings y coordinación'
      },
      qualityImpact: severity === 'high' ? 'medium' : 'low',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Meeting attendance < 90%', threshold: '90%', checkFrequency: 'weekly' },
      { signal: 'Response time > 24h', threshold: '24 hours', checkFrequency: 'daily' },
      { signal: 'Decisiones pendientes acumulándose', threshold: '> 5 decisiones', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE 2: Skill Gap Risk
 * Detects mismatches between required skills and team capabilities
 * NOW USES: team.technicalMatch, team.experience, team.skills from CVs
 */
function checkSkillGapRisk(project, teamAnalysis) {
  const requiredLevel = project.requiredExperienceLevel || 'mid';
  const complexity = project.systemComplexity || 'medium';
  const mainTechs = project.mainTechnologies || [];
  const docLevel = project.documentationLevel || 'partial';
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  
  // ===== NEW: Use actual team analysis data =====
  const technicalMatch = teamAnalysis?.technicalMatch;
  const experienceMatch = teamAnalysis?.experienceMatch;
  const teamSkills = teamAnalysis?.skills;
  const teamExperience = teamAnalysis?.experience;
  
  // Factor 1: Missing critical technologies (from CVs)
  if (technicalMatch && technicalMatch.missing && technicalMatch.missing.length > 0) {
    riskScore += 4;
    severity = 'high';
    probability = 0.85;
    reasoning.push(`CRÍTICO: Equipo carece de ${technicalMatch.missing.length} tecnologías: ${technicalMatch.missing.slice(0, 3).join(', ')}`);
    recommendations.push(`URGENTE: Contratar especialistas en ${technicalMatch.missing.slice(0, 2).join(' y ')}`);
  }
  
  // Factor 2: Low technology match percentage
  if (technicalMatch && technicalMatch.matchPercentage < 50) {
    riskScore += 3;
    severity = 'high';
    probability = Math.max(probability, 0.75);
    reasoning.push(`Match tecnológico muy bajo: ${technicalMatch.matchPercentage.toFixed(0)}%`);
    recommendations.push('Re-evaluar viabilidad con equipo actual');
  } else if (technicalMatch && technicalMatch.matchPercentage < 70) {
    riskScore += 2;
    severity = severity === 'high' ? 'high' : 'medium';
    probability = Math.max(probability, 0.60);
    reasoning.push(`Match tecnológico moderado: ${technicalMatch.matchPercentage.toFixed(0)}%`);
  }
  
  // Factor 3: Experience level gap
  if (experienceMatch && experienceMatch.gap > 0) {
    riskScore += experienceMatch.gap >= 2 ? 3 : 2;
    severity = experienceMatch.gap >= 2 ? 'high' : 'medium-high';
    probability = Math.max(probability, experienceMatch.gap >= 2 ? 0.80 : 0.65);
    reasoning.push(`Gap de experiencia: requiere ${experienceMatch.required}, tiene ${experienceMatch.actual}`);
  }
  
  // Factor 4: Low proficiency
  if (technicalMatch && technicalMatch.avgProficiency < 2.0 && complexity === 'high') {
    riskScore += 3;
    reasoning.push(`Proficiencia muy baja: ${technicalMatch.avgProficiency.toFixed(1)}/5 para proyecto complejo`);
    recommendations.push('Considerar simplificar arquitectura o contratar expertos');
  }
  
  // Factor 5: Team composition (too many juniors)
  if (teamExperience && teamExperience.distribution) {
    const dist = teamExperience.distribution;
    const total = dist.junior + dist.mid + dist.senior + dist.expert;
    const juniorRatio = total > 0 ? dist.junior / total : 0;
    
    if (juniorRatio > 0.6 && complexity === 'high') {
      riskScore += 2;
      reasoning.push(`${(juniorRatio * 100).toFixed(0)}% del equipo es junior para proyecto complejo`);
      recommendations.push('Rebalancear equipo: al menos 50% mid+');
    }
  }
  
  // Factor 6: Poor documentation
  if (docLevel === 'minimal' || docLevel === 'none') {
    riskScore += 1;
    probability = Math.min(probability + 0.10, 0.95);
    reasoning.push('Documentación mínima agrava curva de aprendizaje');
    recommendations.push('Priorizar documentación desde sprint 1');
  }
  
  // Determine final severity
  if (riskScore >= 8) {
    severity = 'high';
    probability = Math.min(0.90, probability);
  } else if (riskScore >= 5) {
    severity = 'medium-high';
    probability = Math.min(0.70, probability);
  } else if (riskScore >= 3) {
    severity = 'medium';
    probability = Math.min(0.55, probability);
  }
  
  if (riskScore < 3) {
    return null;
  }
  
  const missingTechs = technicalMatch?.missing || [];
  const matchPercentage = technicalMatch?.matchPercentage || 0;
  
  return {
    type: 'skill_gap',
    title: 'Brecha de Habilidades Técnicas',
    description: missingTechs.length > 0 
      ? `El equipo carece de experiencia en ${missingTechs.length} tecnología(s) crítica(s): ${missingTechs.slice(0, 3).join(', ')}. Match técnico: ${matchPercentage}%`
      : `Las habilidades del equipo no alcanzan el nivel requerido (${requiredLevel}) para la complejidad del proyecto (${complexity})`,
    category: 'technical',
    severity,
    probability,
    confidence: technicalMatch ? 0.85 : 0.60,
    source: 'expert_rules_with_cv_data',
    reasoning,
    indicators: [
      `Complejidad: ${complexity}`,
      `Match tecnológico: ${technicalMatch?.matchPercentage?.toFixed(0) || 'N/A'}%`,
      `Gap experiencia: ${experienceMatch?.gap || 'N/A'} niveles`,
      `Tecnologías faltantes: ${technicalMatch?.missing?.length || 0}`,
      `Proficiencia: ${technicalMatch?.avgProficiency?.toFixed(1) || 'N/A'}/5`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 20 : 10,
        max: severity === 'high' ? 60 : 30,
        description: 'Curva de aprendizaje, rework y training'
      },
      budgetOverrun: {
        min: severity === 'high' ? 25 : 12,
        max: severity === 'high' ? 50 : 30,
        description: 'Costo de training, contrataciones y corrección'
      },
      qualityImpact: severity === 'high' ? 'high' : 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Bug rate > 0.15 per story point', threshold: '0.15', checkFrequency: 'weekly' },
      { signal: 'Estimation accuracy < 60%', threshold: '60%', checkFrequency: 'per sprint' },
      { signal: 'Code review time > 3 días', threshold: '3 days', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE 3: Team Overload Risk
 * Detects when team members are spread too thin across projects
 * NOW USES: team.workload, team.personality from BFI-44
 */
async function checkTeamOverloadRisk(project, teamAnalysis, otherProjects) {
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  
  // ===== NEW: Use workload analysis =====
  const workload = teamAnalysis?.workload;
  const personality = teamAnalysis?.personality;
  
  if (workload && workload.isOverloaded) {
    riskScore += 4;
    severity = 'high';
    probability = 0.90;
    reasoning.push(`CRÍTICO: ${workload.overloadedMembers || 0} miembros sobrecargados`);
    reasoning.push(`Carga promedio: ${workload.avgHoursPerWeek?.toFixed(1) || 'N/A'}h/semana`);
    recommendations.push('URGENTE: Redistribuir carga o contratar recursos');
  }
  
  if (workload && workload.maxConcurrentProjects > 2) {
    riskScore += 3;
    severity = severity === 'high' ? 'high' : 'medium-high';
    probability = Math.max(probability, 0.75);
    reasoning.push(`Miembros en ${workload.maxConcurrentProjects} proyectos simultáneos`);
    recommendations.push('Reducir concurrencia o extender timelines');
  }
  
  // ===== NEW: Use personality traits (stress tendency) =====
  if (personality && personality.concerns) {
    const stressConcern = personality.concerns.find(c => 
      c.type === 'high_stress_tendency' || (typeof c === 'string' && c.includes('estrés'))
    );
    
    if (stressConcern && workload?.avgHoursPerWeek > 40) {
      riskScore += 2;
      reasoning.push('Equipo con alta tendencia al estrés + carga elevada');
      recommendations.push('Monitorear bienestar del equipo semanalmente');
      recommendations.push('Proveer recursos de gestión del estrés');
    }
  }
  
  // Factor 2: Team availability mismatch
  const availability = teamAnalysis?.availability;
  if (availability && availability.isStretched) {
    riskScore += 2;
    reasoning.push('Disponibilidad del equipo estirada al límite');
    recommendations.push('Considerar ampliar equipo o reducir alcance');
  }
  
  if (availability && availability.afterHoursRequired && workload?.avgHoursPerWeek > 40) {
    riskScore += 2;
    reasoning.push('Requiere after-hours con equipo ya sobrecargado');
    recommendations.push('Reconsiderar requisitos de disponibilidad 24/7');
  }
  
  // Determine final severity
  if (riskScore >= 8) {
    severity = 'high';
    probability = Math.min(0.95, probability);
  } else if (riskScore >= 5) {
    severity = 'medium-high';
    probability = Math.min(0.75, probability);
  } else if (riskScore >= 3) {
    severity = 'medium';
    probability = Math.min(0.55, probability);
  }
  
  if (riskScore < 3) {
    return null;
    recommendations.push('URGENTE: Reasignar carga de otros proyectos');
    recommendations.push('Implementar rotación y límites estrictos de horas');
  } else if (overloadedMembers.length > 0) {
    severity = 'medium';
    probability = 0.65;
    reasoning.push(`${overloadedMembers.length} miembros sobrecargados`);
    recommendations.push('Monitorear carga semanalmente');
    recommendations.push('Preparar plan de contingencia si empeora');
  }
  
  // Factor 2: Too many projects per person
  if (avgProjects > 2.5) {
    severity = severity === 'low' ? 'medium' : 'high';
    probability = Math.min(probability + 0.15, 0.95);
    reasoning.push(`Promedio ${avgProjects.toFixed(1)} proyectos por persona (context switching alto)`);
    recommendations.push('Consolidar proyectos o dedicar full-time a este proyecto');
  }
  
  // Factor 3: High average hours
  if (avgHours > 45) {
    probability = Math.min(probability + 0.10, 0.95);
    reasoning.push(`Promedio ${avgHours.toFixed(1)}h/semana para el equipo`);
  }
  
  if (severity === 'low' && overloadedMembers.length === 0) {
    return null; // No significant risk
  }
  
  return {
    type: 'team_overload',
    title: 'Sobrecarga del Equipo',
    description: overloadedMembers.length > 0 
      ? `${overloadedMembers.length} miembro(s) del equipo están sobrecargados con múltiples proyectos concurrentes (promedio: ${avgProjects.toFixed(1)} proyectos/persona)`
      : `El equipo está trabajando ${avgHours.toFixed(1)} horas semanales en promedio, superando la capacidad sostenible`,
    category: 'team',
    severity,
    probability,
    confidence: 0.85, // High confidence - based on hard data
    source: 'expert_rules',
    reasoning,
    indicators: [
      `${overloadedMembers.length} miembros sobrecargados`,
      `Promedio ${avgProjects.toFixed(1)} proyectos/persona`,
      `Promedio ${avgHours.toFixed(1)}h/semana`,
      `${teamSize} personas en el equipo`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 20 : 10,
        max: severity === 'high' ? 60 : 30,
        description: 'Burnout, rotación y pérdida de productividad'
      },
      budgetOverrun: {
        min: severity === 'high' ? 30 : 15,
        max: severity === 'high' ? 70 : 35,
        description: 'Ineficiencia, errores y retrabajos por agotamiento'
      },
      qualityImpact: 'high',
      teamMoraleImpact: 'high'
    },
    recommendations,
    affectedMembers: overloadedMembers.map(m => ({
      name: m.memberName,
      totalHours: m.totalHours,
      projectsCount: m.projectsCount
    })),
    earlyWarningSignals: [
      { signal: 'Sick days aumentan > 50%', threshold: '50% increase', checkFrequency: 'monthly' },
      { signal: 'Meeting attendance < 85%', threshold: '85%', checkFrequency: 'weekly' },
      { signal: 'Calidad de commits/PRs baja', threshold: 'subjective', checkFrequency: 'weekly' },
      { signal: 'Response time duplica', threshold: '2x normal', checkFrequency: 'daily' }
    ]
  };
}

/**
 * RULE 4: Dependency and Blockage Risk
 * Detects risks from external dependencies
 */
function checkDependencyRisk(project) {
  const involvedTeams = project.involvedTeams || 0;
  const criticalDeps = project.criticalDependencies || 0;
  const sharedInfra = project.sharedInfrastructureDependency;
  const infoFlow = project.informationFlowDirection || 'bidirectional';
  
  // Calculate risk score
  const riskScore = involvedTeams + (criticalDeps * 0.5);
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  
  if (riskScore > 6 || sharedInfra === 'high') {
    severity = 'high';
    probability = 0.75;
    reasoning.push(`${involvedTeams} equipos involucrados con ${criticalDeps} dependencias críticas`);
    reasoning.push(`Infraestructura compartida: ${sharedInfra || 'unknown'}`);
    recommendations.push('Establecer SLAs formales con equipos dependientes');
    recommendations.push('Weekly sync meetings con TODOS los equipos');
    recommendations.push('Crear mock services para desarrollo paralelo');
    recommendations.push('Buffer de +30% en timeline para integraciones');
  } else if (riskScore > 4) {
    severity = 'medium';
    probability = 0.60;
    reasoning.push(`${involvedTeams} equipos, ${criticalDeps} dependencias críticas`);
    recommendations.push('Definir contracts/APIs desde semana 1');
    recommendations.push('Bi-weekly sync con equipos dependientes');
    recommendations.push('Integration testing desde sprint 2');
  } else if (riskScore > 2) {
    severity = 'medium';
    probability = 0.45;
    reasoning.push(`Dependencias moderadas: ${involvedTeams} equipos`);
    recommendations.push('Clarificar dependencias y timelines');
  } else {
    return null;
  }
  
  return {
    type: 'dependency_blockage',
    title: 'Bloqueos por Dependencias',
    description: `El proyecto tiene ${dependencies.length} dependencia(s) crítica(s) involucrando ${involvedTeams} equipos. Alto riesgo de bloqueos de coordinación`,
    category: 'organizational',
    severity,
    probability,
    confidence: 0.72,
    source: 'expert_rules',
    reasoning,
    indicators: [
      `${involvedTeams} equipos involucrados`,
      `${criticalDeps} dependencias críticas`,
      `Shared infra: ${sharedInfra || 'unknown'}`,
      `Info flow: ${infoFlow}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 14 : 7,
        max: severity === 'high' ? 42 : 21,
        description: 'Bloqueos esperando otros equipos'
      },
      budgetOverrun: {
        min: severity === 'high' ? 15 : 10,
        max: severity === 'high' ? 30 : 20,
        description: 'Tiempo idle y rework por cambios'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Bloqueos > 2 por sprint', threshold: '2 blockers', checkFrequency: 'per sprint' },
      { signal: 'Dependency APIs cambian', threshold: '> 1 change', checkFrequency: 'weekly' },
      { signal: 'Integration tests fallan', threshold: '> 20% failure', checkFrequency: 'daily' }
    ]
  };
}

/**
 * RULE 5: Scope Creep Risk
 * Detects lack of requirement clarity
 */
function checkScopeCreepRisk(project) {
  const descLength = project.briefDescription?.length || 0;
  const docLevel = project.documentationLevel || 'none';
  const rolesCount = project.keyRoles?.length || 0;
  const complexity = project.systemComplexity || 'medium';
  const teamSize = project.assignedEmployees?.length || 0;
  
  // Calculate clarity score
  let clarityScore = 0;
  clarityScore += descLength > 500 ? 1 : 0;
  clarityScore += docLevel === 'complete' ? 1 : (docLevel === 'partial' ? 0.5 : 0);
  clarityScore += rolesCount >= 3 ? 1 : (rolesCount >= 1 ? 0.5 : 0);
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  
  if (clarityScore < 1 && complexity === 'high') {
    severity = 'high';
    probability = 0.80;
    reasoning.push('Proyecto complejo con requisitos muy vagos');
    reasoning.push(`Descripción: ${descLength} caracteres (mínimo: 500)`);
    reasoning.push(`Documentación: ${docLevel}`);
    recommendations.push('URGENTE: Workshop de requisitos detallado (semana 1)');
    recommendations.push('Documentar user stories completas');
    recommendations.push('Definir MVP claramente');
    recommendations.push('Freeze scope después de semana 2');
    recommendations.push('Change control process formal');
  } else if (clarityScore < 1.5) {
    severity = 'medium';
    probability = 0.65;
    reasoning.push('Requisitos poco claros');
    reasoning.push(`Clarity score: ${clarityScore.toFixed(1)}/3`);
    recommendations.push('Clarificar requisitos antes de sprint 1');
    recommendations.push('Stakeholder alignment semanal');
  } else if (clarityScore < 2) {
    severity = 'medium';
    probability = 0.50;
    reasoning.push('Requisitos parcialmente definidos');
    recommendations.push('Validar entendimiento con stakeholders');
  } else {
    return null;
  }
  
  return {
    type: 'scope_creep',
    title: 'Alcance Inestable (Scope Creep)',
    description: `Requisitos poco claros con documentación ${docLevel} y ${rolesCount} roles definidos de ${teamSize} miembros. Alto riesgo de cambios de alcance no controlados`,
    category: 'management',
    severity,
    probability,
    confidence: 0.68,
    source: 'expert_rules',
    reasoning,
    indicators: [
      `Descripción: ${descLength} chars`,
      `Documentación: ${docLevel}`,
      `Roles definidos: ${rolesCount}`,
      `Complejidad: ${complexity}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 20 : 10,
        max: severity === 'high' ? 60 : 30,
        description: 'Cambios constantes de alcance'
      },
      budgetOverrun: {
        min: severity === 'high' ? 30 : 15,
        max: severity === 'high' ? 60 : 35,
        description: 'Features adicionales no planificadas'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Nuevas features solicitadas', threshold: '> 1 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Prioridades cambian', threshold: '> 2 changes', checkFrequency: 'per sprint' },
      { signal: 'Stakeholders no alineados', threshold: 'subjective', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE 6: Process Mismatch Risk
 * Detects maturity and tooling issues
 * NOW USES: organization context from teamAnalysis
 */
function checkProcessRisk(project, teamAnalysis) {
  const hasOnboarding = project.hasOnboardingProcesses === 'yes';
  const hasCICD = project.hasVersionControlAndCICD === 'yes';
  const toolsFragmentation = project.internalToolsFragmentation || 'medium';
  const distributedExp = project.distributedWorkExperienceLevel || 'low';
  const methodology = project.mainMethodology || 'agile';
  
  // ===== NEW: Use organization analysis =====
  const orgContext = teamAnalysis?.organizationContext;
  const actualOnboarding = orgContext?.hasOnboarding !== undefined ? orgContext.hasOnboarding : hasOnboarding;
  const actualVersionControl = orgContext?.hasVersionControl !== undefined ? orgContext.hasVersionControl : hasCICD;
  const actualMaturity = orgContext?.maturity;
  
  // Calculate maturity score
  let maturityScore = 0;
  maturityScore += actualOnboarding ? 1 : 0;
  maturityScore += actualVersionControl ? 1 : 0;
  maturityScore += toolsFragmentation === 'low' ? 1 : (toolsFragmentation === 'medium' ? 0.5 : 0);
  maturityScore += distributedExp === 'high' ? 1 : (distributedExp === 'medium' ? 0.5 : 0);
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  
  if (maturityScore < 1.5) {
    severity = 'medium-high';
    probability = 0.70;
    reasoning.push(`Baja madurez de procesos: score ${maturityScore.toFixed(1)}/4`);
    reasoning.push(`Onboarding: ${hasOnboarding ? 'Sí' : 'No'}`);
    reasoning.push(`CI/CD: ${hasCICD ? 'Sí' : 'No/Parcial'}`);
    reasoning.push(`Tools fragmentation: ${toolsFragmentation}`);
    recommendations.push('Simplificar procesos para el contexto');
    recommendations.push('Consolidar herramientas (máximo 2-3)');
    recommendations.push('Crear lightweight onboarding checklist');
    recommendations.push('Adaptar ceremonias para distribuido');
  } else if (maturityScore < 2.5) {
    severity = 'medium';
    probability = 0.55;
    reasoning.push(`Madurez moderada: score ${maturityScore.toFixed(1)}/4`);
    recommendations.push('Fortalecer procesos débiles');
    recommendations.push('Documentar workflows');
  } else {
    return null;
  }
  
  return {
    type: 'process_mismatch',
    title: 'Procesos Inadecuados',
    description: `Madurez organizacional baja (${maturityScore.toFixed(1)}/4) con herramientas fragmentadas y procesos inconsistentes. Riesgo de ineficiencias`,
    category: 'management',
    severity,
    probability,
    confidence: 0.65,
    source: 'expert_rules',
    reasoning,
    indicators: [
      `Maturity score: ${maturityScore.toFixed(1)}/4`,
      `Onboarding: ${hasOnboarding ? 'Yes' : 'No'}`,
      `CI/CD: ${hasCICD ? 'Yes' : 'No'}`,
      `Tools: ${toolsFragmentation}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 5,
        max: 20,
        description: 'Ineficiencias por procesos'
      },
      budgetOverrun: {
        min: 10,
        max: 25,
        description: 'Overhead administrativo'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Meeting time > 30% del tiempo', threshold: '30%', checkFrequency: 'weekly' },
      { signal: 'Tool-switching frecuente', threshold: '> 5 tools', checkFrequency: 'monthly' },
      { signal: 'Onboarding > 2 semanas', threshold: '2 weeks', checkFrequency: 'per hire' }
    ]
  };
}

/**
 * RULE 7: Infrastructure Risk
 * Detects technical infrastructure issues
 */
function checkInfrastructureRisk(project) {
  const hasCICD = project.hasVersionControlAndCICD;
  const sharedInfra = project.sharedInfrastructureDependency;
  const complexity = project.systemComplexity;
  const requiresTools = project.requiresSpecializedTools?.needed || false;
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  
  // Factor 1: No CI/CD
  if (hasCICD === 'no' || hasCICD === 'partial') {
    severity = 'medium';
    probability = 0.60;
    reasoning.push(`CI/CD ${hasCICD === 'no' ? 'inexistente' : 'parcial'}`);
    recommendations.push('Implementar CI/CD completo desde día 1');
    recommendations.push('Automated testing obligatorio');
  }
  
  // Factor 2: High shared infrastructure dependency
  if (sharedInfra === 'high' && complexity === 'high') {
    severity = 'medium-high';
    probability = Math.min(probability + 0.15, 0.85);
    reasoning.push('Alta dependencia de infraestructura compartida');
    recommendations.push('Dedicated DevOps support (0.5 FTE mínimo)');
    recommendations.push('Infrastructure hardening sprint');
  }
  
  // Factor 3: Requires specialized tools
  if (requiresTools) {
    probability = Math.min(probability + 0.10, 0.90);
    reasoning.push('Requiere herramientas especializadas');
    recommendations.push('Validar herramientas antes de iniciar');
    recommendations.push('Training en herramientas específicas');
  }
  
  if (severity === 'low') {
    return null;
  }
  
  return {
    type: 'technical_infrastructure',
    title: 'Infraestructura Técnica Deficiente',
    description: `Falta de CI/CD completo y herramientas especializadas para complejidad ${complexity}. Riesgo de problemas de despliegue y calidad`,
    category: 'technical',
    severity,
    probability,
    confidence: 0.60,
    source: 'expert_rules',
    reasoning,
    indicators: [
      `CI/CD: ${hasCICD}`,
      `Shared infra: ${sharedInfra || 'unknown'}`,
      `Complexity: ${complexity}`,
      `Specialized tools: ${requiresTools ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 5,
        max: 15,
        description: 'Pipeline failures y environment issues'
      },
      budgetOverrun: {
        min: 10,
        max: 20,
        description: 'Tiempo debugging infraestructura'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'low'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Pipeline failures > 20%', threshold: '20%', checkFrequency: 'weekly' },
      { signal: 'Deployment time > 1h', threshold: '1 hour', checkFrequency: 'per deployment' },
      { signal: 'Environment drifts', threshold: '> 1 drift', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * RULE 8: Quality Degradation Risk
 * Detects potential quality issues
 * NOW USES: team.personality (conscientiousness), team.workload
 */
function checkQualityRisk(project, teamAnalysis) {
  const complexity = project.systemComplexity;
  const docLevel = project.documentationLevel;
  const hasCICD = project.hasVersionControlAndCICD;
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  
  // ===== NEW: Use personality traits (conscientiousness) =====
  const personality = teamAnalysis?.personality;
  if (personality && personality.concerns) {
    const lowDiscipline = personality.concerns.find(c => 
      c.type === 'low_discipline' || (typeof c === 'string' && c.includes('disciplina'))
    );
    
    if (lowDiscipline) {
      riskScore += 3;
      severity = 'medium-high';
      probability = 0.75;
      reasoning.push('ALERTA: Equipo con baja conscientiousness (riesgo de calidad)');
      recommendations.push('Code reviews obligatorios con checklist estricto');
      recommendations.push('Automated testing con > 80% coverage');
      recommendations.push('Definition of Done muy específica');
    }
  }
  
  // ===== NEW: Use workload (tired teams = quality issues) =====
  const workload = teamAnalysis?.workload;
  if (workload && workload.isOverloaded) {
    riskScore += 2;
    severity = severity === 'medium-high' ? 'high' : 'medium-high';
    probability = Math.max(probability, 0.70);
    reasoning.push('Equipo sobrecargado → mayor probabilidad de errores');
    recommendations.push('Reducir velocidad 20% para mantener calidad');
  }
  
  // Factor 1: Experience vs complexity
  const experience = teamAnalysis?.experience;
  if (complexity === 'high' && experience && experience.overallLevel === 'junior') {
    riskScore += 3;
    severity = 'high';
    probability = Math.max(probability, 0.75);
    reasoning.push('Alta complejidad con equipo junior');
    recommendations.push('Pair programming obligatorio');
    recommendations.push('Weekly architecture reviews');
  } else if (complexity === 'high' && experience && experience.overallLevel === 'mid') {
    riskScore += 2;
    severity = severity === 'high' ? 'high' : 'medium-high';
    probability = Math.max(probability, 0.65);
    reasoning.push('Alta complejidad con equipo mid');
    recommendations.push('Code reviews < 24h SLA');
    probability = 0.55;
    reasoning.push('Alta complejidad del sistema');
    recommendations.push('Enforce testing strategy');
    recommendations.push('Regular quality checkpoints');
  }
  
  // Factor 2: Poor documentation
  if (docLevel === 'minimal' || docLevel === 'none') {
    probability = Math.min(probability + 0.15, 0.85);
    reasoning.push('Documentación mínima/inexistente');
    recommendations.push('Documentación técnica obligatoria');
    recommendations.push('Living documentation approach');
  }
  
  // Factor 3: No CI/CD
  if (hasCICD === 'no') {
    probability = Math.min(probability + 0.10, 0.90);
    reasoning.push('Sin CI/CD (mayor riesgo de bugs)');
    recommendations.push('Implementar automated testing');
  }
  
  if (severity === 'low') {
    return null;
  }
  
  return {
    type: 'quality_degradation',
    title: 'Degradación de Calidad',
    description: personalityIssues.length > 0
      ? `Rasgos de personalidad problemáticos detectados: ${personalityIssues.map(i => i.type).join(', ')}. Riesgo de baja calidad del código`
      : `Complejidad ${complexity} con equipo de experiencia promedio ${avgExperience.toFixed(1)}/5. Riesgo de calidad subóptima`,
    category: 'technical',
    severity,
    probability,
    confidence: 0.65,
    source: 'expert_rules',
    reasoning,
    indicators: [
      `Complexity: ${complexity}`,
      `Team experience: ${avgExperience.toFixed(1)}/5`,
      `Documentation: ${docLevel}`,
      `CI/CD: ${hasCICD}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 10,
        max: 30,
        description: 'Bugs y technical debt'
      },
      budgetOverrun: {
        min: 15,
        max: 35,
        description: 'Firefighting y rework'
      },
      qualityImpact: 'high',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Bug rate > 0.15', threshold: '0.15', checkFrequency: 'weekly' },
      { signal: 'Test coverage < 60%', threshold: '60%', checkFrequency: 'per sprint' },
      { signal: 'Technical debt backlog crece', threshold: '> 10% growth', checkFrequency: 'per sprint' }
    ]
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate average team experience
 */
function calculateTeamExperience(team) {
  if (!team || team.length === 0) return 2.5;
  
  // If team members have experience data
  let totalExp = 0;
  let count = 0;
  
  team.forEach(member => {
    // Assuming member has yearsOfExperience field
    if (member.yearsOfExperience) {
      totalExp += member.yearsOfExperience;
      count++;
    }
  });
  
  if (count === 0) return 2.5; // Default to mid-level
  
  const avgYears = totalExp / count;
  
  // Convert years to 1-5 scale
  if (avgYears < 1) return 1;
  if (avgYears < 3) return 2;
  if (avgYears < 5) return 3;
  if (avgYears < 8) return 4;
  return 5;
}

/**
 * Calculate technology match between project and team
 */
function calculateTechMatch(requiredTechs, team) {
  if (!requiredTechs || requiredTechs.length === 0) return 0.8;
  if (!team || team.length === 0) return 0.3;
  
  // Count how many team members know each required tech
  const techCoverage = requiredTechs.map(tech => {
    const membersWithTech = team.filter(member => {
      // Assuming member has skills/technologies array
      const skills = member.skills || member.technologies || [];
      return skills.some(skill => 
        skill.toLowerCase().includes(tech.toLowerCase()) ||
        tech.toLowerCase().includes(skill.toLowerCase())
      );
    });
    
    return membersWithTech.length / team.length;
  });
  
  // Average coverage across all techs
  const avgCoverage = techCoverage.reduce((sum, cov) => sum + cov, 0) / techCoverage.length;
  
  return avgCoverage;
}

/**
 * Get numeric severity score
 */
function getSeverityScore(severity) {
  const scores = {
    'low': 1,
    'medium': 2,
    'medium-high': 3,
    'high': 4,
    'critical': 5
  };
  return scores[severity] || 2;
}

/**
 * NEW RULE 9: Knowledge Management Gap
 * Detects lack of adequate tools/methodologies for knowledge management
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
function checkKnowledgeManagementRisk(project, team, organization) {
  const hasKMTools = project?.hasKnowledgeManagementTools;
  const docLevel = project?.documentationLevel || 'unknown';
  const hasStandardization = project?.documentationProcesses?.hasStandardization;
  const orgHasKB = organization?.knowledgeManagement?.hasKnowledgeBase;
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  let dataPoints = 0; // Track available information
  let totalDataPoints = 4;
  
  // Factor 1: No KM tools (only if explicitly false)
  if (hasKMTools === false && orgHasKB === false) {
    riskScore += 3;
    severity = 'medium-high';
    probability = 0.75;
    reasoning.push('Proyecto sin herramientas de gestión del conocimiento');
    recommendations.push('URGENTE: Implementar sistema de gestión del conocimiento (Confluence, Notion, SharePoint)');
    dataPoints += 2;
  } else if (hasKMTools === true || orgHasKB === true) {
    dataPoints += 2;
    // Has tools, no risk
  } else if (hasKMTools === undefined && orgHasKB === undefined) {
    // Unknown - assume moderate risk
    riskScore += 1;
    probability = 0.40;
    reasoning.push('Información de herramientas KM no disponible (asumiendo riesgo moderado)');
    recommendations.push('Evaluar e implementar herramientas de gestión del conocimiento');
  } else {
    dataPoints += 1; // Partial data
  }
  
  // Factor 2: Minimal documentation
  if (docLevel === 'minimal' || docLevel === 'none') {
    riskScore += 2;
    probability = Math.min(probability + 0.15, 0.90);
    reasoning.push('Nivel de documentación mínimo o inexistente');
    recommendations.push('Establecer procesos de documentación estandarizados');
    dataPoints++;
  } else if (docLevel !== 'unknown') {
    dataPoints++;
  }
  
  // Factor 3: No standardization (only if explicitly false)
  if (hasStandardization === false) {
    riskScore += 1;
    reasoning.push('Sin estandarización en procesos de documentación');
    recommendations.push('Crear plantillas y guías de documentación');
    dataPoints++;
  } else if (hasStandardization === true) {
    dataPoints++;
  }
  
  // Factor 4: Team lacks KM experience (optional)
  if (team && team.members && team.members.length > 0) {
    const membersWithKMExperience = team.members.filter(m => 
      m.cv?.communicationSkills?.knowledgeManagementTools?.length > 0 ||
      m.cv?.communicationSkills?.documentationExperience
    ).length;
    
    const experienceRatio = membersWithKMExperience / team.members.length;
    
    if (experienceRatio < 0.3 && riskScore > 0) {
      riskScore += 2;
      reasoning.push(`Solo ${Math.round(experienceRatio * 100)}% del equipo tiene experiencia en KM`);
      recommendations.push('Capacitar al equipo en uso de herramientas de gestión del conocimiento');
    }
    dataPoints++;
  }
  
  // Determine final severity
  if (riskScore >= 6) {
    severity = 'high';
    probability = Math.min(0.85, probability);
  } else if (riskScore >= 4) {
    severity = 'medium-high';
    probability = Math.min(0.70, probability);
  } else if (riskScore >= 2) {
    severity = 'medium';
    probability = Math.min(0.55, probability);
  }
  
  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.30, baseConfidence * 0.85);
  
  if (riskScore < 1) {
    return null;
  }
  
  return {
    type: 'knowledge_management_gap',
    title: 'Brecha en Gestión del Conocimiento',
    description: hasKMTools 
      ? `Sin estandarización en procesos de documentación a pesar de tener herramientas. Riesgo de pérdida de información`
      : `No hay herramientas de gestión del conocimiento para proyecto ${project.systemComplexity || 'medium'}. Riesgo de información fragmentada`,
    category: 'management',
    severity,
    probability,
    confidence: adjustedConfidence,
    source: 'expert_rules_enhanced',
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    reasoning,
    indicators: [
      `KM Tools: ${hasKMTools ? 'Yes' : 'No'}`,
      `Documentation: ${docLevel}`,
      `Standardization: ${hasStandardization ? 'Yes' : 'No'}`,
      `Org KM: ${orgHasKB ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 30 : 15,
        description: 'Pérdida de información, sobrecarga de comunicación'
      },
      budgetOverrun: {
        min: severity === 'high' ? 12 : 8,
        max: severity === 'high' ? 25 : 15,
        description: 'Retrabajos por información perdida'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Información perdida/recreada > 2 veces', threshold: '2 instances', checkFrequency: 'per sprint' },
      { signal: 'Preguntas repetitivas en comunicaciones', threshold: 'subjective', checkFrequency: 'weekly' },
      { signal: 'Tiempo buscando información > 2h/día', threshold: '2 hours', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * NEW RULE 10: Remote Work Support Gap
 * Detects inadequate support for remote work
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
function checkRemoteWorkSupportRisk(project, team, organization) {
  const workModel = project?.workModel?.type || 'unknown';
  const hasRemotePolicy = organization?.remoteWorkConfiguration?.hasRemoteWorkPolicy;
  const providesTechSupport = organization?.remoteWorkConfiguration?.providesTechSupport;
  const vpnAccess = organization?.remoteWorkConfiguration?.vpnAccess;
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  let dataPoints = 0;
  let totalDataPoints = 4;
  
  // Only applicable if remote or hybrid
  if (workModel === 'on-site') {
    return null;
  }
  
  // If workModel unknown, assume hybrid and flag it
  if (workModel === 'unknown') {
    reasoning.push('Modelo de trabajo no especificado (asumiendo híbrido)');
    recommendations.push('Definir claramente el modelo de trabajo del proyecto');
  }
  
  // Factor 1: No remote work policy (only if explicitly false)
  if (hasRemotePolicy === false) {
    riskScore += 3;
    severity = 'medium-high';
    probability = 0.70;
    reasoning.push('Trabajo remoto sin políticas claras establecidas');
    recommendations.push('URGENTE: Establecer políticas claras de trabajo remoto');
    dataPoints++;
  } else if (hasRemotePolicy === true) {
    dataPoints++;
  } else if (workModel === 'remote' || workModel === 'hybrid') {
    // Unknown but remote/hybrid - flag as potential issue
    riskScore += 1;
    probability = 0.45;
    reasoning.push('Políticas de trabajo remoto no especificadas');
    recommendations.push('Verificar y documentar políticas de trabajo remoto');
  }
  
  // Factor 2: No tech support (only if explicitly false)
  if (providesTechSupport === false) {
    riskScore += 2;
    probability = Math.min(probability + 0.15, 0.85);
    reasoning.push('Sin soporte técnico para empleados remotos');
    recommendations.push('Proveer soporte técnico y de infraestructura');
    dataPoints++;
  } else if (providesTechSupport === true) {
    dataPoints++;
  }
  
  // Factor 3: No VPN or security (only if explicitly false)
  if (vpnAccess === false && (workModel === 'remote' || workModel === 'hybrid')) {
    riskScore += 2;
    reasoning.push('Sin VPN o acceso seguro para trabajo remoto');
    recommendations.push('Implementar VPN y medidas de seguridad');
    dataPoints++;
  } else if (vpnAccess === true) {
    dataPoints++;
  }
  
  // Factor 4: Team lacks remote experience (optional)
  if (team && team.members && team.members.length > 0) {
    const avgRemoteExp = team.members.reduce((sum, m) => 
      sum + (m.cv?.remoteWorkExperience?.yearsRemote || 0), 0
    ) / team.members.length;
    
    if (avgRemoteExp < 1 && riskScore > 0) {
      riskScore += 2;
      severity = severity === 'low' ? 'medium' : 'high';
      reasoning.push(`Experiencia remota promedio muy baja: ${avgRemoteExp.toFixed(1)} años`);
      recommendations.push('Proveer training en mejores prácticas de trabajo remoto');
    }
    dataPoints++;
  }
  
  // Determine final severity
  if (riskScore >= 7) {
    severity = 'high';
    probability = Math.min(0.85, probability);
  } else if (riskScore >= 4) {
    severity = 'medium-high';
    probability = Math.min(0.70, probability);
  } else if (riskScore >= 2) {
    severity = 'medium';
    probability = Math.min(0.55, probability);
  }
  
  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.30, baseConfidence * 0.80);
  
  if (riskScore < 1) {
    return null;
  }
  
  return {
    type: 'remote_work_support_gap',
    title: 'Soporte Inadecuado para Trabajo Remoto',
    description: `Equipo distribuido sin herramientas adecuadas de colaboración remota. ${!hasRemotePolicy ? 'No hay políticas de trabajo remoto definidas' : 'Infraestructura deficiente'}`,
    category: 'organizational',
    severity,
    probability,
    confidence: adjustedConfidence,
    source: 'expert_rules_enhanced',
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    reasoning,
    indicators: [
      `Work Model: ${workModel}`,
      `Remote Policy: ${hasRemotePolicy ? 'Yes' : 'No'}`,
      `Tech Support: ${providesTechSupport ? 'Yes' : 'No'}`,
      `VPN Access: ${vpnAccess ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 5,
        max: 20,
        description: 'Aislamiento, problemas técnicos'
      },
      budgetOverrun: {
        min: 8,
        max: 20,
        description: 'Baja productividad por falta de soporte'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Quejas sobre aislamiento', threshold: '> 2 per month', checkFrequency: 'monthly' },
      { signal: 'Problemas técnicos recurrentes', threshold: '> 3 per week', checkFrequency: 'weekly' },
      { signal: 'Disminución en participación', threshold: 'subjective', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * NEW RULE 11: Role Clarity Gap
 * Detects lack of clarity in roles and responsibilities
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
function checkRoleClarityRisk(project, team) {
  const rolesCount = project?.rolesAndResponsibilities?.length || project?.keyRoles?.length || 0;
  const hasOrgChart = project?.hasOrganizationalChart;
  const hasTaskTracking = project?.hasTaskTrackingTool;
  const teamSize = team?.size || team?.members?.length || 0;
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  let dataPoints = 0;
  let totalDataPoints = 4;
  
  // Only applicable for teams > 3
  if (teamSize <= 3) {
    return null;
  }
  
  // Factor 1: Roles not defined for all members
  if (rolesCount > 0 && rolesCount < teamSize) {
    riskScore += 3;
    severity = 'medium-high';
    probability = 0.68;
    reasoning.push(`Solo ${rolesCount} roles definidos para ${teamSize} miembros`);
    recommendations.push('Definir y comunicar roles para todos los miembros');
    dataPoints++;
  } else if (rolesCount === 0 && teamSize > 0) {
    riskScore += 2;
    probability = 0.50;
    reasoning.push('No se han definido roles para el equipo');
    recommendations.push('Definir roles y responsabilidades claramente');
  } else if (rolesCount >= teamSize) {
    dataPoints++;
  }
  
  // Factor 2: No organizational chart (only if explicitly false)
  if (hasOrgChart === false && teamSize >= 5) {
    riskScore += 2;
    reasoning.push('Sin organigrama para equipo grande');
    recommendations.push('Implementar organigrama del proyecto');
    dataPoints++;
  } else if (hasOrgChart === true) {
    dataPoints++;
  } else if (hasOrgChart === undefined && teamSize >= 5) {
    riskScore += 1;
    reasoning.push('Organigrama no especificado para equipo grande');
    recommendations.push('Considerar crear organigrama del proyecto');
  }
  
  // Factor 3: No task tracking (only if explicitly false)
  if (hasTaskTracking === false) {
    riskScore += 2;
    probability = Math.min(probability + 0.12, 0.80);
    reasoning.push('Sin herramienta de seguimiento de tareas');
    recommendations.push('Usar herramientas colaborativas para seguimiento (Jira, Asana, Trello)');
    dataPoints++;
  } else if (hasTaskTracking === true) {
    dataPoints++;
  }
  
  // Factor 4: Low clarity scores (optional)
  if (project?.rolesAndResponsibilities && project.rolesAndResponsibilities.length > 0) {
    const avgClarity = project.rolesAndResponsibilities.reduce((sum, role) => 
      sum + (role.clarityScore || 3), 0
    ) / project.rolesAndResponsibilities.length;
    
    if (avgClarity < 3) {
      riskScore += 2;
      reasoning.push(`Nivel de claridad promedio bajo: ${avgClarity.toFixed(1)}/5`);
      recommendations.push('Clarificar responsabilidades con matriz RACI');
    }
    dataPoints++;
  }
  
  // Determine final severity
  if (riskScore >= 7) {
    severity = 'high';
    probability = Math.min(0.80, probability);
  } else if (riskScore >= 4) {
    severity = 'medium-high';
    probability = Math.min(0.68, probability);
  } else if (riskScore >= 2) {
    severity = 'medium';
    probability = Math.min(0.50, probability);
  }
  
  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.35, baseConfidence * 0.75);
  
  if (riskScore < 1) {
    return null;
  }
  
  return {
    type: 'role_clarity_gap',
    title: 'Falta de Claridad en Roles',
    description: `Solo ${rolesCount} de ${teamSize} miembros tienen roles definidos. ${!hasOrgChart ? 'No hay organigrama del proyecto' : 'Roles insuficientemente definidos'}`,
    category: 'management',
    severity,
    probability,
    confidence: adjustedConfidence,
    source: 'expert_rules_enhanced',
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    reasoning,
    indicators: [
      `Roles Defined: ${rolesCount}/${teamSize}`,
      `Org Chart: ${hasOrgChart ? 'Yes' : 'No'}`,
      `Task Tracking: ${hasTaskTracking ? 'Yes' : 'No'}`,
      `Team Size: ${teamSize}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 8,
        max: 25,
        description: 'Conflictos, falta de coordinación'
      },
      budgetOverrun: {
        min: 10,
        max: 20,
        description: 'Tareas duplicadas, coordinación ineficiente'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Tareas sin asignar > 20%', threshold: '20%', checkFrequency: 'weekly' },
      { signal: 'Conflictos sobre responsabilidades', threshold: '> 2 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Trabajo duplicado detectado', threshold: '> 1 instance', checkFrequency: 'per sprint' }
    ]
  };
}

/**
 * NEW RULE 12: Standards Compliance Gap
 * Detects discrepancies in standards compliance due to cultural differences
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
function checkStandardsComplianceRisk(project, team) {
  const culturalDiversity = project?.culturalDiversityLevel || 'unknown';
  const hasStandards = project?.hasStandardizedProcedures;
  const requiresCompliance = project?.requiresRegulatoryCompliance;
  const complianceStandards = project?.complianceStandards || [];
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  let dataPoints = 0;
  let totalDataPoints = 4;
  
  // Only applicable if requires compliance (or unknown)
  if (requiresCompliance === false) {
    return null;
  }
  
  if (requiresCompliance === true) {
    dataPoints++;
  }
  
  // Count unique countries/cultures in team
  let uniqueCultures = 0;
  if (team && team.members && team.members.length > 0) {
    const countries = new Set(team.members
      .map(m => m.user?.country || m.user?.nationality)
      .filter(c => c)
    );
    uniqueCultures = countries.size;
    dataPoints++;
  }
  
  // Factor 1: No standardized procedures with multiple cultures (only if explicitly false)
  if (hasStandards === false && uniqueCultures >= 3) {
    riskScore += 4;
    severity = 'high';
    probability = 0.72;
    reasoning.push(`${uniqueCultures} culturas diferentes sin procedimientos estandarizados`);
    recommendations.push('URGENTE: Estandarizar regulaciones y procedimientos de control');
    dataPoints++;
  } else if (hasStandards === false && (uniqueCultures >= 2 || culturalDiversity === 'medium' || culturalDiversity === 'high')) {
    riskScore += 2;
    probability = 0.55;
    reasoning.push('Múltiples culturas sin procedimientos estandarizados');
    recommendations.push('Estandarizar procedimientos para evitar malentendidos');
    dataPoints++;
  } else if (hasStandards === true) {
    dataPoints++;
  } else if (hasStandards === undefined && requiresCompliance === true) {
    riskScore += 1;
    reasoning.push('Procedimientos estandarizados no especificados');
    recommendations.push('Verificar y documentar procedimientos estandarizados');
  }
  
  // Factor 2: Compliance required but no clear standards
  if (complianceStandards.length === 0 && requiresCompliance === true) {
    riskScore += 2;
    reasoning.push('Requiere cumplimiento pero sin estándares documentados');
    recommendations.push('Documentar todos los estándares de cumplimiento claramente');
    dataPoints++;
  } else if (complianceStandards.length > 0) {
    dataPoints++;
  }
  
  // Factor 3: High cultural diversity
  if (culturalDiversity === 'high' || uniqueCultures >= 4) {
    riskScore += 2;
    probability = Math.min(probability + 0.10, 0.85);
    reasoning.push('Alta diversidad cultural puede generar diferentes interpretaciones');
    recommendations.push('Capacitación regular en cumplimiento normativo');
  } else if (culturalDiversity === 'medium' || uniqueCultures === 3) {
    riskScore += 1;
    reasoning.push('Diversidad cultural moderada');
    recommendations.push('Revisar regularmente interpretación de estándares');
  }
  
  // Determine final severity
  if (riskScore >= 6) {
    severity = 'high';
    probability = Math.min(0.80, probability);
  } else if (riskScore >= 4) {
    severity = 'medium-high';
    probability = Math.min(0.68, probability);
  } else if (riskScore >= 2) {
    severity = 'medium';
    probability = Math.min(0.55, probability);
  }
  
  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.30, baseConfidence * 0.70);
  
  if (riskScore < 1) {
    return null;
  }
  
  return {
    type: 'standards_compliance_gap',
    title: 'Brecha en Cumplimiento de Estándares',
    description: `Proyecto requiere cumplimiento de ${complianceStandards.length} estándar(es) con diversidad cultural ${culturalDiversity}. Riesgo de interpretaciones inconsistentes`,
    category: 'organizational',
    severity,
    probability,
    confidence: adjustedConfidence,
    source: 'expert_rules_enhanced',
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    reasoning,
    indicators: [
      `Cultural Diversity: ${culturalDiversity}`,
      `Unique Cultures: ${uniqueCultures}`,
      `Has Standards: ${hasStandards ? 'Yes' : 'No'}`,
      `Compliance Standards: ${complianceStandards.length}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 10,
        max: 30,
        description: 'Conflictos por interpretaciones diferentes'
      },
      budgetOverrun: {
        min: 12,
        max: 25,
        description: 'Retrabajos por incumplimiento'
      },
      qualityImpact: 'high',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Desacuerdos sobre procedimientos', threshold: '> 2 per month', checkFrequency: 'monthly' },
      { signal: 'Auditorías fallidas', threshold: '> 1', checkFrequency: 'per audit' },
      { signal: 'Incumplimientos detectados', threshold: '> 0', checkFrequency: 'continuous' }
    ]
  };
}

/**
 * NEW RULE 13: Timezone Scheduling Gap (More Specific)
 * Detects planning issues due to timezone differences
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
function checkTimezoneSchedulingRisk(project, team) {
  const hasSchedulingPolicy = project?.hasTimezoneSchedulingPolicy;
  const coreHours = project?.coreHours;
  const meetingRotation = project?.meetingRotationPolicy;
  const requiresOffHours = project?.requiresOffHoursReporting;
  
  const reasoning = [];
  const recommendations = [];
  let severity = 'low';
  let probability = 0.3;
  let riskScore = 0;
  let dataPoints = 0;
  let totalDataPoints = 5;
  
  // Get timezones from team
  let uniqueTimezones = 0;
  let maxDifference = 0;
  let membersWithFlexibility = 0;
  
  if (team && team.members && team.members.length > 0) {
    const timezones = team.members
      .map(m => m.user?.timezone)
      .filter(tz => tz);
    
    uniqueTimezones = new Set(timezones).size;
    
    // Count flexible members
    membersWithFlexibility = team.members.filter(m => 
      m.user?.flexibleSchedule || 
      m.cv?.remoteWorkExperience?.timezoneFlexibility
    ).length;
    
    // Estimate time difference (simplified)
    if (uniqueTimezones > 1) {
      maxDifference = uniqueTimezones * 3; // Rough estimate
    }
    dataPoints++;
  }
  
  // Only applicable if multiple timezones or timezone data unknown
  if (uniqueTimezones <= 1 && dataPoints > 0) {
    return null;
  }
  
  // If no timezone data, assume moderate risk for distributed teams
  if (uniqueTimezones === 0) {
    uniqueTimezones = 2; // Assume some distribution
    reasoning.push('Información de zonas horarias no disponible');
    recommendations.push('Recopilar información de zonas horarias del equipo');
  }
  
  // Factor 1: No scheduling policy with multiple timezones (only if explicitly false)
  if (hasSchedulingPolicy === false && uniqueTimezones >= 2) {
    riskScore += 3;
    severity = 'medium-high';
    probability = 0.80;
    reasoning.push(`${uniqueTimezones} zonas horarias sin política de programación`);
    recommendations.push('Establecer horario que considere todas las zonas horarias');
    recommendations.push('Definir ventanas de solapamiento claras para reuniones');
    dataPoints++;
  } else if (hasSchedulingPolicy === true) {
    dataPoints++;
  } else if (hasSchedulingPolicy === undefined && uniqueTimezones >= 2) {
    riskScore += 1;
    probability = 0.50;
    reasoning.push('Política de programación de zonas horarias no especificada');
    recommendations.push('Definir política de programación considerando zonas horarias');
  }
  
  // Factor 2: No core hours defined
  if (coreHours === undefined && uniqueTimezones >= 2) {
    riskScore += 2;
    reasoning.push('Sin horario de solapamiento definido');
    recommendations.push('Definir core hours obligatorias para todo el equipo');
  } else if (coreHours) {
    dataPoints++;
  }
  
  // Factor 3: Requires off-hours reporting
  if (requiresOffHours === true) {
    riskScore += 3;
    severity = severity === 'low' ? 'medium' : 'high';
    probability = Math.min(probability + 0.15, 0.90);
    reasoning.push('Requiere reportes en horarios fuera de jornada');
    recommendations.push('Programar distribución de actividades en horarios compatibles');
    recommendations.push('Usar herramientas para actualizaciones asíncronas');
    dataPoints++;
  } else if (requiresOffHours === false) {
    dataPoints++;
  }
  
  // Factor 4: No meeting rotation
  if (meetingRotation === false && uniqueTimezones >= 3) {
    riskScore += 1;
    reasoning.push('Sin rotación de horarios de reuniones');
    recommendations.push('Rotar horarios de reuniones para distribuir la carga');
    dataPoints++;
  } else if (meetingRotation === true) {
    dataPoints++;
  }
  
  // Factor 5: Low flexibility in team
  if (team && team.members && team.members.length > 0) {
    const flexibilityRatio = membersWithFlexibility / team.members.length;
    if (flexibilityRatio < 0.3 && uniqueTimezones >= 2) {
      riskScore += 2;
      reasoning.push(`Solo ${Math.round(flexibilityRatio * 100)}% del equipo tiene flexibilidad horaria`);
      recommendations.push('Incorporar empleados con flexibilidad de horarios');
    }
  }
  
  // Determine final severity
  if (riskScore >= 8) {
    severity = 'high';
    probability = Math.min(0.90, probability);
  } else if (riskScore >= 5) {
    severity = 'medium-high';
    probability = Math.min(0.75, probability);
  } else if (riskScore >= 3) {
    severity = 'medium';
    probability = Math.min(0.60, probability);
  }
  
  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.35, baseConfidence * 0.85);
  
  if (riskScore < 1) {
    return null;
  }
  
  return {
    type: 'timezone_scheduling_gap',
    title: 'Problemas de Programación por Zonas Horarias',
    description: uniqueTimezones > 1
      ? `${uniqueTimezones} zonas horarias sin política de programación. ${requiresOffHours === true ? 'Requiere trabajo fuera de horario' : 'Coordinación compleja'}`
      : `Información de zonas horarias no disponible. Riesgo de conflictos de programación`,
    category: 'coordination',
    severity,
    probability,
    confidence: adjustedConfidence,
    source: 'expert_rules_enhanced',
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    reasoning,
    indicators: [
      `Timezones: ${uniqueTimezones}`,
      `Scheduling Policy: ${hasSchedulingPolicy ? 'Yes' : 'No'}`,
      `Core Hours: ${coreHours ? 'Yes' : 'No'}`,
      `Off-Hours Required: ${requiresOffHours ? 'Yes' : 'No'}`,
      `Flexible Members: ${membersWithFlexibility}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: 10,
        max: 35,
        description: 'Desincronización de entregables, presión de trabajo'
      },
      budgetOverrun: {
        min: 12,
        max: 28,
        description: 'Ineficiencia por mala coordinación temporal'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    affectedTimezones: uniqueTimezones,
    earlyWarningSignals: [
      { signal: 'Entregas desincronizadas', threshold: '> 2 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Quejas sobre horarios', threshold: '> 3 per month', checkFrequency: 'monthly' },
      { signal: 'Moral del equipo baja', threshold: 'subjective', checkFrequency: 'weekly' }
    ]
  };
}

module.exports = {
  predictRisksWithRules,
  checkCommunicationRisk,
  checkSkillGapRisk,
  checkTeamOverloadRisk,
  checkDependencyRisk,
  checkScopeCreepRisk,
  checkProcessRisk,
  checkInfrastructureRisk,
  checkQualityRisk,
  checkKnowledgeManagementRisk,
  checkRemoteWorkSupportRisk,
  checkRoleClarityRisk,
  checkStandardsComplianceRisk,
  checkTimezoneSchedulingRisk,
  checkConflictEscalationRisk,
  checkChangeResistanceRisk,
  checkBurnoutSusceptibilityRisk,
  calculateTeamExperience,
  calculateTechMatch,
  DIMENSION_WEIGHTS
};

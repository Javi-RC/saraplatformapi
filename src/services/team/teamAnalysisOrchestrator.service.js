const teamSelectionService = require('./teamSelection.service');
const teamSynergyService = require('./teamSynergy.service');
const personalityOptimizer = require('./personalityOptimizer.service');
const { cvRepository, bfi44Repository, organizationRepository } = require('../../repositories');
const { toStableBfi44Profile } = require('../../utils/bfi44ProfileMapper');
const { getConfigSection } = require('../../config/teamSelectionDefaults');
const { translateSynergyObject, translateSynergyValidation, translateSynergyValidations } = require('../../i18n/i18n.service');

/**
 * Team Analysis Controller Service
 * Business logic extracted from ProjectController.getTeamAnalysis
 */

function getSynergyRequirements(project) {
  const phase2Config = getConfigSection(project, 'phase2');
  return {
    projectType: project.projectType,
    requiredExperienceLevel: project.requiredExperienceLevel,
    expectedDuration: project.expectedDuration,
    isInnovative: project.isInnovative,
    isMaintenance: project.isMaintenance,
    synergyWeights: phase2Config?.synergyWeights
  };
}

/**
 * Analyze the current team composition for a project
 * Fetches CVs, BFI-44 profiles, calculates scores, summary and synergy
 */
async function analyzeCurrentTeam(project, organizationId, lang) {
  const phase1Config = getConfigSection(project, 'phase1');

  const userIds = project.assignedEmployees
    .filter(emp => emp.user != null)
    .map(emp => emp.user._id);
  const cvs = await cvRepository.find({
    userId: { $in: userIds },
    organization: organizationId,
    organizationStatus: 'accepted'
  }, { populate: { path: 'userId', select: 'name email avatar' } });

  const validCvs = cvs.filter(cv => cv.userId != null);

  const currentBfi44Profiles = await bfi44Repository.find({
    userId: { $in: validCvs.map(cv => cv.userId._id) }
  });

  const currentBfi44Map = new Map(
    currentBfi44Profiles.map(profile => [profile.userId.toString(), profile])
  );

  const teamMembers = await Promise.all(
    validCvs.map(async cv => {
      const score = await teamSelectionService.calculateEmployeeScore(
        cv,
        (project.mainTechnologies || []).map(t =>
          teamSelectionService.normalizeTechnology(t)
        ),
        project.requiredExperienceLevel || 'mid',
        project.weeklyHoursPerMember || 40,
        phase1Config
      );

      const matchScore = teamSelectionService.calculateMatchScore(score.total, score.details);

      const bfi44Profile = currentBfi44Map.get(cv.userId._id.toString());

      return {
        userId: cv.userId._id,
        user: {
          ...cv.userId.toObject(),
          bfi44Profile: bfi44Profile ? toStableBfi44Profile(bfi44Profile.results) : null
        },
        cv: cv,
        score: score.total,
        matchScore: matchScore,
        details: score.details,
        matchedSkills: score.matchedSkills,
        missingSkills: score.missingSkills
      };
    })
  );

  const teamSummary = teamSelectionService.getTeamSummary(teamMembers);

  let synergy = null;
  try {
    const synergyRequirements = getSynergyRequirements(project);
    const rawSynergy = await teamSynergyService.explainTeamSynergy(
      project.assignedEmployees,
      synergyRequirements
    );
    synergy = translateSynergyObject(rawSynergy, lang);
  } catch (synergyError) {
    console.error('Error calculating current team synergy:', synergyError);
  }

  return { teamMembers, teamSummary, synergy };
}

/**
 * Suggest complementary team members to fill remaining slots
 * Uses teamSelectionService to find best candidates and validates synergy
 */
async function suggestComplementary(project, organizationId, lang) {
  const currentTeamSize = project.assignedEmployees?.length || 0;
  const targetTeamSize = project.teamSize || 5;
  const remainingSlots = Math.max(0, targetTeamSize - currentTeamSize);

  if (remainingSlots <= 0) {
    return null;
  }

  const currentUserIds = project.assignedEmployees
    ?.filter(emp => emp.user != null)
    .map(emp => emp.user._id) || [];

  const result = await teamSelectionService.selectComplementaryTeam(
    project,
    organizationId,
    currentUserIds,
    remainingSlots
  );

  const suggestionsBfi44Profiles = await bfi44Repository.find({
    userId: { $in: result.suggestions.map(s => s.userId) }
  });

  const suggestionsBfi44Map = new Map(
    suggestionsBfi44Profiles.map(profile => [profile.userId.toString(), profile])
  );

  result.suggestions = result.suggestions.map(suggestion => {
    const synergyValidation = result.synergyValidation?.find(
      v => v.userId.toString() === suggestion.userId.toString()
    );
    const synergyBonus = teamSelectionService.calculateSynergyBonus(synergyValidation);
    const matchScore = teamSelectionService.calculateMatchScore(
      suggestion.score,
      suggestion.details,
      synergyBonus
    );

    const bfi44Profile = suggestionsBfi44Map.get(suggestion.userId.toString());

    return {
      ...suggestion,
      user: {
        ...suggestion.user,
        bfi44Profile: bfi44Profile ? toStableBfi44Profile(bfi44Profile.results) : null
      },
      matchScore,
      synergyBonus
    };
  });

  const suggestionsSummary = teamSelectionService.getTeamSummary(result.suggestions, result.metadata);
  const risks = teamSelectionService.generateTeamRisks(result.metadata, suggestionsSummary, project);

  const synergyValidation = result.synergyValidation
    ? translateSynergyValidations(result.synergyValidation, lang)
    : undefined;

  let projectedTeamSynergy = null;
  try {
    const projectedTeamMembers = [
      ...(project.assignedEmployees || []),
      ...(result.suggestions || []).map(s => ({ user: s.userId }))
    ];

    const synergyRequirements = getSynergyRequirements(project);
    projectedTeamSynergy = translateSynergyObject(
      await teamSynergyService.explainTeamSynergy(
        projectedTeamMembers,
        synergyRequirements
      ),
      lang
    );
  } catch (synergyError) {
    console.error('Error calculating projected team synergy:', synergyError);
  }

  let message;
  if (currentTeamSize === 0) {
    message = `Project without a team. We suggest ${result.suggestions.length} employee(s) to get started.`;
  } else {
    message = `Current team: ${currentTeamSize}/${targetTeamSize}. We suggest ${result.suggestions.length} employee(s) to complete the team.`;
  }

  return {
    suggestions: result.suggestions,
    suggestionsSummary,
    suggestionsMetadata: result.metadata,
    synergyValidation,
    projectedTeamSynergy,
    risks,
    message
  };
}

/**
 * Score all available (non-assigned) employees in the organization
 * Calculates technical scores and personality synergy with the current team
 */
async function scoreAvailableEmployees(project, organizationId, suggestionUserIds, lang) {
  try {
    const organization = await organizationRepository.findById(organizationId);

    if (!organization) {
      return { availableEmployees: [], count: 0 };
    }

    const phase1Config = getConfigSection(project, 'phase1');

    const consideredUserIds = new Set([
      ...(project.assignedEmployees || [])
        .filter(emp => emp.user != null)
        .map(emp => emp.user._id.toString()),
      ...suggestionUserIds
    ]);

    const allEmployeeIds = organization.employees
      .filter(emp => emp.status === 'active')
      .map(emp => emp.user)
      .filter(userId => !consideredUserIds.has(userId.toString()));

    if (allEmployeeIds.length === 0) {
      return { availableEmployees: [], count: 0 };
    }

    const availableCvs = await cvRepository.find({
      userId: { $in: allEmployeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }, { populate: { path: 'userId', select: 'name email avatar' } });

    const validAvailableCvs = availableCvs.filter(cv => cv.userId != null);

    const bfi44Profiles = await bfi44Repository.find({
      userId: { $in: validAvailableCvs.map(cv => cv.userId._id) }
    });

    const bfi44Map = new Map(
      bfi44Profiles.map(profile => [profile.userId.toString(), profile])
    );

    const availableEmployeesWithScores = await Promise.all(
      validAvailableCvs.map(async cv => {
        const score = await teamSelectionService.calculateEmployeeScore(
          cv,
          (project.mainTechnologies || []).map(t =>
            teamSelectionService.normalizeTechnology(t)
          ),
          project.requiredExperienceLevel || 'mid',
          project.weeklyHoursPerMember || 40,
          phase1Config
        );

        const bfi44Profile = bfi44Map.get(cv.userId._id.toString());

        return {
          userId: cv.userId._id,
          user: {
            ...cv.userId.toObject(),
            bfi44Profile: bfi44Profile ? toStableBfi44Profile(bfi44Profile.results) : null
          },
          cv: cv,
          score: score.total,
          details: score.details,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        };
      })
    );

    const currentTeamSize = project.assignedEmployees?.length || 0;

    if (currentTeamSize > 0) {
      try {
        const currentTeam = await cvRepository.find({
          userId: { $in: project.assignedEmployees
            .filter(emp => emp.user != null)
            .map(emp => emp.user._id)
          },
          organization: organizationId,
          organizationStatus: 'accepted'
        }, { populate: { path: 'userId', select: 'name email avatar' } });

        for (const employee of availableEmployeesWithScores) {
          try {
            if (!employee.user.bfi44Profile) {
              employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
              employee.synergyBonus = 0;
              continue;
            }

            const validation = await personalityOptimizer.validateTeamAddition(
              currentTeam,
              employee,
              project
            );

            const synergyBonus = teamSelectionService.calculateSynergyBonus(validation);
            const matchScore = teamSelectionService.calculateMatchScore(
              employee.score,
              employee.details,
              synergyBonus
            );

            employee.synergyBonus = synergyBonus;
            employee.matchScore = matchScore;
            employee.synergyValidation = {
              recommended: validation.recommended,
              improvement: validation.improvement,
              message: translateSynergyValidation(
                { synergyImpact: validation.improvement, message: validation.message },
                lang
              ).message
            };
          } catch {
            employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
            employee.synergyBonus = 0;
          }
        }
      } catch (error) {
        console.error('Error in personality validation block:', error);
        availableEmployeesWithScores.forEach(employee => {
          employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
          employee.synergyBonus = 0;
        });
      }
    } else {
      availableEmployeesWithScores.forEach(employee => {
        employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
        employee.synergyBonus = 0;
      });
    }

    availableEmployeesWithScores.sort((a, b) => b.matchScore - a.matchScore);

    return { availableEmployees: availableEmployeesWithScores, count: availableEmployeesWithScores.length };
    } catch (err) {
      console.error('Error calculating scores for available employees:', err);
      return { availableEmployees: [], count: 0 };
    }
}

module.exports = {
  analyzeCurrentTeam,
  suggestComplementary,
  scoreAvailableEmployees
};

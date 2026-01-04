const CV = require('../models/cv.model');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');

/**
 * Team Selection Service
 * Selecciona el equipo ideal para un proyecto usando distancia Manhattan
 * basándose en las skills requeridas vs skills reales de los empleados
 */
class TeamSelectionService {
  /**
   * Selecciona el equipo ideal para un proyecto
   * @param {Object} projectRequirements - Requisitos del proyecto
   * @param {string} organizationId - ID de la organización
   * @param {number} teamSize - Tamaño del equipo deseado
   * @returns {Promise<Array>} Array de empleados seleccionados con sus scores
   */
  async selectOptimalTeam(projectRequirements, organizationId, teamSize = 5) {
    const {
      mainTechnologies = [],
      requiredExperienceLevel = 'mid',
      systemComplexity = 'medium',
      weeklyHoursPerMember = 40
    } = projectRequirements;

    // 1. Obtener todos los empleados de la organización con CVs aceptados
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Obtener empleados (excluyendo al PM que ya está asignado)
    const employeeIds = organization.employees
      .filter(emp => emp.status === 'active')
      .map(emp => emp.user);

    if (employeeIds.length === 0) {
      return [];
    }

    // 2. Obtener CVs aceptados de los empleados
    const cvs = await CV.find({
      userId: { $in: employeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }).populate('userId', 'name email avatar');

    // Filter out CVs where userId populate failed (deleted users)
    const validCvs = cvs.filter(cv => cv.userId != null);

    if (validCvs.length === 0) {
      return [];
    }

    // 3. Normalizar las tecnologías requeridas
    const normalizedRequiredTechs = mainTechnologies.map(tech => 
      this.normalizeTechnology(tech)
    );

    // 4. Calcular score para cada empleado
    const scoredEmployees = await Promise.all(
      validCvs.map(async cv => {
        const score = await this.calculateEmployeeScore(
          cv,
          normalizedRequiredTechs,
          requiredExperienceLevel,
          systemComplexity,
          weeklyHoursPerMember
        );
        
        return {
          userId: cv.userId._id,
          user: cv.userId,
          cv: cv,
          score: score.total,
          details: score.details,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        };
      })
    );

    // 5. Ordenar por score (menor distancia Manhattan = mejor match)
    scoredEmployees.sort((a, b) => a.score - b.score);

    // 6. Seleccionar los mejores N empleados
    const selectedTeam = scoredEmployees.slice(0, Math.min(teamSize, scoredEmployees.length));

    // 7. Metadata sobre disponibilidad de empleados
    const metadata = {
      requestedSize: teamSize,
      availableEmployees: cvs.length,
      selectedSize: selectedTeam.length,
      isComplete: selectedTeam.length >= teamSize,
      shortage: Math.max(0, teamSize - selectedTeam.length),
      allEmployeesInOrg: employeeIds.length,
      employeesWithAcceptedCV: cvs.length
    };

    return {
      team: selectedTeam,
      metadata
    };
  }

  /**
   * Selecciona empleados complementarios para completar un equipo existente
   * @param {Object} projectRequirements - Requisitos del proyecto
   * @param {string} organizationId - ID de la organización
   * @param {Array} currentTeamUserIds - IDs de usuarios ya asignados
   * @param {number} remainingSlots - Número de empleados que faltan
   * @returns {Promise<Object>} Array de empleados sugeridos y metadata
   */
  async selectComplementaryTeam(projectRequirements, organizationId, currentTeamUserIds = [], remainingSlots = 1) {
    const {
      mainTechnologies = [],
      requiredExperienceLevel = 'mid',
      systemComplexity = 'medium',
      weeklyHoursPerMember = 40
    } = projectRequirements;

    // 1. Obtener todos los empleados de la organización
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Obtener empleados activos (excluyendo a los ya asignados)
    const employeeIds = organization.employees
      .filter(emp => emp.status === 'active')
      .map(emp => emp.user)
      .filter(userId => !currentTeamUserIds.some(id => id.toString() === userId.toString()));

    if (employeeIds.length === 0) {
      return {
        suggestions: [],
        metadata: {
          requestedSize: remainingSlots,
          availableEmployees: 0,
          selectedSize: 0,
          isComplete: false,
          shortage: remainingSlots
        }
      };
    }

    // 2. Obtener CVs aceptados de los empleados disponibles
    const cvs = await CV.find({
      userId: { $in: employeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }).populate('userId', 'name email avatar');

    // Filter out CVs where userId populate failed (deleted users)
    const validCvs = cvs.filter(cv => cv.userId != null);

    if (validCvs.length === 0) {
      console.warn(`No valid CVs found for organization ${organizationId}. Total CVs: ${cvs.length}, Valid: ${validCvs.length}`);
      return {
        suggestions: [],
        metadata: {
          requestedSize: remainingSlots,
          availableEmployees: 0,
          selectedSize: 0,
          isComplete: false,
          shortage: remainingSlots,
          currentTeamSize: currentTeamUserIds.length
        }
      };
    }

    // 3. Normalizar tecnologías requeridas
    const normalizedRequiredTechs = mainTechnologies.map(tech => 
      this.normalizeTechnology(tech)
    );

    // 4. Calcular score para cada empleado disponible
    const scoredEmployees = await Promise.all(
      validCvs.map(async cv => {
        const score = await this.calculateEmployeeScore(
          cv,
          normalizedRequiredTechs,
          requiredExperienceLevel,
          systemComplexity,
          weeklyHoursPerMember
        );
        
        return {
          userId: cv.userId._id || cv.userId,
          user: cv.userId,
          cv: cv,
          score: score.total,
          details: score.details,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        };
      })
    );

    // 5. Ordenar por score (menor = mejor)
    scoredEmployees.sort((a, b) => a.score - b.score);

    // 6. Seleccionar los mejores N empleados para completar el equipo
    const suggestions = scoredEmployees.slice(0, Math.min(remainingSlots, scoredEmployees.length));

    // 7. Metadata
    const metadata = {
      requestedSize: remainingSlots,
      availableEmployees: validCvs.length,
      selectedSize: suggestions.length,
      isComplete: suggestions.length >= remainingSlots,
      shortage: Math.max(0, remainingSlots - suggestions.length),
      currentTeamSize: currentTeamUserIds.length
    };

    return {
      suggestions,
      metadata
    };
  }

  /**
   * Calcula el score de un empleado usando distancia Manhattan
   * @param {Object} cv - CV del empleado
   * @param {Array} requiredTechs - Tecnologías requeridas normalizadas
   * @param {string} experienceLevel - Nivel de experiencia requerido
   * @param {string} complexity - Complejidad del proyecto
   * @param {number} weeklyHours - Horas semanales requeridas
   * @returns {Object} Score y detalles
   */
  async calculateEmployeeScore(cv, requiredTechs, experienceLevel, complexity, weeklyHours) {
    // Validate input
    if (!cv || !cv.userId) {
      console.error('Invalid CV or missing userId in calculateEmployeeScore');
      return {
        total: Infinity,
        details: { error: 'Invalid CV data' },
        matchedSkills: [],
        missingSkills: requiredTechs || []
      };
    }

    let manhattanDistance = 0;
    const details = {};
    const matchedSkills = [];
    const missingSkills = [];

    // 1. Distancia por skills técnicas (peso: 40%)
    const skillsDistance = this.calculateSkillsDistance(
      cv.skills?.technical || [],
      requiredTechs,
      matchedSkills,
      missingSkills
    );
    manhattanDistance += skillsDistance * 0.4;
    details.skillsDistance = skillsDistance;

    // 2. Distancia por experiencia (peso: 30%)
    const experienceDistance = this.calculateExperienceDistance(
      cv.experience || [],
      experienceLevel
    );
    manhattanDistance += experienceDistance * 0.3;
    details.experienceDistance = experienceDistance;

    // 3. Distancia por complejidad (peso: 20%)
    const complexityDistance = this.calculateComplexityMatch(
      cv,
      complexity
    );
    manhattanDistance += complexityDistance * 0.2;
    details.complexityDistance = complexityDistance;

    // 4. Distancia por disponibilidad (peso: 10%)
    const availabilityDistance = await this.calculateAvailabilityDistance(
      cv.userId._id || cv.userId,
      weeklyHours
    );
    manhattanDistance += availabilityDistance * 0.1;
    details.availabilityDistance = availabilityDistance;

    return {
      total: manhattanDistance,
      details,
      matchedSkills,
      missingSkills
    };
  }

  /**
   * Calcula la distancia Manhattan para skills técnicas
   * @param {Array} employeeSkills - Skills del empleado
   * @param {Array} requiredTechs - Tecnologías requeridas
   * @param {Array} matchedSkills - Array para almacenar skills coincidentes
   * @param {Array} missingSkills - Array para almacenar skills faltantes
   * @returns {number} Distancia
   */
  calculateSkillsDistance(employeeSkills, requiredTechs, matchedSkills, missingSkills) {
    if (requiredTechs.length === 0) return 0;

    // Normalizar las skills del empleado
    const normalizedEmployeeSkills = employeeSkills.map(skill => ({
      name: this.normalizeTechnology(skill.name),
      level: this.normalizeSkillLevel(skill.level),
      original: skill
    }));

    let totalDistance = 0;
    let matchCount = 0;

    // Para cada tecnología requerida, buscar la mejor coincidencia
    requiredTechs.forEach(requiredTech => {
      const match = normalizedEmployeeSkills.find(empSkill => 
        empSkill.name === requiredTech
      );

      if (match) {
        // Skill encontrada - calcular distancia basada en nivel
        // Nivel óptimo es 'avanzado' (3), distancia = |nivel_empleado - 3|
        const distance = Math.abs(match.level - 3);
        totalDistance += distance;
        matchCount++;
        matchedSkills.push({
          skill: requiredTech,
          level: match.original.level,
          distance
        });
      } else {
        // Skill no encontrada - penalización máxima
        totalDistance += 5;
        missingSkills.push(requiredTech);
      }
    });

    // Normalizar por número de tecnologías requeridas
    return totalDistance / requiredTechs.length;
  }

  /**
   * Calcula la distancia por experiencia laboral
   * @param {Array} experiences - Experiencias del empleado
   * @param {string} requiredLevel - Nivel requerido
   * @returns {number} Distancia
   */
  calculateExperienceDistance(experiences, requiredLevel) {
    // Calcular años totales de experiencia
    const totalYears = this.calculateTotalYearsOfExperience(experiences);
    
    // Mapear nivel requerido a años esperados
    const expectedYears = {
      junior: 1,
      mid: 3,
      senior: 6,
      expert: 10
    };

    const required = expectedYears[requiredLevel] || 3;
    
    // Distancia = diferencia absoluta, normalizada a escala 0-5
    const distance = Math.abs(totalYears - required);
    return Math.min(distance / 2, 5);
  }

  /**
   * Calcula años totales de experiencia
   * @param {Array} experiences - Experiencias laborales
   * @returns {number} Años totales
   */
  calculateTotalYearsOfExperience(experiences) {
    if (!experiences || experiences.length === 0) return 0;

    let totalMonths = 0;

    experiences.forEach(exp => {
      const start = this.parseDate(exp.startDate);
      const end = exp.current ? new Date() : this.parseDate(exp.endDate);

      if (start && end) {
        const months = this.monthsDifference(start, end);
        totalMonths += months;
      }
    });

    return totalMonths / 12;
  }

  /**
   * Calcula la distancia por complejidad del sistema
   * @param {Object} cv - CV del empleado
   * @param {string} complexity - Complejidad requerida
   * @returns {number} Distancia
   */
  calculateComplexityMatch(cv, complexity) {
    // Evaluar complejidad basada en:
    // - Número de proyectos grandes
    // - Experiencia con certificaciones
    // - Skills avanzadas/expertas

    const complexityScore = this.estimateEmployeeComplexityLevel(cv);
    
    const complexityMap = {
      low: 1,
      medium: 2,
      high: 3
    };

    const required = complexityMap[complexity] || 2;
    const distance = Math.abs(complexityScore - required);
    
    return Math.min(distance * 1.5, 5);
  }

  /**
   * Estima el nivel de complejidad que puede manejar un empleado
   * @param {Object} cv - CV del empleado
   * @returns {number} Score de complejidad (1-3)
   */
  estimateEmployeeComplexityLevel(cv) {
    let score = 1;

    // +1 si tiene certificaciones avanzadas
    if (cv.certifications && cv.certifications.length >= 2) {
      score += 0.5;
    }

    // +1 si tiene skills de nivel experto o avanzado
    const advancedSkills = (cv.skills?.technical || []).filter(s => 
      s.level === 'experto' || s.level === 'avanzado'
    );
    if (advancedSkills.length >= 5) {
      score += 0.5;
    }

    // +1 si tiene experiencia en proyectos grandes
    if (cv.projects && cv.projects.length >= 3) {
      score += 0.5;
    }

    // +0.5 si tiene experiencia laboral > 5 años
    const years = this.calculateTotalYearsOfExperience(cv.experience || []);
    if (years >= 5) {
      score += 0.5;
    }

    return Math.min(score, 3);
  }

  /**
   * Calcula la distancia por disponibilidad
   * @param {string} userId - ID del usuario
   * @param {number} requiredHours - Horas semanales requeridas
   * @returns {Promise<number>} Distancia
   */
  async calculateAvailabilityDistance(userId, requiredHours) {
    // Obtener proyectos activos del usuario
    const Project = require('../models/project.model');
    
    const activeProjects = await Project.find({
      'assignedEmployees.user': userId,
      status: { $in: ['active', 'draft'] }
    });

    // Calcular horas ocupadas
    let occupiedHours = 0;
    activeProjects.forEach(project => {
      occupiedHours += project.weeklyHoursPerMember || 0;
    });

    const availableHours = 40 - occupiedHours; // Asumiendo 40h/semana máximo
    
    if (availableHours < requiredHours) {
      // No tiene suficiente disponibilidad - penalización
      const shortage = requiredHours - availableHours;
      return Math.min(shortage / 10, 5);
    }

    return 0; // Tiene disponibilidad suficiente
  }

  /**
   * Normaliza una tecnología para comparación
   * @param {string} tech - Nombre de la tecnología
   * @returns {string} Tecnología normalizada
   */
  normalizeTechnology(tech) {
    if (!tech) return '';
    
    // Convertir a minúsculas y eliminar espacios
    let normalized = tech.toLowerCase().trim();
    
    // Mapeo de alias comunes
    const aliases = {
      'javascript': ['js', 'javascript', 'ecmascript'],
      'typescript': ['ts', 'typescript'],
      'python': ['python', 'python3', 'py'],
      'java': ['java', 'jdk'],
      'react': ['react', 'reactjs', 'react.js'],
      'vue': ['vue', 'vuejs', 'vue.js'],
      'angular': ['angular', 'angularjs'],
      'node': ['node', 'nodejs', 'node.js'],
      'express': ['express', 'expressjs', 'express.js'],
      'mongodb': ['mongodb', 'mongo'],
      'postgresql': ['postgresql', 'postgres', 'pg'],
      'mysql': ['mysql', 'mariadb'],
      'docker': ['docker', 'containerization'],
      'kubernetes': ['kubernetes', 'k8s'],
      'aws': ['aws', 'amazon web services'],
      'azure': ['azure', 'microsoft azure'],
      'gcp': ['gcp', 'google cloud', 'google cloud platform']
    };

    // Buscar en aliases
    for (const [canonical, variations] of Object.entries(aliases)) {
      if (variations.includes(normalized)) {
        return canonical;
      }
    }

    return normalized;
  }

  /**
   * Normaliza el nivel de skill a un número
   * @param {string} level - Nivel de skill
   * @returns {number} Nivel numérico (0-4)
   */
  normalizeSkillLevel(level) {
    const levelMap = {
      'básico': 1,
      'intermedio': 2,
      'avanzado': 3,
      'experto': 4
    };

    return levelMap[level?.toLowerCase()] || 2;
  }

  /**
   * Parsea una fecha en formato string
   * @param {string} dateStr - Fecha en string
   * @returns {Date|null} Fecha parseada
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Intentar varios formatos
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})-(\d{4})/, // MM-YYYY
      /(\d{4})/, // YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (match.length === 4) { // YYYY-MM-DD
          return new Date(match[1], match[2] - 1, match[3]);
        } else if (match.length === 3) { // MM-YYYY
          return new Date(match[2], match[1] - 1, 1);
        } else if (match.length === 2) { // YYYY
          return new Date(match[1], 0, 1);
        }
      }
    }

    return null;
  }

  /**
   * Calcula la diferencia en meses entre dos fechas
   * @param {Date} start - Fecha inicio
   * @param {Date} end - Fecha fin
   * @returns {number} Meses de diferencia
   */
  monthsDifference(start, end) {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth());
  }

  /**
   * Obtiene información detallada del equipo seleccionado
   * @param {Array} selectedTeam - Equipo seleccionado
   * @param {Object} metadata - Metadata de la selección
   * @returns {Object} Información del equipo
   */
  getTeamSummary(selectedTeam, metadata = null) {
    if (selectedTeam.length === 0) {
      return {
        teamSize: 0,
        averageScore: 0,
        skillsCoverage: [],
        skillsGaps: [],
        warnings: ['No hay empleados disponibles con CVs aceptados']
      };
    }

    const averageScore = selectedTeam.reduce((sum, emp) => sum + emp.score, 0) / selectedTeam.length;
    
    // Consolidar skills coincidentes
    const allMatchedSkills = new Set();
    const allMissingSkills = new Set();
    
    selectedTeam.forEach(emp => {
      emp.matchedSkills.forEach(s => allMatchedSkills.add(s.skill));
      emp.missingSkills.forEach(s => allMissingSkills.add(s));
    });

    // Generar advertencias si hay problemas
    const warnings = [];
    if (metadata) {
      if (!metadata.isComplete) {
        warnings.push(
          `Equipo incompleto: Se necesitan ${metadata.requestedSize} empleados pero solo hay ${metadata.selectedSize} disponibles (faltan ${metadata.shortage})`
        );
      }
      if (metadata.employeesWithAcceptedCV < metadata.allEmployeesInOrg) {
        const pending = metadata.allEmployeesInOrg - metadata.employeesWithAcceptedCV;
        warnings.push(
          `Hay ${pending} empleado(s) en la organización sin CV aceptado que no fueron considerados`
        );
      }
    }
    
    if (allMissingSkills.size > 0) {
      warnings.push(
        `El equipo no cubre las siguientes tecnologías: ${Array.from(allMissingSkills).join(', ')}`
      );
    }

    if (averageScore > 2.5) {
      warnings.push(
        `El score promedio del equipo es alto (${averageScore.toFixed(2)}), lo que indica un match subóptimo con los requisitos`
      );
    }

    return {
      teamSize: selectedTeam.length,
      averageScore: averageScore.toFixed(2),
      skillsCoverage: Array.from(allMatchedSkills),
      skillsGaps: Array.from(allMissingSkills),
      warnings: warnings.length > 0 ? warnings : undefined,
      members: selectedTeam.map(emp => ({
        userId: emp.userId,
        name: emp.user.name,
        email: emp.user.email,
        score: emp.score.toFixed(2),
        matchedSkills: emp.matchedSkills,
        missingSkills: emp.missingSkills
      }))
    };
  }

  /**
   * Genera riesgos específicos basados en deficiencias del equipo
   * @param {Object} metadata - Metadata de la selección
   * @param {Object} summary - Resumen del equipo
   * @param {Object} projectRequirements - Requisitos del proyecto
   * @returns {Array} Array de riesgos identificados
   */
  generateTeamRisks(metadata, summary, projectRequirements) {
    const risks = [];

    // Riesgo por equipo incompleto
    if (metadata && !metadata.isComplete) {
      const severityMap = {
        1: 'low',
        2: 'medium',
        3: 'high',
        4: 'critical'
      };
      
      const shortageRatio = metadata.shortage / metadata.requestedSize;
      let severity = 'low';
      let probability = 0.3;
      
      if (shortageRatio >= 0.5) {
        severity = 'critical';
        probability = 0.9;
      } else if (shortageRatio >= 0.3) {
        severity = 'high';
        probability = 0.7;
      } else if (shortageRatio >= 0.1) {
        severity = 'medium';
        probability = 0.5;
      }

      risks.push({
        type: 'overload',
        title: 'Equipo Insuficiente',
        description: `El proyecto requiere ${metadata.requestedSize} empleados pero solo hay ${metadata.selectedSize} disponibles. Faltan ${metadata.shortage} miembro(s) del equipo.`,
        probability,
        severity,
        impact: {
          schedule: 'Retrasos significativos en entregas',
          quality: 'Posible deterioro de calidad por sobrecarga',
          cost: 'Incremento de costos por horas extra',
          team: 'Burnout y rotación de personal'
        },
        recommendations: [
          'Considerar contratar nuevos empleados',
          'Reducir el alcance del proyecto',
          'Extender los plazos de entrega',
          'Solicitar a empleados de otras organizaciones (outsourcing)',
          'Revisar la priorización de proyectos activos'
        ],
        detectedBy: 'team_selection',
        confidence: 0.95
      });
    }

    // Riesgo por skills faltantes
    if (summary.skillsGaps && summary.skillsGaps.length > 0) {
      const criticalSkills = summary.skillsGaps.length;
      let severity = 'low';
      let probability = 0.4;

      if (criticalSkills >= 3) {
        severity = 'high';
        probability = 0.8;
      } else if (criticalSkills >= 2) {
        severity = 'medium';
        probability = 0.6;
      }

      risks.push({
        type: 'skill_gap',
        title: 'Tecnologías No Cubiertas',
        description: `El equipo seleccionado no tiene experiencia en ${criticalSkills} tecnología(s) requerida(s): ${summary.skillsGaps.join(', ')}`,
        probability,
        severity,
        impact: {
          schedule: 'Retrasos por curva de aprendizaje',
          quality: 'Posibles errores por falta de experiencia',
          cost: 'Costos adicionales de capacitación',
          technical: 'Deuda técnica por soluciones subóptimas'
        },
        recommendations: [
          `Proporcionar capacitación en: ${summary.skillsGaps.join(', ')}`,
          'Contratar consultores externos con estas skills',
          'Buscar empleados con estas tecnologías en otras organizaciones',
          'Considerar tecnologías alternativas que el equipo domina',
          'Asignar tiempo extra para aprendizaje'
        ],
        detectedBy: 'team_selection',
        confidence: 0.9,
        missingSkills: summary.skillsGaps
      });
    }

    // Riesgo por match deficiente (score alto)
    if (summary.averageScore && parseFloat(summary.averageScore) > 2.5) {
      risks.push({
        type: 'skill_gap',
        title: 'Match Subóptimo del Equipo',
        description: `El equipo tiene un score promedio de ${summary.averageScore}, indicando una distancia significativa entre habilidades requeridas y disponibles`,
        probability: 0.6,
        severity: 'medium',
        impact: {
          quality: 'Calidad del código inferior a la esperada',
          schedule: 'Mayor tiempo para completar tareas',
          team: 'Frustración por trabajar fuera de zona de confort'
        },
        recommendations: [
          'Revisar si hay mejores candidatos en la organización',
          'Evaluar CVs pendientes de aprobación',
          'Considerar capacitación intensiva pre-proyecto',
          'Ajustar expectativas de velocidad de desarrollo'
        ],
        detectedBy: 'team_selection',
        confidence: 0.75
      });
    }

    return risks;
  }
}

module.exports = new TeamSelectionService();

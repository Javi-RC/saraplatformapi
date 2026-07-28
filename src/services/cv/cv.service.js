const cvUtils = require('../../utils/cvUtils');
const dictionaries = require('../../utils/dictionaries');
const organizationNotificationHelper = require('../notification/helpers/organization.helper');
const cvNotificationHelper = require('../notification/helpers/cv.helper');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../config/roles');

// Import repositories instead of models
const { cvRepository, organizationRepository, userRepository } = require('../../repositories');

// Import all extractors
const contactExtractor = require('./extractors/contactExtractor');
const educationExtractor = require('./extractors/educationExtractor');
const experienceExtractor = require('./extractors/experienceExtractor');
const skillsExtractor = require('./extractors/skillsExtractor');
const languagesExtractor = require('./extractors/languagesExtractor');
const projectsExtractor = require('./extractors/projectsExtractor');
const certificationsExtractor = require('./extractors/certificationsExtractor');
const achievementsExtractor = require('./extractors/achievementsExtractor');

/**
 * Main CV processing service
 * Orchestrates all extractors and manages the complete analysis lifecycle
 * Follows Dependency Injection and Open/Closed Principle patterns
 */
class CVService {
  /**
   * Processes a CV and saves the extracted information
   * @param {string} userId - ID of the CV owner
   * @param {string} textContent - Text content of the CV
   * @param {string} originalFileName - Original file name
   * @returns {Object} - Saved CV with all extracted information
   */
  async processCV(userId, textContent, originalFileName) {
    try {
      // Normalize full text
      const normalizedText = cvUtils.normalizeText(textContent);

      // Split into sections
      const sections = cvUtils.splitIntoSections(normalizedText, dictionaries.sectionKeywords);
      
      // Extract information from each section using specialized extractors
      const cvData = {
        userId,
        originalFileName,
        rawText: textContent,
        contact: this._extractContact(sections, normalizedText),
        education: this._extractEducation(sections),
        experience: this._extractExperience(sections),
        skills: this._extractSkills(sections),
        languages: this._extractLanguages(sections),
        projects: this._extractProjects(sections),
        certifications: this._extractCertifications(sections),
        achievements: this._extractAchievements(sections)
      };

      // Validate and clean empty data
      this._cleanEmptyFields(cvData);
      
      // Validate required fields in arrays
      this._validateRequiredFields(cvData);

      // Save to database
      const cv = await this._saveOrUpdateCV(userId, cvData);

      // Get user information for notifications
      const user = await userRepository.findById(userId);
      const userName = user?.name || 'User';

      // Send in-app CV processed notification
      cvNotificationHelper.notifyCVProcessed(userId, userName, cv._id).catch(err => {
        console.error('Error sending CV processed notification:', err);
      });

      return cv;
    } catch (error) {
      console.error('Error processing CV:', error);
      throw AppError.badRequest('ERROR_PROCESSING_CV', 'ERROR_PROCESSING_CV');
    }
  }

  /**
   * Gets a user's CV
   */
  async getUserCV(userId) {
    const cv = await cvRepository.findByUser(userId);
    if (!cv) {
      throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
    }
    return cv;
  }

  /**
   * Submits a CV to an organization
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @returns {Object} - Updated CV
   */
  async submitCVToOrganization(userId, organizationId) {
    try {
      // Verify that the organization exists and is active
      const organization = await organizationRepository.findById(
        organizationId,
        {
          populate: [
            { path: 'admin', select: 'name email avatar' },
            { path: 'additionalAdmins', select: 'name email avatar' }
          ]
        }
      );

      if (!organization) {
        throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      if (organization.status !== 'active') {
        throw AppError.badRequest('ORGANIZATION_NOT_ACTIVE', 'Organization is not active');
      }

      // Verify that the user has a CV
      let cv = await cvRepository.findByUser(userId);
      if (!cv) {
        throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
      }

      // Check if CV was already submitted to this organization
      if (cv.organization && cv.organization.toString() === organizationId) {
        throw AppError.conflict('CV_ALREADY_SUBMITTED', 'CV already submitted to this organization');
      }

      // Get user information
      const user = await userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('USER_NOT_FOUND', 'User not found');
      }

      // Update the CV with organization information
      cv.organization = organizationId;
      cv.organizationStatus = 'pending';
      cv.submittedToOrganizationAt = new Date();
      await cv.save();

      // Notify organization administrators
      await organizationNotificationHelper.notifyCVSubmitted(organization, user, cv);

      return cv;
    } catch (error) {
      console.error('Error submitting CV to organization:', error);
      throw error;
    }
  }

  /**
   * Gets CVs submitted to an organization
   * @param {string} organizationId - ID of the organization
   * @param {string} adminId - ID of the requesting admin
   * @param {Object} filters - Optional filters
   * @returns {Array} - List of CVs
   */
  async getOrganizationCVs(organizationId, adminId, filters = {}) {
    try {
      // Verify that the organization exists
      const organization = await organizationRepository.findById(organizationId);
      if (!organization) {
        throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Verify that the user is an admin
      if (!organization.isAdmin(adminId)) {
        throw AppError.forbidden('UNAUTHORIZED_ACCESS', 'UNAUTHORIZED_ACCESS');
      }

      // Build query
      const query = { organization: organizationId };

      // Apply filters
      if (filters.status) {
        query.organizationStatus = filters.status;
      }

      // Pagination options
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10) || 20;
      const skip = (page - 1) * limit;

      // Get CVs with user information
      const cvs = await cvRepository.find(
        query,
        {
          populate: [{ path: 'userId', select: 'name email avatar' }],
          sort: { submittedToOrganizationAt: -1 },
          skip,
          limit
        }
      );

      const total = await cvRepository.count(query);

      return {
        cvs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting organization CVs:', error);
      throw error;
    }
  }

  /**
   * Updates a CV's status within an organization
   * @param {string} cvId - ID of the CV
   * @param {string} organizationId - ID of the organization
   * @param {string} adminId - ID of the admin
   * @param {string} newStatus - New status
   * @param {string} notes - Admin notes
   * @param {Object} employeeData - Additional employee data (position, department)
   * @returns {Object} - Updated CV
   */
  async updateCVStatus(cvId, organizationId, adminId, newStatus, notes = '', employeeData = {}) {
    try {
      // Verify that the organization exists
      const organization = await organizationRepository.findById(organizationId);
      if (!organization) {
        throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Verify that the user is an admin
      if (!organization.isAdmin(adminId)) {
        throw AppError.forbidden('UNAUTHORIZED_ACCESS', 'UNAUTHORIZED_ACCESS');
      }

      // Find the CV
      const cv = await cvRepository.findById(cvId);
      if (!cv) {
        throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
      }

      // Verify that the CV belongs to this organization
      if (!cv.organization || cv.organization.toString() !== organizationId) {
        throw AppError.forbidden('CV_NOT_BELONGS_TO_ORGANIZATION', 'CV does not belong to this organization');
      }

      const oldStatus = cv.organizationStatus;

      // Update status and notes
      cv.organizationStatus = newStatus;
      if (notes) {
        cv.organizationNotes = notes;
      }
      await cv.save();

      // If CV is accepted, add user as organization employee
      if (newStatus === 'accepted' && oldStatus !== 'accepted') {
        await this._addUserAsEmployee(cv.userId, organization, employeeData);
      }

      // If CV is rejected and user was an employee, remove them
      if (newStatus === 'rejected' && oldStatus === 'accepted') {
        await this._removeUserAsEmployee(cv.userId, organization);
      }

      // Notify the user
      await organizationNotificationHelper.notifyCVStatusChanged(
        cv,
        organization,
        oldStatus,
        newStatus
      );

      return cv;
    } catch (error) {
      console.error('Error updating CV status:', error);
      throw error;
    }
  }

  /**
   * Adds a user as an organization employee when their CV is accepted
   * @param {string} userId - ID of the user
   * @param {Object} organization - Organization
   * @param {Object} employeeData - Employee data (position, department)
   * @private
   */
  async _addUserAsEmployee(userId, organization, employeeData = {}) {
    try {
      // Check if user is already an employee
      const existingEmployee = organization.employees.find(
        emp => emp.user && emp.user.toString() === userId.toString()
      );

      if (existingEmployee) {
        // If exists but not active, activate it
        if (existingEmployee.status !== 'active') {
          existingEmployee.status = 'active';
          if (employeeData.position) existingEmployee.position = employeeData.position;
          if (employeeData.department) existingEmployee.department = employeeData.department;
          await organization.save();
        }

        const existingUser = await userRepository.findById(userId);
        if (existingUser && (!existingUser.organization || existingUser.organization.toString() !== organization._id.toString())) {
          existingUser.organization = organization._id;
          if (existingUser.role === ROLES.UNASSIGNED) {
            existingUser.role = ROLES.EMPLOYEE;
          }
          await existingUser.save();
        }
        return;
      }

      // Add as new active employee (already approved by admin)
      organization.employees.push({
        user: userId,
        position: employeeData.position || '',
        department: employeeData.department || '',
        joinedAt: new Date(),
        status: 'active'
      });

      organization.lastActivityAt = Date.now();
      
      await organization.save();

      // Update user role to employee if needed
      const user = await userRepository.findById(userId);
      if (user) {
        let hasChanges = false;
        if (!user.organization || user.organization.toString() !== organization._id.toString()) {
          user.organization = organization._id;
          hasChanges = true;
        }
        if (user.role === ROLES.UNASSIGNED) {
          user.role = ROLES.EMPLOYEE;
          hasChanges = true;
        }
        if (hasChanges) {
          await user.save();
        }
      }

    } catch (error) {
      console.error('[_addUserAsEmployee] ERROR:', error.message);
      console.error('[_addUserAsEmployee] Stack:', error.stack);
      // Throw the error so it propagates and can be debugged
      throw error;
    }
  }

  /**
   * Removes a user as an organization employee when their CV is rejected
   * @param {string} userId - ID of the user
   * @param {Object} organization - Organization
   * @private
   */
  async _removeUserAsEmployee(userId, organization) {
    try {
      const employeeIndex = organization.employees.findIndex(
        emp => emp.user.toString() === userId.toString()
      );

      if (employeeIndex !== -1) {
        organization.employees.splice(employeeIndex, 1);
        organization.lastActivityAt = Date.now();
        await organization.save();
      }

      const user = await userRepository.findById(userId);
      if (user && user.organization && user.organization.toString() === organization._id.toString()) {
        user.organization = undefined;
        await user.save();
      }
    } catch (error) {
      console.error('Error removing user as employee:', error);
      // Do not throw error to avoid interrupting the main flow
    }
  }

  /**
   * Gets a specific CV from an organization
   * @param {string} cvId - ID of the CV
   * @param {string} organizationId - ID of the organization
   * @param {string} adminId - ID of the admin
   * @returns {Object} - CV with full details
   */
  async getOrganizationCV(cvId, organizationId, adminId) {
    try {
      // Verify that the organization exists
      const organization = await organizationRepository.findById(organizationId);
      if (!organization) {
        throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Verify that the user is an admin
      if (!organization.isAdmin(adminId)) {
        throw AppError.forbidden('UNAUTHORIZED_ACCESS', 'UNAUTHORIZED_ACCESS');
      }

      // Find the CV
      const cv = await cvRepository.findById(
        cvId,
        { populate: [{ path: 'userId', select: 'name email avatar' }] }
      );
      if (!cv) {
        throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
      }

      // Verify that the CV belongs to this organization
      if (!cv.organization || cv.organization.toString() !== organizationId) {
        throw AppError.forbidden('CV_NOT_BELONGS_TO_ORGANIZATION', 'CV does not belong to this organization');
      }

      return cv;
    } catch (error) {
      console.error('Error getting organization CV:', error);
      throw error;
    }
  }

  /**
   * Gets all CVs (for admin)
   */
  async getAllCVs(filters = {}) {
    const query = {};
    
    // Apply filters if they exist
    if (filters.skills) {
      query['skills.technical.normalizedName'] = { 
        $in: filters.skills.map(s => s.toLowerCase()) 
      };
    }
    
    if (filters.languages) {
      query['languages.language'] = { $in: filters.languages };
    }

    const cvs = await cvRepository.find(
      query,
      { populate: [{ path: 'userId', select: 'name email' }] }
    );
    return cvs;
  }

  /**
   * Updates a user's CV
   */
  async updateCV(userId, cvId, updates) {
    const cv = await cvRepository.findOne({ _id: cvId, userId: userId });
    if (!cv) {
      throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
    }

    const allowedFields = [
      'contact', 'education', 'experience', 'skills', 'languages',
      'projects', 'certifications', 'achievements', 'availability',
      'availabilityDetails', 'crossCulturalExperience'
    ];

    const filteredUpdates = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    Object.assign(cv, filteredUpdates);
    await cv.save();
    return cv;
  }

  /**
   * Deletes a user's CV
   */
  async deleteCV(userId, cvId) {
    const cv = await cvRepository.findOne({ _id: cvId, userId: userId });
    if (!cv) {
      throw AppError.notFound('CV_NOT_FOUND', 'CV not found');
    }
    await cvRepository.deleteById(cvId);
    return { message: 'CV deleted successfully' };
  }

  /**
   * Searches CVs by criteria
   */
  async searchCVs(criteria) {
    const query = {};

    if (criteria.skills && criteria.skills.length > 0) {
      query['skills.technical.normalizedName'] = {
        $in: criteria.skills.map(s => s.toLowerCase())
      };
    }

    if (criteria.languages && criteria.languages.length > 0) {
      query['languages.language'] = { $in: criteria.languages };
    }

    if (criteria.minExperience) {
      query['experience'] = {
        $exists: true,
        $not: { $size: 0 }
      };
    }

    const cvs = await cvRepository.find(query, { populate: [{ path: 'userId', select: 'name email' }] });
    return cvs;
  }

  /**
   * Extracts contact information
   */
  _extractContact(sections, fullText) {
    // Analyze entire text for contact, prioritizing the beginning
    const lines = fullText.split('\n');
    const topSection = lines.slice(0, 50).join('\n'); // Increased to 50 lines
    
    const locationDict = {
      cities: dictionaries.getAllCities(),
      countries: dictionaries.countries
    };

    return contactExtractor.extractWithLocation(topSection, locationDict);
  }

  /**
   * Extracts education
   */
  _extractEducation(sections) {
    const educationSection = sections.education?.[0] || '';
    return educationExtractor.extract(educationSection);
  }

  /**
   * Extracts work experience
   */
  _extractExperience(sections) {
    // Search in multiple section variations
    let experienceText = sections.experience?.[0] || '';
    
    // If section not found, search in 'other' (in case the title was not detected)
    if (!experienceText && sections.other) {
      experienceText = sections.other.join('\n');
    }
    
    return experienceExtractor.extract(experienceText, dictionaries);
  }

  /**
   * Extracts skills
   */
  _extractSkills(sections) {
    // Extract skills from the specific section
    let skillsText = sections.skills?.[0] || '';
    
    // Also search in experience and projects for mentioned technologies
    const experienceText = sections.experience?.[0] || '';
    const projectsText = sections.projects?.[0] || '';
    const combinedText = [skillsText, experienceText, projectsText].join('\n');
    
    return skillsExtractor.extract(combinedText, dictionaries);
  }

  /**
   * Extracts languages
   */
  _extractLanguages(sections) {
    const languagesSection = sections.languages?.[0] || '';
    return languagesExtractor.extract(languagesSection, dictionaries);
  }

  /**
   * Extracts projects
   */
  _extractProjects(sections) {
    const projectsSection = sections.projects?.[0] || '';
    return projectsExtractor.extract(projectsSection, dictionaries);
  }

  /**
   * Extracts certifications
   */
  _extractCertifications(sections) {
    const certificationsSection = sections.certifications?.[0] || '';
    return certificationsExtractor.extract(certificationsSection);
  }

  /**
   * Extracts achievements and awards
   */
  _extractAchievements(sections) {
    const achievementsSection = sections.achievements?.[0] || '';
    return achievementsExtractor.extract(achievementsSection);
  }

  /**
   * Validates that array elements have their required fields
   */
  _validateRequiredFields(cvData) {
    // Validate education: institution and degree are required
    if (cvData.education && cvData.education.length > 0) {
      cvData.education = cvData.education.filter(edu => 
        edu.institution && edu.degree
      );
      if (cvData.education.length === 0) delete cvData.education;
    }
    
    // Validate experience: company and position are required
    if (cvData.experience && cvData.experience.length > 0) {
      cvData.experience = cvData.experience.filter(exp => 
        exp.company && exp.position
      );
      if (cvData.experience.length === 0) delete cvData.experience;
    }
    
    // Validate projects: name is required
    if (cvData.projects && cvData.projects.length > 0) {
      cvData.projects = cvData.projects.filter(proj => proj.name);
      if (cvData.projects.length === 0) delete cvData.projects;
    }
    
    // Validate certifications: name is required
    if (cvData.certifications && cvData.certifications.length > 0) {
      cvData.certifications = cvData.certifications.filter(cert => cert.name);
      if (cvData.certifications.length === 0) delete cvData.certifications;
    }
  }

  /**
   * Cleans empty fields from the CV data object
   */
  _cleanEmptyFields(cvData) {
    // Clean empty arrays
    if (cvData.education && cvData.education.length === 0) delete cvData.education;
    if (cvData.experience && cvData.experience.length === 0) delete cvData.experience;
    if (cvData.languages && cvData.languages.length === 0) delete cvData.languages;
    if (cvData.projects && cvData.projects.length === 0) delete cvData.projects;
    if (cvData.certifications && cvData.certifications.length === 0) delete cvData.certifications;

    // Clean skills
    if (cvData.skills) {
      if (cvData.skills.technical && cvData.skills.technical.length === 0) {
        delete cvData.skills.technical;
      }
      if (cvData.skills.soft && cvData.skills.soft.length === 0) {
        delete cvData.skills.soft;
      }
      if (!cvData.skills.technical && !cvData.skills.soft) {
        delete cvData.skills;
      }
    }

    // Clean achievements
    if (cvData.achievements) {
      if (cvData.achievements.publications && cvData.achievements.publications.length === 0) {
        delete cvData.achievements.publications;
      }
      if (cvData.achievements.awards && cvData.achievements.awards.length === 0) {
        delete cvData.achievements.awards;
      }
      if (cvData.achievements.hackathons && cvData.achievements.hackathons.length === 0) {
        delete cvData.achievements.hackathons;
      }
      if (!cvData.achievements.publications && 
          !cvData.achievements.awards && 
          !cvData.achievements.hackathons) {
        delete cvData.achievements;
      }
    }
  }

  /**
   * Saves or updates the CV in the database
   */
  async _saveOrUpdateCV(userId, cvData) {
    // Check if a CV already exists for this user
    let cv = await cvRepository.findByUser(userId);

    if (cv) {
      // Update existing CV
      Object.assign(cv, cvData);
      await cv.save();
    } else {
      // Create new CV
      cv = await cvRepository.create(cvData);
      await cv.save();
    }

    return cv;
  }
}

module.exports = new CVService();

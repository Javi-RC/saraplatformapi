// Repository exports
// Centralized access point for all repositories

const userRepository = require('./user.repository');
const projectRepository = require('./project.repository');
const organizationRepository = require('./organization.repository');
const cvRepository = require('./cv.repository');
const bfi44Repository = require('./bfi44.repository');
const notificationRepository = require('./notification.repository');
const caseBaseRepository = require('./caseBase.repository');
const riskRepository = require('./risk.repository');

module.exports = {
  userRepository,
  projectRepository,
  organizationRepository,
  cvRepository,
  bfi44Repository,
  notificationRepository,
  caseBaseRepository,
  riskRepository
};

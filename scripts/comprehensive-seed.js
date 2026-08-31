/**
 * Comprehensive Database Seed Script
 * Populates the database with complete sample data showcasing all features
 * Run with: node scripts/comprehensive-seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../src/models/user.model');
const Organization = require('../src/models/organization.model');
const Project = require('../src/models/project.model');
const CV = require('../src/models/cv.model');
const BFI44Response = require('../src/models/bfi44.model');
const Risk = require('../src/models/risk.model');
const { Notification } = require('../src/models/notification.model');
const CaseBase = require('../src/models/caseBase.model');

// Utilities
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/saraplatform';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  console.log('\n🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Project.deleteMany({});
  await CV.deleteMany({});
  await BFI44Response.deleteMany({});
  await Risk.deleteMany({});
  await Notification.deleteMany({});
  await CaseBase.deleteMany({});
  
  // Drop and recreate indexes for CaseBase to ensure correct partial index
  try {
    await CaseBase.collection.dropIndexes();
    console.log('✅ Dropped old indexes');
  } catch (err) {
    // Ignore error if collection doesn't exist
  }
  
  console.log('✅ Database cleared');
};

// Password hash
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Seed Users - Auto-generate 100 employees + 3 admins
const seedUsers = async () => {
  console.log('\n👥 Creating 100+ users automatically...');
  
  const { COMPLETE_EMPLOYEE_DATA } = require('./seed-data/employee-profiles');
  
  const password = await hashPassword('Password123!');
  
  const timezones = {
    'Spain': 'Europe/Madrid',
    'Mexico': 'America/Mexico_City',
    'Argentina': 'America/Argentina/Buenos_Aires',
    'United States': 'America/New_York',
    'Canada': 'America/Toronto',
    'United Kingdom': 'Europe/London',
    'Japan': 'Asia/Tokyo',
    'China': 'Asia/Shanghai',
    'India': 'Asia/Kolkata',
    'Brazil': 'America/Sao_Paulo',
    'France': 'Europe/Paris',
    'Germany': 'Europe/Berlin',
    'Italy': 'Europe/Rome',
    'Colombia': 'America/Bogota',
    'Chile': 'America/Santiago',
    'Peru': 'America/Lima',
    'Australia': 'Australia/Sydney',
    'Netherlands': 'Europe/Amsterdam',
    'Poland': 'Europe/Warsaw',
    'Sweden': 'Europe/Stockholm'
  };
  
  const users = [
    // 3 Admins - one for each organization
    {
      email: 'admin.techinnov@example.com',
      name: 'María García López',
      passwordHash: password,
      role: 'org_admin',
      isConfirmed: true,
      country: 'Spain',
      timezone: 'Europe/Madrid',
      flexibleSchedule: true,
      preferredWorkingHours: { start: '09:00', end: '18:00' },
      cvProcessingConsent: {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        details: { aiProcessing: true, thirdPartySharing: false }
      }
    },
    {
      email: 'admin.globalsol@example.com',
      name: 'John Smith Anderson',
      passwordHash: password,
      role: 'org_admin',
      isConfirmed: true,
      country: 'United States',
      timezone: 'America/New_York',
      flexibleSchedule: true,
      preferredWorkingHours: { start: '09:00', end: '17:00' },
      cvProcessingConsent: {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        details: { aiProcessing: true, thirdPartySharing: true }
      }
    },
    {
      email: 'admin.asiantech@example.com',
      name: 'Tanaka Hiroshi',
      passwordHash: password,
      role: 'org_admin',
      isConfirmed: true,
      country: 'Japan',
      timezone: 'Asia/Tokyo',
      flexibleSchedule: false,
      preferredWorkingHours: { start: '09:00', end: '18:00' },
      cvProcessingConsent: {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        details: { aiProcessing: true, thirdPartySharing: false }
      }
    }
  ];
  
  // Generate 100 employee users from profiles
  for (const [key, profile] of Object.entries(COMPLETE_EMPLOYEE_DATA)) {
    const flexibleSchedule = Math.random() > 0.5;
    const startHours = ['08:00', '09:00', '10:00'];
    const startHour = startHours[Math.floor(Math.random() * startHours.length)];
    const endHour = parseInt(startHour.split(':')[0]) + 8 + ':00';
    
    users.push({
      email: profile.email,
      name: profile.name,
      passwordHash: password,
      role: profile.orgStatus === 'pending' ? 'unassigned' : 'employee',
      isConfirmed: true,
      country: profile.country,
      timezone: timezones[profile.country] || 'UTC',
      flexibleSchedule,
      preferredWorkingHours: { start: startHour, end: endHour },
      cvProcessingConsent: {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        details: { 
          aiProcessing: Math.random() > 0.3,
          thirdPartySharing: Math.random() > 0.5
        }
      }
    });
  }
  
  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users (3 admins + 100 employees)`);
  return createdUsers;
};

// Seed Organizations with 100 employees distributed across 3 orgs
const seedOrganizations = async (users) => {
  console.log('\n🏢 Creating 3 organizations with 100+ employees distributed...');
  
  const { COMPLETE_EMPLOYEE_DATA } = require('./seed-data/employee-profiles');
  
  const adminTechInnov = users.find(u => u.email === 'admin.techinnov@example.com');
  const adminGlobalSol = users.find(u => u.email === 'admin.globalsol@example.com');
  const adminAsianTech = users.find(u => u.email === 'admin.asiantech@example.com');
  
  // Distribute employees across organizations based on orgIndex from profiles
  const techInnovEmployees = [];
  const globalSolEmployees = [];
  const asianTechEmployees = [];
  
  for (const [key, profile] of Object.entries(COMPLETE_EMPLOYEE_DATA)) {
    const user = users.find(u => u.email === profile.email);
    if (!user || profile.orgStatus === 'pending') continue;
    
    const employeeData = {
      user: user._id,
      position: profile.position,
      department: profile.specialty === 'QA' ? 'Quality Assurance' : 'Engineering',
      status: 'active',
      isProjectManager: profile.email === 'carlos.dev@example.com' || (profile.level === 'senior' && Math.random() > 0.7)
    };
    
    if (profile.orgIndex === 0) {
      techInnovEmployees.push(employeeData);
    } else if (profile.orgIndex === 1) {
      globalSolEmployees.push(employeeData);
    } else {
      asianTechEmployees.push(employeeData);
    }
  }
  
  const organizations = [
    {
      name: 'Tech Innovators',
      description: 'Empresa líder de desarrollo de software especializada en aplicaciones web y móviles',
      taxId: 'B12345678',
      contact: {
        email: 'contact@techinnovators.com',
        phone: '+34 912 345 678',
        website: 'https://www.techinnovators.com'
      },
      address: {
        street: 'Calle Gran Vía 28',
        city: 'Madrid',
        state: 'Madrid',
        postalCode: '28013',
        country: 'Spain'
      },
      industry: 'software_development',
      size: '51-200',
      admin: adminTechInnov._id,
      employees: techInnovEmployees,
      teamSelectionStrategy: 'manual',
      allowAutomaticTeamFormation: false
    },
    {
      name: 'Global Solutions Inc',
      description: 'Consultoría tecnológica internacional y proveedor de soluciones cloud',
      taxId: 'US-987654321',
      contact: {
        email: 'info@globalsolutions.com',
        phone: '+1 (555) 123-4567',
        website: 'https://www.globalsolutions.com'
      },
      address: {
        street: '1234 Tech Boulevard',
        city: 'San Francisco',
        state: 'California',
        postalCode: '94103',
        country: 'United States'
      },
      industry: 'consulting',
      size: '201-500',
      admin: adminGlobalSol._id,
      employees: globalSolEmployees,
      teamSelectionStrategy: 'hybrid',
      allowAutomaticTeamFormation: true
    },
    {
      name: 'Asian Tech Hub',
      description: 'Hub líder de desarrollo de software enfocado en soluciones de IA y machine learning',
      taxId: 'JP-456789123',
      contact: {
        email: 'contact@asiantechhub.jp',
        phone: '+81 3-1234-5678',
        website: 'https://www.asiantechhub.jp'
      },
      address: {
        street: '2-3-4 Shibuya',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '150-0002',
        country: 'Japan'
      },
      industry: 'ai_machine_learning',
      size: '11-50',
      admin: adminAsianTech._id,
      employees: asianTechEmployees,
      teamSelectionStrategy: 'automatic',
      allowAutomaticTeamFormation: true
    }
  ];
  
  const createdOrgs = await Organization.insertMany(organizations);
  
  // Update users with their organization
  await User.updateOne(
    { _id: adminTechInnov._id },
    { organization: createdOrgs[0]._id }
  );
  
  for (const emp of createdOrgs[0].employees) {
    await User.updateOne({ _id: emp.user }, { organization: createdOrgs[0]._id });
  }
  
  await User.updateOne(
    { _id: adminGlobalSol._id },
    { organization: createdOrgs[1]._id }
  );
  
  for (const emp of createdOrgs[1].employees) {
    await User.updateOne({ _id: emp.user }, { organization: createdOrgs[1]._id });
  }
  
  await User.updateOne(
    { _id: adminAsianTech._id },
    { organization: createdOrgs[2]._id }
  );
  
  for (const emp of createdOrgs[2].employees) {
    await User.updateOne({ _id: emp.user }, { organization: createdOrgs[2]._id });
  }
  
  console.log(`✅ Created ${createdOrgs.length} organizations with distributed employees`);
  console.log(`   - Tech Innovators: ${techInnovEmployees.length} employees`);
  console.log(`   - Global Solutions: ${globalSolEmployees.length} employees`);
  console.log(`   - Asian Tech Hub: ${asianTechEmployees.length} employees`);
  return createdOrgs;
};

// Import seed modules
const { seedCVs } = require('./seed-data/cvs');
const { seedBFI44 } = require('./seed-data/bfi44');
const { seedProjects } = require('./seed-data/projects');
const { seedRisksAndCases } = require('./seed-data/risks');
const { seedNotifications } = require('./seed-data/notifications');

// Update collaboration history
const updateCollaborationHistory = async (users) => {
  console.log('\n🤝 Updating collaboration history...');
  
  // Carlos, Ana, David, Laura worked together on Customer Portal
  const carlos = users.find(u => u.email === 'carlos.dev@example.com');
  const ana = users.find(u => u.email === 'ana.frontend@example.com');
  const david = users.find(u => u.email === 'david.backend@example.com');
  const laura = users.find(u => u.email === 'laura.qa@example.com');
  
  if (carlos && ana && david && laura) {
    // Update Carlos's history
    await User.updateOne(
      { _id: carlos._id },
      {
        $set: {
          collaborationHistory: [
            { userId: ana._id, projectCount: 3, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: david._id, projectCount: 3, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: laura._id, projectCount: 1, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }
          ]
        }
      }
    );
    
    // Update Ana's history
    await User.updateOne(
      { _id: ana._id },
      {
        $set: {
          collaborationHistory: [
            { userId: carlos._id, projectCount: 3, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: david._id, projectCount: 2, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: laura._id, projectCount: 1, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }
          ]
        }
      }
    );
    
    // Update David's history
    await User.updateOne(
      { _id: david._id },
      {
        $set: {
          collaborationHistory: [
            { userId: carlos._id, projectCount: 3, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: ana._id, projectCount: 2, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: laura._id, projectCount: 1, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }
          ]
        }
      }
    );
    
    // Update Laura's history
    await User.updateOne(
      { _id: laura._id },
      {
        $set: {
          collaborationHistory: [
            { userId: carlos._id, projectCount: 1, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: ana._id, projectCount: 1, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
            { userId: david._id, projectCount: 1, lastCollaboration: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }
          ]
        }
      }
    );
  }
  
  console.log('✅ Collaboration history updated');
};

// Add seed cases from seed service
const addSeedCases = async () => {
  console.log('\n📚 Adding seed CBR cases...');
  
  const seedCasesService = require('../src/services/risk/seedCases.service');
  
  try {
    const result = await seedCasesService.loadSeedCases();
    console.log(`✅ Seed CBR cases added (${result.count})`);
    return result;
  } catch (error) {
    console.warn('⚠️  Warning: Could not add seed cases:', error.message);
    return null;
  }
};

// Main execution
const main = async () => {
  console.log('\n🚀 Starting comprehensive database seed...\n');
  console.log('=' .repeat(60));
  
  try {
    await connectDB();
    await clearDatabase();
    
    // Seed in order
    const users = await seedUsers();
    const organizations = await seedOrganizations(users);
    const cvs = await seedCVs(users, organizations);
    const bfi44Profiles = await seedBFI44(users);
    const projects = await seedProjects(users, organizations);
    const { risks, cases } = await seedRisksAndCases(projects, organizations);
    const notifications = await seedNotifications(users, projects, organizations);
    await updateCollaborationHistory(users);
    const seedCasesResult = await addSeedCases();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Organizations: ${organizations.length}`);
    console.log(`  - Currículos: ${cvs.length}`);
    console.log(`  - BFI-44 Profiles: ${bfi44Profiles.length}`);
    console.log(`  - Projects: ${projects.length}`);
    console.log(`  - Risks: ${risks.length}`);
    const seedCasesCount = seedCasesResult?.count || 0;
    console.log(`  - CBR Cases: ${cases.length} + seed cases (${seedCasesCount})`);
    console.log(`  - Notifications: ${notifications.length}`);
    console.log('\n📝 Test Credentials:');
    console.log('  Admin (Tech Innovators):');
    console.log('    Email: admin.techinnov@example.com');
    console.log('    Password: Password123!');
    console.log('  Admin (Global Solutions):');
    console.log('    Email: admin.globalsol@example.com');
    console.log('    Password: Password123!');
    console.log('  Admin (Asian Tech Hub):');
    console.log('    Email: admin.asiantech@example.com');
    console.log('    Password: Password123!');
    console.log('  Employee:');
    console.log('    Email: carlos.dev@example.com (or any employee email)');
    console.log('    Password: Password123!');
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };

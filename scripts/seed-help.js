#!/usr/bin/env node

/**
 * Seed Help Script
 * Displays information about available seed commands and credentials
 */

console.log('\n' + '='.repeat(70));
console.log('  📚 DATABASE SEED COMMANDS');
console.log('='.repeat(70) + '\n');

console.log('Available Commands:');
console.log('  npm run seed       - Populate database with comprehensive test data');
console.log('  npm run seed:help  - Show this help message\n');

console.log('What gets created:');
console.log('  ✓ 15 Users (3 admins, 10 employees, 2 pending)');
console.log('  ✓ 3 Organizations (Tech Innovators, Global Solutions, Asian Tech Hub)');
console.log('  ✓ 6+ CVs (with complete profiles and skills)');
console.log('  ✓ 12 BFI-44 Profiles (personality assessments)');
console.log('  ✓ 6 Projects (planning, active, completed, cancelled)');
console.log('  ✓ 15+ Risks (various types and severities)');
console.log('  ✓ CBR Cases (from completed projects + seed cases)');
console.log('  ✓ 20+ Notifications (all types and states)\n');

console.log('Test Credentials:');
console.log('\n  Organization Admins:');
console.log('    📧 admin.techinnov@example.com    🔑 Password123!  🏢 Tech Innovators (ES)');
console.log('    📧 admin.globalsol@example.com    🔑 Password123!  🏢 Global Solutions (US)');
console.log('    📧 admin.asiantech@example.com    🔑 Password123!  🏢 Asian Tech Hub (JP)');

console.log('\n  Employees (all use Password123!):');
console.log('    📧 carlos.dev@example.com         👨‍💻 Senior Full Stack Dev');
console.log('    📧 ana.frontend@example.com       👩‍💻 Frontend Developer');
console.log('    📧 david.backend@example.com      👨‍💻 Backend Developer');
console.log('    📧 laura.qa@example.com           👩‍💻 QA Engineer');
console.log('    📧 sarah.devops@example.com       👩‍💻 DevOps Engineer');
console.log('    📧 And 5 more employees...\n');

console.log('Features Demonstrated:');
console.log('  • User authentication and roles');
console.log('  • CV upload and AI processing');
console.log('  • BFI-44 personality assessment');
console.log('  • Project lifecycle management');
console.log('  • Risk prediction (CBR + Decision Tree)');
console.log('  • Team selection and synergy analysis');
console.log('  • Multi-channel notifications');
console.log('  • Global distributed teams');
console.log('  • Collaboration history\n');

console.log('⚠️  Warning:');
console.log('  This script will DELETE ALL existing data before seeding!');
console.log('  Only use in development/test environments.\n');

console.log('Documentation:');
console.log('  📖 scripts/README-SEED.md - Full documentation');
console.log('  📖 docs/ - Additional documentation\n');

console.log('='.repeat(70) + '\n');

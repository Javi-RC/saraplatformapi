/**
 * One-time fix: Set user.organization for admin users that were created
 * before the createOrganization bug fix.
 * 
 * Usage: node scripts/fix-admin-organization.js
 */
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env')
});
const mongoose = require('mongoose');

async function fix() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const Organization = require('../src/models/organization.model');
  const User = require('../src/models/user.model');

  const orgs = await Organization.find({}).select('admin additionalAdmins name');
  let fixed = 0;

  for (const org of orgs) {
    // Fix main admin
    if (org.admin) {
      const adminUser = await User.findById(org.admin);
      if (adminUser && !adminUser.organization) {
        adminUser.organization = org._id;
        adminUser.role = 'org_admin';
        await adminUser.save();
        console.log(`Fixed admin "${adminUser.name}" -> org "${org.name}"`);
        fixed++;
      }
    }

    // Fix additional admins
    if (org.additionalAdmins && org.additionalAdmins.length > 0) {
      for (const addAdminId of org.additionalAdmins) {
        const addAdmin = await User.findById(addAdminId);
        if (addAdmin && !addAdmin.organization) {
          addAdmin.organization = org._id;
          await addAdmin.save();
          console.log(`Fixed additional admin "${addAdmin.name}" -> org "${org.name}"`);
          fixed++;
        }
      }
    }
  }

  console.log(`\nDone. Fixed ${fixed} user(s).`);
  await mongoose.disconnect();
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});

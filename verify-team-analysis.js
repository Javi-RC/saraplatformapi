/**
 * Verification Script for Team Analysis Integration
 * Run this to verify that the risk prediction system can access all required data
 */

const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const CV = require('./src/models/cv.model');
const BFI44 = require('./src/models/bfi44.model');
const Organization = require('./src/models/organization.model');
const Project = require('./src/models/project.model');
const teamAnalysisService = require('./src/services/teamAnalysis.service');

/**
 * Verify data integrity for risk prediction
 */
async function verifyTeamAnalysisIntegration() {
  console.log('🔍 Verificando integridad de datos para predicción de riesgos...\n');
  
  try {
    // 1. Check if there are users
    const userCount = await User.countDocuments();
    console.log(`✅ Usuarios registrados: ${userCount}`);
    
    if (userCount === 0) {
      console.log('⚠️  No hay usuarios. Crear al menos 1 usuario para testing.');
      return;
    }
    
    // 2. Check CVs
    const cvCount = await CV.countDocuments();
    const acceptedCVs = await CV.countDocuments({ organizationStatus: 'accepted' });
    console.log(`✅ CVs totales: ${cvCount}`);
    console.log(`✅ CVs aceptados: ${acceptedCVs}`);
    
    if (acceptedCVs === 0) {
      console.log('⚠️  No hay CVs aceptados. Los empleados deben:');
      console.log('   1. Crear CV: POST /api/cv');
      console.log('   2. Enviar a org: POST /api/cv/:id/submit-to-organization');
      console.log('   3. Admin acepta: PATCH /api/organizations/:id/cv/:cvId/accept');
    }
    
    // 3. Check BFI-44
    const bfi44Count = await BFI44.countDocuments();
    console.log(`✅ Tests BFI-44 completados: ${bfi44Count}`);
    
    if (bfi44Count === 0) {
      console.log('⚠️  No hay tests BFI-44. Los empleados deben completar: POST /api/bfi44');
    }
    
    // 4. Check Organizations
    const orgCount = await Organization.countDocuments();
    console.log(`✅ Organizaciones: ${orgCount}`);
    
    if (orgCount === 0) {
      console.log('⚠️  No hay organizaciones. Crear: POST /api/organizations');
      return;
    }
    
    // 5. Check Projects
    const projectCount = await Project.countDocuments();
    const projectsWithTeam = await Project.countDocuments({
      'assignedEmployees.0': { $exists: true }
    });
    console.log(`✅ Proyectos totales: ${projectCount}`);
    console.log(`✅ Proyectos con equipo asignado: ${projectsWithTeam}`);
    
    if (projectsWithTeam === 0) {
      console.log('⚠️  No hay proyectos con equipo. Asignar empleados:');
      console.log('   POST /api/projects/:id/assign-employee');
      return;
    }
    
    // 6. Detailed check: projects with complete data
    console.log('\n📊 Análisis detallado de proyectos:\n');
    
    const projects = await Project.find({ 'assignedEmployees.0': { $exists: true } })
      .populate('assignedEmployees.user', 'name email')
      .populate('organization', 'name')
      .limit(5);
    
    for (const project of projects) {
      console.log(`\n🔹 Proyecto: ${project.projectName}`);
      console.log(`   Organización: ${project.organization?.name || 'N/A'}`);
      console.log(`   Equipo: ${project.assignedEmployees.length} miembros`);
      
      // Check CVs for team members
      const teamIds = project.assignedEmployees.map(emp => emp.user._id || emp.user);
      const teamCVs = await CV.countDocuments({
        userId: { $in: teamIds },
        organizationStatus: 'accepted'
      });
      const teamBFI44s = await BFI44.countDocuments({
        userId: { $in: teamIds }
      });
      
      console.log(`   CVs aceptados: ${teamCVs}/${teamIds.length}`);
      console.log(`   BFI-44 completados: ${teamBFI44s}/${teamIds.length}`);
      
      // Check if CVs have required data
      const cvsWithSkills = await CV.countDocuments({
        userId: { $in: teamIds },
        organizationStatus: 'accepted',
        'skills.0': { $exists: true }
      });
      const cvsWithExperience = await CV.countDocuments({
        userId: { $in: teamIds },
        organizationStatus: 'accepted',
        'experience.0': { $exists: true }
      });
      const cvsWithLanguages = await CV.countDocuments({
        userId: { $in: teamIds },
        organizationStatus: 'accepted',
        'languages.0': { $exists: true }
      });
      
      console.log(`   CVs con skills: ${cvsWithSkills}/${teamCVs}`);
      console.log(`   CVs con experiencia: ${cvsWithExperience}/${teamCVs}`);
      console.log(`   CVs con idiomas: ${cvsWithLanguages}/${teamCVs}`);
      
      // Calculate data completeness
      const totalRequired = teamIds.length * 5; // CV + BFI44 + skills + exp + languages
      const totalPresent = teamCVs + teamBFI44s + cvsWithSkills + cvsWithExperience + cvsWithLanguages;
      const completeness = (totalPresent / totalRequired * 100).toFixed(1);
      
      console.log(`   📈 Completitud de datos: ${completeness}%`);
      
      if (completeness < 80) {
        console.log('   ⚠️  Datos incompletos. Predicción tendrá baja confidence.');
      } else {
        console.log('   ✅ Datos suficientes para predicción precisa.');
      }
      
      // Try to run team analysis
      try {
        console.log('\n   🔬 Ejecutando análisis de equipo...');
        const teamAnalysis = await teamAnalysisService.getTeamAnalysis(project._id);
        
        console.log(`   ✅ Análisis exitoso:`);
        console.log(`      - Skills detectados: ${teamAnalysis.team.skills.count}`);
        console.log(`      - Nivel de experiencia: ${teamAnalysis.team.experience.overallLevel}`);
        console.log(`      - Match técnico: ${teamAnalysis.team.technicalMatch?.matchPercentage?.toFixed(0) || 'N/A'}%`);
        console.log(`      - Idiomas cubiertos: ${teamAnalysis.team.languages.hasAllRequired ? 'Sí' : 'No'}`);
        console.log(`      - Sobrecarga: ${teamAnalysis.team.workload.isOverloaded ? 'Sí ⚠️' : 'No'}`);
        console.log(`      - Concerns de personalidad: ${teamAnalysis.team.personality.concerns.length}`);
        
      } catch (analysisError) {
        console.log(`   ❌ Error en análisis: ${analysisError.message}`);
      }
    }
    
    // 7. Summary and recommendations
    console.log('\n\n📋 RESUMEN:\n');
    
    const readinessScore = {
      users: userCount > 0 ? 20 : 0,
      cvs: acceptedCVs > 0 ? 20 : 0,
      bfi44: bfi44Count > 0 ? 20 : 0,
      orgs: orgCount > 0 ? 20 : 0,
      projects: projectsWithTeam > 0 ? 20 : 0
    };
    
    const totalScore = Object.values(readinessScore).reduce((a, b) => a + b, 0);
    
    console.log(`Sistema listo al ${totalScore}%\n`);
    
    if (totalScore < 100) {
      console.log('🔧 ACCIONES REQUERIDAS:\n');
      
      if (readinessScore.users === 0) {
        console.log('❌ Registrar usuarios: POST /api/auth/register');
      }
      if (readinessScore.cvs === 0) {
        console.log('❌ Crear y aceptar CVs:');
        console.log('   1. POST /api/cv (crear CV)');
        console.log('   2. Llenar skills[], experience[], languages[]');
        console.log('   3. POST /api/cv/:id/submit-to-organization');
        console.log('   4. PATCH /api/organizations/:id/cv/:cvId/accept');
      }
      if (readinessScore.bfi44 === 0) {
        console.log('❌ Completar tests BFI-44: POST /api/bfi44');
      }
      if (readinessScore.orgs === 0) {
        console.log('❌ Crear organización: POST /api/organizations');
      }
      if (readinessScore.projects === 0) {
        console.log('❌ Crear proyecto y asignar equipo:');
        console.log('   1. POST /api/projects');
        console.log('   2. POST /api/projects/:id/assign-employee');
      }
    } else {
      console.log('✅ Sistema completamente listo para predicción de riesgos!');
      console.log('\n🚀 Para ejecutar predicción:');
      console.log('   POST /api/projects/:id/risks/predict');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    throw error;
  }
}

/**
 * Run verification
 */
if (require.main === module) {
  require('dotenv').config();
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend')
    .then(async () => {
      console.log('📡 Conectado a MongoDB\n');
      await verifyTeamAnalysisIntegration();
      await mongoose.disconnect();
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error de conexión:', err);
      process.exit(1);
    });
}

module.exports = verifyTeamAnalysisIntegration;

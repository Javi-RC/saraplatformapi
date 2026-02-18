// Seed BFI-44 Personality Profiles for ALL employees
const { COMPLETE_EMPLOYEE_DATA } = require('./employee-profiles');

const seedBFI44 = async (users) => {
  console.log('\n🧠 Creating BFI-44 personality profiles for ALL employees...');
  
  // Helper function to generate BFI-44 responses from a trait profile
  const generateBFI44Responses = (profile) => {
    const responses = new Map();
    
    // Extraversion items (1, 6R, 11, 16, 21R, 26, 31R, 36)
    const eScores = profile.Extraversion === 'high' ? [4, 2, 5, 4, 2, 5, 1, 4] :
                    profile.Extraversion === 'low' ? [2, 4, 2, 2, 4, 2, 4, 2] :
                    [3, 3, 3, 3, 3, 3, 3, 3];
    [1, 6, 11, 16, 21, 26, 31, 36].forEach((item, i) => responses.set(item.toString(), eScores[i]));
    
    // Agreeableness items (2R, 7, 12R, 17, 22, 27R, 32, 37R, 42)
    const aScores = profile.Agreeableness === 'high' ? [2, 5, 2, 5, 4, 2, 5, 1, 4] :
                    profile.Agreeableness === 'low' ? [4, 2, 4, 2, 2, 4, 2, 5, 2] :
                    [3, 3, 3, 3, 3, 3, 3, 3, 3];
    [2, 7, 12, 17, 22, 27, 32, 37, 42].forEach((item, i) => responses.set(item.toString(), aScores[i]));
    
    // Conscientiousness items (3, 8R, 13, 18R, 23R, 28, 33, 38, 43R)
    const cScores = profile.Conscientiousness === 'high' ? [5, 2, 5, 2, 1, 5, 4, 5, 2] :
                    profile.Conscientiousness === 'low' ? [2, 4, 2, 4, 5, 2, 2, 2, 4] :
                    [3, 3, 3, 3, 3, 3, 3, 3, 3];
    [3, 8, 13, 18, 23, 28, 33, 38, 43].forEach((item, i) => responses.set(item.toString(), cScores[i]));
    
    // Neuroticism items (4, 9R, 14, 19, 24R, 29, 34R, 39)
    const nScores = profile.Neuroticism === 'high' ? [5, 2, 4, 5, 2, 4, 2, 5] :
                    profile.Neuroticism === 'low' ? [2, 5, 2, 2, 5, 2, 5, 2] :
                    [3, 3, 3, 3, 3, 3, 3, 3];
    [4, 9, 14, 19, 24, 29, 34, 39].forEach((item, i) => responses.set(item.toString(), nScores[i]));
    
    // Openness items (5, 10, 15, 20, 25, 30, 35R, 40, 41R, 44)
    const oScores = profile.Openness === 'high' ? [5, 5, 4, 5, 4, 5, 2, 4, 2, 5] :
                    profile.Openness === 'low' ? [2, 2, 2, 2, 2, 2, 4, 2, 4, 2] :
                    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    [5, 10, 15, 20, 25, 30, 35, 40, 41, 44].forEach((item, i) => responses.set(item.toString(), oScores[i]));
    
    return responses;
  };
  
  const calculateResults = (responses) => {
    const extraversion = (
      responses.get('1') + (6 - responses.get('6')) + responses.get('11') + 
      responses.get('16') + (6 - responses.get('21')) + responses.get('26') + 
      (6 - responses.get('31')) + responses.get('36')
    ) / 8;
    
    const agreeableness = (
      (6 - responses.get('2')) + responses.get('7') + (6 - responses.get('12')) + 
      responses.get('17') + responses.get('22') + (6 - responses.get('27')) + 
      responses.get('32') + (6 - responses.get('37')) + responses.get('42')
    ) / 9;
    
    const conscientiousness = (
      responses.get('3') + (6 - responses.get('8')) + responses.get('13') + 
      (6 - responses.get('18')) + (6 - responses.get('23')) + responses.get('28') + 
      responses.get('33') + responses.get('38') + (6 - responses.get('43'))
    ) / 9;
    
    const neuroticism = (
      responses.get('4') + (6 - responses.get('9')) + responses.get('14') + 
      responses.get('19') + (6 - responses.get('24')) + responses.get('29') + 
      (6 - responses.get('34')) + responses.get('39')
    ) / 8;
    
    const openness = (
      responses.get('5') + responses.get('10') + responses.get('15') + 
      responses.get('20') + responses.get('25') + responses.get('30') + 
      (6 - responses.get('35')) + responses.get('40') + (6 - responses.get('41')) + 
      responses.get('44')
    ) / 10;
    
    return {
      Extraversion: parseFloat(extraversion.toFixed(2)),
      Agreeableness: parseFloat(agreeableness.toFixed(2)),
      Conscientiousness: parseFloat(conscientiousness.toFixed(2)),
      Neuroticism: parseFloat(neuroticism.toFixed(2)),
      Openness: parseFloat(openness.toFixed(2))
    };
  };

  // Generate a deterministic personality profile based on specialty and level
  const generateTraitProfile = (specialty, level) => {
    const levels = ['low', 'medium', 'high'];

    // Base profiles by specialty for realistic variety
    const specialtyProfiles = {
      'Full Stack Development':        { E: 'medium', A: 'high',   C: 'high',   N: 'low',    O: 'high' },
      'Frontend & UX/UI':              { E: 'high',   A: 'high',   C: 'medium', N: 'medium', O: 'high' },
      'Backend Development':           { E: 'low',    A: 'medium', C: 'high',   N: 'low',    O: 'medium' },
      'Quality Assurance & Test Automation': { E: 'medium', A: 'high', C: 'high', N: 'medium', O: 'medium' },
      'DevOps & Cloud Infrastructure': { E: 'medium', A: 'medium', C: 'high',   N: 'low',    O: 'high' },
      'Software Architecture & System Design': { E: 'medium', A: 'medium', C: 'high', N: 'low', O: 'high' },
      'Mobile Development':            { E: 'high',   A: 'high',   C: 'medium', N: 'medium', O: 'high' },
      'Data Science & ML':             { E: 'medium', A: 'high',   C: 'high',   N: 'low',    O: 'high' },
      'Frontend Development':          { E: 'high',   A: 'high',   C: 'medium', N: 'medium', O: 'high' },
    };

    const base = specialtyProfiles[specialty] || { E: 'medium', A: 'medium', C: 'medium', N: 'medium', O: 'medium' };

    // Seniors tend to have higher conscientiousness and lower neuroticism
    if (level === 'senior') {
      base.C = 'high';
      base.N = 'low';
    }

    return {
      Extraversion: base.E,
      Agreeableness: base.A,
      Conscientiousness: base.C,
      Neuroticism: base.N,
      Openness: base.O
    };
  };

  // Build profiles for ALL employees (admins excluded, they are org_admin role)
  const allProfiles = [];

  for (const [key, employeeProfile] of Object.entries(COMPLETE_EMPLOYEE_DATA)) {
    const user = users.find(u => u.email === employeeProfile.email);
    if (!user) continue;

    const traitProfile = generateTraitProfile(employeeProfile.specialty, employeeProfile.level);
    allProfiles.push({ userId: user._id, profile: traitProfile });
  }

  // Also include the 3 admins with a balanced profile
  const adminEmails = [
    'admin.techinnov@example.com',
    'admin.globalsol@example.com',
    'admin.asiantech@example.com'
  ];
  for (const email of adminEmails) {
    const admin = users.find(u => u.email === email);
    if (admin) {
      allProfiles.push({
        userId: admin._id,
        profile: { Extraversion: 'high', Agreeableness: 'high', Conscientiousness: 'high', Neuroticism: 'low', Openness: 'high' }
      });
    }
  }
  
  const bfi44Records = allProfiles.map(p => {
    const responses = generateBFI44Responses(p.profile);
    const results = calculateResults(responses);
    
    return {
      userId: p.userId,
      responses,
      results,
      completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
  });
  
  const createdProfiles = await require('../../src/models/bfi44.model').insertMany(bfi44Records);
  console.log(`✅ Created ${createdProfiles.length} BFI-44 profiles (all employees + admins)`);
  return createdProfiles;
};

module.exports = { seedBFI44 };

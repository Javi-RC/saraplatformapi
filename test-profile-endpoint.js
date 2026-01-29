const https = require('https');
const http = require('http');
require('dotenv').config();

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(body), status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testProfileEndpoint() {
  try {
    // Primero hacer login
    console.log('🔐 Haciendo login...');
    const loginResponse = await makeRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin.techinnov@example.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token recibido');

    // Ahora obtener el perfil
    console.log('\n📋 Obteniendo perfil...');
    const profileResponse = await makeRequest('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n📊 Respuesta completa:');
    console.log(JSON.stringify(profileResponse.data, null, 2));

    console.log('\n🔍 Verificando estructura:');
    console.log('✓ success:', profileResponse.data.success);
    console.log('✓ data:', !!profileResponse.data.data);
    console.log('✓ data.user:', !!profileResponse.data.data?.user);
    console.log('✓ data.user.organization:', profileResponse.data.data?.user?.organization);

    if (profileResponse.data.data?.user?.organization) {
      console.log('\n✅ ¡Campo organization presente!');
      console.log('   - _id:', profileResponse.data.data.user.organization._id);
      console.log('   - name:', profileResponse.data.data.user.organization.name);
    } else {
      console.log('\n❌ Campo organization NO presente');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProfileEndpoint();

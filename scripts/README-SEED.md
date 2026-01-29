# Comprehensive Database Seed Script

## Overview

Este script puebla completamente la base de datos con datos de ejemplo que muestran todas las funcionalidades de la aplicación.

## ¿Qué incluye?

### 👥 **15 Usuarios**
- 3 organizaciones con administradores
- Empleados con diferentes roles y localizaciones
- Usuarios pendientes de aceptación
- Perfiles completos con zonas horarias, preferencias, etc.

### 🏢 **3 Organizaciones**
- **Tech Innovators** (España) - Software Development
- **Global Solutions Inc** (Estados Unidos) - Consulting
- **Asian Tech Hub** (Japón) - AI/ML

### 📄 **6+ CVs Completos**
- Diferentes niveles de experiencia (junior, mid, senior, expert)
- Skills técnicas y soft skills
- Educación, experiencia laboral, certificaciones
- Proyectos personales
- Diferentes estados (accepted, pending, reviewed)

### 🧠 **12 Perfiles BFI-44**
- Personalidades variadas (alta extraversión, baja neurosis, etc.)
- Respuestas completas a las 44 preguntas
- Resultados calculados para los 5 grandes rasgos

### 📊 **6 Proyectos**
- **Planning**: E-Commerce Platform Modernization, AI Recommendation Engine
- **Active**: Mobile Banking App, Cloud Infrastructure Migration
- **Completed**: Customer Portal Development
- **Cancelled**: Legacy System Replacement

Estados diversos:
- Diferentes metodologías (Scrum, Kanban, Agile, Waterfall)
- Equipos distribuidos globalmente
- Variedad de tecnologías y complejidades

### ⚠️ **15+ Riesgos**
- Communication breakdown
- Technical infrastructure issues
- Meeting fatigue
- Burnout susceptibility
- Knowledge management gaps
- Timezone scheduling challenges
- Scope creep
- Skill gaps
- Data quality issues
- Goal misalignment

Estados:
- `identified`: Recién identificados
- `monitoring`: Bajo vigilancia
- `active_mitigation`: Con mitigación activa
- `occurred`: Ya materializados

### 📚 **Casos CBR**
- Casos reales de proyectos completados
- Seed cases del sistema
- Métricas de éxito/fracaso
- Lecciones aprendidas

### 🔔 **20+ Notificaciones**
- Email confirmation
- CV submissions
- Project assignments
- Project status changes
- Organization updates
- System announcements

Estados diversos:
- `pending`: Pendientes
- `sent`: Enviadas
- `delivered`: Entregadas
- `read`: Leídas

## Uso

### Ejecución

```bash
node scripts/comprehensive-seed.js
```

### Requisitos

1. MongoDB debe estar corriendo
2. Variables de entorno configuradas (.env)
3. Conexión a base de datos funcional

### Resultado

El script:
1. ✅ Limpia la base de datos existente
2. ✅ Crea usuarios con diferentes roles
3. ✅ Crea organizaciones completas
4. ✅ Genera CVs detallados
5. ✅ Completa perfiles BFI-44
6. ✅ Crea proyectos en diferentes estados
7. ✅ Genera riesgos realistas
8. ✅ Añade casos CBR
9. ✅ Crea notificaciones variadas
10. ✅ Actualiza historiales de colaboración

## Credenciales de Prueba

### Administradores

**Tech Innovators (España)**
- Email: `admin.techinnov@example.com`
- Password: `Password123!`

**Global Solutions (USA)**
- Email: `admin.globalsol@example.com`
- Password: `Password123!`

**Asian Tech Hub (Japón)**
- Email: `admin.asiantech@example.com`
- Password: `Password123!`

### Empleados

Todos los empleados tienen la misma contraseña: `Password123!`

- `carlos.dev@example.com` - Senior Full Stack Developer (Tech Innovators)
- `ana.frontend@example.com` - Frontend Developer (Tech Innovators)
- `david.backend@example.com` - Backend Developer (Tech Innovators)
- `laura.qa@example.com` - QA Engineer (Tech Innovators)
- `sarah.devops@example.com` - DevOps Engineer (Global Solutions)
- `michael.arch@example.com` - Solutions Architect (Global Solutions)
- `emma.mobile@example.com` - Mobile Developer (Global Solutions)
- `yuki.fullstack@example.com` - Full Stack Developer (Asian Tech Hub)
- `li.wei@example.com` - Backend Engineer (Asian Tech Hub)
- `priya.data@example.com` - Data Scientist (Asian Tech Hub)

### Usuarios Pendientes

- `pending.user1@example.com` - CV enviado a Tech Innovators
- `pending.user2@example.com` - Sin organización

## Casos de Uso Cubiertos

### ✅ Gestión de Usuarios
- Registro y confirmación
- Diferentes roles (admin, employee, unassigned)
- OAuth y autenticación local
- Preferencias y configuración

### ✅ Gestión de CVs
- Carga y procesamiento con IA
- Diferentes niveles de completitud
- Envío a organizaciones
- Estados de revisión

### ✅ Test BFI-44
- Personalidades variadas
- Perfiles completos
- Resultados calculados

### ✅ Gestión de Proyectos
- Ciclo completo (planning → active → completed/cancelled)
- Selección manual y automática de equipos
- Diferentes metodologías
- Equipos distribuidos globalmente

### ✅ Predicción de Riesgos
- Múltiples tipos de riesgo
- Diferentes fuentes (CBR, Expert Rules, Manual)
- Estados diversos
- Estrategias de mitigación

### ✅ Casos CBR
- Proyectos completados
- Métricas de éxito
- Lecciones aprendidas

### ✅ Sistema de Notificaciones
- Múltiples tipos
- Diferentes canales (email, in-app)
- Estados variados
- Prioridades

### ✅ Colaboración en Equipos
- Historial de colaboraciones
- Análisis de sinergia
- Equipos multinacionales

## Datos Destacados

### 🌍 Distribución Global
- Europa: España
- América: USA, México, Argentina, Brasil
- Asia: Japón, China, India

### 🕐 Zonas Horarias
- Europe/Madrid
- America/Mexico_City
- America/Argentina/Buenos_Aires
- America/New_York
- America/Los_Angeles
- Europe/London
- Asia/Tokyo
- Asia/Shanghai
- Asia/Kolkata

### 💻 Tecnologías
- Frontend: React, Vue.js, TypeScript
- Backend: Node.js, Java, Python, Spring Boot
- Databases: MongoDB, PostgreSQL, MySQL, Redis
- Cloud: AWS, Docker, Kubernetes
- DevOps: Jenkins, Terraform, ArgoCD
- AI/ML: TensorFlow, MLflow
- Mobile: React Native

### 📈 Métricas del Sistema
- Proyectos activos: 2
- Proyectos en planificación: 2
- Proyectos completados: 1
- Proyectos cancelados: 1
- Riesgos activos: 15+
- Notificaciones no leídas: Variable

## Mantenimiento

Para actualizar o extender los datos de seed:

1. **Usuarios**: Edita `scripts/comprehensive-seed.js` (función `seedUsers`)
2. **CVs**: Edita `scripts/seed-data/cvs.js`
3. **BFI-44**: Edita `scripts/seed-data/bfi44.js`
4. **Proyectos**: Edita `scripts/seed-data/projects.js`
5. **Riesgos**: Edita `scripts/seed-data/risks.js`
6. **Notificaciones**: Edita `scripts/seed-data/notifications.js`

## Troubleshooting

### Error de conexión a MongoDB
```bash
# Verifica que MongoDB esté corriendo
mongod --version
# O con Docker
docker ps | grep mongo
```

### Error de variables de entorno
```bash
# Verifica que .env existe y tiene MONGO_URI
cat .env | grep MONGO_URI
```

### Error de módulos
```bash
# Reinstala dependencias
npm install
```

## Limpieza

Para limpiar solo los datos de seed sin eliminar todo:

```javascript
// En la consola de MongoDB
use tfg-backend
db.users.deleteMany({ email: /example\.com$/ })
db.organizations.deleteMany({ name: /Tech Innovators|Global Solutions|Asian Tech Hub/ })
// etc.
```

O simplemente re-ejecuta el script que automáticamente limpia antes de poblar.

---

**Nota**: Este script es para desarrollo y demostración. NO ejecutar en producción.

# 👥 Scripts de Población de Empleados

Este proyecto incluye varios scripts para poblar la base de datos con empleados de prueba.

## 📋 Opciones Disponibles

### 1. **Generación Automática de Empleados** (Recomendado)

Genera empleados con datos realistas automáticamente:

```bash
# Crear 50 empleados (por defecto)
node scripts/populate-employees.js

# Crear 100 empleados
node scripts/populate-employees.js 100

# Crear empleados para una organización específica
node scripts/populate-employees.js 50 <organizationId>
```

**Características:**
- ✅ Genera nombres españoles realistas
- ✅ Crea usuarios con emails únicos
- ✅ Genera CVs completos con experiencia, skills, educación
- ✅ Incluye todos los campos nuevos (KM tools, remote work, timezone, etc.)
- ✅ Password para todos: `Test1234!`
- ✅ Diversidad de países y zonas horarias
- ✅ Skills técnicas variadas (Frontend, Backend, DevOps, etc.)

**Datos generados:**
- 🎭 Nombres: María García, Juan Rodríguez, Ana Martínez...
- 🌍 Países: España, México, Argentina, Colombia, Chile, Perú, USA, UK, Alemania, Francia
- ⏰ Zonas horarias reales según país
- 💼 Posiciones: Software Developer, Full Stack, DevOps, QA, Architect...
- 🛠️ Skills: JavaScript, Python, Java, React, Docker, AWS, Kubernetes...
- 📚 Herramientas KM: Confluence, Notion, SharePoint, Jira...

---

### 2. **Importación desde CSV**

Importa empleados desde un archivo CSV personalizado:

```bash
# Usar el CSV de ejemplo incluido
node scripts/import-employees-csv.js scripts/employees-example.csv

# Usar tu propio CSV
node scripts/import-employees-csv.js /path/to/your/employees.csv

# Importar a organización específica
node scripts/import-employees-csv.js employees.csv <organizationId>
```

**Formato CSV requerido:**
```csv
name,email,country,timezone,skills,yearsExperience,position,company,flexibleSchedule,hasInternationalExperience,mediationSkills,yearsRemote,kmTools
María García,maria@example.com,España,Europe/Madrid,"JavaScript,React,Node.js",5,Full Stack Developer,TechCorp,true,true,true,3,"Confluence,Notion"
```

**Campos del CSV:**
| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `name` | Nombre completo | María García López |
| `email` | Email único | maria.garcia@example.com |
| `country` | País de residencia | España |
| `timezone` | Zona horaria | Europe/Madrid |
| `skills` | Skills separadas por comas | "JavaScript,React,Node.js" |
| `yearsExperience` | Años de experiencia | 5 |
| `position` | Posición actual | Full Stack Developer |
| `company` | Empresa actual | TechCorp |
| `flexibleSchedule` | Horario flexible (true/false) | true |
| `hasInternationalExperience` | Experiencia internacional | true |
| `mediationSkills` | Habilidades de mediación cultural | true |
| `yearsRemote` | Años de trabajo remoto | 3 |
| `kmTools` | Herramientas de gestión del conocimiento | "Confluence,Notion" |

---

## 🚀 Guía Rápida de Uso

### Paso 1: Preparar el entorno
```bash
# Asegúrate de tener MongoDB corriendo
# Verifica tu .env con MONGODB_URI
```

### Paso 2: Ejecutar el script
```bash
# Opción A: Generación automática (más rápida)
node scripts/populate-employees.js 100

# Opción B: Importación desde CSV (más control)
node scripts/import-employees-csv.js scripts/employees-example.csv
```

### Paso 3: Verificar
```bash
# Los empleados se crean con:
# - Role: employee
# - Organization: Tech Solutions SA (se crea automáticamente)
# - Password: Test1234!
# - Status: Confirmed y Accepted
```

---

## 📊 Datos Generados

### Usuario (User Model)
```javascript
{
  email: "maria.garcia1@example.com",
  name: "María García López",
  role: "employee",
  organization: ObjectId("..."),
  isConfirmed: true,
  country: "España",
  timezone: "Europe/Madrid",
  flexibleSchedule: true,
  preferredWorkingHours: { start: "09:00", end: "18:00" }
}
```

### CV (CV Model)
```javascript
{
  userId: ObjectId("..."),
  organization: ObjectId("..."),
  organizationStatus: "accepted",
  skills: [
    { name: "JavaScript", level: "advanced", yearsOfExperience: 5 },
    { name: "React", level: "expert", yearsOfExperience: 4 }
  ],
  experience: [
    {
      company: "TechCorp",
      position: "Full Stack Developer",
      startDate: "2019-03",
      current: true
    }
  ],
  crossCulturalExperience: {
    hasWorkedInternationally: true,
    countriesWorkedIn: ["USA", "UK"],
    languagesSpoken: 3,
    mediationSkills: true
  },
  remoteWorkExperience: {
    yearsRemote: 3,
    hasRemoteExperience: true,
    preferredWorkModel: "hybrid",
    timezoneFlexibility: true
  },
  communicationSkills: {
    documentationExperience: true,
    knowledgeManagementTools: ["Confluence", "Notion"],
    effectiveCommunicator: true
  }
}
```

---

## 🎯 Casos de Uso

### Para Testing de Riesgos
```bash
# Crear equipo diverso con diferentes zonas horarias
node scripts/populate-employees.js 30

# Resultado: Empleados en España, México, Argentina, USA, UK, Alemania
# Útil para probar: timezone_scheduling_gap, remote_work_support_gap
```

### Para Testing de Selección de Equipo
```bash
# Crear pool grande de candidatos con skills variadas
node scripts/populate-employees.js 100

# Resultado: 100 empleados con diferentes combinaciones de skills
# Útil para probar: algoritmo de Manhattan, team selection
```

### Para Demo/Presentación
```bash
# Usar el CSV de ejemplo con datos curados
node scripts/import-employees-csv.js scripts/employees-example.csv

# Resultado: 20 empleados con perfiles realistas y completos
```

---

## 🔧 Personalización

### Modificar datos generados

Edita `scripts/populate-employees.js`:

```javascript
// Añadir más países
const COUNTRIES = [
  { name: 'Brasil', timezone: 'America/Sao_Paulo' },
  // ... tus países
];

// Añadir más skills
const SKILLS = [
  'Kotlin', 'Swift', 'Flutter',
  // ... tus skills
];

// Cambiar password por defecto
const passwordHash = await bcrypt.hash('TuPassword123!', 10);
```

### Crear CSV personalizado

Copia `scripts/employees-example.csv` y modifica los datos según tus necesidades.

---

## 🐛 Troubleshooting

### Error: "Email duplicado"
```bash
# Solución: Incrementar el índice del email o limpiar la BD
db.users.deleteMany({ email: { $regex: '@example.com' } })
```

### Error: "Organization not found"
```bash
# El script crea automáticamente "Tech Solutions SA"
# Si quieres usar otra, pasa el organizationId como parámetro
node scripts/populate-employees.js 50 <your-org-id>
```

### Empleados no aparecen en la organización
```bash
# Verifica que el script completó sin errores
# Revisa los logs de creación
# Consulta: db.users.find({ organization: ObjectId("...") })
```

---

## 📈 Rendimiento

| Cantidad | Tiempo Estimado |
|----------|----------------|
| 50 empleados | ~10 segundos |
| 100 empleados | ~20 segundos |
| 500 empleados | ~2 minutos |
| 1000 empleados | ~4 minutos |

---

## 🎉 Siguiente Paso

Después de poblar empleados, puedes:

1. **Crear un proyecto** usando la API
2. **Analizar riesgos** con los nuevos detectores
3. **Seleccionar equipo** usando el algoritmo de Manhattan
4. **Ver predicciones** con diferentes configuraciones

```bash
# Ejemplo: Analizar riesgos con el equipo generado
curl -X POST http://localhost:3000/api/risks/predict \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your-project-id"}'
```

---

## 📝 Notas

- Todos los empleados tienen password: `Test1234!`
- Los emails son únicos y tienen el formato: `nombre.apellido{index}@example.com`
- Los CVs incluyen TODOS los campos nuevos para detección de riesgos
- La organización "Tech Solutions SA" se crea automáticamente si no existe

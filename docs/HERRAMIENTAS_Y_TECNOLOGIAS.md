# 4.3 Herramientas Software y 4.4 Herramientas Hardware

Este documento describe las herramientas y tecnologías utilizadas en el desarrollo del proyecto **TFG-Backend**, un sistema de gestión de proyectos con análisis de riesgos basado en razonamiento basado en casos (CBR).

---

## 4.3 Herramientas Software

### 4.3.1 Entornos de Desarrollo

#### Visual Studio Code
- **Versión**: Latest (2024/2025)
- **Descripción**: Editor de código fuente ligero y potente desarrollado por Microsoft. Es el IDE principal utilizado para el desarrollo de este proyecto.
- **Características utilizadas**:
  - IntelliSense para autocompletado de código JavaScript/Node.js
  - Depuración integrada con Node.js
  - Terminal integrado para ejecución de comandos
  - Extensiones para ESLint, Prettier, y soporte de MongoDB
  - Integración nativa con Git para control de versiones
  - GitHub Copilot para asistencia en programación con IA
- **Justificación**: Ofrece un equilibrio óptimo entre rendimiento y funcionalidad, con excelente soporte para el ecosistema Node.js y una amplia comunidad de extensiones.

#### Node.js Runtime
- **Versión**: >= 18.0.0 (LTS)
- **Descripción**: Entorno de ejecución de JavaScript del lado del servidor basado en el motor V8 de Chrome.
- **Justificación**: Permite ejecutar JavaScript en el servidor, facilitando el desarrollo full-stack con un único lenguaje y aprovechando su modelo de I/O no bloqueante ideal para aplicaciones web en tiempo real.

---

### 4.3.2 Lenguajes de Programación

#### JavaScript (ES6+)
- **Versión**: ECMAScript 2015+ (ES6+)
- **Descripción**: Lenguaje de programación principal del proyecto, utilizado tanto en el backend como en la lógica de negocio.
- **Características utilizadas**:
  - Async/Await para manejo de operaciones asíncronas
  - Módulos ES6 (CommonJS en Node.js)
  - Destructuring y spread operators
  - Arrow functions
  - Template literals
  - Promises para manejo de asincronía
- **Justificación**: JavaScript es el lenguaje nativo del ecosistema Node.js, permitiendo coherencia en todo el stack de desarrollo y aprovechando el vasto ecosistema de paquetes npm.

#### JSON (JavaScript Object Notation)
- **Descripción**: Formato de intercambio de datos ligero utilizado para configuración y comunicación API REST.
- **Uso en el proyecto**:
  - Configuración del proyecto (`package.json`)
  - Intercambio de datos entre cliente y servidor
  - Almacenamiento de documentos en MongoDB

---

### 4.3.3 Herramientas de Desarrollo Web

#### Express.js
- **Versión**: 4.18.2
- **Descripción**: Framework web minimalista y flexible para Node.js que proporciona un conjunto robusto de características para aplicaciones web y APIs.
- **Características utilizadas**:
  - Sistema de routing para definición de endpoints REST
  - Middleware para procesamiento de peticiones
  - Manejo de errores centralizado
  - Integración con diversos módulos de seguridad
- **Justificación**: Es el framework más popular para Node.js, con excelente documentación, comunidad activa y gran flexibilidad.

#### Middlewares de Seguridad

| Middleware | Versión | Función |
|------------|---------|---------|
| **Helmet** | 8.1.0 | Configura cabeceras HTTP de seguridad (CSP, HSTS, X-Frame-Options) |
| **CORS** | 2.8.5 | Gestiona Cross-Origin Resource Sharing para controlar accesos entre dominios |
| **express-rate-limit** | 8.2.1 | Limita el número de peticiones para prevenir ataques DoS |
| **express-mongo-sanitize** | 2.2.0 | Previene inyección NoSQL sanitizando entradas |
| **hpp** | 0.2.3 | Protege contra HTTP Parameter Pollution |
| **xss** | 1.0.15 | Sanitiza entradas para prevenir ataques Cross-Site Scripting |
| **express-validator** | 7.3.1 | Validación y sanitización de datos de entrada |

#### Autenticación y Autorización

| Librería | Versión | Función |
|----------|---------|---------|
| **Passport.js** | 0.7.0 | Framework de autenticación para Node.js |
| **passport-jwt** | 4.0.1 | Estrategia JWT para autenticación stateless |
| **passport-google-oauth20** | 2.0.0 | Autenticación OAuth 2.0 con Google |
| **passport-github2** | 0.1.12 | Autenticación OAuth con GitHub |
| **jsonwebtoken** | 9.0.2 | Generación y verificación de tokens JWT |
| **bcryptjs** | 2.4.3 | Hashing seguro de contraseñas con salt |

#### Procesamiento de Archivos

| Librería | Versión | Función |
|----------|---------|---------|
| **Multer** | 2.0.2 | Manejo de uploads de archivos multipart/form-data |
| **pdf-parse** | 1.1.1 | Extracción de texto de documentos PDF (CVs) |

#### Configuración

| Librería | Versión | Función |
|----------|---------|---------|
| **dotenv** | 16.3.1 | Carga de variables de entorno desde archivos .env |

---

### 4.3.4 Sistemas de Gestión de Base de Datos

#### MongoDB
- **Tipo**: Base de datos NoSQL orientada a documentos
- **Versión**: Compatible con MongoDB 6.x+
- **Descripción**: Sistema de base de datos distribuido, de código abierto, basado en documentos JSON-like (BSON).
- **Características utilizadas**:
  - Esquemas flexibles con Mongoose ODM
  - Índices para optimización de consultas
  - Aggregation Pipeline para consultas complejas
  - Replica sets para alta disponibilidad (en producción)
- **Justificación**: 
  - Flexibilidad de esquema ideal para datos heterogéneos (proyectos, riesgos, CVs)
  - Excelente integración con Node.js
  - Escalabilidad horizontal
  - Formato JSON nativo facilita la integración con JavaScript

#### Mongoose ODM
- **Versión**: 8.0.0
- **Descripción**: Object Document Mapper (ODM) para MongoDB y Node.js.
- **Características utilizadas**:
  - Definición de esquemas con validación
  - Middlewares pre/post para hooks
  - Métodos estáticos e instancia
  - Population para referencias entre documentos
  - Virtuals para campos calculados
- **Modelos del proyecto**:
  - `User` - Gestión de usuarios y autenticación
  - `Organization` - Organizaciones y membresías
  - `Project` - Proyectos y configuración
  - `Risk` - Catálogo y gestión de riesgos
  - `CaseBase` - Base de casos para CBR
  - `CV` - Currículums de candidatos
  - `BFI44` - Test de personalidad Big Five
  - `Notification` - Sistema de notificaciones

#### MongoDB Memory Server
- **Versión**: 10.3.0
- **Descripción**: Servidor MongoDB en memoria para testing.
- **Justificación**: Permite ejecutar tests de integración con una base de datos real pero efímera, sin necesidad de una instancia MongoDB externa.

---

### 4.3.5 Control de Versiones

#### Git
- **Descripción**: Sistema de control de versiones distribuido.
- **Características utilizadas**:
  - Branching y merging para desarrollo paralelo
  - Commits atómicos con mensajes descriptivos
  - Tags para versionado de releases
  - `.gitignore` para exclusión de archivos sensibles
- **Flujo de trabajo**: Git Flow simplificado con ramas `main`, `develop` y feature branches.

#### GitHub
- **Descripción**: Plataforma de hosting de repositorios Git con características colaborativas.
- **Características utilizadas**:
  - Repositorios privados para código fuente
  - Issues para tracking de bugs y features
  - Pull Requests para revisión de código
  - GitHub Actions (potencial CI/CD)
  - Integración con VS Code
- **Justificación**: Plataforma líder en hosting de código con excelente integración con herramientas de desarrollo modernas.

---

### 4.3.6 Control de Calidad

#### Jest
- **Versión**: 30.2.0
- **Descripción**: Framework de testing JavaScript con enfoque en simplicidad.
- **Características utilizadas**:
  - Tests unitarios para controladores, servicios y utilidades
  - Tests de integración con base de datos en memoria
  - Mocking de dependencias
  - Cobertura de código (coverage)
  - Snapshots testing
- **Configuración**:
  ```javascript
  {
    testEnvironment: 'node',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    testTimeout: 30000
  }
  ```

#### Supertest
- **Versión**: 7.1.4
- **Descripción**: Librería para testing de APIs HTTP.
- **Uso**: Testing de endpoints REST, verificación de respuestas HTTP y headers.

#### Scripts de Testing
```bash
npm test                    # Ejecutar todos los tests
npm run test:unit          # Solo tests unitarios
npm run test:integration   # Solo tests de integración
npm run test:coverage      # Tests con reporte de cobertura
npm run test:watch         # Tests en modo watch
```

#### Cobertura de Código
- **Herramienta**: Jest Coverage
- **Formatos de reporte**: HTML, LCOV, JSON, Text
- **Directorio**: `/coverage`
- **Áreas cubiertas**:
  - Controllers
  - Services
  - Utils
  - Middleware

---

### 4.3.7 Gestión de Proyectos

#### npm (Node Package Manager)
- **Descripción**: Gestor de paquetes por defecto de Node.js.
- **Uso en el proyecto**:
  - Gestión de dependencias (`package.json`)
  - Scripts de automatización
  - Versionado semántico de dependencias
- **Scripts principales**:
  ```bash
  npm start          # Iniciar servidor en producción
  npm run dev        # Iniciar con hot-reload (desarrollo)
  npm run seed       # Poblar base de datos con datos de prueba
  npm run seed:help  # Ayuda sobre opciones de seeding
  ```

#### Nodemon
- **Versión**: 3.0.1
- **Descripción**: Utilidad que monitorea cambios en archivos y reinicia automáticamente el servidor Node.js.
- **Justificación**: Mejora significativamente la productividad durante el desarrollo al eliminar la necesidad de reiniciar manualmente el servidor.

#### Estructura del Proyecto
```
tfg-backend/
├── src/
│   ├── app.js              # Configuración de Express
│   ├── server.js           # Punto de entrada
│   ├── config/             # Configuraciones (DB, Passport)
│   ├── controllers/        # Controladores REST
│   ├── models/             # Modelos Mongoose
│   ├── routes/             # Definición de rutas
│   ├── services/           # Lógica de negocio
│   ├── middleware/         # Middlewares personalizados
│   ├── repositories/       # Patrón repositorio (acceso a datos)
│   ├── utils/              # Utilidades y helpers
│   └── jobs/               # Tareas programadas
├── tests/
│   ├── unit/               # Tests unitarios
│   ├── integration/        # Tests de integración
│   └── setup/              # Configuración de tests
├── scripts/                # Scripts de utilidad y seeding
├── docs/                   # Documentación
└── coverage/               # Reportes de cobertura
```

---

### 4.3.8 Documentación

#### Markdown
- **Descripción**: Lenguaje de marcado ligero para documentación.
- **Uso en el proyecto**:
  - README.md para documentación principal
  - Documentación técnica en `/docs`
  - Guías de integración y uso

#### Documentación del Proyecto
El proyecto incluye documentación extensiva en el directorio `/docs`:

| Documento | Descripción |
|-----------|-------------|
| `INDEX.md` | Índice de documentación |
| `FLOW_DIAGRAMS.md` | Diagramas de flujo del sistema |
| `FRONTEND_INTEGRATION_GUIDE.md` | Guía de integración frontend |
| `MANUAL_RISKS_GUIDE.md` | Guía de gestión de riesgos |
| `REPOSITORY_PATTERN.md` | Documentación del patrón repositorio |
| `PROBABILITY_CALCULATION.md` | Algoritmos de cálculo de probabilidad |
| `CONFIGURABLE_RISK_THRESHOLDS.md` | Configuración de umbrales de riesgo |

#### JSDoc (Comentarios en código)
- **Descripción**: Estándar de documentación para JavaScript.
- **Uso**: Documentación de funciones, parámetros y tipos en el código fuente.

---

## 4.4 Herramientas Hardware

### 4.4.1 Equipo de Desarrollo

#### Estación de Trabajo Principal
- **Tipo**: Ordenador personal de desarrollo
- **Sistema Operativo**: Windows 10/11
- **Requisitos mínimos recomendados**:
  - **Procesador**: Intel Core i5 / AMD Ryzen 5 o superior
  - **Memoria RAM**: 8 GB mínimo, 16 GB recomendado
  - **Almacenamiento**: SSD de 256 GB mínimo
  - **Conectividad**: Conexión a Internet estable

#### Justificación de Requisitos
- **RAM 16GB**: Necesario para ejecutar simultáneamente VS Code, Node.js, MongoDB, navegador con DevTools, y herramientas de testing.
- **SSD**: Mejora significativamente los tiempos de compilación, instalación de dependencias y acceso a base de datos.
- **Procesador multinúcleo**: Permite ejecución paralela de tests y procesos de desarrollo.

### 4.4.2 Entorno de Servidor (Producción)

#### Requisitos del Servidor
- **Tipo**: Servidor cloud (AWS EC2, Azure VM, DigitalOcean Droplet, o similar)
- **Especificaciones mínimas**:
  - **vCPUs**: 2 cores
  - **RAM**: 4 GB
  - **Almacenamiento**: 40 GB SSD
  - **Sistema Operativo**: Ubuntu Server 22.04 LTS o similar

#### Base de Datos
- **Opción Cloud**: MongoDB Atlas (recomendado)
  - Cluster M0 (gratuito) para desarrollo
  - Cluster M10+ para producción
- **Opción Self-hosted**: MongoDB Server en instancia dedicada

### 4.4.3 Dispositivos de Testing

#### Navegadores Soportados
Para testing del frontend que consume esta API:
- Google Chrome (última versión)
- Mozilla Firefox (última versión)
- Microsoft Edge (última versión)
- Safari (última versión)

#### Herramientas de Testing de API
- **Postman** / **Insomnia**: Testing manual de endpoints
- **curl**: Testing desde línea de comandos

---

## Resumen de Versiones Principales

| Categoría | Herramienta | Versión |
|-----------|-------------|---------|
| Runtime | Node.js | >= 18.0.0 |
| Framework | Express.js | 4.18.2 |
| Base de Datos | MongoDB/Mongoose | 8.0.0 |
| Testing | Jest | 30.2.0 |
| Seguridad | Helmet | 8.1.0 |
| Autenticación | Passport | 0.7.0 |
| Tokens | jsonwebtoken | 9.0.2 |

---

## Diagrama de Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Frontend)                      │
│                   (Consume API REST)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/HTTPS (JSON)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE SEGURIDAD                         │
│  ┌─────────┐ ┌──────┐ ┌────────────┐ ┌─────┐ ┌───────────┐ │
│  │ Helmet  │ │ CORS │ │ Rate Limit │ │ HPP │ │ XSS/NoSQL │ │
│  └─────────┘ └──────┘ └────────────┘ └─────┘ └───────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS (4.18.2)                       │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌─────────────┐ │
│  │  Routes  │ │Controllers │ │  Services │ │Repositories │ │
│  └──────────┘ └────────────┘ └───────────┘ └─────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTENTICACIÓN                              │
│  ┌──────────┐ ┌─────┐ ┌────────┐ ┌────────┐                │
│  │ Passport │ │ JWT │ │ Google │ │ GitHub │                │
│  └──────────┘ └─────┘ └────────┘ └────────┘                │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  MONGOOSE ODM (8.0.0)                        │
│         Schemas │ Validación │ Middleware │ Population      │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     MONGODB                                  │
│              Base de Datos NoSQL Documental                  │
└─────────────────────────────────────────────────────────────┘
```

---

*Documento generado para el Trabajo de Fin de Grado - Backend API*
*Última actualización: Enero 2026*

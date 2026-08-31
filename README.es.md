# SARA Platform API

## Descripción

API backend para la plataforma SARA, diseñada para gestionar organizaciones, usuarios, currículos, proyectos, análisis de riesgos y notificaciones dentro de un flujo de procesamiento de talento y colaboración.

## Tecnologías

- Node.js
- Express
- MongoDB con Mongoose
- JWT para autenticación
- Passport para OAuth y autenticación social
- Helmet, CORS, rate limiting y sanitización para seguridad
- Jest para pruebas
- Nodemon para desarrollo

## Estructura principal

- `src/` — código fuente de la aplicación
- `src/controllers/` — controladores HTTP
- `src/services/` — lógica de negocio
- `src/routes/` — rutas y endpoints
- `src/models/` — modelos de MongoDB
- `src/middleware/` — middleware de autenticación y validación
- `src/config/` — configuración de la aplicación
- `src/utils/` — utilidades compartidas
- `tests/` — pruebas unitarias e integración
- `scripts/` — scripts de semillas y utilidades

## Requisitos

- Node.js >= 18
- MongoDB en ejecución
- Variables de entorno configuradas

## Variables de entorno

Crea un archivo `.env` con la configuración necesaria para la aplicación, por ejemplo:

```bash
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/sara
JWT_SECRET=tu_secret
```

Ajusta los valores según tu entorno de desarrollo o despliegue.

## Instalación

```bash
npm install
```

## Ejecución

### Modo desarrollo

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

## Scripts disponibles

```bash
npm run start
npm run start:dev
npm run dev
npm run test
npm run test:unit
npm run test:integration
npm run test:coverage
npm run lint
npm run lint:fix
npm run seed
npm run seed:help
```

## Pruebas

```bash
npm test
```

Para ejecutar solo pruebas unitarias:

```bash
npm run test:unit
```

Para pruebas de integración:

```bash
npm run test:integration
```

## Datos de prueba

El proyecto incluye scripts de semillas para poblar la base de datos con datos de ejemplo para usuarios, organizaciones, currículos, proyectos, riesgos y notificaciones.

```bash
npm run seed
```

## Seguridad

La aplicación incluye medidas básicas de seguridad como:

- Helmet para encabezados HTTP seguros
- CORS configurado
- Rate limiting
- Sanitización de entrada
- Validación de datos
- JWT y autenticación por roles

## Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu cambio
3. Realiza tus modificaciones
4. Ejecuta pruebas relevantes
5. Envía un pull request

## Licencia

Este proyecto no especifica una licencia en el archivo actual. Revisa la política institucional o del equipo antes de reutilizarlo en producción.

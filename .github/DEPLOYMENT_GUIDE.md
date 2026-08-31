# Configuración de GitHub Actions para SARA Platform API

Este documento describe la configuración de CI/CD implementada para el proyecto.

## 📋 Estructura de Pipelines

### Pipeline de Desarrollo (`develop.yml`)
- **Trigger**: Push y Pull Requests a la rama `develop`
- **Entorno**: Development
- **Jobs**:
  1. **Test**: Ejecuta tests unitarios e integración
  2. **Build**: Verifica la construcción de la aplicación
  3. **Deploy**: Despliega al entorno de desarrollo

### Pipeline de Producción (`main.yml`)
- **Trigger**: Push a `main`, PRs a `main`, y manual dispatch
- **Entorno**: Production
- **Jobs**:
  1. **Test**: Suite completa de tests con cobertura
  2. **Security Scan**: Auditoría de seguridad y dependencias
  3. **Build**: Construcción y empaquetado para producción
  4. **Deploy**: Despliegue a producción con verificaciones
  5. **Rollback**: Procedimiento de rollback en caso de fallo

## 🔐 Variables y Secrets Requeridos

### Para GitHub Actions

#### Secrets (Settings → Secrets and variables → Actions → Secrets)

**Para ambos entornos (development y production):**

##### Opción 1: Azure App Service
```
AZURE_APP_NAME_DEV         # Nombre de la app en Azure (desarrollo)
AZURE_APP_NAME_PROD        # Nombre de la app en Azure (producción)
AZURE_PUBLISH_PROFILE_DEV  # Perfil de publicación de Azure (dev)
AZURE_PUBLISH_PROFILE_PROD # Perfil de publicación de Azure (prod)
```

##### Opción 2: AWS Elastic Beanstalk
```
AWS_ACCESS_KEY_ID          # ID de clave de acceso AWS
AWS_SECRET_ACCESS_KEY      # Clave secreta de acceso AWS
AWS_APP_NAME_DEV           # Nombre de la aplicación en AWS (dev)
AWS_APP_NAME_PROD          # Nombre de la aplicación en AWS (prod)
AWS_ENV_NAME_DEV           # Nombre del entorno AWS (dev)
AWS_ENV_NAME_PROD          # Nombre del entorno AWS (prod)
AWS_REGION                 # Región de AWS (ej: us-east-1)
```

##### Opción 3: Heroku
```
HEROKU_API_KEY             # API Key de Heroku
HEROKU_APP_NAME_DEV        # Nombre de la app en Heroku (dev)
HEROKU_APP_NAME_PROD       # Nombre de la app en Heroku (prod)
HEROKU_EMAIL               # Email de la cuenta Heroku
```

##### Opción 4: Deployment via SSH
```
DEV_HOST                   # Host del servidor de desarrollo
DEV_USERNAME               # Usuario SSH (desarrollo)
DEV_SSH_KEY                # Clave SSH privada (desarrollo)
DEV_PORT                   # Puerto SSH (desarrollo, default: 22)

PROD_HOST                  # Host del servidor de producción
PROD_USERNAME              # Usuario SSH (producción)
PROD_SSH_KEY               # Clave SSH privada (producción)
PROD_PORT                  # Puerto SSH (producción, default: 22)
```

##### Opcionales (Notificaciones y Seguridad)
```
SLACK_WEBHOOK              # Webhook de Slack para notificaciones
SNYK_TOKEN                 # Token de Snyk para análisis de seguridad
```

#### Variables de entorno (Settings → Secrets and variables → Actions → Variables)

```
DEV_URL                    # URL del entorno de desarrollo
PROD_URL                   # URL del entorno de producción
```

### Para la aplicación

Estas variables deben configurarse en tu plataforma de hosting:

```env
# Base de datos
MONGODB_URI                # URI de conexión a MongoDB
DB_NAME                    # Nombre de la base de datos

# Autenticación
JWT_SECRET                 # Secret para tokens JWT
JWT_EXPIRES_IN             # Tiempo de expiración del token (ej: 24h)
JWT_REFRESH_SECRET         # Secret para refresh tokens
JWT_REFRESH_EXPIRES_IN     # Tiempo de expiración del refresh token

# OAuth - Google
GOOGLE_CLIENT_ID           # Client ID de Google OAuth
GOOGLE_CLIENT_SECRET       # Client Secret de Google OAuth
GOOGLE_CALLBACK_URL        # URL de callback de Google

# OAuth - GitHub
GITHUB_CLIENT_ID           # Client ID de GitHub OAuth
GITHUB_CLIENT_SECRET       # Client Secret de GitHub OAuth
GITHUB_CALLBACK_URL        # URL de callback de GitHub

# Servidor
PORT                       # Puerto del servidor (ej: 3000)
NODE_ENV                   # Entorno (development/production)
FRONTEND_URL               # URL del frontend para CORS

# Seguridad
RATE_LIMIT_WINDOW_MS       # Ventana de rate limiting (ej: 900000)
RATE_LIMIT_MAX_REQUESTS    # Máximo de requests por ventana (ej: 100)
```

## 🚀 Configuración de Entornos en GitHub

### 1. Crear Entornos

Ve a **Settings → Environments** en tu repositorio y crea:

1. **development**
   - Protection rules: Ninguna (opcional)
   - Environment secrets: Variables específicas de dev
   - Deployment branches: `develop`

2. **production**
   - Protection rules:
     - ✅ Required reviewers (1-6 personas)
     - ✅ Wait timer: 5-10 minutos (opcional)
   - Environment secrets: Variables específicas de prod
   - Deployment branches: `main`

### 2. Configurar Branch Protection

**Para la rama `main`:**
- Settings → Branches → Add rule
- Branch name pattern: `main`
- Configuración recomendada:
  - ✅ Require pull request reviews before merging
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - ✅ Include administrators

**Para la rama `develop`:**
- Similar a `main` pero con reglas menos estrictas

## 📦 Proceso de Deployment

### Deployment a Development (develop)

1. Push/merge a la rama `develop`
2. Se ejecutan automáticamente:
   - Tests unitarios e integración
   - Build verification
   - Deploy al entorno de desarrollo
3. Verificar en `DEV_URL`

### Deployment a Production (main)

1. Crear PR de `develop` → `main`
2. Revisión de código requerida
3. Merge a `main`
4. Se ejecutan automáticamente:
   - Suite completa de tests
   - Security audit
   - Build y empaquetado
   - Deploy a producción (requiere aprobación si está configurado)
5. Verificar en `PROD_URL`

### Deployment Manual

Para hacer un deployment manual a producción:

1. Ve a **Actions** en GitHub
2. Selecciona "Deploy to Production"
3. Click en "Run workflow"
4. Selecciona la rama `main`
5. Elige "yes" en el campo deploy
6. Click "Run workflow"

## 🔧 Personalización

### Añadir tu plataforma de hosting

En los archivos `develop.yml` y `main.yml`, descomenta y configura la sección correspondiente a tu plataforma:
- Azure App Service
- AWS Elastic Beanstalk
- Heroku
- SSH Deployment

### Añadir tests adicionales

Modifica el job de `test` para incluir:
- Linting
- Type checking
- E2E tests
- Performance tests

### Añadir notificaciones

Descomenta la sección de notificaciones y configura:
- Slack
- Discord
- Email
- Microsoft Teams

## 📊 Monitoring

Después de cada deployment, verifica:

1. **Actions tab**: Estado de los workflows
2. **Environments**: Historial de deployments
3. **Logs**: Logs detallados de cada job
4. **Artifacts**: Reportes de cobertura y builds

## ⚠️ Troubleshooting

### Tests fallan
- Verifica que las variables de entorno estén configuradas
- Revisa los logs en la pestaña Actions
- Ejecuta los tests localmente: `npm test`

### Build falla
- Verifica las dependencias en `package.json`
- Comprueba que `NODE_VERSION` coincida con tu entorno
- Ejecuta `npm ci` localmente

### Deploy falla
- Verifica que todos los secrets estén configurados
- Comprueba los permisos de la plataforma de hosting
- Revisa los logs del job de deployment

## 📚 Recursos Adicionales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

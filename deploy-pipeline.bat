@echo off
REM Script para deployment inicial de las pipelines CI/CD
REM Este script sube los cambios primero a develop y luego a main

echo ========================================
echo   Deployment de Pipelines CI/CD
echo ========================================
echo.

REM Verificar que estamos en un repositorio git
if not exist .git (
    echo [ERROR] No estas en un repositorio Git
    exit /b 1
)

REM Paso 1: Añadir archivos
echo [1/5] Añadiendo archivos de CI/CD...
git add .github/
git add .gitignore

REM Mostrar archivos que se van a commitear
echo.
echo Archivos a commitear:
git status --short

REM Confirmar con el usuario
echo.
set /p CONTINUE="Continuar con el commit? (s/n): "
if /i not "%CONTINUE%"=="s" (
    echo [CANCELADO] Operacion cancelada
    exit /b 1
)

REM Paso 2: Commit
echo.
echo [2/5] Creando commit...
git commit -m "feat: Add CI/CD pipelines for develop and main branches" -m "- Add GitHub Actions workflow for development environment" -m "- Add GitHub Actions workflow for production environment" -m "- Configure automated testing and deployment" -m "- Add comprehensive deployment documentation" -m "- Update .gitignore to exclude build artifacts and keep docs" -m "- Configure environment-based deployments with approval gates"

REM Paso 3: Checkout/crear develop
echo.
echo [3/5] Cambiando a rama develop...
git checkout develop 2>nul || git checkout -b develop

REM Confirmar push a develop
echo.
set /p PUSH_DEV="Hacer push a develop? (s/n): "
if /i "%PUSH_DEV%"=="s" (
    git push -u origin develop
    echo [OK] Cambios subidos a develop exitosamente
) else (
    echo [SKIP] Saltando push a develop
)

REM Paso 4: Merge a main
echo.
echo [4/5] Preparando merge a main...
set /p MERGE_MAIN="Hacer merge a main y push? (s/n): "
if /i "%MERGE_MAIN%"=="s" (
    git checkout main
    git merge develop -m "chore: Merge CI/CD pipeline setup from develop to main" -m "Includes:" -m "- GitHub Actions workflows for automated testing and deployment" -m "- Environment configurations for development and production" -m "- Comprehensive deployment documentation"
    
    git push origin main
    echo [OK] Cambios mergeados y subidos a main exitosamente
    
    REM Volver a develop
    git checkout develop
) else (
    echo [SKIP] Saltando merge a main. Quedando en rama develop
)

REM Paso 5: Resumen final
echo.
echo ========================================
echo   Proceso Completado!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Ir a GitHub - Settings - Environments
echo 2. Crear entornos 'development' y 'production'
echo 3. Configurar los Secrets necesarios
echo 4. Configurar las Variables de entorno
echo 5. Configurar Branch Protection Rules
echo.
echo Lee el archivo .github\DEPLOYMENT_GUIDE.md para mas detalles
echo.
pause

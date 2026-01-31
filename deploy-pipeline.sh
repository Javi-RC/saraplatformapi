#!/bin/bash

# Script para deployment inicial de las pipelines CI/CD
# Este script sube los cambios primero a develop y luego a main

echo "🚀 Iniciando proceso de deployment de pipelines CI/CD"
echo ""

# Verificar que estamos en un repositorio git
if [ ! -d .git ]; then
    echo "❌ Error: No estás en un repositorio Git"
    exit 1
fi

# Función para verificar el estado de Git
check_git_status() {
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  Tienes cambios sin commitear"
        return 1
    fi
    return 0
}

# Paso 1: Añadir archivos
echo "📦 Añadiendo archivos de CI/CD..."
git add .github/
git add .gitignore

# Mostrar archivos que se van a commitear
echo ""
echo "📝 Archivos a commitear:"
git status --short

# Confirmar con el usuario
echo ""
read -p "¿Continuar con el commit? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Paso 2: Commit
echo ""
echo "💾 Creando commit..."
git commit -m "feat: Add CI/CD pipelines for develop and main branches

- Add GitHub Actions workflow for development environment
- Add GitHub Actions workflow for production environment
- Configure automated testing and deployment
- Add comprehensive deployment documentation
- Update .gitignore to exclude build artifacts and keep docs
- Configure environment-based deployments with approval gates"

# Paso 3: Push a develop
echo ""
echo "📤 Subiendo cambios a develop..."
git checkout develop 2>/dev/null || git checkout -b develop

read -p "¿Hacer push a develop? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin develop
    echo "✅ Cambios subidos a develop exitosamente"
else
    echo "⏭️  Skipping push to develop"
fi

# Paso 4: Merge a main
echo ""
echo "🔀 Preparando merge a main..."
read -p "¿Hacer merge a main y push? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout main
    git merge develop -m "chore: Merge CI/CD pipeline setup from develop to main

Includes:
- GitHub Actions workflows for automated testing and deployment
- Environment configurations for development and production
- Comprehensive deployment documentation"
    
    git push origin main
    echo "✅ Cambios mergeados y subidos a main exitosamente"
    
    # Volver a develop
    git checkout develop
else
    echo "⏭️  Skipping merge to main. Quedando en rama develop"
fi

echo ""
echo "🎉 ¡Proceso completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ir a GitHub → Settings → Environments"
echo "2. Crear entornos 'development' y 'production'"
echo "3. Configurar los Secrets necesarios (ver .github/DEPLOYMENT_GUIDE.md)"
echo "4. Configurar las Variables de entorno"
echo "5. Configurar Branch Protection Rules para main y develop"
echo ""
echo "📖 Lee el archivo .github/DEPLOYMENT_GUIDE.md para más detalles"

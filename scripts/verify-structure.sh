#!/bin/bash

# CivicPulse AI Structure Verification Script

echo "🔍 Verifying CivicPulse AI project structure..."
echo ""

ERRORS=0

# Check directories
echo "📁 Checking directories..."
REQUIRED_DIRS=(
    "backend"
    "backend/src"
    "frontend"
    "frontend/src"
    "agent-runtime"
    "ml-pipeline"
    "ml-pipeline/models"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "📄 Checking configuration files..."
REQUIRED_FILES=(
    "package.json"
    "docker-compose.yml"
    ".env.example"
    ".gitignore"
    "README.md"
    "backend/package.json"
    "backend/tsconfig.json"
    "backend/Dockerfile"
    "backend/.env.example"
    "backend/src/index.ts"
    "frontend/package.json"
    "frontend/tsconfig.json"
    "frontend/Dockerfile"
    "frontend/.env.example"
    "frontend/vite.config.ts"
    "frontend/index.html"
    "frontend/src/main.tsx"
    "agent-runtime/requirements.txt"
    "agent-runtime/Dockerfile"
    "agent-runtime/.env.example"
    "agent-runtime/main.py"
    "ml-pipeline/requirements.txt"
    "ml-pipeline/Dockerfile"
    "ml-pipeline/.env.example"
    "ml-pipeline/main.py"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Project structure is complete."
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Run './scripts/setup.sh' to initialize environment files"
    echo "   2. Edit .env files with your API keys"
    echo "   3. Run 'docker-compose up -d' to start services"
    exit 0
else
    echo "❌ Found $ERRORS error(s). Please check the missing files/directories."
    exit 1
fi

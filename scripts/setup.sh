#!/bin/bash

# CivicPulse AI Setup Script

set -e

echo "🚀 Setting up CivicPulse AI..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists, skipping"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "⚠️  backend/.env file already exists, skipping"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env file"
else
    echo "⚠️  frontend/.env file already exists, skipping"
fi

if [ ! -f agent-runtime/.env ]; then
    cp agent-runtime/.env.example agent-runtime/.env
    echo "✅ Created agent-runtime/.env file"
else
    echo "⚠️  agent-runtime/.env file already exists, skipping"
fi

if [ ! -f ml-pipeline/.env ]; then
    cp ml-pipeline/.env.example ml-pipeline/.env
    echo "✅ Created ml-pipeline/.env file"
else
    echo "⚠️  ml-pipeline/.env file already exists, skipping"
fi

echo ""
echo "⚠️  IMPORTANT: Please edit the .env files with your configuration:"
echo "   - Set OPENAI_API_KEY in .env and agent-runtime/.env"
echo "   - Set VITE_MAPBOX_TOKEN in .env and frontend/.env"
echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
npm install

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit .env files with your API keys"
echo "   2. Run 'docker-compose up -d' to start all services"
echo "   3. Access the application at http://localhost:3000"
echo ""

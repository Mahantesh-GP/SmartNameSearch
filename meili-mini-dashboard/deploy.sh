#!/bin/bash

# MeiliSearch Dashboard Deployment Script
# This script helps set up and deploy the MeiliSearch Dashboard

set -e

echo "🎛️ MeiliSearch Dashboard Deployment Helper"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script should be run from the meili-mini-dashboard directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Function to check if environment file exists
check_env() {
    if [ ! -f ".env" ]; then
        echo "📝 Creating .env file from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo "✅ .env file created from .env.example"
            echo "⚠️  Please edit .env file with your MeiliSearch configuration before continuing"
            echo "   Required variables:"
            echo "   - VITE_MEILI_HOST (your MeiliSearch server URL)"  
            echo "   - VITE_MEILI_API_KEY (your search API key)"
            read -p "Press Enter after editing .env file..."
        else
            echo "❌ Error: .env.example file not found"
            exit 1
        fi
    else
        echo "✅ .env file found"
    fi
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    if command -v npm &> /dev/null; then
        npm ci
        echo "✅ Dependencies installed"
    else
        echo "❌ Error: npm not found. Please install Node.js"
        exit 1
    fi
}

# Function to build the project
build_project() {
    echo "🔨 Building project..."
    npm run build
    echo "✅ Build complete - output in ./dist"
}

# Function to run development server
dev_server() {
    echo "🚀 Starting development server..."
    npm run dev
}

# Function to build Docker image
build_docker() {
    echo "🐳 Building Docker image..."
    docker build -t meili-mini-dashboard .
    echo "✅ Docker image built successfully"
    echo "   Run with: docker run -p 8080:80 --env-file .env meili-mini-dashboard"
}

# Function to deploy to GitHub Pages
deploy_github() {
    echo "🚢 Deploying to GitHub Pages..."
    echo "   Make sure you have:"
    echo "   1. Pushed your code to GitHub"
    echo "   2. Configured VITE_MEILI_API_KEY secret in repository settings"
    echo "   3. Enabled GitHub Pages with GitHub Actions source"
    echo "   "
    echo "   The deployment will happen automatically via GitHub Actions"
    echo "   Check: https://github.com/[username]/[repo]/actions"
}

# Main menu
echo ""
echo "Select deployment option:"
echo "1) Set up environment file"
echo "2) Install dependencies" 
echo "3) Build for production"
echo "4) Start development server"
echo "5) Build Docker image"
echo "6) Deploy to GitHub Pages (info)"
echo "7) Full setup (1-3)"
echo "0) Exit"
echo ""

read -p "Choose option (0-7): " choice

case $choice in
    1)
        check_env
        ;;
    2)
        install_deps
        ;;
    3)
        build_project
        ;;
    4)
        check_env
        install_deps
        dev_server
        ;;
    5)
        check_env
        build_docker
        ;;
    6)
        deploy_github
        ;;
    7)
        check_env
        install_deps
        build_project
        echo ""
        echo "🎉 Setup complete! Your dashboard is ready for deployment."
        echo "   Built files are in ./dist"
        ;;
    0)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Operation completed successfully!"
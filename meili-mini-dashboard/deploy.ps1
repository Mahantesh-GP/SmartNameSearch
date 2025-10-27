# MeiliSearch Dashboard Deployment Script (PowerShell)
# This script helps set up and deploy the MeiliSearch Dashboard

$ErrorActionPreference = "Stop"

Write-Host "🎛️ MeiliSearch Dashboard Deployment Helper" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: This script should be run from the meili-mini-dashboard directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Red
    exit 1
}

# Function to check if environment file exists
function Check-Env {
    if (-Not (Test-Path ".env")) {
        Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ .env file created from .env.example" -ForegroundColor Green
            Write-Host "⚠️  Please edit .env file with your MeiliSearch configuration before continuing" -ForegroundColor Yellow
            Write-Host "   Required variables:" -ForegroundColor Yellow
            Write-Host "   - VITE_MEILI_HOST (your MeiliSearch server URL)" -ForegroundColor Yellow  
            Write-Host "   - VITE_MEILI_API_KEY (your search API key)" -ForegroundColor Yellow
            Read-Host "Press Enter after editing .env file"
        } else {
            Write-Host "❌ Error: .env.example file not found" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ .env file found" -ForegroundColor Green
    }
}

# Function to install dependencies
function Install-Deps {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    try {
        npm ci
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: npm not found. Please install Node.js" -ForegroundColor Red
        exit 1
    }
}

# Function to build the project
function Build-Project {
    Write-Host "🔨 Building project..." -ForegroundColor Yellow
    npm run build
    Write-Host "✅ Build complete - output in ./dist" -ForegroundColor Green
}

# Function to run development server
function Start-DevServer {
    Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
    npm run dev
}

# Function to build Docker image
function Build-Docker {
    Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
    docker build -t meili-mini-dashboard .
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
    Write-Host "   Run with: docker run -p 8080:80 --env-file .env meili-mini-dashboard" -ForegroundColor Cyan
}

# Function to deploy to GitHub Pages
function Deploy-GitHub {
    Write-Host "🚢 Deploying to GitHub Pages..." -ForegroundColor Yellow
    Write-Host "   Make sure you have:" -ForegroundColor Yellow
    Write-Host "   1. Pushed your code to GitHub" -ForegroundColor Yellow
    Write-Host "   2. Configured VITE_MEILI_API_KEY secret in repository settings" -ForegroundColor Yellow
    Write-Host "   3. Enabled GitHub Pages with GitHub Actions source" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   The deployment will happen automatically via GitHub Actions" -ForegroundColor Cyan
    Write-Host "   Check: https://github.com/[username]/[repo]/actions" -ForegroundColor Cyan
}

# Main menu
Write-Host ""
Write-Host "Select deployment option:" -ForegroundColor White
Write-Host "1) Set up environment file" -ForegroundColor White
Write-Host "2) Install dependencies" -ForegroundColor White
Write-Host "3) Build for production" -ForegroundColor White
Write-Host "4) Start development server" -ForegroundColor White
Write-Host "5) Build Docker image" -ForegroundColor White
Write-Host "6) Deploy to GitHub Pages (info)" -ForegroundColor White
Write-Host "7) Full setup (1-3)" -ForegroundColor White
Write-Host "0) Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choose option (0-7)"

switch ($choice) {
    "1" {
        Check-Env
    }
    "2" {
        Install-Deps
    }
    "3" {
        Build-Project
    }
    "4" {
        Check-Env
        Install-Deps
        Start-DevServer
    }
    "5" {
        Check-Env
        Build-Docker
    }
    "6" {
        Deploy-GitHub
    }
    "7" {
        Check-Env
        Install-Deps
        Build-Project
        Write-Host ""
        Write-Host "🎉 Setup complete! Your dashboard is ready for deployment." -ForegroundColor Green
        Write-Host "   Built files are in ./dist" -ForegroundColor Cyan
    }
    "0" {
        Write-Host "👋 Goodbye!" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Operation completed successfully!" -ForegroundColor Green
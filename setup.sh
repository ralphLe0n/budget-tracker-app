#!/bin/bash

# Budget Tracker - Quick Start Script
# This script sets up your project and prepares it for GitHub/Vercel deployment

echo "🚀 Budget Tracker - Quick Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "📥 Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed!"
    echo "📥 Please install Git from: https://git-scm.com"
    exit 1
fi

echo "✅ Git found: $(git --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully!"
echo ""

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Budget Tracker App"
    echo "✅ Git repository initialized!"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository: https://github.com/new"
echo "2. Connect your local repo to GitHub:"
echo "   git remote add origin https://github.com/YOUR-USERNAME/budget-tracker-app.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Sign in with GitHub"
echo "   - Import your repository"
echo "   - Click Deploy!"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "To start development server now, run: npm run dev"

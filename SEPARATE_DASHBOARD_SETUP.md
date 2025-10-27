#!/bin/bash
# Deploy Dashboard to Separate Repository Script

echo "🚀 Setting up Dashboard in Separate Repository"
echo "=============================================="

# Create a new repository for the dashboard
echo "1. Go to GitHub and create a new repository:"
echo "   Repository name: meili-mini-dashboard"
echo "   Description: MeiliSearch Management Dashboard"
echo "   Public repository"
echo ""

echo "2. After creating the repository, run these commands:"
echo ""

cat << 'EOF'
# Clone the new repository
git clone https://github.com/Mahantesh-GP/meili-mini-dashboard.git
cd meili-mini-dashboard

# Copy dashboard files from main project
cp -r ../SmartNameSearch/meili-mini-dashboard/* .
cp ../SmartNameSearch/.github/workflows/deploy-dashboard.yml .github/workflows/

# Initialize git and push
git add .
git commit -m "Initial dashboard setup"
git push origin main

# The dashboard will be available at:
# https://mahantesh-gp.github.io/meili-mini-dashboard/
EOF

echo ""
echo "3. Configure repository secrets in the NEW repository:"
echo "   - Go to Settings > Secrets and variables > Actions"
echo "   - Add VITE_MEILI_API_KEY with your MeiliSearch API key"
echo ""
echo "4. Enable GitHub Pages:"
echo "   - Go to Settings > Pages"
echo "   - Source: GitHub Actions"
echo ""
echo "Result: Two separate deployments:"
echo "- Main app: https://mahantesh-gp.github.io/SmartNameSearch/"
echo "- Dashboard: https://mahantesh-gp.github.io/meili-mini-dashboard/"
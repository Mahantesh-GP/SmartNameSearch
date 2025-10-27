# Meili Mini Dashboard (React + Vite + Tailwind)

A lightweight dashboard to visually browse Meilisearch indexes and documents.
Works with Meilisearch hosted on Render or anywhere else.

## Quick Start

### Option 1: Manual Setup
```bash
npm i
cp .env.example .env
# Edit .env: set VITE_MEILI_HOST and VITE_MEILI_API_KEY
npm run dev
```

### Option 2: Deployment Script (Recommended)
```bash
# Linux/macOS
./deploy.sh

# Windows PowerShell  
.\deploy.ps1
```

Open http://localhost:5173

## Environment

- **VITE_MEILI_HOST**: your Meilisearch URL (e.g., https://meili-yourapp.onrender.com)
- **VITE_MEILI_API_KEY**: use a Search key for read-only access
- If your Meili is behind CORS, set its `--http-cors-origin` (or env `MEILI_HTTP_CORS_ORIGIN`) to include your dashboard origin.

## Deployment Options

### 1. GitHub Pages (Recommended)
Deploy as a static site using GitHub Actions for automatic builds:

```bash
# 1. Fork/clone this repository
# 2. Configure repository secrets in Settings > Secrets and variables > Actions:
#    - VITE_MEILI_API_KEY: Your MeiliSearch search-only API key
# 3. Configure repository variables (optional):
#    - VITE_MEILI_HOST: Your MeiliSearch server URL
# 4. Enable GitHub Pages in Settings > Pages > Source: GitHub Actions
# 5. Push to main branch - automatic deployment via .github/workflows/deploy-dashboard.yml
```

Dashboard will be available at: `https://yourusername.github.io/meili-mini-dashboard/`

### 2. Render Static Site
Build and host the React app; talks directly to MeiliSearch (ensure CORS is configured):

```bash
# 1. Create new Static Site on Render
# 2. Connect your repository
# 3. Build Command: npm run build
# 4. Publish Directory: dist
# 5. Environment Variables:
#    VITE_MEILI_HOST=https://your-meilisearch-instance.onrender.com
#    VITE_MEILI_API_KEY=your-search-key
```

### 3. Render Web Service (Dockerized)
Use the provided Dockerfile for containerized deployment:

```bash
# 1. Create new Web Service on Render
# 2. Connect repository, set Root Directory: meili-mini-dashboard
# 3. Docker build with environment variables
```

### 4. Local Development with Docker Compose
Integrated with the main SmartNameSearch project:

```bash
# From the main SmartNameSearch project root:
cd MeiliNameSearch/docker
docker compose up -d

# Dashboard available at: http://localhost:3001
# Main search app at: http://localhost:3000
# API at: http://localhost:5000
# MeiliSearch at: http://localhost:7700
```

### Docker (Standalone)

```bash
docker build -t meili-mini-dashboard .
docker run -p 8080:80 \
  --env VITE_MEILI_HOST=https://your-meilisearch.onrender.com \
  --env VITE_MEILI_API_KEY=your-search-key \
  meili-mini-dashboard
```

## Integration with SmartNameSearch Project

This dashboard is designed to work seamlessly with the main SmartNameSearch project:

- **Shared MeiliSearch Instance**: Connects to the same MeiliSearch server as the main API
- **Index Management**: View and manage the "persons" index created by the SmartNameSearch API
- **Document Analysis**: Browse the enriched documents with nickname expansions and phonetic keys
- **Search Testing**: Test search queries directly against your indexed data

### Setup for SmartNameSearch Integration

1. **Use the same MeiliSearch instance**: Set `VITE_MEILI_HOST` to match your SmartNameSearch API's `MEILI_HOST`
2. **API Key Configuration**: 
   - Development: Use the same master key as your API
   - Production: Create a search-only key for better security
3. **CORS Configuration**: Ensure your MeiliSearch instance allows requests from your dashboard domain

## Project Structure

```
meili-mini-dashboard/
├── src/
│   ├── App.tsx                      # Main application component
│   ├── components/                  # React components
│   │   ├── DocumentBrowser.tsx      # Document viewer and search
│   │   ├── IndexList.tsx            # Index management sidebar
│   │   ├── SearchBar.tsx            # Search interface
│   │   ├── StatsDashboard.tsx       # Analytics and statistics
│   │   └── UI.tsx                   # Shared UI components
│   ├── contexts/                    # React contexts
│   │   ├── NotificationContext.tsx  # Toast notifications system
│   │   └── ThemeContext.tsx         # Dark/light theme management
│   └── lib/
│       └── meili.ts                 # MeiliSearch client wrapper
├── .env.example                     # Environment configuration template
├── Dockerfile                       # Production container build
├── package.json                     # Dependencies and scripts
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
└── README.md                        # This file
```

## Security Considerations

- **API Keys**: Always use search-only keys in production (never expose master keys in frontend)
- **CORS**: Configure MeiliSearch CORS settings to restrict dashboard access to trusted domains
- **Environment Variables**: Never commit `.env` files with real credentials
- **Backend Proxy**: Consider adding a backend proxy if you need to hide API keys completely
- **HTTPS**: Always use HTTPS in production for secure key transmission

## Features

- 🗂️ **Index Management**: Browse all MeiliSearch indexes with real-time stats
- 📄 **Document Browser**: View, search, and paginate through documents in any index  
- 📊 **Statistics Dashboard**: Index health, document counts, and performance metrics
- 🔍 **Advanced Search**: Test search queries with highlighting and scoring
- 🎨 **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🌓 **Theme Support**: Automatic dark/light mode with system preference detection
- ⚡ **Real-time Data**: Live updates using React Query for optimal performance
- 🎭 **Glassmorphism Design**: Modern visual effects with smooth animations

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Add your dashboard URL to MeiliSearch's CORS settings
2. Set `MEILI_HTTP_CORS_ORIGIN` environment variable in your MeiliSearch instance
3. For local development: `MEILI_HTTP_CORS_ORIGIN=http://localhost:5173`

### Connection Issues
- Verify `VITE_MEILI_HOST` is accessible from your browser
- Check that your MeiliSearch instance is running and healthy
- Ensure your API key has the correct permissions

### Build Issues
- Run `npm ci` to ensure clean dependency installation
- Check Node.js version (requires 18+)
- Verify environment variables are properly set during build

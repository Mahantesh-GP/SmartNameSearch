# Render Deployment Instructions

## Build Settings

When deploying to Render.com, use these settings:

- **Root Directory**: `MeiliNameSearch/src`
- **Build Command**: (leave empty, Docker build will handle it)
- **Dockerfile Path**: `NameSearch.Api/Dockerfile`

## Environment Variables

Set these in Render:

```
MEILI_HOST=https://your-meilisearch-service.onrender.com
MEILI_API_KEY=your-meilisearch-api-key
ENABLE_SWAGGER=true
ALLOWED_ORIGINS=https://mahantesh-gp.github.io;http://localhost:5173
```

## Build Context

The Dockerfile expects the build context to be `MeiliNameSearch/src` because it needs access to:
- `NameSearch.Api/` 
- `NameSearch.Domain/`
- `NameSearch.Infrastructure/`
- `../tools/dictionaries/nicknames.json`

This structure allows the Docker build to access all necessary project files and dependencies.

# Render Deployment Instructions

## API Deployment Settings

When deploying the API to Render.com, use these settings:

### Build Configuration
- **Root Directory**: `MeiliNameSearch`
- **Dockerfile Path**: `src/NameSearch.Api/Dockerfile`
- **Docker Build Context Directory**: `MeiliNameSearch`

### Environment Variables

Set these environment variables in Render:

```
MEILI_HOST=https://your-meilisearch-service.onrender.com
MEILI_API_KEY=your-meilisearch-api-key
ENABLE_SWAGGER=true
ALLOWED_ORIGINS=https://mahantesh-gp.github.io;http://localhost:5173
NICKNAMES_PATH=/app/tools/dictionaries/nicknames.json
```

## MeiliSearch Deployment Settings

Deploy MeiliSearch as a separate service:

- **Docker Image**: `getmeili/meilisearch:v1.5`
- **Port**: `7700`
- **Environment Variables**:
  ```
  MEILI_MASTER_KEY=your-secure-master-key-here
  MEILI_ENV=production
  ```

## Build Context Explanation

The Dockerfile build context is set to `MeiliNameSearch` directory to access:
- `src/NameSearch.Api/` - API project files
- `src/NameSearch.Domain/` - Domain models
- `src/NameSearch.Infrastructure/` - Infrastructure services
- `tools/dictionaries/nicknames.json` - Nickname dictionary

## Troubleshooting

### If deployment fails with "COPY failed":
- Verify Root Directory is set to `MeiliNameSearch` (not `MeiliNameSearch/src`)
- Verify Dockerfile Path is `src/NameSearch.Api/Dockerfile`

### If API starts but searches fail:
- Check `MEILI_HOST` points to your MeiliSearch service
- Verify `MEILI_API_KEY` matches the MeiliSearch master key
- Check CORS settings in `ALLOWED_ORIGINS`

### Cold Start Issues:
- Render free tier spins down after inactivity
- First request may take 1-2 minutes
- Consider upgrading to paid tier for always-on service

# 🚨 Dashboard Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### 1. **GitHub Pages Not Enabled**
**Error**: Workflow fails with pages deployment error
**Solution**:
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**  
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. **Missing Repository Secrets**
**Error**: Dashboard builds but shows "demo-key-please-configure" 
**Solution**:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `VITE_MEILI_API_KEY`
   - **Value**: Your MeiliSearch API key (use search-only key for security)

### 3. **Workflow Not Triggering**
**Error**: No GitHub Actions running after push
**Possible causes**:
- Changes not in `meili-mini-dashboard/` directory
- Workflow file has syntax errors
- GitHub Actions disabled

**Solutions**:
```bash
# Force trigger the workflow manually
git commit --allow-empty -m "trigger dashboard deployment"
git push origin main
```

Or trigger manually:
1. Go to **Actions** tab on GitHub
2. Select **Deploy MeiliSearch Dashboard to GitHub Pages**
3. Click **Run workflow**

### 4. **Build Errors**
**Error**: npm ci or npm run build fails
**Common solutions**:
- Node.js version mismatch → workflow uses Node 20
- Missing dependencies → check package.json and package-lock.json
- TypeScript errors → check for build issues locally first

**Debug locally**:
```bash
cd meili-mini-dashboard
npm ci
npm run build
```

### 5. **CORS Errors After Deployment**
**Error**: Dashboard loads but can't connect to MeiliSearch
**Solution**: Configure CORS in your MeiliSearch instance:
```bash
# For Render deployment, add environment variable:
MEILI_HTTP_CORS_ORIGIN=https://your-username.github.io
```

## ✅ **Quick Fix Checklist**

1. **Enable GitHub Pages**:
   - Repository Settings → Pages → Source: GitHub Actions

2. **Add API Key Secret**:
   - Settings → Secrets → Actions → New secret
   - Name: `VITE_MEILI_API_KEY`
   - Value: Your MeiliSearch search key

3. **Check Workflow File**:
   ```bash
   # Verify workflow exists
   ls .github/workflows/deploy-dashboard.yml
   ```

4. **Test Local Build**:
   ```bash
   cd meili-mini-dashboard
   npm ci && npm run build
   ```

5. **Manual Trigger**:
   - GitHub → Actions → Deploy MeiliSearch Dashboard → Run workflow

## 🔍 **Debug Information**

### Check Workflow Status:
1. Go to GitHub repository → **Actions** tab
2. Look for "Deploy MeiliSearch Dashboard to GitHub Pages" workflow
3. Click on latest run to see detailed logs

### Common Log Messages:
- ✅ **"Build complete. Output:"** → Build successful
- ❌ **"npm ERR!"** → Dependency or build error  
- ❌ **"Error: No such file"** → File path issue
- ⚠️ **"Warning: VITE_MEILI_API_KEY not set"** → Missing secret (expected initially)

### Verify Deployment:
After successful deployment, dashboard should be available at:
`https://your-username.github.io/SmartNameSearch/`

## 🛠️ **Manual Deployment (Alternative)**

If GitHub Actions continues to fail, deploy manually:

```bash
# 1. Build locally
cd meili-mini-dashboard
npm ci
npm run build

# 2. Deploy to GitHub Pages manually
npx gh-pages -d dist -b gh-pages

# 3. Configure GitHub Pages to use gh-pages branch
# Go to Settings → Pages → Source: Deploy from branch → gh-pages
```

## 📞 **Get Help**

If issues persist:
1. Check GitHub Actions logs for specific error messages
2. Verify all prerequisites are met (Pages enabled, secrets configured)  
3. Test local build to isolate the issue
4. Try manual workflow trigger

**Next Steps**: Once working, the dashboard will automatically redeploy when you push changes to `meili-mini-dashboard/` directory.
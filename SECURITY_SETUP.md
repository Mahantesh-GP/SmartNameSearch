# 🔐 URGENT: Security Setup Required

## ⚠️ API Key Removed for Security

The MeiliSearch API key has been removed from all public files for security reasons.

## 🛠️ Required Setup Steps:

### 1. Configure Repository Secret (Required for Dashboard)

1. **Go to your GitHub repository**: https://github.com/Mahantesh-GP/SmartNameSearch
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add the secret**:
   - **Name**: `VITE_MEILI_API_KEY`
   - **Secret**: Your actual MeiliSearch API key (`f366fe5896d3f3ef6713d68ed59ef829`)

### 2. Update Local Development Environment

For local development, update your `.env` file:

```bash
cd meili-mini-dashboard
cp .env.example .env
# Edit .env and add your API key:
# VITE_MEILI_API_KEY=f366fe5896d3f3ef6713d68ed59ef829
```

### 3. Redeploy Dashboard

After adding the repository secret:
```bash
git commit --allow-empty -m "trigger redeploy with secure API key"
git push origin main
```

## 🔄 What Happens Next:

- **Without the secret**: Dashboard will show "demo-key-please-configure-repository-secret" error
- **With the secret**: Dashboard will work normally with your MeiliSearch instance

## 🚨 Security Best Practices:

1. **Never commit API keys** to public repositories
2. **Use repository secrets** for sensitive configuration
3. **Consider creating a search-only key** instead of using master key
4. **Rotate keys regularly** for better security

## 🎯 Quick Test:

After adding the repository secret, check:
- Dashboard deployment completes successfully in Actions tab
- https://mahantesh-gp.github.io/SmartNameSearch/dashboard/ works without API errors
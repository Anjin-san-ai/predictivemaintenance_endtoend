# Azure Deployment Guide for A400M Webapp

## Prerequisites
- Azure subscription
- GitHub account
- Azure CLI (optional but recommended)

## Step 1: Prepare Your GitHub Repository

### Option A: Use Existing Repository (Recommended)
Your code is already connected to: `git@github.com:ineilsen/a400m.git`

### Option B: Create New Repository
1. Go to GitHub.com and create a new repository
2. Name it `a400-webapp` or your preferred name
3. Make it Public (for free tier) or Private
4. Don't initialize with README, .gitignore, or license

## Step 2: Push Code to GitHub

```bash
# If using existing repository, just push the new files
git add .
git commit -m "Add Azure deployment configuration"
git push origin main

# If creating new repository, follow GitHub's instructions to push existing code
```

## Step 3: Create Azure Web App

### 3.1 Using Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Web App" and select it
4. Click "Create"

### 3.2 Configure Web App
- **Subscription**: Select your subscription
- **Resource Group**: Create new or use existing
- **Name**: `a400-webapp` (must be globally unique)
- **Publish**: Code
- **Runtime stack**: Node 20 LTS
- **Operating System**: Linux (recommended) or Windows
- **Region**: Choose closest to your users
- **App Service Plan**: 
  - **Sku and size**: F1 (Free) for testing, B1 (Basic) for production
  - **Name**: `a400-webapp-plan`

### 3.3 Advanced Settings (Optional)
- **Application Insights**: Enable for monitoring
- **Deployment**: We'll configure this in the next step

## Step 4: Configure GitHub Actions Deployment

### 4.1 Get Publish Profile
1. In Azure Portal, go to your Web App
2. Click "Deployment Center"
3. Select "GitHub Actions" as source
4. Click "Configure"
5. Select your GitHub repository
6. Choose branch (main/master)
7. Click "Save"

### 4.2 Alternative: Manual Configuration
1. In your Web App, go to "Deployment Center"
2. Click "Manage publish profile"
3. Download the publish profile file
4. In your GitHub repository, go to Settings > Secrets and variables > Actions
5. Create new secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
6. Paste the content of the downloaded publish profile file

## Step 5: Configure Environment Variables

### 5.1 In Azure Portal
1. Go to your Web App
2. Click "Configuration" > "Application settings"
3. Add the following environment variables:

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT=deployment-name
PORT=8080
NODE_ENV=production
```

### 5.2 Optional Variables
```
NEURO_SAN_API_URL=http://localhost:8080/v1/chat/completions
NEURO_SAN_PROJECT_NAME=your_project_name
NEURO_SAN_SUMMARY_PROJECT_NAME=your_summary_project_name
```

## Step 6: Deploy

### 6.1 Automatic Deployment (Recommended)
1. Push your code to the main branch
2. GitHub Actions will automatically deploy to Azure
3. Monitor deployment in GitHub Actions tab

### 6.2 Manual Deployment
```bash
# Install Azure CLI if not already installed
az login
az webapp deployment source config-local-git --name a400-webapp --resource-group your-resource-group
git remote add azure <git-url-from-above-command>
git push azure main
```

## Step 7: Verify Deployment

1. Go to your Azure Web App URL: `https://a400-webapp.azurewebsites.net`
2. Test the application functionality
3. Check logs in Azure Portal > Web App > Log stream

## Step 8: Custom Domain (Optional)

1. In Azure Portal, go to your Web App
2. Click "Custom domains"
3. Add your domain
4. Configure DNS records as instructed

## Troubleshooting

### Common Issues:
1. **Port Issues**: Ensure PORT environment variable is set to 8080
2. **Node Version**: Make sure Azure Web App supports Node 20
3. **Environment Variables**: Verify all required variables are set
4. **File Permissions**: Ensure data directory is writable

### Check Logs:
- Azure Portal > Web App > Log stream
- GitHub Actions > Your workflow > View logs

## Cost Optimization

- Use F1 (Free) tier for development/testing
- Use B1 (Basic) tier for production
- Consider Azure Static Web Apps for frontend-only deployment
- Use Azure Container Instances for containerized deployment

## Security Considerations

1. Store sensitive data in Azure Key Vault
2. Use managed identities for Azure services
3. Enable HTTPS only
4. Configure CORS properly
5. Use environment variables for secrets

## Monitoring

1. Enable Application Insights
2. Set up alerts for errors
3. Monitor performance metrics
4. Set up log analytics 
# Unified Fleet Platform — Azure Deployment Guide

## Quick Overview

- **a400-webapp** → already deployed at `https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net`
- **COMPASS-Demo** → needs to be created as Azure Static Web App

---

## Part 1: Deploy a400-webapp (Already Running ✓)

The a400-webapp is already live. To redeploy after code changes:

### 1A. Add GitHub Secret (one-time)

The publish profile is saved at: `/tmp/a400-publish-profile.xml`

**Manually add it to GitHub:**
1. Go to https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/settings/secrets/actions
2. Click **New repository secret**
3. Name: `AZUREAPPSERVICE_PUBLISHPROFILE_A400`
4. Value: Copy the entire contents of `/tmp/a400-publish-profile.xml` and paste
5. Click **Add secret**

### 1B. Trigger Deployment

1. Go to https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/actions
2. Click **Build and deploy a400-webapp to Azure Web App**
3. Click **Run workflow** → **Run workflow**
4. Wait ~2 minutes
5. Visit: https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net

---

## Part 2: Deploy COMPASS-Demo to Azure Static Web Apps

### 2A. Create Static Web App in Azure Portal

1. Go to https://portal.azure.com
2. Click **Create a resource** → search **Static Web App** → **Create**
3. Fill in:
   - **Subscription:** `cb6887677a-dseidemo-az`
   - **Resource Group:** `predictive-maintenance-rg` (or create new)
   - **Name:** `compass-demo`
   - **Plan type:** Free (or Standard for custom domains later)
   - **Region:** UK South
4. **Deployment details:**
   - **Source:** GitHub
   - Click **Sign in with GitHub** → authorise
   - **Organization:** `Anjin-san-ai`
   - **Repository:** `predictivemaintenance_endtoend`
   - **Branch:** `main`
5. **Build details:**
   - **Build preset:** Next.js
   - **App location:** `COMPASS-Demo`
   - **Api location:** *(leave blank)*
   - **Output location:** `.next`
6. Click **Review + create** → **Create**
7. Wait ~2 minutes — Azure will:
   - Create the Static Web App
   - Automatically add `AZURE_STATIC_WEB_APPS_API_TOKEN` to your GitHub repo secrets
   - Trigger the first deployment via the workflow

### 2B. Add Environment Variables to COMPASS

1. In Azure Portal, open the Static Web App you just created
2. Go to **Settings → Environment variables**
3. Click **+ Add** for each:

| Name | Value |
|---|---|
| `A400_API_URL` | `https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net` |
| `AZURE_OPENAI_ENDPOINT` | *(same value as in a400-webapp — check App Service config)* |
| `AZURE_OPENAI_KEY` | *(same value as in a400-webapp — check App Service config)* |
| `AZURE_OPENAI_DEPLOYMENT` | *(same value as in a400-webapp — check App Service config)* |

4. Click **Save**

### 2C. Add A400_API_URL as GitHub Secret

The build workflow needs this at build time:

1. Go to https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/settings/secrets/actions
2. Click **New repository secret**
3. Name: `A400_API_URL`
4. Value: `https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net`
5. Click **Add secret**

### 2D. Trigger Deployment (if not auto-started)

1. Go to https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/actions
2. Click **Deploy COMPASS to Azure Static Web Apps**
3. Click **Run workflow** → **Run workflow**
4. Wait ~3-4 minutes
5. Your COMPASS site will be live at the URL shown in the Static Web App overview

---

## After Deployment

### Your live URLs will be:

```
COMPASS (all pages):  https://compass-demo-<random>.azurestaticapps.net
├── /                      Smart Scheduling
├── /parts-and-equipment   Parts Repository
└── /chatbot               AI Assistant

Fleet Monitor:         https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net
```

### Update hardcoded localhost URLs (optional)

The apps currently have some `localhost:3001` links in the UI (chatbot sidebar quick links, A400 nav bar). You can update them to use environment variables or the actual deployed URLs.

**Quick fix — update A400 nav bar to production URLs:**

In `a400-webapp/public/index.html`, change the nav bar links from `http://localhost:3001` to your deployed COMPASS URL once you have it.

---

## Troubleshooting

**If COMPASS chatbot shows "Fleet Monitor offline":**
- Check that `A400_API_URL` environment variable in COMPASS Static Web App points to the correct a400 URL
- Check CORS in `a400-webapp/server.js` — add your COMPASS Static Web App URL to `ALLOWED_ORIGINS`

**If a400-webapp won't start:**
- Check Application Logs in App Service → Log stream
- Ensure `AZURE_OPENAI_*` environment variables are set

**To view Azure OpenAI credentials from a400-webapp:**
```bash
az webapp config appsettings list --name a400-webapp --resource-group A400 --query "[?name=='AZURE_OPENAI_ENDPOINT' || name=='AZURE_OPENAI_KEY' || name=='AZURE_OPENAI_DEPLOYMENT'].{name:name, value:value}"
```

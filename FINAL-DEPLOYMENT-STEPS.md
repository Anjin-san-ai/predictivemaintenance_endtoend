# Final Deployment Steps — Copy/Paste Ready

## Status Right Now

✅ **a400-webapp** — deployed and working at https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net  
⚠️ **COMPASS** — Static Web App created but showing 404 (needs GitHub secret + redeploy)

---

## ONE REMAINING STEP: Add GitHub Secret

### Go to GitHub Secrets Page

**Link:** https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/settings/secrets/actions

### Click "New repository secret" and add:

**Secret 1:**
- **Name:** `A400_API_URL`
- **Value:** `https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net`

Click **Add secret**.

---

## Trigger Redeployment

### Go to GitHub Actions

**Link:** https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/actions

### Run the workflow:

1. Click **Azure Static Web Apps CI/CD** (in the left sidebar)
2. Click **Run workflow** (button on the right)
3. Keep branch as `main`
4. Click the green **Run workflow** button
5. Wait 3-4 minutes — refresh the page to see progress

---

## When Deployment Completes

Visit: **https://mango-mushroom-033be7b03.6.azurestaticapps.net**

You should see the COMPASS landing page with:
- Fleet Overview cards
- Smart Scheduling Gantt timeline
- Working navigation to Repository and AI Assistant

---

## If You Still See a Blank Page

### Check the workflow run logs:

1. Go to https://github.com/Anjin-san-ai/predictivemaintenance_endtoend/actions
2. Click the most recent **Azure Static Web Apps CI/CD** run
3. Click **Build and Deploy Job**
4. Look for errors in the build output
5. Share the error message with me and I'll fix it

---

## Optional: Add Azure OpenAI to COMPASS Environment

If you want the AI Assistant to work with live Azure OpenAI (not just the PDF manual):

### Get the credentials from a400-webapp:

Run in terminal:
```bash
az webapp config appsettings list --name a400-webapp --resource-group A400 --query "[?contains(name, 'AZURE_OPENAI')].{name:name, value:value}" -o table
```

### Add them to COMPASS Static Web App:

1. Azure Portal → your **compass-demo** Static Web App
2. **Settings → Environment variables**
3. Click **+ Add** for each:
   - `AZURE_OPENAI_ENDPOINT` = (value from above)
   - `AZURE_OPENAI_KEY` = (value from above)
   - `AZURE_OPENAI_DEPLOYMENT` = (value from above)
4. Click **Save**
5. Wait ~2 minutes for the app to restart

The chatbot will now use Azure OpenAI for all responses instead of just the manual.

---

## Quick Verification Checklist

Once deployed, test these URLs:

- ✅ Main landing: https://mango-mushroom-033be7b03.6.azurestaticapps.net
- ✅ Parts page: https://mango-mushroom-033be7b03.6.azurestaticapps.net/parts-and-equipment
- ✅ AI Assistant: https://mango-mushroom-033be7b03.6.azurestaticapps.net/chatbot
- ✅ Fleet Monitor: https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net

All four should load without errors.

#!/bin/bash
# Helper script to add GitHub secrets for deployment
# Requires: GitHub CLI (gh) or manual addition via web UI

REPO="Anjin-san-ai/predictivemaintenance_endtoend"
A400_URL="https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net"
PUBLISH_PROFILE_FILE="/tmp/a400-publish-profile.xml"

echo "════════════════════════════════════════════════════════════"
echo "GitHub Secrets Setup for Predictive Maintenance Platform"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI found — adding secrets automatically..."
    echo ""
    
    # Add A400_API_URL
    echo "$A400_URL" | gh secret set A400_API_URL -R "$REPO"
    echo "✓ Added A400_API_URL"
    
    # Add publish profile
    if [ -f "$PUBLISH_PROFILE_FILE" ]; then
        gh secret set AZUREAPPSERVICE_PUBLISHPROFILE_A400 -R "$REPO" < "$PUBLISH_PROFILE_FILE"
        echo "✓ Added AZUREAPPSERVICE_PUBLISHPROFILE_A400"
    else
        echo "⚠ Publish profile not found at $PUBLISH_PROFILE_FILE"
        echo "  Run: az webapp deployment list-publishing-profiles --name a400-webapp --resource-group A400 --xml > /tmp/a400-publish-profile.xml"
    fi
    
    echo ""
    echo "✅ All secrets added successfully!"
    
else
    echo "⚠ GitHub CLI not found — you'll need to add secrets manually."
    echo ""
    echo "Go to: https://github.com/$REPO/settings/secrets/actions"
    echo ""
    echo "Add these secrets:"
    echo ""
    echo "1. Secret name: A400_API_URL"
    echo "   Value: $A400_URL"
    echo ""
    echo "2. Secret name: AZUREAPPSERVICE_PUBLISHPROFILE_A400"
    echo "   Value: (paste entire contents of /tmp/a400-publish-profile.xml)"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Next step: Trigger deployment"
echo "════════════════════════════════════════════════════════════"
echo "Go to: https://github.com/$REPO/actions"
echo "Click 'Azure Static Web Apps CI/CD' → Run workflow"
echo ""

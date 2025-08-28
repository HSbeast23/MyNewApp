# Remove Sensitive Firebase Files from Git Repository

# This script helps remove sensitive Firebase configuration files from your Git repository
# without deleting them from your local machine.

# Step 1: Remove google-services.json from Git tracking (but keep it locally)
Write-Host "Removing google-services.json from Git tracking..."
git rm --cached google-services.json

# Step 2: Remove serviceAccountKey.json from Git tracking (but keep it locally)
Write-Host "Removing functions/serviceAccountKey.json from Git tracking..."
git rm --cached functions/serviceAccountKey.json

# Step 3: Commit this change
Write-Host "Committing changes..."
git commit -m "Remove sensitive Firebase configuration files"

# Step 4: Push the change to GitHub
Write-Host "Pushing changes to GitHub..."
git push origin master

Write-Host ""
Write-Host "Done! Sensitive files are now removed from Git tracking."
Write-Host "They still exist on your local machine but won't be pushed to GitHub."
Write-Host ""
Write-Host "Make sure your .gitignore contains these entries:"
Write-Host "google-services.json"
Write-Host "functions/serviceAccountKey.json"
Write-Host ""

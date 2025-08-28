# Check for sensitive files before committing to Git
Write-Host "🔍 Checking for sensitive files that should not be committed..." -ForegroundColor Cyan

$sensitiveFiles = @(
    "google-services.json",
    "GoogleService-Info.plist",
    "serviceAccountKey.json",
    "firebase-credentials.json",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    "*.jks",
    "*.keystore"
)

$foundSensitiveFiles = $false

foreach ($pattern in $sensitiveFiles) {
    $files = Get-ChildItem -Path . -Recurse -Filter $pattern -ErrorAction SilentlyContinue
    if ($files.Count -gt 0) {
        Write-Host "⚠️ WARNING: Found sensitive file pattern: $pattern" -ForegroundColor Red
        foreach ($file in $files) {
            Write-Host "   - $($file.FullName)" -ForegroundColor Red
            $foundSensitiveFiles = $true
        }
    }
}

if ($foundSensitiveFiles) {
    Write-Host "`n❌ SECURITY RISK: Sensitive files were found that should not be committed to Git." -ForegroundColor Red
    Write-Host "   Please move or delete these files before committing, or update your .gitignore file." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✅ No sensitive files found! Your repository is ready for GitHub." -ForegroundColor Green
    
    Write-Host "`n📝 Next steps to commit and push your code:" -ForegroundColor Yellow
    Write-Host "   1. Stage your changes:   git add ." -ForegroundColor Yellow
    Write-Host "   2. Commit your changes:  git commit -m 'Your commit message'" -ForegroundColor Yellow
    Write-Host "   3. Push to GitHub:       git push origin master" -ForegroundColor Yellow
    
    Write-Host "`n🔐 Remember: Never commit sensitive files like google-services.json or API keys to Git!" -ForegroundColor Magenta
}

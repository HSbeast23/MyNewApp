# How to Handle Sensitive Firebase Files in Git

This guide explains how to properly handle sensitive Firebase configuration files like `google-services.json` and `serviceAccountKey.json` when working with Git and GitHub.

## 1. Remove Sensitive Files from GitHub

If you've already pushed sensitive files to GitHub, follow these steps:

```bash
# 1. Remove the file from Git tracking (but keep it locally)
git rm --cached google-services.json
git rm --cached functions/serviceAccountKey.json

# 2. Commit this change
git commit -m "Remove sensitive Firebase configuration files"

# 3. Push the change to GitHub
git push origin master
```

## 2. Create Example Templates

Create example template files with dummy data:

```bash
# For google-services.json
cp google-services.json google-services.example.json
# Then edit google-services.example.json to remove sensitive data

# For serviceAccountKey.json
cp functions/serviceAccountKey.json functions/serviceAccountKey.example.json
# Then edit serviceAccountKey.example.json to remove sensitive data
```

## 3. Update .gitignore

Ensure your `.gitignore` file contains these entries:

```
# Firebase configuration files
google-services.json
functions/serviceAccountKey.json

# Keep example files
!google-services.example.json
!functions/serviceAccountKey.example.json
```

## 4. Add Instructions to README

Add a section to your README.md explaining how to set up Firebase:

```markdown
## Firebase Setup

This app requires Firebase configuration. Follow these steps:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Add an Android app with package name `com.haarhish.MyNewApp`
3. Download the `google-services.json` file and place it in the project root
4. For Firebase Functions:
   - Generate a service account key from Firebase Console → Project Settings → Service Accounts
   - Save the key as `functions/serviceAccountKey.json`

Example templates are provided as `google-services.example.json` and `functions/serviceAccountKey.example.json`.
```

## 5. Documentation for New Contributors

Create a CONTRIBUTING.md file explaining the process for handling sensitive files:

```markdown
# Contributing Guidelines

## Handling Sensitive Files

This project uses Firebase, which requires configuration files containing sensitive information.
These files are not included in the repository for security reasons.

Required files that you need to create locally:

1. `google-services.json` - Firebase Android configuration
2. `functions/serviceAccountKey.json` - Firebase Admin SDK credentials

Example templates are provided to show the format without exposing sensitive data.
```

## 6. Security Best Practices

- **Never** commit actual Firebase configuration files
- Rotate any keys that were accidentally exposed on GitHub
- Consider using environment variables for CI/CD pipelines
- For team members, share the configuration files securely (not via Git)

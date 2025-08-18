# GitHub Actions Workflows

This directory contains automated workflows for the 25for25 JetBlue Route Optimizer application.

## Workflows

### 1. CI (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- **Lint and Test**: Runs on Node.js 18.x and 20.x
  - Code linting with ESLint
  - TypeScript type checking
  - Production build testing
  - Unit tests (if available)
- **Security Audit**: 
  - npm audit for dependency vulnerabilities
  - Blocks on high-severity issues
- **Deploy Preview**: 
  - Validates build with preview environment variables
  - Comments on PR with build status

### 2. Vercel Preview Environment Variables Test (`vercel-preview.yml`)
**Triggers:** Pull Requests to main

**Purpose:** Ensures environment variable security before Vercel deployments

**Checks:**
- ❌ No `NEXT_PUBLIC_` prefixed API keys (prevents client-side exposure)
- ✅ Proper server-side environment variable usage
- ✅ Build works with test environment variables
- ✅ No sensitive data in build output
- 💬 Comments on PR with security status

### 3. Release Validation (`release.yml`)
**Triggers:** Git tags (v*), GitHub releases

**Purpose:** Final validation before production deployment

**Validation Suite:**
- Complete linting and type checking
- Security audit
- Production build test
- Security documentation validation
- Release summary generation

## Environment Variables for CI

The workflows expect these GitHub Secrets to be configured:

### Required for Full Testing
```
GOOGLE_MAPS_API_KEY       # Google Maps API key
SCHEDULE_API_KEY          # JetBlue schedule API key  
AMADEUS_API_KEY          # Amadeus flight API key
AMADEUS_API_SECRET       # Amadeus flight API secret
```

### Optional
```
NEXT_PUBLIC_GA_MEASUREMENT_ID  # Google Analytics ID
```

**Note:** If secrets are not configured, workflows will use dummy values for build testing. This ensures the build process works even without real API keys.

## Security Features

1. **API Key Protection**: Automatically detects and prevents client-side API key exposure
2. **Build Output Scanning**: Checks that no sensitive data leaks into the build
3. **Environment Variable Validation**: Ensures proper server-side patterns are used
4. **Security Documentation**: Validates that security docs are up to date

## Setting Up Vercel Integration

To enable full preview deployment testing:

1. Configure the same environment variables in your Vercel project
2. Enable Vercel's GitHub integration for automatic preview deployments
3. The workflows will validate that builds work correctly before deployment

## Troubleshooting

### Build Failures
- Check that all required environment variables are set (even as dummies for testing)
- Ensure no `NEXT_PUBLIC_` prefixed sensitive variables exist in the code
- Review linting and TypeScript errors in the workflow logs

### Security Check Failures
- Remove any `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or similar patterns
- Use `process.env.GOOGLE_MAPS_API_KEY` for server-side access only
- Update SECURITY.md if it's missing required topics

### Preview Deployment Issues
- Verify Vercel environment variables are correctly configured
- Check that the build succeeds with your actual API keys
- Ensure domain restrictions are set for Google Maps API
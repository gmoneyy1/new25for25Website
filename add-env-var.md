# Fix Vercel Environment Variable

## Option 1: Vercel Dashboard
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Delete the existing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY variable
3. Add it again with these settings:
   - Name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
   - Environment: ✅ Production ✅ Preview ✅ Development
4. **Important**: Click "Redeploy" after adding

## Option 2: Vercel CLI (if installed)
```bash
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
# Paste your API key when prompted
vercel --prod
```

## Option 3: Environment Variable in Project Root
Create `.env.production` file (temporary test):
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

The issue is that the environment variable exists in Vercel but isn't being deployed to the running application.
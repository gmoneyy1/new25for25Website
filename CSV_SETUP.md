# CSV Data Source Configuration

This guide shows you how to make your CSV file retrievable for the JetBlue Route Optimizer.

## Option 1: Local API Route (Recommended for Development)

The app is already configured to use a local API route. Just place your CSV file in the `data` folder:

1. **Place your CSV file** in `new25for25Website/data/jetblue-schedule.csv`
2. **The app will automatically** use `/api/schedule` to serve the file
3. **No additional configuration needed**

## Option 2: Environment Variable (Recommended for Production)

Create a `.env.local` file in your project root:

```bash
# Use a hosted CSV file
NEXT_PUBLIC_CSV_URL=https://your-domain.com/jetblue-schedule.csv
```

## Option 3: Host Your CSV File Online

### GitHub Pages (Free)
1. Create a GitHub repository
2. Upload your CSV file
3. Enable GitHub Pages in repository settings
4. Use URL: `https://yourusername.github.io/repository-name/jetblue-schedule.csv`

### Netlify/Vercel (Free)
1. Create a new project
2. Upload CSV to `public` folder
3. Deploy
4. Use URL: `https://your-site.netlify.app/jetblue-schedule.csv`

### AWS S3 (Low cost)
1. Create S3 bucket
2. Upload CSV file
3. Make it publicly accessible
4. Use URL: `https://your-bucket.s3.amazonaws.com/jetblue-schedule.csv`

### Google Drive
1. Upload CSV to Google Drive
2. Right-click → Share → Copy link
3. Replace `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
4. With: `https://drive.google.com/uc?export=download&id=FILE_ID`

## Option 4: Direct URL in Code

Edit `src/app/page.tsx` and replace the URL:

```javascript
const csvUrl = 'https://your-actual-csv-url.com/jetblue-schedule.csv';
```

## CSV File Format

Your CSV should have these columns:
- Flight Number
- Origin
- Destination
- Departure Datetime
- Arrival Datetime
- Equipment
- Distance (KM)
- Elapsed Minutes

## Testing

1. Start your development server: `npm run dev`
2. Click "Load JetBlue Schedule Data"
3. The app should fetch and display your CSV data

## Troubleshooting

- **CORS errors**: Make sure your CSV host allows cross-origin requests
- **404 errors**: Check that your CSV URL is correct and accessible
- **Parsing errors**: Ensure your CSV format matches the expected structure 
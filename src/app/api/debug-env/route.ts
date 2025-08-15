import { NextResponse } from 'next/server';

/**
 * GET /api/debug-env
 * Debug endpoint to check environment variables (REMOVE IN PRODUCTION)
 */
export async function GET() {
  // Get all environment variables that start with common prefixes
  const allEnvVars = Object.keys(process.env);
  const relevantVars = allEnvVars.filter(key => 
    key.includes('GOOGLE') || 
    key.includes('MAPS') || 
    key.startsWith('NEXT_PUBLIC_') ||
    key.startsWith('REACT_APP_') ||
    key.includes('VERCEL')
  );

  const envVarDetails: { [key: string]: string } = {};
  relevantVars.forEach(key => {
    const value = process.env[key];
    envVarDetails[key] = value ? (value.length > 10 ? `${value.substring(0, 10)}...` : value) : 'NOT SET';
  });

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    
    // Target environment variables
    targetVars: {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      GOOGLE_MAPS_API: process.env.GOOGLE_MAPS_API ? 'SET' : 'NOT SET',
    },

    // All relevant environment variables found
    allRelevantVars: envVarDetails,
    
    // Count of total environment variables
    totalEnvVars: allEnvVars.length,
    
    // Build information
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  });
}
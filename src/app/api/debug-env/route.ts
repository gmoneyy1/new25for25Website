import { NextResponse } from 'next/server';

/**
 * GET /api/debug-env
 * Debug endpoint to check environment variables (REMOVE IN PRODUCTION)
 */
export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    environmentVars: {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      GOOGLE_MAPS_API: process.env.GOOGLE_MAPS_API ? 'SET' : 'NOT SET',
    },
    // Show first 10 chars if any exist for debugging
    keyPreviews: {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'N/A',
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'N/A',
    }
  });
}
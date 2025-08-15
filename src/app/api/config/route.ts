import { NextResponse } from 'next/server';

/**
 * GET /api/config
 * Provides client configuration including Google Maps API key
 */
export async function GET() {
  try {
    // Try multiple environment variable names
    const googleMapsApiKey = 
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
      process.env.GOOGLE_MAPS_API_KEY || 
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API;

    // Enhanced debugging for server environment
    console.log('🔍 Server environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'NOT FOUND',
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? `${process.env.GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'NOT FOUND',
      REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'NOT FOUND',
      GOOGLE_MAPS_API: process.env.GOOGLE_MAPS_API ? `${process.env.GOOGLE_MAPS_API.substring(0, 10)}...` : 'NOT FOUND',
      finalKey: googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'NOT FOUND'
    });
    
    if (!googleMapsApiKey || googleMapsApiKey === 'YOUR_API_KEY_HERE') {
      console.error('❌ Google Maps API key not found in any environment variable');
      return NextResponse.json(
        { 
          error: 'Google Maps API key not configured in environment variables',
          hasKey: false,
          debug: {
            checkedVars: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_API_KEY', 'REACT_APP_GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_API'],
            environment: process.env.NODE_ENV,
            isVercel: !!process.env.VERCEL
          }
        },
        { status: 500 }
      );
    }

    console.log('✅ Google Maps API key found successfully');
    return NextResponse.json({
      googleMapsApiKey,
      hasKey: true,
      keyLength: googleMapsApiKey.length,
      keyPrefix: `${googleMapsApiKey.substring(0, 10)}...`
    });

  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load configuration',
        hasKey: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
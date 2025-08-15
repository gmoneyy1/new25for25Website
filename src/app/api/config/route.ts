import { NextResponse } from 'next/server';

/**
 * GET /api/config
 * Provides client configuration including Google Maps API key
 */
export async function GET() {
  try {
    // Get API key from server environment
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey || googleMapsApiKey === 'YOUR_API_KEY_HERE') {
      console.error('❌ Google Maps API key not found in environment variables');
      return NextResponse.json(
        { 
          error: 'Google Maps API key not configured',
          hasKey: false 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      googleMapsApiKey,
      hasKey: true
    });

  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load configuration',
        hasKey: false 
      },
      { status: 500 }
    );
  }
}
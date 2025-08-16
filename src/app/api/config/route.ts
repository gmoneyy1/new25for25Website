import { NextResponse } from 'next/server';

/**
 * GET /api/config
 * Provides basic client configuration - NO sensitive data exposed
 * SECURITY: This endpoint should never expose API keys or sensitive configuration
 */
export async function GET() {
  try {
    // Return only non-sensitive configuration data
    return NextResponse.json({
      status: 'healthy',
      features: {
        mapsProxy: true,
        optimization: true,
        caching: true
      },
      message: 'Configuration endpoint is available'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load configuration',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
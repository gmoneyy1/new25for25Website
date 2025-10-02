import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS, SECURITY_HEADERS, isValidOrigin, isSuspiciousUserAgent, getRateLimitKey, validateApiKey } from '../../../../lib/security';

// Simple in-memory rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * GET /api/maps-proxy/script
 * Secure endpoint that serves the Google Maps JavaScript API script
 * This keeps the API key completely server-side
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP = getRateLimitKey(request);
    const now = Date.now();
    const rateLimit = RATE_LIMITS.MAPS_PROXY;
    
    if (requestCounts.has(clientIP)) {
      const record = requestCounts.get(clientIP)!;
      if (now < record.resetTime) {
        if (record.count >= rateLimit.max) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        record.count++;
      } else {
        requestCounts.set(clientIP, { count: 1, resetTime: now + rateLimit.window });
      }
    } else {
      requestCounts.set(clientIP, { count: 1, resetTime: now + rateLimit.window });
    }

    // Security: Check if request is from same origin
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent');
    
    // Validate origin using centralized security utilities
    if (!isValidOrigin(origin, request.nextUrl.origin)) {
      console.warn(`Unauthorized maps script access attempt from: ${origin} (IP: ${clientIP})`);
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Check for suspicious user agents
    if (isSuspiciousUserAgent(userAgent)) {
      console.warn(`Suspicious user agent detected: ${userAgent} (IP: ${clientIP})`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get the Google Maps API key from server environment
    const googleMapsApiKey = 
      process.env.GOOGLE_MAPS_API_KEY || 
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || // Legacy support for local development
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API;

    if (!validateApiKey(googleMapsApiKey, 'Google Maps API')) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured on server' },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const libraries = searchParams.get('libraries') || 'geometry';
    const loading = searchParams.get('loading') || 'async';
    const callback = searchParams.get('callback') || 'initGoogleMaps';

    // Fetch the Google Maps script from Google's servers
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=${libraries}&loading=${loading}&callback=${callback}`;
    
    try {
      const response = await fetch(googleMapsUrl);
      
      if (!response.ok) {
        throw new Error(`Google Maps API request failed: ${response.status}`);
      }

      const scriptContent = await response.text();

      // Return the script content with proper headers
      return new NextResponse(scriptContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          ...SECURITY_HEADERS,
          'X-RateLimit-Limit': rateLimit.max.toString(),
          'X-RateLimit-Remaining': (rateLimit.max - (requestCounts.get(clientIP)?.count || 0)).toString(),
          'X-RateLimit-Reset': (requestCounts.get(clientIP)?.resetTime || 0).toString()
        }
      });

    } catch (error) {
      console.error('Error fetching Google Maps script:', error);
      return NextResponse.json(
        { error: 'Failed to load Google Maps script' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Maps script proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process maps script request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

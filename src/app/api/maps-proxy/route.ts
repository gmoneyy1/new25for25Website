import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS, SECURITY_HEADERS, isValidOrigin, isSuspiciousUserAgent, getRateLimitKey, validateApiKey } from '../../../lib/security';

// Simple in-memory rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * POST /api/maps-proxy
 * Secure proxy for Google Maps API requests - keeps API key server-side
 */
export async function POST(request: NextRequest) {
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
      console.warn(`Unauthorized maps proxy access attempt from: ${origin} (IP: ${clientIP})`);
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
    // Support both new (secure) and old (legacy) environment variable names
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

    // Parse the request body to get the map request details
    const body = await request.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    // Handle different map actions
    switch (action) {
      case 'loadScript':
        // Return a secure script URL that the client can load
        return NextResponse.json({
          scriptUrl: `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry&loading=async`,
          hasKey: true
        }, {
          headers: {
            ...SECURITY_HEADERS,
            'X-RateLimit-Limit': rateLimit.max.toString(),
            'X-RateLimit-Remaining': (rateLimit.max - (requestCounts.get(clientIP)?.count || 0)).toString(),
            'X-RateLimit-Reset': (requestCounts.get(clientIP)?.resetTime || 0).toString()
          }
        });

      case 'geocode':
        // Proxy geocoding requests
        if (!params || !params.address) {
          return NextResponse.json(
            { error: 'Address parameter required for geocoding' },
            { status: 400 }
          );
        }
        
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.address)}&key=${googleMapsApiKey}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();
        
        return NextResponse.json(geocodeData, {
          headers: {
            ...SECURITY_HEADERS,
            'X-RateLimit-Limit': rateLimit.max.toString(),
            'X-RateLimit-Remaining': (rateLimit.max - (requestCounts.get(clientIP)?.count || 0)).toString(),
            'X-RateLimit-Reset': (requestCounts.get(clientIP)?.resetTime || 0).toString()
          }
        });

      case 'directions':
        // Proxy directions requests
        if (!params || !params.origin || !params.destination) {
          return NextResponse.json(
            { error: 'Origin and destination parameters required for directions' },
            { status: 400 }
          );
        }
        
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(params.origin)}&destination=${encodeURIComponent(params.destination)}&key=${googleMapsApiKey}`;
        const directionsResponse = await fetch(directionsUrl);
        const directionsData = await directionsResponse.json();
        
        return NextResponse.json(directionsData, {
          headers: {
            ...SECURITY_HEADERS,
            'X-RateLimit-Limit': rateLimit.max.toString(),
            'X-RateLimit-Remaining': (rateLimit.max - (requestCounts.get(clientIP)?.count || 0)).toString(),
            'X-RateLimit-Reset': (requestCounts.get(clientIP)?.resetTime || 0).toString()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Maps proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process maps request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/maps-proxy
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Maps proxy endpoint is available',
    hasApiKey: !!(process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API)
  }, {
    headers: SECURITY_HEADERS
  });
}

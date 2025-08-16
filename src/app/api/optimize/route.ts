import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCsvText, validateFlightData } from '../../../lib/server/csvParser';
import { optimizeRoute } from '../../../lib/server/optimizationEngine';
import { RouteConfig } from '../../../lib/types';
import { RATE_LIMITS, SECURITY_HEADERS, isValidOrigin, isSuspiciousUserAgent, getRateLimitKey } from '../../../lib/security';

// Simple in-memory rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * POST /api/optimize
 * Optimize flight route based on provided configuration with security controls
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Rate limiting by IP
    const clientIP = getRateLimitKey(request);
    const now = Date.now();
    const rateLimit = RATE_LIMITS.OPTIMIZE_API;
    
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

    // Security: Validate origin
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent');
    
    if (!isValidOrigin(origin, request.nextUrl.origin)) {
      console.warn(`Unauthorized optimize access attempt from: ${origin} (IP: ${clientIP})`);
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    if (isSuspiciousUserAgent(userAgent)) {
      console.warn(`Suspicious user agent detected: ${userAgent} (IP: ${clientIP})`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { config }: { config: RouteConfig } = body;

    // Validate request
    if (!config) {
      return NextResponse.json(
        { error: 'Route configuration is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'startDate', 'startTime', 'endDate', 'endTime',
      'startAirports', 'endAirports', 'visitedAirports', 'minConnectionTime'
    ];

    const missingFields = requiredFields.filter(field => !config[field as keyof RouteConfig]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Load and parse CSV data
    const csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule.csv');
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV into flight objects
    const flights = parseCsvText(csvData);
    
    if (!validateFlightData(flights)) {
      return NextResponse.json(
        { error: 'Invalid flight data format' },
        { status: 500 }
      );
    }

    // Perform optimization
    const result = await optimizeRoute(flights, config);

    // Return results with secure headers
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': origin === request.nextUrl.origin ? '*' : (origin || ''),
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...SECURITY_HEADERS,
        'X-RateLimit-Limit': rateLimit.max.toString(),
        'X-RateLimit-Remaining': (rateLimit.max - (requestCounts.get(clientIP)?.count || 0)).toString(),
        'X-RateLimit-Reset': (requestCounts.get(clientIP)?.resetTime || 0).toString()
      },
    });

  } catch (error) {
    console.error('Optimization API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error during optimization' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/optimize
 * Handle CORS preflight requests with security controls
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Validate origin for preflight requests
  if (!isValidOrigin(origin, request.nextUrl.origin)) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        ...SECURITY_HEADERS
      }
    });
  }
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin === request.nextUrl.origin ? '*' : (origin || ''),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...SECURITY_HEADERS
    },
  });
} 
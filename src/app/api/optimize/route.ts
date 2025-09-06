import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCsvText, validateFlightData } from '../../../lib/server/csvParser';
import { optimizeRoute, optimizeRouteForCost } from '../../../lib/server/optimizationEngine';
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
      'startAirports', 'endAirports', 'minConnectionTime'
    ];

    const missingFields = requiredFields.filter(field => !config[field as keyof RouteConfig]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate visitedAirports separately (can be empty string)
    if (config.visitedAirports === undefined) {
      return NextResponse.json(
        { error: 'visitedAirports field is required' },
        { status: 400 }
      );
    }

    // Load and parse CSV data based on date range
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const septemberStart = new Date('2025-09-01T00:00:00');
    const septemberEnd = new Date('2025-09-30T23:59:59');
    
    // Determine which dataset to use
    // Use September data if either start or end date falls within September 1-30
    const useSeptemberData = (startDate >= septemberStart && startDate <= septemberEnd) ||
                            (endDate >= septemberStart && endDate <= septemberEnd);
    
    console.log('🔍 Date range analysis:', {
      startDate: config.startDate,
      endDate: config.endDate,
      useSeptemberData,
      septemberStart: septemberStart.toISOString(),
      septemberEnd: septemberEnd.toISOString()
    });
    
    let csvPath: string;
    if (useSeptemberData) {
      csvPath = path.join(process.cwd(), 'september_data.csv');
      console.log('📅 Using September dataset (Sept 1-30, 2025) with distances');
      console.log('📁 CSV path:', csvPath);
      console.log('📁 Current working directory:', process.cwd());
    } else {
      csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule.csv');
      console.log('📅 Using August dataset (Aug 1 - Dec 31, 2025)');
      console.log('📁 CSV path:', csvPath);
    }
    
    // Check if file exists
    try {
      await fs.access(csvPath);
      console.log('✅ CSV file exists and is accessible');
    } catch (error) {
      console.error('❌ CSV file not accessible:', error);
      return NextResponse.json(
        { error: `CSV file not accessible: ${csvPath}` },
        { status: 500 }
      );
    }
    
    const csvData = await fs.readFile(csvPath, 'utf-8');
    console.log('📊 CSV data loaded, length:', csvData.length);
    
    // Parse CSV into flight objects
    console.log('🔍 Starting CSV parsing...');
    const flights = parseCsvText(csvData);
    console.log('✅ CSV parsing complete, flights count:', flights.length);
    
    if (!validateFlightData(flights)) {
      console.error('❌ Flight data validation failed');
      return NextResponse.json(
        { error: 'Invalid flight data format' },
        { status: 500 }
      );
    }

    // Perform optimization
    let result;
    
    if (config.optimizeForCost && config.targetAirportCount) {
      console.log(`💰 Cost optimization mode: targeting ${config.targetAirportCount} airports`);
      result = await optimizeRouteForCost(flights, config);
    } else {
      console.log('✈️ Standard optimization mode: maximizing airports');
      result = await optimizeRoute(flights, config);
    }

    // Add dataset information to the result
    if ('path' in result) {
      result.datasetUsed = useSeptemberData ? 'september' : 'august';
      result.hasPricing = useSeptemberData;
      result.optimizationMode = config.optimizeForCost ? 'cost' : 'airports';
    }

    // Return results with secure headers
    const corsOrigin = origin && isValidOrigin(origin, request.nextUrl.origin) ? origin : request.nextUrl.origin;
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
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
  
  const corsOrigin = origin && isValidOrigin(origin, request.nextUrl.origin) ? origin : request.nextUrl.origin;
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      ...SECURITY_HEADERS
    },
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { RATE_LIMITS, ALLOWED_ORIGINS, BLOCKED_USER_AGENTS, SECURITY_HEADERS, isValidOrigin, isSuspiciousUserAgent, getRateLimitKey } from '../../../lib/security';

// Simple in-memory rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * GET /api/schedule
 * Serves the JetBlue flight schedule CSV data with enhanced security
 */
export async function GET(request: NextRequest) {
  try {
    // Enhanced security: Check request origin and referer
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent');
    
    // Rate limiting by IP
    const clientIP = getRateLimitKey(request);
    const now = Date.now();
    const rateLimit = RATE_LIMITS.SCHEDULE_API;
    
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
    
    // Validate origin using centralized security utilities
    if (!isValidOrigin(origin, request.nextUrl.origin)) {
      console.warn(`Unauthorized schedule access attempt from: ${origin} (IP: ${clientIP})`);
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Check for suspicious user agents using centralized security utilities
    if (isSuspiciousUserAgent(userAgent)) {
      console.warn(`Suspicious user agent detected: ${userAgent} (IP: ${clientIP})`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Path to the CSV file in the data directory
    const csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule.csv');
    
    // Read the CSV file
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    // Return the CSV data with enhanced security headers
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'private, max-age=300', // Private cache, 5 minutes
        'Access-Control-Allow-Origin': origin === request.nextUrl.origin ? '*' : (origin || ''),
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...SECURITY_HEADERS,
        'X-RateLimit-Limit': rateLimit.max.toString(),
        'X-RateLimit-Remaining': (rateLimit.max - (requestCounts.get(clientIP)?.count || 0)).toString(),
        'X-RateLimit-Reset': (requestCounts.get(clientIP)?.resetTime || 0).toString()
      },
    });
  } catch (error) {
    console.error('Error reading CSV file:', error);
    
    return NextResponse.json(
      { error: 'Failed to load flight schedule data' },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/schedule
 * Check if the schedule endpoint is available
 */
export async function HEAD(request: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule062025.csv');
    await fs.access(csvPath);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 404 });
  }
} 
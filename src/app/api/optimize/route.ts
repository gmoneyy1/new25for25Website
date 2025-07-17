import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCsvText, validateFlightData } from '../../../lib/server/csvParser';
import { optimizeRoute } from '../../../lib/server/optimizationEngine';
import { RouteConfig } from '../../../lib/types';

/**
 * POST /api/optimize
 * Optimize flight route based on provided configuration
 */
export async function POST(request: NextRequest) {
  try {
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

    // Return results
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
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
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/schedule
 * Serves the JetBlue flight schedule CSV data
 */
export async function GET(request: NextRequest) {
  try {
    // Path to the CSV file in the data directory
    const csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule.csv');
    
    // Read the CSV file
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    // Return the CSV data with appropriate headers
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
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
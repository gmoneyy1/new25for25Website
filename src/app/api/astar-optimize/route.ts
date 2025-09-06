import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { pureAStarOptimize } from '@/lib/pureAStarOptimization';
import { parseCsvText, validateFlightData } from '@/lib/server/csvParser';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    console.log('🚀 A* API: Starting optimization with config:', {
      startDate: config.startDate,
      endDate: config.endDate,
      startAirports: config.startAirports,
      endAirports: config.endAirports,
      visitedAirports: config.visitedAirports,
      domesticOnly: config.domesticOnly
    });

    // Load and parse CSV data based on date range (same logic as other APIs)
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const septemberStart = new Date('2025-09-01T00:00:00');
    const septemberEnd = new Date('2025-09-30T23:59:59');
    
    // Determine which dataset to use
    const useSeptemberData = (startDate >= septemberStart && startDate <= septemberEnd) ||
                            (endDate >= septemberStart && endDate <= septemberEnd);
    
    let csvPath: string;
    if (useSeptemberData) {
      csvPath = path.join(process.cwd(), 'september_data.csv');
      console.log('📅 A* API: Using September dataset (Sept 1-30) with distances and pricing');
    } else {
      csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule.csv');
      console.log('📅 A* API: Using August dataset');
    }
    
    // Check if file exists and load CSV data
    try {
      await fs.access(csvPath);
    } catch (error) {
      console.error('❌ A* API: CSV file not accessible:', error);
      return NextResponse.json(
        { error: `Flight data not available: ${csvPath}` },
        { status: 500 }
      );
    }
    
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV into flight objects
    console.log('🔍 A* API: Starting CSV parsing...');
    const flights = parseCsvText(csvData);
    console.log('✅ A* API: CSV parsing complete, flights count:', flights.length);
    
    if (!validateFlightData(flights)) {
      console.error('❌ A* API: Flight data validation failed');
      return NextResponse.json(
        { error: 'Invalid flight data format' },
        { status: 500 }
      );
    }
    
    if (!flights || flights.length === 0) {
      console.error('❌ A* API: No flights parsed from CSV data');
      return NextResponse.json(
        { error: 'No flight data available' },
        { status: 500 }
      );
    }

    console.log(`📊 A* API: Loaded ${flights.length} flights`);

    // Run A* optimization
    const result = await pureAStarOptimize(flights, config);
    
    if ('error' in result) {
      console.error('❌ A* API: Optimization failed:', result.error);
      return NextResponse.json(result, { status: 400 });
    }

    console.log(`✅ A* API: Optimization completed in ${result.executionTime}ms`);
    console.log(`📊 A* API: Result: ${result.totalFlights} flights, ${result.newAirportsVisited.length} new airports`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ A* API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { hybridOptimizeRoute } from '@/lib/hybridOptimization';
import { parseCsvText, validateFlightData } from '@/lib/server/csvParser';
import { parseSeptemberDistancesCSV } from '@/lib/server/septemberDistancesParser';
import { RouteConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const config: RouteConfig = await request.json();
    
    // Validate required fields
    const requiredFields = ['startDate', 'startTime', 'endDate', 'endTime', 'startAirports', 'endAirports'];
    for (const field of requiredFields) {
      if (!config[field as keyof RouteConfig]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate visitedAirports separately (can be empty string)
    if (config.visitedAirports === undefined) {
      return NextResponse.json(
        { error: 'visitedAirports field is required' },
        { status: 400 }
      );
    }

    console.log('Hybrid optimization request:', config);

    // Load and parse CSV data based on date range (same logic as optimize API)
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const septemberStart = new Date('2025-09-01T00:00:00');
    const septemberEnd = new Date('2025-09-30T23:59:59');
    
    // Determine which dataset to use
    const octoberStart = new Date('2025-10-01T00:00:00');
    const octoberEnd = new Date('2025-11-30T23:59:59');
    
    const useSeptemberData = (startDate >= septemberStart && startDate <= septemberEnd) ||
                            (endDate >= septemberStart && endDate <= septemberEnd);
    const useOctNovData = (startDate >= octoberStart && startDate <= octoberEnd) ||
                         (endDate >= octoberStart && endDate <= octoberEnd);
    
    let csvPath: string;
    let datasetUsed: 'august' | 'sept-nov' | 'oct-nov';
    
    if (useSeptemberData || useOctNovData) {
      csvPath = path.join(process.cwd(), 'sept_octnov_combined_dist.csv');
      datasetUsed = 'sept-nov';
      console.log('📅 Using Combined September–November dataset with distances and pricing for hybrid optimization');
    } else {
      csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule.csv');
      datasetUsed = 'august';
      console.log('📅 Using August dataset for hybrid optimization');
    }
    
    // Check if file exists and load CSV data
    try {
      await fs.access(csvPath);
    } catch (error) {
      console.error('❌ CSV file not accessible:', error);
      return NextResponse.json(
        { error: `Flight data not available: ${csvPath}` },
        { status: 500 }
      );
    }
    
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV into flight objects
    console.log('🔍 Starting CSV parsing for hybrid optimization...');
    const flights = parseCsvText(csvData);
    console.log('✅ CSV parsing complete for hybrid optimization, flights count:', flights.length);
    
    if (!validateFlightData(flights)) {
      console.error('❌ Flight data validation failed');
      return NextResponse.json(
        { error: 'Invalid flight data format' },
        { status: 500 }
      );
    }
    
    if (!flights || flights.length === 0) {
      console.error('❌ No flights parsed from CSV data');
      return NextResponse.json(
        { error: 'No flight data available' },
        { status: 500 }
      );
    }

    console.log(`Loaded ${flights.length} flights for hybrid optimization`);

    // Run hybrid optimization
    const result = await hybridOptimizeRoute(flights, config);
    
    if ('error' in result) {
      console.error('Hybrid optimization error:', result.error);
      return NextResponse.json(result, { status: 400 });
    }

    console.log('Hybrid optimization completed successfully');
    console.log(`Standard route: ${result.hybridResults?.standardRoute.airportCount} airports, $${result.hybridResults?.standardRoute.cost}`);
    console.log(`Optimized route: ${result.hybridResults?.costOptimizedRoute.airportCount} airports, $${result.hybridResults?.costOptimizedRoute.cost}`);
    console.log(`Savings: $${result.hybridResults?.costOptimizedRoute.savings}`);

    // Add dataset information to the result
    if ('path' in result) {
      result.datasetUsed = datasetUsed;
      result.hasPricing = useSeptemberData || useOctNovData;
      result.optimizationMode = config.optimizeForCost ? 'cost' : 'airports';
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Hybrid optimization API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error during hybrid optimization' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Hybrid optimization endpoint. Use POST with RouteConfig to optimize routes.',
      description: 'Uses a two-phase approach: Modified Dijkstra\'s for route discovery, then BFS enumeration for cost optimization'
    },
    { status: 200 }
  );
}
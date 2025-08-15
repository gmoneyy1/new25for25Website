import { NextRequest, NextResponse } from 'next/server';
import { searchFlightPrices, getFlightPricing, getRoutePricing, generateMultiplePricingOptions } from '../../../lib/pricingService';

/**
 * GET /api/pricing
 * Get pricing for a specific flight route
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const flightNumber = searchParams.get('flightNumber');
    const compare = searchParams.get('compare') === 'true';

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    if (compare) {
      // Return multiple pricing options for comparison
      const mockFlight = {
        'Flight Number': flightNumber || 'B6' + Math.floor(Math.random() * 9999),
        Origin: origin,
        Destination: destination,
        'Departure Datetime': departureDate + 'T10:00:00',
        'Arrival Datetime': departureDate + 'T12:00:00',
      };
      
      const options = generateMultiplePricingOptions(mockFlight);
      
      return NextResponse.json({
        options,
        bestPrice: options[0],
        averagePrice: options.reduce((sum: number, opt: any) => sum + opt.price, 0) / options.length,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        },
      });
    }

    const pricing = await getFlightPricing(origin, destination, departureDate, flightNumber || undefined);

    if (!pricing) {
      return NextResponse.json(
        { error: 'No pricing found for this route' },
        { status: 404 }
      );
    }

    return NextResponse.json(pricing, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pricing/route
 * Get pricing for an entire route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flights } = body;

    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json(
        { error: 'Flights array is required' },
        { status: 400 }
      );
    }

    const pricingData = await getRoutePricing(flights);

    return NextResponse.json(pricingData, {
      headers: {
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error('Route pricing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route pricing' },
      { status: 500 }
    );
  }
} 
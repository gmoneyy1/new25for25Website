import { Flight, RouteConfig, Results, FlightPricing, PricingSearchRequest } from './types';

const SCHEDULE_URL = '/api/schedule';
const OPTIMIZE_URL = '/api/optimize';
const PRICING_URL = '/api/pricing';

/**
 * Check if flight schedule data is available (without fetching the actual data)
 * @returns Promise with boolean indicating availability
 */
export const checkFlightScheduleAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(SCHEDULE_URL, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking flight schedule availability:', error);
    return false;
  }
};

/**
 * Optimize route using backend API
 * @param config - Route configuration
 * @returns Promise with optimization results
 */
export const optimizeRoute = async (config: RouteConfig): Promise<Results> => {
  try {
    const response = await fetch(OPTIMIZE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error optimizing route:', error);
    return { error: `Failed to optimize route: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

/**
 * Get pricing for a specific flight route
 * @param origin - Origin airport code
 * @param destination - Destination airport code
 * @param departureDate - Departure date (YYYY-MM-DD)
 * @param flightNumber - Optional flight number
 * @returns Promise with flight pricing data
 */
export const getFlightPricing = async (
  origin: string,
  destination: string,
  departureDate: string,
  flightNumber?: string
): Promise<FlightPricing | null> => {
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      ...(flightNumber && { flightNumber }),
    });

    const response = await fetch(`${PRICING_URL}?${params}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No pricing found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pricing = await response.json();
    return pricing;
  } catch (error) {
    console.error('Error fetching flight pricing:', error);
    return null;
  }
};

/**
 * Get pricing for an entire route
 * @param flights - Array of flights in the route
 * @returns Promise with route pricing data
 */
export const getRoutePricing = async (flights: Flight[]): Promise<{
  pricing: FlightPricing[];
  totalCost: number;
  averageCost: number;
} | null> => {
  try {
    console.log('Fetching route pricing for flights:', flights.length);
    const response = await fetch(PRICING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ flights }),
    });

    if (!response.ok) {
      console.error('Pricing API response not ok:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Pricing API result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching route pricing:', error);
    return null;
  }
};

/**
 * Search flight prices with multiple providers
 * @param request - Pricing search request
 * @returns Promise with pricing search results
 */
export const searchFlightPrices = async (request: PricingSearchRequest): Promise<{
  flights: FlightPricing[];
  totalResults: number;
  error?: string;
}> => {
  try {
    const response = await fetch(`${PRICING_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching flight prices:', error);
    return {
      flights: [],
      totalResults: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Check if the API endpoints are available
 * @returns Promise with boolean indicating availability
 */
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const [scheduleResponse, optimizeResponse] = await Promise.all([
      fetch(SCHEDULE_URL, { method: 'HEAD' }),
      fetch(OPTIMIZE_URL, { method: 'OPTIONS' })
    ]);
    
    return scheduleResponse.ok && optimizeResponse.ok;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
};

/**
 * Get API status information
 * @returns Promise with detailed API status
 */
export const getApiStatus = async () => {
  try {
    const [scheduleStatus, optimizeStatus] = await Promise.all([
      fetch(SCHEDULE_URL, { method: 'HEAD' }).then(r => ({ ok: r.ok, status: r.status })),
      fetch(OPTIMIZE_URL, { method: 'OPTIONS' }).then(r => ({ ok: r.ok, status: r.status }))
    ]);
    
    return {
      schedule: scheduleStatus,
      optimize: optimizeStatus,
      allAvailable: scheduleStatus.ok && optimizeStatus.ok
    };
  } catch (error) {
    console.error('API status check failed:', error);
    return {
      schedule: { ok: false, status: 0 },
      optimize: { ok: false, status: 0 },
      allAvailable: false
    };
  }
}; 

/**
 * Get multiple pricing options for comparison
 * @param origin - Origin airport code
 * @param destination - Destination airport code
 * @param departureDate - Departure date (YYYY-MM-DD)
 * @param flightNumber - Optional flight number
 * @returns Promise with multiple pricing options
 */
export const getPricingComparison = async (
  origin: string,
  destination: string,
  departureDate: string,
  flightNumber?: string
): Promise<{
  options: FlightPricing[];
  bestPrice: FlightPricing;
  averagePrice: number;
} | null> => {
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      compare: 'true',
      ...(flightNumber && { flightNumber }),
    });

    const response = await fetch(`${PRICING_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching pricing comparison:', error);
    return null;
  }
}; 
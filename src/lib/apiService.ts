import { Flight, RouteConfig, Results, FlightPricing, PricingSearchRequest } from './types';

const SCHEDULE_URL = '/api/schedule';
const OPTIMIZE_URL = '/api/optimize';
const HYBRID_OPTIMIZE_URL = '/api/hybrid-optimize';
const PRICING_URL = '/api/pricing';

// Custom error types for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public userMessage: string,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public userMessage: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Enhanced fetch with retry logic and proper error handling
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  context: string
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle different types of HTTP errors
      if (!response.ok) {
        const isRetryable = RETRY_CONFIG.retryableStatuses.includes(response.status);
        
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Response body might not be JSON
        }

        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Generate user-friendly error messages based on status codes
        let userMessage: string;
        switch (response.status) {
          case 400:
            userMessage = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            userMessage = 'Authentication required. Please refresh the page and try again.';
            break;
          case 403:
            userMessage = 'Access denied. You may not have permission to perform this action.';
            break;
          case 404:
            userMessage = `${context} not found. The requested resource may not exist.`;
            break;
          case 408:
            userMessage = 'Request timeout. Please try again.';
            break;
          case 429:
            userMessage = 'Too many requests. Please wait a moment before trying again.';
            break;
          case 500:
            userMessage = 'Server error. Please try again in a few moments.';
            break;
          case 502:
          case 503:
          case 504:
            userMessage = 'Service temporarily unavailable. Please try again shortly.';
            break;
          default:
            userMessage = `${context} failed. Please try again later.`;
        }

        const apiError = new ApiError(errorMessage, response.status, userMessage, isRetryable);
        
        if (isRetryable && attempt < RETRY_CONFIG.maxAttempts) {
          lastError = apiError;
          const delay = getRetryDelay(attempt);
          if (process.env.NODE_ENV === 'development') {
            console.log(`${context} failed (attempt ${attempt}), retrying in ${delay}ms...`);
          }
          await sleep(delay);
          continue;
        }
        
        throw apiError;
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      const networkError = new NetworkError(
        error instanceof Error ? error.message : 'Network error',
        `${context} failed due to network issues. Please check your connection and try again.`
      );

      if (attempt < RETRY_CONFIG.maxAttempts) {
        lastError = networkError;
        const delay = getRetryDelay(attempt);
        if (process.env.NODE_ENV === 'development') {
          console.log(`${context} network error (attempt ${attempt}), retrying in ${delay}ms...`);
        }
        await sleep(delay);
        continue;
      }

      throw networkError;
    }
  }

  throw lastError || new NetworkError('Max retries exceeded', `${context} failed after multiple attempts.`);
};

/**
 * Check if flight schedule data is available (without fetching the actual data)
 * @returns Promise with boolean indicating availability
 */
export const checkFlightScheduleAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetchWithRetry(SCHEDULE_URL, { method: 'HEAD' }, 'Schedule availability check');
    return response.ok;
  } catch (error) {
    // For availability checks, we don't want to throw - just return false
    if (process.env.NODE_ENV === 'development') {
      console.log('Schedule availability check failed:', error);
    }
    return false;
  }
};

/**
 * Optimize route using backend API (original A* algorithm)
 * @param config - Route configuration
 * @returns Promise with optimization results
 * @throws {ApiError | NetworkError} On failure
 */
export const optimizeRoute = async (config: RouteConfig): Promise<Results> => {
  const response = await fetchWithRetry(
    OPTIMIZE_URL,
    {
      method: 'POST',
      body: JSON.stringify({ config }),
    },
    'Route optimization'
  );

  const result = await response.json();
  return result;
};

/**
 * Optimize route using hybrid algorithm (Modified Dijkstra's + BFS enumeration)
 * @param config - Route configuration
 * @returns Promise with optimization results including cost alternatives
 * @throws {ApiError | NetworkError} On failure
 */
export const hybridOptimizeRoute = async (config: RouteConfig): Promise<Results> => {
  const response = await fetchWithRetry(
    HYBRID_OPTIMIZE_URL,
    {
      method: 'POST',
      body: JSON.stringify(config),
    },
    'Hybrid route optimization'
  );

  const result = await response.json();
  return result;
};

/**
 * Get pricing for a specific flight route
 * @param origin - Origin airport code
 * @param destination - Destination airport code
 * @param departureDate - Departure date (YYYY-MM-DD)
 * @param flightNumber - Optional flight number
 * @returns Promise with flight pricing data, null if not found
 * @throws {ApiError | NetworkError} On failure (except 404 which returns null)
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

    const response = await fetchWithRetry(
      `${PRICING_URL}?${params}`,
      { method: 'GET' },
      'Flight pricing'
    );

    const pricing = await response.json();
    return pricing;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) {
        // Distinguish between "pricing not found" and "pricing service down"
        if (process.env.NODE_ENV === 'development') {
          console.log(`Pricing not found for ${origin}-${destination} on ${departureDate}`);
        }
        return null; // No pricing found is expected
      }
      if (error.statusCode >= 500) {
        // Server error - pricing service might be down
        console.warn(`Pricing service error (${error.statusCode}): ${error.message}`);
        throw new ApiError(
          error.message,
          error.statusCode,
          'Pricing service is temporarily unavailable. Route optimization will continue without pricing data.',
          true
        );
      }
    }
    throw error;
  }
};

/**
 * Get pricing for an entire route
 * @param flights - Array of flights in the route
 * @returns Promise with route pricing data
 * @throws {ApiError | NetworkError} On failure
 */
export const getRoutePricing = async (flights: Flight[]): Promise<{
  pricing: FlightPricing[];
  totalCost: number;
  averageCost: number;
}> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Fetching route pricing for flights:', flights.length);
  }

  const response = await fetchWithRetry(
    PRICING_URL,
    {
      method: 'POST',
      body: JSON.stringify({ flights }),
    },
    'Route pricing'
  );

  const result = await response.json();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Route pricing result:', result);
  }
  
  return result;
};

/**
 * Search flight prices with multiple providers
 * @param request - Pricing search request
 * @returns Promise with pricing search results
 * @throws {ApiError | NetworkError} On failure
 */
export const searchFlightPrices = async (request: PricingSearchRequest): Promise<{
  flights: FlightPricing[];
  totalResults: number;
}> => {
  const response = await fetchWithRetry(
    `${PRICING_URL}/search`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    'Flight price search'
  );

  const result = await response.json();
  return result;
};

/**
 * Check if the API endpoints are available
 * @returns Promise with boolean indicating availability
 */
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const [scheduleResponse, optimizeResponse] = await Promise.all([
      fetchWithRetry(SCHEDULE_URL, { method: 'HEAD' }, 'Schedule API check'),
      fetchWithRetry(OPTIMIZE_URL, { method: 'OPTIONS' }, 'Optimize API check')
    ]);
    
    return scheduleResponse.ok && optimizeResponse.ok;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('API availability check failed:', error);
    }
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
      fetchWithRetry(SCHEDULE_URL, { method: 'HEAD' }, 'Schedule status').then(r => ({ ok: r.ok, status: r.status })),
      fetchWithRetry(OPTIMIZE_URL, { method: 'OPTIONS' }, 'Optimize status').then(r => ({ ok: r.ok, status: r.status }))
    ]);
    
    return {
      schedule: scheduleStatus,
      optimize: optimizeStatus,
      allAvailable: scheduleStatus.ok && optimizeStatus.ok
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('API status check failed:', error);
    }
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
 * @returns Promise with multiple pricing options, null if not found
 * @throws {ApiError | NetworkError} On failure (except 404 which returns null)
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

    const response = await fetchWithRetry(
      `${PRICING_URL}?${params}`,
      { method: 'GET' },
      'Pricing comparison'
    );

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Pricing comparison not found for ${origin}-${destination} on ${departureDate}`);
        }
        return null; // No pricing comparison found is expected
      }
      if (error.statusCode >= 500) {
        console.warn(`Pricing comparison service error (${error.statusCode}): ${error.message}`);
        throw new ApiError(
          error.message,
          error.statusCode,
          'Pricing comparison service is temporarily unavailable.',
          true
        );
      }
    }
    throw error;
  }
};

/**
 * Get schedule data from the API
 * @returns Promise with CSV schedule data
 * @throws {ApiError | NetworkError} On failure
 */
export const getScheduleData = async (): Promise<string> => {
  const response = await fetchWithRetry(
    SCHEDULE_URL,
    { method: 'GET' },
    'Flight schedule data'
  );

  const csvData = await response.text();
  return csvData;
};

/**
 * Helper function to get user-friendly error message from API errors
 * @param error - Error object
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.userMessage;
  }
  if (error instanceof NetworkError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return 'An unexpected error occurred. Please try again.';
  }
  return 'An unknown error occurred. Please try again.';
};

/**
 * Helper function to check if an error is retryable
 * @param error - Error object
 * @returns Whether the error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.isRetryable;
  }
  if (error instanceof NetworkError) {
    return true; // Network errors are generally retryable
  }
  return false;
};
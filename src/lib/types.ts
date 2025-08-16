export interface Flight {
  'Flight Number': string;
  Origin: string;
  Destination: string;
  'Departure Datetime': string;
  'Arrival Datetime': string;
  'Elapsed Minutes': number;
  Equipment: string;
  'Distance (KM)': number;
}

export interface RouteConfig {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startAirports: string;
  endAirports: string;
  visitedAirports: string;
  minConnectionTime: number;
  domesticOnly: boolean;
}

export interface SearchState {
  score: number;
  counter: number;
  path: Flight[];
  visitedSet: Set<string>;
  arrivalTime: Date;
  totalDuration: number;
}

export interface OptimizationResults {
  path: Flight[];
  totalFlights: number;
  newAirportsVisited: string[];
  totalDistance: number;
  totalDuration: number;
  iterations: number;
}

export interface OptimizationError {
  error: string;
}

export type Results = OptimizationResults | OptimizationError | null;

export interface CsvParseResult {
  data: Flight[];
  errors: string[];
  meta: {
    delimiter?: string;
    linebreak?: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

// Flight Pricing API Types
export interface FlightPricing {
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  airline: string;
  cabinClass: string;
  bookingLink?: string;
  lastUpdated: string;
}

export interface PricingSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
}

export interface PricingSearchResponse {
  flights: FlightPricing[];
  totalResults: number;
  searchId?: string;
  error?: string;
}

export interface FlightWithPricing extends Flight {
  pricing?: FlightPricing;
}

export interface OptimizationResultsWithPricing extends OptimizationResults {
  path: FlightWithPricing[];
  totalPrice?: number;
  averagePrice?: number;
}

export interface RoutePricingData {
  pricing: Array<{
    originalFlight: Flight;
    price: number;
    currency: string;
    bookingLink?: string;
  }>;
  totalCost: number;
  averageCost: number;
}

export interface PricingComparison {
  options: FlightPricing[];
  averagePrice: number;
  bestPrice: number;
}

// Cache-related types
export interface CacheStats {
  totalQueries: number;
  optimizationQueries: number;
  pricingQueries: number;
  cacheSize: number;
  lastUpdated: Date;
}

export interface OptimizationCacheKey {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startAirports: string;
  endAirports: string;
  visitedAirports: string;
  minConnectionTime: number;
} 
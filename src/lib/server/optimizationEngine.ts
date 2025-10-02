import { Flight, RouteConfig, OptimizationResults, OptimizationError, SearchState } from '../types';
import { parseDateTime, minutesToMilliseconds } from '../dateUtils';
import { ACTIVE_CONFIG, LARGE_AIRPORT_CONFIG, OptimizationConfig } from '../optimizationConfig';
import { kilometersToMiles, calculateAirportDistance } from '../distanceUtils';

/**
 * Parse MM/DD/YYYY HH:MMam/pm format to Date object
 */
const parseDateTimeString = (dateTimeStr: string): Date | null => {
  try {
    if (!dateTimeStr) return null;

    // Handle MM/DD/YYYY HH:MMam/pm format (e.g., "10/01/2025 11:59pm")
    const match = dateTimeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i);
    if (match) {
      const [, month, day, year, hour, minute, ampm] = match;
      let hour24 = parseInt(hour);

      if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
        hour24 += 12;
      } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
        hour24 = 0;
      }

      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute));
    }

    // Fallback to standard Date parsing
    return new Date(dateTimeStr);
  } catch (error) {
    console.warn('Error parsing datetime string:', dateTimeStr, error);
    return null;
  }
};

/**
 * Safely parse flight cost from price string
 * @param price - Price string (e.g., "$123" or "123")
 * @returns Numeric cost or 0 if invalid
 */
const parseFlightCost = (price?: string): number => {
  if (!price || typeof price !== 'string') return 0;
  
  // Remove currency symbols and whitespace
  const cleanPrice = price.replace(/[$,\s]/g, '');
  const numericPrice = parseFloat(cleanPrice);
  
  return isNaN(numericPrice) ? 0 : numericPrice;
};

// Debug imports
console.log('🔍 Import debug:');
console.log(`ACTIVE_CONFIG.maxIterations: ${ACTIVE_CONFIG.maxIterations}`);
console.log(`LARGE_AIRPORT_CONFIG.maxIterations: ${LARGE_AIRPORT_CONFIG.maxIterations}`);
console.log(`ACTIVE_CONFIG === LARGE_AIRPORT_CONFIG: ${ACTIVE_CONFIG === LARGE_AIRPORT_CONFIG}`);

/**
 * Calculate heuristic value for A* search with multi-objective optimization
 * @param visited - Set of visited airports
 * @param allNew - Set of all possible new airports
 * @param totalDuration - Current total duration in minutes
 * @returns Heuristic score (prioritizes unique airports, then minimizes duration)
 */
const calculateHeuristic = (visited: Set<string>, allNew: Set<string>, totalDuration: number = 0): number => {
  // FIXED: Prioritize MORE visited airports, not fewer remaining airports
  const visitedAirports = visited.size;
  const airportScore = visitedAirports * 1000; // Primary objective: maximize unique airports visited (high weight)
  const durationPenalty = totalDuration * 0.1; // Secondary objective: minimize duration (low weight)
  return airportScore - durationPenalty; // Higher airport count and lower duration = higher score
};

/**
 * Check if optimization should use September data based on date range
 * @param config - Route configuration
 * @returns True if either start or end date is within September 1-30, 2025
 */
const shouldUseSeptemberData = (config: RouteConfig): boolean => {
  const septemberStart = new Date('2025-09-01T00:00:00');
  const septemberEnd = new Date('2025-09-30T23:59:59');
  
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  
  // Use September data if either start or end date falls within September 1-30
  return (startDate >= septemberStart && startDate <= septemberEnd) ||
         (endDate >= septemberStart && endDate <= septemberEnd);
};

/**
 * Filter flights based on time constraints and validity
 * @param flights - Array of all flights
 * @param config - Route configuration
 * @returns Filtered and sorted flights
 */
const filterValidFlights = (flights: Flight[], config: RouteConfig): Flight[] => {
  const startDateTime = parseDateTime(config.startDate, config.startTime);
  const endDateTime = parseDateTime(config.endDate, config.endTime);
  
  console.log('🔍 filterValidFlights called with:', {
    startDate: config.startDate,
    startTime: config.startTime,
    endDate: config.endDate,
    endTime: config.endTime,
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    totalFlights: flights.length
  });
  
  // Determine which data range to use
  const useSeptemberData = shouldUseSeptemberData(config);
  
  // Define the reliable data range based on dataset
  const reliableDataStart = useSeptemberData 
    ? new Date('2025-09-01T00:00:00')
    : new Date('2025-08-01T00:00:00');
  const reliableDataEnd = useSeptemberData
    ? new Date('2025-09-30T23:59:59')
    : new Date('2025-12-31T23:59:59');

  console.log('🔍 Data range settings:', {
    useSeptemberData,
    reliableDataStart: reliableDataStart.toISOString(),
    reliableDataEnd: reliableDataEnd.toISOString()
  });

  // Helper function to validate Date objects
  const isValidDateObject = (date: Date): boolean => {
    return !isNaN(date.getTime());
  };

  let validFlights = 0;
  let timeWindowFiltered = 0;
  let dataRangeFiltered = 0;
  let invalidDateFiltered = 0;
  let missingFieldsFiltered = 0;

  // Define international airports for domestic filtering
  const internationalAirports = new Set([
    // Europe
    'AMS', 'CDG', 'LHR', 'LGW', 'DUB', 'EDI', 'MAD', 'LIR',
    // Mexico & Central America
    'SJD', 'SJO', 'GUA', 'SAP', 'MDE', 'CTG', 'CUN',
    // South America
    'GEO', 'GYE', 'BZE',
    // Caribbean
    'CUR', 'GND', 'ANU', 'BGI', 'KIN', 'MBJ', 'POP', 'POS', 'SKB', 'BON', 'GCM', 'PLS',
    // Additional international destinations
    'YVR', 'SVD', 'SXM', 'STT', 'STX', 'UVF',
    // Missing international airports that were causing issues
    'PUJ', 'STI', 'SDQ', 'NAS',
    // Additional international airports found in CSV analysis
    'AUA', 'BDA', 'BQN', 'SJU', 'PSE',
    // Additional international airports found in September data
    'MDE', 'STI', 'SDQ', 'PUJ', 'NAS', 'BQN', 'SJU', 'PSE', 'MBJ', 'KIN', 'MAD', 'GYE'
  ]);

  const filteredFlights = flights.filter(flight => {
    const depTime = parseDateTimeString(flight['Departure Datetime']);
    const arrTime = parseDateTimeString(flight['Arrival Datetime']);
    
    // Check if flights are within the reliable data range
    const isWithinReliableRange = depTime && arrTime &&
                                 depTime >= reliableDataStart &&
                                 depTime <= reliableDataEnd &&
                                 arrTime >= reliableDataStart &&
                                 arrTime <= reliableDataEnd;
    
    const isWithinTimeWindow = depTime && arrTime && depTime >= startDateTime && arrTime <= endDateTime;
    const hasValidDates = depTime !== null && arrTime !== null && isValidDateObject(depTime) && isValidDateObject(arrTime);
    const hasRequiredFields = flight.Origin && flight.Destination;
    
    // Check domestic-only constraint
    const isDomestic = !internationalAirports.has(flight.Origin) && !internationalAirports.has(flight.Destination);
    const passesDomesticFilter = !config.domesticOnly || isDomestic;
    
    if (!isWithinTimeWindow) timeWindowFiltered++;
    if (!isWithinReliableRange) dataRangeFiltered++;
    if (!hasValidDates) invalidDateFiltered++;
    if (!hasRequiredFields) missingFieldsFiltered++;
    if (!passesDomesticFilter) timeWindowFiltered++; // Reuse counter for domestic filtering
    
    const isValid = isWithinTimeWindow && 
                   isWithinReliableRange &&
                   hasValidDates &&
                   hasRequiredFields &&
                   passesDomesticFilter;
    
    if (isValid) validFlights++;
    
    return isValid;
  }).sort((a, b) => new Date(a['Departure Datetime']).getTime() - new Date(b['Departure Datetime']).getTime());

  console.log('🔍 Filtering results:', {
    validFlights,
    timeWindowFiltered,
    dataRangeFiltered,
    invalidDateFiltered,
    missingFieldsFiltered,
    totalFiltered: flights.length - validFlights
  });

  return filteredFlights;
};

/**
 * Build flight index by origin airport
 * @param flights - Array of flights
 * @returns Object mapping origin airports to flight arrays
 */
const buildFlightIndex = (flights: Flight[]): Record<string, Flight[]> => {
  const flightsByOrigin: Record<string, Flight[]> = {};
  
  flights.forEach(flight => {
    const origin = flight.Origin;
    if (!flightsByOrigin[origin]) {
      flightsByOrigin[origin] = [];
    }
    flightsByOrigin[origin].push(flight);
  });
  
  return flightsByOrigin;
};

/**
 * Parse airport strings into Sets
 * @param config - Route configuration
 * @returns Object with parsed airport sets
 */
const parseAirportSets = (config: RouteConfig) => {
  // Filter out BED (dummy airport) and ensure clean airport codes
  const visitedAirports = config.visitedAirports && config.visitedAirports.trim() !== '' 
    ? config.visitedAirports.split(',').map(s => s.trim()).filter(s => s && s !== 'BED')
    : [];
  
  return {
    startAirports: new Set(config.startAirports.split(',').map(s => s.trim())),
    endAirports: new Set(config.endAirports.split(',').map(s => s.trim())),
    visitedAirports: new Set(visitedAirports)
  };
};

/**
 * Calculate new airports visited from flight path
 * @param path - Array of flights
 * @param visitedAirports - Set of already visited airports
 * @returns Array of new airports visited
 */
const calculateNewAirportsVisited = (path: Flight[], visitedAirports: Set<string>): string[] => {
  return path
    .map(flight => flight.Destination)
    .filter(destination => !visitedAirports.has(destination))
    .filter((destination, index, array) => array.indexOf(destination) === index); // Remove duplicates
};

/**
 * Calculate total distance and duration from flight path
 * @param path - Array of flights
 * @returns Object with total distance (miles), duration (minutes), and total price
 */
const calculatePathMetrics = (path: Flight[]) => {
  let totalDistanceMiles = 0;
  
  // Calculate distance - use existing Distance (MI) if available, otherwise calculate from coordinates
  if (path.length > 0 && 'Distance (MI)' in path[0]) {
    // August data has Distance (MI) - already in miles
    totalDistanceMiles = path.reduce((sum, flight) => sum + (flight['Distance (MI)'] || 0), 0);
  } else {
    // September data - calculate distances using airport coordinates
    totalDistanceMiles = path.reduce((sum, flight) => {
      const distance = calculateAirportDistance(flight.Origin, flight.Destination);
      return sum + distance;
    }, 0);
  }
  
  const totalDuration = path.reduce((sum, flight) => sum + (flight['Elapsed Minutes'] || 0), 0);
  
  // Calculate total price for September data
  let totalPrice = 0;
  if (path.length > 0 && 'Price' in path[0]) {
    totalPrice = path.reduce((sum, flight) => {
      return sum + parseFlightCost(flight.Price);
    }, 0);
  }
  
  return { totalDistanceMiles, totalDuration, totalPrice };
};

/**
 * Calculate multi-objective score for route evaluation
 * @param visitedCount - Number of unique airports visited
 * @param totalDuration - Total duration in minutes
 * @param totalPossible - Total possible new airports
 * @param totalCost - Total cost in dollars (optional)
 * @param config - Route configuration for optimization mode
 * @returns Score (higher is better for airport optimization, lower is better for cost optimization)
 */
const calculateMultiObjectiveScore = (
  visitedCount: number, 
  totalDuration: number, 
  totalPossible: number, 
  totalCost: number = 0,
  config?: RouteConfig
): number => {
  // Check if we're in cost optimization mode
  if (config?.optimizeForCost && config?.targetAirportCount) {
    // Cost optimization mode: minimize cost while maintaining EXACT airport count
    const targetAirports = config.targetAirportCount;
    
    // CRITICAL: If we don't have exactly the target number of airports, this route is invalid
    if (visitedCount !== targetAirports) {
      return Number.MAX_SAFE_INTEGER; // Make this route completely invalid
    }
    
    // We have the exact airport count, now minimize cost
    // Return negative score so that lower cost = higher score (better)
    return -totalCost;
  }
  
  // Standard airport optimization mode with cost as tiebreaker
  // Normalize visited count to 0-1 range
  const normalizedVisited = visitedCount / Math.max(totalPossible, 1);
  // Normalize duration (assume max 24 hours = 1440 minutes)
  const normalizedDuration = Math.min(totalDuration / 1440, 1);
  // Normalize cost (assume max reasonable trip cost = $5000)
  const normalizedCost = totalCost > 0 ? Math.min(totalCost / 5000, 1) : 0;
  
  // Multi-objective optimization: airports first, then cost as tiebreaker, then duration
  // Priority: 1) Maximize airports (weight: 1000)
  //           2) Minimize cost as tiebreaker (weight: 5)  
  //           3) Minimize duration (weight: 1)
  return (normalizedVisited * 1000) - (normalizedCost * 5) - (normalizedDuration * 1);
};

// Configuration for optimization algorithm
const OPTIMIZATION_CONFIG = ACTIVE_CONFIG;

/**
 * Optimize route with A* search algorithm
 * @param flights - Array of all flights
 * @param config - Route configuration
 * @returns Optimization results or error
 */
export const optimizeRoute = async (flights: Flight[], config: RouteConfig): Promise<OptimizationResults | OptimizationError> => {
  console.log('🚨 USING HYBRID OPTIMIZER FOR STANDARD OPTIMIZATION! 🚨');
  
  // Use hybrid optimizer for all standard optimizations to maximize airports
  const { hybridOptimizeRoute } = await import('../hybridOptimization');
  return await hybridOptimizeRoute(flights, config);
};

/**
 * Optimize route for cost while maintaining the same number of airports
 * @param flights - Array of all flights
 * @param config - Route configuration with targetAirportCount set
 * @returns Optimization results or error
 */
export const optimizeRouteForCost = async (flights: Flight[], config: RouteConfig): Promise<OptimizationResults | OptimizationError> => {
  if (!config.targetAirportCount) {
    return { error: 'targetAirportCount is required for cost optimization' };
  }

  console.log(`💰 Starting cost optimization for ${config.targetAirportCount} airports...`);
  
  // Use the NEW hybrid algorithm instead of the old A*
  try {
    const { hybridOptimizeRoute } = await import('../hybridOptimization');
    console.log('🚀 Using hybrid algorithm for cost optimization');
    return await hybridOptimizeRoute(flights, config);
  } catch (error) {
    console.error('❌ Failed to load hybrid algorithm, falling back to A*:', error);
    
    // Fallback to old A* method (but it won't work properly)
    const costConfig: RouteConfig = {
      ...config,
      optimizeForCost: true
    };
    return await optimizeRoute(flights, costConfig);
  }
}; 
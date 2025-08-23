import { Flight, RouteConfig, OptimizationResults, OptimizationError, SearchState } from '../types';
import { ACTIVE_CONFIG, LARGE_AIRPORT_CONFIG, OptimizationConfig } from '../optimizationConfig';

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
  const remainingAirports = allNew.size - visited.size;
  const airportScore = remainingAirports * 1000; // Primary objective: unique airports (high weight)
  const durationPenalty = totalDuration * 0.1; // Secondary objective: minimize duration (low weight)
  return airportScore + durationPenalty;
};

/**
 * Parse date and time strings into a Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns Date object
 */
const parseDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(`${dateStr}T${timeStr}:00`);
};

/**
 * Convert minutes to milliseconds
 * @param minutes - Number of minutes
 * @returns Number of milliseconds
 */
const minutesToMilliseconds = (minutes: number): number => {
  return minutes * 60 * 1000;
};

/**
 * Check if a date is valid
 * @param date - Date object to validate
 * @returns True if date is valid
 */
const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime());
};

/**
 * Convert kilometers to miles
 * @param kilometers - Distance in kilometers
 * @returns Distance in miles (rounded)
 */
const kilometersToMiles = (kilometers: number): number => {
  return Math.round(kilometers * 0.621371);
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
  
  // Define the reliable data range (August 1 - December 31, 2025)
  const reliableDataStart = new Date('2025-08-01T00:00:00');
  const reliableDataEnd = new Date('2025-12-31T23:59:59');

  // Helper function to validate Date objects
  const isValidDateObject = (date: Date): boolean => {
    return !isNaN(date.getTime());
  };

  return flights.filter(flight => {
    const depTime = new Date(flight['Departure Datetime']);
    const arrTime = new Date(flight['Arrival Datetime']);
    
    // Check if flights are within the reliable data range
    const isWithinReliableRange = depTime >= reliableDataStart && 
                                 depTime <= reliableDataEnd && 
                                 arrTime >= reliableDataStart && 
                                 arrTime <= reliableDataEnd;
    
    return depTime >= startDateTime && 
           arrTime <= endDateTime && 
           isWithinReliableRange &&
           flight.Origin && 
           flight.Destination && 
           isValidDateObject(depTime) && 
           isValidDateObject(arrTime);
  }).sort((a, b) => new Date(a['Departure Datetime']).getTime() - new Date(b['Departure Datetime']).getTime());
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
 * @returns Object with total distance (miles) and duration (minutes)
 */
const calculatePathMetrics = (path: Flight[]) => {
  const totalDistanceKm = path.reduce((sum, flight) => sum + (flight['Distance (KM)'] || 0), 0);
  const totalDistanceMiles = kilometersToMiles(totalDistanceKm);
  const totalDuration = path.reduce((sum, flight) => sum + (flight['Elapsed Minutes'] || 0), 0);
  
  return { totalDistanceMiles, totalDuration };
};

/**
 * Calculate multi-objective score for route evaluation
 * @param visitedCount - Number of unique airports visited
 * @param totalDuration - Total duration in minutes
 * @param totalPossible - Total possible new airports
 * @returns Score (higher is better)
 */
const calculateMultiObjectiveScore = (visitedCount: number, totalDuration: number, totalPossible: number): number => {
  // Normalize visited count to 0-1 range
  const normalizedVisited = visitedCount / Math.max(totalPossible, 1);
  // Normalize duration (assume max 24 hours = 1440 minutes)
  const normalizedDuration = Math.min(totalDuration / 1440, 1);
  
  // Weight unique airports much higher than duration
  return (normalizedVisited * 1000) - (normalizedDuration * 10);
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
  const startTime = Date.now();
  
  console.log('🚨 OPTIMIZATION ENGINE CALLED - NEW VERSION! 🚨');
  
  try {
    // Validate configuration
    if (!config.startAirports || !config.endAirports || !config.startDate || !config.startTime || !config.endDate || !config.endTime) {
      return { error: 'Missing required configuration parameters' };
    }

    // Parse airports
    const startAirports = new Set(config.startAirports.split(',').map(a => a.trim().toUpperCase()).filter(a => a.length === 3));
    const endAirports = new Set(config.endAirports.split(',').map(a => a.trim().toUpperCase()).filter(a => a.length === 3));
    const visitedAirports = new Set(config.visitedAirports?.split(',').map(a => a.trim().toUpperCase()).filter(a => a.length === 3) || []);
    
    if (startAirports.size === 0 || endAirports.size === 0) {
      return { error: 'Invalid airport codes provided' };
    }

    // Filter valid flights
    const validFlights = filterValidFlights(flights, config);
    if (validFlights.length === 0) {
      return { error: 'No valid flights found for the specified time window' };
    }

    // Calculate minimum connection time
    const minConnectionTime = minutesToMilliseconds(config.minConnectionTime || 30);

    // Build flight index by origin
    const flightsByOrigin = buildFlightIndex(validFlights);

    // Get all possible new airports
    const allDestinations = new Set(validFlights.map(f => f.Destination));
    const newAirports = new Set(Array.from(allDestinations).filter(dest => !visitedAirports.has(dest)));

    // For large numbers of end airports, use a more efficient strategy
    const isLargeEndAirportSet = endAirports.size > 30;
    let effectiveEndAirports = endAirports;
    
    console.log(`🔍 DEBUG: endAirports.size = ${endAirports.size}, threshold = 30, isLargeEndAirportSet = ${isLargeEndAirportSet}`);
    
    // Determine which configuration to use
    let currentConfig: OptimizationConfig;
    
    if (isLargeEndAirportSet) {
      currentConfig = LARGE_AIRPORT_CONFIG;
      console.log(`🚀 Large end airport set detected (${endAirports.size}). Using large airport configuration.`);
      console.log(`⚙️  Settings: ${currentConfig.maxIterations.toLocaleString()} iterations, ${currentConfig.maxHeapSize.toLocaleString()} heap size, ${currentConfig.timeoutMs/1000}s timeout`);
      console.log(`🔍 LARGE_AIRPORT_CONFIG values: maxIterations=${LARGE_AIRPORT_CONFIG.maxIterations}, maxHeapSize=${LARGE_AIRPORT_CONFIG.maxHeapSize}, timeoutMs=${LARGE_AIRPORT_CONFIG.timeoutMs}`);
      console.log(`🔍 currentConfig values: maxIterations=${currentConfig.maxIterations}, maxHeapSize=${currentConfig.maxHeapSize}, timeoutMs=${currentConfig.timeoutMs}`);
      
      // When there are many end airports, prioritize airports that are actually reachable
      // and have good connections to maximize unique airport visits
      const reachableEndAirports = new Set<string>();
      
      // Find airports that are destinations of flights from start airports
      validFlights.forEach(flight => {
        if (startAirports.has(flight.Origin) && endAirports.has(flight.Destination)) {
          reachableEndAirports.add(flight.Destination);
        }
      });
      
      // If we found reachable end airports, use those; otherwise fall back to original
      if (reachableEndAirports.size > 0) {
        effectiveEndAirports = reachableEndAirports;
        console.log(`🎯 Using ${reachableEndAirports.size} reachable airports for optimization.`);
      }
    } else {
      currentConfig = ACTIVE_CONFIG;
      console.log(`📊 Using standard configuration: ${currentConfig.maxIterations.toLocaleString()} iterations`);
    }
    
    console.log(`🔧 Final config: ${currentConfig.maxIterations.toLocaleString()} iterations, ${currentConfig.maxHeapSize.toLocaleString()} heap size`);

    // A* search implementation with multi-objective optimization
    const heap: SearchState[] = [];
    const visited = new Map<string, number>();
    let bestPath: Flight[] = [];
    let maxVisited = 0;
    let bestDuration = Infinity;
    let counter = 0;

    const startDateTime = parseDateTime(config.startDate, config.startTime);
    const endDateTime = parseDateTime(config.endDate, config.endTime);

    // Initialize with starting flights
    validFlights.forEach(flight => {
      if (startAirports.has(flight.Origin)) {
        const visitedSet = new Set<string>();
        if (newAirports.has(flight.Destination)) {
          visitedSet.add(flight.Destination);
        }
        
        const flightDuration = flight['Elapsed Minutes'] || 0;
        const score = calculateMultiObjectiveScore(visitedSet.size, flightDuration, newAirports.size);
        heap.push({
          score,
          counter: counter++,
          path: [flight],
          visitedSet,
          arrivalTime: new Date(flight['Arrival Datetime']),
          totalDuration: flightDuration
        });
      }
    });

    // Sort heap by score, then by duration, then by counter for deterministic ordering
    heap.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.totalDuration !== b.totalDuration) return a.totalDuration - b.totalDuration;
      return a.counter - b.counter;
    });

    let iterations = 0;
    const maxIterations = currentConfig.maxIterations;

    while (heap.length > 0 && iterations < maxIterations) {
      // Check timeout
      if (Date.now() - startTime > currentConfig.timeoutMs) {
        console.warn(`Optimization timeout after ${iterations} iterations`);
        break;
      }
      
      iterations++;
      const current = heap.shift()!;
      const { path, visitedSet, arrivalTime, totalDuration } = current;
      const lastFlight = path[path.length - 1];
      const currentAirport = lastFlight.Destination;

      // Check if we've reached an end airport
      if (effectiveEndAirports.has(currentAirport)) {
        // Update best path using multi-objective criteria
        if (visitedSet.size > maxVisited || 
            (visitedSet.size === maxVisited && totalDuration < bestDuration)) {
          maxVisited = visitedSet.size;
          bestDuration = totalDuration;
          bestPath = [...path];
        }
        continue;
      }

      // Improved memoization for large airport sets
      let memoKey: string;
      if (isLargeEndAirportSet) {
        // For large sets, use a more compact memoization key
        const visitedArray = Array.from(visitedSet).sort();
        const keyLength = Math.min(visitedArray.length, 10); // Limit key length
        memoKey = `${currentAirport}-${visitedArray.slice(0, keyLength).join(',')}`;
      } else {
        // Original memoization for smaller sets
        memoKey = `${currentAirport}-${Array.from(visitedSet).sort().join(',')}`;
      }
      
      if (visited.has(memoKey) && visited.get(memoKey)! <= arrivalTime.getTime()) {
        continue;
      }
      visited.set(memoKey, arrivalTime.getTime());

      // Find connecting flights
      const nextFlights = flightsByOrigin[currentAirport] || [];
      const minDepartureTime = new Date(arrivalTime.getTime() + minConnectionTime);

      nextFlights.forEach(nextFlight => {
        const nextDepTime = new Date(nextFlight['Departure Datetime']);
        const nextArrTime = new Date(nextFlight['Arrival Datetime']);

        // Check constraints
        if (nextDepTime < minDepartureTime) return;
        if (nextArrTime > endDateTime) return;
        if (nextFlight['Flight Number'] === lastFlight['Flight Number']) return;

        const newVisitedSet = new Set(visitedSet);
        if (newAirports.has(nextFlight.Destination)) {
          newVisitedSet.add(nextFlight.Destination);
        }

        const newPath = [...path, nextFlight];
        const newTotalDuration = totalDuration + (nextFlight['Elapsed Minutes'] || 0);
        const newScore = calculateMultiObjectiveScore(newVisitedSet.size, newTotalDuration, newAirports.size);
        
        heap.push({
          score: newScore,
          counter: counter++,
          path: newPath,
          visitedSet: newVisitedSet,
          arrivalTime: nextArrTime,
          totalDuration: newTotalDuration
        });
      });

      // Keep heap sorted and limit size for performance
      // Sort by score first, then by total duration as tiebreaker, then by counter for deterministic ordering
      heap.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.totalDuration !== b.totalDuration) return a.totalDuration - b.totalDuration;
        return a.counter - b.counter;
      });
      
      // For large end airport sets, increase heap size to allow more exploration
      const maxHeapSize = isLargeEndAirportSet ? 
        Math.min(currentConfig.maxHeapSize * 2, 25000) : 
        currentConfig.maxHeapSize;
        
      if (heap.length > maxHeapSize) {
        heap.splice(maxHeapSize);
      }
    }

    // Calculate results
    if (bestPath.length > 0) {
      const { totalDistanceMiles, totalDuration } = calculatePathMetrics(bestPath);
      const newAirportsVisited = calculateNewAirportsVisited(bestPath, visitedAirports);

      return {
        path: bestPath,
        totalFlights: bestPath.length,
        newAirportsVisited,
        totalDistance: totalDistanceMiles,
        totalDuration,
        iterations
      };
    } else {
      // Provide helpful error message with suggestions for single-airport loops
      const startAirportsArray = Array.from(startAirports);
      const endAirportsArray = Array.from(endAirports);
      const isSingleAirportLoop = startAirports.size === 1 && endAirports.size === 1 && 
                                  startAirportsArray[0] === endAirportsArray[0];
      
      if (isSingleAirportLoop) {
        const airport = startAirportsArray[0];
        return { 
          error: `No valid loop route found from ${airport}. Try adding nearby airports like "${airport},JFK,LGA" for better results, or reduce the time window/connection time.`
        };
      }
      
      const visitedCount = visitedAirports.size;
      if (visitedCount > 12) {
        return {
          error: `No valid route found with ${visitedCount} excluded airports. Try reducing already-visited airports or extending the time window.`
        };
      }
      
      if (isLargeEndAirportSet) {
        return {
          error: `No valid route found with ${endAirports.size} end airports. The algorithm may be hitting limits. Try:\n• Reducing the number of end airports to 20-30\n• Expanding your time window\n• Reducing minimum connection time\n• Using more specific airport codes`
        };
      }
      
      return { 
        error: 'No possible route found with your current settings. Try:\n• Expanding your time window\n• Reducing minimum connection time\n• Adding more start/end airports\n• Adjusting your visited airports list' 
      };
    }

  } catch (error) {
    console.error('Optimization error:', error);
    return { error: `An error occurred during optimization: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}; 
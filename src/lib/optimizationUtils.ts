import { Flight, RouteConfig, OptimizationResults, OptimizationError, SearchState } from './types';
import { parseDateTime, minutesToMilliseconds, isValidDate } from './dateUtils';
import { kilometersToMiles } from './distanceUtils';
import { ACTIVE_CONFIG } from './optimizationConfig';

/**
 * Calculate heuristic value for A* search with multi-objective optimization
 * @param visited - Set of visited airports
 * @param allNew - Set of all possible new airports
 * @param totalDuration - Current total duration in minutes
 * @returns Heuristic score (prioritizes unique airports, then minimizes duration)
 */
export const calculateHeuristic = (visited: Set<string>, allNew: Set<string>, totalDuration: number = 0): number => {
  const remainingAirports = allNew.size - visited.size;
  const airportScore = remainingAirports * 1000; // Primary objective: unique airports (high weight)
  const durationPenalty = totalDuration * 0.1; // Secondary objective: minimize duration (low weight)
  return airportScore + durationPenalty;
};

/**
 * Filter flights based on time constraints and validity
 * @param flights - Array of all flights
 * @param config - Route configuration
 * @returns Filtered and sorted flights
 */
export const filterValidFlights = (flights: Flight[], config: RouteConfig): Flight[] => {
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
export const buildFlightIndex = (flights: Flight[]): Record<string, Flight[]> => {
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
export const parseAirportSets = (config: RouteConfig) => {
  return {
    startAirports: new Set(config.startAirports.split(',').map(s => s.trim())),
    endAirports: new Set(config.endAirports.split(',').map(s => s.trim())),
    visitedAirports: new Set(
      config.visitedAirports && config.visitedAirports.trim() !== '' 
        ? config.visitedAirports.split(',').map(s => s.trim()).filter(s => s)
        : []
    )
  };
};

/**
 * Calculate new airports visited from flight path
 * @param path - Array of flights
 * @param visitedAirports - Set of already visited airports
 * @returns Array of new airports visited
 */
export const calculateNewAirportsVisited = (path: Flight[], visitedAirports: Set<string>): string[] => {
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
export const calculatePathMetrics = (path: Flight[]) => {
  const totalDistanceKm = path.reduce((sum, flight) => sum + (flight['Distance (KM)'] || 0), 0);
  const totalDistanceMiles = kilometersToMiles(totalDistanceKm);
  const totalDuration = path.reduce((sum, flight) => sum + (flight['Elapsed Minutes'] || 0), 0);
  
  return { totalDistanceMiles, totalDuration };
};

/**
 * Calculate multi-objective score for route optimization
 * @param visitedCount - Number of unique airports visited
 * @param totalDuration - Total duration in minutes
 * @param maxPossibleAirports - Maximum possible airports that can be visited
 * @returns Multi-objective score (lower is better)
 */
export const calculateMultiObjectiveScore = (
  visitedCount: number, 
  totalDuration: number, 
  maxPossibleAirports: number
): number => {
  // Primary objective: maximize unique airports (negative for minimization in A*)
  const airportScore = -(visitedCount * 10000);
  
  // Secondary objective: minimize duration (normalized to 0-1000 range)
  const normalizedDuration = Math.min(totalDuration / 1440, 1) * 1000; // Normalize by 24 hours
  
  return airportScore + normalizedDuration;
};

// Configuration for optimization algorithm
const OPTIMIZATION_CONFIG = ACTIVE_CONFIG;

/**
 * Optimize route using A* search algorithm
 * @param flights - Array of all flights
 * @param config - Route configuration
 * @returns Promise with optimization results or error
 */
export const optimizeRoute = async (flights: Flight[], config: RouteConfig): Promise<OptimizationResults | OptimizationError> => {
  const startTime = Date.now();
  
  try {
    const { startAirports, endAirports, visitedAirports } = parseAirportSets(config);
    const minConnectionTime = minutesToMilliseconds(config.minConnectionTime);
    
    // Filter and process flights
    const validFlights = filterValidFlights(flights, config);
    
    if (validFlights.length === 0) {
      return { error: 'No valid flights found in the specified time window' };
    }

    // Build flight index by origin
    const flightsByOrigin = buildFlightIndex(validFlights);

    // Get all possible new airports
    const allDestinations = new Set(validFlights.map(f => f.Destination));
    const newAirports = new Set([...allDestinations].filter(dest => !visitedAirports.has(dest)));

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
    const maxIterations = OPTIMIZATION_CONFIG.maxIterations;

    while (heap.length > 0 && iterations < maxIterations) {
      // Check timeout
      if (Date.now() - startTime > OPTIMIZATION_CONFIG.timeoutMs) {
        console.warn(`Optimization timeout after ${iterations} iterations`);
        break;
      }
      
      iterations++;
      const current = heap.shift()!;
      const { path, visitedSet, arrivalTime, totalDuration } = current;
      const lastFlight = path[path.length - 1];
      const currentAirport = lastFlight.Destination;

      // Check if we've reached an end airport
      if (endAirports.has(currentAirport)) {
        // Update best path using multi-objective criteria
        if (visitedSet.size > maxVisited || 
            (visitedSet.size === maxVisited && totalDuration < bestDuration)) {
          maxVisited = visitedSet.size;
          bestDuration = totalDuration;
          bestPath = [...path];
        }
        continue;
      }

      // Memoization check
      const memoKey = `${currentAirport}-${[...visitedSet].sort().join(',')}`;
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
      if (heap.length > OPTIMIZATION_CONFIG.maxHeapSize) {
        heap.splice(OPTIMIZATION_CONFIG.maxHeapSize);
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
      const isSingleAirportLoop = startAirports.size === 1 && endAirports.size === 1 && 
                                  [...startAirports][0] === [...endAirports][0];
      
      if (isSingleAirportLoop) {
        const airport = [...startAirports][0];
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
      
      return { error: 'No valid route found within the constraints. Try extending the time window or reducing connection time.' };
    }

  } catch (error) {
    console.error('Optimization error:', error);
    return { error: `An error occurred during optimization: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}; 
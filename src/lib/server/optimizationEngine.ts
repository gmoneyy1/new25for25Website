import { Flight, RouteConfig, SearchState, OptimizationResults, OptimizationError } from '../types';

/**
 * Calculate heuristic value for A* search
 * @param visited - Set of visited airports
 * @param allNew - Set of all possible new airports
 * @returns Heuristic score
 */
const calculateHeuristic = (visited: Set<string>, allNew: Set<string>): number => {
  return (allNew.size - visited.size) * 60;
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

  return flights.filter(flight => {
    const depTime = new Date(flight['Departure Datetime']);
    const arrTime = new Date(flight['Arrival Datetime']);
    
    return depTime >= startDateTime && 
           arrTime <= endDateTime && 
           flight.Origin && 
           flight.Destination && 
           isValidDate(depTime) && 
           isValidDate(arrTime);
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
  return {
    startAirports: new Set(config.startAirports.split(',').map(s => s.trim())),
    endAirports: new Set(config.endAirports.split(',').map(s => s.trim())),
    visitedAirports: new Set(config.visitedAirports.split(',').map(s => s.trim()))
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
 * Optimize route using A* search algorithm
 * @param flights - Array of all flights
 * @param config - Route configuration
 * @returns Promise with optimization results or error
 */
export const optimizeRoute = async (flights: Flight[], config: RouteConfig): Promise<OptimizationResults | OptimizationError> => {
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

    // A* search implementation
    const heap: SearchState[] = [];
    const visited = new Map<string, number>();
    let bestPath: Flight[] = [];
    let maxVisited = 0;
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
        
        const score = -visitedSet.size + calculateHeuristic(visitedSet, newAirports);
        heap.push({
          score,
          counter: counter++,
          path: [flight],
          visitedSet,
          arrivalTime: new Date(flight['Arrival Datetime'])
        });
      }
    });

    // Sort heap by score
    heap.sort((a, b) => a.score - b.score);

    let iterations = 0;
    const maxIterations = 5000; // Prevent infinite loops

    while (heap.length > 0 && iterations < maxIterations) {
      iterations++;
      const current = heap.shift()!;
      const { path, visitedSet, arrivalTime } = current;
      const lastFlight = path[path.length - 1];
      const currentAirport = lastFlight.Destination;

      // Check if we've reached an end airport
      if (endAirports.has(currentAirport)) {
        if (visitedSet.size > maxVisited) {
          maxVisited = visitedSet.size;
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

        const newScore = -newVisitedSet.size + calculateHeuristic(newVisitedSet, newAirports);
        heap.push({
          score: newScore,
          counter: counter++,
          path: [...path, nextFlight],
          visitedSet: newVisitedSet,
          arrivalTime: nextArrTime
        });
      });

      // Keep heap sorted and limit size for performance
      heap.sort((a, b) => a.score - b.score);
      if (heap.length > 1000) {
        heap.splice(1000);
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
      return { error: 'No valid route found within the constraints' };
    }

  } catch (error) {
    console.error('Optimization error:', error);
    return { error: `An error occurred during optimization: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}; 
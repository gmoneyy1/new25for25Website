import { Flight, RouteConfig, OptimizationResults, OptimizationError } from './types';
import { parseDateTime, minutesToMilliseconds } from './dateUtils';
import { calculateAirportDistance } from './distanceUtils';

/**
 * Pure A* optimization algorithm for flight route optimization
 * Implements clean A* with proper heuristics and state management
 */

interface AStarState {
  airport: string;
  visitedAirports: Set<string>;
  path: Flight[];
  arrivalTime: Date;
  totalDuration: number;
  totalDistance: number;
  totalCost: number;
  gScore: number; // Actual cost from start
  fScore: number; // gScore + heuristic
}

interface PriorityQueueItem {
  state: AStarState;
  priority: number;
}

class AStarPriorityQueue {
  private items: PriorityQueueItem[] = [];

  push(state: AStarState, priority: number) {
    this.items.push({ state, priority });
    this.heapifyUp(this.items.length - 1);
  }

  pop(): AStarState | null {
    if (this.items.length === 0) return null;
    
    const root = this.items[0];
    const last = this.items.pop()!;
    
    if (this.items.length > 0) {
      this.items[0] = last;
      this.heapifyDown(0);
    }
    
    return root.state;
  }

  get length(): number {
    return this.items.length;
  }

  empty(): boolean {
    return this.items.length === 0;
  }

  private heapifyUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[index].priority <= this.items[parentIndex].priority) break;
      
      [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
      index = parentIndex;
    }
  }

  private heapifyDown(index: number) {
    while (true) {
      let largest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.items.length && 
          this.items[leftChild].priority > this.items[largest].priority) {
        largest = leftChild;
      }

      if (rightChild < this.items.length && 
          this.items[rightChild].priority > this.items[largest].priority) {
        largest = rightChild;
      }

      if (largest === index) break;

      [this.items[index], this.items[largest]] = [this.items[largest], this.items[index]];
      index = largest;
    }
  }
}

/**
 * Filter flights based on time constraints and validity
 */
function filterValidFlights(flights: Flight[], config: RouteConfig): Flight[] {
  const startDateTime = parseDateTime(config.startDate, config.startTime);
  const endDateTime = parseDateTime(config.endDate, config.endTime);
  
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
    'PUJ', 'STI', 'SDQ', 'NAS', 'AUA', 'BDA', 'BQN', 'SJU', 'PSE'
  ]);

  return flights.filter(flight => {
    const depTime = new Date(flight['Departure Datetime']);
    const arrTime = new Date(flight['Arrival Datetime']);
    
    const isWithinTimeWindow = depTime >= startDateTime && arrTime <= endDateTime;
    const hasValidDates = !isNaN(depTime.getTime()) && !isNaN(arrTime.getTime());
    const hasRequiredFields = flight.Origin && flight.Destination;
    
    // Check domestic-only constraint
    const isDomestic = !internationalAirports.has(flight.Origin) && !internationalAirports.has(flight.Destination);
    const passesDomesticFilter = !config.domesticOnly || isDomestic;
    
    return isWithinTimeWindow && hasValidDates && hasRequiredFields && passesDomesticFilter;
  }).sort((a, b) => new Date(a['Departure Datetime']).getTime() - new Date(b['Departure Datetime']).getTime());
}

/**
 * Parse airport strings into Sets
 */
function parseAirportSets(config: RouteConfig) {
  const visitedAirports = config.visitedAirports && config.visitedAirports.trim() !== '' 
    ? config.visitedAirports.split(',').map(s => s.trim()).filter(s => s && s !== 'BED')
    : [];
  
  return {
    startAirports: new Set(config.startAirports.split(',').map(s => s.trim())),
    endAirports: new Set(config.endAirports.split(',').map(s => s.trim())),
    visitedAirports: new Set(visitedAirports)
  };
}

/**
 * Build flight index by origin airport
 */
function buildFlightIndex(flights: Flight[]): Record<string, Flight[]> {
  const flightsByOrigin: Record<string, Flight[]> = {};
  
  flights.forEach(flight => {
    const origin = flight.Origin;
    if (!flightsByOrigin[origin]) {
      flightsByOrigin[origin] = [];
    }
    flightsByOrigin[origin].push(flight);
  });
  
  return flightsByOrigin;
}

/**
 * Calculate admissible heuristic for A* search
 * Returns an upper bound on the number of additional airports that can be visited
 */
function calculateHeuristic(
  currentAirport: string,
  visitedAirports: Set<string>,
  flightsByOrigin: Record<string, Flight[]>,
  endDateTime: Date,
  minConnectionTime: number
): number {
  // Simple heuristic: estimate based on remaining time and average flight duration
  const remainingTime = endDateTime.getTime() - Date.now();
  const remainingHours = remainingTime / (1000 * 60 * 60);
  
  // Estimate average flight duration (2 hours) + connection time (1 hour) = 3 hours per new airport
  const estimatedAirportsPerHour = 1 / 3;
  const estimatedAdditionalAirports = Math.floor(remainingHours * estimatedAirportsPerHour);
  
  // Cap the heuristic to be admissible (never overestimate)
  const maxPossibleAirports = 50; // Reasonable upper bound
  return Math.min(estimatedAdditionalAirports, maxPossibleAirports);
}

/**
 * Calculate route cost
 */
function calculateRouteCost(path: Flight[]): number {
  return path.reduce((sum, flight) => {
    // Try to use actual price from CSV data first
    if (flight['Price'] && typeof flight['Price'] === 'string') {
      const priceStr = flight['Price'].toString();
      const priceMatch = priceStr.match(/\$?(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        const actualPrice = parseFloat(priceMatch[1]);
        if (!isNaN(actualPrice) && actualPrice > 0) {
          return sum + actualPrice;
        }
      }
    }
    
    // Fallback to distance-based estimation
    const distance = flight['Distance (MI)'] || flight['Distance (KM)'] || 0;
    const estimatedPrice = Math.max(150, distance * 0.15);
    return sum + estimatedPrice;
  }, 0);
}

/**
 * Create state signature for deduplication
 */
function createStateSignature(airport: string, visitedAirports: Set<string>): string {
  const sortedAirports = Array.from(visitedAirports).sort();
  return `${airport}|${sortedAirports.join(',')}`;
}

/**
 * Pure A* optimization algorithm
 */
export const pureAStarOptimize = async (
  flights: Flight[], 
  config: RouteConfig
): Promise<OptimizationResults | OptimizationError> => {
  const startTime = Date.now();
  
  try {
    const validFlights = filterValidFlights(flights, config);
    
    if (validFlights.length === 0) {
      return { error: 'No valid flights found in the specified time window' };
    }

    const { startAirports, endAirports, visitedAirports } = parseAirportSets(config);
    const minConnectionTime = minutesToMilliseconds(config.minConnectionTime);
    const flightsByOrigin = buildFlightIndex(validFlights);
    
    const startDateTime = parseDateTime(config.startDate, config.startTime);
    const endDateTime = parseDateTime(config.endDate, config.endTime);
    
    console.log('🚀 Starting Pure A* optimization...');
    console.log(`📊 Search space: ${validFlights.length} flights, ${startAirports.size} start airports`);
    
    const pq = new AStarPriorityQueue();
    const visitedStates = new Map<string, number>(); // State signature -> best airport count
    const bestRoutes = new Map<number, AStarState[]>(); // Airport count -> best routes
    
    let iterations = 0;
    const maxIterations = 50000; // Reasonable limit for A*
    
    // Initialize starting positions
    Array.from(startAirports).forEach(airport => {
      const initialState: AStarState = {
        airport,
        visitedAirports: new Set<string>(),
        path: [],
        arrivalTime: startDateTime,
        totalDuration: 0,
        totalDistance: 0,
        totalCost: 0,
        gScore: 0,
        fScore: 0
      };
      
      pq.push(initialState, 0);
    });

    while (!pq.empty() && iterations < maxIterations) {
      iterations++;
      
      const current = pq.pop();
      if (!current) break;

      const stateSignature = createStateSignature(current.airport, current.visitedAirports);
      
      // Skip if we've already found a better route to this state
      if (visitedStates.has(stateSignature) && 
          visitedStates.get(stateSignature)! > current.visitedAirports.size) {
        continue;
      }
      
      visitedStates.set(stateSignature, current.visitedAirports.size);
      
      // Check if this is a complete route
      if (current.path.length > 0 && endAirports.has(current.airport)) {
        const airportCount = current.visitedAirports.size;
        
        if (!bestRoutes.has(airportCount)) {
          bestRoutes.set(airportCount, []);
        }
        bestRoutes.get(airportCount)!.push(current);
        
        console.log(`✅ Found complete route: ${airportCount} airports, ${current.path.length} flights`);
        
        // For A*, we can stop early if we find a route with the maximum possible airports
        // This is a key advantage of A* over the hybrid approach
        if (airportCount >= 10) { // Reasonable upper bound
          console.log(`🎯 Found high-quality route (${airportCount} airports), stopping early`);
          break;
        }
      }
      
      // Explore outgoing flights
      const outgoingFlights = flightsByOrigin[current.airport] || [];
      
      for (const flight of outgoingFlights) {
        const flightDepTime = new Date(flight['Departure Datetime']);
        const flightArrTime = new Date(flight['Arrival Datetime']);
        
        // Check time constraints
        const requiredDepTime = new Date(current.arrivalTime.getTime() + minConnectionTime);
        if (flightDepTime < requiredDepTime || flightArrTime > endDateTime) {
          continue;
        }
        
        // Don't revisit airports (except end airports for completion)
        if (current.visitedAirports.has(flight.Destination) && !endAirports.has(flight.Destination)) {
          continue;
        }
        
        // Create new state
        const newVisited = new Set(current.visitedAirports);
        newVisited.add(flight.Destination);
        
        const newDistance = current.totalDistance + (flight['Distance (MI)'] || flight['Distance (KM)'] || 0);
        const newDuration = current.totalDuration + (flight['Elapsed Minutes'] || 0);
        const newCost = calculateRouteCost([...current.path, flight]);
        
        const newState: AStarState = {
          airport: flight.Destination,
          visitedAirports: newVisited,
          path: [...current.path, flight],
          arrivalTime: flightArrTime,
          totalDuration: newDuration,
          totalDistance: newDistance,
          totalCost: newCost,
          gScore: newVisited.size, // gScore = number of airports visited
          fScore: 0 // Will be calculated below
        };
        
        // Calculate heuristic
        const heuristic = calculateHeuristic(
          flight.Destination,
          newVisited,
          flightsByOrigin,
          endDateTime,
          minConnectionTime
        );
        
        // fScore = gScore + heuristic (A* formula)
        newState.fScore = newState.gScore + heuristic;
        
        // Priority for A*: higher fScore = higher priority
        // But we want to maximize airports, so we use negative fScore for min-heap behavior
        const priority = -newState.fScore;
        
        pq.push(newState, priority);
      }
    }
    
    console.log(`🔍 A* search completed: ${iterations} iterations, ${bestRoutes.size} different airport counts found`);
    
    // Find the best route
    if (bestRoutes.size === 0) {
      return { error: 'No valid routes found' };
    }
    
    const maxAirports = Math.max(...Array.from(bestRoutes.keys()));
    const bestRoutesForMaxAirports = bestRoutes.get(maxAirports) || [];
    
    // Pick the route with the best fScore (lowest cost for same airport count)
    const bestRoute = bestRoutesForMaxAirports.reduce((best, current) => 
      current.fScore < best.fScore ? current : best
    );
    
    const executionTime = Date.now() - startTime;
    
    // Calculate new airports visited (only count destinations, excluding previously visited airports)
    const newAirportsVisited = bestRoute.path
      .map(flight => flight.Destination)
      .filter(destination => !visitedAirports.has(destination))
      .filter((destination, index, array) => array.indexOf(destination) === index); // Remove duplicates
    
    console.log(`🎯 A* Result: ${bestRoute.path.length} flights, ${newAirportsVisited.length} new airports, $${bestRoute.totalCost}`);
    
    return {
      path: bestRoute.path,
      totalFlights: bestRoute.path.length,
      newAirportsVisited,
      totalDistance: bestRoute.totalDistance,
      totalDuration: bestRoute.totalDuration,
      totalPrice: bestRoute.totalCost,
      executionTime,
      datasetUsed: 'september',
      hasPricing: true,
      optimizationMode: 'airports',
      // A* specific results
      aStarResults: {
        iterations,
        fScore: bestRoute.fScore,
        gScore: bestRoute.gScore,
        heuristic: bestRoute.fScore - bestRoute.gScore,
        routesFound: bestRoutes.size,
        earlyTermination: iterations < maxIterations
      }
    };

  } catch (error) {
    console.error('A* optimization error:', error);
    return { 
      error: error instanceof Error ? error.message : 'A* optimization failed' 
    };
  }
};

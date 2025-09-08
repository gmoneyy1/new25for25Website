import { Flight, RouteConfig, OptimizationResults, OptimizationError } from './types';
import { parseDateTime, minutesToMilliseconds } from './dateUtils';
import { kilometersToMiles } from './distanceUtils';

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
 * Calculate the total unique airports visited in a route (including start airport)
 * This ensures consistent airport counting throughout the algorithm
 */
function calculateUniqueAirports(path: Flight[]): Set<string> {
  const uniqueAirports = new Set<string>();
  path.forEach(flight => {
    uniqueAirports.add(flight.Origin);
    uniqueAirports.add(flight.Destination);
  });
  return uniqueAirports;
}

/**
 * Calculate the number of NEW airports visited (excluding already visited ones)
 * This is used for scoring routes - only NEW airports contribute to the score
 */
function calculateNewAirportsCount(path: Flight[], alreadyVisitedAirports: Set<string>): number {
  const uniqueAirports = calculateUniqueAirports(path);
  const newAirports = new Set<string>();
  
  uniqueAirports.forEach(airport => {
    if (!alreadyVisitedAirports.has(airport)) {
      newAirports.add(airport);
    }
  });
  
  return newAirports.size;
}

interface RouteState {
  airport: string;
  visitedAirports: Set<string>;
  path: Flight[];
  arrivalTime: Date;
  totalDuration: number;
  totalDistance: number;
  totalCost: number; // Add cost tracking
}

interface CostOptimizedRoute {
  path: Flight[];
  airports: Set<string>;
  totalCost: number;
  totalDuration: number;
  totalDistance: number;
  alternatives: RouteAlternative[];
}

interface RouteAlternative {
  path: Flight[];
  cost: number;
  duration: number;
  distance: number;
}

interface PriorityQueueItem {
  state: RouteState;
  priority: number;
}

class PriorityQueue {
  private items: PriorityQueueItem[] = [];

  push(state: RouteState, priority: number) {
    this.items.push({ state, priority });
    this.heapifyUp(this.items.length - 1);
  }

  pop(): RouteState | null {
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
      
      // Swap with parent
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

      // Swap with largest child
      [this.items[index], this.items[largest]] = [this.items[largest], this.items[index]];
      index = largest;
    }
  }
}

/**
 * Calculate route cost (placeholder - would integrate with pricing API)
 */
function calculateRouteCost(path: Flight[]): number {
  return path.reduce((sum, flight) => {
    // Try to use actual price from CSV data first
    if (flight['Price'] && typeof flight['Price'] === 'string') {
      const priceStr = flight['Price'].toString();
      // Parse prices like "$99", "$149.99", etc.
      const priceMatch = priceStr.match(/\$?(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        const actualPrice = parseFloat(priceMatch[1]);
        if (!isNaN(actualPrice) && actualPrice > 0) {
          return sum + actualPrice;
        }
      }
    }
    
    // Fallback to distance-based estimation if no price available
    const distance = flight['Distance (MI)'] || flight['Distance (KM)'] || 0;
    const estimatedPrice = Math.max(150, distance * 0.15);
    return sum + estimatedPrice;
  }, 0);
}

/**
 * A* Heuristic: Estimate maximum possible airports from current state
 * This guides the search toward more promising paths
 */
function calculateHeuristic(
  currentState: RouteState, 
  flightsByOrigin: Record<string, Flight[]>,
  endDateTime: Date,
  minConnectionTime: number
): number {
  const timeRemaining = endDateTime.getTime() - currentState.arrivalTime.getTime();
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  
  // Estimate how many more airports we could potentially visit
  // Assume average 3 hours per flight (departure + connection + arrival)
  const estimatedFlightsRemaining = Math.floor(hoursRemaining / 3);
  
  // Conservative estimate: we can visit at most this many more airports
  const maxAdditionalAirports = Math.max(0, estimatedFlightsRemaining);
  
  return currentState.visitedAirports.size + maxAdditionalAirports;
}

/**
 * Phase 1: True A* algorithm for route discovery
 * Uses intelligent heuristics to find optimal routes efficiently
 */
function findAllOptimalRoutes(flights: Flight[], config: RouteConfig): { routes: RouteState[]; iterations: number } {
  const { startAirports, endAirports, visitedAirports } = parseAirportSets(config);
  const minConnectionTime = minutesToMilliseconds(config.minConnectionTime);
  const flightsByOrigin = buildFlightIndex(flights);
  
  const targetAirportCount = config.targetAirportCount;
  const shouldFindTarget = targetAirportCount && targetAirportCount > 0;
  const shouldOptimizeForCost = config.optimizeForCost === true;
  
  console.log(`🎯 A* Algorithm: Finding optimal routes${shouldFindTarget ? ` with ${targetAirportCount} airports` : ' (maximum airports)'}${shouldOptimizeForCost ? ' (cost-optimized)' : ''}`);
  
  const routesByAirportCount = new Map<number, RouteState[]>();
  const bestRoutes = new Map<string, RouteState>(); // Key: airport-signature, Value: best route to this state
  const pq = new PriorityQueue();
  
  // Helper function for state signatures
  const setToSignature = (airports: Set<string>): string => {
    return Array.from(airports).sort().join('|');
  };
  
  const startDateTime = parseDateTime(config.startDate, config.startTime);
  const endDateTime = parseDateTime(config.endDate, config.endTime);
  
  // A* Priority function: f(n) = g(n) + h(n)
  // g(n) = actual cost (NEW airports visited), h(n) = heuristic estimate
  const calculateAStarPriority = (state: RouteState, flight: Flight): number => {
    // FIXED: Count only NEW airports visited (exclude already visited ones)
    const newAirportCount = calculateNewAirportsCount([...state.path, flight], visitedAirports);
    const cost = state.totalCost + (parseFloat(flight.Price || '0') || 0);
    
    // g(n): NEW airports visited (higher is better) - this is what really matters for scoring
    const actualCost = newAirportCount * 1000;
    
    // h(n): Heuristic estimate of remaining airports
    const heuristic = calculateHeuristic(state, flightsByOrigin, endDateTime, minConnectionTime);
    
    // f(n) = g(n) + h(n) - but we want higher priority for better routes
    let priority = actualCost + heuristic * 100;
    
    if (shouldOptimizeForCost) {
      // For cost optimization, add cost penalty only when we have enough NEW airports
      if (shouldFindTarget && newAirportCount >= targetAirportCount) {
        priority -= cost / 100; // Small cost penalty
      }
    }
    
    return priority;
  };

  // Initialize starting positions
  Array.from(startAirports).forEach(airport => {
    const initialState: RouteState = {
      airport,
      visitedAirports: new Set([...visitedAirports, airport]), // FIXED: Initialize with already visited airports + start airport
      path: [],
      arrivalTime: startDateTime,
      totalDuration: 0,
      totalDistance: 0,
      totalCost: 0
    };
    
    // Use A* heuristic for initial priority
    const initialHeuristic = calculateHeuristic(initialState, flightsByOrigin, endDateTime, minConnectionTime);
    pq.push(initialState, initialHeuristic * 100);
  });

  let iterations = 0;
  let bestAirportCount = 0;
  let noImprovementCount = 0;
  const maxNoImprovement = 5000; // Stop if no improvement for 5000 iterations

  while (!pq.empty()) {
    iterations++;
    
    // Early termination: stop if no improvement for too long
    if (iterations > 1000 && noImprovementCount > maxNoImprovement) {
      console.log(`🛑 Early termination: No improvement for ${maxNoImprovement} iterations. Best found: ${bestAirportCount} airports`);
      break;
    }
    
    // Memory management every 2000 iterations
    if (iterations % 2000 === 0) {
      const memoryUsage = {
        queueSize: pq.length,
        bestRoutes: bestRoutes.size,
        routesByAirportCount: routesByAirportCount.size,
        bestAirportCount
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 A* Progress at iteration ${iterations}:`, memoryUsage);
      }
      
      // Smart memory management: keep only the best routes
      if (bestRoutes.size > 50000) {
        console.warn(`Memory optimization: ${bestRoutes.size} states, pruning worst 50%`);
        const sortedEntries = Array.from(bestRoutes.entries())
          .sort((a, b) => b[1].visitedAirports.size - a[1].visitedAirports.size);
        
        bestRoutes.clear();
        // Keep only the top 50% of routes
        for (let i = 0; i < Math.floor(sortedEntries.length / 2); i++) {
          bestRoutes.set(sortedEntries[i][0], sortedEntries[i][1]);
        }
      }
    }
    
    const current = pq.pop();
    if (!current) break;

    const signature = setToSignature(current.visitedAirports);
    const stateKey = `${current.airport}-${signature}`;
    
    // A* Pruning: Only explore if this is better than what we've seen before
    const existingBest = bestRoutes.get(stateKey);
    if (existingBest && existingBest.visitedAirports.size >= current.visitedAirports.size) {
      continue; // Skip if we already have a better or equal route to this state
    }
    
    // Update best route to this state
    bestRoutes.set(stateKey, current);
    
    // Track improvement for early termination - FIXED: Use NEW airports count
    const currentNewAirports = calculateNewAirportsCount(current.path, visitedAirports);
    if (currentNewAirports > bestAirportCount) {
      bestAirportCount = currentNewAirports;
      noImprovementCount = 0;
      console.log(`🎯 New best: ${bestAirportCount} NEW airports at iteration ${iterations} (total: ${current.visitedAirports.size})`);
    } else {
      noImprovementCount++;
    }

    // Check if this is a complete route
    if (current.path.length > 0 && endAirports.has(current.airport)) {
      const airportCount = current.visitedAirports.size;
      
      // Store complete routes by airport count
      if (!routesByAirportCount.has(airportCount)) {
        routesByAirportCount.set(airportCount, []);
      }
      routesByAirportCount.get(airportCount)!.push(current);
      
      // Continue exploring - A* will naturally find optimal routes
    }
    
    // A* naturally explores optimal paths without complex heuristics
    
    // Explore outgoing flights - A* will prioritize the most promising ones
    const outgoingFlights = flightsByOrigin[current.airport] || [];
    
    for (const flight of outgoingFlights) {
      const flightDepTime = new Date(flight['Departure Datetime']);
      let flightArrTime = new Date(flight['Arrival Datetime']);
      
      // Basic time constraints
      const requiredDepTime = new Date(current.arrivalTime.getTime() + minConnectionTime);
      if (flightDepTime < requiredDepTime || flightArrTime > endDateTime) {
        continue;
      }
      
      // Handle overnight flights
      if (flightArrTime.getTime() < flightDepTime.getTime()) {
        const durationMinutes = flight['Elapsed Minutes'] || 0;
        if (durationMinutes > 60) {
          flightArrTime = new Date(flightArrTime);
          flightArrTime.setDate(flightArrTime.getDate() + 1);
        } else {
          continue; // Invalid flight
        }
      }
      
      // Basic flight duration validation
      const flightDuration = (flightArrTime.getTime() - flightDepTime.getTime()) / (1000 * 60);
      if (flightDuration > 12 * 60) { // 12 hours max
        continue;
      }
      
      // A* pruning: avoid revisiting airports (except for completion)
      if (current.path.length > 0) {
        if (current.visitedAirports.has(flight.Destination) && !endAirports.has(flight.Destination)) {
          continue; // Skip flights to already visited airports (except end airports)
        }
        
        // Allow returning to end airports for completion
        if (current.path.length > 2 && endAirports.has(flight.Destination)) {
          const timeRemaining = endDateTime.getTime() - flightArrTime.getTime();
          if (timeRemaining > 2 * 60 * 60 * 1000) { // 2 hours
            continue; // Still have time for more flights
          }
        }
      }
      
      const newVisited = new Set(current.visitedAirports);
      // FIXED: Always add destination to visited set (whether new or already visited)
      newVisited.add(flight.Destination);

      const newDistance = current.totalDistance + (flight['Distance (MI)'] || flight['Distance (KM)'] || 0);
      const newDuration = current.totalDuration + (flight['Elapsed Minutes'] || 0);
      const newCost = calculateRouteCost([...current.path, flight]);

      const newState: RouteState = {
        airport: flight.Destination,
        visitedAirports: newVisited,
        path: [...current.path, flight],
        arrivalTime: flightArrTime,
        totalDuration: newDuration,
        totalDistance: newDistance,
        totalCost: newCost
      };
      
      // Use A* priority function
      const priority = calculateAStarPriority(newState, flight);
      pq.push(newState, priority);
    }
  }

  // Return routes with target airport count (or maximum if no target specified)
  if (routesByAirportCount.size === 0) {
    return { routes: [], iterations };
  }

  // CRITICAL FIX: Post-process all routes to ensure they are complete loops
  const completeRoutesByAirportCount = new Map<number, RouteState[]>();
  
  for (const [airportCount, routes] of Array.from(routesByAirportCount.entries())) {
    const completeRoutes = routes.filter((route: RouteState) => {
      // FIXED: Consistent route validation for all cases
      // Safety check: ensure route has flights
      if (!route.path || route.path.length === 0) {
        console.log(`🚫 Filtering out empty route: ${route.visitedAirports.size} airports, ${route.path?.length || 0} flights`);
        return false;
      }
      
      // Use consistent validation logic for all cases
      const firstOrigin = route.path[0].Origin;
      const lastDestination = route.path[route.path.length - 1].Destination;
      
      // Route must start at a start airport and end at an end airport
      const isComplete = startAirports.has(firstOrigin) && endAirports.has(lastDestination);
      
      if (!isComplete) {
        console.log(`🚫 Filtering out incomplete route: ${route.visitedAirports.size} airports, ${route.path.length} flights (starts at ${route.path[0].Origin}, ends at ${route.path[route.path.length - 1].Destination})`);
      }
      return isComplete;
    });
    
    if (completeRoutes.length > 0) {
      completeRoutesByAirportCount.set(airportCount, completeRoutes);
    }
  }
  
  if (completeRoutesByAirportCount.size === 0) {
    console.log(`❌ No complete routes found after filtering`);
    return { routes: [], iterations };
  }

  if (shouldFindTarget) {
    // CRITICAL FIX: Return routes with target count, not maximum
    const targetRoutes = completeRoutesByAirportCount.get(targetAirportCount);
    if (targetRoutes && targetRoutes.length > 0) {
      if (shouldOptimizeForCost) {
        // CRITICAL FIX: When optimizing for cost, pick the CHEAPEST route with target count
        const cheapestRoute = targetRoutes.reduce((cheapest, current) => 
          current.totalCost < cheapest.totalCost ? current : cheapest
        );
        console.log(`🎯 Found ${targetRoutes.length} complete routes with exactly ${targetAirportCount} airports, selected cheapest: $${cheapestRoute.totalCost}`);
        return { routes: [cheapestRoute], iterations };
      } else {
        console.log(`🎯 Found ${targetRoutes.length} complete routes with exactly ${targetAirportCount} airports`);
        return { routes: targetRoutes, iterations };
      }
    } else {
      console.log(`⚠️ No complete routes found with exactly ${targetAirportCount} airports, looking for closest match`);
      // Find closest match
      let closestCount = 0;
      let minDistance = Infinity;
      
      for (const [count, routes] of Array.from(completeRoutesByAirportCount.entries())) {
        const distance = Math.abs(count - targetAirportCount);
        if (distance < minDistance) {
          minDistance = distance;
          closestCount = count;
        }
      }
      
      if (closestCount > 0) {
        const closestRoutes = completeRoutesByAirportCount.get(closestCount) || [];
        if (shouldOptimizeForCost) {
          // Pick cheapest route with closest count
          const cheapestRoute = closestRoutes.reduce((cheapest, current) => 
            current.totalCost < cheapest.totalCost ? current : cheapest
          );
          console.log(`🎯 Using closest match: cheapest complete route with ${closestCount} airports (target was ${targetAirportCount}), cost: $${cheapestRoute.totalCost}`);
          return { routes: [cheapestRoute], iterations };
        } else {
          console.log(`🎯 Using closest match: ${closestRoutes.length} complete routes with ${closestCount} airports (target was ${targetAirportCount})`);
          return { routes: closestRoutes, iterations };
        }
      }
    }
  }
  
  // Fallback: Return routes with maximum airport count (original behavior)
  const maxAirports = Math.max(...Array.from(completeRoutesByAirportCount.keys()));
  const maxRoutes = completeRoutesByAirportCount.get(maxAirports) || [];
  console.log(`🎯 No target specified, returning ${maxRoutes.length} complete routes with maximum ${maxAirports} airports`);
  return { routes: maxRoutes, iterations };
}

/**
 * Find valid connecting flights between two airports within time window
 */
function findConnectingFlights(
  from: string, 
  to: string, 
  flights: Flight[], 
  earliestDeparture: Date, 
  latestArrival: Date,
  minConnectionTime: number
): Flight[] {
  return flights.filter(flight => {
    if (flight.Origin !== from || flight.Destination !== to) return false;
    
    const depTime = new Date(flight['Departure Datetime']);
    const arrTime = new Date(flight['Arrival Datetime']);
    
    return depTime >= new Date(earliestDeparture.getTime() + minConnectionTime) && 
           arrTime <= latestArrival;
  });
}

/**
 * Phase 2: Find alternative routes with same airport count but potentially different airports
 * This is more realistic than trying to reorder the same airports
 */
function findCheapestAlternatives(
  targetRoute: RouteState,
  flights: Flight[],
  config: RouteConfig
): CostOptimizedRoute {
  const { startAirports, endAirports } = parseAirportSets(config);
  const targetAirportCount = targetRoute.visitedAirports.size;
  const minConnectionTime = minutesToMilliseconds(config.minConnectionTime);
  
  console.log(`🔧 Phase 2: Looking for alternative routes with ${targetAirportCount} airports`);
  
  // Instead of trying to reorder the same airports, let's find different routes
  // that visit the same number of airports but potentially different ones
  
  const startDateTime = parseDateTime(config.startDate, config.startTime);
  const endDateTime = parseDateTime(config.endDate, config.endTime);
  
  // Build flight index for efficient lookup
  const flightsByOrigin = buildFlightIndex(flights);
  
  // Find all possible airports we could visit
  const allPossibleAirports = new Set<string>();
  flights.forEach(flight => {
    allPossibleAirports.add(flight.Origin);
    allPossibleAirports.add(flight.Destination);
  });
  
  console.log(`🔍 Found ${allPossibleAirports.size} possible airports to visit`);
  
  // Use a simpler approach: try to find routes with the same airport count
  // but allow different airports (more realistic)
  
  const alternativeRoutes: Array<{
    path: Flight[];
    cost: number;
    duration: number;
    distance: number;
    airports: Set<string>;
  }> = [];
  
  // Try a few different starting points to find alternatives
  const maxAttempts = 50; // Increased from 20 to find more alternatives
  let attempts = 0;
  
  // Try multiple starting airports to increase diversity
  const startAirportsArray = Array.from(startAirports);
  const maxStartAirportAttempts = Math.min(5, startAirportsArray.length); // Try up to 5 different starting airports
  
  console.log(`🔍 Starting search for alternatives with ${maxStartAirportAttempts} starting airports, max ${maxAttempts} total attempts`);
  
  for (let startAirportIndex = 0; startAirportIndex < maxStartAirportAttempts; startAirportIndex++) {
    if (attempts >= maxAttempts) break;
    
    const startAirport = startAirportsArray[startAirportIndex];
    console.log(`📍 Trying starting airport ${startAirport} (attempt ${startAirportIndex + 1}/${maxStartAirportAttempts})`);
    
    // Try multiple attempts from each starting airport
    for (let attemptFromAirport = 0; attemptFromAirport < 10; attemptFromAirport++) {
      if (attempts >= maxAttempts) break;
      
      // Try to build a route starting from this airport
      const { visitedAirports: configVisitedAirports } = parseAirportSets(config); // FIXED: Get already visited airports
      const route = buildAlternativeRoute(
        startAirport,
        targetAirportCount,
        flightsByOrigin,
        startDateTime,
        endDateTime,
        minConnectionTime,
        allPossibleAirports,
        endAirports,
        attempts + (startAirportIndex * 1000) + (attemptFromAirport * 100), // More diverse seed
        configVisitedAirports // FIXED: Pass already visited airports
      );
      
      if (route && route.path.length > 0) {
        // CRITICAL FIX: Validate route completeness before accepting
        const uniqueAirports = calculateUniqueAirports(route.path);
        
        const isComplete = route.path.length > 0 && 
                          route.path[0].Origin === startAirport && 
                          endAirports.has(route.path[route.path.length - 1].Destination);
        
        const hasCorrectAirportCount = uniqueAirports.size === targetAirportCount;
        
        if (isComplete && hasCorrectAirportCount) {
          const cost = calculateRouteCost(route.path);
          const duration = route.path.reduce((sum: number, flight: Flight) => sum + (flight['Elapsed Minutes'] || 0), 0);
          const distance = route.path.reduce((sum: number, flight: Flight) => sum + (flight['Distance (MI)'] || 0), 0);
          
          // Only add if it's different from the original route
          const isDifferent = !arraysEqual(route.path, targetRoute.path);
          
          console.log(`🔍 Route attempt ${attempts}: airports=${uniqueAirports.size}, cost=$${cost}, different=${isDifferent}`);
          
          if (isDifferent) {
            alternativeRoutes.push({
              path: route.path,
              cost,
              duration,
              distance,
              airports: uniqueAirports
            });
            
            console.log(`✅ Found valid alternative route (attempt ${attempts}): ${uniqueAirports.size} airports, $${cost}, ${duration}min, complete loop`);
          } else {
            console.log(`⚠️ Route is identical to original, skipping (attempt ${attempts})`);
          }
        } else {
          console.log(`⚠️ Rejected incomplete route (attempt ${attempts}): airports=${uniqueAirports.size}/${targetAirportCount}, complete=${isComplete}`);
        }
      }
      
      attempts++;
    }
  }
  
  console.log(`🔍 Search complete: found ${alternativeRoutes.length} alternative routes out of ${attempts} attempts`);
  
  // If we found alternatives, pick the cheapest one
  if (alternativeRoutes.length > 0) {
    // Sort by cost
    alternativeRoutes.sort((a, b) => a.cost - b.cost);
    const cheapestAlternative = alternativeRoutes[0];
    
    console.log(`💰 Found ${alternativeRoutes.length} alternative routes. Cheapest: $${cheapestAlternative.cost}`);
    
    return {
      path: cheapestAlternative.path,
      airports: cheapestAlternative.airports,
      totalCost: cheapestAlternative.cost,
      totalDuration: cheapestAlternative.duration,
      totalDistance: cheapestAlternative.distance,
      alternatives: alternativeRoutes.slice(1, 5).map(route => ({
        path: route.path,
        cost: route.cost,
        duration: route.duration,
        distance: route.distance
      }))
    };
  }
  
  // No alternatives found, return original route
  console.log(`⚠️ No alternative routes found, using original route`);
  
  // CRITICAL FIX: Validate that the original route is also complete
  const originalUniqueAirports = new Set<string>();
  targetRoute.path.forEach(flight => {
    originalUniqueAirports.add(flight.Origin);
    originalUniqueAirports.add(flight.Destination);
  });
  
  const isOriginalComplete = targetRoute.path.length > 0 && 
                            targetRoute.path[0].Origin === Array.from(parseAirportSets(config).startAirports)[0] && 
                            targetRoute.path[targetRoute.path.length - 1].Destination === Array.from(parseAirportSets(config).startAirports)[0];
  
  if (!isOriginalComplete) {
    console.log(`❌ CRITICAL: Original route is incomplete! Cannot return valid result.`);
    // Return a minimal valid route instead
    return {
      path: [],
      airports: new Set<string>(),
      totalCost: 0,
      totalDuration: 0,
      totalDistance: 0,
      alternatives: []
    };
  }
  
  return {
    path: targetRoute.path,
    airports: originalUniqueAirports,
    totalCost: calculateRouteCost(targetRoute.path),
    totalDuration: targetRoute.totalDuration,
    totalDistance: targetRoute.totalDistance,
    alternatives: []
  };
}

/**
 * Build an alternative route with the target number of airports
 * MUST return to starting airport to be a valid route
 * Now with randomization to find different routes
 */
function buildAlternativeRoute(
  startAirport: string,
  targetAirportCount: number,
  flightsByOrigin: Record<string, Flight[]>,
  startDateTime: Date,
  endDateTime: Date,
  minConnectionTime: number,
  allPossibleAirports: Set<string>,
  endAirports: Set<string>,
  attemptNumber: number = 0, // Add attempt number for randomization
  alreadyVisitedAirports: Set<string> = new Set() // FIXED: Add parameter for already visited airports
): { path: Flight[]; visitedAirports: Set<string> } | null {
  const path: Flight[] = [];
  const visitedAirports = new Set([...alreadyVisitedAirports]); // FIXED: Initialize with already visited airports
  let currentAirport = startAirport;
  let currentTime = startDateTime;
  
  // Add starting airport
  visitedAirports.add(startAirport);
  
  // Use different strategies based on attempt number to force diversity
  const strategy = attemptNumber % 3; // 3 different strategies
  
  // Try to build a route with the target number of airports
  while (visitedAirports.size < targetAirportCount && path.length < targetAirportCount * 2) {
    const availableFlights = flightsByOrigin[currentAirport] || [];
    
    // Find flights to new airports
    const validNewAirportFlights: Flight[] = [];
    
    for (const flight of availableFlights) {
      const depTime = new Date(flight['Departure Datetime']);
      const arrTime = new Date(flight['Arrival Datetime']);
      
      // Check time constraints
      if (depTime < new Date(currentTime.getTime() + minConnectionTime)) continue;
      if (arrTime > endDateTime) continue;
      
      // Check if destination is a new airport
      if (!visitedAirports.has(flight.Destination)) {
        validNewAirportFlights.push(flight);
      }
    }
    
    let nextFlight: Flight | null = null;
    
    if (validNewAirportFlights.length > 0) {
      // DIFFERENT STRATEGIES: Use different approaches to pick flights
      if (strategy === 0) {
        // Strategy 0: Random with shuffling
        const shuffledFlights = shuffleArray(validNewAirportFlights, attemptNumber);
        const randomIndex = (attemptNumber + path.length) % shuffledFlights.length;
        nextFlight = shuffledFlights[randomIndex];
      } else if (strategy === 1) {
        // Strategy 1: Pick flights with different departure times
        const sortedByTime = validNewAirportFlights.sort((a, b) => {
          const timeA = new Date(a['Departure Datetime']).getTime();
          const timeB = new Date(b['Departure Datetime']).getTime();
          return (attemptNumber % 2 === 0) ? timeA - timeB : timeB - timeA; // Alternate between earliest and latest
        });
        const index = (attemptNumber + path.length) % sortedByTime.length;
        nextFlight = sortedByTime[index];
      } else {
        // Strategy 2: Pick flights with different distances
        const sortedByDistance = validNewAirportFlights.sort((a, b) => {
          const distA = a['Distance (MI)'] || 0;
          const distB = b['Distance (MI)'] || 0;
          return (attemptNumber % 2 === 0) ? distA - distB : distB - distA; // Alternate between shortest and longest
        });
        const index = (attemptNumber + path.length) % sortedByDistance.length;
        nextFlight = sortedByDistance[index];
      }
    } else {
      // No more flights to new airports, try to return to start
      const returnFlights: Flight[] = [];
      
      for (const flight of availableFlights) {
        const depTime = new Date(flight['Departure Datetime']);
        const arrTime = new Date(flight['Arrival Datetime']);
        
        if (depTime < new Date(currentTime.getTime() + minConnectionTime)) continue;
        if (arrTime > endDateTime) continue;
        
        if (flight.Destination === startAirport) {
          returnFlights.push(flight);
        }
      }
      
      if (returnFlights.length > 0) {
        // RANDOMIZATION: Pick random return flight
        const shuffledReturnFlights = shuffleArray(returnFlights, attemptNumber);
        const randomIndex = attemptNumber % shuffledReturnFlights.length;
        nextFlight = shuffledReturnFlights[randomIndex];
      } else {
        break; // Can't continue
      }
    }
    
    if (!nextFlight) break;
    
    path.push(nextFlight);
    visitedAirports.add(nextFlight.Destination);
    currentAirport = nextFlight.Destination;
    currentTime = new Date(nextFlight['Arrival Datetime']);
    
    // If we've returned to an end airport and have enough airports, we're done
    if (endAirports.has(currentAirport) && visitedAirports.size >= targetAirportCount) {
      break;
    }
  }
  
  // CRITICAL FIX: Ensure route returns to an end airport
  if (!endAirports.has(currentAirport)) {
    // Try to find a flight back to any end airport
    const returnFlights = flightsByOrigin[currentAirport] || [];
    let returnFlight: Flight | null = null;
    
    for (const flight of returnFlights) {
      const depTime = new Date(flight['Departure Datetime']);
      const arrTime = new Date(flight['Arrival Datetime']);
      
      if (depTime < new Date(currentTime.getTime() + minConnectionTime)) continue;
      if (arrTime > endDateTime) continue;
      if (endAirports.has(flight.Destination)) {
        returnFlight = flight;
        break;
      }
    }
    
    if (returnFlight) {
      path.push(returnFlight);
      // Don't add end airport to visitedAirports again if already there
    } else {
      // Cannot complete the route - return null
      console.log(`⚠️ Cannot complete route: no flight from ${currentAirport} back to any end airport`);
      return null;
    }
  }
  
  // Validate the route is complete and has the right number of airports
  const uniqueAirports = calculateUniqueAirports(path);
  
  // Check if route is complete (starts at start airport and ends at any end airport)
  const isComplete = path.length > 0 && 
                    path[0].Origin === startAirport && 
                    endAirports.has(path[path.length - 1].Destination);
  
  // Check if we have the right number of unique airports
  const hasCorrectAirportCount = uniqueAirports.size === targetAirportCount;
  
  if (isComplete && hasCorrectAirportCount && path.length > 0) {
    console.log(`✅ Built complete route (attempt ${attemptNumber}, strategy ${strategy}): ${uniqueAirports.size} airports, ${path.length} flights, starts at ${startAirport}, ends at ${path[path.length - 1].Destination}`);
    return { path, visitedAirports: uniqueAirports };
  } else {
    console.log(`❌ Route validation failed (attempt ${attemptNumber}, strategy ${strategy}): complete=${isComplete}, airports=${uniqueAirports.size}/${targetAirportCount}, path length=${path.length}`);
    return null;
  }
}

/**
 * Check if two arrays are equal
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Validate that a route forms a complete loop back to starting airport
 */
function validateRouteCompletion(path: Flight[], startAirports: Set<string>, endAirports?: Set<string>): boolean {
  if (path.length === 0) return false;
  
  const firstOrigin = path[0].Origin;
  const lastDestination = path[path.length - 1].Destination;
  
  // Route must start at a start airport
  const startsAtStartAirport = startAirports.has(firstOrigin);
  
  // Route must end at an end airport (if provided) or start airport (for backward compatibility)
  const endsAtValidAirport = endAirports ? endAirports.has(lastDestination) : startAirports.has(lastDestination);
  
  console.log(`🔍 Route validation: starts at ${firstOrigin}, ends at ${lastDestination}, starts valid: ${startsAtStartAirport}, ends valid: ${endsAtValidAirport}`);
  
  return startsAtStartAirport && endsAtValidAirport;
}

/**
 * Shuffle an array to increase randomization
 */
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Build a route for a specific permutation of airports
 */
function buildRouteForPermutation(
  startAirport: string,
  airportOrder: string[],
  endAirport: string,
  flights: Flight[],
  startTime: Date,
  endTime: Date,
  minConnectionTime: number
): Flight[] | null {
  const route: Flight[] = [];
  let currentAirport = startAirport;
  let currentTime = startTime;

  // Visit each airport in order
  for (const targetAirport of airportOrder) {
    const connectingFlights = findConnectingFlights(
      currentAirport,
      targetAirport,
      flights,
      currentTime,
      endTime,
      minConnectionTime
    );

    if (connectingFlights.length === 0) {
      return null; // No valid connection
    }

    // Pick the earliest valid flight (already filtered by connection time constraints)
    const selectedFlight = connectingFlights.reduce((earliest, flight) => {
      const depTime = new Date(flight['Departure Datetime']);
      const earliestDepTime = new Date(earliest['Departure Datetime']);
      return depTime < earliestDepTime ? flight : earliest;
    });

    // Validate that selected flight departs after current time with minimum connection
    const selectedDepTime = new Date(selectedFlight['Departure Datetime']);
    const minDepTime = new Date(currentTime.getTime() + minConnectionTime);
    
    if (selectedDepTime < minDepTime) {
      console.error(`❌ CRITICAL: Selected flight ${selectedFlight['Flight Number']} departs at ${selectedDepTime.toISOString().slice(11,19)} but current time is ${currentTime.toISOString().slice(11,19)} + ${minConnectionTime}min connection = ${minDepTime.toISOString().slice(11,19)}`);
      return null; // Invalid route - time travel detected
    }

    route.push(selectedFlight);
    currentAirport = targetAirport;
    currentTime = new Date(selectedFlight['Arrival Datetime']);
  }

  // Final connection to end airport if needed
  if (currentAirport !== endAirport) {
    const finalFlights = findConnectingFlights(
      currentAirport,
      endAirport,
      flights,
      currentTime,
      endTime,
      minConnectionTime
    );

    if (finalFlights.length === 0) {
      return null;
    }

    const finalFlight = finalFlights[0];
    route.push(finalFlight);
  }

  return route;
}

/**
 * Main hybrid optimization function
 */
export const hybridOptimizeRoute = async (
  flights: Flight[], 
  config: RouteConfig
): Promise<OptimizationResults | OptimizationError> => {
  const startTime = Date.now();
  
  try {
    const validFlights = filterValidFlights(flights, config);
    
    if (validFlights.length === 0) {
      return { error: 'No valid flights found in the specified time window' };
    }

    console.log('Phase 1: Finding routes with maximum airports...');
    const { routes: optimalRoutes, iterations } = findAllOptimalRoutes(validFlights, config);
    console.log(`Found ${optimalRoutes ? optimalRoutes.length : 0} optimal routes from Phase 1`);
    
    if (!optimalRoutes || optimalRoutes.length === 0) {
      return { error: 'No valid routes found with current settings' };
    }

    // Get the best route from Phase 1
    if (optimalRoutes.length === 0) {
      return { error: 'No valid routes found in Phase 1. Please try different parameters.' };
    }
    
    const bestRoute = optimalRoutes.reduce((best, current) => 
      current.visitedAirports.size > best.visitedAirports.size ? current : best
    );
    
    if (!bestRoute || !bestRoute.path || bestRoute.path.length === 0) {
      return { error: 'Best route is invalid or empty. Please try different parameters.' };
    }
    
    console.log(`Best route visits ${bestRoute.visitedAirports.size} airports, ${bestRoute.path.length} flights`);
    console.log(`Best route first few flights: ${bestRoute.path.slice(0, 3).map(f => f['Flight Number']).join(', ')}`);

    console.log('Phase 2: Finding cost-optimized alternatives...');
    const costOptimized = findCheapestAlternatives(bestRoute, validFlights, config);
    
    // Use the best route as cost optimized if Phase 2 fails
    const finalCostOptimized = (costOptimized && costOptimized.path && costOptimized.path.length > 0) 
      ? costOptimized 
      : {
          path: bestRoute.path,
          airports: bestRoute.visitedAirports,
          totalCost: calculateRouteCost(bestRoute.path),
          totalDuration: bestRoute.totalDuration,
          totalDistance: bestRoute.totalDistance,
          alternatives: []
        };

    // CRITICAL FIX: Validate both routes are complete before returning
    const bestRouteUniqueAirports = calculateUniqueAirports(bestRoute.path);
    
    const { startAirports: configStartAirports, endAirports: configEndAirports } = parseAirportSets(config);
    
    const isBestRouteComplete = bestRoute.path.length > 0 && 
                               configStartAirports.has(bestRoute.path[0].Origin) && 
                               configEndAirports.has(bestRoute.path[bestRoute.path.length - 1].Destination);
    
    const isCostOptimizedComplete = finalCostOptimized.path.length > 0 && 
                                   configStartAirports.has(finalCostOptimized.path[0].Origin) && 
                                   configEndAirports.has(finalCostOptimized.path[finalCostOptimized.path.length - 1].Destination);
    
    if (!isBestRouteComplete) {
      console.log(`❌ CRITICAL: Best route is incomplete!`);
      console.log(`Best route complete: ${isBestRouteComplete}`);
      return { error: 'Could not generate complete valid routes. Please try different parameters.' };
    }

    const executionTime = Date.now() - startTime;
    
    // Calculate NEW airports visited (only count destinations, excluding previously visited airports)
    const { visitedAirports: configVisitedAirports } = parseAirportSets(config);
    const newAirportsVisited = bestRoute.path
      .map(flight => flight.Destination)
      .filter(destination => !configVisitedAirports.has(destination))
      .filter((destination, index, array) => array.indexOf(destination) === index); // Remove duplicates

    console.log(`Final result: bestRoute has ${bestRoute.path.length} flights, costOptimized has ${finalCostOptimized.path.length} flights`);
    console.log(`Cost analysis: standardRoute=${calculateRouteCost(bestRoute.path)}, costOptimized=${finalCostOptimized.totalCost}, savings=${calculateRouteCost(bestRoute.path) - finalCostOptimized.totalCost}`);
    
    // Calculate total price for the main route
    const totalPrice = calculateRouteCost(bestRoute.path);
    
    return {
      path: bestRoute.path,
      totalFlights: bestRoute.path.length,
      newAirportsVisited,
      totalDistance: bestRoute.totalDistance,
      totalDuration: bestRoute.totalDuration,
      totalPrice,
      executionTime,
      datasetUsed: 'september', // Always using September data for hybrid optimization
      hasPricing: true,
      optimizationMode: 'airports',
      // Additional hybrid-specific results
      hybridResults: {
        standardRoute: {
          path: bestRoute.path,
          cost: calculateRouteCost(bestRoute.path),
          airportCount: bestRouteUniqueAirports.size,
          duration: bestRoute.totalDuration,
          distance: bestRoute.totalDistance,
          isValid: isBestRouteComplete,
          isComplete: isBestRouteComplete
        },
        costOptimizedRoute: {
          path: finalCostOptimized.path,
          cost: finalCostOptimized.totalCost,
          airportCount: finalCostOptimized.airports.size,
          duration: finalCostOptimized.totalDuration,
          distance: finalCostOptimized.totalDistance,
          savings: calculateRouteCost(bestRoute.path) - finalCostOptimized.totalCost,
          isValid: isCostOptimizedComplete,
          isComplete: isCostOptimizedComplete
        },
        alternatives: (finalCostOptimized.alternatives || []).map(alt => {
          // Validate each alternative route
          const altUniqueAirports = new Set<string>();
          alt.path.forEach(flight => {
            altUniqueAirports.add(flight.Origin);
            altUniqueAirports.add(flight.Destination);
          });
          
          const isAltComplete = alt.path.length > 0 && 
                               configStartAirports.has(alt.path[0].Origin) && 
                               configEndAirports.has(alt.path[alt.path.length - 1].Destination);
          
          return {
            path: alt.path,
            cost: alt.cost,
            duration: alt.duration,
            distance: kilometersToMiles(alt.distance),
            isValid: isAltComplete,
            isComplete: isAltComplete
          };
        })
      }
    };

  } catch (error) {
    console.error('Hybrid optimization error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Hybrid optimization failed' 
    };
  }
};
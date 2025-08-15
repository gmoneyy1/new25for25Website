/**
 * Web Worker for Route Optimization
 * Runs the A* algorithm in the background to prevent UI blocking
 */

// Import optimization logic (we'll need to duplicate some server logic here)
// Since workers can't import ES modules directly, we'll inline the logic

// Simple date parsing utility
function parseDateTime(dateTimeString) {
  return new Date(dateTimeString);
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Airport coordinates lookup (simplified version)
const airportCoordinates = {
  'JFK': { lat: 40.6413, lng: -73.7781 },
  'LGA': { lat: 40.7769, lng: -73.8740 },
  'EWR': { lat: 40.6895, lng: -74.1745 },
  'BOS': { lat: 42.3656, lng: -71.0096 },
  'DCA': { lat: 38.8512, lng: -77.0402 },
  'BWI': { lat: 39.1774, lng: -76.6684 },
  'LAX': { lat: 33.9416, lng: -118.4085 },
  'SFO': { lat: 37.6213, lng: -122.3790 },
  'ORD': { lat: 41.9742, lng: -87.9073 },
  'ATL': { lat: 33.6407, lng: -84.4277 },
  'MIA': { lat: 25.7959, lng: -80.2870 },
  'FLL': { lat: 26.0742, lng: -80.1506 },
  'MCO': { lat: 28.4312, lng: -81.3081 },
  'TPA': { lat: 27.9755, lng: -82.5332 },
  'BED': { lat: 42.4699, lng: -71.2893 },
  'HPN': { lat: 41.0672, lng: -73.7076 },
  'BDL': { lat: 41.9389, lng: -72.6832 },
  'PHL': { lat: 39.8744, lng: -75.2424 },
  'PIT': { lat: 40.4951, lng: -80.2387 },
  // Caribbean airports
  'SJU': { lat: 18.4394, lng: -66.0018 },
  'STI': { lat: 19.7570, lng: -70.5697 },
  'SDQ': { lat: 18.4297, lng: -69.6689 },
  'PUJ': { lat: 18.5674, lng: -68.3634 },
  'NAS': { lat: 25.0389, lng: -77.4661 },
  // Add more airports as needed
};

// Priority queue implementation for A*
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.items.shift()?.item;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

// A* optimization algorithm
function optimizeRouteWorker(flights, config) {
  const { startAirports, endAirports, visitedAirports, minConnectionTime, startDate, startTime, endDate, endTime } = config;
  
  // Parse configuration
  const startAirportList = startAirports.split(',').map(a => a.trim());
  const endAirportList = endAirports.split(',').map(a => a.trim());
  const visitedSet = new Set(visitedAirports.split(',').map(a => a.trim()).filter(Boolean));
  
  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);
  
  // Filter flights within time window
  const validFlights = flights.filter(flight => {
    const depTime = parseDateTime(flight['Departure Datetime']);
    return depTime >= startDateTime && depTime <= endDateTime;
  });
  
  if (validFlights.length === 0) {
    return { error: 'No flights available in the specified time window' };
  }
  
  // A* search
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  let iterations = 0;
  const MAX_ITERATIONS = 50000;
  
  // Initialize with starting airports
  startAirportList.forEach(airport => {
    const availableFlights = validFlights.filter(f => f.Origin === airport);
    availableFlights.forEach(flight => {
      const arrivalTime = parseDateTime(flight['Arrival Datetime']);
      
      openSet.enqueue({
        path: [flight],
        visitedAirports: new Set([...visitedSet, airport, flight.Destination]),
        currentAirport: flight.Destination,
        totalDistance: parseFloat(flight['Distance (KM)']),
        totalDuration: parseInt(flight['Elapsed Minutes']),
        arrivalTime: arrivalTime,
        score: calculateScore(1, visitedSet.size + 2, parseFloat(flight['Distance (KM)']), parseInt(flight['Elapsed Minutes']))
      }, calculateScore(1, visitedSet.size + 2, parseFloat(flight['Distance (KM)']), parseInt(flight['Elapsed Minutes'])));
    });
  });
  
  let bestSolution = null;
  let bestScore = -1;
  
  while (!openSet.isEmpty() && iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Report progress every 1000 iterations
    if (iterations % 1000 === 0) {
      self.postMessage({
        type: 'progress',
        iterations,
        maxIterations: MAX_ITERATIONS,
        bestScore,
        openSetSize: openSet.size()
      });
    }
    
    const current = openSet.dequeue();
    const stateKey = `${current.currentAirport}-${Array.from(current.visitedAirports).sort().join(',')}-${current.arrivalTime.getTime()}`;
    
    if (closedSet.has(stateKey)) continue;
    closedSet.add(stateKey);
    
    // Check if we've reached an end airport
    if (endAirportList.includes(current.currentAirport)) {
      const score = calculateScore(
        current.path.length,
        current.visitedAirports.size,
        current.totalDistance,
        current.totalDuration
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestSolution = {
          path: current.path,
          totalFlights: current.path.length,
          newAirportsVisited: Array.from(current.visitedAirports).filter(a => !visitedSet.has(a)),
          totalDistance: Math.round(current.totalDistance * 0.621371), // Convert km to miles
          totalDuration: current.totalDuration,
          iterations
        };
      }
      continue;
    }
    
    // Find connecting flights
    const connectingFlights = validFlights.filter(flight => {
      if (flight.Origin !== current.currentAirport) return false;
      
      const depTime = parseDateTime(flight['Departure Datetime']);
      const connectionTime = (depTime.getTime() - current.arrivalTime.getTime()) / (1000 * 60);
      
      return connectionTime >= minConnectionTime && connectionTime <= 1440; // Max 24 hours
    });
    
    connectingFlights.forEach(flight => {
      if (current.path.some(f => f['Flight Number'] === flight['Flight Number'])) return;
      
      const newVisitedAirports = new Set([...current.visitedAirports, flight.Destination]);
      const newPath = [...current.path, flight];
      const newDistance = current.totalDistance + parseFloat(flight['Distance (KM)']);
      const newDuration = current.totalDuration + parseInt(flight['Elapsed Minutes']);
      const arrivalTime = parseDateTime(flight['Arrival Datetime']);
      
      const score = calculateScore(
        newPath.length,
        newVisitedAirports.size,
        newDistance,
        newDuration
      );
      
      openSet.enqueue({
        path: newPath,
        visitedAirports: newVisitedAirports,
        currentAirport: flight.Destination,
        totalDistance: newDistance,
        totalDuration: newDuration,
        arrivalTime: arrivalTime,
        score: score
      }, -score); // Negative because PriorityQueue is min-heap
    });
  }
  
  if (!bestSolution) {
    return { error: 'No valid route found within the constraints' };
  }
  
  return bestSolution;
}

// Scoring function (same as server-side)
function calculateScore(numFlights, newAirports, totalDistance, totalDuration) {
  const newAirportWeight = 100;
  const flightPenalty = 5;
  const distancePenalty = 0.01;
  const durationPenalty = 0.1;
  
  return (newAirports * newAirportWeight) - 
         (numFlights * flightPenalty) - 
         (totalDistance * distancePenalty) - 
         (totalDuration * durationPenalty);
}

// Worker message handler
self.onmessage = function(e) {
  const { type, flights, config, id } = e.data;
  
  if (type === 'optimize') {
    try {
      const result = optimizeRouteWorker(flights, config);
      
      self.postMessage({
        type: 'result',
        id,
        result
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        id,
        error: error.message
      });
    }
  }
};
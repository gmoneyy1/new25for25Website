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
  'HYA': { lat: 41.6693, lng: -70.2803 },
  // Additional international airports found in CSV analysis
  'AUA': { lat: 12.5014, lng: -70.0152 }, // Aruba
  'BDA': { lat: 32.3640, lng: -64.6786 }, // Bermuda
  'BQN': { lat: 18.4949, lng: -67.1354 }, // Aguadilla, Puerto Rico
  'PSE': { lat: 18.0083, lng: -66.5630 }, // Ponce, Puerto Rico
  
  // Additional JetBlue destinations
  'BUF': { lat: 42.9405, lng: -78.7322 },
  'SYR': { lat: 43.1112, lng: -76.1063 },
  'LAS': { lat: 36.0840, lng: -115.1537 },
  'MSY': { lat: 29.9934, lng: -90.2581 },
  'RSW': { lat: 26.5362, lng: -81.7552 },
  'JAX': { lat: 30.4941, lng: -81.6879 },
  'SAV': { lat: 32.1276, lng: -81.2021 },
  'CHS': { lat: 32.8986, lng: -80.0405 },
  'RDU': { lat: 35.8776, lng: -78.7875 },
  'BTV': { lat: 44.4719, lng: -73.1533 },
  'PWM': { lat: 43.6462, lng: -70.3093 },
  'BGR': { lat: 44.8074, lng: -68.8281 },
  'ACK': { lat: 41.2532, lng: -70.0602 },
  'PVD': { lat: 41.7240, lng: -71.4281 },
  
  // International JetBlue destinations
  'CUN': { lat: 21.0365, lng: -86.8771 },
  'AMS': { lat: 52.3105, lng: 4.7683 },
  'CDG': { lat: 49.0097, lng: 2.5479 },
  'LHR': { lat: 51.4700, lng: -0.4543 },
  'LGW': { lat: 51.1481, lng: -0.1903 },
  'DUB': { lat: 53.4213, lng: -6.2701 },
  'EDI': { lat: 55.9500, lng: -3.3725 },
  'MAD': { lat: 40.4983, lng: -3.5676 },
  'LIR': { lat: 10.5933, lng: -85.5444 },
  'SJD': { lat: 23.1518, lng: -110.1003 },
  'SJO': { lat: 9.9939, lng: -84.2089 },
  'GUA': { lat: 14.5833, lng: -90.5275 },
  'SAP': { lat: 15.4526, lng: -87.9236 },
  'MDE': { lat: 6.1649, lng: -75.4231 },
  'CTG': { lat: 10.4424, lng: -75.5130 },
  'GEO': { lat: 6.4986, lng: -58.2541 },
  'GYE': { lat: -2.1574, lng: -79.8836 },
  'BZE': { lat: 17.5392, lng: -88.3082 },
  'CUR': { lat: 12.1889, lng: -68.9598 },
  'GND': { lat: 12.0042, lng: -61.7861 },
  'ANU': { lat: 17.1367, lng: -61.7928 },
  'BGI': { lat: 13.0746, lng: -59.4925 },
  'KIN': { lat: 17.9356, lng: -76.7875 },
  'MBJ': { lat: 18.5037, lng: -77.9134 },
  'POP': { lat: 19.7579, lng: -70.5700 },
  'POS': { lat: 10.5954, lng: -61.3372 },
  'SKB': { lat: 17.3112, lng: -62.7187 },
  'BON': { lat: 12.1314, lng: -68.2685 },
  'GCM': { lat: 19.2928, lng: -81.3577 },
  'HYA': { lat: 41.6693, lng: -70.2803 },
  'ORH': { lat: 42.2679, lng: -71.8757 },
  'PQI': { lat: 46.6891, lng: -68.0448 },
  'PSE': { lat: 18.0083, lng: -66.5630 },
  'SRQ': { lat: 27.3954, lng: -82.5544 },
  'BQN': { lat: 18.4949, lng: -67.1294 },
  'PLS': { lat: 21.7736, lng: -72.2659 },
  
  // Additional US destinations
  'ABQ': { lat: 35.0402, lng: -106.6091 },
  'ALB': { lat: 42.7483, lng: -73.8017 },
  'AUS': { lat: 30.1975, lng: -97.6664 },
  'AVL': { lat: 35.4362, lng: -82.5418 },
  'BNA': { lat: 36.1263, lng: -86.6774 },
  'BUR': { lat: 34.1975, lng: -118.3524 },
  'BZN': { lat: 45.7776, lng: -111.1601 },
  'CLE': { lat: 41.4117, lng: -81.8498 },
  'DFW': { lat: 42.8968, lng: -97.0380 },
  'DTW': { lat: 42.2162, lng: -83.3554 },
  'IAH': { lat: 29.9902, lng: -95.3368 },
  'ILM': { lat: 34.2706, lng: -77.9026 },
  'MKE': { lat: 42.9476, lng: -87.8966 },
  'ONT': { lat: 34.0559, lng: -117.6011 },
  'ORF': { lat: 36.8945, lng: -76.2012 },
  'PDX': { lat: 45.5898, lng: -122.5951 },
  'PHX': { lat: 33.4342, lng: -112.0116 },
  'RIC': { lat: 36.5052, lng: -77.3197 },
  'RNO': { lat: 39.4993, lng: -119.7681 },
  'ROC': { lat: 43.1190, lng: -77.6724 },
  'SLC': { lat: 40.7899, lng: -111.9791 },
  'SMF': { lat: 40.6955, lng: -121.5908 },
  'EYW': { lat: 24.5561, lng: -81.7596 },
  'ISP': { lat: 40.7952, lng: -73.1002 },
  'HYA': { lat: 41.6693, lng: -70.2803 }, // Hyannis, MA (US domestic)
  
  // Additional missing JetBlue destinations
  'AUA': { lat: 12.5014, lng: -70.0152 },
  'TQO': { lat: 18.1158, lng: -65.4224 }, // Taos, NM (US domestic)
  'SVD': { lat: 13.1443, lng: -61.2109 },
  'SXM': { lat: 18.0409, lng: -63.1089 },
  'STT': { lat: 18.3373, lng: -64.9734 },
  'STX': { lat: 17.7019, lng: -64.7986 },
  'TVC': { lat: 44.7414, lng: -85.5822 },
  'UVF': { lat: 13.7333, lng: -60.9526 },
  'YVR': { lat: 49.1967, lng: -123.1815 },
  'MHT': { lat: 42.9326, lng: -71.4357 },
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
  const visitedSet = new Set(
    visitedAirports && visitedAirports.trim() !== '' 
      ? visitedAirports.split(',').map(a => a.trim()).filter(a => a)
      : []
  );
  
  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);
  
  // Filter flights within time window
  const validFlights = flights.filter(flight => {
    const depTime = parseDateTime(flight['Departure Datetime']);
    return depTime >= startDateTime && depTime <= endDateTime;
  });
  
  if (validFlights.length === 0) {
    return { 
      error: 'No flights available in the specified time window. Try adjusting your dates or expanding the time range. Available data covers August 1 - December 31, 2025.' 
    };
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
    return { 
      error: 'No possible route found with your current settings. Try expanding your time window, reducing connection time, or adding more airports.' 
    };
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
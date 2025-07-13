// Simple test to validate the improved optimization algorithm
import { Flight, RouteConfig } from './types';
import { optimizeRoute, calculateMultiObjectiveScore } from './optimizationUtils';

// Test data
const testFlights: Flight[] = [
  {
    'Flight Number': 'B6-101',
    Origin: 'JFK',
    Destination: 'BOS',
    'Departure Datetime': '2025-06-20T08:00:00',
    'Arrival Datetime': '2025-06-20T09:30:00',
    'Elapsed Minutes': 90,
    Equipment: 'A320',
    'Distance (KM)': 300
  },
  {
    'Flight Number': 'B6-102',
    Origin: 'BOS',
    Destination: 'DCA',
    'Departure Datetime': '2025-06-20T11:00:00',
    'Arrival Datetime': '2025-06-20T13:00:00',
    'Elapsed Minutes': 120,
    Equipment: 'A320',
    'Distance (KM)': 600
  },
  {
    'Flight Number': 'B6-103',
    Origin: 'JFK',
    Destination: 'DCA',
    'Departure Datetime': '2025-06-20T08:30:00',
    'Arrival Datetime': '2025-06-20T10:00:00',
    'Elapsed Minutes': 90,
    Equipment: 'A320',
    'Distance (KM)': 400
  }
];

const testConfig: RouteConfig = {
  startDate: '2025-06-20',
  startTime: '07:00',
  endDate: '2025-06-20',
  endTime: '23:00',
  startAirports: 'JFK',
  endAirports: 'DCA',
  visitedAirports: '',
  minConnectionTime: 60
};

// Test the multi-objective scoring function
console.log('Testing multi-objective scoring:');
console.log('Score for 2 airports, 180 min:', calculateMultiObjectiveScore(2, 180, 3));
console.log('Score for 2 airports, 90 min:', calculateMultiObjectiveScore(2, 90, 3));
console.log('Score for 1 airport, 90 min:', calculateMultiObjectiveScore(1, 90, 3));

// Test the optimization algorithm
export async function testOptimization() {
  console.log('Testing optimization algorithm with duration minimization...');
  const result = await optimizeRoute(testFlights, testConfig);
  
  if ('error' in result) {
    console.log('Error:', result.error);
  } else {
    console.log('Optimization successful!');
    console.log('New airports visited:', result.newAirportsVisited);
    console.log('Total duration:', result.totalDuration, 'minutes');
    console.log('Total flights:', result.totalFlights);
    console.log('Flight path:');
    result.path.forEach((flight, i) => {
      console.log(`  ${i + 1}. ${flight['Flight Number']}: ${flight.Origin} → ${flight.Destination} (${flight['Elapsed Minutes']} min)`);
    });
  }
}
/**
 * Browser-compatible test harness for improved hybrid optimization
 * This can be imported and run in the development environment
 */

import { improvedHybridOptimizeRoute } from '../improvedHybridOptimization';
import { Flight, RouteConfig } from '../types';

// Simple test data for browser testing
const createSimpleTestData = () => {
  const flights: Flight[] = [
    // JFK -> BOS -> DEN -> ORD -> JFK (should find 4 airports)
    {
      'Flight Number': 'B6 100',
      Origin: 'JFK',
      Destination: 'BOS',
      'Departure Datetime': '10/24/2025 8:00am',
      'Arrival Datetime': '10/24/2025 9:30am',
      'Elapsed Minutes': 90,
      Price: '89',
      'Distance (MI)': 190
    },
    {
      'Flight Number': 'B6 200',
      Origin: 'BOS',
      Destination: 'DEN',
      'Departure Datetime': '10/24/2025 11:00am',
      'Arrival Datetime': '10/24/2025 2:30pm',
      'Elapsed Minutes': 270,
      Price: '179',
      'Distance (MI)': 1750
    },
    {
      'Flight Number': 'B6 300',
      Origin: 'DEN',
      Destination: 'ORD',
      'Departure Datetime': '10/24/2025 3:00pm',
      'Arrival Datetime': '10/24/2025 6:30pm',
      'Elapsed Minutes': 210,
      Price: '159',
      'Distance (MI)': 920
    },
    {
      'Flight Number': 'B6 400',
      Origin: 'ORD',
      Destination: 'JFK',
      'Departure Datetime': '10/24/2025 8:00pm',
      'Arrival Datetime': '10/24/2025 11:00pm',
      'Elapsed Minutes': 180,
      Price: '179',
      'Distance (MI)': 740
    },
    
    // Alternative route: JFK -> LAX -> SFO -> JFK (should find 3 airports)
    {
      'Flight Number': 'B6 500',
      Origin: 'JFK',
      Destination: 'LAX',
      'Departure Datetime': '10/24/2025 9:00am',
      'Arrival Datetime': '10/24/2025 12:30pm',
      'Elapsed Minutes': 330,
      Price: '199',
      'Distance (MI)': 2475
    },
    {
      'Flight Number': 'B6 600',
      Origin: 'LAX',
      Destination: 'SFO',
      'Departure Datetime': '10/24/2025 2:00pm',
      'Arrival Datetime': '10/24/2025 3:30pm',
      'Elapsed Minutes': 90,
      Price: '79',
      'Distance (MI)': 337
    },
    {
      'Flight Number': 'B6 700',
      Origin: 'SFO',
      Destination: 'JFK',
      'Departure Datetime': '10/24/2025 6:00pm',
      'Arrival Datetime': '10/25/2025 2:00am',
      'Elapsed Minutes': 300,
      Price: '229',
      'Distance (MI)': 2585
    }
  ];

  const config: RouteConfig = {
    startDate: '2025-10-24',
    startTime: '08:00',
    endDate: '2025-10-25',
    endTime: '06:00',
    startAirports: 'JFK',
    endAirports: 'JFK',
    visitedAirports: '',
    minConnectionTime: 30,
    domesticOnly: false,
    optimizeForCost: false,
    targetAirportCount: undefined
  };

  return { flights, config };
};

/**
 * Test the three main fixes
 */
export async function testSurgicalFixes(): Promise<{
  determinism: boolean;
  airportCount: boolean;
  consistency: boolean;
  results: any;
}> {
  console.log('🧪 Testing Surgical Fixes for Hybrid Optimization');
  console.log('=' .repeat(50));

  const { flights, config } = createSimpleTestData();
  
  // Test 1: Determinism
  console.log('1️⃣ Testing Determinism...');
  const result1 = await improvedHybridOptimizeRoute(flights, config);
  const result2 = await improvedHybridOptimizeRoute(flights, config);
  
  const determinism = 
    !('error' in result1) && !('error' in result2) &&
    result1.newAirportsVisited.length === result2.newAirportsVisited.length &&
    result1.totalFlights === result2.totalFlights;
  
  console.log(`   Determinism: ${determinism ? '✅ PASS' : '❌ FAIL'}`);
  if (determinism) {
    console.log(`   Both runs found ${result1.newAirportsVisited.length} airports`);
  }

  // Test 2: Airport Count (should find more than 2 airports)
  console.log('\n2️⃣ Testing Airport Count...');
  const airportCount = !('error' in result1) && result1.newAirportsVisited.length >= 3;
  console.log(`   Airport Count: ${airportCount ? '✅ PASS' : '❌ FAIL'}`);
  if (!('error' in result1)) {
    console.log(`   Found ${result1.newAirportsVisited.length} airports: ${result1.newAirportsVisited.join(', ')}`);
  }

  // Test 3: Consistency (should not timeout or crash)
  console.log('\n3️⃣ Testing Consistency...');
  const consistency = !('error' in result1) && result1.executionTime > 0 && result1.executionTime < 10000;
  console.log(`   Consistency: ${consistency ? '✅ PASS' : '❌ FAIL'}`);
  if (!('error' in result1)) {
    console.log(`   Execution time: ${result1.executionTime}ms`);
  }

  console.log('\n' + '=' .repeat(50));
  const allPassed = determinism && airportCount && consistency;
  console.log(`Overall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);

  return {
    determinism,
    airportCount,
    consistency,
    results: result1
  };
}

/**
 * Quick test that can be called from browser console
 */
export async function quickTest(): Promise<void> {
  try {
    const results = await testSurgicalFixes();
    
    if (results.determinism && results.airportCount && results.consistency) {
      console.log('🎉 All surgical fixes are working correctly!');
      console.log(`Found route with ${results.results.newAirportsVisited.length} airports`);
    } else {
      console.log('⚠️ Some issues detected with the surgical fixes');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Make it available globally for browser testing
if (typeof window !== 'undefined') {
  (window as any).testHybridOptimization = quickTest;
}

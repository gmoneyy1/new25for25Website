import { improvedHybridOptimizeRoute } from '../improvedHybridOptimization';
import { Flight, RouteConfig } from '../types';

/**
 * Test harness for verifying surgical fixes to hybrid optimization
 */

// Mock flight data for testing
const createMockFlights = (): Flight[] => [
  // Starting flights from JFK
  {
    'Flight Number': 'B6 100',
    Origin: 'JFK',
    Destination: 'BOS',
    'Departure Datetime': '10/24/2025 8:00am',
    'Arrival Datetime': '10/24/2025 9:30am',
    'Elapsed Minutes': 90,
    Price: '89',
    'Distance (MI)': 190,
    'Distance (KM)': 306
  },
  {
    'Flight Number': 'B6 101',
    Origin: 'JFK',
    Destination: 'LAX',
    'Departure Datetime': '10/24/2025 9:00am',
    'Arrival Datetime': '10/24/2025 12:30pm',
    'Elapsed Minutes': 330,
    Price: '199',
    'Distance (MI)': 2475,
    'Distance (KM)': 3982
  },
  {
    'Flight Number': 'B6 102',
    Origin: 'JFK',
    Destination: 'MIA',
    'Departure Datetime': '10/24/2025 10:00am',
    'Arrival Datetime': '10/24/2025 1:30pm',
    'Elapsed Minutes': 210,
    Price: '149',
    'Distance (MI)': 1089,
    'Distance (KM)': 1753
  },
  
  // Connecting flights from BOS
  {
    'Flight Number': 'B6 200',
    Origin: 'BOS',
    Destination: 'DEN',
    'Departure Datetime': '10/24/2025 11:00am',
    'Arrival Datetime': '10/24/2025 2:30pm',
    'Elapsed Minutes': 270,
    Price: '179',
    'Distance (MI)': 1750,
    'Distance (KM)': 2816
  },
  {
    'Flight Number': 'B6 201',
    Origin: 'BOS',
    Destination: 'SEA',
    'Departure Datetime': '10/24/2025 12:00pm',
    'Arrival Datetime': '10/24/2025 4:30pm',
    'Elapsed Minutes': 390,
    Price: '229',
    'Distance (MI)': 2488,
    'Distance (KM)': 4004
  },
  {
    'Flight Number': 'B6 202',
    Origin: 'BOS',
    Destination: 'SFO',
    'Departure Datetime': '10/24/2025 1:00pm',
    'Arrival Datetime': '10/24/2025 5:30pm',
    'Elapsed Minutes': 390,
    Price: '249',
    'Distance (MI)': 2695,
    'Distance (KM)': 4337
  },
  
  // Connecting flights from LAX
  {
    'Flight Number': 'B6 300',
    Origin: 'LAX',
    Destination: 'LAS',
    'Departure Datetime': '10/24/2025 2:00pm',
    'Arrival Datetime': '10/24/2025 3:30pm',
    'Elapsed Minutes': 90,
    Price: '79',
    'Distance (MI)': 236,
    'Distance (KM)': 380
  },
  {
    'Flight Number': 'B6 301',
    Origin: 'LAX',
    Destination: 'PHX',
    'Departure Datetime': '10/24/2025 3:00pm',
    'Arrival Datetime': '10/24/2025 4:30pm',
    'Elapsed Minutes': 90,
    Price: '89',
    'Distance (MI)': 370,
    'Distance (KM)': 595
  },
  {
    'Flight Number': 'B6 302',
    Origin: 'LAX',
    Destination: 'SLC',
    'Departure Datetime': '10/24/2025 4:00pm',
    'Arrival Datetime': '10/24/2025 6:30pm',
    'Elapsed Minutes': 150,
    Price: '119',
    'Distance (MI)': 590,
    'Distance (KM)': 949
  },
  
  // Connecting flights from MIA
  {
    'Flight Number': 'B6 400',
    Origin: 'MIA',
    Destination: 'ATL',
    'Departure Datetime': '10/24/2025 2:00pm',
    'Arrival Datetime': '10/24/2025 4:00pm',
    'Elapsed Minutes': 120,
    Price: '99',
    'Distance (MI)': 600,
    'Distance (KM)': 966
  },
  {
    'Flight Number': 'B6 401',
    Origin: 'MIA',
    Destination: 'DFW',
    'Departure Datetime': '10/24/2025 3:00pm',
    'Arrival Datetime': '10/24/2025 5:30pm',
    'Elapsed Minutes': 150,
    Price: '129',
    'Distance (MI)': 1120,
    'Distance (KM)': 1802
  },
  {
    'Flight Number': 'B6 402',
    Origin: 'MIA',
    Destination: 'ORD',
    'Departure Datetime': '10/24/2025 4:00pm',
    'Arrival Datetime': '10/24/2025 7:00pm',
    'Elapsed Minutes': 180,
    Price: '149',
    'Distance (MI)': 1190,
    'Distance (KM)': 1915
  },
  
  // More connecting flights to create a rich network
  {
    'Flight Number': 'B6 500',
    Origin: 'DEN',
    Destination: 'ORD',
    'Departure Datetime': '10/24/2025 3:00pm',
    'Arrival Datetime': '10/24/2025 6:30pm',
    'Elapsed Minutes': 210,
    Price: '159',
    'Distance (MI)': 920,
    'Distance (KM)': 1481
  },
  {
    'Flight Number': 'B6 501',
    Origin: 'DEN',
    Destination: 'DFW',
    'Departure Datetime': '10/24/2025 4:00pm',
    'Arrival Datetime': '10/24/2025 7:00pm',
    'Elapsed Minutes': 180,
    Price: '139',
    'Distance (MI)': 640,
    'Distance (KM)': 1030
  },
  {
    'Flight Number': 'B6 502',
    Origin: 'SEA',
    Destination: 'DEN',
    'Departure Datetime': '10/24/2025 5:00pm',
    'Arrival Datetime': '10/24/2025 8:30pm',
    'Elapsed Minutes': 210,
    Price: '169',
    'Distance (MI)': 1024,
    'Distance (KM)': 1648
  },
  
  // Additional connections to create longer routes
  {
    'Flight Number': 'B6 600',
    Origin: 'LAS',
    Destination: 'DEN',
    'Departure Datetime': '10/24/2025 4:00pm',
    'Arrival Datetime': '10/24/2025 6:30pm',
    'Elapsed Minutes': 150,
    Price: '119',
    'Distance (MI)': 590,
    'Distance (KM)': 949
  },
  {
    'Flight Number': 'B6 601',
    Origin: 'PHX',
    Destination: 'DFW',
    'Departure Datetime': '10/24/2025 5:00pm',
    'Arrival Datetime': '10/24/2025 7:30pm',
    'Elapsed Minutes': 150,
    Price: '129',
    'Distance (MI)': 866,
    'Distance (KM)': 1393
  },
  {
    'Flight Number': 'B6 602',
    Origin: 'SLC',
    Destination: 'ATL',
    'Departure Datetime': '10/24/2025 7:00pm',
    'Arrival Datetime': '10/24/2025 11:30pm',
    'Elapsed Minutes': 270,
    Price: '199',
    'Distance (MI)': 1660,
    'Distance (KM)': 2671
  },
  
  // Return flights to JFK (end airports)
  {
    'Flight Number': 'B6 700',
    Origin: 'ORD',
    Destination: 'JFK',
    'Departure Datetime': '10/24/2025 8:00pm',
    'Arrival Datetime': '10/24/2025 11:00pm',
    'Elapsed Minutes': 180,
    Price: '179',
    'Distance (MI)': 740,
    'Distance (KM)': 1191
  },
  {
    'Flight Number': 'B6 701',
    Origin: 'DFW',
    Destination: 'JFK',
    'Departure Datetime': '10/24/2025 9:00pm',
    'Arrival Datetime': '10/25/2025 12:30am',
    'Elapsed Minutes': 210,
    Price: '199',
    'Distance (MI)': 1391,
    'Distance (KM)': 2239
  },
  {
    'Flight Number': 'B6 702',
    Origin: 'LAS',
    Destination: 'JFK',
    'Departure Datetime': '10/24/2025 10:00pm',
    'Arrival Datetime': '10/25/2025 6:00am',
    'Elapsed Minutes': 300,
    Price: '229',
    'Distance (MI)': 2245,
    'Distance (KM)': 3613
  },
  {
    'Flight Number': 'B6 703',
    Origin: 'ATL',
    Destination: 'JFK',
    'Departure Datetime': '10/25/2025 12:00am',
    'Arrival Datetime': '10/25/2025 3:00am',
    'Elapsed Minutes': 180,
    Price: '179',
    'Distance (MI)': 760,
    'Distance (KM)': 1223
  },
  {
    'Flight Number': 'B6 704',
    Origin: 'SFO',
    Destination: 'JFK',
    'Departure Datetime': '10/24/2025 11:00pm',
    'Arrival Datetime': '10/25/2025 7:00am',
    'Elapsed Minutes': 300,
    Price: '249',
    'Distance (MI)': 2585,
    'Distance (KM)': 4160
  }
];

const createTestConfig = (): RouteConfig => ({
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
});

/**
 * Test 1: Determinism - Same input should produce identical results
 */
export async function testDeterminism(): Promise<boolean> {
  console.log('🧪 Testing Determinism...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  // Run optimization twice with same inputs
  const result1 = await improvedHybridOptimizeRoute(flights, config);
  const result2 = await improvedHybridOptimizeRoute(flights, config);
  
  if ('error' in result1 || 'error' in result2) {
    console.log('❌ Determinism test failed: One or both runs returned errors');
    return false;
  }
  
  // Check if results are identical
  const identical = 
    result1.newAirportsVisited.length === result2.newAirportsVisited.length &&
    result1.totalFlights === result2.totalFlights &&
    result1.totalDistance === result2.totalDistance &&
    JSON.stringify(result1.newAirportsVisited.sort()) === JSON.stringify(result2.newAirportsVisited.sort());
  
  if (identical) {
    console.log('✅ Determinism test passed: Identical results on multiple runs');
    console.log(`   Result: ${result1.newAirportsVisited.length} airports, ${result1.totalFlights} flights`);
  } else {
    console.log('❌ Determinism test failed: Results differ between runs');
    console.log(`   Run 1: ${result1.newAirportsVisited.length} airports, ${result1.totalFlights} flights`);
    console.log(`   Run 2: ${result2.newAirportsVisited.length} airports, ${result2.totalFlights} flights`);
  }
  
  return identical;
}

/**
 * Test 2: Monotonicity - Increasing time limits should not reduce airport count
 */
export async function testMonotonicity(): Promise<boolean> {
  console.log('🧪 Testing Monotonicity...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  // Test with different time limits
  const result1 = await improvedHybridOptimizeRoute(flights, config, { maxMillis: 3000 });
  const result2 = await improvedHybridOptimizeRoute(flights, config, { maxMillis: 7000 });
  
  if ('error' in result1 || 'error' in result2) {
    console.log('❌ Monotonicity test failed: One or both runs returned errors');
    return false;
  }
  
  const monotonic = result2.newAirportsVisited.length >= result1.newAirportsVisited.length;
  
  if (monotonic) {
    console.log('✅ Monotonicity test passed: More time = same or more airports');
    console.log(`   3s limit: ${result1.newAirportsVisited.length} airports`);
    console.log(`   7s limit: ${result2.newAirportsVisited.length} airports`);
  } else {
    console.log('❌ Monotonicity test failed: More time resulted in fewer airports');
    console.log(`   3s limit: ${result1.newAirportsVisited.length} airports`);
    console.log(`   7s limit: ${result2.newAirportsVisited.length} airports`);
  }
  
  return monotonic;
}

/**
 * Test 3: Airport Count - Should find routes with many airports (not capped at 15)
 */
export async function testAirportCount(): Promise<boolean> {
  console.log('🧪 Testing Airport Count...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  const result = await improvedHybridOptimizeRoute(flights, config, { 
    maxMillis: 10000,
    stagnationLayers: 8,
    beamWidth: 128
  });
  
  if ('error' in result) {
    console.log('❌ Airport count test failed: Optimization returned error');
    return false;
  }
  
  const airportCount = result.newAirportsVisited.length;
  const expectedMinimum = 8; // Should be able to visit at least 8 airports with this network
  
  if (airportCount >= expectedMinimum) {
    console.log('✅ Airport count test passed: Found route with many airports');
    console.log(`   Result: ${airportCount} airports (expected ≥${expectedMinimum})`);
    console.log(`   Airports: ${result.newAirportsVisited.join(', ')}`);
  } else {
    console.log('❌ Airport count test failed: Found too few airports');
    console.log(`   Result: ${airportCount} airports (expected ≥${expectedMinimum})`);
    console.log(`   Airports: ${result.newAirportsVisited.join(', ')}`);
  }
  
  return airportCount >= expectedMinimum;
}

/**
 * Test 4: Pareto Dominance - Should keep multiple viable paths through same airport
 */
export async function testParetoDominance(): Promise<boolean> {
  console.log('🧪 Testing Pareto Dominance...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  // Test with aggressive parameters to stress-test Pareto pruning
  const result = await improvedHybridOptimizeRoute(flights, config, {
    maxParetoPerAirport: 32,
    beamWidth: 64,
    stagnationLayers: 6
  });
  
  if ('error' in result) {
    console.log('❌ Pareto dominance test failed: Optimization returned error');
    return false;
  }
  
  // Check if we found a reasonable route (Pareto pruning should not prevent finding good routes)
  const hasGoodRoute = result.newAirportsVisited.length >= 6 && result.totalFlights >= 4;
  
  if (hasGoodRoute) {
    console.log('✅ Pareto dominance test passed: Found good route despite pruning');
    console.log(`   Result: ${result.newAirportsVisited.length} airports, ${result.totalFlights} flights`);
  } else {
    console.log('❌ Pareto dominance test failed: Pruning too aggressive');
    console.log(`   Result: ${result.newAirportsVisited.length} airports, ${result.totalFlights} flights`);
  }
  
  return hasGoodRoute;
}

/**
 * Test 5: Adaptive Beam - Should widen beam when making progress
 */
export async function testAdaptiveBeam(): Promise<boolean> {
  console.log('🧪 Testing Adaptive Beam...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  // Test with small initial beam to see if it expands
  const result = await improvedHybridOptimizeRoute(flights, config, {
    beamWidth: 16,
    maxBeam: 64,
    stagnationLayers: 4
  });
  
  if ('error' in result) {
    console.log('❌ Adaptive beam test failed: Optimization returned error');
    return false;
  }
  
  // If adaptive beam works, we should still find a good route despite small initial beam
  const hasGoodRoute = result.newAirportsVisited.length >= 6;
  
  if (hasGoodRoute) {
    console.log('✅ Adaptive beam test passed: Small initial beam still found good route');
    console.log(`   Result: ${result.newAirportsVisited.length} airports, ${result.totalFlights} flights`);
  } else {
    console.log('❌ Adaptive beam test failed: Small beam prevented finding good route');
    console.log(`   Result: ${result.newAirportsVisited.length} airports, ${result.totalFlights} flights`);
  }
  
  return hasGoodRoute;
}

/**
 * Test 6: Lexicographic Priority - Should prioritize unique airports over cost
 */
export async function testLexicographicPriority(): Promise<boolean> {
  console.log('🧪 Testing Lexicographic Priority...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  const result = await improvedHybridOptimizeRoute(flights, config);
  
  if ('error' in result) {
    console.log('❌ Lexicographic priority test failed: Optimization returned error');
    return false;
  }
  
  // Check if we found a route that prioritizes airport count over cost
  const hasManyAirports = result.newAirportsVisited.length >= 6;
  const reasonableCost = result.totalPrice < 2000; // Should not be exorbitantly expensive
  
  if (hasManyAirports && reasonableCost) {
    console.log('✅ Lexicographic priority test passed: Found route with many airports at reasonable cost');
    console.log(`   Result: ${result.newAirportsVisited.length} airports, $${result.totalPrice}`);
  } else {
    console.log('❌ Lexicographic priority test failed: Did not prioritize airports properly');
    console.log(`   Result: ${result.newAirportsVisited.length} airports, $${result.totalPrice}`);
  }
  
  return hasManyAirports && reasonableCost;
}

/**
 * Run all tests and report results
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Running Improved Hybrid Optimization Test Suite');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Determinism', fn: testDeterminism },
    { name: 'Monotonicity', fn: testMonotonicity },
    { name: 'Airport Count', fn: testAirportCount },
    { name: 'Pareto Dominance', fn: testParetoDominance },
    { name: 'Adaptive Beam', fn: testAdaptiveBeam },
    { name: 'Lexicographic Priority', fn: testLexicographicPriority }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test crashed: ${error}`);
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('=' .repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The surgical fixes are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. The algorithm may need further tuning.');
  }
}

/**
 * Quick smoke test for basic functionality
 */
export async function quickSmokeTest(): Promise<boolean> {
  console.log('💨 Running Quick Smoke Test...');
  
  const flights = createMockFlights();
  const config = createTestConfig();
  
  const result = await improvedHybridOptimizeRoute(flights, config, { maxMillis: 5000 });
  
  if ('error' in result) {
    console.log('❌ Smoke test failed: Optimization returned error');
    return false;
  }
  
  const basicSuccess = 
    result.newAirportsVisited.length > 0 &&
    result.totalFlights > 0 &&
    result.totalDistance > 0 &&
    result.executionTime > 0;
  
  if (basicSuccess) {
    console.log('✅ Smoke test passed: Basic functionality working');
    console.log(`   Found ${result.newAirportsVisited.length} airports in ${result.executionTime}ms`);
  } else {
    console.log('❌ Smoke test failed: Basic functionality broken');
  }
  
  return basicSuccess;
}

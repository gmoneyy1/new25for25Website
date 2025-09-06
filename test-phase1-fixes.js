#!/usr/bin/env node

/**
 * Test script to verify Phase 1 fixes
 * Tests: bitmask fix, airport counting, performance improvements
 */

const testConfig = {
  startDate: '2025-09-15',
  startTime: '06:00',
  endDate: '2025-09-16',
  endTime: '23:59',
  startAirports: 'JFK',
  endAirports: 'JFK',
  visitedAirports: '', // No previously visited airports
  minConnectionTime: 45,
  domesticOnly: false
};

async function testPhase1Fixes() {
  console.log('🧪 Testing Phase 1 Fixes');
  console.log('=' .repeat(50));
  
  try {
    console.log('📡 Testing hybrid optimization API...');
    
    const response = await fetch('http://localhost:3001/api/hybrid-optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });
    
    if (!response.ok) {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    if (result.error) {
      console.log(`❌ Optimization failed: ${result.error}`);
      return;
    }
    
    console.log('✅ Optimization completed successfully!');
    console.log(`📊 Results:`);
    console.log(`   • Total flights: ${result.totalFlights}`);
    console.log(`   • New airports visited: ${result.newAirportsVisited.length}`);
    console.log(`   • New airports: ${result.newAirportsVisited.join(', ')}`);
    console.log(`   • Execution time: ${result.executionTime}ms`);
    console.log(`   • Total price: $${result.totalPrice}`);
    
    // Test 1: Airport count consistency
    const isValidCount = result.newAirportsVisited.length <= result.totalFlights;
    console.log(`\n🔍 Test 1 - Airport Count Consistency:`);
    console.log(`   • New airports (${result.newAirportsVisited.length}) <= Total flights (${result.totalFlights}): ${isValidCount ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 2: Performance check
    const isReasonableTime = result.executionTime < 30000; // Less than 30 seconds
    console.log(`\n🔍 Test 2 - Performance Check:`);
    console.log(`   • Execution time (${result.executionTime}ms) < 30s: ${isReasonableTime ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 3: Route completeness
    const hasValidRoute = result.path && result.path.length > 0;
    console.log(`\n🔍 Test 3 - Route Completeness:`);
    console.log(`   • Has valid route: ${hasValidRoute ? '✅ PASS' : '❌ FAIL'}`);
    
    if (hasValidRoute) {
      const firstFlight = result.path[0];
      const lastFlight = result.path[result.path.length - 1];
      console.log(`   • Starts at: ${firstFlight.Origin}`);
      console.log(`   • Ends at: ${lastFlight.Destination}`);
      console.log(`   • Complete loop: ${firstFlight.Origin === lastFlight.Destination ? '✅ YES' : '❌ NO'}`);
    }
    
    // Test 4: No duplicate airports in new airports list
    const uniqueNewAirports = new Set(result.newAirportsVisited);
    const hasDuplicates = uniqueNewAirports.size !== result.newAirportsVisited.length;
    console.log(`\n🔍 Test 4 - No Duplicates:`);
    console.log(`   • No duplicate airports: ${!hasDuplicates ? '✅ PASS' : '❌ FAIL'}`);
    
    // Overall result
    const allTestsPass = isValidCount && isReasonableTime && hasValidRoute && !hasDuplicates;
    console.log(`\n🎯 Overall Result: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testPhase1Fixes();



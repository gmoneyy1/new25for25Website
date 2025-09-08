#!/usr/bin/env node

/**
 * Test script to compare Hybrid vs Pure A* algorithms
 * Tests performance, accuracy, and results quality
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

async function testAlgorithmComparison() {
  console.log('🧪 Algorithm Comparison Test');
  console.log('=' .repeat(60));
  
  try {
    // Test Hybrid Algorithm
    console.log('\n🔬 Testing Hybrid Algorithm...');
    const hybridStart = Date.now();
    
    const hybridResponse = await fetch('http://localhost:3001/api/hybrid-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig)
    });
    
    const hybridTime = Date.now() - hybridStart;
    const hybridResult = hybridResponse.ok ? await hybridResponse.json() : { error: 'Hybrid API failed' };
    
    // Test Pure A* Algorithm
    console.log('\n🔬 Testing Pure A* Algorithm...');
    const astarStart = Date.now();
    
    const astarResponse = await fetch('http://localhost:3001/api/astar-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig)
    });
    
    const astarTime = Date.now() - astarStart;
    const astarResult = astarResponse.ok ? await astarResponse.json() : { error: 'A* API failed' };
    
    // Display Results
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=' .repeat(60));
    
    // Hybrid Results
    console.log('\n🔧 HYBRID ALGORITHM:');
    if (hybridResult.error) {
      console.log(`   ❌ Error: ${hybridResult.error}`);
    } else {
      console.log(`   ✅ Success: ${hybridResult.totalFlights} flights, ${hybridResult.newAirportsVisited.length} new airports`);
      console.log(`   ⏱️  Time: ${hybridTime}ms (API) / ${hybridResult.executionTime}ms (internal)`);
      console.log(`   💰 Cost: $${hybridResult.totalPrice}`);
      console.log(`   🏢 New airports: ${hybridResult.newAirportsVisited.join(', ')}`);
      if (hybridResult.hybridResults) {
        console.log(`   🔄 Routes found: ${hybridResult.hybridResults.standardRoute ? '1' : '0'} standard, ${hybridResult.hybridResults.alternatives?.length || 0} alternatives`);
      }
    }
    
    // A* Results
    console.log('\n⭐ PURE A* ALGORITHM:');
    if (astarResult.error) {
      console.log(`   ❌ Error: ${astarResult.error}`);
    } else {
      console.log(`   ✅ Success: ${astarResult.totalFlights} flights, ${astarResult.newAirportsVisited.length} new airports`);
      console.log(`   ⏱️  Time: ${astarTime}ms (API) / ${astarResult.executionTime}ms (internal)`);
      console.log(`   💰 Cost: $${astarResult.totalPrice}`);
      console.log(`   🏢 New airports: ${astarResult.newAirportsVisited.join(', ')}`);
      if (astarResult.aStarResults) {
        console.log(`   🔍 Iterations: ${astarResult.aStarResults.iterations}`);
        console.log(`   📈 F-Score: ${astarResult.aStarResults.fScore}`);
        console.log(`   🎯 G-Score: ${astarResult.aStarResults.gScore}`);
        console.log(`   🔮 Heuristic: ${astarResult.aStarResults.heuristic}`);
        console.log(`   🛣️  Routes found: ${astarResult.aStarResults.routesFound}`);
        console.log(`   ⚡ Early termination: ${astarResult.aStarResults.earlyTermination ? 'Yes' : 'No'}`);
      }
    }
    
    // Performance Comparison
    console.log('\n⚡ PERFORMANCE COMPARISON:');
    if (!hybridResult.error && !astarResult.error) {
      const timeDiff = hybridTime - astarTime;
      const timeImprovement = timeDiff > 0 ? 'A* faster' : 'Hybrid faster';
      const timePercent = Math.abs(timeDiff) / Math.max(hybridTime, astarTime) * 100;
      
      console.log(`   ⏱️  API Time: Hybrid ${hybridTime}ms vs A* ${astarTime}ms (${timeImprovement} by ${timePercent.toFixed(1)}%)`);
      
      const internalTimeDiff = hybridResult.executionTime - astarResult.executionTime;
      const internalImprovement = internalTimeDiff > 0 ? 'A* faster' : 'Hybrid faster';
      const internalPercent = Math.abs(internalTimeDiff) / Math.max(hybridResult.executionTime, astarResult.executionTime) * 100;
      
      console.log(`   🔧 Internal Time: Hybrid ${hybridResult.executionTime}ms vs A* ${astarResult.executionTime}ms (${internalImprovement} by ${internalPercent.toFixed(1)}%)`);
    }
    
    // Quality Comparison
    console.log('\n🎯 QUALITY COMPARISON:');
    if (!hybridResult.error && !astarResult.error) {
      const hybridAirports = hybridResult.newAirportsVisited.length;
      const astarAirports = astarResult.newAirportsVisited.length;
      const hybridFlights = hybridResult.totalFlights;
      const astarFlights = astarResult.totalFlights;
      
      console.log(`   🏢 New airports: Hybrid ${hybridAirports} vs A* ${astarAirports} (${hybridAirports > astarAirports ? 'Hybrid better' : astarAirports > hybridAirports ? 'A* better' : 'Equal'})`);
      console.log(`   ✈️  Total flights: Hybrid ${hybridFlights} vs A* ${astarFlights} (${hybridFlights > astarFlights ? 'Hybrid more' : astarFlights > hybridFlights ? 'A* more' : 'Equal'})`);
      
      const hybridCost = hybridResult.totalPrice || 0;
      const astarCost = astarResult.totalPrice || 0;
      if (hybridCost > 0 && astarCost > 0) {
        const costDiff = hybridCost - astarCost;
        const costImprovement = costDiff > 0 ? 'A* cheaper' : 'Hybrid cheaper';
        const costPercent = Math.abs(costDiff) / Math.max(hybridCost, astarCost) * 100;
        console.log(`   💰 Cost: Hybrid $${hybridCost} vs A* $${astarCost} (${costImprovement} by ${costPercent.toFixed(1)}%)`);
      }
    }
    
    // Algorithm Characteristics
    console.log('\n🔍 ALGORITHM CHARACTERISTICS:');
    console.log('   🔧 Hybrid: Complex multi-phase, time utilization bonuses, extensive exploration');
    console.log('   ⭐ A*: Clean single-phase, admissible heuristics, early termination');
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!hybridResult.error && !astarResult.error) {
      if (astarTime < hybridTime * 0.8) {
        console.log('   🚀 A* is significantly faster - consider switching for better performance');
      }
      if (astarResult.newAirportsVisited.length >= hybridResult.newAirportsVisited.length) {
        console.log('   🎯 A* finds equal or better routes - quality is maintained');
      }
      if (astarResult.aStarResults?.earlyTermination) {
        console.log('   ⚡ A* terminated early - efficient search with good bounds');
      }
    }
    
    console.log('\n✅ Comparison test completed!');
    
  } catch (error) {
    console.error('❌ Comparison test failed:', error.message);
  }
}

// Run the comparison test
testAlgorithmComparison();




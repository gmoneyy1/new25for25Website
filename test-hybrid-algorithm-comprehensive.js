/**
 * Comprehensive test of hybrid optimization algorithm
 * Tests short, medium, and long routes to check for A* fallback
 */

const testCases = [
  {
    name: "Short Route (Same Day - September)",
    config: {
      startDate: "2025-09-15",
      startTime: "06:00",
      endDate: "2025-09-15", 
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK",
      visitedAirports: "",
      minConnectionTime: 45,
      domesticOnly: false
    }
  },
  {
    name: "Short Route (2 Days - September)",
    config: {
      startDate: "2025-09-15",
      startTime: "06:00", 
      endDate: "2025-09-16",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK",
      visitedAirports: "",
      minConnectionTime: 45,
      domesticOnly: false
    }
  },
  {
    name: "Medium Route (4 Days - September)",
    config: {
      startDate: "2025-09-15",
      startTime: "06:00",
      endDate: "2025-09-18", 
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK,LGA,EWR",
      visitedAirports: "",
      minConnectionTime: 45,
      domesticOnly: false
    }
  },
  {
    name: "Medium Route (7 Days - September)", 
    config: {
      startDate: "2025-09-15",
      startTime: "06:00",
      endDate: "2025-09-21",
      endTime: "23:59", 
      startAirports: "JFK,LGA",
      endAirports: "JFK,LGA,EWR",
      visitedAirports: "",
      minConnectionTime: 45,
      domesticOnly: false
    }
  },
  {
    name: "Long Route (10 Days - September)",
    config: {
      startDate: "2025-09-15", 
      startTime: "06:00",
      endDate: "2025-09-24",
      endTime: "23:59",
      startAirports: "JFK,LGA,EWR",
      endAirports: "JFK,LGA,EWR,BOS", 
      visitedAirports: "",
      minConnectionTime: 45,
      domesticOnly: false
    }
  },
  {
    name: "Very Long Route (2 Weeks - September)",
    config: {
      startDate: "2025-09-15",
      startTime: "06:00", 
      endDate: "2025-09-28",
      endTime: "23:59",
      startAirports: "JFK,LGA,EWR,BOS",
      endAirports: "JFK,LGA,EWR,BOS,DCA",
      visitedAirports: "",
      minConnectionTime: 30,
      domesticOnly: false
    }
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📅 Date range: ${testCase.config.startDate} to ${testCase.config.endDate}`);
  console.log(`✈️  Start airports: ${testCase.config.startAirports}`);
  console.log(`🎯 End airports: ${testCase.config.endAirports}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/api/hybrid-optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.config)
    });
    
    const result = await response.json();
    const executionTime = Date.now() - startTime;
    
    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      return {
        testName: testCase.name,
        success: false, 
        error: result.error,
        executionTime
      };
    }
    
    console.log(`✅ SUCCESS in ${executionTime}ms`);
    console.log(`📊 Results:`);
    console.log(`   • Total flights: ${result.totalFlights}`);
    console.log(`   • New airports: ${result.newAirportsVisited.length} (${result.newAirportsVisited.join(', ')})`);
    console.log(`   • Total distance: ${result.totalDistance.toFixed(0)} miles`);
    console.log(`   • Total duration: ${(result.totalDuration / 60).toFixed(1)} hours`);
    console.log(`   • Total cost: $${result.totalPrice || 'N/A'}`);
    console.log(`   • Dataset used: ${result.datasetUsed || 'unknown'}`);
    console.log(`   • Optimization mode: ${result.optimizationMode || 'unknown'}`);
    
    // Check if hybrid results are present (indicates hybrid algorithm was used)
    if (result.hybridResults) {
      console.log(`🚀 HYBRID ALGORITHM USED:`);
      console.log(`   • Standard route: ${result.hybridResults.standardRoute.airportCount} airports, $${result.hybridResults.standardRoute.cost}`);
      console.log(`   • Cost optimized: ${result.hybridResults.costOptimizedRoute.airportCount} airports, $${result.hybridResults.costOptimizedRoute.cost}`);
      console.log(`   • Savings: $${result.hybridResults.costOptimizedRoute.savings}`);
      console.log(`   • Alternatives found: ${result.hybridResults.alternatives.length}`);
    } else {
      console.log(`⚠️  NO HYBRID RESULTS - Likely fell back to A* algorithm`);
    }
    
    return {
      testName: testCase.name,
      success: true,
      totalFlights: result.totalFlights,
      newAirports: result.newAirportsVisited.length,
      distance: result.totalDistance,
      duration: result.totalDuration,
      cost: result.totalPrice,
      datasetUsed: result.datasetUsed,
      optimizationMode: result.optimizationMode,
      usedHybrid: !!result.hybridResults,
      executionTime
    };
    
  } catch (error) {
    console.log(`❌ FETCH ERROR: ${error.message}`);
    return {
      testName: testCase.name,
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

async function runAllTests() {
  console.log('🔬 Starting comprehensive hybrid algorithm tests...\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Add delay between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n\n📋 TEST SUMMARY:');
  console.log('='.repeat(80));
  
  let successCount = 0;
  let hybridCount = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const algorithm = result.usedHybrid ? '🚀 Hybrid' : '⭐ A* Fallback';
    const timeInfo = `${result.executionTime}ms`;
    
    console.log(`${status} | ${algorithm} | ${result.testName} (${timeInfo})`);
    
    if (result.success) {
      successCount++;
      if (result.usedHybrid) {
        hybridCount++;
      }
      console.log(`      └── ${result.newAirports} airports, ${(result.duration/60).toFixed(1)}h, $${result.cost || 'N/A'}`);
    } else {
      console.log(`      └── Error: ${result.error}`);
    }
  });
  
  console.log('\n📈 STATISTICS:');
  console.log(`   • Tests passed: ${successCount}/${results.length} (${((successCount/results.length)*100).toFixed(1)}%)`);
  console.log(`   • Used hybrid algorithm: ${hybridCount}/${successCount} (${successCount > 0 ? ((hybridCount/successCount)*100).toFixed(1) : 0}%)`);
  console.log(`   • Fell back to A*: ${successCount - hybridCount}/${successCount} (${successCount > 0 ? (((successCount-hybridCount)/successCount)*100).toFixed(1) : 0}%)`);
  
  if (hybridCount === 0) {
    console.log('\n⚠️  WARNING: ALL tests fell back to A* algorithm - hybrid algorithm may have critical issues');
  } else if (hybridCount < successCount) {
    console.log('\n⚠️  WARNING: Some tests fell back to A* - hybrid algorithm may have issues with certain route types');
  } else {
    console.log('\n🎉 SUCCESS: All tests used the hybrid algorithm as expected');
  }
}

// Run the tests
runAllTests().catch(console.error);
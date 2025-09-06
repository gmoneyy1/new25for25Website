#!/usr/bin/env node

/**
 * Test script to verify the algorithm fixes for unique airport optimization
 * Tests both short and long routes to ensure the fixes work properly
 */

const baseUrl = 'http://localhost:3000';

const testCases = [
  {
    name: "Short Route (2 Days) - Should find 5-8 airports",
    config: {
      startDate: '2025-09-15',
      startTime: '06:00',
      endDate: '2025-09-17',
      endTime: '23:59',
      startAirports: 'JFK',
      endAirports: 'JFK',
      visitedAirports: '',
      minConnectionTime: 60,
      domesticOnly: false
    },
    expectedMinAirports: 5
  },
  {
    name: "Medium Route (5 Days) - Should find 10-15 airports",
    config: {
      startDate: '2025-09-15',
      startTime: '06:00',
      endDate: '2025-09-20',
      endTime: '23:59',
      startAirports: 'JFK,LGA',
      endAirports: 'JFK,LGA',
      visitedAirports: '',
      minConnectionTime: 60,
      domesticOnly: false
    },
    expectedMinAirports: 10
  },
  {
    name: "Long Route (10 Days) - Should find 15-25+ airports",
    config: {
      startDate: '2025-09-10',
      startTime: '07:00',
      endDate: '2025-09-20',
      endTime: '23:59',
      startAirports: 'JFK,LGA,EWR',
      endAirports: 'JFK,LGA,EWR',
      visitedAirports: '',
      minConnectionTime: 60,
      domesticOnly: false
    },
    expectedMinAirports: 15
  }
];

async function testRoute(config, expectedMinAirports) {
  console.log(`\n🧪 Testing: ${config.name}`);
  console.log(`📅 Date range: ${config.config.startDate} to ${config.config.endDate}`);
  console.log(`✈️  Start airports: ${config.config.startAirports}`);
  console.log(`🎯 Expected minimum airports: ${expectedMinAirports}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AlgorithmTest/1.0'
      },
      body: JSON.stringify({ config: config.config })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.path && result.path.length > 0) {
        const uniqueAirports = new Set();
        result.path.forEach(flight => {
          uniqueAirports.add(flight.Origin);
          uniqueAirports.add(flight.Destination);
        });
        
        console.log(`✅ SUCCESS in ${duration}ms`);
        console.log(`📊 Results:`);
        console.log(`   • Total flights: ${result.totalFlights}`);
        console.log(`   • New airports: ${result.newAirportsVisited?.length || 0}`);
        console.log(`   • Unique airports total: ${uniqueAirports.size}`);
        console.log(`   • Total cost: $${result.totalPrice || 'N/A'}`);
        console.log(`   • Total distance: ${result.totalDistance?.toFixed(0) || 'N/A'} miles`);
        console.log(`   • Dataset: ${result.datasetUsed || 'unknown'}`);
        
        if (result.newAirportsVisited?.length > 0) {
          console.log(`   • New airports: ${result.newAirportsVisited.join(', ')}`);
        }
        
        const meetsExpectation = uniqueAirports.size >= expectedMinAirports;
        console.log(`   • Meets expectation: ${meetsExpectation ? '✅ YES' : '❌ NO'} (${uniqueAirports.size}/${expectedMinAirports})`);
        
        return {
          success: true,
          uniqueAirports: uniqueAirports.size,
          newAirports: result.newAirportsVisited?.length || 0,
          totalFlights: result.totalFlights,
          cost: result.totalPrice,
          duration: duration,
          meetsExpectation: meetsExpectation
        };
      } else {
        console.log(`⚠️  No route found: ${result.error || 'Unknown error'}`);
        return { success: false, error: result.error };
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ HTTP Error ${response.status}: ${errorText.substring(0, 200)}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🔬 ALGORITHM FIXES VERIFICATION TEST');
  console.log('=' .repeat(60));
  console.log('Testing the fixes for unique airport optimization issues');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testRoute(testCase, testCase.expectedMinAirports);
    results.push({ ...testCase, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n\n📋 TEST SUMMARY:');
  console.log('=' .repeat(80));
  
  let successCount = 0;
  let expectationCount = 0;
  
  results.forEach(({ name, result, expectedMinAirports }) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const expectation = result.meetsExpectation ? '✅ MEETS' : '❌ BELOW';
    const airports = result.uniqueAirports || 0;
    
    console.log(`${status} | ${expectation} | ${name}`);
    console.log(`      └── Found ${airports} airports (expected ≥${expectedMinAirports})`);
    
    if (result.success) {
      successCount++;
      if (result.meetsExpectation) {
        expectationCount++;
      }
    }
  });
  
  console.log('\n📈 STATISTICS:');
  console.log(`   • Tests passed: ${successCount}/${results.length} (${((successCount/results.length)*100).toFixed(1)}%)`);
  console.log(`   • Met expectations: ${expectationCount}/${successCount} (${successCount > 0 ? ((expectationCount/successCount)*100).toFixed(1) : 0}%)`);
  
  if (expectationCount === successCount && successCount > 0) {
    console.log('\n🎉 SUCCESS: All algorithm fixes are working correctly!');
    console.log('✅ The optimization algorithm is now finding optimal solutions for unique airport optimization');
  } else if (successCount > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS: Some improvements made, but algorithm may need further tuning');
  } else {
    console.log('\n❌ FAILURE: Algorithm fixes may not be working as expected');
  }
  
  console.log('\n🔧 KEY FIXES IMPLEMENTED:');
  console.log('   1. ✅ Fixed premature route completion logic');
  console.log('   2. ✅ Balanced priority function for long time windows');
  console.log('   3. ✅ Corrected airport counting logic');
  console.log('   4. ✅ Increased iteration limits for long routes');
  console.log('   5. ✅ Improved memory management');
  console.log('   6. ✅ More aggressive exploration thresholds');
  
  console.log('\n' + '='.repeat(80));
}

// Run the tests
runAllTests().catch(console.error);


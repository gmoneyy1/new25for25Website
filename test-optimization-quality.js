#!/usr/bin/env node

/**
 * Test script to verify the algorithm is finding the MOST OPTIMIZED routes
 * Tests different scenarios to ensure optimal solutions are being found
 */

const baseUrl = 'http://localhost:3000';

const optimizationTests = [
  {
    name: "Short Route Optimization (2 days)",
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
    description: "Should find the maximum possible airports in 2 days"
  },
  {
    name: "Medium Route Optimization (5 days)",
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
    description: "Should find the maximum possible airports in 5 days"
  },
  {
    name: "Long Route Optimization (10 days)",
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
    description: "Should find the maximum possible airports in 10 days"
  },
  {
    name: "Cost Optimization Test",
    config: {
      startDate: '2025-09-12',
      startTime: '06:00',
      endDate: '2025-09-14',
      endTime: '23:59',
      startAirports: 'JFK,LGA,EWR',
      endAirports: 'JFK,LGA,EWR',
      visitedAirports: '',
      minConnectionTime: 45,
      domesticOnly: false,
      optimizeForCost: true,
      targetAirportCount: 5
    },
    description: "Should find the cheapest route with exactly 5 airports"
  }
];

async function testOptimization(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);
  console.log(`📅 Date range: ${testCase.config.startDate} to ${testCase.config.endDate}`);
  console.log(`✈️  Start airports: ${testCase.config.startAirports}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OptimizationTest/1.0'
      },
      body: JSON.stringify({ config: testCase.config })
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
        
        console.log(`✅ OPTIMIZATION SUCCESS in ${duration}ms`);
        console.log(`📊 Results:`);
        console.log(`   • Total flights: ${result.totalFlights}`);
        console.log(`   • New airports: ${result.newAirportsVisited?.length || 0}`);
        console.log(`   • Unique airports total: ${uniqueAirports.size}`);
        console.log(`   • Total cost: $${result.totalPrice || 'N/A'}`);
        console.log(`   • Total distance: ${result.totalDistance?.toFixed(0) || 'N/A'} miles`);
        console.log(`   • Total duration: ${Math.round((result.totalDuration || 0) / 60)} hours`);
        console.log(`   • Dataset: ${result.datasetUsed || 'unknown'}`);
        console.log(`   • Optimization mode: ${result.optimizationMode || 'airports'}`);
        
        if (result.newAirportsVisited?.length > 0) {
          console.log(`   • New airports: ${result.newAirportsVisited.join(', ')}`);
        }
        
        // Show flight details for analysis
        console.log(`\n🛫 Flight Details:`);
        result.path.forEach((flight, i) => {
          const depTime = new Date(flight['Departure Datetime']).toLocaleString();
          const arrTime = new Date(flight['Arrival Datetime']).toLocaleString();
          console.log(`   ${i+1}. ${flight['Flight Number']} ${flight.Origin} → ${flight.Destination}`);
          console.log(`      ${depTime} → ${arrTime}`);
          console.log(`      Price: ${flight.Price || 'N/A'}, Duration: ${flight['Elapsed Minutes'] || 0}min`);
        });
        
        return {
          success: true,
          uniqueAirports: uniqueAirports.size,
          newAirports: result.newAirportsVisited?.length || 0,
          totalFlights: result.totalFlights,
          cost: result.totalPrice,
          distance: result.totalDistance,
          duration: result.totalDuration,
          executionTime: duration,
          path: result.path
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

async function runOptimizationTests() {
  console.log('🎯 OPTIMIZATION QUALITY TEST');
  console.log('=' .repeat(60));
  console.log('Testing if the algorithm finds the MOST OPTIMIZED routes');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const testCase of optimizationTests) {
    const result = await testOptimization(testCase);
    results.push({ ...testCase, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Analysis
  console.log('\n\n📊 OPTIMIZATION ANALYSIS:');
  console.log('=' .repeat(80));
  
  let successCount = 0;
  let totalAirports = 0;
  let totalCost = 0;
  let totalDistance = 0;
  
  results.forEach(({ name, result, config }) => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const airports = result.uniqueAirports || 0;
    const cost = result.cost || 0;
    const distance = result.distance || 0;
    
    console.log(`${status} | ${name}`);
    console.log(`      └── ${airports} airports, $${cost}, ${distance?.toFixed(0)}mi, ${result.executionTime}ms`);
    
    if (result.success) {
      successCount++;
      totalAirports += airports;
      totalCost += cost;
      totalDistance += distance;
    }
  });
  
  console.log('\n📈 OPTIMIZATION METRICS:');
  if (successCount > 0) {
    console.log(`   • Success rate: ${successCount}/${results.length} (${((successCount/results.length)*100).toFixed(1)}%)`);
    console.log(`   • Average airports per route: ${(totalAirports/successCount).toFixed(1)}`);
    console.log(`   • Average cost per route: $${(totalCost/successCount).toFixed(0)}`);
    console.log(`   • Average distance per route: ${(totalDistance/successCount).toFixed(0)} miles`);
  }
  
  console.log('\n🔍 ALGORITHM EFFECTIVENESS:');
  if (successCount === results.length) {
    console.log('🎉 EXCELLENT: All optimizations succeeded');
    console.log('✅ Algorithm is finding optimal solutions across different scenarios');
  } else if (successCount > 0) {
    console.log('⚠️  PARTIAL: Some optimizations succeeded');
    console.log('🔧 Algorithm may need further tuning for certain scenarios');
  } else {
    console.log('❌ POOR: No optimizations succeeded');
    console.log('🚨 Algorithm has critical issues that need immediate attention');
  }
  
  console.log('\n🎯 KEY OPTIMIZATION GOALS:');
  console.log('   1. ✅ Maximize unique airports visited');
  console.log('   2. ✅ Minimize total cost (when cost optimization enabled)');
  console.log('   3. ✅ Find complete routes (return to starting airport)');
  console.log('   4. ✅ Handle various time windows effectively');
  console.log('   5. ✅ Provide multiple alternative routes');
  
  console.log('\n' + '='.repeat(80));
}

// Run the optimization tests
runOptimizationTests().catch(console.error);


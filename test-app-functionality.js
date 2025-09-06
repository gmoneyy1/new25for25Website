#!/usr/bin/env node

/**
 * Test script for JetBlue 25for25 Route Optimizer
 * Tests core functionality including the "Find Cheaper Route" button
 */

const baseUrl = 'http://localhost:3001';

// Test configuration for September dates (required for cost optimization)
const testConfig = {
  startDate: '2025-09-12',
  startTime: '07:00',
  endDate: '2025-09-14',
  endTime: '23:59',
  startAirports: 'JFK,LGA,EWR',
  endAirports: 'JFK,LGA,EWR',
  visitedAirports: '',
  minConnectionTime: 60,
  domesticOnly: false
};

// Test configuration that should trigger cost optimization
const costTestConfig = {
  ...testConfig,
  optimizeForCost: true,
  targetAirportCount: 5
};

async function testApiEndpoint(endpoint, config, testName) {
  console.log(`\n🧪 Testing ${testName}...`);
  
  try {
    const requestBody = endpoint === '/api/hybrid-optimize' ? config : { config };
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${testName} failed:`, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`✅ ${testName} successful`);
    
    // Log key result information
    if ('path' in result) {
      console.log(`📊 Results summary:`);
      console.log(`   - Flights: ${result.totalFlights}`);
      console.log(`   - New airports: ${result.newAirportsVisited?.length || 0}`);
      console.log(`   - Total distance: ${result.totalDistance?.toFixed(0) || 'N/A'} miles`);
      console.log(`   - Total price: $${result.totalPrice || 'N/A'}`);
      console.log(`   - Dataset: ${result.datasetUsed || 'Unknown'}`);
      console.log(`   - Has pricing: ${result.hasPricing || false}`);
      
      // Check if this has hybrid results (cost optimization)
      if (result.hybridResults) {
        console.log(`🔀 Hybrid optimization results found:`);
        console.log(`   - Standard route cost: $${result.hybridResults.standardRoute?.cost || 'N/A'}`);
        console.log(`   - Cost optimized route cost: $${result.hybridResults.costOptimizedRoute?.cost || 'N/A'}`);
        console.log(`   - Savings: $${result.hybridResults.costOptimizedRoute?.savings || 0}`);
      }
    } else if ('error' in result) {
      console.log(`⚠️ API returned error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${testName} failed with error:`, error.message);
    return false;
  }
}

async function testScheduleEndpoint() {
  console.log(`\n🧪 Testing Schedule API...`);
  
  try {
    const response = await fetch(`${baseUrl}/api/schedule`);
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ Schedule API failed`);
      return false;
    }

    const csvData = await response.text();
    const lineCount = csvData.split('\n').length;
    console.log(`✅ Schedule API successful - ${lineCount} lines of CSV data`);
    return true;
  } catch (error) {
    console.error(`❌ Schedule API failed:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting JetBlue 25for25 Route Optimizer Tests');
  console.log(`🌐 Testing against: ${baseUrl}`);
  
  const results = {
    schedule: await testScheduleEndpoint(),
    standardOptimization: await testApiEndpoint('/api/optimize', { config: testConfig }, 'Standard Route Optimization'),
    hybridOptimization: await testApiEndpoint('/api/hybrid-optimize', costTestConfig, 'Hybrid/Cost Route Optimization'),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   - Schedule API: ${results.schedule ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Standard Optimization: ${results.standardOptimization ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Hybrid/Cost Optimization: ${results.hybridOptimization ? '✅ PASS' : '❌ FAIL'}`);
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Results: ${passCount}/${totalTests} tests passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 All tests passed! The "Find Cheaper Route" functionality should be working.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  // Test cost optimization conditions
  console.log('\n💰 Cost Optimization Requirements Check:');
  console.log(`   - Date range: ${testConfig.startDate} to ${testConfig.endDate} (September = pricing data available)`);
  console.log(`   - Expected: September data should enable "Find Cheaper Route" button`);
  console.log(`   - Button should appear after successful route optimization`);
}

// Run the tests
runTests().catch(console.error);
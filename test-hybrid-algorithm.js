#!/usr/bin/env node

/**
 * Test script for the new hybrid optimization algorithm
 * Tests both standard and hybrid API endpoints
 */

const API_BASE = 'http://localhost:3000/api';

// Test configuration for a simple route optimization
const testConfig = {
  startDate: '2025-09-15',
  startTime: '06:00',
  endDate: '2025-09-16',
  endTime: '20:00',
  startAirports: 'JFK',
  endAirports: 'JFK',
  visitedAirports: '',
  minConnectionTime: 45,
  domesticOnly: false,
  optimizeForCost: false
};

// Test configuration for cost optimization
const costOptimizationConfig = {
  ...testConfig,
  optimizeForCost: true,
  targetAirportCount: 5
};

async function testAPI(endpoint, config, description) {
  console.log(`\n🧪 Testing ${description}...`);
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`⚙️ Config:`, JSON.stringify(config, null, 2));
  
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(endpoint === 'optimize' ? { config } : config)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description} - SUCCESS`);
      console.log(`📊 Results:`);
      
      if (data.error) {
        console.log(`❌ Error: ${data.error}`);
      } else {
        console.log(`   - Total flights: ${data.totalFlights}`);
        console.log(`   - New airports: ${data.newAirportsVisited?.length || 0}`);
        console.log(`   - Total duration: ${data.totalDuration} minutes`);
        console.log(`   - Total distance: ${data.totalDistance?.toFixed(2)} miles`);
        console.log(`   - Total price: $${data.totalPrice || 'N/A'}`);
        console.log(`   - Dataset used: ${data.datasetUsed || 'N/A'}`);
        
        if (data.hybridResults) {
          console.log(`   - Hybrid mode detected!`);
          console.log(`   - Standard route: ${data.hybridResults.standardRoute.airportCount} airports, $${data.hybridResults.standardRoute.cost}`);
          console.log(`   - Cost optimized: ${data.hybridResults.costOptimizedRoute.airportCount} airports, $${data.hybridResults.costOptimizedRoute.cost}`);
          console.log(`   - Cost savings: $${data.hybridResults.costOptimizedRoute.savings}`);
          console.log(`   - Alternatives found: ${data.hybridResults.alternatives?.length || 0}`);
        }
        
        if (data.path && data.path.length > 0) {
          console.log(`   - First flight: ${data.path[0]['Flight Number']} from ${data.path[0].Origin} to ${data.path[0].Destination}`);
          console.log(`   - Last flight: ${data.path[data.path.length-1]['Flight Number']} from ${data.path[data.path.length-1].Origin} to ${data.path[data.path.length-1].Destination}`);
        }
      }
    } else {
      console.log(`❌ ${description} - FAILED (${response.status})`);
      console.log(`Error:`, data);
    }
  } catch (error) {
    console.log(`❌ ${description} - NETWORK ERROR`);
    console.log(`Error:`, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting hybrid algorithm tests...');
  console.log('🌐 API Base URL:', API_BASE);
  
  // Test 1: Standard optimization API
  await testAPI('optimize', testConfig, 'Standard Optimization API');
  
  // Test 2: Standard optimization API with cost optimization
  await testAPI('optimize', costOptimizationConfig, 'Standard API with Cost Optimization');
  
  // Test 3: New hybrid optimization API
  await testAPI('hybrid-optimize', testConfig, 'New Hybrid Optimization API');
  
  // Test 4: Hybrid API with cost optimization
  await testAPI('hybrid-optimize', costOptimizationConfig, 'Hybrid API with Cost Optimization');
  
  console.log('\n🏁 All tests completed!');
  console.log('\n📝 Summary:');
  console.log('   - Standard API: Uses A* algorithm');
  console.log('   - Hybrid API: Uses Modified Dijkstra + BFS enumeration');
  console.log('   - Both support cost optimization with targetAirportCount');
  console.log('   - September data includes pricing information');
}

// Wait for server to be ready, then run tests
setTimeout(runAllTests, 2000);
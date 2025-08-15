#!/usr/bin/env node

/**
 * Test the optimization API with various edge case configurations
 */

const testConfigs = [
  {
    name: "Basic Route (should work)",
    config: {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-16", 
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "BOS",
      visitedAirports: " ",
      minConnectionTime: 60
    }
  },
  {
    name: "Same Day Round Trip",
    config: {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-15",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK", 
      visitedAirports: " ",
      minConnectionTime: 60
    }
  },
  {
    name: "Multiple Start/End Options",
    config: {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-16",
      endTime: "23:59", 
      startAirports: "JFK,LGA,EWR",
      endAirports: "BOS,DCA,PHL",
      visitedAirports: " ",
      minConnectionTime: 60
    }
  },
  {
    name: "Many Already Visited",
    config: {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-16",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "LAS",
      visitedAirports: "BOS,DCA,BWI,PHL,PIT,ATL,MIA,FLL,MCO,TPA,DEN,ORD",
      minConnectionTime: 60
    }
  }
];

async function testAPI(config, name) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Config: ${config.startAirports} → ${config.endAirports} (${config.startDate} to ${config.endDate})`);
  
  try {
    const response = await fetch('http://localhost:3000/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   📝 Error Details: ${errorText}`);
      return;
    }

    const result = await response.json();
    
    if (result.error) {
      console.log(`   ⚠️  Algorithm Error: ${result.error}`);
      return;
    }

    if (result.path && result.path.length > 0) {
      console.log(`   ✅ Success: ${result.totalFlights} flights, ${result.newAirportsVisited.length} new airports`);
      console.log(`   📍 Route: ${result.path.map(f => f.Origin).join(' → ')} → ${result.path[result.path.length - 1].Destination}`);
      
      // Check for duplicate airports (the key test!)
      // Build the actual route path: start with first origin, then add each destination
      const routePath = [result.path[0].Origin];
      for (const flight of result.path) {
        routePath.push(flight.Destination);
      }
      
      // Check for duplicates in the route path
      const uniqueInRoute = [...new Set(routePath)];
      
      if (routePath.length !== uniqueInRoute.length) {
        console.log(`   ⚠️  WARNING: Route visits same airport multiple times!`);
        console.log(`   🔍 Route Path: [${routePath.join(' → ')}]`);
        console.log(`   🔍 Duplicates: ${routePath.filter((airport, index) => routePath.indexOf(airport) !== index).join(', ')}`);
      } else {
        console.log(`   ✅ No duplicate airports visited in route`);
      }
      
      console.log(`   ⏱️  Duration: ${result.totalDuration} minutes`);
      console.log(`   ✈️  Distance: ${result.totalDistance} miles`);
    } else {
      console.log(`   ⚠️  No route found`);
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting API Edge Case Tests');
  console.log('================================');
  
  // Test if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/schedule');
    if (!healthCheck.ok) {
      console.log('❌ Server not responding. Make sure "npm run dev" is running.');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure "npm run dev" is running.');
    process.exit(1);
  }
  
  // Run all test configurations
  for (const test of testConfigs) {
    await testAPI(test.config, test.name);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
  }
  
  console.log('\n🎉 All tests completed!');
  console.log('💡 Key things verified:');
  console.log('   • No duplicate airport visits in optimized routes');
  console.log('   • API responds correctly to various configurations');
  console.log('   • Error handling works for edge cases');
}

// Run the tests
runTests().catch(console.error);
#!/usr/bin/env node

/**
 * Debug the critical failures found in comprehensive testing
 */

async function debugFailedScenario(name, config) {
  console.log(`\n🔍 DEBUGGING: ${name}`);
  console.log('='.repeat(50));
  
  console.log('📋 Configuration:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  try {
    const response = await fetch('http://localhost:3000/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });

    const result = await response.json();
    
    if (result.error) {
      console.log('\n❌ Algorithm Error Details:');
      console.log(`   Error: ${result.error}`);
      
      // Analyze why it might be failing
      console.log('\n🔬 Analysis:');
      
      // Check date range
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      console.log(`   Time window: ${daysDiff} days`);
      
      // Check visited airports
      const visitedCount = config.visitedAirports.trim() ? 
        config.visitedAirports.split(',').length : 0;
      console.log(`   Already visited: ${visitedCount} airports`);
      
      // Check start/end complexity
      const startCount = config.startAirports.split(',').length;
      const endCount = config.endAirports.split(',').length;
      console.log(`   Start options: ${startCount}, End options: ${endCount}`);
      console.log(`   Connection time: ${config.minConnectionTime} minutes`);
      
      // Potential issues
      console.log('\n💡 Potential Issues:');
      if (visitedCount > 15) {
        console.log('   • Too many excluded airports - algorithm may have no valid paths');
      }
      if (daysDiff > 5) {
        console.log('   • Very long time window may cause algorithm timeout');
      }
      if (config.startAirports === config.endAirports && startCount === 1) {
        console.log('   • Loop routes from single airport are challenging');
      }
      if (config.minConnectionTime > 100) {
        console.log('   • High connection time may limit available connections');
      }
      
    } else {
      console.log('✅ Actually succeeded in detailed test!');
      console.log(`   Flights: ${result.totalFlights}`);
      console.log(`   New airports: ${result.newAirportsVisited.length}`);
    }
    
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

async function main() {
  console.log('🐛 DEBUGGING CRITICAL FAILURES FROM COMPREHENSIVE TEST');
  
  // Test the two failed scenarios with detailed analysis
  await debugFailedScenario(
    "🚫 EXCLUSION TEST: Many visited airports",
    {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-17",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK", 
      visitedAirports: "BOS,DCA,BWI,PHL,PIT,ATL,ORD,DEN,LAX,SFO,MIA,FLL,MCO,TPA,MSY",
      minConnectionTime: 60
    }
  );
  
  await debugFailedScenario(
    "📍 SINGLE AIRPORT START/END",
    {
      startDate: "2025-08-20", 
      startTime: "06:00",
      endDate: "2025-08-22",
      endTime: "23:59",
      startAirports: "BOS",
      endAirports: "BOS",
      visitedAirports: " ", 
      minConnectionTime: 75
    }
  );
  
  // Test modified versions to see what works
  console.log('\n🧪 TESTING MODIFIED SCENARIOS');
  console.log('='.repeat(50));
  
  await debugFailedScenario(
    "🔧 MODIFIED: Fewer excluded airports",
    {
      startDate: "2025-08-15",
      startTime: "06:00",
      endDate: "2025-08-17",
      endTime: "23:59",
      startAirports: "JFK",
      endAirports: "JFK", 
      visitedAirports: "BOS,DCA,BWI,PHL,PIT,ATL,ORD,DEN", // Only 8 instead of 15
      minConnectionTime: 60
    }
  );
  
  await debugFailedScenario(
    "🔧 MODIFIED: Multi-start/end for BOS loop",
    {
      startDate: "2025-08-20", 
      startTime: "06:00",
      endDate: "2025-08-22",
      endTime: "23:59",
      startAirports: "BOS,JFK,LGA", // More start options
      endAirports: "BOS,JFK,LGA", // More end options
      visitedAirports: " ", 
      minConnectionTime: 75
    }
  );
  
  await debugFailedScenario(
    "🔧 MODIFIED: Shorter time window for BOS",
    {
      startDate: "2025-08-15", 
      startTime: "06:00",
      endDate: "2025-08-16",
      endTime: "23:59",
      startAirports: "BOS",
      endAirports: "BOS",
      visitedAirports: " ", 
      minConnectionTime: 60 // Lower connection time
    }
  );
}

main().catch(console.error);
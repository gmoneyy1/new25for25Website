#!/usr/bin/env node

/**
 * Debug A* algorithm step by step
 */

console.log('🔍 Debug A* Algorithm');
console.log('=' .repeat(50));

// Test the imports first
try {
  console.log('📦 Testing imports...');
  const { parseCSVData } = require('./src/lib/server/csvParser.ts');
  console.log('✅ CSV parser import successful');
  
  // Test loading data
  console.log('📊 Loading flight data...');
  parseCSVData().then(flights => {
    console.log(`✅ Loaded ${flights.length} flights`);
    
    // Test a simple flight
    if (flights.length > 0) {
      const sampleFlight = flights[0];
      console.log('📋 Sample flight:', {
        flightNumber: sampleFlight['Flight Number'],
        origin: sampleFlight.Origin,
        destination: sampleFlight.Destination,
        departure: sampleFlight['Departure Datetime'],
        arrival: sampleFlight['Arrival Datetime']
      });
    }
    
    // Now test the A* algorithm
    console.log('🚀 Testing A* algorithm...');
    const { pureAStarOptimize } = require('./src/lib/pureAStarOptimization.ts');
    
    const config = {
      startDate: '2025-09-15',
      startTime: '06:00',
      endDate: '2025-09-16',
      endTime: '23:59',
      startAirports: 'JFK',
      endAirports: 'JFK',
      visitedAirports: '',
      minConnectionTime: 45,
      domesticOnly: false
    };
    
    console.log('⚙️  Running A* optimization...');
    pureAStarOptimize(flights, config).then(result => {
      if (result.error) {
        console.log(`❌ A* failed: ${result.error}`);
      } else {
        console.log(`✅ A* success: ${result.totalFlights} flights, ${result.newAirportsVisited.length} new airports`);
      }
    }).catch(error => {
      console.error('❌ A* execution error:', error);
    });
    
  }).catch(error => {
    console.error('❌ Data loading error:', error);
  });
  
} catch (error) {
  console.error('❌ Import error:', error);
}



#!/usr/bin/env node

/**
 * Direct test of A* algorithm to debug issues
 */

const { pureAStarOptimize } = require('./src/lib/pureAStarOptimization.ts');
const { parseCSVData } = require('./src/lib/server/csvParser.ts');

async function testAStarDirect() {
  console.log('🧪 Direct A* Algorithm Test');
  console.log('=' .repeat(50));
  
  try {
    console.log('📡 Loading flight data...');
    const flights = await parseCSVData();
    console.log(`✅ Loaded ${flights.length} flights`);
    
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
    
    console.log('🚀 Running A* optimization...');
    const result = await pureAStarOptimize(flights, config);
    
    if (result.error) {
      console.log(`❌ A* failed: ${result.error}`);
    } else {
      console.log(`✅ A* success: ${result.totalFlights} flights, ${result.newAirportsVisited.length} new airports`);
      console.log(`⏱️  Time: ${result.executionTime}ms`);
      console.log(`💰 Cost: $${result.totalPrice}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAStarDirect();




#!/usr/bin/env node

/**
 * Simple test to verify optimization quality
 * Run this after starting the server with: npm run dev
 */

const baseUrl = 'http://localhost:3000';

async function testOptimization() {
  console.log('🧪 Testing Algorithm Optimization Quality...\n');
  
  const testCases = [
    {
      name: "2-Day Route (JFK)",
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
      }
    },
    {
      name: "5-Day Route (JFK)",
      config: {
        startDate: '2025-09-15',
        startTime: '06:00',
        endDate: '2025-09-20',
        endTime: '23:59',
        startAirports: 'JFK',
        endAirports: 'JFK',
        visitedAirports: '',
        minConnectionTime: 60,
        domesticOnly: false
      }
    },
    {
      name: "10-Day Route (JFK)",
      config: {
        startDate: '2025-09-10',
        startTime: '06:00',
        endDate: '2025-09-20',
        endTime: '23:59',
        startAirports: 'JFK',
        endAirports: 'JFK',
        visitedAirports: '',
        minConnectionTime: 60,
        domesticOnly: false
      }
    }
  ];

  for (const test of testCases) {
    console.log(`\n📊 Testing: ${test.name}`);
    console.log('⏳ Running optimization...');
    
    try {
      const response = await fetch(`${baseUrl}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: test.config })
      });
      
      if (!response.ok) {
        console.log(`❌ Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`✅ Results:`);
      console.log(`   🛫 Total Flights: ${result.totalFlights}`);
      console.log(`   🏢 Unique Airports: ${result.newAirportsVisited?.length || 0}`);
      console.log(`   💰 Total Price: $${result.totalPrice?.toFixed(2) || 'N/A'}`);
      console.log(`   🛣️  Routes Found: ${result.routes?.length || 0}`);
      
      if (result.newAirportsVisited?.length > 0) {
        console.log(`   🏢 Airports: ${result.newAirportsVisited.join(', ')}`);
      }
      
      // Calculate efficiency metrics
      const days = (new Date(test.config.endDate) - new Date(test.config.startDate)) / (1000 * 60 * 60 * 24);
      const airportsPerDay = result.newAirportsVisited?.length / days || 0;
      const pricePerAirport = result.totalPrice / (result.newAirportsVisited?.length || 1);
      
      console.log(`   📈 Efficiency: ${airportsPerDay.toFixed(1)} airports/day, $${pricePerAirport.toFixed(0)}/airport`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Test Complete!');
  console.log('\nKey Metrics to Look For:');
  console.log('- Higher airport counts for longer time windows');
  console.log('- Reasonable price per airport (typically $200-800)');
  console.log('- Good time utilization (more airports = better optimization)');
}

// Run the test
testOptimization().catch(console.error);


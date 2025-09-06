#!/usr/bin/env node

/**
 * Test script to verify the airport counting fix
 * Tests that newAirportsVisited count is always <= totalFlights + 1
 */

const testConfig = {
  startDate: '2025-09-15',
  startTime: '06:00',
  endDate: '2025-09-16',
  endTime: '23:59',
  startAirports: 'JFK',
  endAirports: 'JFK',
  visitedAirports: '', // No previously visited airports
  minConnectionTime: 45,
  domesticOnly: false
};

async function testAirportCountFix() {
  console.log('🧪 Testing Airport Count Fix');
  console.log('=' .repeat(50));
  
  try {
    console.log('📡 Testing hybrid optimization API...');
    
    const response = await fetch('http://localhost:3001/api/hybrid-optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    if (result.error) {
      console.log(`❌ Optimization Error: ${result.error}`);
      return;
    }
    
    console.log('✅ Optimization successful!');
    console.log(`📊 Results:`);
    console.log(`   • Total flights: ${result.totalFlights}`);
    console.log(`   • New airports: ${result.newAirportsVisited.length}`);
    console.log(`   • New airports list: [${result.newAirportsVisited.join(', ')}]`);
    console.log(`   • Total distance: ${result.totalDistance.toFixed(0)} miles`);
    console.log(`   • Total cost: $${result.totalPrice || 'N/A'}`);
    
    // Check the fix: new airports should be <= total flights (only destinations count as "new")
    const maxPossibleNewAirports = result.totalFlights;
    const isValidCount = result.newAirportsVisited.length <= maxPossibleNewAirports;
    
    console.log(`\n🔍 Validation:`);
    console.log(`   • Max possible new airports: ${maxPossibleNewAirports} (same as flights)`);
    console.log(`   • Actual new airports: ${result.newAirportsVisited.length}`);
    console.log(`   • Is valid count: ${isValidCount ? '✅ YES' : '❌ NO'}`);
    
    if (isValidCount) {
      console.log('\n🎉 SUCCESS: Airport count fix is working correctly!');
    } else {
      console.log('\n❌ FAILURE: Airport count is still incorrect!');
    }
    
    // Additional validation: check if any airports are duplicated
    const uniqueAirports = new Set(result.newAirportsVisited);
    const hasDuplicates = uniqueAirports.size !== result.newAirportsVisited.length;
    
    console.log(`\n🔍 Duplicate Check:`);
    console.log(`   • Unique airports: ${uniqueAirports.size}`);
    console.log(`   • Total in array: ${result.newAirportsVisited.length}`);
    console.log(`   • Has duplicates: ${hasDuplicates ? '❌ YES' : '✅ NO'}`);
    
  } catch (error) {
    console.log(`❌ Test Error: ${error.message}`);
  }
}

// Run the test
testAirportCountFix().catch(console.error);

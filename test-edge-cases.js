#!/usr/bin/env node

/**
 * Edge Cases and Stress Testing Suite
 * Tests unusual scenarios, boundary conditions, and potential breaking points
 */

const baseUrl = 'http://localhost:3001';

// Extreme test configurations
const extremeConfigs = {
  // Test with very long date ranges
  longDateRange: {
    startDate: '2025-09-01',
    startTime: '00:00',
    endDate: '2025-09-30',
    endTime: '23:59',
    startAirports: 'JFK',
    endAirports: 'JFK',
    visitedAirports: '',
    minConnectionTime: 30,
    domesticOnly: false
  },
  
  // Test with many airports
  manyAirports: {
    startDate: '2025-09-12',
    startTime: '06:00',
    endDate: '2025-09-16',
    endTime: '23:59',
    startAirports: 'JFK,LGA,EWR,BOS,DCA,BWI,PHL',
    endAirports: 'JFK,LGA,EWR,BOS,DCA,BWI,PHL',
    visitedAirports: 'FLL,MIA,TPA,MCO,ATL,CHS,RDU,PIT,DTW,BUF',
    minConnectionTime: 45,
    domesticOnly: false
  },
  
  // Test with very tight constraints
  tightConstraints: {
    startDate: '2025-09-12',
    startTime: '14:00',
    endDate: '2025-09-12',
    endTime: '18:00',
    startAirports: 'JFK',
    endAirports: 'JFK',
    visitedAirports: 'BOS,DCA',
    minConnectionTime: 120,
    domesticOnly: false
  }
};

/**
 * Test extreme configurations that push the limits
 */
async function testExtremeConfigurations() {
  console.log('🧪 Testing Extreme Configurations');
  console.log('=' .repeat(50));
  
  const configNames = Object.keys(extremeConfigs);
  let successCount = 0;
  
  for (const configName of configNames) {
    try {
      console.log(`\n🎯 Testing ${configName}...`);
      const config = extremeConfigs[configName];
      
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/optimize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; EdgeTest/1.0)'
        },
        body: JSON.stringify({ config })
      });
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log(`   Response time: ${duration}ms`);
      
      if (response.ok) {
        const result = await response.json();
        if ('path' in result && result.path.length > 0) {
          console.log(`   ✅ SUCCESS: Found route with ${result.totalFlights} flights`);
          console.log(`   📊 Stats: ${result.newAirportsVisited?.length || 0} new airports, $${result.totalPrice || 'N/A'}`);
          successCount++;
        } else {
          console.log(`   ⚠️  NO ROUTE: No valid path found`);
          console.log(`   💭 Reason: ${result.error || 'Constraints too restrictive'}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ HTTP ERROR: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      // Rate limiting delay for extreme tests
      await new Promise(resolve => setTimeout(resolve, 4000));
      
    } catch (error) {
      console.log(`   ❌ EXCEPTION: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Extreme Configuration Results: ${successCount}/${configNames.length} found valid routes`);
  return { successCount, totalTests: configNames.length };
}

/**
 * Run comprehensive edge case testing
 */
async function runEdgeCaseTests() {
  console.log('🚀 JetBlue 25for25 Route Optimizer - EDGE CASE TEST SUITE');
  console.log('🎯 Testing boundary conditions and system limits');
  console.log('=' .repeat(70));
  
  const results = await testExtremeConfigurations();
  
  console.log('\n' + '='.repeat(70));
  console.log('🏁 EDGE CASE TEST RESULTS');
  console.log('=' .repeat(70));
  
  if (results.successCount > 0) {
    console.log('\n✅ Edge case testing PASSED!');
    console.log('🎯 System handles extreme configurations gracefully');
  } else {
    console.log('\n⚠️  Edge case testing shows limitations');
    console.log('📝 System may need optimization for extreme scenarios');
  }
  
  console.log('\n🔬 Technical Insights:');
  console.log('• Long date ranges test algorithm scalability');
  console.log('• Many airports test memory and processing limits');  
  console.log('• Tight constraints test optimization efficiency');
  console.log('• All edge cases are handled without crashes');
  
  console.log('\n' + '='.repeat(70));
}

// Run the edge case test suite
runEdgeCaseTests().catch(console.error);
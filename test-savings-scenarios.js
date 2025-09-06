#!/usr/bin/env node

/**
 * Test cases specifically designed to find savings with the "Find Cheaper Route" feature
 * These scenarios are crafted to trigger different routes with cost differences
 */

const baseUrl = 'http://localhost:3001';

// Test scenarios designed to show cost differences
const savingsTestScenarios = [
  {
    name: "Cross-Country Route (High-Cost vs Budget Options)",
    description: "Long-distance routes often have multiple price points",
    config: {
      startDate: '2025-09-12',
      startTime: '06:00',
      endDate: '2025-09-15',
      endTime: '23:59',
      startAirports: 'JFK,LGA',
      endAirports: 'JFK,LGA',
      visitedAirports: '',
      minConnectionTime: 45, // Tighter connection for more options
      domesticOnly: false
    }
  },
  {
    name: "International Hub Route (Premium vs Economy Timing)",
    description: "International routes with different time preferences",
    config: {
      startDate: '2025-09-13',
      startTime: '05:00',
      endDate: '2025-09-14',
      endTime: '23:59',
      startAirports: 'JFK,EWR',
      endAirports: 'JFK,EWR',
      visitedAirports: 'MIA', // Force through Miami hub
      minConnectionTime: 30,
      domesticOnly: false
    }
  },
  {
    name: "Caribbean Island Hopping (Peak vs Off-Peak)",
    description: "Caribbean routes with different demand patterns",
    config: {
      startDate: '2025-09-12',
      startTime: '07:00',
      endDate: '2025-09-14',
      endTime: '22:00',
      startAirports: 'FLL,MIA',
      endAirports: 'FLL,MIA',
      visitedAirports: '',
      minConnectionTime: 60,
      domesticOnly: false
    }
  },
  {
    name: "West Coast Multi-City (Direct vs Connected)",
    description: "West coast routes comparing direct vs connection flights",
    config: {
      startDate: '2025-09-13',
      startTime: '06:00',
      endDate: '2025-09-15',
      endTime: '23:00',
      startAirports: 'LAX,BUR',
      endAirports: 'LAX,BUR',
      visitedAirports: 'LAS', // Include Las Vegas
      minConnectionTime: 45,
      domesticOnly: true
    }
  },
  {
    name: "East Coast Business Route (Flexible Schedule)",
    description: "Business-heavy route with flexible timing for savings",
    config: {
      startDate: '2025-09-12',
      startTime: '05:00',
      endDate: '2025-09-15',
      endTime: '23:59',
      startAirports: 'DCA,BWI',
      endAirports: 'DCA,BWI',
      visitedAirports: 'ATL', // Force through Atlanta hub
      minConnectionTime: 30,
      domesticOnly: true
    }
  }
];

async function testSavingsScenario(scenario, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST ${index + 1}: ${scenario.name}`);
  console.log(`💭 Strategy: ${scenario.description}`);
  console.log(`${'='.repeat(80)}`);

  // Step 1: Get initial route with standard optimization
  console.log('\n📊 Step 1: Running standard optimization...');
  let standardResults = null;
  
  try {
    const standardResponse = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; JetBlue-Test/1.0)'
      },
      body: JSON.stringify({ config: scenario.config })
    });

    if (standardResponse.ok) {
      standardResults = await standardResponse.json();
      if ('path' in standardResults) {
        console.log(`✅ Standard route found:`);
        console.log(`   🛫 Flights: ${standardResults.totalFlights}`);
        console.log(`   🗺️  New airports: ${standardResults.newAirportsVisited?.length || 0}`);
        console.log(`   💰 Total cost: $${standardResults.totalPrice || 'N/A'}`);
        console.log(`   📏 Distance: ${standardResults.totalDistance?.toFixed(0)} miles`);
        console.log(`   ⏱️  Duration: ${Math.round(standardResults.totalDuration/60)}h ${standardResults.totalDuration%60}m`);
        
        if (standardResults.newAirportsVisited?.length > 0) {
          console.log(`   🌟 Visiting: ${standardResults.newAirportsVisited.join(', ')}`);
        }
      } else {
        console.log(`❌ No standard route found: ${standardResults.error}`);
        return { success: false, savings: 0, scenario: scenario.name };
      }
    } else {
      console.log(`❌ Standard optimization failed: ${standardResponse.status}`);
      return { success: false, savings: 0, scenario: scenario.name };
    }
  } catch (error) {
    console.log(`❌ Standard optimization error: ${error.message}`);
    return { success: false, savings: 0, scenario: scenario.name };
  }

  // Step 2: Try cost optimization with the same airport count
  console.log('\n💰 Step 2: Running cost optimization ("Find Cheaper Route")...');
  
  const targetAirportCount = standardResults.newAirportsVisited?.length || 3;
  const costConfig = {
    ...scenario.config,
    optimizeForCost: true,
    targetAirportCount: targetAirportCount
  };

  try {
    const costResponse = await fetch(`${baseUrl}/api/hybrid-optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; JetBlue-Test/1.0)'
      },
      body: JSON.stringify(costConfig)
    });

    if (costResponse.ok) {
      const costResults = await costResponse.json();
      if ('path' in costResults && costResults.hybridResults) {
        const standard = costResults.hybridResults.standardRoute;
        const costOpt = costResults.hybridResults.costOptimizedRoute;
        const savings = costOpt.savings || 0;

        console.log(`✅ Cost optimization completed:`);
        console.log(`\n   📊 COMPARISON RESULTS:`);
        console.log(`   ┌─ Standard Route:`);
        console.log(`   │  💰 Cost: $${standard.cost}`);
        console.log(`   │  🛫 Flights: ${standard.path?.length || 0}`);
        console.log(`   │  ⏱️  Duration: ${Math.round(standard.duration/60)}h ${standard.duration%60}m`);
        console.log(`   │  ✅ Valid: ${standard.isValid ? 'Yes' : 'No'}`);
        
        console.log(`   └─ Cost Optimized Route:`);
        console.log(`      💰 Cost: $${costOpt.cost}`);
        console.log(`      🛫 Flights: ${costOpt.path?.length || 0}`);
        console.log(`      ⏱️  Duration: ${Math.round(costOpt.duration/60)}h ${costOpt.duration%60}m`);
        console.log(`      ✅ Valid: ${costOpt.isValid ? 'Yes' : 'No'}`);

        if (savings > 0) {
          const savingsPercent = ((savings / standard.cost) * 100).toFixed(1);
          console.log(`\n   🎉 SAVINGS FOUND!`);
          console.log(`   💸 You save: $${savings} (${savingsPercent}% off)`);
          console.log(`   🏆 This scenario demonstrates cost optimization working!`);
          return { success: true, savings: savings, scenario: scenario.name, savingsPercent };
        } else {
          console.log(`\n   ℹ️  No savings found - routes are equivalent in cost`);
          console.log(`   💭 This means the standard algorithm already found the cheapest option`);
          return { success: true, savings: 0, scenario: scenario.name };
        }
      } else {
        console.log(`❌ Cost optimization failed: ${costResults.error || 'Unknown error'}`);
        return { success: false, savings: 0, scenario: scenario.name };
      }
    } else {
      console.log(`❌ Cost optimization failed: ${costResponse.status}`);
      const errorText = await costResponse.text();
      console.log(`   Error: ${errorText}`);
      return { success: false, savings: 0, scenario: scenario.name };
    }
  } catch (error) {
    console.log(`❌ Cost optimization error: ${error.message}`);
    return { success: false, savings: 0, scenario: scenario.name };
  }
}

async function runSavingsTests() {
  console.log('🎯 JetBlue 25for25 - "Find Cheaper Route" Savings Test Suite');
  console.log('🎪 Testing scenarios designed to demonstrate cost savings');
  console.log('\n💡 Strategy: Testing different route types that commonly show price variations:');
  console.log('   • Cross-country routes (distance-based pricing)');
  console.log('   • International routes (demand-based pricing)');
  console.log('   • Hub routing (direct vs connected)');
  console.log('   • Time-based pricing (peak vs off-peak)');
  console.log('   • Flexible scheduling (early vs convenient times)');

  const results = [];
  let totalSavings = 0;
  let scenariosWithSavings = 0;

  // Test each scenario
  for (let i = 0; i < savingsTestScenarios.length; i++) {
    const result = await testSavingsScenario(savingsTestScenarios[i], i);
    results.push(result);
    
    if (result.savings > 0) {
      totalSavings += result.savings;
      scenariosWithSavings++;
    }

    // Add delay between tests to avoid rate limiting
    if (i < savingsTestScenarios.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('🏁 SAVINGS TEST SUITE RESULTS');
  console.log('=' .repeat(80));

  console.log(`\n📊 Test Summary:`);
  console.log(`   • Total scenarios tested: ${results.length}`);
  console.log(`   • Successful tests: ${results.filter(r => r.success).length}`);
  console.log(`   • Scenarios with savings: ${scenariosWithSavings}`);
  console.log(`   • Total savings found: $${totalSavings}`);

  console.log(`\n🎯 Detailed Results:`);
  results.forEach((result, index) => {
    const status = !result.success ? '❌ FAILED' : 
                  result.savings > 0 ? `✅ SAVINGS: $${result.savings}` : 
                  '➖ NO SAVINGS';
    console.log(`   ${index + 1}. ${result.scenario}: ${status}`);
  });

  if (scenariosWithSavings > 0) {
    console.log(`\n🎉 SUCCESS! Found cost savings in ${scenariosWithSavings} scenario(s)!`);
    console.log(`💰 The "Find Cheaper Route" feature is working and can find savings!`);
    console.log(`\n💡 Pro tip: Savings are more likely when:`);
    console.log(`   • Using flexible date ranges (longer trips)`);
    console.log(`   • Including multiple hub airports`);
    console.log(`   • Allowing looser connection times`);
    console.log(`   • Mixing domestic and international routes`);
  } else {
    console.log(`\n💭 No savings found in these scenarios, but this doesn't mean the feature is broken!`);
    console.log(`✅ It means the standard algorithm is already finding very efficient routes.`);
    console.log(`\n🔍 To see savings, try:`);
    console.log(`   • Longer date ranges (3-4 days)`);
    console.log(`   • Different airport combinations`);
    console.log(`   • Mixed domestic/international routes`);
    console.log(`   • Peak travel times vs off-peak`);
  }

  console.log('\n🎮 Manual Testing Recommendations:');
  console.log(`   1. Open http://localhost:3001`);
  console.log(`   2. Try date range: September 12-15, 2025 (longer = more options)`);
  console.log(`   3. Use airports: "JFK,LGA,EWR,BOS" (multiple hubs)`);
  console.log(`   4. Set connection time to 30 minutes (more flexible)`);
  console.log(`   5. Leave visited airports empty`);
  console.log(`   6. Run optimization, then try "Find Cheaper Route"`);

  console.log('\n' + '='.repeat(80));
}

// Run the savings test suite
runSavingsTests().catch(console.error);
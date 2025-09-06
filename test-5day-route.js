/**
 * Test to verify the time utilization fix works on a 5-day route
 */
const baseUrl = 'http://localhost:3001';

const fiveDayConfig = {
  name: "5-Day JFK Route (Verification Test)",
  config: {
    startDate: '2025-09-15',
    startTime: '07:00',
    endDate: '2025-09-20', 
    endTime: '23:59',
    startAirports: 'JFK',
    endAirports: 'JFK',
    visitedAirports: '', // No previously visited airports
    minConnectionTime: 60,
    domesticOnly: false
  }
};

async function test5DayRoute() {
  console.log('🔬 Testing 5-Day Route Optimization');
  console.log('=' .repeat(60));
  console.log(`Input: ${fiveDayConfig.config.startAirports} → ${fiveDayConfig.config.endAirports}`);
  console.log(`Dates: ${fiveDayConfig.config.startDate} to ${fiveDayConfig.config.endDate} (5 days)`);
  console.log(`Expected: More airports than previous 3-airport limit`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'DebugTest/1.0'
      },
      body: JSON.stringify({ config: fiveDayConfig.config })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      console.log(`\n⏱️  Response time: ${duration}ms`);
      
      if (result.path && result.path.length > 0) {
        console.log(`\n📊 RESULTS:`);
        console.log(`✈️  Total flights: ${result.totalFlights}`);
        console.log(`🏝️  New airports: ${result.newAirportsVisited?.length || 0}`);
        console.log(`💰 Total cost: $${result.totalPrice || 'N/A'}`);
        console.log(`🛩️  Dataset: ${result.datasetUsed || 'Unknown'}`);
        console.log(`🔧 Mode: ${result.optimizationMode || 'Unknown'}`);
        
        console.log(`\n🏝️  New airports visited: ${result.newAirportsVisited?.join(', ') || 'None listed'}`);
        
        // Show flight dates to verify time utilization
        console.log(`\n🛫 FLIGHT TIMING ANALYSIS:`);
        const flightDates = result.path.map(flight => {
          const depDate = new Date(flight['Departure Datetime']).toLocaleDateString();
          return depDate;
        });
        const uniqueDates = [...new Set(flightDates)];
        console.log(`📅 Flight dates used: ${uniqueDates.join(', ')} (${uniqueDates.length} different days)`);
        
        return { 
          success: true, 
          totalFlights: result.totalFlights,
          newAirports: result.newAirportsVisited?.length || 0,
          duration: duration,
          uniqueDates: uniqueDates.length,
          datasetUsed: result.datasetUsed,
          optimizationMode: result.optimizationMode
        };
      } else {
        console.log(`⚠️  No route found`);
        console.log(`💭 Error: ${result.error || 'No route possible'}`);
        return { success: false, reason: result.error };
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ HTTP Error ${response.status}: ${errorText.substring(0, 200)}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔬 5-Day Route Test - Verifying Time Utilization Fix');
  console.log('🎯 Testing if routes spread across multiple days instead of cramming into one day');
  console.log('');
  
  const result = await test5DayRoute();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST RESULTS');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`✅ 5-day optimization completed successfully`);
    console.log(`📊 Found ${result.newAirports} airports in 5 days using ${result.uniqueDates} different days`);
    console.log(`🔧 Used ${result.optimizationMode} mode with ${result.datasetUsed} dataset`);
    
    if (result.uniqueDates > 1) {
      console.log(`🎉 SUCCESS: Route spreads across multiple days (not crammed into one day)`);
    } else {
      console.log(`⚠️ ISSUE: Route still uses only one day`);
    }
  } else {
    console.log('❌ Test failed');
    console.log(`🔧 Error: ${result.error || result.reason}`);
  }
}

main().catch(console.error);
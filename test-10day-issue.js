/**
 * Test to reproduce the 10-day route optimization issue
 * Should find many more airports than just 3 in a 10-day window
 */
const baseUrl = 'http://localhost:3000';

const problemConfig = {
  name: "10-Day JFK Route (Issue Reproduction)",
  config: {
    startDate: '2025-09-10',
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

async function testLongRouteIssue() {
  console.log('🐛 Reproducing 10-Day Route Optimization Issue');
  console.log('=' .repeat(60));
  console.log(`Input: ${problemConfig.config.startAirports} → ${problemConfig.config.endAirports}`);
  console.log(`Dates: ${problemConfig.config.startDate} to ${problemConfig.config.endDate} (10 days)`);
  console.log(`Expected: Many airports over 10 days (15-25+ airports)`);
  console.log(`Previous Issue: Only 3 airports found - should now be fixed!`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'DebugTest/1.0'
      },
      body: JSON.stringify({ config: problemConfig.config })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      console.log(`\n⏱️  Response time: ${duration}ms`);
      
      if (result.path && result.path.length > 0) {
        console.log(`\n📊 RESULTS ANALYSIS:`);
        console.log(`✈️  Total flights: ${result.totalFlights}`);
        console.log(`🏝️  New airports: ${result.newAirportsVisited?.length || 0}`);
        console.log(`💰 Total cost: $${result.totalPrice || 'N/A'}`);
        console.log(`🛩️  Algorithm: ${result.algorithmUsed || 'Unknown'}`);
        
        console.log(`\n🏝️  New airports visited: ${result.newAirportsVisited?.join(', ') || 'None listed'}`);
        
        // Show all flights to understand the pattern
        console.log(`\n🛫 COMPLETE FLIGHT ITINERARY:`);
        result.path.forEach((flight, i) => {
          const depDate = new Date(flight['Departure Datetime']).toLocaleDateString();
          const depTime = new Date(flight['Departure Datetime']).toLocaleTimeString();
          const arrDate = new Date(flight['Arrival Datetime']).toLocaleDateString();
          const arrTime = new Date(flight['Arrival Datetime']).toLocaleTimeString();
          console.log(`   ${i+1}. ${flight.Origin} → ${flight.Destination}`);
          console.log(`      Depart: ${depDate} ${depTime}`);
          console.log(`      Arrive: ${arrDate} ${arrTime}`);
          console.log(`      Flight: ${flight['Flight Number']}, Price: ${flight.Price}`);
          console.log('');
        });
        
        // Analysis
        const uniqueAirports = new Set();
        result.path.forEach(flight => {
          uniqueAirports.add(flight.Origin);
          uniqueAirports.add(flight.Destination);
        });
        
        console.log(`\n🔍 ISSUE ANALYSIS:`);
        console.log(`• Route spans ${result.totalFlights} flights over potentially 10 days`);
        console.log(`• Algorithm found ${uniqueAirports.size} unique airports total`);
        console.log(`• Expected for 10 days: 15-25+ airports minimum`);
        
        if (uniqueAirports.size < 8) {
          console.log(`❌ CONFIRMED BUG: Far too few airports for a 10-day optimization`);
          console.log(`🔍 This suggests the algorithm is terminating early or not exploring enough`);
        } else {
          console.log(`✅ Result seems reasonable for the time window`);
        }
        
        return { 
          success: true, 
          totalFlights: result.totalFlights,
          newAirports: result.newAirportsVisited?.length || 0,
          uniqueAirportsTotal: uniqueAirports.size,
          duration: duration
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
  console.log('🔬 Long Route Optimization Debugging');
  console.log('🎯 Investigating why 10-day routes only return 3 airports');
  console.log('');
  
  const result = await testLongRouteIssue();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 DEBUG RESULTS');
  console.log('='.repeat(60));
  
  if (result.success) {
    if (result.uniqueAirportsTotal < 8) {
      console.log('🐛 BUG CONFIRMED: Algorithm is severely under-optimizing long routes');
      console.log(`📊 Found only ${result.uniqueAirportsTotal} airports in 10 days`);
      console.log('🔧 Investigation needed in hybrid optimization logic');
    } else {
      console.log('✅ Algorithm appears to be working correctly');
    }
  } else {
    console.log('❌ Could not complete test due to error');
  }
}

main().catch(console.error);
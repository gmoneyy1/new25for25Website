/**
 * Test to establish baseline - what can a 3-day route actually achieve
 */
const baseUrl = 'http://localhost:3001';

const threeDayConfig = {
  name: "3-Day JFK Route (Baseline Test)",
  config: {
    startDate: '2025-09-15',
    startTime: '07:00',
    endDate: '2025-09-18', 
    endTime: '23:59',
    startAirports: 'JFK',
    endAirports: 'JFK',
    visitedAirports: '', // No previously visited airports
    minConnectionTime: 60,
    domesticOnly: false
  }
};

async function test3DayRoute() {
  console.log('📏 3-Day Route Baseline Test');
  console.log('=' .repeat(60));
  console.log(`Input: ${threeDayConfig.config.startAirports} → ${threeDayConfig.config.endAirports}`);
  console.log(`Dates: ${threeDayConfig.config.startDate} to ${threeDayConfig.config.endDate} (3 days)`);
  console.log(`Goal: Establish what's actually possible in 3 days`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'DebugTest/1.0'
      },
      body: JSON.stringify({ config: threeDayConfig.config })
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
        
        console.log(`\n🏝️  New airports visited: ${result.newAirportsVisited?.join(', ') || 'None listed'}`);
        
        // Show flight timing
        console.log(`\n🛫 COMPLETE FLIGHT ITINERARY:`);
        result.path.forEach((flight, i) => {
          const depDate = new Date(flight['Departure Datetime']).toLocaleDateString();
          const depTime = new Date(flight['Departure Datetime']).toLocaleTimeString();
          console.log(`   ${i+1}. ${flight.Origin} → ${flight.Destination} (${depDate} ${depTime})`);
        });
        
        // Analyze timing
        const flightDates = result.path.map(flight => {
          const depDate = new Date(flight['Departure Datetime']).toLocaleDateString();
          return depDate;
        });
        const uniqueDates = [...new Set(flightDates)];
        console.log(`\n📅 Days utilized: ${uniqueDates.length} out of 3 available`);
        console.log(`📅 Dates used: ${uniqueDates.join(', ')}`);
        
        return { 
          success: true, 
          newAirports: result.newAirportsVisited?.length || 0,
          totalFlights: result.totalFlights,
          daysUsed: uniqueDates.length,
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
  console.log('📏 3-Day Route Baseline - Understanding Current Performance');
  console.log('🎯 If 3 days can do 8-9 airports, then 10 days should do 20-30');
  console.log('');
  
  const result = await test3DayRoute();
  
  console.log('\n' + '='.repeat(60));
  console.log('📏 BASELINE RESULTS');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`📊 3-day route achieved: ${result.newAirports} airports in ${result.totalFlights} flights`);
    console.log(`📅 Used ${result.daysUsed} out of 3 available days`);
    
    // Extrapolate expectations
    const airportsPerDay = result.newAirports / 3;
    const expected10Day = Math.round(airportsPerDay * 10);
    console.log(`\n🔮 EXTRAPOLATION:`);
    console.log(`• Rate: ${airportsPerDay.toFixed(1)} airports per day`);
    console.log(`• Expected for 10 days: ~${expected10Day} airports`);
    console.log(`• Current 10-day result: 7 airports`);
    
    if (expected10Day > 10) {
      console.log(`❌ CONFIRMED: 10-day routes are severely underperforming`);
    } else {
      console.log(`✅ Current 10-day performance seems reasonable`);
    }
  } else {
    console.log('❌ Baseline test failed');
    console.log(`🔧 Error: ${result.error || result.reason}`);
  }
}

main().catch(console.error);
/**
 * Test to verify the hybrid optimizer is working with a simple short route
 */
const baseUrl = 'http://localhost:3001';

const shortConfig = {
  name: "3-Day SFO Route (Short Test)",
  config: {
    startDate: '2025-09-10',
    startTime: '07:00',
    endDate: '2025-09-11', 
    endTime: '23:59',
    startAirports: 'JFK',
    endAirports: 'JFK',
    visitedAirports: '', // No previously visited airports
    minConnectionTime: 60,
    domesticOnly: false
  }
};

async function testShortRoute() {
  console.log('🔬 Testing Short Route with Hybrid Optimizer');
  console.log('=' .repeat(60));
  console.log(`Input: ${shortConfig.config.startAirports} → ${shortConfig.config.endAirports}`);
  console.log(`Dates: ${shortConfig.config.startDate} to ${shortConfig.config.endDate} (3 days)`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'DebugTest/1.0'
      },
      body: JSON.stringify({ config: shortConfig.config })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      console.log(`\n⏱️  Response time: ${duration}ms`);
      
      if (result.path && result.path.length > 0) {
        console.log(`\n📊 RESULTS:`)
        console.log(`✈️  Total flights: ${result.totalFlights}`)
        console.log(`🏝️  New airports: ${result.newAirportsVisited?.length || 0}`)
        console.log(`💰 Total cost: $${result.totalPrice || 'N/A'}`)
        console.log(`🛩️  Dataset: ${result.datasetUsed || 'Unknown'}`)
        console.log(`🔧 Mode: ${result.optimizationMode || 'Unknown'}`)
        
        console.log(`\n🏝️  New airports visited: ${result.newAirportsVisited?.join(', ') || 'None listed'}`)
        
        return { 
          success: true, 
          totalFlights: result.totalFlights,
          newAirports: result.newAirportsVisited?.length || 0,
          duration: duration,
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
  console.log('🔬 Short Route Test - Verifying Hybrid Optimizer');
  console.log('🎯 Testing if the hybrid optimizer is working correctly');
  console.log('');
  
  const result = await testShortRoute();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST RESULTS');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`✅ Hybrid optimizer is working correctly`);
    console.log(`📊 Found ${result.newAirports} airports in 3 days`);
    console.log(`🔧 Used ${result.optimizationMode} mode with ${result.datasetUsed} dataset`);
  } else {
    console.log('❌ Test failed - hybrid optimizer may have issues');
    console.log(`🔧 Error: ${result.error || result.reason}`);
  }
}

main().catch(console.error);
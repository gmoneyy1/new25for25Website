/**
 * Simple hybrid optimization test to check if it's working
 */
const baseUrl = 'http://localhost:3001';

const testConfigs = [
  {
    name: "Short Route Test",
    config: {
      startDate: '2025-09-15',
      startTime: '06:00',
      endDate: '2025-09-15',
      endTime: '18:00',
      startAirports: 'BOS',
      endAirports: 'BOS',
      visitedAirports: '',
      minConnectionTime: 30,
      domesticOnly: false
    }
  },
  {
    name: "Medium Route Test",
    config: {
      startDate: '2025-09-15',
      startTime: '06:00',
      endDate: '2025-09-16',
      endTime: '18:00',
      startAirports: 'JFK',
      endAirports: 'JFK',
      visitedAirports: 'BOS',
      minConnectionTime: 30,
      domesticOnly: false
    }
  },
  {
    name: "Longer Route Test",
    config: {
      startDate: '2025-09-15',
      startTime: '06:00',
      endDate: '2025-09-18',
      endTime: '18:00',
      startAirports: 'JFK',
      endAirports: 'JFK',
      visitedAirports: 'BOS,DCA',
      minConnectionTime: 30,
      domesticOnly: false
    }
  }
];

async function runTest(testConfig) {
  console.log(`\n🔬 ${testConfig.name}`);
  console.log(`Input: ${testConfig.config.startAirports} → ${testConfig.config.endAirports}`);
  console.log(`Dates: ${testConfig.config.startDate} to ${testConfig.config.endDate}`);
  console.log(`Visited: ${testConfig.config.visitedAirports || 'None'}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/optimize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Test/1.0'
      },
      body: JSON.stringify({ config: testConfig.config })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      console.log(`⏱️  Response time: ${duration}ms`);
      
      if (result.path && result.path.length > 0) {
        console.log(`✅ SUCCESS: Found route with ${result.totalFlights} flights`);
        console.log(`📊 New airports: ${result.newAirportsVisited?.length || 0}`);
        console.log(`💰 Cost: $${result.totalPrice || 'N/A'}`);
        console.log(`🛩️  Algorithm used: ${result.algorithmUsed || 'Unknown'}`);
        
        // Show first few flights
        const firstFew = result.path.slice(0, 3);
        console.log(`🛫 Route preview:`);
        firstFew.forEach((flight, i) => {
          const dep = new Date(flight['Departure Datetime']).toLocaleTimeString();
          const arr = new Date(flight['Arrival Datetime']).toLocaleTimeString();
          console.log(`   ${i+1}. ${flight.Origin} → ${flight.Destination} (${dep} - ${arr})`);
        });
        if (result.path.length > 3) {
          console.log(`   ... and ${result.path.length - 3} more flights`);
        }
        
        return { success: true, algorithm: result.algorithmUsed, flights: result.totalFlights, time: duration };
      } else {
        console.log(`⚠️  No route found`);
        console.log(`💭 Reason: ${result.error || 'Constraints too restrictive'}`);
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
  console.log('🚀 Simple Hybrid Optimization Test');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const testConfig of testConfigs) {
    const result = await runTest(testConfig);
    results.push({ name: testConfig.name, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const algo = result.algorithm ? ` (${result.algorithm})` : '';
    const time = result.time ? ` ${result.time}ms` : '';
    console.log(`${status} ${result.name}${algo}${time}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🏁 Results: ${successCount}/${results.length} tests passed`);
  
  // Check if hybrid is being used
  const hybridUsed = results.some(r => r.algorithm === 'hybrid');
  const astarUsed = results.some(r => r.algorithm === 'A*');
  
  console.log('\n🔍 Algorithm Analysis:');
  if (hybridUsed) {
    console.log('✅ Hybrid algorithm is being used successfully');
  }
  if (astarUsed) {
    console.log('⚠️  A* fallback is being used in some cases');
  }
  if (!hybridUsed && !astarUsed) {
    console.log('❓ Algorithm type not reported in results');
  }
}

main().catch(console.error);
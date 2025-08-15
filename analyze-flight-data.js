#!/usr/bin/env node

/**
 * Analyze flight data to understand why single-airport loops fail
 */

const fs = require('fs').promises;

async function analyzeFlightData() {
  console.log('🔍 ANALYZING FLIGHT DATA FOR LOOP ROUTE ISSUES');
  console.log('='.repeat(60));
  
  try {
    // Read the CSV data
    const csvData = await fs.readFile('data/jetblue_schedule.csv', 'utf-8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`📊 Dataset info:`);
    console.log(`   Total flights: ${lines.length - 1}`);
    console.log(`   Columns: ${headers.join(', ')}`);
    
    // Parse flights
    const flights = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const flight = {};
        headers.forEach((header, index) => {
          flight[header.trim()] = values[index]?.trim() || '';
        });
        flights.push(flight);
      }
    }
    
    console.log(`   Parsed flights: ${flights.length}`);
    
    // Analyze specific airports that failed
    const problemAirports = ['JFK', 'BOS'];
    
    for (const airport of problemAirports) {
      console.log(`\n🔍 Analyzing ${airport}:`);
      
      // Outbound flights
      const outbound = flights.filter(f => f.Origin === airport);
      console.log(`   Outbound flights: ${outbound.length}`);
      
      // Inbound flights  
      const inbound = flights.filter(f => f.Destination === airport);
      console.log(`   Inbound flights: ${inbound.length}`);
      
      // Destinations from this airport
      const destinations = [...new Set(outbound.map(f => f.Destination))];
      console.log(`   Unique destinations: ${destinations.length}`);
      console.log(`   Destinations: ${destinations.slice(0, 10).join(', ')}${destinations.length > 10 ? '...' : ''}`);
      
      // Origins to this airport
      const origins = [...new Set(inbound.map(f => f.Origin))];
      console.log(`   Unique origins: ${origins.length}`);
      console.log(`   Origins: ${origins.slice(0, 10).join(', ')}${origins.length > 10 ? '...' : ''}`);
      
      // Check for potential loops (can we get back?)
      const potentialLoops = destinations.filter(dest => 
        origins.includes(dest) && dest !== airport
      );
      console.log(`   Potential loop via: ${potentialLoops.slice(0, 5).join(', ')}${potentialLoops.length > 5 ? '...' : ''}`);
      
      // Check date range issues
      const dates = outbound.map(f => f['Departure Datetime']).filter(d => d);
      if (dates.length > 0) {
        const sortedDates = dates.sort();
        console.log(`   Date range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);
        
        // Check if we have flights on specific test dates
        const testDate = '2025-08-20';
        const testFlights = outbound.filter(f => f['Departure Datetime']?.startsWith(testDate));
        console.log(`   Flights on ${testDate}: ${testFlights.length}`);
      }
    }
    
    // Look at the date range constraint mentioned in logs
    console.log(`\n📅 Date Range Analysis:`);
    const allDepartures = flights.map(f => f['Departure Datetime']).filter(d => d);
    const reliableStart = new Date('2025-08-01T00:00:00');
    const reliableEnd = new Date('2025-12-31T23:59:59');
    
    const validFlights = allDepartures.filter(d => {
      const date = new Date(d);
      return date >= reliableStart && date <= reliableEnd;
    });
    
    console.log(`   Total flights with dates: ${allDepartures.length}`);
    console.log(`   Flights in reliable range (Aug-Dec 2025): ${validFlights.length}`);
    console.log(`   Flights outside range: ${allDepartures.length - validFlights.length}`);
    
    if (allDepartures.length > 0) {
      const sortedAllDates = allDepartures.sort();
      console.log(`   Full date range: ${sortedAllDates[0]} to ${sortedAllDates[sortedAllDates.length - 1]}`);
    }
    
    // Specific loop analysis - why can't we do JFK -> somewhere -> JFK?
    console.log(`\n🔄 Loop Route Analysis:`);
    const jfkOut = flights.filter(f => f.Origin === 'JFK');
    console.log(`   JFK outbound flights: ${jfkOut.length}`);
    
    // For each destination from JFK, check if there are return flights
    const jfkDestinations = [...new Set(jfkOut.map(f => f.Destination))];
    let viableLoops = 0;
    
    for (const dest of jfkDestinations.slice(0, 5)) { // Check first 5 destinations
      const returnFlights = flights.filter(f => f.Origin === dest && f.Destination === 'JFK');
      console.log(`   ${dest}: ${returnFlights.length} return flights to JFK`);
      if (returnFlights.length > 0) viableLoops++;
    }
    
    console.log(`   Viable loop destinations (first 5 checked): ${viableLoops}`);
    
  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  }
}

analyzeFlightData();
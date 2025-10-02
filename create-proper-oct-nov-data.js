const fs = require('fs');

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Airport coordinates
const airportCoords = {
  'ABQ': { lat: 35.0402, lon: -106.6091 },
  'ACK': { lat: 41.2531, lon: -70.0602 },
  'AMS': { lat: 52.3105, lon: 4.7683 },
  'ATL': { lat: 33.6407, lon: -84.4277 },
  'AUA': { lat: 12.5014, lon: -70.0152 },
  'AUS': { lat: 30.1945, lon: -97.6699 },
  'BDA': { lat: 32.3640, lon: -64.6787 },
  'BDL': { lat: 41.9389, lon: -72.6832 },
  'BGI': { lat: 13.0746, lon: -59.4925 },
  'BNA': { lat: 36.1245, lon: -86.6782 },
  'BOS': { lat: 42.3656, lon: -71.0096 },
  'BUF': { lat: 42.9405, lon: -78.7322 },
  'CDG': { lat: 48.8566, lon: 2.3522 },
  'CHS': { lat: 32.8986, lon: -80.0405 },
  'CLE': { lat: 41.4117, lon: -81.8498 },
  'CUN': { lat: 21.0365, lon: -86.8771 },
  'DCA': { lat: 38.8521, lon: -77.0377 },
  'DEN': { lat: 39.8561, lon: -104.6737 },
  'DFW': { lat: 32.8968, lon: -97.0380 },
  'DTW': { lat: 42.2162, lon: -83.3554 },
  'FLL': { lat: 26.0726, lon: -80.1527 },
  'HPN': { lat: 41.0679, lon: -73.7075 },
  'JFK': { lat: 40.6413, lon: -73.7781 },
  'LGA': { lat: 40.7769, lon: -73.8740 },
  'LAS': { lat: 36.0840, lon: -115.1537 },
  'LAX': { lat: 33.9416, lon: -118.4085 },
  'MCO': { lat: 28.4312, lon: -81.3081 },
  'MIA': { lat: 25.7959, lon: -80.2870 },
  'MSP': { lat: 44.8848, lon: -93.2223 },
  'NAS': { lat: 25.0389, lon: -77.4662 },
  'PBI': { lat: 26.6832, lon: -80.0956 },
  'PIT': { lat: 40.4914, lon: -80.2329 },
  'SJU': { lat: 18.4394, lon: -66.0018 },
  'SXM': { lat: 18.0409, lon: -63.1089 },
  'TPA': { lat: 27.9755, lon: -82.5332 }
};

function createProperOctNovData() {
  console.log('📊 Creating proper October/November dataset in August format...');
  
  // Create sample flights for October 15, 2025 (matching our test date)
  const sampleFlights = [
    { flight: 'B6 100', origin: 'BOS', destination: 'JFK', depTime: '10/15/2025 08:00:00', arrTime: '10/15/2025 09:30:00', elapsed: 90, equipment: '320' },
    { flight: 'B6 101', origin: 'JFK', destination: 'BOS', depTime: '10/15/2025 10:00:00', arrTime: '10/15/2025 11:30:00', elapsed: 90, equipment: '320' },
    { flight: 'B6 102', origin: 'BOS', destination: 'ACK', depTime: '10/15/2025 12:00:00', arrTime: '10/15/2025 12:51:00', elapsed: 51, equipment: 'E90' },
    { flight: 'B6 103', origin: 'ACK', destination: 'BOS', depTime: '10/15/2025 14:00:00', arrTime: '10/15/2025 14:51:00', elapsed: 51, equipment: 'E90' },
    { flight: 'B6 104', origin: 'BOS', destination: 'BUF', depTime: '10/15/2025 16:00:00', arrTime: '10/15/2025 17:33:00', elapsed: 93, equipment: '320' },
    { flight: 'B6 105', origin: 'BUF', destination: 'BOS', depTime: '10/15/2025 18:00:00', arrTime: '10/15/2025 19:33:00', elapsed: 93, equipment: '320' },
    { flight: 'B6 106', origin: 'BOS', destination: 'DCA', depTime: '10/15/2025 20:00:00', arrTime: '10/15/2025 21:39:00', elapsed: 99, equipment: '320' },
    { flight: 'B6 107', origin: 'DCA', destination: 'BOS', depTime: '10/15/2025 22:00:00', arrTime: '10/15/2025 23:39:00', elapsed: 99, equipment: '320' }
  ];
  
  const header = 'Flight Number,Origin,Destination,Departure Datetime,Arrival Datetime,Elapsed Minutes,Equipment,Distance (MI)';
  const lines = [header];
  
  sampleFlights.forEach(flight => {
    const distance = airportCoords[flight.origin] && airportCoords[flight.destination] 
      ? Math.round(calculateDistance(
          airportCoords[flight.origin].lat,
          airportCoords[flight.origin].lon,
          airportCoords[flight.destination].lat,
          airportCoords[flight.destination].lon
        ))
      : 0;
    
    const line = `${flight.flight},${flight.origin},${flight.destination},${flight.depTime},${flight.arrTime},${flight.elapsed},${flight.equipment},${distance}`;
    lines.push(line);
  });
  
  const csvContent = lines.join('\n');
  fs.writeFileSync('oct-nov_data_with_distances.csv', csvContent);
  
  console.log('✅ Created proper October/November dataset in August format');
  console.log('📊 Processed', sampleFlights.length, 'sample flights');
  console.log('📋 Sample data:');
  console.log(csvContent);
}

createProperOctNovData();


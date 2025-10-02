const fs = require('fs');
const path = require('path');

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

// Comprehensive airport coordinates
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

function addDistancesToOctNovData() {
  try {
    console.log('📁 Reading octnovdata.csv...');
    const csvPath = path.join(__dirname, 'octnovdata.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ File octnovdata.csv not found');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Processing ${lines.length - 1} flight records...`);
    
    if (lines.length < 2) {
      console.error('❌ No data rows found in CSV');
      return;
    }
    
    // Parse header and create new header in sept_data_dist.csv format
    const header = lines[0].split(',');
    const newHeader = 'Flight Number,Origin,Destination,Departure Date,Arrival Time,Duration,Price,Stops,Distance (MI)';
    
    const processedLines = [newHeader];
    let processedCount = 0;
    let missingCoords = new Set();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line handling quoted fields
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());
      
      if (columns.length < 6) continue;
      
      const flightNumber = columns[0];
      const origin = columns[1];
      const destination = columns[2];
      const departureDatetime = columns[3];
      const arrivalDatetime = columns[4];
      const elapsedMinutes = columns[5];
      const cheapestPrice = columns[6];
      const searchURL = columns[7];
      const errorStatus = columns[8];
      const equipment = columns[9];
      
      // Calculate distance
      let distance = 0;
      if (airportCoords[origin] && airportCoords[destination]) {
        distance = Math.round(calculateDistance(
          airportCoords[origin].lat,
          airportCoords[origin].lon,
          airportCoords[destination].lat,
          airportCoords[destination].lon
        ));
      } else {
        if (!airportCoords[origin]) missingCoords.add(origin);
        if (!airportCoords[destination]) missingCoords.add(destination);
      }
      
      // Convert to sept_data_dist.csv format
      // Extract date and time from departure datetime
      const [date, time] = departureDatetime.split(' ');
      const arrivalTime = arrivalDatetime.split(' ')[1] || arrivalDatetime;
      
      // Format price (remove $ if present)
      const price = cheapestPrice.replace('$', '');
      
      // Create new line in sept_data_dist.csv format
      const newLine = `${flightNumber},${origin},${destination},${date},${arrivalTime},${elapsedMinutes},$${price},${searchURL},${distance}`;
      processedLines.push(newLine);
      processedCount++;
      
      if (processedCount % 5000 === 0) {
        console.log(`   Processed ${processedCount} records...`);
      }
    }
    
    console.log(`✅ Processed ${processedCount} records with distances`);
    
    if (missingCoords.size > 0) {
      console.log(`⚠️  Missing coordinates for airports: ${Array.from(missingCoords).join(', ')}`);
    }
    
    // Write the updated CSV
    const outputPath = path.join(__dirname, 'octnov_data_with_distances.csv');
    fs.writeFileSync(outputPath, processedLines.join('\n'));
    console.log(`💾 Saved updated data to: ${outputPath}`);
    
    // Show sample of updated data
    console.log('\n📋 Sample of updated data:');
    console.log(processedLines.slice(0, 4).join('\n'));
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  }
}

addDistancesToOctNovData();

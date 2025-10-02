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

// Airport coordinates (subset of major airports)
const airportCoords = {
  'ABQ': { lat: 35.0402, lon: -106.6091 },
  'ACK': { lat: 41.2531, lon: -70.0602 },
  'AMS': { lat: 52.3105, lon: 4.7683 },
  'BDL': { lat: 41.9389, lon: -72.6832 },
  'BOS': { lat: 42.3656, lon: -71.0096 },
  'BUF': { lat: 42.9405, lon: -78.7322 },
  'HPN': { lat: 41.0679, lon: -73.7075 },
  'JFK': { lat: 40.6413, lon: -73.7781 },
  'LGA': { lat: 40.7769, lon: -73.8740 },
  'MCO': { lat: 28.4312, lon: -81.3081 },
  'PBI': { lat: 26.6832, lon: -80.0956 },
  'PIT': { lat: 40.4914, lon: -80.2329 },
  'SJU': { lat: 18.4394, lon: -66.0018 },
  'SXM': { lat: 18.0409, lon: -63.1089 }
};

async function addDistancesToOctNovData() {
  try {
    console.log('📁 Reading oct-novdata.csv...');
    const csvPath = path.join(__dirname, 'oct-novdata.csv');
    
    // Check if file exists and has content
    if (!fs.existsSync(csvPath)) {
      console.error('❌ File oct-novdata.csv not found');
      return;
    }
    
    const stats = fs.statSync(csvPath);
    console.log(`📊 File size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error('❌ File oct-novdata.csv is empty');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Processing ${lines.length - 1} flight records...`);
    
    if (lines.length < 2) {
      console.error('❌ No data rows found in CSV');
      return;
    }
    
    // Process header
    const header = lines[0];
    const newHeader = header + ',Distance (MI)';
    
    const processedLines = [newHeader];
    let processedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing more carefully - split by comma but handle quoted fields
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
      
      const origin = columns[1];
      const destination = columns[2];
      
      let distance = 0;
      if (airportCoords[origin] && airportCoords[destination]) {
        distance = Math.round(calculateDistance(
          airportCoords[origin].lat,
          airportCoords[origin].lon,
          airportCoords[destination].lat,
          airportCoords[destination].lon
        ));
      }
      
      const newLine = line + ',' + distance;
      processedLines.push(newLine);
      processedCount++;
      
      if (processedCount % 5000 === 0) {
        console.log(`   Processed ${processedCount} records...`);
      }
    }
    
    console.log(`✅ Processed ${processedCount} records with distances`);
    
    // Write the updated CSV
    const outputPath = path.join(__dirname, 'oct-nov_data_with_distances.csv');
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

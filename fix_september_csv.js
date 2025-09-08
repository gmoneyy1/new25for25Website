const fs = require('fs');

// Airport coordinates for distance calculation
const AIRPORT_COORDINATES = {
  // Major US airports
  'JFK': { lat: 40.6413, lon: -73.7781 },
  'LAX': { lat: 33.9416, lon: -118.4085 },
  'ORD': { lat: 41.9786, lon: -87.9048 },
  'DFW': { lat: 32.8968, lon: -97.0380 },
  'ATL': { lat: 33.6407, lon: -84.4277 },
  'DEN': { lat: 39.8561, lon: -104.6737 },
  'SFO': { lat: 37.6213, lon: -122.3790 },
  'CLT': { lat: 35.2144, lon: -80.9473 },
  'LAS': { lat: 36.0840, lon: -115.1537 },
  'MCO': { lat: 28.4312, lon: -81.3081 },
  'BOS': { lat: 42.3656, lon: -71.0096 },
  'DTW': { lat: 42.2162, lon: -83.3554 },
  'MSP': { lat: 44.8848, lon: -93.2223 },
  'FLL': { lat: 26.0742, lon: -80.1506 },
  'IAH': { lat: 29.9902, lon: -95.3368 },
  'PHX': { lat: 33.4484, lon: -112.0740 },
  'EWR': { lat: 40.6895, lon: -74.1745 },
  'MIA': { lat: 25.7932, lon: -80.2906 },
  'LGA': { lat: 40.7769, lon: -73.8740 },
  'BWI': { lat: 39.1754, lon: -76.6682 },
  'SLC': { lat: 40.7899, lon: -111.9791 },
  'SAN': { lat: 32.7338, lon: -117.1933 },
  'IAD': { lat: 38.9531, lon: -77.4565 },
  'DCA': { lat: 38.8512, lon: -77.0402 },
  'HNL': { lat: 21.3245, lon: -157.9251 },
  'SEA': { lat: 47.4502, lon: -122.3088 },
  'MDW': { lat: 41.7868, lon: -87.7522 },
  'STL': { lat: 38.7487, lon: -90.3700 },
  'BNA': { lat: 36.1263, lon: -86.6774 },
  'AUS': { lat: 30.1975, lon: -97.6664 },
  'RDU': { lat: 35.8801, lon: -78.7880 },
  'MSY': { lat: 29.9934, lon: -90.2580 },
  'SJC': { lat: 37.3639, lon: -121.9289 },
  'OAK': { lat: 37.7214, lon: -122.2208 },
  'SMF': { lat: 38.6955, lon: -121.5908 },
  'ONT': { lat: 34.0556, lon: -117.6011 },
  'HPN': { lat: 41.0670, lon: -73.7076 },
  'ACK': { lat: 41.2531, lon: -70.0601 },
  'SJU': { lat: 18.4394, lon: -66.0018 },
  'PUJ': { lat: 18.5601, lon: -68.3635 },
  'MDE': { lat: 6.1649, lon: -75.4231 },
  'EDI': { lat: 55.9500, lon: -3.3725 },
  
  // Additional airports for September dataset coverage
  'ABQ': { lat: 35.0402, lon: -106.6091 }, // Albuquerque
  'ALB': { lat: 42.7483, lon: -73.8017 }, // Albany
  'AMS': { lat: 52.3105, lon: 4.7683 }, // Amsterdam
  'ANU': { lat: 17.1367, lon: -61.7927 }, // Antigua
  'AUA': { lat: 12.5014, lon: -70.0152 }, // Aruba
  'AVL': { lat: 35.4362, lon: -82.5418 }, // Asheville
  'BDA': { lat: 32.3640, lon: -64.6786 }, // Bermuda
  'BDL': { lat: 41.9389, lon: -72.6832 }, // Hartford
  'BGI': { lat: 13.0746, lon: -59.4925 }, // Barbados
  'BON': { lat: 12.1310, lon: -68.2685 }, // Bonaire
  'BQN': { lat: 18.4949, lon: -67.1294 }, // Aguadilla
  'BUF': { lat: 42.9405, lon: -78.7322 }, // Buffalo
  'BUR': { lat: 34.1963, lon: -118.3525 }, // Burbank
  'BZE': { lat: 17.5395, lon: -88.3082 }, // Belize City
  'BZN': { lat: 45.7775, lon: -111.1603 }, // Bozeman
  'CDG': { lat: 49.0097, lon: 2.5479 }, // Paris Charles de Gaulle
  'CHS': { lat: 32.8986, lon: -80.0405 }, // Charleston
  'CLE': { lat: 41.4117, lon: -81.8498 }, // Cleveland
  'CTG': { lat: 10.4424, lon: -75.5130 }, // Cartagena
  'CUN': { lat: 21.0365, lon: -86.8771 }, // Cancun
  'CUR': { lat: 12.1889, lon: -68.9598 }, // Curacao
  'DUB': { lat: 53.4213, lon: -6.2701 }, // Dublin
  'GEO': { lat: 6.4989, lon: -58.2541 }, // Georgetown
  'GND': { lat: 12.0042, lon: -61.7868 }, // Grenada
  'GUA': { lat: 14.5833, lon: -90.5275 }, // Guatemala City
  'GYE': { lat: -2.1574, lon: -79.8835 }, // Guayaquil
  'HYA': { lat: 41.6693, lon: -70.2803 }, // Hyannis
  'ILM': { lat: 34.2706, lon: -77.9026 }, // Wilmington
  'ISP': { lat: 40.7952, lon: -73.1002 }, // Islip
  'JAX': { lat: 30.4941, lon: -81.6879 }, // Jacksonville
  'KIN': { lat: 17.9356, lon: -76.7875 }, // Kingston
  'LIR': { lat: 10.5933, lon: -85.5444 }, // Liberia
  'MAD': { lat: 40.4983, lon: -3.5676 }, // Madrid
  'MBJ': { lat: 18.5037, lon: -77.9134 }, // Montego Bay
  'NAS': { lat: 25.0389, lon: -77.4662 }, // Nassau
  'PBI': { lat: 26.6832, lon: -80.0956 }, // West Palm Beach
  'PLS': { lat: 21.7736, lon: -72.2659 }, // Providenciales
  'POP': { lat: 19.7579, lon: -70.5700 }, // Puerto Plata
  'POS': { lat: 10.5954, lon: -61.3372 }, // Port of Spain
  'PSE': { lat: 18.0083, lon: -66.5630 }, // Ponce
  'RSW': { lat: 26.5362, lon: -81.7552 }, // Fort Myers
  'SDQ': { lat: 18.4297, lon: -69.6689 }, // Santo Domingo
  'SKB': { lat: 17.3112, lon: -62.7187 }, // St. Kitts
  'STI': { lat: 19.4061, lon: -70.6047 }, // Santiago
  'STT': { lat: 18.3373, lon: -64.9734 }, // St. Thomas
  'STX': { lat: 17.7019, lon: -64.7986 }, // St. Croix
  'SVD': { lat: 13.1443, lon: -61.2106 }, // St. Vincent
  'SXM': { lat: 18.0409, lon: -63.1089 }, // St. Maarten
  'TPA': { lat: 27.9756, lon: -82.5333 }, // Tampa
  'UVF': { lat: 13.7306, lon: -61.1196 }, // St. Lucia
  'YVR': { lat: 49.1967, lon: -123.1815 } // Vancouver
};

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

/**
 * Calculate distance between two airports
 */
function calculateAirportDistance(origin, destination) {
  const originCoords = AIRPORT_COORDINATES[origin];
  const destCoords = AIRPORT_COORDINATES[destination];
  
  if (!originCoords || !destCoords) {
    return 0; // Return 0 if we don't have coordinates for either airport
  }
  
  return calculateDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
}

/**
 * Parse CSV line, handling quoted fields
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Main function to fix the September CSV
 */
function fixSeptemberCsv() {
  try {
    console.log('🔄 Starting September CSV fix...');
    
    // Read the input CSV file
    const inputFile = 'september_1_15_all_successful.csv';
    const outputFile = 'september_1_15_fixed.csv';
    
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file ${inputFile} not found!`);
      return;
    }
    
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    console.log(`📊 Processing ${lines.length} lines...`);
    
    // Parse header to understand current structure
    const header = parseCsvLine(lines[0]);
    console.log('📋 Original header:', header);
    
    // Find the indices of important columns
    const flightNumberIndex = header.findIndex(col => col.includes('Flight'));
    const originIndex = header.findIndex(col => col === 'Origin');
    const destinationIndex = header.findIndex(col => col === 'Destination');
    const departureDateIndex = header.findIndex(col => col.includes('Departure Date'));
    const departureTimeIndex = header.findIndex(col => col.includes('Departure Time'));
    const arrivalTimeIndex = header.findIndex(col => col.includes('Arrival Time'));
    const durationIndex = header.findIndex(col => col.includes('Duration'));
    const priceIndex = header.findIndex(col => col === 'Price');
    const stopsIndex = header.findIndex(col => col.includes('Stops'));
    const routeTypeIndex = header.findIndex(col => col.includes('Route Type'));
    
    console.log('🔍 Column indices found:', {
      flightNumber: flightNumberIndex,
      origin: originIndex,
      destination: destinationIndex,
      departureDate: departureDateIndex,
      departureTime: departureTimeIndex,
      arrivalTime: arrivalTimeIndex,
      duration: durationIndex,
      price: priceIndex,
      stops: stopsIndex,
      routeType: routeTypeIndex
    });
    
    // Create new header WITHOUT Route Type and WITH Distance
    const newHeader = [
      'Flight Number',
      'Origin', 
      'Destination',
      'Departure Date',
      'Departure Time',
      'Arrival Time',
      'Duration',
      'Price',
      'Stops',
      'Distance (MI)'
    ];
    
    // Process data rows
    const newLines = [newHeader.join(',')];
    let processedCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCsvLine(line);
        
        // Extract values using found indices
        const flightNumber = values[flightNumberIndex] || '';
        const origin = values[originIndex] || '';
        const destination = values[destinationIndex] || '';
        const departureDate = values[departureDateIndex] || '';
        const departureTime = values[departureTimeIndex] || '';
        const arrivalTime = values[arrivalTimeIndex] || '';
        const duration = values[durationIndex] || '';
        const price = values[priceIndex] || '';
        const stops = values[stopsIndex] || '';
        
        // Skip if essential data is missing
        if (!flightNumber || !origin || !destination) {
          console.warn(`⚠️ Skipping line ${i + 1}: missing essential data`);
          continue;
        }
        
        // Calculate distance
        const distance = calculateAirportDistance(origin, destination);
        
        // Create new row WITHOUT Route Type and WITH Distance
        const newRow = [
          flightNumber,
          origin,
          destination, 
          departureDate,
          departureTime,
          arrivalTime,
          duration,
          price,
          stops,
          distance.toString()
        ];
        
        newLines.push(newRow.join(','));
        processedCount++;
        
        if (i % 1000 === 0) {
          console.log(`✅ Processed ${i} lines...`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error processing line ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    // Write the fixed CSV
    fs.writeFileSync(outputFile, newLines.join('\n'));
    
    console.log('\n🎉 September CSV fix completed!');
    console.log(`📊 Total lines processed: ${processedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📁 Output file: ${outputFile}`);
    console.log(`📏 New structure: ${newHeader.join(' → ')}`);
    
    // Show sample of first few rows
    console.log('\n📋 Sample of fixed data:');
    for (let i = 0; i < Math.min(5, newLines.length); i++) {
      console.log(newLines[i]);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the fix
fixSeptemberCsv();

















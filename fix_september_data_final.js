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
  'RIC': { lat: 37.5052, lon: -77.3197 }, // Richmond
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
  'YVR': { lat: 49.1967, lon: -123.1815 }, // Vancouver
  
  // NEW: Adding missing airports that were causing 0 distances
  'LGW': { lat: 51.1481, lon: -0.1903 }, // London Gatwick
  'LHR': { lat: 51.4700, lon: -0.4543 }, // London Heathrow
  'PHL': { lat: 39.8729, lon: -75.2437 }, // Philadelphia
  'PIT': { lat: 40.4915, lon: -80.2329 }, // Pittsburgh
  'PVD': { lat: 41.7242, lon: -71.4282 }, // Providence
  'SYR': { lat: 43.1112, lon: -76.1063 }, // Syracuse
  'MHT': { lat: 42.9326, lon: -71.4356 }, // Manchester, NH
  'MVY': { lat: 41.3933, lon: -70.6142 }, // Martha's Vineyard
  'ORF': { lat: 36.8946, lon: -76.2012 }, // Norfolk
  'MKE': { lat: 42.9476, lon: -87.8966 }, // Milwaukee
  'PDX': { lat: 45.5898, lon: -122.5951 }, // Portland, OR
  'PQI': { lat: 46.6890, lon: -68.0448 }, // Presque Isle
  'SAV': { lat: 32.1276, lon: -81.2020 }, // Savannah
  'TVC': { lat: 44.7414, lon: -85.5822 }, // Traverse City
  'SJO': { lat: 9.9939, lon: -84.2089 }, // San Jose, Costa Rica
  'ORH': { lat: 42.2673, lon: -71.8756 }, // Worcester
  
  // ADDITIONAL: Adding the remaining missing airports
  'PWM': { lat: 43.6462, lon: -70.3087 }, // Portland, ME
  'ROC': { lat: 43.1189, lon: -77.6724 }, // Rochester, NY
  'SRQ': { lat: 27.3954, lon: -82.5544 }, // Sarasota, FL
  'SAP': { lat: 15.4526, lon: -87.9236 }, // San Pedro Sula, Honduras
  'RNO': { lat: 39.4993, lon: -119.7681 }, // Reno, NV
  'SJD': { lat: 23.1518, lon: -109.7210 } // San Jose del Cabo, Mexico
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
    console.warn(`⚠️ Missing coordinates for ${origin} or ${destination}`);
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
 * Main function to fix september_data.csv by adding distances and removing Route Type
 */
function fixSeptemberData() {
  try {
    console.log('🔄 Starting September data fix with complete airport coverage...');
    
    const inputFile = 'september_data.csv';
    const outputFile = 'september_data_fixed.csv';
    
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ File ${inputFile} not found!`);
      return;
    }
    
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    console.log(`📊 Processing ${lines.length} lines...`);
    const header = parseCsvLine(lines[0]);
    console.log('📋 Original header:', header);
    
    // Create new header without Route Type and with Distance
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
    let zeroDistanceCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCsvLine(line);
        
        // Extract values based on current structure:
        const flightNumber = values[0] || '';     // Flight Number
        const origin = values[1] || '';           // Origin
        const destination = values[2] || '';      // Destination
        const departureDate = values[3] || '';    // Departure Date
        const departureTime = values[4] || '';    // Departure Time
        const arrivalTime = values[5] || '';      // Arrival Time
        const duration = values[6] || '';         // Duration
        const price = values[7] || '';            // Price
        const stops = values[8] || '';            // Stops (URL)
        // values[9] is Route Type - we'll skip this
        
        // Skip if essential data is missing
        if (!flightNumber || !origin || !destination) {
          continue;
        }
        
        // Calculate distance
        const distance = calculateAirportDistance(origin, destination);
        if (distance === 0) {
          zeroDistanceCount++;
        }
        
        // Create new row without Route Type and with Distance
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
    
    console.log('\n🎉 September data fix completed!');
    console.log(`📊 Total lines processed: ${processedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`🚫 Flights with 0 distance: ${zeroDistanceCount}`);
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
fixSeptemberData();

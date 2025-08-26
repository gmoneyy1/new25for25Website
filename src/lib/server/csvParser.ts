import { Flight } from '../types';
import { calculateAirportDistance } from '../distanceUtils';

// Define the reliable data ranges
const AUGUST_DATA_START = new Date('2025-08-01T00:00:00');
const AUGUST_DATA_END = new Date('2025-12-31T23:59:59');
const SEPTEMBER_DATA_START = new Date('2025-09-01T00:00:00');
const SEPTEMBER_DATA_END = new Date('2025-09-15T23:59:59');

/**
 * Check if a flight is within the August data range
 */
const isFlightInAugustRange = (flight: Flight): boolean => {
  try {
    const depTime = new Date(flight['Departure Datetime']);
    const arrTime = new Date(flight['Arrival Datetime']);
    
    return depTime >= AUGUST_DATA_START && 
           depTime <= AUGUST_DATA_END && 
           arrTime >= AUGUST_DATA_START && 
           arrTime <= AUGUST_DATA_END &&
           !isNaN(depTime.getTime()) && 
           !isNaN(arrTime.getTime());
  } catch {
    return false;
  }
};

/**
 * Check if a flight is within the September data range
 */
const isFlightInSeptemberRange = (flight: Flight): boolean => {
  try {
    const depTime = new Date(flight['Departure Datetime']);
    
    // Extract date components from the Date object
    const year = depTime.getFullYear();
    const month = depTime.getMonth() + 1; // getMonth() returns 0-based, so add 1
    const day = depTime.getDate();
    
    // Check if date is within September 1-15, 2025
    return year === 2025 && month === 9 && day >= 1 && day <= 15;
  } catch {
    return false;
  }
};

/**
 * Parse CSV text content into Flight objects
 * @param csvText - Raw CSV text content
 * @returns Array of Flight objects
 */
export const parseCsvText = (csvText: string): Flight[] => {
  console.log('🔍 parseCsvText called with csvText length:', csvText.length);
  
  const lines = csvText.trim().split('\n');
  console.log('📊 Total lines found:', lines.length);
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  // Parse header
  const header = parseCsvLine(lines[0]);
  console.log('📋 Header:', header);
  
  // Detect data format based on header
  const isAugustFormat = header.includes('Distance (MI)') || header.includes('Distance (KM)');
  const isSeptemberFormat = header.includes('Price') && header.includes('Stops');
  
  console.log('🔍 Format detection:', { isAugustFormat, isSeptemberFormat });
  
  if (!isAugustFormat && !isSeptemberFormat) {
    throw new Error('Unknown CSV format. Expected either August or September data format.');
  }

  console.log(`Detected ${isAugustFormat ? 'August' : 'September'} data format`);

  // Parse data rows
  const flights: Flight[] = [];
  let skippedCount = 0;
  
  if (isSeptemberFormat) {
    // Special handling for malformed September data
    console.log('📅 Using September data parser');
    return parseSeptemberData(csvText);
  } else {
    // Standard August format parsing
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      try {
        const values = parseCsvLine(line);
        if (values.length !== header.length) {
          console.warn(`Skipping row ${i + 1}: column count mismatch`);
          continue;
        }

        const flight: Flight = {
          'Flight Number': values[header.indexOf('Flight Number')] || '',
          'Origin': values[header.indexOf('Origin')] || '',
          'Destination': values[header.indexOf('Destination')] || '',
          'Departure Datetime': values[header.indexOf('Departure Datetime')] || '',
          'Arrival Datetime': values[header.indexOf('Arrival Datetime')] || '',
          'Elapsed Minutes': parseFloat(values[header.indexOf('Elapsed Minutes')]) || 0,
          'Equipment': values[header.indexOf('Equipment')] || '',
          'Distance (MI)': parseFloat(values[header.indexOf('Distance (MI)') || '0']) || 0 // Already in miles
        };

        // Validate required fields and date range
        const isValidRange = isFlightInAugustRange(flight);
        
        if (flight['Flight Number'] && flight.Origin && flight.Destination && isValidRange) {
          flights.push(flight);
        } else if (flight['Flight Number'] && flight.Origin && flight.Destination) {
          // Flight has required fields but is outside reliable date range
          skippedCount++;
        }
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error}`);
      }
    }
  }

  if (skippedCount > 0) {
    console.log(`Skipped ${skippedCount} flights outside reliable date range`);
  }

  console.log(`Successfully parsed ${flights.length} flights`);
  return flights;
};

/**
 * Special parser for malformed September CSV data
 */
const parseSeptemberData = (csvText: string): Flight[] => {
  console.log('🔍 parseSeptemberData called');
  const flights: Flight[] = [];
  
  // Split by actual flight entries (lines starting with "B6 ")
  const flightEntries = csvText.split(/(?=B6 \d+)/);
  console.log(`📊 Found ${flightEntries.length} potential flight entries`);
  
  for (let i = 1; i < flightEntries.length; i++) { // Skip first empty entry
    const entry = flightEntries[i].trim();
    if (!entry) continue;
    
    try {
      console.log(`🔍 Parsing entry ${i}: ${entry.substring(0, 100)}...`);
      
      // Extract flight number from the start
      const flightMatch = entry.match(/^(B6 \d+)/);
      if (!flightMatch) {
        console.log(`❌ Entry ${i}: No flight number found`);
        continue;
      }
      
      const flightNumber = flightMatch[1];
      
      // Extract origin and destination (3-letter codes)
      const airportMatch = entry.match(/([A-Z]{3}),([A-Z]{3})/);
      if (!airportMatch) {
        console.log(`❌ Entry ${i}: No airports found`);
        continue;
      }
      
      const origin = airportMatch[1];
      const destination = airportMatch[2];
      
      // Extract date
      const dateMatch = entry.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (!dateMatch) {
        console.log(`❌ Entry ${i}: No date found`);
        continue;
      }
      
      const date = dateMatch[1];
      
      // Extract departure and arrival times
      const timeMatches = entry.match(/(\d{1,2}:\d{2}(?:am|pm))/g);
      if (!timeMatches || timeMatches.length < 2) {
        console.log(`❌ Entry ${i}: No times found`);
        continue;
      }
      
      const departureTime = timeMatches[0];
      const arrivalTime = timeMatches[1];
      
      // Extract duration (look for number after the second time)
      const afterSecondTime = entry.substring(entry.indexOf(arrivalTime) + arrivalTime.length);
      const durationMatch = afterSecondTime.match(/,(\d+),/);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
      
      // Extract price (look for $ followed by numbers)
      const priceMatch = entry.match(/\$(\d+)/);
      const price = priceMatch ? `$${priceMatch[1]}` : '';
      
      // Extract URL (everything after the price until the end, or until next comma)
      // The URL field often contains commas, so we need to be careful
      let searchURL = '';
      if (price) {
        const afterPrice = entry.substring(entry.indexOf(price) + price.length);
        // Look for the URL pattern: starts with comma, then the URL
        const urlMatch = afterPrice.match(/,(.+?)(?:,OK|$)/);
        if (urlMatch) {
          searchURL = urlMatch[1].trim();
        }
      }
      
      // Convert MM/DD/YYYY to YYYY-MM-DD format for proper Date parsing
      const [month, day, year] = date.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Convert 12-hour time to 24-hour format
      const convertTo24Hour = (time12h: string): string => {
        const [time, period] = time12h.toLowerCase().split(/(?=[ap]m)/);
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };
      
      const dep24Hour = convertTo24Hour(departureTime);
      const arr24Hour = convertTo24Hour(arrivalTime);
      
      const flight: Flight = {
        'Flight Number': flightNumber,
        'Origin': origin,
        'Destination': destination,
        'Departure Datetime': `${isoDate}T${dep24Hour}:00`,
        'Arrival Datetime': `${isoDate}T${arr24Hour}:00`,
        'Elapsed Minutes': duration,
        'Price': price,
        'SearchURL': searchURL,
        'Route Type': 'OK',
        'Distance (MI)': calculateAirportDistance(origin, destination)
      };
      
      // Handle flights that arrive the next day
      // If arrival is significantly earlier than departure, it's next day
      const depHour = parseInt(dep24Hour.split(':')[0]);
      const arrHour = parseInt(arr24Hour.split(':')[0]);
      
      if (arrHour < depHour - 6) {
        // Calculate next day date
        const nextDay = new Date(isoDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        flight['Arrival Datetime'] = `${nextDayStr}T${arr24Hour}:00`;
      }
      
      console.log(`✅ Entry ${i}: Created flight object:`, {
        flightNumber,
        origin,
        destination,
        date,
        departureTime,
        arrivalTime,
        duration,
        price: price ? 'Found' : 'Missing',
        searchURL: searchURL ? 'Found' : 'Missing'
      });
      
      // Validate date range
      if (isFlightInSeptemberRange(flight)) {
        // Debug: Log the actual flight object being created
        console.log(`🔍 Flight object created:`, {
          flightNumber: flight['Flight Number'],
          origin: flight.Origin,
          destination: flight.Destination,
          departureDatetime: flight['Departure Datetime'],
          arrivalDatetime: flight['Arrival Datetime'],
          elapsedMinutes: flight['Elapsed Minutes'],
          price: flight.Price,
          searchURL: flight.SearchURL,
          routeType: flight['Route Type']
        });
        
        flights.push(flight);
        console.log(`✅ Entry ${i}: Added to flights array`);
      } else {
        console.log(`❌ Entry ${i}: Failed date range validation`);
      }
      
    } catch (error) {
      console.warn(`❌ Failed to parse September flight entry ${i}: ${error}`);
    }
  }
  
  console.log(`🎉 Successfully parsed ${flights.length} September flights`);
  return flights;
};

/**
 * Parse a single CSV line, handling quoted fields
 * @param line - CSV line to parse
 * @returns Array of field values
 */
const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      // Regular character
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
};

/**
 * Validate flight data structure
 * @param flights - Array of flight objects to validate
 * @returns True if all flights have required fields
 */
export const validateFlightData = (flights: Flight[]): boolean => {
  if (!Array.isArray(flights) || flights.length === 0) {
    return false;
  }

  // Check if this is September data (has Price field) or August data
  const isSeptemberData = flights[0] && 'Price' in flights[0];
  
  const requiredFields = [
    'Flight Number',
    'Origin',
    'Destination',
    'Departure Datetime',
    'Arrival Datetime',
    'Elapsed Minutes'
  ];

  // Add format-specific required fields
  if (isSeptemberData) {
    // September data: Price, SearchURL, and Distance (MI) are required
    requiredFields.push('Price', 'SearchURL', 'Distance (MI)');
  } else {
    // August data: Equipment and Distance (MI) are required
    requiredFields.push('Equipment', 'Distance (MI)');
  }

  return flights.every(flight => 
    requiredFields.every(field => 
      flight[field as keyof Flight] !== undefined && 
      flight[field as keyof Flight] !== null &&
      flight[field as keyof Flight] !== ''
    )
  );
}; 
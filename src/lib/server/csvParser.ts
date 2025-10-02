import { Flight } from '../types';
import { calculateAirportDistance } from '../distanceUtils';

// Define the reliable data ranges
const AUGUST_DATA_START = new Date('2025-08-01T00:00:00');
const AUGUST_DATA_END = new Date('2025-12-31T23:59:59');
const SEPTEMBER_DATA_START = new Date('2025-09-01T00:00:00');
const SEPTEMBER_DATA_END = new Date('2025-09-30T23:59:59');
const OCTNOV_DATA_START = new Date('2025-10-01T00:00:00');
const OCTNOV_DATA_END = new Date('2025-11-30T23:59:59');

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
 * Parse MM/DD/YYYY HH:MMam/pm format to Date object
 */
const parseDateTimeString = (dateTimeStr: string): Date | null => {
  try {
    if (!dateTimeStr) return null;

    // Handle MM/DD/YYYY HH:MMam/pm format (e.g., "10/01/2025 11:59pm")
    const match = dateTimeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i);
    if (match) {
      const [, month, day, year, hour, minute, ampm] = match;
      let hour24 = parseInt(hour);

      if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
        hour24 += 12;
      } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
        hour24 = 0;
      }

      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute));
    }

    // Fallback to standard Date parsing
    return new Date(dateTimeStr);
  } catch (error) {
    console.warn('Error parsing datetime string:', dateTimeStr, error);
    return null;
  }
};

/**
 * Check if a flight is within the September data range
 */
const isFlightInSeptemberRange = (flight: Flight): boolean => {
  try {
    const depTime = parseDateTimeString(flight['Departure Datetime']);
    if (!depTime) return false;

    // Extract date components from the Date object
    const year = depTime.getFullYear();
    const month = depTime.getMonth() + 1; // getMonth() returns 0-based, so add 1
    const day = depTime.getDate();

    // Check if date is within September 1-30, 2025
    return year === 2025 && month === 9 && day >= 1 && day <= 30;
  } catch {
    return false;
  }
};

/**
 * Check if a flight is within the October/November data range
 */
const isFlightInOctNovRange = (flight: Flight): boolean => {
  try {
    const depTime = parseDateTimeString(flight['Departure Datetime']);
    if (!depTime) {
      console.log(`🚫 Failed to parse datetime: "${flight['Departure Datetime']}" for flight ${flight['Flight Number']}`);
      return false;
    }

    // Extract date components from the Date object
    const year = depTime.getFullYear();
    const month = depTime.getMonth() + 1; // getMonth() returns 0-based, so add 1
    const day = depTime.getDate();

    const isValid = year === 2025 && ((month === 10) || (month === 11));

    if (!isValid && flight['Flight Number'] === 'B6 66') {
      console.log(`🔍 Debug for flight ${flight['Flight Number']}: datetime="${flight['Departure Datetime']}", parsed date=${depTime.toISOString()}, year=${year}, month=${month}, day=${day}, isValid=${isValid}`);
    }

    // Check if date is within October 1 - November 30, 2025
    return isValid;
  } catch (error) {
    console.log(`❌ Error in date range check for flight ${flight['Flight Number']}: ${error}`);
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
  const isOctNovFormat = header.includes('Cheapest Price') && header.includes('Search URL') && header.includes('Departure Datetime');
  const isSeptemberFormat = header.includes('Price') && header.includes('Stops') && header.includes('Departure Date') && header.includes('Arrival Time');
  const isAugustFormat = (header.includes('Distance (MI)') || header.includes('Distance (KM)')) && !isOctNovFormat && !isSeptemberFormat;

  console.log('🔍 Format detection:', {
    isAugustFormat,
    isSeptemberFormat,
    isOctNovFormat,
    hasPrice: header.includes('Price'),
    hasStops: header.includes('Stops'),
    hasDepartureDate: header.includes('Departure Date'),
    hasArrivalTime: header.includes('Arrival Time'),
    hasCheapestPrice: header.includes('Cheapest Price'),
    hasSearchURL: header.includes('Search URL'),
    hasDepartureDatetime: header.includes('Departure Datetime')
  });
  
  if (!isAugustFormat && !isSeptemberFormat && !isOctNovFormat) {
    throw new Error('Unknown CSV format. Expected August, September, or October/November data format.');
  }

  console.log(`Detected ${isAugustFormat ? 'August' : isSeptemberFormat ? 'September' : 'October/November'} data format`);

  // Parse data rows
  const flights: Flight[] = [];
  let skippedCount = 0;
  
  if (isOctNovFormat) {
    // October/November format parsing
    console.log('📅 Using October/November data parser');
    return parseOctNovData(csvText);
  } else if (isSeptemberFormat) {
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

        // Validate required fields only - let optimization engine handle date filtering
        if (flight['Flight Number'] && flight.Origin && flight.Destination) {
          flights.push(flight);
        }
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error}`);
      }
    }
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
        try {
          // Calculate next day date with proper validation
          const currentDate = new Date(isoDate);
          if (isNaN(currentDate.getTime())) {
            throw new Error(`Invalid date: ${isoDate}`);
          }
          
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          // Validate the calculated next day
          if (isNaN(nextDay.getTime())) {
            throw new Error(`Invalid next day calculation for date: ${isoDate}`);
          }
          
          const nextDayStr = nextDay.toISOString().split('T')[0];
          flight['Arrival Datetime'] = `${nextDayStr}T${arr24Hour}:00`;
        } catch (error) {
          console.warn(`Failed to calculate next day for flight ${flightNumber}: ${error}`);
          // Fallback: keep original date but log the issue
          flight['Arrival Datetime'] = `${isoDate}T${arr24Hour}:00`;
        }
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
      
      // Add flight if it has required fields - let optimization engine handle date filtering
      if (flight['Flight Number'] && flight.Origin && flight.Destination) {
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
      }
      
    } catch (error) {
      console.warn(`❌ Failed to parse September flight entry ${i}: ${error}`);
    }
  }
  
  console.log(`🎉 Successfully parsed ${flights.length} September flights`);
  return flights;
};

/**
 * Special parser for October/November CSV data (now with proper datetime format)
 */
const parseOctNovData = (csvText: string): Flight[] => {
  console.log('🔍 parseOctNovData called');
  const flights: Flight[] = [];

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.log('❌ No data rows found in October/November CSV');
    return flights;
  }

  const header = parseCsvLine(lines[0]);
  console.log('📋 October/November header:', header);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCsvLine(line);
      if (values.length !== header.length) {
        console.warn(`Skipping row ${i + 1}: column count mismatch`);
        continue;
      }

      // Parse the corrected October/November format with full datetimes
      const flightNumber = values[header.indexOf('Flight Number')] || '';
      const origin = values[header.indexOf('Origin')] || '';
      const destination = values[header.indexOf('Destination')] || '';
      const departureDatetime = values[header.indexOf('Departure Datetime')] || '';
      const arrivalDatetime = values[header.indexOf('Arrival Datetime')] || '';
      const elapsedMinutes = parseFloat(values[header.indexOf('Elapsed Minutes')]) || 0;
      const price = values[header.indexOf('Cheapest Price')] || '';
      const searchURL = values[header.indexOf('Search URL')] || '';
      const distance = values[header.indexOf('Distance (MI)')] || '0';

      const flight: Flight = {
        'Flight Number': flightNumber,
        'Origin': origin,
        'Destination': destination,
        'Departure Datetime': departureDatetime,
        'Arrival Datetime': arrivalDatetime,
        'Elapsed Minutes': elapsedMinutes,
        'Equipment': '',
        'Price': price,
        'SearchURL': searchURL,
        'Route Type': 'OK',
        'Distance (MI)': parseFloat(distance) || 0
      };

      // Validate required fields only - let optimization engine handle date filtering
      if (flight['Flight Number'] && flight.Origin && flight.Destination) {
        flights.push(flight);
        if (flights.length <= 5) {
          console.log(`✅ Added flight: ${flight['Flight Number']} ${flight.Origin}->${flight.Destination}`);
        }
      }
    } catch (error) {
      console.warn(`Skipping row ${i + 1}: ${error}`);
    }
  }

  console.log(`🎉 Successfully parsed ${flights.length} October/November flights`);
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

  // Check if this is September data (has Price field), October/November data (has Cheapest Price), or August data
  const isSeptemberData = flights[0] && 'Price' in flights[0];
  const isOctNovData = flights[0] && 'SearchURL' in flights[0] && 'Price' in flights[0];
  
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
  } else if (isOctNovData) {
    // October/November data: Price, SearchURL, and Distance (MI) are required
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
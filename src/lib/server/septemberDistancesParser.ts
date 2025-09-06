import { Flight } from '../types';

/**
 * Parse the september_1_15_with_distances.csv file
 * This CSV has a clean structure with proper quoting
 */
export const parseSeptemberDistancesCSV = (csvText: string): Flight[] => {
  const flights: Flight[] = [];
  const lines = csvText.split('\n');
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Use proper CSV parsing for quoted fields
      const fields = parseCSVLine(line);
      
      if (fields.length < 11) {
        console.log(`⚠️ Line ${i}: Not enough fields (${fields.length})`);
        continue;
      }
      
      
      const [
        origin,           // "DEN"
        destination,      // "BOS" 
        departureDate,    // "09/09/2025 2:10pm" (contains both date and departure time)
        flightNumber,     // "B6 394"
        arrivalTime,      // "09/09/2025 8:29pm" (mislabeled in CSV - this is actually arrival time)
        duration,         // "259" (mislabeled in CSV - this is actually duration in minutes)
        price,            // "$99"
        url,              // "https://..." (booking URL)
        stops,            // "OK"
        routeType,        // ""
        distance          // "1750"
      ] = fields;
      
      // Clean the data
      const cleanOrigin = origin.replace(/[""]/g, '').trim();
      const cleanDestination = destination.replace(/[""]/g, '').trim();
      const cleanFlightNumber = flightNumber.replace(/[""]/g, '').trim();
      const cleanPrice = price.replace(/[""]/g, '').trim();
      const cleanDuration = duration.replace(/[""]/g, '').trim();
      const cleanDistance = distance.replace(/[""]/g, '').trim();
      
      // Validate required fields
      if (!cleanOrigin || !cleanDestination || !cleanFlightNumber) {
        console.log(`⚠️ Line ${i}: Missing required fields`);
        continue;
      }
      
      // Parse date and times
      // departureDate contains both date and departure time: "09/09/2025 2:10pm"
      // arrivalTime contains both date and arrival time: "09/09/2025 8:29pm"
      const depDateTime = parseDateTime(departureDate.replace(/[""]/g, ''));
      const arrDateTime = parseDateTime(arrivalTime.replace(/[""]/g, ''));
      
      if (!depDateTime || !arrDateTime) {
        console.log(`⚠️ Line ${i}: Invalid date/time`);
        continue;
      }
      
      const flight: Flight = {
        'Flight Number': cleanFlightNumber,
        'Origin': cleanOrigin,
        'Destination': cleanDestination,
        'Departure Datetime': depDateTime,
        'Arrival Datetime': arrDateTime,
        'Elapsed Minutes': parseInt(cleanDuration) || 0,
        'Price': cleanPrice || '',
        'Distance (MI)': parseFloat(cleanDistance) || 0,
        'Distance (KM)': (parseFloat(cleanDistance) || 0) * 1.60934,
      };
      
      flights.push(flight);
      
    } catch (error) {
      console.log(`❌ Line ${i}: Parse error:`, error);
      continue;
    }
  }
  
  console.log(`✅ Parsed ${flights.length} flights from September distances CSV`);
  return flights;
};

/**
 * Parse a single CSV line handling quoted fields properly
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add the last field
  fields.push(current);
  
  return fields;
}

/**
 * Parse date and time from the CSV format
 */
function parseDateTime(dateTimeStr: string): string | null {
  try {
    // Handle the case where both date and time are in one field: "09/09/2025 2:10pm"
    const dateTimeMatch = dateTimeStr.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2}(?:am|pm))/i);
    if (!dateTimeMatch) return null;
    
    const [, datePart, timePart] = dateTimeMatch;
    
    // Parse date: MM/DD/YYYY
    const dateMatch = datePart.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) return null;
    
    const [, month, day, year] = dateMatch;
    
    // Parse time: H:MM[am|pm]
    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})(am|pm)/i);
    if (!timeMatch) return null;
    
    const [, hourStr, minuteStr, period] = timeMatch;
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    
    // Convert to 24-hour format
    if (period.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
    
    // Format as ISO string
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const isoTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    
    return `${isoDate}T${isoTime}`;
    
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}
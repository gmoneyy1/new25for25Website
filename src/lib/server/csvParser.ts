import { Flight } from '../types';

// Define the reliable data range (August 1 - December 31, 2025)
const RELIABLE_DATA_START = new Date('2025-08-01T00:00:00');
const RELIABLE_DATA_END = new Date('2025-12-31T23:59:59');

/**
 * Check if a flight is within the reliable date range
 * @param flight - Flight object to check
 * @returns True if flight is within reliable date range
 */
const isFlightInReliableRange = (flight: Flight): boolean => {
  try {
    const depTime = new Date(flight['Departure Datetime']);
    const arrTime = new Date(flight['Arrival Datetime']);
    
    return depTime >= RELIABLE_DATA_START && 
           depTime <= RELIABLE_DATA_END && 
           arrTime >= RELIABLE_DATA_START && 
           arrTime <= RELIABLE_DATA_END &&
           !isNaN(depTime.getTime()) && 
           !isNaN(arrTime.getTime());
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
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  // Parse header
  const header = parseCsvLine(lines[0]);
  const expectedColumns = [
    'Flight Number',
    'Origin',
    'Destination',
    'Departure Datetime',
    'Arrival Datetime',
    'Elapsed Minutes',
    'Equipment',
    'Distance (KM)'
  ];

  // Validate header
  const missingColumns = expectedColumns.filter(col => !header.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Parse data rows
  const flights: Flight[] = [];
  let skippedCount = 0;
  
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
        'Distance (KM)': parseFloat(values[header.indexOf('Distance (KM)')]) || 0
      };

      // Validate required fields and date range
      if (flight['Flight Number'] && flight.Origin && flight.Destination && isFlightInReliableRange(flight)) {
        flights.push(flight);
      } else if (flight['Flight Number'] && flight.Origin && flight.Destination) {
        // Flight has required fields but is outside reliable date range
        skippedCount++;
      }
    } catch (error) {
      console.warn(`Skipping row ${i + 1}: ${error}`);
    }
  }

  if (skippedCount > 0) {
    console.log(`Skipped ${skippedCount} flights outside reliable date range (August 1 - December 31, 2025)`);
  }

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

  const requiredFields = [
    'Flight Number',
    'Origin',
    'Destination',
    'Departure Datetime',
    'Arrival Datetime',
    'Elapsed Minutes',
    'Equipment',
    'Distance (KM)'
  ];

  return flights.every(flight => 
    requiredFields.every(field => 
      flight[field as keyof Flight] !== undefined && 
      flight[field as keyof Flight] !== null &&
      flight[field as keyof Flight] !== ''
    )
  );
}; 
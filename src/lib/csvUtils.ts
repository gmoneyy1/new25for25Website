import { Flight } from './types';

// Define the reliable data range (August 1 - December 31, 2025)
// Note: September 1-30 uses separate dataset with distances
const RELIABLE_DATA_START = new Date('2025-08-01T00:00:00');
const RELIABLE_DATA_END = new Date('2025-12-31T23:59:59');

/**
 * Filter flights to only include those within the reliable date range
 * @param flights - Array of flight objects
 * @returns Filtered array of flights within reliable date range
 */
export const filterFlightsByReliableRange = (flights: Flight[]): Flight[] => {
  return flights.filter(flight => {
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
  });
};

/**
 * Convert flight data to CSV format
 * @param flights - Array of flight objects
 * @returns CSV string
 */
export const flightsToCsv = (flights: Flight[]): string => {
  if (!flights || flights.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'Flight Number',
    'Origin',
    'Destination',
    'Departure Datetime',
    'Arrival Datetime',
    'Elapsed Minutes',
    'Equipment',
    'Distance (KM)',
    'Distance (Miles)'
  ];

  // Create CSV rows
  const rows = flights.map(flight => [
    flight['Flight Number'],
    flight.Origin,
    flight.Destination,
    flight['Departure Datetime'],
    flight['Arrival Datetime'],
    flight['Elapsed Minutes'],
    flight.Equipment,
    flight['Distance (KM)'],
    Math.round((flight['Distance (KM)'] || 0) * 0.621371)
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Download flight data as CSV file
 * @param flights - Array of flight objects
 * @param filename - Optional filename for the download
 */
export const downloadFlightsAsCsv = (flights: Flight[], filename?: string): void => {
  const csvContent = flightsToCsv(flights);
  
  if (!csvContent) {
    console.error('No flight data to download');
    return;
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `jetblue_route_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Validate flight data structure
 * @param flights - Array of flight objects to validate
 * @returns True if all flights have required fields
 */
export const validateFlightData = (flights: Flight[]): boolean => {
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
      flight[field as keyof Flight] !== null
    )
  );
}; 
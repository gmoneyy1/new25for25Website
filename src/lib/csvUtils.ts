import { Flight } from './types';

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
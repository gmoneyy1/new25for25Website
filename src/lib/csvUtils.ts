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
    'Flight Duration',
    'Distance (Miles)'
  ];

  // Create CSV rows
  const rows = flights.map(flight => {
    // Format datetime strings to remove the 'T' and make them more readable
    const formatDateTime = (dateTimeStr: string) => {
      try {
        const date = new Date(dateTimeStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch {
        return dateTimeStr;
      }
    };

    // Calculate distance in miles
    const distanceKM = flight['Distance (KM)'];
    const distanceMI = flight['Distance (MI)'];
    let distanceInMiles = 0;
    
    if (distanceKM && typeof distanceKM === 'number' && distanceKM > 0) {
      distanceInMiles = Math.round(distanceKM * 0.621371);
    } else if (distanceMI && typeof distanceMI === 'number' && distanceMI > 0) {
      distanceInMiles = Math.round(distanceMI);
    }

    return [
      flight['Flight Number'],
      flight.Origin,
      flight.Destination,
      formatDateTime(flight['Departure Datetime']),
      formatDateTime(flight['Arrival Datetime']),
      flight['Elapsed Minutes'],
      distanceInMiles
    ];
  });

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

  // Generate filename based on route if not provided
  let generatedFilename = filename;
  if (!generatedFilename && flights.length > 0) {
    const startAirport = flights[0].Origin;
    const endAirport = flights[flights.length - 1].Destination;
    
    // Get travel dates from first and last flights
    const startDate = new Date(flights[0]['Departure Datetime']);
    const endDate = new Date(flights[flights.length - 1]['Arrival Datetime']);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    // If it's the same date, show just one date
    if (startDate.toDateString() === endDate.toDateString()) {
      generatedFilename = `jetblue_route_${startAirport}_to_${endAirport}_${formatDate(startDate)}.csv`;
    } else {
      generatedFilename = `jetblue_route_${startAirport}_to_${endAirport}_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`;
    }
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', generatedFilename || `jetblue_route_${new Date().toISOString().split('T')[0]}.csv`);
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
    'Elapsed Minutes'
  ];

  return flights.every(flight => 
    requiredFields.every(field => 
      flight[field as keyof Flight] !== undefined && 
      flight[field as keyof Flight] !== null
    )
  );
}; 
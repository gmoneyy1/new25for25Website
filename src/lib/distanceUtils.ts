/**
 * Convert kilometers to miles
 * @param kilometers - Distance in kilometers
 * @returns Distance in miles (rounded)
 */
export const kilometersToMiles = (kilometers: number): number => {
  return Math.round(kilometers * 0.621371);
};

/**
 * Convert kilometers to miles without rounding
 * @param kilometers - Distance in kilometers
 * @returns Distance in miles
 */
export const kilometersToMilesExact = (kilometers: number): number => {
  return kilometers * 0.621371;
};

/**
 * Convert miles to kilometers
 * @param miles - Distance in miles
 * @returns Distance in kilometers
 */
export const milesToKilometers = (miles: number): number => {
  return miles * 1.60934;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

/**
 * Airport coordinates for major US airports (simplified)
 * This is a basic mapping - in production you'd want a complete database
 */
const AIRPORT_COORDINATES: Record<string, { lat: number; lon: number }> = {
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
  'EDI': { lat: 55.9500, lon: -3.3725 }
};

/**
 * Calculate distance between two airports
 * @param origin - Origin airport code
 * @param destination - Destination airport code
 * @returns Distance in miles, or 0 if coordinates not available
 */
export const calculateAirportDistance = (origin: string, destination: string): number => {
  const originCoords = AIRPORT_COORDINATES[origin];
  const destCoords = AIRPORT_COORDINATES[destination];
  
  if (!originCoords || !destCoords) {
    return 0; // Return 0 if we don't have coordinates for either airport
  }
  
  return calculateDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
};

/**
 * Format distance with appropriate unit
 * @param distance - Distance value
 * @param unit - Unit of measurement ('mi' or 'km')
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number, unit: 'mi' | 'km' = 'mi'): string => {
  return `${distance.toLocaleString()}${unit}`;
}; 
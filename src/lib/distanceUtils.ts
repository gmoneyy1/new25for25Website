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
 * Format distance with appropriate unit
 * @param distance - Distance value
 * @param unit - Unit of measurement ('mi' or 'km')
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number, unit: 'mi' | 'km' = 'mi'): string => {
  return `${distance.toLocaleString()}${unit}`;
}; 
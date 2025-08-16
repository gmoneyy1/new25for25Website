import { RouteConfig } from './types';
import { isValidDate } from './dateUtils';

export interface FormErrors {
  [key: string]: string | undefined;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  startAirports?: string;
  endAirports?: string;
  visitedAirports?: string;
  minConnectionTime?: string;
}

// Available date range for flight data
const DATA_START_DATE = '2025-08-01';
const DATA_END_DATE = '2025-12-31';

/**
 * Validate route configuration form
 * @param config - Route configuration to validate
 * @returns Object with validation errors
 */
export const validateRouteConfig = (config: RouteConfig): FormErrors => {
  const errors: FormErrors = {};

  // Validate start date
  if (!config.startDate) {
    errors.startDate = 'Start date is required';
  } else if (!isValidDate(config.startDate)) {
    errors.startDate = 'Invalid start date format';
  } else {
    // Check if date is within available data range
    if (config.startDate < DATA_START_DATE || config.startDate > DATA_END_DATE) {
      errors.startDate = `Start date must be between ${DATA_START_DATE} and ${DATA_END_DATE}`;
    }
  }

  // Validate start time
  if (!config.startTime) {
    errors.startTime = 'Start time is required';
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.startTime)) {
    errors.startTime = 'Invalid time format (HH:MM)';
  }

  // Validate end date
  if (!config.endDate) {
    errors.endDate = 'End date is required';
  } else if (!isValidDate(config.endDate)) {
    errors.endDate = 'Invalid end date format';
  } else {
    // Check if date is within available data range
    if (config.endDate < DATA_START_DATE || config.endDate > DATA_END_DATE) {
      errors.endDate = `End date must be between ${DATA_START_DATE} and ${DATA_END_DATE}`;
    }
  }

  // Validate end time
  if (!config.endTime) {
    errors.endTime = 'End time is required';
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.endTime)) {
    errors.endTime = 'Invalid time format (HH:MM)';
  }

  // Validate date/time logic
  if (!errors.startDate && !errors.startTime && !errors.endDate && !errors.endTime) {
    const startDateTime = new Date(`${config.startDate}T${config.startTime}`);
    const endDateTime = new Date(`${config.endDate}T${config.endTime}`);
    
    if (startDateTime >= endDateTime) {
      errors.endDate = 'End date/time must be after start date/time';
    }
  }

  // Validate start airports
  if (!config.startAirports || config.startAirports.trim() === '') {
    errors.startAirports = 'At least one start airport is required';
  } else {
    const airports = config.startAirports.split(',').map(a => a.trim()).filter(a => a);
    if (airports.length === 0) {
      errors.startAirports = 'At least one start airport is required';
    } else if (airports.some(a => !/^[A-Z]{3}$/.test(a))) {
      errors.startAirports = 'Airport codes must be 3 letters (e.g., EWR, JFK)';
    }
  }

  // Validate end airports
  if (!config.endAirports || config.endAirports.trim() === '') {
    errors.endAirports = 'At least one end airport is required';
  } else {
    const airports = config.endAirports.split(',').map(a => a.trim()).filter(a => a);
    if (airports.length === 0) {
      errors.endAirports = 'At least one end airport is required';
    } else if (airports.some(a => !/^[A-Z]{3}$/.test(a))) {
      errors.endAirports = 'Airport codes must be 3 letters (e.g., EWR, JFK)';
    }
  }

  // Validate visited airports (optional)
  if (config.visitedAirports && config.visitedAirports.trim() !== '') {
    const airports = config.visitedAirports.split(',').map(a => a.trim()).filter(a => a);
    if (airports.some(a => !/^[A-Z]{3}$/.test(a))) {
      errors.visitedAirports = 'Airport codes must be 3 letters (e.g., JFK, BOS)';
    }
  }

  // Validate minimum connection time
  if (config.minConnectionTime < 30) {
    errors.minConnectionTime = 'Minimum connection time must be at least 30 minutes';
  } else if (config.minConnectionTime > 480) {
    errors.minConnectionTime = 'Minimum connection time cannot exceed 8 hours';
  }

  return errors;
};

/**
 * Check if form has any errors
 * @param errors - Form errors object
 * @returns True if there are no errors
 */
export const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Get airport codes from comma-separated string
 * @param airportString - Comma-separated airport codes
 * @returns Array of airport codes
 */
export const parseAirportCodes = (airportString: string): string[] => {
  return airportString
    .split(',')
    .map(code => code.trim().toUpperCase())
    .filter(code => /^[A-Z]{3}$/.test(code));
};

/**
 * Validate individual airport code
 * @param code - Airport code to validate
 * @returns True if valid
 */
export const isValidAirportCode = (code: string): boolean => {
  return /^[A-Z]{3}$/.test(code.trim());
}; 
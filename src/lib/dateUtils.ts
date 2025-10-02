/**
 * Parse date and time strings into a Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns Date object
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(`${dateStr}T${timeStr}:00`);
};

/**
 * Parse MM/DD/YYYY HH:MMam/pm format to Date object
 * @param dateTimeStr - Date time string in MM/DD/YYYY HH:MMam/pm format
 * @returns Date object or null if invalid
 */
export const parseDateTimeString = (dateTimeStr: string): Date | null => {
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
 * Format a Date object to local time string
 * @param date - Date object to format
 * @returns Formatted date string in local time
 */
export const formatDateTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Format flight datetime string for display
 * @param dateTimeStr - Date time string in MM/DD/YYYY HH:MMam/pm format
 * @returns Formatted date string for display
 */
export const formatFlightDateTime = (dateTimeStr: string): string => {
  const date = parseDateTimeString(dateTimeStr);
  if (!date) {
    return dateTimeStr; // Return original string if parsing fails
  }
  return formatDateTime(date);
};

/**
 * Convert minutes to hours with decimal places
 * @param minutes - Number of minutes
 * @returns Formatted hours string
 */
export const minutesToHours = (minutes: number): string => {
  if (minutes <= 0) return '0h';
  
  const hours = minutes / 60;
  const wholeHours = Math.floor(hours);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${remainingMinutes}m`;
};

/**
 * Convert minutes to milliseconds
 * @param minutes - Number of minutes
 * @returns Number of milliseconds
 */
export const minutesToMilliseconds = (minutes: number): number => {
  return minutes * 60 * 1000;
};

/**
 * Format date for display
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format time for display
 * @param dateString - Date string to format
 * @returns Formatted time string
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
};

/**
 * Format date and time for display
 * @param dateString - Date string to format
 * @returns Formatted date and time string
 */
export const formatDateTimeDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
};

/**
 * Calculate duration between two dates in minutes
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Duration in minutes
 */
export const calculateDuration = (startDate: string, endDate: string): number => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60));
  } catch {
    return 0;
  }
};

/**
 * Check if a date is valid
 * @param dateString - Date string to validate
 * @returns True if date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns Current date string
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current time in HH:MM format
 * @returns Current time string
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}; 
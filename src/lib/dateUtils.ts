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
 * Format a Date object to local time string
 * @param date - Date object to format
 * @returns Formatted date string in local time
 */
export const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
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
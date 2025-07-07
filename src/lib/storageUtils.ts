import { Flight } from './types';

const CSV_DATA_KEY = 'jetblue-csv-data';

/**
 * Save CSV data to sessionStorage
 * @param data - Flight data to save
 */
export const saveCsvData = (data: Flight[]): void => {
  try {
    sessionStorage.setItem(CSV_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving CSV data:', error);
    // If storage is full, try to clear old data and retry
    sessionStorage.clear();
    try {
      sessionStorage.setItem(CSV_DATA_KEY, JSON.stringify(data));
    } catch (retryError) {
      console.error('Error saving CSV data after clearing storage:', retryError);
    }
  }
};

/**
 * Load CSV data from sessionStorage
 * @returns Parsed flight data or null if not found/corrupted
 */
export const loadCsvData = (): Flight[] | null => {
  try {
    const savedData = sessionStorage.getItem(CSV_DATA_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Error loading saved CSV data:', error);
    // Clear corrupted data
    sessionStorage.removeItem(CSV_DATA_KEY);
  }
  return null;
};

/**
 * Clear saved CSV data from sessionStorage
 */
export const clearCsvData = (): void => {
  sessionStorage.removeItem(CSV_DATA_KEY);
};

/**
 * Check if CSV data exists in sessionStorage
 * @returns True if data exists and is valid
 */
export const hasCsvData = (): boolean => {
  try {
    const savedData = sessionStorage.getItem(CSV_DATA_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return Array.isArray(parsed) && parsed.length > 0;
    }
  } catch (error) {
    console.error('Error checking CSV data:', error);
  }
  return false;
}; 
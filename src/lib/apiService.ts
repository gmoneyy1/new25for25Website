import { Flight, RouteConfig, Results } from './types';

const SCHEDULE_URL = '/api/schedule';
const OPTIMIZE_URL = '/api/optimize';

/**
 * Check if flight schedule data is available (without fetching the actual data)
 * @returns Promise with boolean indicating availability
 */
export const checkFlightScheduleAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(SCHEDULE_URL, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking flight schedule availability:', error);
    return false;
  }
};

/**
 * Optimize route using backend API
 * @param config - Route configuration
 * @returns Promise with optimization results
 */
export const optimizeRoute = async (config: RouteConfig): Promise<Results> => {
  try {
    const response = await fetch(OPTIMIZE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error optimizing route:', error);
    return { error: `Failed to optimize route: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

/**
 * Check if the API endpoints are available
 * @returns Promise with boolean indicating availability
 */
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const [scheduleResponse, optimizeResponse] = await Promise.all([
      fetch(SCHEDULE_URL, { method: 'HEAD' }),
      fetch(OPTIMIZE_URL, { method: 'OPTIONS' })
    ]);
    
    return scheduleResponse.ok && optimizeResponse.ok;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
};

/**
 * Get API status information
 * @returns Promise with detailed API status
 */
export const getApiStatus = async () => {
  try {
    const [scheduleStatus, optimizeStatus] = await Promise.all([
      fetch(SCHEDULE_URL, { method: 'HEAD' }).then(r => ({ ok: r.ok, status: r.status })),
      fetch(OPTIMIZE_URL, { method: 'OPTIONS' }).then(r => ({ ok: r.ok, status: r.status }))
    ]);
    
    return {
      schedule: scheduleStatus,
      optimize: optimizeStatus,
      allAvailable: scheduleStatus.ok && optimizeStatus.ok
    };
  } catch (error) {
    console.error('API status check failed:', error);
    return {
      schedule: { ok: false, status: 0 },
      optimize: { ok: false, status: 0 },
      allAvailable: false
    };
  }
}; 
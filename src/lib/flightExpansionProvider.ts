// src/lib/flightExpansionProvider.ts
// Adapter to bridge existing Flight data to the new improvedHybridOptimization algorithm

import { Flight } from './types';
import { ExpansionProvider, AirportId, Neighbor } from './improvedHybridOptimization';
import { parseDateTime, minutesToMilliseconds } from './dateUtils';

/**
 * Parse MM/DD/YYYY HH:MMam/pm format to Date object
 */
const parseDateTimeString = (dateTimeStr: string): Date | null => {
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
 * Validate and fix flight times, handling overnight flights properly
 */
function validateAndFixFlightTimes(flight: Flight): { depTime: Date; arrTime: Date } | null {
  const depTime = parseDateTimeString(flight['Departure Datetime']);
  let arrTime = parseDateTimeString(flight['Arrival Datetime']);

  if (!depTime || !arrTime) {
    return null;
  }

  // Handle overnight flights BEFORE any other validation
  if (arrTime.getTime() < depTime.getTime()) {
    const durationMinutes = flight['Elapsed Minutes'] || 0;
    if (durationMinutes > 60) {
      // Valid overnight flight - add one day to arrival time
      arrTime = new Date(arrTime);
      arrTime.setDate(arrTime.getDate() + 1);
    } else {
      // Invalid flight - arrival before departure with short duration
      return null;
    }
  }

  // Validate flight duration (max 12 hours)
  const flightDuration = (arrTime.getTime() - depTime.getTime()) / (1000 * 60);
  if (flightDuration > 12 * 60) {
    return null;
  }

  return { depTime, arrTime };
}

/**
 * Build flight index by origin airport
 */
function buildFlightIndex(flights: Flight[]): Record<string, Flight[]> {
  const flightsByOrigin: Record<string, Flight[]> = {};
  
  flights.forEach(flight => {
    const origin = flight.Origin;
    if (!flightsByOrigin[origin]) {
      flightsByOrigin[origin] = [];
    }
    flightsByOrigin[origin].push(flight);
  });
  
  return flightsByOrigin;
}

/**
 * Create expansion provider that adapts Flight data to the new algorithm
 */
export function createFlightExpansionProvider(
  flights: Flight[],
  config: {
    startDateTime: Date;
    endDateTime: Date;
    minConnectionTime: number;
    endAirports: Set<string>;
    visitedAirports: Set<string>;
  }
): ExpansionProvider {
  const flightsByOrigin = buildFlightIndex(flights);
  const minConnectionTimeMs = minutesToMilliseconds(config.minConnectionTime);
  
  return (state) => {
    const currentAirport = state.current as string;
    const outgoingFlights = flightsByOrigin[currentAirport] || [];
    const neighbors: Neighbor[] = [];
    
    for (const flight of outgoingFlights) {
      const validatedTimes = validateAndFixFlightTimes(flight);
      if (!validatedTimes) continue;
      
      const { depTime: flightDepTime, arrTime: flightArrTime } = validatedTimes;
      
      // Time constraint validation
      const requiredDepTime = new Date(state.timeLeft + minConnectionTimeMs);
      if (flightDepTime < requiredDepTime || flightArrTime > config.endDateTime) {
        continue;
      }
      
      // Skip flights to already visited airports (except end airports for completion)
      if (state.path.length > 0) {
        if (state.path.includes(flight.Destination) && !config.endAirports.has(flight.Destination)) {
          continue;
        }
      }
      
      // Calculate leg time in minutes
      const legTimeMinutes = flight['Elapsed Minutes'] || 0;
      
      neighbors.push({
        next: flight.Destination,
        legTime: legTimeMinutes,
        departureTimestamp: flightDepTime.getTime(),
        arrivalTimestamp: flightArrTime.getTime(),
        meta: {
          flight: flight,
          depTime: flightDepTime,
          arrTime: flightArrTime,
          price: flight.Price,
          distance: flight['Distance (MI)'] || flight['Distance (KM)'] || 0
        }
      });
    }
    
    return neighbors;
  };
}

/**
 * Extract all unique airports from flight data
 */
export function extractAirports(flights: Flight[]): string[] {
  const airports = new Set<string>();
  flights.forEach(flight => {
    airports.add(flight.Origin);
    airports.add(flight.Destination);
  });
  return Array.from(airports).sort();
}

/**
 * Convert new algorithm result back to your existing OptimizationResults format
 */
export function convertToOptimizationResults(
  result: import('./improvedHybridOptimization').Result,
  flights: Flight[],
  visitedAirports: Set<string>
): import('./types').OptimizationResults {
  // Build flight index for quick lookup
  const flightIndex = new Map<string, Flight[]>();
  flights.forEach(flight => {
    const key = `${flight.Origin}-${flight.Destination}`;
    if (!flightIndex.has(key)) {
      flightIndex.set(key, []);
    }
    flightIndex.get(key)!.push(flight);
  });
  
  // Reconstruct the path using flights
  const path: Flight[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let totalPrice = 0;
  
  for (let i = 0; i < result.visitedOrder.length - 1; i++) {
    const origin = String(result.visitedOrder[i]);
    const destination = String(result.visitedOrder[i + 1]);
    const key = `${origin}-${destination}`;
    
    const availableFlights = flightIndex.get(key) || [];
    if (availableFlights.length > 0) {
      // Take the first available flight (could be improved with better selection)
      const flight = availableFlights[0];
      path.push(flight);
      
      totalDistance += flight['Distance (MI)'] || flight['Distance (KM)'] || 0;
      totalDuration += flight['Elapsed Minutes'] || 0;
      totalPrice += parseFloat(flight.Price || '0') || 0;
    }
  }
  
  // Calculate new airports visited
  const uniqueAirports = new Set(result.visitedOrder.map(String));
  const newAirportsVisited = Array.from(uniqueAirports).filter(airport => 
    !visitedAirports.has(airport)
  );
  
  return {
    path,
    totalFlights: path.length,
    newAirportsVisited,
    totalDistance,
    totalDuration,
    totalPrice,
    executionTime: 0 // Will be set by caller
  };
}

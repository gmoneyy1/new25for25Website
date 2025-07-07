export interface Flight {
  'Flight Number': string;
  Origin: string;
  Destination: string;
  'Departure Datetime': string;
  'Arrival Datetime': string;
  'Elapsed Minutes': number;
  Equipment: string;
  'Distance (KM)': number;
}

export interface RouteConfig {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startAirports: string;
  endAirports: string;
  visitedAirports: string;
  minConnectionTime: number;
}

export interface SearchState {
  score: number;
  counter: number;
  path: Flight[];
  visitedSet: Set<string>;
  arrivalTime: Date;
}

export interface OptimizationResults {
  path: Flight[];
  totalFlights: number;
  newAirportsVisited: string[];
  totalDistance: number;
  totalDuration: number;
  iterations: number;
}

export interface OptimizationError {
  error: string;
}

export type Results = OptimizationResults | OptimizationError | null;

export interface CsvParseResult {
  data: Flight[];
  errors: any[];
  meta: any;
} 
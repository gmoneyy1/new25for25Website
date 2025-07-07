# JetBlue 25for25 Route Optimizer - Refactoring Documentation

## Overview
This document describes the refactoring of the JetBlue 25for25 Route Optimizer application, which involved extracting helper functions into separate utility files and creating reusable React components.

## Refactoring Goals
1. **Separation of Concerns**: Split business logic from UI components
2. **Reusability**: Create modular, reusable utility functions
3. **Type Safety**: Add comprehensive TypeScript type definitions
4. **Maintainability**: Improve code organization and readability
5. **Testability**: Make functions easier to unit test

## New Project Structure

### `/src/lib/` - Utility Functions
```
lib/
├── types.ts              # TypeScript type definitions
├── dateUtils.ts          # Date/time manipulation utilities
├── distanceUtils.ts      # Distance conversion utilities
├── storageUtils.ts       # SessionStorage management
├── csvUtils.ts           # CSV parsing and processing
├── optimizationUtils.ts  # Route optimization algorithms
└── apiService.ts         # API interaction functions
```

### `/src/components/` - React Components
```
components/
├── RouteConfig.tsx       # Route configuration panel
├── ResultsPanel.tsx      # Results display panel
└── FlightCard.tsx        # Individual flight display
```

## Extracted Utility Functions

### 1. Type Definitions (`types.ts`)
- `Flight` - Flight data structure
- `RouteConfig` - Route configuration parameters
- `SearchState` - A* search algorithm state
- `OptimizationResults` - Optimization output
- `OptimizationError` - Error response structure

### 2. Date Utilities (`dateUtils.ts`)
- `parseDateTime()` - Parse date and time strings
- `formatDateTime()` - Format dates for display
- `minutesToHours()` - Convert minutes to hours
- `minutesToMilliseconds()` - Convert minutes to milliseconds
- `isValidDate()` - Validate date objects

### 3. Distance Utilities (`distanceUtils.ts`)
- `kilometersToMiles()` - Convert km to miles
- `kilometersToMilesExact()` - Convert without rounding
- `milesToKilometers()` - Convert miles to km
- `formatDistance()` - Format distance with units

### 4. Storage Utilities (`storageUtils.ts`)
- `saveCsvData()` - Save data to sessionStorage
- `loadCsvData()` - Load data from sessionStorage
- `clearCsvData()` - Clear cached data
- `hasCsvData()` - Check if data exists

### 5. CSV Utilities (`csvUtils.ts`)
- `parseCsvText()` - Parse CSV text content
- `parseCsvFile()` - Parse CSV file uploads
- `flightsToCsv()` - Convert flights to CSV
- `downloadFlightsAsCsv()` - Download as CSV file
- `validateFlightData()` - Validate flight structure

### 6. Optimization Utilities (`optimizationUtils.ts`)
- `calculateHeuristic()` - A* heuristic function
- `filterValidFlights()` - Filter flights by constraints
- `buildFlightIndex()` - Build flight lookup index
- `parseAirportSets()` - Parse airport configurations
- `calculateNewAirportsVisited()` - Calculate new airports
- `calculatePathMetrics()` - Calculate route metrics
- `optimizeRoute()` - Main optimization algorithm

### 7. API Service (`apiService.ts`)
- `fetchFlightSchedule()` - Fetch schedule from API
- `checkApiAvailability()` - Check API status

## Extracted React Components

### 1. RouteConfigPanel (`RouteConfig.tsx`)
- Handles all route configuration inputs
- Manages form state and validation
- Provides optimize button with loading states

### 2. ResultsPanel (`ResultsPanel.tsx`)
- Displays optimization results
- Shows summary statistics
- Handles CSV download functionality
- Renders flight itinerary

### 3. FlightCard (`FlightCard.tsx`)
- Individual flight display component
- Shows flight details and timing
- Handles distance conversion

## Benefits of Refactoring

### 1. **Improved Maintainability**
- Clear separation between UI and business logic
- Single responsibility principle applied
- Easier to locate and modify specific functionality

### 2. **Enhanced Testability**
- Pure functions can be easily unit tested
- Components can be tested in isolation
- Mock dependencies for testing

### 3. **Better Type Safety**
- Comprehensive TypeScript interfaces
- Compile-time error checking
- Better IDE support and autocomplete

### 4. **Code Reusability**
- Utility functions can be used across components
- Components can be reused in different contexts
- Consistent patterns across the application

### 5. **Performance Optimization**
- Memoized functions where appropriate
- Reduced component re-renders
- Efficient data processing

## Migration Guide

### From Original to Refactored

1. **Replace direct function calls** with imported utilities:
   ```typescript
   // Before
   const parseDateTime = (dateStr, timeStr) => { ... }
   
   // After
   import { parseDateTime } from '../lib/dateUtils';
   ```

2. **Use typed interfaces** instead of implicit types:
   ```typescript
   // Before
   const [config, setConfig] = useState({ ... });
   
   // After
   const [config, setConfig] = useState<RouteConfig>({ ... });
   ```

3. **Replace inline components** with extracted components:
   ```typescript
   // Before
   <div className="bg-white rounded-lg shadow-lg p-6">
     {/* Configuration form */}
   </div>
   
   // After
   <RouteConfigPanel
     config={config}
     onConfigChange={setConfig}
     onOptimize={handleOptimize}
     isLoading={isLoading}
     hasData={!!csvData}
   />
   ```

## Testing Strategy

### Unit Tests
- Test utility functions with various inputs
- Mock dependencies for isolated testing
- Test edge cases and error conditions

### Component Tests
- Test component rendering and interactions
- Mock props and event handlers
- Test loading and error states

### Integration Tests
- Test API interactions
- Test data flow between components
- Test end-to-end optimization workflow

## Future Enhancements

### 1. **Additional Utilities**
- Error handling utilities
- Validation utilities
- Performance monitoring utilities

### 2. **Component Library**
- Reusable UI components
- Form components with validation
- Data visualization components

### 3. **State Management**
- Consider Redux or Zustand for complex state
- Implement caching strategies
- Add offline support

### 4. **API Enhancements**
- Add retry logic for failed requests
- Implement request caching
- Add request/response interceptors

## Conclusion

The refactoring successfully separated concerns, improved code organization, and enhanced maintainability. The new structure provides a solid foundation for future development and makes the codebase more professional and scalable.

The extracted utilities and components can now be easily tested, reused, and maintained independently, while the main application component focuses solely on orchestrating the user experience. 
# JetBlue 25for25 Route Optimizer - Technical Specification

## Overview
The JetBlue 25for25 Route Optimizer is a React-based web application that helps users find optimal flight routes to visit the maximum number of new airports within specified time constraints. The application uses an A* search algorithm to optimize routes based on JetBlue flight schedules.

## Architecture

### Technology Stack
- **Frontend**: React 18 with Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **CSV Processing**: PapaParse
- **State Management**: React Hooks (useState, useCallback, useEffect)
- **Storage**: Browser SessionStorage for caching

### Project Structure
```
src/
├── app/
│   ├── page.tsx              # Main application component
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/                  # API routes
├── lib/
│   ├── types.ts              # TypeScript type definitions
│   ├── csvUtils.ts           # CSV processing utilities
│   ├── dateUtils.ts          # Date/time utilities
│   ├── optimizationUtils.ts  # Route optimization algorithms
│   ├── storageUtils.ts       # SessionStorage utilities
│   └── distanceUtils.ts      # Distance conversion utilities
└── components/
    ├── RouteConfig.tsx       # Route configuration panel
    ├── ResultsPanel.tsx      # Results display panel
    └── FlightCard.tsx        # Individual flight display component
```

## API Interactions

### 1. Flight Schedule API
**Endpoint**: `/api/schedule`
**Method**: GET
**Purpose**: Retrieve JetBlue flight schedule data

**Request**:
```typescript
GET /api/schedule
```

**Response**:
- **Content-Type**: `text/csv`
- **Data Format**: CSV with headers
- **Expected Columns**:
  - Flight Number
  - Origin
  - Destination
  - Departure Datetime
  - Arrival Datetime
  - Elapsed Minutes
  - Equipment
  - Distance (KM)

**Error Handling**:
- HTTP 404: Schedule file not found
- HTTP 500: Server error
- Network errors: Display user-friendly error message

**Caching Strategy**:
- Data cached in sessionStorage as `jetblue-csv-data`
- Automatic fallback to API if cache is corrupted or missing
- Cache cleared on storage errors

### 2. File Upload (Client-side)
**Purpose**: Allow users to upload custom CSV files
**Processing**: Client-side CSV parsing using PapaParse
**Validation**: 
- File format validation
- Required column validation
- Data integrity checks

## Core Functionality

### 1. Route Configuration
**Parameters**:
```typescript
interface RouteConfig {
  startDate: string;           // YYYY-MM-DD format
  startTime: string;           // HH:MM format
  endDate: string;             // YYYY-MM-DD format
  endTime: string;             // HH:MM format
  startAirports: string;       // Comma-separated airport codes
  endAirports: string;         // Comma-separated airport codes
  visitedAirports: string;     // Comma-separated airport codes
  minConnectionTime: number;   // Minutes
}
```

### 2. Route Optimization Algorithm
**Algorithm**: A* Search with custom heuristic
**Objective**: Maximize new airports visited within time constraints

**Key Components**:
- **Heuristic Function**: `(allNew.size - visited.size) * 60`
- **Constraints**:
  - Time window compliance
  - Minimum connection time
  - No duplicate flight numbers
  - Valid airport codes
- **Performance Optimizations**:
  - Memoization with visited states
  - Heap size limiting (1000 entries)
  - Maximum iterations (5000)
  - Early termination on end airports

### 3. Results Processing
**Output Structure**:
```typescript
interface OptimizationResults {
  path: Flight[];              // Optimal flight sequence
  totalFlights: number;        // Number of flights in route
  newAirportsVisited: string[]; // List of new airports
  totalDistance: number;       // Total distance in miles
  totalDuration: number;       // Total duration in minutes
  iterations: number;          // Algorithm iterations
}
```

## Data Models

### Flight Object
```typescript
interface Flight {
  'Flight Number': string;
  Origin: string;
  Destination: string;
  'Departure Datetime': string;
  'Arrival Datetime': string;
  'Elapsed Minutes': number;
  Equipment: string;
  'Distance (KM)': number;
}
```

### Search State
```typescript
interface SearchState {
  score: number;
  counter: number;
  path: Flight[];
  visitedSet: Set<string>;
  arrivalTime: Date;
}
```

## User Interface

### Layout Structure
1. **Header**: Application title and description
2. **Configuration Panel** (Left sidebar):
   - Date/time inputs
   - Airport configuration
   - Connection time settings
   - Optimize button
3. **Results Panel** (Right main area):
   - Summary statistics
   - Flight itinerary
   - Download functionality

### Responsive Design
- **Mobile**: Single column layout
- **Tablet**: Two-column layout
- **Desktop**: Three-column layout with sidebar

## Performance Considerations

### Optimization Strategies
1. **Data Caching**: SessionStorage for flight data
2. **Algorithm Limits**: 
   - Max 5000 iterations
   - Heap size limit of 1000
3. **UI Responsiveness**: 
   - Loading states
   - Progress indicators
   - Non-blocking operations

### Memory Management
- Automatic cleanup of temporary objects
- SessionStorage error handling
- Blob URL cleanup for downloads

## Error Handling

### Error Types
1. **Network Errors**: API fetch failures
2. **Data Errors**: Invalid CSV format
3. **Algorithm Errors**: No valid routes found
4. **Storage Errors**: SessionStorage limitations

### Error Recovery
- Graceful degradation
- User-friendly error messages
- Automatic retry mechanisms
- Data validation and sanitization

## Security Considerations

### Client-Side Security
- Input validation and sanitization
- XSS prevention through React's built-in protections
- File upload restrictions

### Data Privacy
- No server-side data storage
- Client-side only processing
- SessionStorage for temporary caching

## Testing Strategy

### Unit Tests
- Utility functions
- Algorithm components
- Data processing functions

### Integration Tests
- API interactions
- Component interactions
- End-to-end workflows

### Performance Tests
- Large dataset handling
- Algorithm efficiency
- Memory usage optimization

## Future Enhancements

### Potential Improvements
1. **Backend Integration**: Server-side optimization
2. **Real-time Data**: Live flight schedule updates
3. **Advanced Algorithms**: Machine learning optimization
4. **Multi-airline Support**: Expand beyond JetBlue
5. **User Accounts**: Save and share routes
6. **Mobile App**: Native mobile application

### Scalability Considerations
- Database integration for large datasets
- Caching strategies for performance
- API rate limiting and optimization
- Microservices architecture for complex features 
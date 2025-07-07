# JetBlue 25for25 Route Optimizer - Backend Architecture

## Overview
This document describes the backend architecture for the JetBlue 25for25 Route Optimizer, which moves all data processing and optimization logic to the server side, keeping the frontend focused purely on UI presentation.

## Architecture Benefits

### 1. **Security**
- CSV data and optimization algorithms are not exposed to the client
- Sensitive business logic remains on the server
- Input validation and sanitization on the server side

### 2. **Performance**
- Reduced client-side processing and memory usage
- Server-side caching and optimization
- Better handling of large datasets

### 3. **Maintainability**
- Centralized business logic
- Easier to update algorithms without client deployment
- Better error handling and logging

### 4. **Scalability**
- Can handle multiple concurrent requests
- Database integration ready
- Microservices architecture possible

## API Endpoints

### 1. Flight Schedule API
**Endpoint**: `GET /api/schedule`
**Purpose**: Serve JetBlue flight schedule data

**Response**:
```typescript
Content-Type: text/csv
Cache-Control: public, max-age=3600
```

**Features**:
- Serves CSV data directly from file system
- Implements caching headers
- CORS enabled for cross-origin requests
- Error handling for missing files

### 2. Route Optimization API
**Endpoint**: `POST /api/optimize`
**Purpose**: Perform route optimization using server-side algorithms

**Request Body**:
```typescript
{
  config: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    startAirports: string;
    endAirports: string;
    visitedAirports: string;
    minConnectionTime: number;
  }
}
```

**Response**:
```typescript
{
  path: Flight[];
  totalFlights: number;
  newAirportsVisited: string[];
  totalDistance: number;
  totalDuration: number;
  iterations: number;
} | {
  error: string;
}
```

**Features**:
- Full server-side optimization processing
- Input validation and sanitization
- Comprehensive error handling
- CORS support for preflight requests

## Backend Components

### 1. API Routes (`src/app/api/`)
```
api/
├── schedule/
│   └── route.ts          # Flight schedule endpoint
└── optimize/
    └── route.ts          # Route optimization endpoint
```

### 2. Server-Side Logic (`src/lib/server/`)
```
lib/server/
├── csvParser.ts          # Server-side CSV parsing
└── optimizationEngine.ts # A* search algorithm
```

### 3. Frontend API Service (`src/lib/apiService.ts`)
- Updated to call backend endpoints
- Handles API status checking
- Provides error handling and retry logic

## Data Flow

### 1. **Schedule Data Flow**
```
Client Request → /api/schedule → File System → CSV Data → Client
```

### 2. **Optimization Data Flow**
```
Client Request → /api/optimize → CSV Parser → Optimization Engine → Results → Client
```

## Server-Side Components

### 1. CSV Parser (`csvParser.ts`)
**Features**:
- Custom CSV parsing without external dependencies
- Handles quoted fields and escaped characters
- Validates data structure and required fields
- Error handling for malformed data

**Functions**:
- `parseCsvText()` - Parse CSV text into Flight objects
- `validateFlightData()` - Validate flight data structure
- `parseCsvLine()` - Parse individual CSV lines

### 2. Optimization Engine (`optimizationEngine.ts`)
**Features**:
- Complete A* search algorithm implementation
- All optimization logic moved from client to server
- Performance optimizations and limits
- Comprehensive error handling

**Functions**:
- `optimizeRoute()` - Main optimization function
- `calculateHeuristic()` - A* heuristic calculation
- `filterValidFlights()` - Flight filtering and validation
- `buildFlightIndex()` - Flight lookup index creation

## Security Considerations

### 1. **Input Validation**
- Server-side validation of all request parameters
- Type checking and sanitization
- Required field validation

### 2. **Error Handling**
- Comprehensive error catching and logging
- User-friendly error messages
- No sensitive information exposure

### 3. **CORS Configuration**
- Proper CORS headers for cross-origin requests
- Preflight request handling
- Security headers implementation

## Performance Optimizations

### 1. **Caching**
- Schedule data cached with appropriate headers
- Optimization results not cached (dynamic)
- File system caching for CSV data

### 2. **Algorithm Limits**
- Maximum 5000 iterations per optimization
- Heap size limit of 1000 entries
- Early termination on optimal solutions

### 3. **Memory Management**
- Efficient data structures for large datasets
- Proper cleanup of temporary objects
- Memory usage monitoring

## Error Handling

### 1. **API Errors**
- HTTP status codes for different error types
- Structured error responses
- Detailed logging for debugging

### 2. **Data Errors**
- CSV parsing error handling
- Invalid data filtering
- Graceful degradation

### 3. **System Errors**
- File system error handling
- Memory error recovery
- Service availability checks

## Monitoring and Logging

### 1. **API Monitoring**
- Request/response logging
- Performance metrics
- Error rate tracking

### 2. **System Health**
- API endpoint availability checks
- File system access monitoring
- Memory usage tracking

## Deployment Considerations

### 1. **Environment Setup**
- CSV file placement in data directory
- File permissions configuration
- Environment variable management

### 2. **Scaling**
- Horizontal scaling with load balancers
- Database integration for large datasets
- Caching layer implementation

### 3. **Security**
- HTTPS enforcement
- Rate limiting implementation
- Input sanitization

## Migration from Client-Side

### 1. **Frontend Changes**
- Remove client-side optimization logic
- Update API service calls
- Add API status monitoring

### 2. **Data Handling**
- Remove client-side CSV parsing
- Remove client-side caching
- Update error handling

### 3. **Testing**
- API endpoint testing
- Integration testing
- Performance testing

## Future Enhancements

### 1. **Database Integration**
- Store flight data in database
- Implement data versioning
- Add real-time updates

### 2. **Advanced Features**
- User authentication and authorization
- Saved route storage
- Advanced optimization algorithms

### 3. **Monitoring**
- Application performance monitoring
- Error tracking and alerting
- Usage analytics

## Conclusion

The backend architecture successfully separates concerns by moving all data processing and business logic to the server side. This provides better security, performance, and maintainability while keeping the frontend focused on user experience.

The API design is RESTful, well-documented, and ready for production deployment with proper monitoring and scaling capabilities. 
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks

### Local Development
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server at http://localhost:3000

## Architecture Overview

This is a **JetBlue 25for25 Route Optimizer** built with Next.js 14 and TypeScript. The application helps users find optimal flight routes to visit the maximum number of new airports within time constraints using an A* search algorithm.

### Core Architecture
The app uses a **hybrid client-server architecture**:
- **Frontend**: React components handle UI and user interactions
- **Backend API**: Next.js API routes handle flight data processing and route optimization
- **Data**: CSV flight schedule data stored in `data/jetblue_schedule.csv`

### Key Components Structure
```
src/
├── app/
│   ├── page.tsx              # Main application component
│   ├── api/
│   │   ├── optimize/route.ts # Route optimization API
│   │   ├── schedule/route.ts # Flight schedule API
│   │   └── pricing/route.ts  # Flight pricing API (new)
├── components/
│   ├── forms/                # Configuration forms (Route, Quick, Optimization)
│   ├── results/ResultsPage.tsx # Results display
│   └── ui/                   # Shadcn/ui components
├── lib/
│   ├── server/               # Server-side logic
│   │   ├── csvParser.ts      # CSV data parsing
│   │   └── optimizationEngine.ts # A* optimization algorithm
│   ├── apiService.ts         # Frontend API calls
│   ├── types.ts              # TypeScript interfaces
│   └── utils/                # Utility functions
```

### Data Flow
1. User configures route parameters in forms
2. Frontend calls `/api/optimize` with RouteConfig
3. Backend loads CSV data and runs A* algorithm
4. Results returned to frontend for display

### Key Types
- `Flight`: Individual flight record from CSV data
- `RouteConfig`: User input parameters (dates, airports, connection time)
- `OptimizationResults`: Algorithm output (path, stats, new airports visited)
- `FlightPricing`: New pricing integration types

### API Endpoints
- `GET /api/schedule` - Retrieve flight schedule CSV data
- `POST /api/optimize` - Process route optimization requests
- `GET|POST /api/pricing` - Flight pricing data (recently added)

### Current State & Recent Changes
The codebase is on branch `removefooter` with recent additions:
- Pricing integration functionality (PRICING_INTEGRATION.md)
- Backend API architecture migration
- Modular component structure
- Enhanced form validation

The application has both client-side (`page.tsx`) and backend (`page-backend.tsx`) implementations, with the backend version being the current focus for better security and performance.

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + Shadcn/ui components
- **Data**: CSV processing with custom parsers
- **Icons**: Lucide React + Phosphor Icons
- **Analytics**: Vercel Analytics
- **Charts**: Recharts for data visualization
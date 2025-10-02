'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Save } from 'lucide-react';
import { RouteForm } from '../components/forms/RouteForm';
import { ResultsPage } from '../components/results/ResultsPage';
import RouteMapWithTiles from '../components/RouteMapWithTiles';
import SimpleSavedRoutes from '../components/SimpleSavedRoutes';
import ErrorBoundary from '../components/ErrorBoundary';
import { RouteConfig, Results, Flight } from '../lib/types';
import { useOptimization } from '../hooks/useOptimization';
import { useWorkerOptimization } from '../hooks/useWorkerOptimization';
import { parseCsvText } from '../lib/server/csvParser';
import { validateRouteConfig, FormErrors } from '../lib/formValidation';
import { getScheduleData, getErrorMessage } from '../lib/apiService';
import { getOptimizationConfig, updateActiveConfig } from '../lib/optimizationConfig';
import { DonationWidget } from '../components/DonationWidget';

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
];

// Remove AboutSection, ContactSection, and Navigation components

const JetBlueOptimizer = () => {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);

  // Web worker optimization hook
  const {
    optimize: workerOptimize,
    isOptimizing: isWorkerOptimizing,
    progress: workerProgress,
    cancel: cancelWorker,
    supportsWorkers
  } = useWorkerOptimization();
  const [config, setConfig] = useState<RouteConfig>({
    startDate: '2025-10-24',
    startTime: '07:00',
    endDate: '2025-10-26',
    endTime: '23:59',
    startAirports: 'EWR,JFK,HPN,LGA',
    endAirports: 'EWR,JFK,HPN,LGA',
    visitedAirports: '',
    minConnectionTime: 60,
    domesticOnly: false
  });

  // Use cached optimization hook
  const [currentConfig, setCurrentConfig] = useState<RouteConfig | null>(null);
  const {
    data: results,
    isLoading,
    optimize,
    isOptimizing,
    error: optimizeError,
    hasCachedResult,
    getCachedResult,
    isFromCache,
    clearCache
  } = useOptimization(currentConfig);

  // SSR-friendly state
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load optimization level preference from localStorage
    const savedOptLevel = localStorage.getItem('jetblue-optimization-level');
    if (savedOptLevel) {
      const config = getOptimizationConfig(savedOptLevel);
      updateActiveConfig(config);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Loaded optimization level: ${savedOptLevel}`, config);
      }
    }
  }, []);

  // Load flight data on mount for web worker
  useEffect(() => {
    if (supportsWorkers) {
      const loadFlightData = async () => {
        try {
          const csvData = await getScheduleData();
          const parsedFlights = parseCsvText(csvData);
          setFlights(parsedFlights);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to load flights for web worker:', error);
          }
          // Could add user notification here if needed
        }
      };
      
      loadFlightData();
    }
  }, [supportsWorkers]);

  // Validate form when config changes
  useEffect(() => {
    const errors = validateRouteConfig(config);
    setFormErrors(errors);
  }, [config]);

  // Debug: Monitor currentConfig changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 currentConfig changed:', currentConfig);
      if (currentConfig) {
        console.log('📊 Triggering optimization with config:', currentConfig);
      }
    }
  }, [currentConfig]);

  const handleOptimizeRoute = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 handleOptimizeRoute called');
    }
    
    // Validate form before submitting
    const errors = validateRouteConfig(config);
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Form validation errors:', errors);
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Form validation failed, scrolling to top');
      }
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Form validation passed');
    }

    // Handle domestic-only logic
    let optimizationConfig = { ...config };
    
    // Always ensure there's at least one visited airport for backend compatibility
    // Use "BED" (not in JetBlue network) as a hidden default when field is empty
    let effectiveVisitedAirports = config.visitedAirports && config.visitedAirports.trim() !== '' 
      ? config.visitedAirports 
      : 'BED';
    
    if (config.domesticOnly) {
      // Comprehensive list of ALL international airports to exclude
      const internationalAirports = [
        // Europe
        'AMS', 'CDG', 'LHR', 'LGW', 'DUB', 'EDI', 'MAD', 'LIR',
        // Mexico & Central America
        'SJD', 'SJO', 'GUA', 'SAP', 'MDE', 'CTG', 'CUN',
        // South America
        'GEO', 'GYE', 'BZE',
        // Caribbean
        'CUR', 'GND', 'ANU', 'BGI', 'KIN', 'MBJ', 'POP', 'POS', 'SKB', 'BON', 'GCM', 'PLS',
        // Additional international destinations
        'YVR', 'SVD', 'SXM', 'STT', 'STX', 'UVF',
        // Missing international airports that were causing issues
        'PUJ', 'STI', 'SDQ', 'NAS',
        // Additional international airports found in CSV analysis
        'AUA', 'BDA', 'BQN', 'SJU', 'PSE',
        // Additional international airports found in September data
        'MDE', 'STI', 'SDQ', 'PUJ', 'NAS', 'BQN', 'SJU', 'PSE', 'MBJ', 'KIN', 'MAD', 'GYE'
      ];
      
      // Always add ALL international airports to visited airports (hidden from UI)
      // This ensures they're completely excluded from optimization
      const currentVisited = effectiveVisitedAirports.split(',').map(a => a.trim()).filter(a => a && a !== 'BED');
      const allInternational = Array.from(new Set([...currentVisited, ...internationalAirports]));
      optimizationConfig.visitedAirports = allInternational.join(',');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🌍 Domestic-only mode: Excluding ALL international airports:', internationalAirports);
        console.log('🚫 Total airports excluded:', allInternational.length);
      }
    } else {
      // For international mode, just use the effective visited airports
      optimizationConfig.visitedAirports = effectiveVisitedAirports;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Effective visited airports for optimization:', optimizationConfig.visitedAirports);
      console.log('🚀 Starting optimization for config:', optimizationConfig);
    }
    
    if (supportsWorkers && flights.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Using web worker optimization');
      }
      try {
        const result = await workerOptimize(flights, optimizationConfig);
        // Manually update cache and UI state
        // We'll need to update the hook to handle worker results
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Worker result:', result);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Worker optimization failed:', error);
          console.log('🔄 Falling back to regular optimization');
        }
        setCurrentConfig(optimizationConfig);
      }
    } else {
      // Use regular optimization
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Using regular optimization (no web worker)');
        console.log('📊 Setting currentConfig to:', optimizationConfig);
      }
      setCurrentConfig(optimizationConfig);
    }
  }, [config, supportsWorkers, flights, workerOptimize]);

  const handleDownload = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Download completed');
    }
  }, []);


  const handleOptimizeAgain = useCallback(() => {
    // Clear cache for this config and re-optimize
    if (currentConfig) {
      clearCache(currentConfig);
    }
    // Trigger re-optimization by setting config again
    setCurrentConfig(null);
    setTimeout(() => setCurrentConfig(config), 100);
  }, [clearCache, currentConfig, config]);



  const handleLoadSavedConfig = useCallback((savedConfig: RouteConfig) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading saved config:', savedConfig);
    }
    
    // Update the form with the saved configuration first
    setConfig(savedConfig);
    
    // Automatically show the map if it's not already visible
    if (!showMap) {
      setShowMap(true);
    }
    
    // Trigger optimization after a short delay to ensure config is updated
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auto-optimizing loaded route...');
      }
      setCurrentConfig(savedConfig);
    }, 100);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Config loaded and optimization triggered');
    }
  }, [showMap]);

  // Check if current route uses September data (for cost optimization)
  const isSeptemberData = useCallback(() => {
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const septemberStart = new Date('2025-09-01T00:00:00');
    const septemberEnd = new Date('2025-09-30T23:59:59');
    
    // Use September data if either start or end date falls within September 1-30
    return (startDate >= septemberStart && startDate <= septemberEnd) ||
           (endDate >= septemberStart && endDate <= septemberEnd);
  }, [config.startDate, config.endDate]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main App Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header - Centered Title */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col items-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              JetBlue 25for25 Route Optimizer
            </h1>
            <p className="text-gray-600 text-base md:text-lg px-4 max-w-2xl">
              Find the cheapest route to visit the most new airports efficiently
            </p>
            
            {/* Domestic Mode Indicator */}
            {config.domesticOnly && (
              <div className="mt-3 px-4 py-2 bg-green-100 border border-green-300 rounded-lg inline-flex items-center">
                <span className="text-green-800 text-sm font-medium">
                  🇺🇸 Domestic Routes Only
                </span>
                <span className="text-green-600 text-xs ml-2">
                  International airports automatically excluded
                </span>
              </div>
            )}
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <div className="relative group">
                <button
                  onClick={() => setShowMap(!showMap)}
                  disabled={!results || !('path' in results)}
                  className={`flex items-center px-4 py-2 text-sm rounded-full transition-colors min-h-[40px] ${
                    !results || !('path' in results)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : showMap 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={
                    !results || !('path' in results)
                      ? 'Run optimization first to view route map'
                      : 'Toggle Route Map'
                  }
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
                
                {/* Hover tooltip for disabled state */}
                {(!results || !('path' in results)) && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-blue-700 text-sm">
                        Map will be available after running optimization
                      </span>
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-200"></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSavedConfigs(!showSavedConfigs)}
                className={`flex items-center px-4 py-2 text-sm rounded-full transition-colors min-h-[40px] ${
                  showSavedConfigs 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="View saved configurations"
              >
                <Save className="h-4 w-4 mr-2" />
                {showSavedConfigs ? 'Hide Saved' : 'Saved Routes'}
              </button>
            </div>
            
            
            
            
            {/* Route Validation Warning */}
            {results && 'hybridResults' in results && results.hybridResults && 
             (!results.hybridResults.standardRoute.isValid || !results.hybridResults.costOptimizedRoute.isValid) && (
              <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg inline-flex items-center">
                <span className="text-red-700 text-sm">
                  ⚠️ Some routes are incomplete - check results for details
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Configurations Panel */}
        {showSavedConfigs && (
          <div className="mb-6">
            <ErrorBoundary>
              <SimpleSavedRoutes
                currentConfig={config}
                currentResults={results}
                onLoadConfiguration={handleLoadSavedConfig}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Route Map Panel */}
        {showMap && (
          <div className="mb-6">
            <ErrorBoundary>
              {results && 'path' in results ? (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Visualization</h3>
                  <RouteMapWithTiles flights={results.path} height="500px" />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Data Available</h3>
                    <p className="text-gray-500 mb-4">
                      Run the route optimization first to see your flight path visualized on the map.
                    </p>
                    <button
                      onClick={() => setShowMap(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Hide Map
                    </button>
                  </div>
                </div>
              )}
            </ErrorBoundary>
          </div>
        )}

        {/* Main Content - Mobile-First Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-10 gap-4 sm:gap-6 lg:gap-8">
          {/* Configuration Panel - Full width on mobile, 3 cols on desktop */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:space-y-6 order-1">
            <ErrorBoundary>
              <RouteForm
                config={config}
                onConfigChange={setConfig}
                onOptimize={handleOptimizeRoute}
                isLoading={isLoading || isOptimizing || isWorkerOptimizing}
                hasData={true}
                errors={formErrors}
              />
            </ErrorBoundary>
            
            {/* Donation Widget */}
            <ErrorBoundary>
              <DonationWidget variant="compact" />
            </ErrorBoundary>

          </div>
          {/* Results Panel - Full width on mobile, 7 cols on desktop */}
          <div className="lg:col-span-7 order-2">
            <ErrorBoundary>
              <ResultsPage
                results={results || null}
                onDownload={handleDownload}
                onOptimizeAgain={handleOptimizeAgain}
                isLoading={isLoading || isOptimizing || isWorkerOptimizing}
                isFromCache={isFromCache}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 George Z. All rights reserved.</p>
            <p className="mt-1">Optimize your flight routes to visit the most new airports efficiently.</p>
            <p className="mt-2">
              <a href="/settings" className="text-blue-600 hover:text-blue-800 transition-colors">
                ⚙️ Settings · Algorithm · Cache · Performance
              </a>
            </p>
          </div>
        </div>
      </div>
     
      {/* Ensure background extends to bottom */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
      
    </div>

  );
};

export default JetBlueOptimizer;

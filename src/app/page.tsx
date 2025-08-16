'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Save } from 'lucide-react';
import { RouteForm } from '../components/forms/RouteForm';
import { QuickSettingsForm } from '../components/forms/QuickSettingsForm';
import { ResultsPage } from '../components/results/ResultsPage';
import RouteMapWithTiles from '../components/RouteMapWithTiles';
import SimpleSavedRoutes from '../components/SimpleSavedRoutes';
import ErrorBoundary from '../components/ErrorBoundary';
import { RouteConfig, Results, Flight } from '../lib/types';
import { useOptimization } from '../hooks/useOptimization';
import { useWorkerOptimization } from '../hooks/useWorkerOptimization';
import { parseCsvText } from '../lib/server/csvParser';
import { validateRouteConfig, FormErrors } from '../lib/formValidation';

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
];

// Remove AboutSection, ContactSection, and Navigation components

const JetBlueOptimizer = () => {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [useWebWorker, setUseWebWorker] = useState(false);
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
    startDate: '2025-08-15',
    startTime: '19:00',
    endDate: '2025-08-16',
    endTime: '23:59',
    startAirports: 'EWR,JFK,HPN,LGA',
    endAirports: 'EWR,JFK,HPN,LGA',
    visitedAirports: 'BED',
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
    // Load web worker preference from localStorage
    const savedPreference = localStorage.getItem('jetblue-use-webworker');
    if (savedPreference) {
      setUseWebWorker(JSON.parse(savedPreference));
    }
  }, []);

  // Load flight data on mount for web worker
  useEffect(() => {
    if (supportsWorkers) {
      fetch('/api/schedule')
        .then(response => response.text())
        .then(csvData => {
          const parsedFlights = parseCsvText(csvData);
          setFlights(parsedFlights);
        })
        .catch(error => {
          console.warn('Failed to load flights for web worker:', error);
        });
    }
  }, [supportsWorkers]);

  // Validate form when config changes
  useEffect(() => {
    const errors = validateRouteConfig(config);
    setFormErrors(errors);
  }, [config]);

  const handleOptimizeRoute = useCallback(async () => {
    // Validate form before submitting
    const errors = validateRouteConfig(config);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      alert('Please fix the form errors before optimizing.');
      return;
    }

    // Handle domestic-only logic
    let optimizationConfig = { ...config };
    if (config.domesticOnly) {
      // List of international airports to exclude
      const internationalAirports = [
        'AMS', 'CDG', 'LHR', 'LGW', 'DUB', 'EDI', 'MAD', 'LIR', 'SJD', 'SJO',
        'GUA', 'SAP', 'MDE', 'CTG', 'GEO', 'GYE', 'BZE', 'CUR', 'GND', 'ANU',
        'BGI', 'KIN', 'MBJ', 'POP', 'POS', 'SKB', 'BON', 'GCM', 'PLS', 'CUN'
      ];
      
      // Add international airports to visited airports (hidden from UI)
      const currentVisited = config.visitedAirports ? config.visitedAirports.split(',').map(a => a.trim()) : [];
      const allInternational = Array.from(new Set([...currentVisited, ...internationalAirports]));
      optimizationConfig.visitedAirports = allInternational.join(',');
      
      console.log('🌍 Domestic-only mode: Excluding international airports:', internationalAirports);
    }

    console.log('🚀 Starting optimization for config:', optimizationConfig);
    
    if (useWebWorker && supportsWorkers && flights.length > 0) {
      console.log('Using web worker optimization');
      try {
        const result = await workerOptimize(flights, optimizationConfig);
        // Manually update cache and UI state
        // We'll need to update the hook to handle worker results
        console.log('Worker result:', result);
      } catch (error) {
        console.error('Worker optimization failed:', error);
        // Fallback to regular optimization
        setCurrentConfig(optimizationConfig);
      }
    } else {
      // Use regular optimization
      setCurrentConfig(optimizationConfig);
    }
  }, [config, useWebWorker, supportsWorkers, flights, workerOptimize]);

  const handleDownload = useCallback(() => {
    console.log('Download completed');
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
    console.log('Loading saved config:', savedConfig);
    
    // Update the form with the saved configuration first
    setConfig(savedConfig);
    
    // Automatically show the map if it's not already visible
    if (!showMap) {
      setShowMap(true);
    }
    
    // Trigger optimization after a short delay to ensure config is updated
    setTimeout(() => {
      console.log('Auto-optimizing loaded route...');
      setCurrentConfig(savedConfig);
    }, 100);
    
    console.log('Config loaded and optimization triggered');
  }, [showMap]);

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
              Find the optimal flight path to visit the most new airports efficiently
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
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center px-4 py-2 text-sm rounded-full transition-colors min-h-[40px] ${
                  showMap 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Toggle Route Map"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
              <button
                onClick={() => setShowSavedConfigs(!showSavedConfigs)}
                className={`flex items-center px-4 py-2 text-sm rounded-full transition-colors min-h-[40px] ${
                  showSavedConfigs 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Saved Configurations"
              >
                <Save className="h-4 w-4 mr-2" />
                {showSavedConfigs ? 'Hide Saved' : 'Quick Save'}
              </button>
            </div>
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
        {showMap && results && 'path' in results && (
          <div className="mb-6">
            <ErrorBoundary>
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Visualization</h3>
                <RouteMapWithTiles flights={results.path} height="500px" />
              </div>
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
            <ErrorBoundary>
              <QuickSettingsForm
                config={config}
                onConfigChange={setConfig}
              />
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

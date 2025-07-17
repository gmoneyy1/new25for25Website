'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RouteForm } from '../components/forms/RouteForm';
import { QuickSettingsForm } from '../components/forms/QuickSettingsForm';
import { OptimizationSettingsForm } from '../components/forms/OptimizationSettingsForm';
import { ResultsPage } from '../components/results/ResultsPage';
import { RouteConfig, Results } from '../lib/types';
import { OptimizationConfig } from '../lib/optimizationConfig';
import { optimizeRoute } from '../lib/apiService';
import { validateRouteConfig, FormErrors } from '../lib/formValidation';

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
];

// Remove AboutSection, ContactSection, and Navigation components

const JetBlueOptimizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Results>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig | null>(null);
  const [config, setConfig] = useState<RouteConfig>({
    startDate: '2025-08-15',
    startTime: '19:00',
    endDate: '2025-08-16',
    endTime: '23:59',
    startAirports: 'EWR,JFK,HPN,LGA',
    endAirports: 'EWR,JFK,HPN,LGA',
    visitedAirports: 'BED',
    minConnectionTime: 60
  });

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

    setIsLoading(true);
    
    try {
      const result = await optimizeRoute(config);
      setResults(result);
    } catch (error) {
      console.error('Optimization error:', error);
      setResults({ error: 'An error occurred during optimization' });
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const handleDownload = useCallback(() => {
    console.log('Download completed');
  }, []);

  const handleOptimizeAgain = useCallback(() => {
    setResults(null);
    handleOptimizeRoute();
  }, [handleOptimizeRoute]);

  const handleOptimizationConfigChange = useCallback((newConfig: OptimizationConfig) => {
    setOptimizationConfig(newConfig);
    console.log('Optimization settings updated:', newConfig);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main App Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            JetBlue 25for25 Route Optimizer
          </h1>
          <p className="text-gray-600 text-lg">
            Find the optimal flight path to visit the most new airports
          </p>
        </div>
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-3 space-y-6">
            <RouteForm
              config={config}
              onConfigChange={setConfig}
              onOptimize={handleOptimizeRoute}
              isLoading={isLoading}
              hasData={true}
              errors={formErrors}
            />
            <QuickSettingsForm
              config={config}
              onConfigChange={setConfig}
            />
            <OptimizationSettingsForm
              onConfigChange={handleOptimizationConfigChange}
            />
          </div>
          {/* Results Panel */}
          <div className="lg:col-span-7">
            <ResultsPage
              results={results}
              onDownload={handleDownload}
              onOptimizeAgain={handleOptimizeAgain}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 George Z. All rights reserved.</p>
            <p className="mt-1">Optimize your flight routes to visit the most new airports efficiently.</p>
          </div>
        </div>
      </div>
     
      {/* Ensure background extends to bottom */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
    </div>

  );
};

export default JetBlueOptimizer;

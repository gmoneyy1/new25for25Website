'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RouteForm } from '../components/forms/RouteForm';
import { QuickSettingsForm } from '../components/forms/QuickSettingsForm';
import { ResultsPage } from '../components/results/ResultsPage';
import { RouteConfig, Results } from '../lib/types';
import { optimizeRoute } from '../lib/apiService';
import { validateRouteConfig, FormErrors } from '../lib/formValidation';

const JetBlueOptimizerModular = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Results>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [config, setConfig] = useState<RouteConfig>({
    startDate: '2025-06-20',
    startTime: '19:00',
    endDate: '2025-06-21',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
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
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <ResultsPage
              results={results}
              onDownload={handleDownload}
              onOptimizeAgain={handleOptimizeAgain}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JetBlueOptimizerModular; 
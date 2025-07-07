'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RouteForm } from '../components/forms/RouteForm';
import { QuickSettingsForm } from '../components/forms/QuickSettingsForm';
import { ResultsPage } from '../components/results/ResultsPage';
import { RouteConfig, Results } from '../lib/types';
import { optimizeRoute, getApiStatus } from '../lib/apiService';
import { validateRouteConfig, FormErrors } from '../lib/formValidation';

const JetBlueOptimizerModular = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<Results>(null);
  const [apiStatus, setApiStatus] = useState<{ allAvailable: boolean; schedule: any; optimize: any } | null>(null);
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

  // Check API availability on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await getApiStatus();
        setApiStatus(status);
        
        if (status.allAvailable) {
          console.log('All API endpoints are available');
        } else {
          console.warn('Some API endpoints are not available:', status);
        }
      } catch (error) {
        console.error('Error checking API status:', error);
        setApiStatus({
          allAvailable: false,
          schedule: { ok: false, status: 0 },
          optimize: { ok: false, status: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkApiStatus();
  }, []);

  // Validate form when config changes
  useEffect(() => {
    const errors = validateRouteConfig(config);
    setFormErrors(errors);
  }, [config]);

  const handleOptimizeRoute = useCallback(async () => {
    if (!apiStatus?.allAvailable) {
      alert('API endpoints are not available. Please check the server status.');
      return;
    }

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
  }, [config, apiStatus]);

  const handleDownload = useCallback(() => {
    console.log('Download completed');
  }, []);

  const handleOptimizeAgain = useCallback(() => {
    setResults(null);
    handleOptimizeRoute();
  }, [handleOptimizeRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking API availability...</p>
        </div>
      </div>
    );
  }

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
          
          {/* API Status Indicator */}
          <div className="mt-4 flex justify-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              apiStatus?.allAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                apiStatus?.allAvailable ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {apiStatus?.allAvailable ? 'API Available' : 'API Unavailable'}
            </div>
          </div>
        </div>

        {/* API Warning */}
        {!apiStatus?.allAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  API Endpoints Not Available
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Some API endpoints are not responding. Please check:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Schedule API: {apiStatus?.schedule.ok ? '✅' : '❌'} (Status: {apiStatus?.schedule.status})</li>
                    <li>Optimize API: {apiStatus?.optimize.ok ? '✅' : '❌'} (Status: {apiStatus?.optimize.status})</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <RouteForm
              config={config}
              onConfigChange={setConfig}
              onOptimize={handleOptimizeRoute}
              isLoading={isLoading}
              hasData={apiStatus?.allAvailable || false}
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
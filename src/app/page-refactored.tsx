'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RouteConfigPanel } from '../components/RouteConfig';
import { ResultsPanel } from '../components/ResultsPanel';
import { RouteConfig, Flight, Results } from '../lib/types';
import { fetchFlightSchedule } from '../lib/apiService';
import { loadCsvData, saveCsvData, clearCsvData } from '../lib/storageUtils';
import { parseCsvFile } from '../lib/csvUtils';
import { optimizeRoute } from '../lib/optimizationUtils';

const JetBlueOptimizer = () => {
  const [csvData, setCsvData] = useState<Flight[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<Results>(null);
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

  // Load CSV data automatically on component mount
  useEffect(() => {
    const loadData = async () => {
      // Try to load from cache first
      const savedData = loadCsvData();
      if (savedData) {
        setCsvData(savedData);
        setIsLoading(false);
        console.log('Loaded saved CSV data:', savedData.length, 'flights');
        return;
      }
      
      // If no cached data, fetch from API
      try {
        const data = await fetchFlightSchedule();
        setCsvData(data);
        saveCsvData(data);
        console.log('CSV loaded and saved:', data.length, 'flights');
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await parseCsvFile(file);
        setCsvData(data);
        saveCsvData(data);
        console.log('CSV loaded and saved:', data.length, 'flights');
      } catch (error) {
        console.error('Error parsing CSV file:', error);
        alert('Error parsing CSV file. Please check the file format.');
      }
    }
  }, []);

  const handleOptimizeRoute = useCallback(async () => {
    if (!csvData || csvData.length === 0) {
      alert('Please upload a valid CSV file first');
      return;
    }

    setIsLoading(true);
    
    // Simulate processing delay for better UX
    setTimeout(async () => {
      try {
        const result = await optimizeRoute(csvData, config);
        setResults(result);
      } catch (error) {
        console.error('Optimization error:', error);
        setResults({ error: 'An error occurred during optimization' });
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, [csvData, config]);

  const handleDownload = useCallback(() => {
    console.log('Download completed');
  }, []);

  const handleClearData = useCallback(() => {
    clearCsvData();
    setCsvData(null);
    setResults(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            JetBlue 25for25 Route Optimizer
          </h1>
          <p className="text-gray-600 text-lg">
            Find the optimal flight path to visit the most new airports
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <RouteConfigPanel
              config={config}
              onConfigChange={setConfig}
              onOptimize={handleOptimizeRoute}
              isLoading={isLoading}
              hasData={!!csvData}
            />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <ResultsPanel
              results={results}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JetBlueOptimizer; 
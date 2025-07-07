import React from 'react';
import { Plane, MapPin, Download, Share2, RefreshCw, BarChart3, Clock, Map, TrendingUp } from 'lucide-react';
import { Results, OptimizationResults } from '../../lib/types';
import { FlightCard } from '../FlightCard';
import { downloadFlightsAsCsv } from '../../lib/csvUtils';
import { minutesToHours } from '../../lib/dateUtils';

interface ResultsPageProps {
  results: Results;
  onDownload: () => void;
  onOptimizeAgain: () => void;
  isLoading?: boolean;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ 
  results, 
  onDownload, 
  onOptimizeAgain,
  isLoading = false 
}) => {
  const handleDownload = () => {
    if (results && 'path' in results) {
      downloadFlightsAsCsv(results.path);
      onDownload();
    }
  };

  const handleShare = () => {
    if (results && 'path' in results) {
      const shareText = `Found ${results.totalFlights} flights visiting ${results.newAirportsVisited.length} new airports! Total distance: ${results.totalDistance.toLocaleString()} miles.`;
      
      if (navigator.share) {
        navigator.share({
          title: 'JetBlue Route Optimization Results',
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Results copied to clipboard!');
      }
    }
  };

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Plane className="mr-2" size={20} />
          Optimization Results
        </h2>
        
        <div className="text-center py-12 text-gray-500">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p>Configure your route parameters and click "Optimize Route" to see results</p>
        </div>
      </div>
    );
  }

  if ('error' in results && results.error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Plane className="mr-2" size={20} />
          Optimization Results
        </h2>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p className="font-medium">Error:</p>
          <p>{results.error}</p>
        </div>
        
        <div className="mt-4">
          <button
            onClick={onOptimizeAgain}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className="mr-2" size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!('path' in results) || !results.path) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Plane className="mr-2" size={20} />
          Optimization Results
        </h2>
        
        <div className="text-center py-12 text-gray-500">
          <p>No valid route found within the constraints</p>
          <button
            onClick={onOptimizeAgain}
            disabled={isLoading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto"
          >
            <RefreshCw className="mr-2" size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const optimizationResults = results as OptimizationResults;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Plane className="mr-2" size={20} />
          Optimization Results
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={handleShare}
            className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm"
          >
            <Share2 className="mr-1" size={14} />
            Share
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center text-sm"
          >
            <Download className="mr-1" size={14} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Plane className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-blue-600">{optimizationResults.totalFlights}</p>
          <p className="text-sm text-gray-600">Total Flights</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <MapPin className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-600">{optimizationResults.newAirportsVisited.length}</p>
          <p className="text-sm text-gray-600">New Airports</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Map className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-purple-600">{optimizationResults.totalDistance.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Miles</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-orange-600">{minutesToHours(optimizationResults.totalDuration)}</p>
          <p className="text-sm text-gray-600">Hours</p>
        </div>
      </div>

      {/* New Airports Visited */}
      {optimizationResults.newAirportsVisited.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <TrendingUp className="mr-2" size={18} />
            New Airports Visited
          </h3>
          <div className="flex flex-wrap gap-2">
            {optimizationResults.newAirportsVisited.map((airport, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {airport}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <BarChart3 className="mr-2" size={18} />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Average Flight Duration</p>
            <p className="font-semibold">{Math.round(optimizationResults.totalDuration / optimizationResults.totalFlights)} min</p>
          </div>
          <div>
            <p className="text-gray-600">Average Distance</p>
            <p className="font-semibold">{Math.round(optimizationResults.totalDistance / optimizationResults.totalFlights)} mi</p>
          </div>
          <div>
            <p className="text-gray-600">New Airports per Flight</p>
            <p className="font-semibold">{(optimizationResults.newAirportsVisited.length / optimizationResults.totalFlights).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-gray-600">Optimization Iterations</p>
            <p className="font-semibold">{optimizationResults.iterations?.toLocaleString() || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Flight Itinerary */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Flight Itinerary</h3>
          <div className="text-sm text-gray-600">
            {optimizationResults.path.length} flights • {optimizationResults.totalDistance.toLocaleString()} miles
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {optimizationResults.path.map((flight, index) => (
            <FlightCard key={index} flight={flight} index={index} />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
        <button
          onClick={onOptimizeAgain}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <RefreshCw className="mr-2" size={16} />
          Optimize Again
        </button>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center"
        >
          <Download className="mr-2" size={16} />
          Download Results
        </button>
      </div>
    </div>
  );
}; 
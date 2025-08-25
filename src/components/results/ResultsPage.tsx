import React, { useState } from 'react';
import { Download, RefreshCw, ExternalLink, DollarSign, Clock, MapPin, Plane, TrendingUp, BarChart3, Share, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';
import { Results, FlightWithPricing, RoutePricingData, PricingComparison, Flight } from '../../lib/types';
import { useRoutePricing, usePricingComparison } from '../../hooks/usePricing';
import { formatPrice } from '../../lib/pricingService';
import { kilometersToMiles, calculateAirportDistance } from '../../lib/distanceUtils';
import { formatDateTime, minutesToHours } from '../../lib/dateUtils';
import { downloadFlightsAsCsv } from '../../lib/csvUtils';

interface ResultsPageProps {
  results: Results;
  onDownload: () => void;
  onOptimizeAgain: () => void;
  isLoading: boolean;
}

interface ResultsPagePropsExtended extends ResultsPageProps {
  isFromCache?: boolean;
}

export const ResultsPage: React.FC<ResultsPagePropsExtended> = ({
  results,
  onDownload,
  onOptimizeAgain,
  isLoading,
  isFromCache = false
}) => {
  const [expandedFlights, setExpandedFlights] = useState<{[key: string]: boolean}>({});
  const [activePricingComparisons, setActivePricingComparisons] = useState<{[key: string]: boolean}>({});

  // Use cached pricing queries
  const flightPath = results && 'path' in results ? results.path : null;
  const { data: pricingData, isLoading: isLoadingPricing } = useRoutePricing(flightPath);



  // Function to toggle flight expansion and activate pricing comparison
  const toggleFlightExpansion = (flight: Flight) => {
    const flightKey = `${flight['Flight Number']}-${flight.Origin}-${flight.Destination}`;
    const wasExpanded = expandedFlights[flightKey];
    
    setExpandedFlights(prev => ({
      ...prev,
      [flightKey]: !prev[flightKey]
    }));
    
    // Activate pricing comparison query when expanding
    if (!wasExpanded) {
      setActivePricingComparisons(prev => ({
        ...prev,
        [flightKey]: true
      }));
    }
  };

  // Component for individual flight pricing comparison
  const FlightPricingComparison: React.FC<{ flight: Flight; isExpanded: boolean }> = ({ flight, isExpanded }) => {
    const flightKey = `${flight['Flight Number']}-${flight.Origin}-${flight.Destination}`;
    const shouldFetch = activePricingComparisons[flightKey] && isExpanded;
    
    const { data: comparison, isLoading: isLoadingComparison } = usePricingComparison(
      flight,
      shouldFetch
    );

    if (!isExpanded) return null;

    return (
      <div className="border-t border-gray-200 p-3 bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Price Comparison</h4>
        {isLoadingComparison ? (
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading pricing options...
          </div>
        ) : comparison ? (
          <div className="space-y-2">
            {comparison.options.map((option, optIndex: number) => (
              <div key={optIndex} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{option.airline}</span>
                  <span className="text-gray-500">({option.cabinClass})</span>
                  {optIndex === 0 && (
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                      Best Price
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{formatPrice(option.price, option.currency)}</span>
                  <a
                    href={option.bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
              Average price: {formatPrice(comparison.averagePrice, 'USD')}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No pricing data available
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mr-3" />
          <span className="text-lg text-gray-600">Optimizing route...</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
          <p className="text-gray-600">
            Configure your route parameters and click &quot;Optimize Route&quot; to find the best flight path.
          </p>
        </div>
      </div>
    );
  }

  if ('error' in results) {
    // Split error message by newlines to handle multi-line errors
    const errorLines = results.error.split('\n');
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-4 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            No Solution Found
          </div>
          
          <div className="text-gray-600 mb-6 max-w-md mx-auto">
            {errorLines.map((line, index) => (
              <p key={index} className={`mb-2 ${line.startsWith('•') ? 'text-left pl-4' : 'text-center'}`}>
                {line}
              </p>
            ))}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onOptimizeAgain}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors mr-3"
            >
              Try Again
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
            >
              Adjust Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { path, totalFlights, newAirportsVisited, totalDistance, totalDuration, iterations, totalPrice } = results;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div className="flex items-center mb-3 sm:mb-0">
          <Plane className="h-6 w-6 text-blue-500 mr-2" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Optimization Results</h2>
            {/* Cache indicator hidden from UI but functionality preserved */}
            {false && isFromCache && (
              <div className="flex items-center text-sm text-green-600 mt-1">
                <Zap className="h-4 w-4 mr-1" />
                Loaded from cache
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-md min-h-[40px]">
            <Share className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Share</span>
          </button>
          <button 
            onClick={() => {
              downloadFlightsAsCsv(path);
              onDownload();
            }}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-md min-h-[40px]"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards - Mobile Optimized Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-2 ${totalPrice && totalPrice > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 sm:gap-4 mb-4 sm:mb-6`}>
        <div className="bg-blue-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <Plane className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mr-2 md:mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{totalFlights}</p>
              <p className="text-xs md:text-sm text-gray-600">Total Flights</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-2 md:mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{newAirportsVisited.length}</p>
              <p className="text-xs md:text-sm text-gray-600">New Airports</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 md:h-8 md:w-8 text-purple-500 mr-2 md:mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{totalDistance.toFixed(0)}</p>
              <p className="text-xs md:text-sm text-gray-600">Total Miles</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mr-2 md:mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{minutesToHours(totalDuration)}</p>
              <p className="text-xs md:text-sm text-gray-600">Hours</p>
            </div>
          </div>
        </div>

        {/* Total Price Card - Only show for September data */}
        {totalPrice && totalPrice > 0 && (
          <div className="bg-yellow-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mr-2 md:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-gray-900">${totalPrice}</p>
                <p className="text-xs md:text-sm text-gray-600">Total Price</p>
              </div>
            </div>
          </div>
        )}

        {/* Temporarily hidden - pricing feature in development
        <div className="bg-yellow-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mr-2 md:mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {pricingData ? formatPrice(pricingData.totalCost) : 'Loading...'}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Cost</p>
            </div>
          </div>
        </div>
        */}
      </div>

      {/* New Airports Visited */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
          New Airports Visited
        </h3>
        <div className="flex flex-wrap gap-2">
          {newAirportsVisited.map((airport, index) => (
            <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {airport}
            </span>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Flight Duration</p>
            <p className="text-lg font-semibold text-gray-900">{Math.round(totalDuration / totalFlights)} min</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Distance</p>
            <p className="text-lg font-semibold text-gray-900">{Math.round(totalDistance / totalFlights)} mi</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">New Airports per Flight</p>
            <p className="text-lg font-semibold text-gray-900">{(newAirportsVisited.length / totalFlights).toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Optimization Iterations</p>
            <p className="text-lg font-semibold text-gray-900">{iterations.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Dataset Information */}
      {results.datasetUsed && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Dataset Information</h3>
          </div>
          <div className="mt-2 text-sm text-blue-800">
            <p>
              <strong>Dataset:</strong> {results.datasetUsed === 'september' ? 'September 1-15, 2025' : 'August 1 - December 31, 2025'}
            </p>
            <p>
              <strong>Pricing:</strong> {results.hasPricing ? 'Available with booking links' : 'Not available for this date range'}
            </p>
            {results.datasetUsed === 'september' && (
              <p className="text-xs text-blue-600 mt-1">
                💡 September data includes real-time pricing and direct booking links to JetBlue
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flight Itinerary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Flight Itinerary</h3>
        <p className="text-sm text-gray-600 mb-4">{totalFlights} flights • {totalDistance.toFixed(0)} miles</p>
        
        <div className="space-y-3">
          {path.map((flight, index) => {
            const flightKey = `${flight['Flight Number']}-${flight.Origin}-${flight.Destination}`;
            const isExpanded = expandedFlights[flightKey];

            return (
              <div key={index} className="bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 gap-3 sm:gap-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{flight['Flight Number']}</span>
                      <span className="text-sm text-gray-500">223</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="font-medium">{flight.Origin}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {formatDateTime(new Date(flight['Departure Datetime']))}
                        </span>
                      </div>
                      <span className="text-gray-400 hidden sm:inline">→</span>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="font-medium">{flight.Destination}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {formatDateTime(new Date(flight['Arrival Datetime']))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {(() => {
                        // For August data, try to access the distance field
                        if (!results.hasPricing) {
                          // This is August data - should have Distance (MI)
                          const distanceMI = flight['Distance (MI)'];
                          if (distanceMI && typeof distanceMI === 'number' && distanceMI > 0) {
                            return `${Math.round(distanceMI)}mi`;
                          }
                          // Fallback: try to access with different property names
                          const altDistance = (flight as any)['Distance (MI)'] || (flight as any).Distance || (flight as any).distance;
                          if (altDistance && altDistance > 0) {
                            return `${Math.round(altDistance)}mi`;
                          }
                          return `Distance N/A`;
                        } else {
                          // September data - calculate distance from coordinates
                          const distance = calculateAirportDistance(flight.Origin, flight.Destination);
                          return distance > 0 ? `${distance}mi` : 'Distance N/A';
                        }
                      })()} | {flight['Elapsed Minutes']}min
                    </span>
                    
                    {/* Show pricing and booking link for September data */}
                    {results.hasPricing && flight.Price && (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">
                          {flight.Price}
                        </span>
                        {flight.SearchURL && (
                          <a
                            href={flight.SearchURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5 mr-1" />
                            Book Flight
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Show pricing unavailable for August data */}
                    {!results.hasPricing && (
                      <span className="text-sm text-gray-400">Price unavailable</span>
                    )}
                  </div>
                </div>
                
                {/* Pricing Comparison Section - Temporarily hidden */}
                {false && <FlightPricingComparison flight={flight} isExpanded={isExpanded} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <button
          onClick={onOptimizeAgain}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-md transition-colors flex items-center justify-center text-sm md:text-base"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Optimize Again
        </button>
        <button
          onClick={() => {
            downloadFlightsAsCsv(path);
            onDownload();
          }}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-md transition-colors flex items-center justify-center text-sm md:text-base"
        >
          <Download className="h-5 w-5 mr-2" />
          Download Results
        </button>
      </div>
    </div>
  );
}; 
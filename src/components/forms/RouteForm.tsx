import React from 'react';
import { Calendar, Search, AlertCircle } from 'lucide-react';
import { RouteConfig } from '../../lib/types';
import { FormErrors } from '../../lib/formValidation';

interface RouteFormProps {
  config: RouteConfig;
  onConfigChange: (config: RouteConfig) => void;
  onOptimize: () => void;
  isLoading: boolean;
  hasData: boolean;
  errors?: FormErrors;
}

export const RouteForm: React.FC<RouteFormProps> = ({
  config,
  onConfigChange,
  onOptimize,
  isLoading,
  hasData,
  errors = {}
}) => {
  const handleInputChange = (field: keyof RouteConfig, value: string | number | boolean) => {
    onConfigChange({ ...config, [field]: value });
  };

  const validateForm = (): boolean => {
    return !Object.values(errors).some(error => error && error.length > 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
        <Calendar className="mr-2" size={20} />
        Route Configuration
      </h2>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Date and Time Configuration */}
        <div className="bg-gray-50 rounded-md p-3 sm:p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4">Time Window</h3>
          
          {/* Date Range Info */}
          <div className="mb-3 sm:mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Available Date Range:</strong> August 1, 2025 - December 31, 2025
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Flight data is available for this period. Please select dates within this range.
            </p>
          </div>
          
          {/* Mobile-optimized date/time inputs */}
          <div className="space-y-4 sm:space-y-6">
            {/* Start Date/Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.startDate}
                  min="2025-08-01"
                  max="2025-12-31"
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={config.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.startTime}
                  </p>
                )}
              </div>
            </div>

            {/* End Date/Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.endDate}
                  min="2025-08-01"
                  max="2025-12-31"
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.endDate}
                  </p>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Airport Configuration */}
        <div className="bg-gray-50 rounded-md p-3 sm:p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4">Airport Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Airports (comma-separated)
              </label>
              <input
                type="text"
                value={config.startAirports}
                onChange={(e) => handleInputChange('startAirports', e.target.value)}
                placeholder="e.g., EWR, JFK, HPN, LGA"
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                  errors.startAirports ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startAirports && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.startAirports}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Airports (comma-separated)
              </label>
              <input
                type="text"
                value={config.endAirports}
                onChange={(e) => handleInputChange('endAirports', e.target.value)}
                placeholder="e.g., EWR, JFK, HPN, LGA"
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                  errors.endAirports ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endAirports && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.endAirports}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Already Visited Airports
              </label>
              <input
                type="text"
                value={config.visitedAirports}
                onChange={(e) => handleInputChange('visitedAirports', e.target.value)}
                placeholder="e.g., BED, BOS, LAX"
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                  errors.visitedAirports ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.visitedAirports && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.visitedAirports}
                </p>
              )}
            </div>

            {/* Domestic Routes Toggle */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Domestic Routes Only
                </label>
                <p className="text-xs text-blue-600 mb-2">
                  When enabled, only US domestic flights will be considered for optimization
                </p>
                {config.domesticOnly && (
                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                    <strong>How it works:</strong> International airports (CUN, AMS, LHR, etc.) are automatically added to your "Already Visited" list, so they won't be considered as new destinations. This makes the 25for25 challenge much more manageable!
                  </div>
                )}
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('domesticOnly', !config.domesticOnly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    config.domesticOnly ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.domesticOnly ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-gray-50 rounded-md p-3 sm:p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4">Connection Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Connection Time (minutes)
            </label>
            <input
              type="number"
              min="30"
              max="480"
              value={config.minConnectionTime}
              onChange={(e) => handleInputChange('minConnectionTime', parseInt(e.target.value) || 60)}
              className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                errors.minConnectionTime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.minConnectionTime && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.minConnectionTime}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 60-120 minutes for domestic flights
            </p>
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={onOptimize}
          disabled={!hasData || isLoading || !validateForm()}
          className="w-full bg-blue-600 text-white py-4 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors text-base sm:text-sm min-h-[48px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              <span className="hidden sm:inline">Optimizing Route...</span>
              <span className="sm:hidden">Optimizing...</span>
            </>
          ) : (
            <>
              <Search className="mr-2" size={18} />
              <span className="hidden sm:inline">Optimize Route</span>
              <span className="sm:hidden">Optimize</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}; 
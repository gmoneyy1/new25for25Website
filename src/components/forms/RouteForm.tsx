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
  const handleInputChange = (field: keyof RouteConfig, value: string | number) => {
    onConfigChange({ ...config, [field]: value });
  };

  const validateForm = (): boolean => {
    return !Object.values(errors).some(error => error.length > 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Calendar className="mr-2" size={20} />
        Route Configuration
      </h2>
      
      <div className="space-y-4">
        {/* Date and Time Configuration */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Time Window</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={config.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={config.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

        {/* Airport Configuration */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Airport Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Airports (comma-separated)
            </label>
            <input
              type="text"
              value={config.startAirports}
              onChange={(e) => handleInputChange('startAirports', e.target.value)}
              placeholder="e.g., EWR, JFK, HPN, LGA"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Airports (comma-separated)
            </label>
            <input
              type="text"
              value={config.endAirports}
              onChange={(e) => handleInputChange('endAirports', e.target.value)}
              placeholder="e.g., EWR, JFK, HPN, LGA"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Already Visited Airports
            </label>
            <input
              type="text"
              value={config.visitedAirports}
              onChange={(e) => handleInputChange('visitedAirports', e.target.value)}
              placeholder="e.g., BED, BOS, LAX"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
        </div>

        {/* Connection Settings */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Connection Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Connection Time (minutes)
            </label>
            <input
              type="number"
              min="30"
              max="480"
              value={config.minConnectionTime}
              onChange={(e) => handleInputChange('minConnectionTime', parseInt(e.target.value) || 60)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.minConnectionTime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.minConnectionTime && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.minConnectionTime}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 60-120 minutes for domestic flights
            </p>
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={onOptimize}
          disabled={!hasData || isLoading || !validateForm()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Optimizing Route...
            </>
          ) : (
            <>
              <Search className="mr-2" size={16} />
              Optimize Route
            </>
          )}
        </button>
      </div>
    </div>
  );
}; 
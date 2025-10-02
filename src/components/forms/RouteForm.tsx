import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Search, AlertCircle, ChevronDown, MapPin } from 'lucide-react';
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
  const [showStartAirportDropdown, setShowStartAirportDropdown] = useState(false);
  const [showEndAirportDropdown, setShowEndAirportDropdown] = useState(false);
  const [hasAttemptedValidation, setHasAttemptedValidation] = useState(false);
  const startDropdownRef = useRef<HTMLDivElement>(null);
  const endDropdownRef = useRef<HTMLDivElement>(null);

  const airportPresets = {
    nyc: {
      name: 'NYC Area',
      airports: 'EWR,JFK,HPN,LGA'
    },
    boston: {
      name: 'Boston Area',
      airports: 'BOS,MHT,PVD'
    },
    la: {
      name: 'LA Area',
      airports: 'LAX,BUR,ONT,SNA'
    },
    florida: {
      name: 'Florida',
      airports: 'MIA,FLL,TPA,MCO,JAX'
    }
  };

  // Function to convert airport codes to uppercase
  const convertAirportCodesToUppercase = (airportString: string): string => {
    return airportString
      .split(',')
      .map(code => code.trim().toUpperCase())
      .join(',');
  };

  const handleInputChange = (field: keyof RouteConfig, value: string | number | boolean) => {
    // Convert airport codes to uppercase for start and end airports
    if (field === 'startAirports' || field === 'endAirports' || field === 'visitedAirports') {
      if (typeof value === 'string') {
        value = convertAirportCodesToUppercase(value);
      }
    }
    onConfigChange({ ...config, [field]: value });
  };

  const handleAirportPresetClick = (presetKey: keyof typeof airportPresets, isStartAirport: boolean) => {
    const airports = airportPresets[presetKey].airports;
    if (isStartAirport) {
      onConfigChange({ ...config, startAirports: airports });
      setShowStartAirportDropdown(false);
    } else {
      onConfigChange({ ...config, endAirports: airports });
      setShowEndAirportDropdown(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startDropdownRef.current && !startDropdownRef.current.contains(event.target as Node)) {
        setShowStartAirportDropdown(false);
      }
      if (endDropdownRef.current && !endDropdownRef.current.contains(event.target as Node)) {
        setShowEndAirportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset validation attempt state when form becomes valid
  const validateForm = useCallback((): boolean => {
    const hasErrors = Object.values(errors).some(error => error && error.length > 0);
    console.log('🔍 validateForm called, errors:', errors);
    console.log('🔍 hasErrors:', hasErrors);
    console.log('🔍 Object.values(errors):', Object.values(errors));
    return !hasErrors;
  }, [errors]);

  useEffect(() => {
    if (hasAttemptedValidation && validateForm()) {
      setHasAttemptedValidation(false);
    }
  }, [hasAttemptedValidation, errors, validateForm]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
        <Calendar className="mr-2" size={20} />
        Route Configuration
      </h2>
      
      {hasAttemptedValidation && Object.keys(errors).some(key => errors[key]) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <span className="text-red-500 font-medium">*</span> Required fields must be filled before optimization can run.
          </p>
        </div>
      )}
      
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
              Pricing data available for September.
            </p>
          </div>
          
          {/* Mobile-optimized date/time inputs */}
          <div className="space-y-4 sm:space-y-6">
            {/* Start Date/Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
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
                  Start Time <span className="text-red-500">*</span>
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
                  End Date <span className="text-red-500">*</span>
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
                  End Time <span className="text-red-500">*</span>
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
                Start Airports (comma-separated) <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={startDropdownRef}>
                <input
                  type="text"
                  value={config.startAirports}
                  onChange={(e) => handleInputChange('startAirports', e.target.value)}
                  placeholder="e.g., EWR, JFK, HPN, LGA"
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                    errors.startAirports ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowStartAirportDropdown(!showStartAirportDropdown)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                {/* Airport Presets Dropdown */}
                {showStartAirportDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    <div className="p-2">
                      <div className="flex items-center mb-2 text-xs font-medium text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        Airport Presets
                      </div>
                      {Object.entries(airportPresets).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => handleAirportPresetClick(key as keyof typeof airportPresets, true)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                        >
                          <div className="font-medium text-gray-900">{preset.name}</div>
                          <div className="text-xs text-gray-600">{preset.airports}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {errors.startAirports ? (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.startAirports}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Enter 3-letter airport codes separated by commas
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Airports (comma-separated) <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={endDropdownRef}>
                <input
                  type="text"
                  value={config.endAirports}
                  onChange={(e) => handleInputChange('endAirports', e.target.value)}
                  placeholder="e.g., EWR, JFK, HPN, LGA"
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${
                    errors.endAirports ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowEndAirportDropdown(!showEndAirportDropdown)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                {/* Airport Presets Dropdown */}
                {showEndAirportDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    <div className="p-2">
                      <div className="flex items-center mb-2 text-xs font-medium text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        Airport Presets
                      </div>
                      {Object.entries(airportPresets).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => handleAirportPresetClick(key as keyof typeof airportPresets, false)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                        >
                          <div className="font-medium text-gray-900">{preset.name}</div>
                          <div className="text-xs text-gray-600">{preset.airports}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {errors.endAirports ? (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.endAirports}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Enter 3-letter airport codes separated by commas
                </p>
              )}
              
              {/* Helpful message for large airport sets */}
              {config.endAirports && config.endAirports.split(',').length > 30 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-800">
                    <strong>Auto-optimized:</strong> You&apos;ve entered {config.endAirports.split(',').length} end airports. 
                    The system will automatically use optimized settings for large airport sets to find better routes.
                  </p>
                </div>
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
                placeholder="e.g., JFK, BOS, LAX"
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
              <p className="text-xs text-gray-500 mt-2">
                Optional: Leave empty if you haven&apos;t visited any airports yet
              </p>
            </div>

            {/* Domestic Routes Toggle */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Domestic Routes Only
                </label>
                <p className="text-xs text-blue-600">
                  When enabled, only US domestic flights will be considered for optimization
                </p>
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
              min="1"
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
              Recommended: 60-120 minutes for domestic flights, but you can set lower values if needed
            </p>
          </div>
        </div>

        {/* Form Validation Summary */}
        {Object.keys(errors).some(key => errors[key]) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
              <AlertCircle size={16} className="mr-2" />
              Please fix the following errors:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([field, error]) => 
                error ? (
                  <li key={field} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}: {error}</span>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}

        {/* Optimize Button */}
        <button
          onClick={() => {
            console.log('🔘 Optimize button clicked!');
            console.log('📋 Current config:', config);
            console.log('✅ Form valid:', validateForm());
            console.log('📊 Has data:', hasData);
            console.log('⏳ Is loading:', isLoading);
            
            // Set validation attempt state when user tries to optimize
            setHasAttemptedValidation(true);
            
            onOptimize();
          }}
          disabled={!hasData || isLoading || !validateForm()}
          className="w-full bg-blue-600 text-white py-4 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors text-base sm:text-sm min-h-[48px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              <span className="hidden sm:inline">Optimizing Route...</span>
              <span className="sm:hidden">Optimizing...</span>
            </>
          ) : !validateForm() ? (
            <>
              <AlertCircle className="mr-2" size={18} />
              <span className="hidden sm:inline">Fix Errors to Continue</span>
              <span className="sm:hidden">Fix Errors</span>
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
import React from 'react';
import { Settings, Clock, MapPin, Zap } from 'lucide-react';
import { RouteConfig } from '../../lib/types';

interface QuickSettingsFormProps {
  config: RouteConfig;
  onConfigChange: (config: RouteConfig) => void;
}

export const QuickSettingsForm: React.FC<QuickSettingsFormProps> = ({
  config,
  onConfigChange
}) => {
  const presets = {
    weekend: {
      name: 'Weekend Trip',
      description: 'Friday evening to Sunday night',
      config: {
        ...config,
        startDate: '2025-08-15',
        startTime: '18:00',
        endDate: '2025-08-17',
        endTime: '23:59',
        minConnectionTime: 60
      }
    },
    dayTrip: {
      name: 'Day Trip',
      description: 'Early morning to late evening',
      config: {
        ...config,
        startDate: '2025-08-16',
        startTime: '06:00',
        endDate: '2025-08-16',
        endTime: '23:59',
        minConnectionTime: 45
      }
    },
    weekTrip: {
      name: 'Week Trip',
      description: 'Monday to Friday',
      config: {
        ...config,
        startDate: '2025-08-18',
        startTime: '06:00',
        endDate: '2025-08-22',
        endTime: '23:59',
        minConnectionTime: 90
      }
    },
    augustTrip: {
      name: 'August Trip',
      description: 'August vacation',
      config: {
        ...config,
        startDate: '2025-08-01',
        startTime: '08:00',
        endDate: '2025-08-31',
        endTime: '23:59',
        minConnectionTime: 120
      }
    },
    fallTrip: {
      name: 'Fall Trip',
      description: 'September-October getaway',
      config: {
        ...config,
        startDate: '2025-09-15',
        startTime: '08:00',
        endDate: '2025-10-15',
        endTime: '23:59',
        minConnectionTime: 120
      }
    },
    holidayTrip: {
      name: 'Holiday Trip',
      description: 'December holiday season',
      config: {
        ...config,
        startDate: '2025-12-20',
        startTime: '08:00',
        endDate: '2025-12-31',
        endTime: '23:59',
        minConnectionTime: 120
      }
    }
  };

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

  const handlePresetClick = (presetKey: keyof typeof presets) => {
    onConfigChange(presets[presetKey].config);
  };

  const handleAirportPresetClick = (presetKey: keyof typeof airportPresets) => {
    const airports = airportPresets[presetKey].airports;
    onConfigChange({
      ...config,
      startAirports: airports,
      endAirports: airports
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
        <Settings className="mr-2" size={20} />
        Quick Settings
      </h2>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Time Presets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="mr-2" size={16} />
            Time Presets
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetClick(key as keyof typeof presets)}
                className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors min-h-[60px] active:bg-gray-100"
              >
                <div className="font-medium text-gray-900 text-sm sm:text-base">{preset.name}</div>
                <div className="text-xs sm:text-sm text-gray-600">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Airport Presets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <MapPin className="mr-2" size={16} />
            Airport Presets
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(airportPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleAirportPresetClick(key as keyof typeof airportPresets)}
                className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors min-h-[60px] active:bg-gray-100"
              >
                <div className="font-medium text-gray-900 text-sm sm:text-base">{preset.name}</div>
                <div className="text-xs text-gray-600 break-all mt-1">{preset.airports}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Zap className="mr-2" size={16} />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onConfigChange({ ...config, minConnectionTime: 60 })}
              className="text-center p-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors border border-gray-200 min-h-[48px]"
            >
              60min
            </button>
            <button
              onClick={() => onConfigChange({ ...config, minConnectionTime: 90 })}
              className="text-center p-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors border border-gray-200 min-h-[48px]"
            >
              90min
            </button>
            <button
              onClick={() => onConfigChange({ ...config, minConnectionTime: 120 })}
              className="text-center p-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors border border-gray-200 min-h-[48px]"
            >
              120min
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 
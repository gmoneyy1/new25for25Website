import React from 'react';
import { Settings, Clock, Zap, AlertTriangle, MapPin } from 'lucide-react';
import { getOptimizationConfig, updateActiveConfig, OptimizationConfig } from '../../lib/optimizationConfig';

interface OptimizationSettingsFormProps {
  onConfigChange?: (config: OptimizationConfig) => void;
}

export const OptimizationSettingsForm: React.FC<OptimizationSettingsFormProps> = ({
  onConfigChange
}) => {
  const optimizationLevels = [
    {
      key: 'conservative',
      name: 'Conservative',
      description: 'Faster optimization, less thorough search',
      icon: Clock,
      config: getOptimizationConfig('conservative')
    },
    {
      key: 'moderate',
      name: 'Moderate',
      description: 'Balanced performance and thoroughness (Recommended)',
      icon: Settings,
      config: getOptimizationConfig('moderate')
    },
    {
      key: 'aggressive',
      name: 'Aggressive',
      description: 'More thorough search, slower performance',
      icon: Zap,
      config: getOptimizationConfig('aggressive')
    },
    {
      key: 'very-aggressive',
      name: 'Very Aggressive',
      description: 'Most thorough search, slowest performance',
      icon: AlertTriangle,
      config: getOptimizationConfig('very-aggressive')
    },
    {
      key: 'large-airport',
      name: 'Large Airport Sets',
      description: 'Automatically applied when 30+ end airports detected',
      icon: MapPin,
      config: getOptimizationConfig('large-airport')
    }
  ];

  const handleLevelChange = (levelKey: string) => {
    const config = getOptimizationConfig(levelKey);
    updateActiveConfig(config);
    onConfigChange?.(config);
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
        <Settings className="mr-2" size={20} />
        Optimization Settings
      </h2>
      
      <div className="mb-3 sm:mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Algorithm Performance:</strong> Choose how thoroughly the algorithm searches for optimal routes.
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Higher settings may find better routes but take longer to complete.
        </p>
      </div>
      
      <div className="space-y-3">
        {optimizationLevels.map((level) => {
          const IconComponent = level.icon;
          return (
            <button
              key={level.key}
              onClick={() => handleLevelChange(level.key)}
              className="w-full text-left p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <IconComponent className="mr-3" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">{level.name}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>Max: {level.config.maxIterations.toLocaleString()} iterations</div>
                  <div>Heap: {level.config.maxHeapSize.toLocaleString()} states</div>
                  <div>Timeout: {formatTime(level.config.timeoutMs)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> These settings affect both client-side and server-side optimization. 
          Changes take effect immediately for new optimizations.
        </p>
      </div>
      
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
        <p className="text-xs text-green-800">
          <strong>Auto-optimization:</strong> When you input 30+ end airports, the system automatically 
          switches to the "Large Airport Sets" configuration for better performance.
        </p>
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { Trash2, Database, RefreshCw, Clock, Zap, BarChart3 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheUtils } from '../lib/queryClient';
import { CacheStats } from '../lib/types';

interface CacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();

  // Load cache stats
  const loadStats = () => {
    const cacheStats = cacheUtils.getCacheStats();
    setStats(cacheStats);
  };

  // Clear specific cache types
  const handleClearOptimization = async () => {
    setIsClearing(true);
    try {
      cacheUtils.clearOptimizationCache();
      loadStats();
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearPricing = async () => {
    setIsClearing(true);
    try {
      cacheUtils.clearPricingCache();
      loadStats();
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      cacheUtils.clearAllCache();
      loadStats();
    } finally {
      setIsClearing(false);
    }
  };

  // Format cache size
  const formatCacheSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Cache Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Load Stats Button */}
          <button
            onClick={loadStats}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Cache Statistics
          </button>

          {/* Cache Statistics */}
          {stats && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Cache Statistics
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Total Queries:</span>
                    <span className="font-medium ml-2">{stats.totalQueries}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache Size:</span>
                    <span className="font-medium ml-2">{formatCacheSize(stats.cacheSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Optimization:</span>
                    <span className="font-medium ml-2">{stats.optimizationQueries}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pricing:</span>
                    <span className="font-medium ml-2">{stats.pricingQueries}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {stats.lastUpdated.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Cache Benefits */}
              <div className="bg-green-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-green-800 mb-1 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Cache Benefits
                </h3>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Instant results for identical route configurations</li>
                  <li>• Reduced server load and faster response times</li>
                  <li>• Offline-capable pricing comparisons</li>
                  <li>• Bandwidth savings on repeated requests</li>
                </ul>
              </div>
            </div>
          )}

          {/* Clear Cache Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Clear Cache</h3>
            
            <button
              onClick={handleClearOptimization}
              disabled={isClearing}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Optimization Cache
            </button>

            <button
              onClick={handleClearPricing}
              disabled={isClearing}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Pricing Cache
            </button>

            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </button>
          </div>

          {/* Cache Explanation */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">How Caching Works</h3>
            <p className="text-xs text-blue-700">
              Route optimizations are cached for 5 minutes, pricing data for 15 minutes. 
              Identical route configurations will load instantly from cache, avoiding re-computation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
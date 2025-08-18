'use client';

import React, { useState, useEffect } from 'react';
import { Database, Zap, BarChart3, Trash2, Settings } from 'lucide-react';
import { CacheManager } from '../../components/CacheManager';
import { useWorkerOptimization } from '../../hooks/useWorkerOptimization';
import { getOptimizationConfig, updateActiveConfig, OptimizationConfig } from '../../lib/optimizationConfig';

export default function SettingsPage() {
  const [showCacheManager, setShowCacheManager] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentOptLevel, setCurrentOptLevel] = useState('moderate');
  
  const {
    isOptimizing: isWorkerOptimizing,
    progress: workerProgress,
    supportsWorkers
  } = useWorkerOptimization();

  // SSR-friendly state
  useEffect(() => {
    setIsClient(true);
    // Load optimization level preference
    const savedOptLevel = localStorage.getItem('jetblue-optimization-level');
    if (savedOptLevel) {
      setCurrentOptLevel(savedOptLevel);
    }
  }, []);


  useEffect(() => {
    if (isClient) {
      localStorage.setItem('jetblue-optimization-level', currentOptLevel);
    }
  }, [currentOptLevel, isClient]);

  const handleOptimizationLevelChange = (level: string) => {
    setCurrentOptLevel(level);
    const config = getOptimizationConfig(level);
    updateActiveConfig(config);
  };

  const clearAllLocalStorage = () => {
    if (confirm('Are you sure you want to clear all app data? This will remove saved configurations and preferences.')) {
      localStorage.clear();
      alert('All app data cleared successfully!');
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Settings
            </h1>
            <p className="text-gray-600 text-base md:text-lg px-4 max-w-2xl">
              Manage performance settings and cache data
            </p>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Performance Settings */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <Zap className="mr-3 h-6 w-6 text-yellow-500" />
              Performance Settings
            </h2>
            
            <div className="space-y-4">

              {/* Web Worker Progress */}
              {isClient && supportsWorkers && isWorkerOptimizing && workerProgress && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Optimization Progress</span>
                    <span className="text-sm text-blue-600">
                      {Math.round((workerProgress.iterations / workerProgress.maxIterations) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((workerProgress.iterations / workerProgress.maxIterations) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    Iterations: {workerProgress.iterations.toLocaleString()} / {workerProgress.maxIterations.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Browser Support Info */}
              {isClient && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Background Processing</h3>
                  <div className="flex items-center text-sm">
                    <div className={`w-3 h-3 rounded-full mr-2 ${supportsWorkers ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <span>
                      {supportsWorkers 
                        ? 'Enabled - Optimization runs in background without freezing UI' 
                        : 'Unavailable - Optimization will use main thread'}
                    </span>
                  </div>
                  {!supportsWorkers && (
                    <p className="text-xs text-orange-600 mt-2">
                      Your browser doesn&apos;t support Web Workers. The UI may freeze briefly during optimization.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Algorithm Settings */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <Settings className="mr-3 h-6 w-6 text-purple-500" />
              Algorithm Settings
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Optimization Level:</strong> Controls how thoroughly the algorithm searches for routes.
                </p>
                <p className="text-xs text-blue-600">
                  Higher levels find better routes but take longer to compute.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'conservative', name: 'Fast', desc: 'Quick results', time: '15s' },
                  { key: 'moderate', name: 'Balanced', desc: 'Recommended', time: '30s' },
                  { key: 'aggressive', name: 'Thorough', desc: 'Better routes', time: '60s' },
                  { key: 'very-aggressive', name: 'Maximum', desc: 'Best possible', time: '120s' }
                ].map((level) => (
                  <button
                    key={level.key}
                    onClick={() => handleOptimizationLevelChange(level.key)}
                    className={`p-3 border rounded-md text-left transition-colors ${
                      currentOptLevel === level.key 
                        ? 'border-blue-500 bg-blue-50 text-blue-800' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{level.name}</div>
                    <div className="text-sm text-gray-600">{level.desc}</div>
                    <div className="text-xs text-gray-500">~{level.time} max</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cache Management */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <Database className="mr-3 h-6 w-6 text-blue-500" />
              Cache Management
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Optimization Cache</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Route optimizations are cached for 5 minutes to speed up identical requests.
                </p>
                <button
                  onClick={() => setShowCacheManager(true)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Cache Details
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Local Storage</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Saved configurations, preferences, and app settings stored locally.
                </p>
                <button
                  onClick={clearAllLocalStorage}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Navigation Links */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Route Optimizer
          </a>
        </div>
      </div>

      {/* Cache Manager Modal */}
      <CacheManager 
        isOpen={showCacheManager} 
        onClose={() => setShowCacheManager(false)} 
      />
    </div>
  );
} 
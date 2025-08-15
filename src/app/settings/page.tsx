'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Database, Zap, Monitor, BarChart3, Trash2, RefreshCw, Cog } from 'lucide-react';
import { CacheManager } from '../../components/CacheManager';
import { useWorkerOptimization } from '../../hooks/useWorkerOptimization';

export default function SettingsPage() {
  const [showCacheManager, setShowCacheManager] = useState(false);
  const [useWebWorker, setUseWebWorker] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const {
    isOptimizing: isWorkerOptimizing,
    progress: workerProgress,
    supportsWorkers
  } = useWorkerOptimization();

  // SSR-friendly state
  useEffect(() => {
    setIsClient(true);
    // Load web worker preference from localStorage
    const savedPreference = localStorage.getItem('jetblue-use-webworker');
    if (savedPreference) {
      setUseWebWorker(JSON.parse(savedPreference));
    }
  }, []);

  // Save web worker preference
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('jetblue-use-webworker', JSON.stringify(useWebWorker));
    }
  }, [useWebWorker, isClient]);

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
              Manage your preferences, cache, and performance settings
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
              {/* Web Worker Setting */}
              {isClient && supportsWorkers && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="mb-3 sm:mb-0">
                    <h3 className="font-medium text-gray-900">Web Worker Optimization</h3>
                    <p className="text-sm text-gray-600">
                      Use background processing to prevent UI freezing during route optimization
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useWebWorker}
                      onChange={(e) => setUseWebWorker(e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      {useWebWorker ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              )}

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
                  <h3 className="font-medium text-gray-900 mb-2">Browser Compatibility</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${supportsWorkers ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Web Workers: {supportsWorkers ? 'Supported' : 'Not Supported'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                      <span>React Query: Supported</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Algorithm Settings */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <Cog className="mr-3 h-6 w-6 text-purple-500" />
              Optimization Algorithm
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Configure how thoroughly the route optimization algorithm searches for the best routes.
                Higher settings find better routes but take longer to compute.
              </p>
            </div>
            
            {/* Optimization Settings Component - Embedded Version */}
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Algorithm Performance:</strong> Choose how thoroughly the algorithm searches for optimal routes.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Higher settings may find better routes but take longer to complete.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    key: 'conservative',
                    name: 'Conservative',
                    description: 'Faster optimization, less thorough search',
                    maxIterations: 10000,
                    timeout: '30s'
                  },
                  {
                    key: 'moderate', 
                    name: 'Moderate (Recommended)',
                    description: 'Balanced performance and thoroughness',
                    maxIterations: 25000,
                    timeout: '60s'
                  },
                  {
                    key: 'aggressive',
                    name: 'Aggressive',
                    description: 'More thorough search, slower performance',
                    maxIterations: 50000,
                    timeout: '120s'
                  },
                  {
                    key: 'very-aggressive',
                    name: 'Very Aggressive',
                    description: 'Most thorough search, slowest performance',
                    maxIterations: 100000,
                    timeout: '300s'
                  }
                ].map((level) => (
                  <button
                    key={level.key}
                    onClick={() => {
                      // Handle optimization level change
                      console.log('Selected optimization level:', level.key);
                    }}
                    className="text-left p-4 border border-gray-200 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">{level.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{level.description}</div>
                    <div className="text-xs text-gray-500">
                      <div>Max: {level.maxIterations.toLocaleString()} iterations</div>
                      <div>Timeout: {level.timeout}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> These settings affect both client-side and server-side optimization. 
                  Changes take effect immediately for new optimizations.
                </p>
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

          {/* App Information */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <Monitor className="mr-3 h-6 w-6 text-gray-500" />
              App Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Version</h3>
                <p className="text-sm text-gray-600">JetBlue 25for25 Route Optimizer v1.0</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Technology Stack</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Next.js 14 with App Router</li>
                  <li>• React 18 with TypeScript</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• React Query for caching</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• A* route optimization algorithm</li>
                  <li>• Real-time flight pricing</li>
                  <li>• Intelligent caching system</li>
                  <li>• Mobile-responsive design</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Data Sources</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JetBlue flight schedules</li>
                  <li>• Multiple pricing APIs</li>
                  <li>• Realistic fallback pricing</li>
                  <li>• Airport distance calculations</li>
                </ul>
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
import React, { useState, useEffect } from 'react';
import { Save, Trash2, RefreshCw, Check } from 'lucide-react';
import { RouteConfig, Results, Flight } from '../lib/types';
import { useToast } from './ui/use-toast';

interface SavedRoute {
  id: string;
  name: string;
  config: RouteConfig;
  savedAt: Date;
}

interface SimpleSavedRoutesProps {
  currentConfig: RouteConfig;
  currentResults?: Results | null;
  onLoadConfiguration: (config: RouteConfig) => void;
  className?: string;
}

const STORAGE_KEY = 'jetblue-saved-routes';
const MAX_ROUTES = 8; // Keep it simple - most users won't need more

// Generate a simple, readable name using actual optimization results
const generateRouteName = (config: RouteConfig, results?: Results | null): string => {
  let actualStart: string;
  let actualEnd: string;
  
  // If we have optimization results, use the actual route
  if (results && 'path' in results && results.path && results.path.length > 0) {
    actualStart = results.path[0].Origin;
    actualEnd = results.path[results.path.length - 1].Destination;
  } else {
    // Fallback to user input (first airports from each list)
    const startAirports = config.startAirports.split(',').map(a => a.trim());
    const endAirports = config.endAirports.split(',').map(a => a.trim());
    actualStart = startAirports[0];
    actualEnd = endAirports[0];
  }
  
  const startDate = new Date(config.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDate = new Date(config.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  // If it's the same date, show just one date
  if (config.startDate === config.endDate) {
    return `${actualStart} → ${actualEnd} (${startDate})`;
  } else {
    return `${actualStart} → ${actualEnd} (${startDate} - ${endDate})`;
  }
};

export const SimpleSavedRoutes: React.FC<SimpleSavedRoutesProps> = ({
  currentConfig,
  currentResults,
  onLoadConfiguration,
  className = ''
}) => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  // Load routes from localStorage
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const routes = JSON.parse(stored).map((route: any) => ({
          ...route,
          savedAt: new Date(route.savedAt)
        }));
        setSavedRoutes(routes);
      }
    } catch (error) {
      console.error('Failed to load saved routes:', error);
    }
  };

  const saveRoutes = (routes: SavedRoute[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch (error) {
      console.error('Failed to save routes:', error);
    }
  };

  const handleSaveRoute = () => {
    if (isAddingRoute) {
      // Complete the save
      if (!newRouteName.trim()) return;
      
      setIsSaving(true);
      
      const newRoute: SavedRoute = {
        id: Date.now().toString(),
        name: newRouteName.trim(),
        config: currentConfig,
        savedAt: new Date()
      };

      let updatedRoutes = [newRoute, ...savedRoutes];
      
      // Keep only the latest routes if we exceed the limit
      if (updatedRoutes.length > MAX_ROUTES) {
        updatedRoutes = updatedRoutes.slice(0, MAX_ROUTES);
      }

      // Simulate a small delay for better UX
      setTimeout(() => {
        setSavedRoutes(updatedRoutes);
        saveRoutes(updatedRoutes);
        setIsAddingRoute(false);
        setNewRouteName('');
        setIsSaving(false);
        
        // Show success toast
        toast({
          title: "Route Saved!",
          description: `"${newRouteName.trim()}" has been saved successfully.`,
          duration: 3000,
        });
      }, 500);
    } else {
      // Start the save process
      setNewRouteName(generateRouteName(currentConfig, currentResults));
      setIsAddingRoute(true);
    }
  };

  const handleCancelSave = () => {
    setIsAddingRoute(false);
    setNewRouteName('');
  };

  const handleLoadRoute = (route: SavedRoute, event: React.MouseEvent) => {
    console.log('Loading route:', route.name, route.config);
    onLoadConfiguration(route.config);
    
    // Show success toast
    toast({
      title: "Route Loaded!",
      description: `"${route.name}" configuration has been loaded.`,
      duration: 3000,
    });
    
    // Provide visual feedback
    const button = event.currentTarget as HTMLElement;
    const originalText = button.textContent;
    const originalBg = button.style.backgroundColor;
    
    button.textContent = 'Loaded!';
    button.style.backgroundColor = '#059669';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = originalBg;
    }, 1500);
  };

  const handleDeleteRoute = (id: string) => {
    const routeToDelete = savedRoutes.find(route => route.id === id);
    const updatedRoutes = savedRoutes.filter(route => route.id !== id);
    setSavedRoutes(updatedRoutes);
    saveRoutes(updatedRoutes);
    
    // Show success toast
    if (routeToDelete) {
      toast({
        title: "Route Deleted",
        description: `"${routeToDelete.name}" has been removed.`,
        duration: 3000,
      });
    }
  };

  const handleClearAll = () => {
    if (savedRoutes.length === 0) return;
    if (confirm('Delete all saved routes?')) {
      const routeCount = savedRoutes.length;
      setSavedRoutes([]);
      saveRoutes([]);
      
      // Show success toast
      toast({
        title: "All Routes Cleared",
        description: `${routeCount} saved route${routeCount === 1 ? '' : 's'} have been removed.`,
        duration: 3000,
      });
    }
  };

  return (
    <div className={`${className} bg-white rounded-lg shadow-md`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quick Save</h3>
          <div className="flex space-x-2">
            {isAddingRoute ? (
              <>
                <button
                  onClick={handleCancelSave}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoute}
                  disabled={!newRouteName.trim()}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveRoute}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Current
                </button>
                {savedRoutes.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Inline save input */}
        {isAddingRoute && (
          <div className="mt-3">
            <input
              type="text"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRoute();
                if (e.key === 'Escape') handleCancelSave();
              }}
              placeholder="Route name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Routes List */}
      <div className="max-h-64 overflow-y-auto">
        {savedRoutes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Save className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved routes yet</p>
            <p className="text-xs">Save your current settings for quick access</p>
          </div>
        ) : (
          <div>
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => handleLoadRoute(route, e)}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Load
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {route.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saved {route.savedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSavedRoutes;
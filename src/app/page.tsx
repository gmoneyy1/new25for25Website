'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Calendar, MapPin, Plane, Clock, ArrowRight, Download, Search, Trash2, Database } from 'lucide-react';
import Papa from 'papaparse';

const JetBlueOptimizer = () => {
  const [csvData, setCsvData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [config, setConfig] = useState({
    startDate: '2025-06-20',
    startTime: '19:00',
    endDate: '2025-06-21',
    endTime: '23:59',
    startAirports: 'EWR,JFK,HPN,LGA',
    endAirports: 'EWR,JFK,HPN,LGA',
    visitedAirports: 'BED',
    minConnectionTime: 60
  });

  const csvUrl = '/api/schedule';

  // Load CSV data automatically on component mount (invisible to users)
  useEffect(() => {
    const loadCsvData = async () => {
      const savedCsvData = sessionStorage.getItem('jetblue-csv-data');
      
      if (savedCsvData) {
        try {
          const parsedData = JSON.parse(savedCsvData);
          setCsvData(parsedData);
          setIsLoading(false);
          console.log('Loaded saved CSV data:', parsedData.length, 'flights');
          return; // Use cached data if available
        } catch (error) {
          console.error('Error loading saved CSV data:', error);
          // Clear corrupted data
          sessionStorage.removeItem('jetblue-csv-data');
        }
      }
      
      // If no cached data, fetch from API (invisible loading)
      try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            setCsvData(result.data);
            saveCsvData(result.data);
            console.log('CSV loaded and saved:', result.data.length, 'flights');
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setIsLoading(false);
      }
    };
    
    loadCsvData();
  }, [csvUrl]);

  const fetchCsvData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          setCsvData(result.data);
          saveCsvData(result.data);
          console.log('CSV loaded and saved:', result.data.length, 'flights');
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching CSV:', error);
      setIsLoading(false);
    }
  }, [csvUrl]);

  const saveCsvData = (data) => {
    try {
      sessionStorage.setItem('jetblue-csv-data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving CSV data:', error);
      // If storage is full, try to clear old data and retry
      sessionStorage.clear();
      try {
        sessionStorage.setItem('jetblue-csv-data', JSON.stringify(data));
      } catch (retryError) {
        console.error('Error saving CSV data after clearing storage:', retryError);
      }
    }
  };

  const clearSavedData = () => {
    sessionStorage.removeItem('jetblue-csv-data');
    setCsvData(null);
    setResults(null);
  };

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const fileSize = file.size;
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          setCsvData(result.data);
          setCsvFileName(file.name);
          setCsvFileSize(fileSize);
          saveCsvData(result.data, file.name, fileSize);
          console.log('CSV loaded and saved:', result.data.length, 'flights');
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the file format.');
        }
      });
    }
  }, []);

  const parseDateTime = (dateStr, timeStr) => {
    return new Date(`${dateStr}T${timeStr}:00`);
  };

  const formatDateTime = (date) => {
    return date.toISOString().replace('T', ' ').slice(0, 16);
  };

  const heuristic = (visited, allNew) => {
    return (allNew.size - visited.size) * 60;
  };

  const optimizeRoute = useCallback(() => {
    if (!csvData || csvData.length === 0) {
      alert('Please upload a valid CSV file first');
      return;
    }

    setIsLoading(true);
    
    // Simulate processing delay for better UX
    const processingTimeout = setTimeout(() => {
      try {
        const startDateTime = parseDateTime(config.startDate, config.startTime);
        const endDateTime = parseDateTime(config.endDate, config.endTime);
        const startAirports = new Set(config.startAirports.split(',').map(s => s.trim()));
        const endAirports = new Set(config.endAirports.split(',').map(s => s.trim()));
        const visitedAirports = new Set(config.visitedAirports.split(',').map(s => s.trim()));
        const minConnectionTime = config.minConnectionTime * 60 * 1000; // Convert to milliseconds

        // Filter and process flights
        const validFlights = csvData.filter(flight => {
          const depTime = new Date(flight['Departure Datetime']);
          const arrTime = new Date(flight['Arrival Datetime']);
          return depTime >= startDateTime && arrTime <= endDateTime && 
                 flight.Origin && flight.Destination && 
                 !isNaN(depTime.getTime()) && !isNaN(arrTime.getTime());
        }).sort((a, b) => new Date(a['Departure Datetime']) - new Date(b['Departure Datetime']));

        console.log('Valid flights:', validFlights.length);

        if (validFlights.length === 0) {
          setResults({ error: 'No valid flights found in the specified time window' });
          setIsLoading(false);
          return;
        }

        // Build flight index by origin
        const flightsByOrigin = {};
        validFlights.forEach(flight => {
          const origin = flight.Origin;
          if (!flightsByOrigin[origin]) {
            flightsByOrigin[origin] = [];
          }
          flightsByOrigin[origin].push(flight);
        });

        // Get all possible new airports
        const allDestinations = new Set(validFlights.map(f => f.Destination));
        const newAirports = new Set([...allDestinations].filter(dest => !visitedAirports.has(dest)));

        // A* search implementation
        const heap = [];
        const visited = new Map();
        let bestPath = [];
        let maxVisited = 0;
        let counter = 0;

        // Initialize with starting flights
        validFlights.forEach(flight => {
          if (startAirports.has(flight.Origin)) {
            const visitedSet = new Set();
            if (newAirports.has(flight.Destination)) {
              visitedSet.add(flight.Destination);
            }
            
            const score = -visitedSet.size + heuristic(visitedSet, newAirports);
            heap.push({
              score,
              counter: counter++,
              path: [flight],
              visitedSet,
              arrivalTime: new Date(flight['Arrival Datetime'])
            });
          }
        });

        // Sort heap by score
        heap.sort((a, b) => a.score - b.score);

        let iterations = 0;
        const maxIterations = 5000; // Prevent infinite loops

        while (heap.length > 0 && iterations < maxIterations) {
          iterations++;
          const current = heap.shift();
          const { path, visitedSet, arrivalTime } = current;
          const lastFlight = path[path.length - 1];
          const currentAirport = lastFlight.Destination;

          // Check if we've reached an end airport
          if (endAirports.has(currentAirport)) {
            if (visitedSet.size > maxVisited) {
              maxVisited = visitedSet.size;
              bestPath = [...path];
            }
            continue;
          }

          // Memoization check
          const memoKey = `${currentAirport}-${[...visitedSet].sort().join(',')}`;
          if (visited.has(memoKey) && visited.get(memoKey) <= arrivalTime.getTime()) {
            continue;
          }
          visited.set(memoKey, arrivalTime.getTime());

          // Find connecting flights
          const nextFlights = flightsByOrigin[currentAirport] || [];
          const minDepartureTime = new Date(arrivalTime.getTime() + minConnectionTime);

          nextFlights.forEach(nextFlight => {
            const nextDepTime = new Date(nextFlight['Departure Datetime']);
            const nextArrTime = new Date(nextFlight['Arrival Datetime']);

            // Check constraints
            if (nextDepTime < minDepartureTime) return;
            if (nextArrTime > endDateTime) return;
            if (nextFlight['Flight Number'] === lastFlight['Flight Number']) return;

            const newVisitedSet = new Set(visitedSet);
            if (newAirports.has(nextFlight.Destination)) {
              newVisitedSet.add(nextFlight.Destination);
            }

            const newScore = -newVisitedSet.size + heuristic(newVisitedSet, newAirports);
            heap.push({
              score: newScore,
              counter: counter++,
              path: [...path, nextFlight],
              visitedSet: newVisitedSet,
              arrivalTime: nextArrTime
            });
          });

          // Keep heap sorted and limit size for performance
          heap.sort((a, b) => a.score - b.score);
          if (heap.length > 1000) {
            heap.splice(1000);
          }
        }

        // Calculate results
        if (bestPath.length > 0) {
          const totalDistance = bestPath.reduce((sum, flight) => sum + (flight['Distance (KM)'] || 0), 0);
          const totalDuration = bestPath.reduce((sum, flight) => sum + (flight['Elapsed Minutes'] || 0), 0);
          
          const allAirportsInPath = new Set();
          bestPath.forEach(flight => {
            allAirportsInPath.add(flight.Origin);
            allAirportsInPath.add(flight.Destination);
          });
          const newAirportsVisited = [...allAirportsInPath].filter(airport => !visitedAirports.has(airport));

          setResults({
            path: bestPath,
            totalFlights: bestPath.length,
            newAirportsVisited,
            totalDistance,
            totalDuration,
            iterations
          });
        } else {
          setResults({ error: 'No valid route found within the constraints' });
        }

      } catch (error) {
        console.error('Optimization error:', error);
        setResults({ error: 'An error occurred during optimization: ' + error.message });
      }
      
      setIsLoading(false);
    }, 100);
  }, [csvData, config]);

  const downloadResults = () => {
    if (!results || !results.path) return;
    
    const csvContent = Papa.unparse(results.path);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimal_jetblue_itinerary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            JetBlue 25for25 Route Optimizer
          </h1>
          <p className="text-gray-600 text-lg">
            Find the optimal flight path to visit the most new airports
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="mr-2" size={20} />
                Route Configuration
              </h2>
              
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={config.startDate}
                      onChange={(e) => setConfig({...config, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={config.startTime}
                      onChange={(e) => setConfig({...config, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={config.endDate}
                      onChange={(e) => setConfig({...config, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={config.endTime}
                      onChange={(e) => setConfig({...config, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Airports (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={config.startAirports}
                    onChange={(e) => setConfig({...config, startAirports: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Airports (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={config.endAirports}
                    onChange={(e) => setConfig({...config, endAirports: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Already Visited Airports
                  </label>
                  <input
                    type="text"
                    value={config.visitedAirports}
                    onChange={(e) => setConfig({...config, visitedAirports: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Connection Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.minConnectionTime}
                    onChange={(e) => setConfig({...config, minConnectionTime: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={optimizeRoute}
                  disabled={!csvData || isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading Data...
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
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plane className="mr-2" size={20} />
                Optimization Results
              </h2>

              {!results && (
                <div className="text-center py-12 text-gray-500">
                  <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Configure your route parameters and click "Optimize Route" to see results</p>
                </div>
              )}

              {results && results.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
                  <p className="font-medium">Error:</p>
                  <p>{results.error}</p>
                </div>
              )}

              {results && results.path && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{results.totalFlights}</p>
                        <p className="text-sm text-gray-600">Total Flights</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{results.newAirportsVisited.length}</p>
                        <p className="text-sm text-gray-600">New Airports</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{results.totalDistance.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total KM</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{Math.round(results.totalDuration / 60)}</p>
                        <p className="text-sm text-gray-600">Hours</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Flight Itinerary</h3>
                    <button
                      onClick={downloadResults}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                    >
                      <Download className="mr-2" size={16} />
                      Download CSV
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.path.map((flight, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <Plane size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{flight['Flight Number']}</p>
                              <p className="text-sm text-gray-600">{flight.Equipment}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{flight['Distance (KM)']}km | {flight['Elapsed Minutes']}min</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center">
                          <div className="text-center">
                            <p className="font-medium">{flight.Origin}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(flight['Departure Datetime']).toLocaleString()}
                            </p>
                          </div>
                          <ArrowRight className="mx-4 text-gray-400" size={16} />
                          <div className="text-center">
                            <p className="font-medium">{flight.Destination}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(flight['Arrival Datetime']).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JetBlueOptimizer;

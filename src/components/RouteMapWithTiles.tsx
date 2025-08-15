'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Flight } from '../lib/types';
import { Plane, MapPin } from 'lucide-react';

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

// Airport coordinates database (lat, lng)
const airportCoordinates: { [key: string]: { lat: number; lng: number; name: string; city: string } } = {
  'JFK': { lat: 40.6413, lng: -73.7781, name: 'John F. Kennedy International', city: 'New York' },
  'LGA': { lat: 40.7769, lng: -73.8740, name: 'LaGuardia Airport', city: 'New York' },
  'EWR': { lat: 40.6895, lng: -74.1745, name: 'Newark Liberty International', city: 'Newark' },
  'BOS': { lat: 42.3656, lng: -71.0096, name: 'Logan International Airport', city: 'Boston' },
  'DCA': { lat: 38.8512, lng: -77.0402, name: 'Ronald Reagan Washington National', city: 'Washington DC' },
  'BWI': { lat: 39.1774, lng: -76.6684, name: 'Baltimore/Washington International', city: 'Baltimore' },
  'PHL': { lat: 39.8744, lng: -75.2424, name: 'Philadelphia International', city: 'Philadelphia' },
  'PIT': { lat: 40.4951, lng: -80.2387, name: 'Pittsburgh International', city: 'Pittsburgh' },
  'LAX': { lat: 33.9416, lng: -118.4085, name: 'Los Angeles International', city: 'Los Angeles' },
  'SFO': { lat: 37.6213, lng: -122.3790, name: 'San Francisco International', city: 'San Francisco' },
  'SAN': { lat: 32.7338, lng: -117.1933, name: 'San Diego International', city: 'San Diego' },
  'SEA': { lat: 47.4502, lng: -122.3088, name: 'Seattle-Tacoma International', city: 'Seattle' },
  'DEN': { lat: 39.8561, lng: -104.6737, name: 'Denver International', city: 'Denver' },
  'ORD': { lat: 41.9742, lng: -87.9073, name: 'O\'Hare International', city: 'Chicago' },
  'ATL': { lat: 33.6407, lng: -84.4277, name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta' },
  'MIA': { lat: 25.7959, lng: -80.2870, name: 'Miami International', city: 'Miami' },
  'FLL': { lat: 26.0742, lng: -80.1506, name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale' },
  'MCO': { lat: 28.4312, lng: -81.3081, name: 'Orlando International', city: 'Orlando' },
  'TPA': { lat: 27.9755, lng: -82.5332, name: 'Tampa International', city: 'Tampa' },
  'BED': { lat: 42.4699, lng: -71.2893, name: 'Laurence G. Hanscom Field', city: 'Bedford' },
  'HPN': { lat: 41.0672, lng: -73.7076, name: 'Westchester County Airport', city: 'White Plains' },
  'BDL': { lat: 41.9389, lng: -72.6832, name: 'Bradley International Airport', city: 'Hartford' },
  // Caribbean airports
  'SJU': { lat: 18.4394, lng: -66.0018, name: 'Luis Muñoz Marín International', city: 'San Juan' },
  'STI': { lat: 19.7570, lng: -70.5697, name: 'Cibao International Airport', city: 'Santiago' },
  'SDQ': { lat: 18.4297, lng: -69.6689, name: 'Las Américas International', city: 'Santo Domingo' },
  'PUJ': { lat: 18.5674, lng: -68.3634, name: 'Punta Cana International', city: 'Punta Cana' },
  'NAS': { lat: 25.0389, lng: -77.4661, name: 'Lynden Pindling International', city: 'Nassau' },
  'MVY': { lat: 41.3931, lng: -70.6143, name: 'Martha\'s Vineyard Airport', city: 'Martha\'s Vineyard' },
  // Additional JetBlue destinations
  'BUF': { lat: 42.9405, lng: -78.7322, name: 'Buffalo Niagara International Airport', city: 'Buffalo' },
  'SYR': { lat: 43.1112, lng: -76.1063, name: 'Syracuse Hancock International Airport', city: 'Syracuse' },
  'LAS': { lat: 36.0840, lng: -115.1537, name: 'McCarran International Airport', city: 'Las Vegas' },
  'MSY': { lat: 29.9934, lng: -90.2581, name: 'Louis Armstrong New Orleans International', city: 'New Orleans' },
  'RSW': { lat: 26.5362, lng: -81.7552, name: 'Southwest Florida International Airport', city: 'Fort Myers' },
  'JAX': { lat: 30.4941, lng: -81.6879, name: 'Jacksonville International Airport', city: 'Jacksonville' },
  'SAV': { lat: 32.1276, lng: -81.2021, name: 'Savannah/Hilton Head International Airport', city: 'Savannah' },
  'CHS': { lat: 32.8986, lng: -80.0405, name: 'Charleston International Airport', city: 'Charleston' },
  'RDU': { lat: 35.8776, lng: -78.7875, name: 'Raleigh-Durham International Airport', city: 'Raleigh' },
  'BTV': { lat: 44.4719, lng: -73.1533, name: 'Burlington International Airport', city: 'Burlington' },
  'PWM': { lat: 43.6462, lng: -70.3093, name: 'Portland International Jetport', city: 'Portland' },
  'BGR': { lat: 44.8074, lng: -68.8281, name: 'Bangor International Airport', city: 'Bangor' },
  'ACK': { lat: 41.2532, lng: -70.0602, name: 'Nantucket Memorial Airport', city: 'Nantucket' },
};

interface RouteMapProps {
  flights: Flight[];
  className?: string;
  height?: string;
}


export const RouteMapWithTiles: React.FC<RouteMapProps> = ({ flights, className = '', height = '500px' }) => {
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<(google.maps.Polyline | google.maps.Marker | any)[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate bounds for the route first
  const { uniqueAirports, bounds } = React.useMemo(() => {
    if (flights.length === 0) return { uniqueAirports: [], bounds: null };
    
    const airportSet = new Set<string>();
    const coords: { lat: number; lng: number }[] = [];
    
    flights.forEach(flight => {
      airportSet.add(flight.Origin);
      airportSet.add(flight.Destination);
      
      const origin = airportCoordinates[flight.Origin];
      const destination = airportCoordinates[flight.Destination];
      
      if (!origin) {
        console.warn(`Missing coordinates for origin airport: ${flight.Origin}`);
      } else {
        coords.push(origin);
      }
      
      if (!destination) {
        console.warn(`Missing coordinates for destination airport: ${flight.Destination}`);
      } else {
        coords.push(destination);
      }
    });
    
    if (coords.length === 0) return { uniqueAirports: [], bounds: null };
    
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    
    const bounds = {
      minLat: Math.min(...lats) - 3,
      maxLat: Math.max(...lats) + 3,
      minLng: Math.min(...lngs) - 5,
      maxLng: Math.max(...lngs) + 5
    };
    
    return { uniqueAirports: Array.from(airportSet), bounds };
  }, [flights]);

  // Initialize Google Maps
  useEffect(() => {
    if (!isClient || !mapRef.current || flights.length === 0 || !bounds) return;

    const initializeMap = async () => {
      // Load Google Maps script if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        // Use environment variable for API key, fallback to a placeholder
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Set up global callback
        (window as any).initGoogleMaps = () => {
          console.log('Google Maps API loaded successfully');
          // Wait a bit longer for marker library to be fully available
          setTimeout(() => {
            console.log('Initializing map after marker library load...');
            initMap();
          }, 200);
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API. Please check your API key and network connection.');
          // Fallback to a simple message
          if (mapRef.current) {
            mapRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666;">Google Maps API key required. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.</div>';
          }
        };
        document.head.appendChild(script);
      } else {
        // Wait a moment for the API to be fully ready
        setTimeout(() => initMap(), 100);
      }
    };

    const initMap = () => {
      if (!bounds || !mapRef.current || !window.google || !window.google.maps || !window.google.maps.Map) {
        console.error('Google Maps API not fully loaded or bounds not available', {
          bounds: !!bounds,
          mapRef: !!mapRef.current,
          google: !!window.google,
          googleMaps: !!window.google?.maps,
          googleMapsMap: !!window.google?.maps?.Map
        });
        return;
      }

      try {
        // Calculate center point
        const center = {
          lat: (bounds.minLat + bounds.maxLat) / 2,
          lng: (bounds.minLng + bounds.maxLng) / 2
        };

        console.log('Creating Google Map with center:', center);

        // Create map with safe options
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 6,
          center: center,
          mapTypeId: 'terrain', // Use string instead of enum to avoid undefined issues
          styles: [], // Clean styling
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        
        // Add overlays after map is ready
        google.maps.event.addListenerOnce(map, 'idle', () => {
          console.log('Map is ready, adding overlays');
          addFlightOverlays(map);
        });
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        if (mapRef.current) {
          mapRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666;">Error loading Google Maps. Please check your API key configuration.</div>';
        }
      }
    };

    initializeMap();
  }, [isClient, bounds, flights]);

  const addFlightOverlays = (map: google.maps.Map) => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not available for overlays');
      return;
    }

    try {
      // Clear existing overlays
      overlaysRef.current.forEach(overlay => {
        if (overlay instanceof google.maps.Polyline) {
          overlay.setMap(null);
        } else if (overlay instanceof google.maps.Marker) {
          overlay.setMap(null);
        } else if (window.google.maps.marker && overlay instanceof window.google.maps.marker.AdvancedMarkerElement) {
          overlay.map = null;
        }
      });
      overlaysRef.current = [];

      // Add flight paths
      flights.forEach((flight, index) => {
        const origin = airportCoordinates[flight.Origin];
        const destination = airportCoordinates[flight.Destination];
        
        if (!origin || !destination) return;

        // Create curved flight path
        const flightPath = new window.google.maps.Polyline({
          path: [
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng }
          ],
          geodesic: true, // Curves with Earth's surface
          strokeColor: '#ff4444',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map
        });

        overlaysRef.current.push(flightPath);
      });

      // Add airport markers
      const airportSet = new Set<string>();
      flights.forEach(flight => {
        airportSet.add(flight.Origin);
        airportSet.add(flight.Destination);
      });

      Array.from(airportSet).forEach(airportCode => {
        const airport = airportCoordinates[airportCode];
        if (!airport) return;

        const isStart = flights[0]?.Origin === airportCode;
        const isEnd = flights[flights.length - 1]?.Destination === airportCode;
        const isStartAndEnd = isStart && isEnd;

        let markerColor = '#2196f3'; // Blue for intermediate
        if (isStartAndEnd) {
          markerColor = '#ff9800'; // Orange for start/end
        } else if (isStart) {
          markerColor = '#4caf50'; // Green for start
        } else if (isEnd) {
          markerColor = '#f44336'; // Red for end
        }

        // Debug: Check what's available
        console.log('Google Maps API availability:', {
          google: !!window.google,
          maps: !!window.google?.maps,
          marker: !!window.google?.maps?.marker,
          AdvancedMarkerElement: !!window.google?.maps?.marker?.AdvancedMarkerElement,
          PinElement: !!window.google?.maps?.marker?.PinElement
        });

        // Use AdvancedMarkerElement when available
        let marker;
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          console.log('Using AdvancedMarkerElement for', airportCode);
          
          // Try using PinElement first (newer approach)
          if (window.google.maps.marker.PinElement) {
            const pinElement = new window.google.maps.marker.PinElement({
              background: markerColor,
              borderColor: 'white',
              glyphColor: 'white',
              glyph: airportCode,
              scale: 1.2
            });
            
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { lat: airport.lat, lng: airport.lng },
              map: map,
              title: `${airportCode} - ${airport.city}`,
              content: pinElement.element
            });
          } else {
            // Fallback to custom HTML element
            const pinElement = document.createElement('div');
            pinElement.style.cssText = `
              width: 28px;
              height: 28px;
              background-color: ${markerColor};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            `;
            pinElement.textContent = airportCode;
            
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { lat: airport.lat, lng: airport.lng },
              map: map,
              title: `${airportCode} - ${airport.city}`,
              content: pinElement
            });
          }
        } else {
          console.log('Falling back to classic Marker for', airportCode);
          // Fallback to classic Marker (this is what's causing the deprecation warning)
          marker = new window.google.maps.Marker({
            position: { lat: airport.lat, lng: airport.lng },
            map: map,
            title: `${airportCode} - ${airport.city}`,
            icon: {
              path: 'M 0, 0 m -5, 0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
              scale: 1.5,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2
            },
            label: {
              text: airportCode,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });
        }

        overlaysRef.current.push(marker);
      });

      console.log(`Added ${overlaysRef.current.length} overlays to the map`);
    } catch (error) {
      console.error('Error adding flight overlays:', error);
    }
  };



  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="flex items-center text-gray-600">
          <Plane className="h-6 w-6 mr-2 animate-pulse" />
          Loading map...
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No route to display</p>
          <p className="text-xs">Run an optimization to see the flight path</p>
        </div>
      </div>
    );
  }


  return (
    <div className={`${className} bg-white rounded-lg border border-gray-200 overflow-hidden`} style={{ height }}>
      <div className="h-full flex flex-col">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Flight Route Map</h3>
          <p className="text-sm text-gray-600">Professional geographic visualization powered by Google Maps</p>
        </div>
        
        <div className="flex-1 relative bg-slate-100">
          {/* Google Maps container with dynamic overlays */}
          <div 
            ref={mapRef}
            className="absolute inset-0 w-full h-full"
            style={{ minHeight: '400px' }}
          />
          
          {/* Loading state */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="flex items-center text-gray-600">
                <Plane className="h-6 w-6 mr-2 animate-pulse" />
                Loading interactive map...
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-center space-x-6 text-sm flex-wrap gap-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2 border-2 border-white"></div>
              <span>Start Airport</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 border-2 border-white"></div>
              <span>Intermediate Stop</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2 border-2 border-white"></div>
              <span>End Airport</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-2 border-2 border-white"></div>
              <span>Start & End Airport</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-0 border-2 border-red-400 mr-2"></div>
              <span>Flight Path</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapWithTiles;
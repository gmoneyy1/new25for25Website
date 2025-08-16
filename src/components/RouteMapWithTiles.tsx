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
  'PVD': { lat: 41.7240, lng: -71.4281, name: 'T.F. Green Airport', city: 'Providence' },
  
  // International JetBlue destinations
  'CUN': { lat: 21.0365, lng: -86.8771, name: 'Cancún International Airport', city: 'Cancún' },
  'AMS': { lat: 52.3105, lng: 4.7683, name: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
  'CDG': { lat: 49.0097, lng: 2.5479, name: 'Charles de Gaulle Airport', city: 'Paris' },
  'LHR': { lat: 51.4700, lng: -0.4543, name: 'Heathrow Airport', city: 'London' },
  'LGW': { lat: 51.1481, lng: -0.1903, name: 'Gatwick Airport', city: 'London' },
  'DUB': { lat: 53.4213, lng: -6.2701, name: 'Dublin Airport', city: 'Dublin' },
  'EDI': { lat: 55.9500, lng: -3.3725, name: 'Edinburgh Airport', city: 'Edinburgh' },
  'MAD': { lat: 40.4983, lng: -3.5676, name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid' },
  'LIR': { lat: 10.5933, lng: -85.5444, name: 'Daniel Oduber Quirós International Airport', city: 'Liberia' },
  'SJD': { lat: 23.1518, lng: -110.1003, name: 'Los Cabos International Airport', city: 'Los Cabos' },
  'SJO': { lat: 9.9939, lng: -84.2089, name: 'Juan Santamaría International Airport', city: 'San José' },
  'GUA': { lat: 14.5833, lng: -90.5275, name: 'La Aurora International Airport', city: 'Guatemala City' },
  'SAP': { lat: 15.4526, lng: -87.9236, name: 'Ramón Villeda Morales International Airport', city: 'San Pedro Sula' },
  'MDE': { lat: 6.1649, lng: -75.4231, name: 'José María Córdova International Airport', city: 'Medellín' },
  'CTG': { lat: 10.4424, lng: -75.5130, name: 'Rafael Núñez International Airport', city: 'Cartagena' },
  'GEO': { lat: 6.4986, lng: -58.2541, name: 'Cheddi Jagan International Airport', city: 'Georgetown' },
  'GYE': { lat: -2.1574, lng: -79.8836, name: 'José Joaquín de Olmedo International Airport', city: 'Guayaquil' },
  'BZE': { lat: 17.5392, lng: -88.3082, name: 'Philip S. W. Goldson International Airport', city: 'Belize City' },
  'CUR': { lat: 12.1889, lng: -68.9598, name: 'Curaçao International Airport', city: 'Willemstad' },
  'GND': { lat: 12.0042, lng: -61.7861, name: 'Maurice Bishop International Airport', city: 'Grenada' },
  'ANU': { lat: 17.1367, lng: -61.7928, name: 'V. C. Bird International Airport', city: 'Antigua' },
  'BGI': { lat: 13.0746, lng: -59.4925, name: 'Grantley Adams International Airport', city: 'Bridgetown' },
  'KIN': { lat: 17.9356, lng: -76.7875, name: 'Norman Manley International Airport', city: 'Kingston' },
  'MBJ': { lat: 18.5037, lng: -77.9134, name: 'Sangster International Airport', city: 'Montego Bay' },
  'POP': { lat: 19.7579, lng: -70.5700, name: 'Gregorio Luperón International Airport', city: 'Puerto Plata' },
  'POS': { lat: 10.5954, lng: -61.3372, name: 'Piarco International Airport', city: 'Port of Spain' },
  'SKB': { lat: 17.3112, lng: -62.7187, name: 'Robert L. Bradshaw International Airport', city: 'Basseterre' },
  'BON': { lat: 12.1314, lng: -68.2685, name: 'Flamingo International Airport', city: 'Kralendijk' },
  'GCM': { lat: 19.2928, lng: -81.3577, name: 'Owen Roberts International Airport', city: 'Grand Cayman' },
  'HYA': { lat: 41.6693, lng: -70.2803, name: 'Cape Cod Gateway Airport', city: 'Hyannis' },
  'ORH': { lat: 42.2679, lng: -71.8757, name: 'Worcester Regional Airport', city: 'Worcester' },
  'PQI': { lat: 46.6891, lng: -68.0448, name: 'Northern Maine Regional Airport', city: 'Presque Isle' },
  'PSE': { lat: 18.0083, lng: -66.5630, name: 'Mercedita Airport', city: 'Ponce' },
  'SRQ': { lat: 27.3954, lng: -82.5544, name: 'Sarasota-Bradenton International Airport', city: 'Sarasota' },
  'BQN': { lat: 18.4949, lng: -67.1294, name: 'Rafael Hernández Airport', city: 'Aguadilla' },
  'PLS': { lat: 21.7736, lng: -72.2659, name: 'Providenciales International Airport', city: 'Providenciales' },
  
  // Additional US destinations
  'ABQ': { lat: 35.0402, lng: -106.6091, name: 'Albuquerque International Sunport', city: 'Albuquerque' },
  'ALB': { lat: 42.7483, lng: -73.8017, name: 'Albany International Airport', city: 'Albany' },
  'AUS': { lat: 30.1975, lng: -97.6664, name: 'Austin-Bergstrom International Airport', city: 'Austin' },
  'AVL': { lat: 35.4362, lng: -82.5418, name: 'Asheville Regional Airport', city: 'Asheville' },
  'BNA': { lat: 36.1263, lng: -86.6774, name: 'Nashville International Airport', city: 'Nashville' },
  'BUR': { lat: 34.1975, lng: -118.3524, name: 'Hollywood Burbank Airport', city: 'Burbank' },
  'BZN': { lat: 45.7776, lng: -111.1601, name: 'Bozeman Yellowstone International Airport', city: 'Bozeman' },
  'CLE': { lat: 41.4117, lng: -81.8498, name: 'Cleveland Hopkins International Airport', city: 'Cleveland' },
  'DFW': { lat: 32.8968, lng: -97.0380, name: 'Dallas/Fort Worth International Airport', city: 'Dallas' },
  'DTW': { lat: 42.2162, lng: -83.3554, name: 'Detroit Metropolitan Airport', city: 'Detroit' },
  'IAH': { lat: 29.9902, lng: -95.3368, name: 'George Bush Intercontinental Airport', city: 'Houston' },
  'ILM': { lat: 34.2706, lng: -77.9026, name: 'Wilmington International Airport', city: 'Wilmington' },
  'MKE': { lat: 42.9476, lng: -87.8966, name: 'Milwaukee Mitchell International Airport', city: 'Milwaukee' },
  'ONT': { lat: 34.0559, lng: -117.6011, name: 'Ontario International Airport', city: 'Ontario' },
  'ORF': { lat: 36.8945, lng: -76.2012, name: 'Norfolk International Airport', city: 'Norfolk' },
  'PDX': { lat: 45.5898, lng: -122.5951, name: 'Portland International Airport', city: 'Portland' },
  'PHX': { lat: 33.4342, lng: -112.0116, name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix' },
  'RIC': { lat: 37.5052, lng: -77.3197, name: 'Richmond International Airport', city: 'Richmond' },
  'RNO': { lat: 39.4993, lng: -119.7681, name: 'Reno-Tahoe International Airport', city: 'Reno' },
  'ROC': { lat: 43.1190, lng: -77.6724, name: 'Greater Rochester International Airport', city: 'Rochester' },
  'SLC': { lat: 40.7899, lng: -111.9791, name: 'Salt Lake City International Airport', city: 'Salt Lake City' },
  'SMF': { lat: 38.6955, lng: -121.5908, name: 'Sacramento International Airport', city: 'Sacramento' },
  'EYW': { lat: 24.5561, lng: -81.7596, name: 'Key West International Airport', city: 'Key West' },
  'ISP': { lat: 40.7952, lng: -73.1002, name: 'Long Island MacArthur Airport', city: 'Islip' },
  
  // Additional missing JetBlue destinations
  'AUA': { lat: 12.5014, lng: -70.0152, name: 'Queen Beatrix International Airport', city: 'Oranjestad' },
  'BDA': { lat: 32.3640, lng: -64.6786, name: 'L.F. Wade International Airport', city: 'Bermuda' },
  'TQO': { lat: 18.1158, lng: -65.4224, name: 'Antonio Rivera Rodríguez Airport', city: 'Vieques' },
  'SVD': { lat: 13.1443, lng: -61.2109, name: 'Argyle International Airport', city: 'Kingstown' },
  'SXM': { lat: 18.0409, lng: -63.1089, name: 'Princess Juliana International Airport', city: 'Philipsburg' },
  'STT': { lat: 18.3373, lng: -64.9734, name: 'Cyril E. King Airport', city: 'Charlotte Amalie' },
  'STX': { lat: 17.7019, lng: -64.7986, name: 'Henry E. Rohlsen Airport', city: 'Christiansted' },
  'TVC': { lat: 44.7414, lng: -85.5822, name: 'Cherry Capital Airport', city: 'Traverse City' },
  'UVF': { lat: 13.7333, lng: -60.9526, name: 'Hewanorra International Airport', city: 'Castries' },
  'YVR': { lat: 49.1967, lng: -123.1815, name: 'Vancouver International Airport', city: 'Vancouver' },
  'MHT': { lat: 42.9326, lng: -71.4357, name: 'Manchester-Boston Regional Airport', city: 'Manchester' },
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
  const overlaysRef = useRef<(google.maps.Polyline | google.maps.Marker)[]>([]);

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
        
        // Try direct environment variable access first (simpler and more reliable for local dev)
        let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
          // If no direct access, try the secure proxy (for production)
          try {
            console.log('🔄 No direct API key, trying secure proxy...');
            const response = await fetch('/api/maps-proxy', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'loadScript'
              })
            });
            
            const config = await response.json();
            
            if (config.hasKey && config.scriptUrl) {
              console.log('✅ Using secure proxy script URL:', config.scriptUrl);
              script.src = config.scriptUrl;
              script.async = true;
              script.defer = true;
            } else {
              console.error('❌ Proxy response invalid:', config);
              throw new Error(`Proxy failed: ${config.error || 'Invalid response'}`);
            }
          } catch (error) {
            console.error('❌ Both direct access and proxy failed:', error);
            if (mapRef.current) {
              mapRef.current.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; padding: 20px; text-align: center;">
                  <h3 style="color: #d32f2f; margin-bottom: 10px;">Google Maps Configuration Error</h3>
                  <p style="margin-bottom: 10px;">Failed to load Google Maps API.</p>
                  <p style="font-size: 12px; color: #999;">Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
                  <p style="font-size: 10px; color: #999; margin-top: 10px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                </div>
              `;
            }
            return;
          }
        } else {
          // Direct access worked - use it
          console.log('✅ Using direct API key access');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&loading=async&callback=initGoogleMaps`;
          script.async = true;
          script.defer = true;
        }
        
        // Set up global callback with better error handling
        (window as any).initGoogleMaps = () => {
          console.log('🎉 Google Maps API loaded successfully via callback');
          // Wait a bit longer for marker library to be fully available
          setTimeout(() => {
            console.log('🗺️ Initializing map after marker library load...');
            initMap();
          }, 200);
        };
        
        // Fallback: If callback doesn't fire within 10 seconds, try direct initialization
        setTimeout(() => {
          if (!window.google) {
            console.warn('⚠️ Google Maps callback did not fire within 10 seconds');
            if (mapRef.current) {
              mapRef.current.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; padding: 20px; text-align: center;">
                  <h3 style="color: #d32f2f; margin-bottom: 10px;">Google Maps Loading Timeout</h3>
                  <p style="margin-bottom: 10px;">The maps script loaded but didn't initialize properly.</p>
                  <p style="font-size: 12px; color: #999;">Try refreshing the page</p>
                </div>
              `;
            }
          } else if (!mapInstanceRef.current) {
            console.log('🔄 Google Maps loaded but map not initialized, trying direct init...');
            initMap();
          }
        }, 10000);
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API. Please check your API key and network connection.');
          // Fallback to a simple message
          if (mapRef.current) {
            mapRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666;">Google Maps configuration error. Please check server environment variables.</div>';
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

        // Create map with basic options (no mapId needed for classic markers)
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 6,
          center: center,
          mapTypeId: 'terrain',
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
        if (overlay.setMap) {
          overlay.setMap(null);
        }
      });
      overlaysRef.current = [];

      // Add flight paths
      flights.forEach((flight, index) => {
        const origin = airportCoordinates[flight.Origin];
        const destination = airportCoordinates[flight.Destination];
        
        if (!origin || !destination) return;

        // Create curved flight path with improved styling
        const flightPath = new window.google.maps.Polyline({
          path: [
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng }
          ],
          geodesic: true, // Curves with Earth's surface
          strokeColor: '#2563eb', // Blue color instead of red
          strokeOpacity: 0.7,
          strokeWeight: 3, // Slightly thinner lines
          map: map,
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 1
            },
            offset: '100%'
          }] // Add directional arrows
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

        // Use classic Google Maps Marker (simple and reliable)
        const marker = new window.google.maps.Marker({
          position: { lat: airport.lat, lng: airport.lng },
          map: map,
          title: `${airportCode} - ${airport.city}`,
          icon: {
            path: 'M 0, 0 m -5, 0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
            scale: 1.2,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2
          },
          label: {
            text: airportCode,
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold'
          }
        });

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
              <div className="w-6 h-0 border-2 border-blue-600 mr-2"></div>
              <span>Flight Path</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapWithTiles;
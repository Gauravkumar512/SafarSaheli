import { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FaWalking, FaFlag, FaSearch } from 'react-icons/fa';
const newDelhi = { lat: 28.6139, lng: 77.2090 };

function randomOffset(center, min=0.01, max=0.025) {
  // offset in degrees
  const angle = Math.random() * 2 * Math.PI;
  const dist = min + Math.random() * (max - min);
  return {
    lat: center.lat + Math.cos(angle) * dist,
    lng: center.lng + Math.sin(angle) * dist,
  };
}

function getMockRoutes(start, end) {
  // All routes just interpolate (with a wiggle) between start and end
  const route1 = [start,
    { lat: start.lat + (end.lat-start.lat)*0.33 + 0.005, lng: start.lng + (end.lng-start.lng)*0.33 - 0.007  },
    { lat: start.lat + (end.lat-start.lat)*0.66 - 0.004, lng: start.lng + (end.lng-start.lng)*0.66 + 0.006  },
    end ];
  const route2 = [start,
    { lat: start.lat + (end.lat-start.lat)*0.30 - 0.007, lng: start.lng + (end.lng-start.lng)*0.35 + 0.005  },
    { lat: start.lat + (end.lat-start.lat)*0.60 + 0.008, lng: start.lng + (end.lng-start.lng)*0.60 - 0.003  },
    end ];
  const route3 = [start,
    { lat: (start.lat+end.lat)/2 + 0.012, lng: (start.lng+end.lng)/2 - 0.011  },
    end ];
  // Assign mock safety score
  const scores = [
    Math.floor(50 + Math.random() * 50),
    Math.floor(50 + Math.random() * 50),
    Math.floor(50 + Math.random() * 50),
  ];
  return [
    { polyline: route1, score: scores[0] },
    { polyline: route2, score: scores[1] },
    { polyline: route3, score: scores[2] },
  ];
}

function getNearbyMarkers(route) {
  // For demo: put a hospital and police marker along the route
  if (!route) return [];
  const hops = [
    { ...route[Math.floor(route.length / 3)], icon: iconHospital, type: 'hospital' },
    { ...route[Math.floor(2 * route.length / 3)], icon: iconPolice, type: 'police' }
  ];
  return hops;
}

export default function SafetyRoutes() {
  const [startVal, setStartVal] = useState('');
  const [destVal, setDestVal] = useState('');
  const [startCoord, setStartCoord] = useState(null);
  const [endCoord, setEndCoord] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeSourceIdRef = useRef('route');
  const pointSourceIdRef = useRef('runner');
  const [geoRoute, setGeoRoute] = useState([]); // [lat, lng]
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimerRef = useRef(null);
  // PUT YOUR GEOAPIFY API KEY HERE
  const apiKey = 'd188108bd5574dddaa900e8036d19f2a';
  const [mapReady, setMapReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const [startSug, setStartSug] = useState([]);
  const [destSug, setDestSug] = useState([]);
  const startDebRef = useRef(null);
  const destDebRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null); // {distanceKm, durationMin, safetyScore}
  const [lastStart, setLastStart] = useState(null); // {lat,lng}
  const [lastEnd, setLastEnd] = useState(null);     // {lat,lng}
  const [safetyScore, setSafetyScore] = useState(null); // Safety score (0-100)
  const [isLoading, setIsLoading] = useState(false); // Loading state for button
  const [allRoutes, setAllRoutes] = useState([]); // All route options with scores
  const [selectedRouteForMaps, setSelectedRouteForMaps] = useState(null); // Selected route for opening in Maps
  
  // API Base URL from environment variable or default to localhost
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  
  // Debug: Log API base URL being used (only in dev mode)
  useEffect(() => {
    console.log('[SafetyRoutes] API Base URL:', API_BASE_URL);
    console.log('[SafetyRoutes] VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
  }, []);

  // Initialize MapLibre map with Geoapify style
  useEffect(() => {
    if (mapInstanceRef.current) return;
    // Debug: log if API key is present (masked)
    try {
      const masked = apiKey && apiKey !== 'YOUR_GEOAPIFY_API_KEY' ? `${String(apiKey).slice(0, 6)}***` : 'NONE';
      // eslint-disable-next-line no-console
      console.log('[Geoapify] API key detected:', masked);
      // eslint-disable-next-line no-console
      console.log('[Geoapify] Vite key present:', Boolean(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEOAPIFY_KEY));
    } catch {}
    if (!apiKey || apiKey === 'YOUR_GEOAPIFY_API_KEY') {
      setErrorMsg('Geoapify API key missing. For Vite, set VITE_GEOAPIFY_KEY in .env and restart.');
      return;
    }
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${apiKey}`,
      center: [newDelhi.lng, newDelhi.lat],
      zoom: 12,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    const onLoad = () => setMapReady(true);
    map.on('load', onLoad);
    map.on('error', (e) => {
      if (!e || !e.error) return;
      const msg = String(e.error && (e.error.statusText || e.error.message || e.error))
      setErrorMsg(`Map error: ${msg}. Check API key or network.`);
    });
    mapInstanceRef.current = map;
    return () => {
      if (mapInstanceRef.current) {
        map.off('load', onLoad);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey]);

  async function geocode(text) {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&limit=1&filter=countrycode:in&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    // Debug: log geocoding response
    // console.log('Geocode response', data);
    const f = data.features?.[0];
    if (!f) throw new Error('Location not found');
    return { lat: f.properties.lat, lng: f.properties.lon };
  }

  function clearMapArtifacts() {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    setIsAnimating(false);
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource(routeSourceIdRef.current)) map.removeSource(routeSourceIdRef.current);
    if (map.getLayer('runner-circle')) map.removeLayer('runner-circle');
    if (map.getSource(pointSourceIdRef.current)) map.removeSource(pointSourceIdRef.current);
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null; }
    if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null; }
    setRouteInfo(null);
    setLastStart(null);
    setLastEnd(null);
    setAllRoutes([]);
    setSelectedRouteForMaps(null);
  }

  /**
   * Get route color based on safety score.
   * Green = safe (70+), Yellow = moderate (40-69), Red = unsafe (<40)
   */
  function getRouteColor(score) {
    if (score >= 70) return '#10b981'; // Green - safe
    if (score >= 40) return '#eab308'; // Yellow - moderate
    return '#ef4444'; // Red - unsafe
  }

  async function handleJourney() {
    setErrorMsg('');
    if (!startVal || !destVal) { 
      setErrorMsg('Please enter start and destination.'); 
      return; 
    }
    
    // Set loading state
    setIsLoading(true);
    clearMapArtifacts();
    
    try {
      // Geocode start and destination
      const [start, end] = await Promise.all([geocode(startVal), geocode(destVal)]);
      setStartCoord(start);
      setEndCoord(end);
      const map = mapInstanceRef.current;
      if (!map) return;
      
      // Call backend API for safest route
      try {
        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add ngrok bypass header if using ngrok
        if (API_BASE_URL.includes('ngrok')) {
          headers['ngrok-skip-browser-warning'] = '69420';
        }
        
        // Try to connect to backend with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        let backendResponse;
        try {
          backendResponse = await fetch(`${API_BASE_URL}/safest-route`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              start: [start.lat, start.lng],
              end: [end.lat, end.lng]
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Backend request timed out. Please check if backend is running at ' + API_BASE_URL);
          }
          throw new Error(`Cannot connect to backend: ${fetchError.message}. Make sure backend is running at ${API_BASE_URL}`);
        }
        
        if (!backendResponse.ok) {
          const errorText = await backendResponse.text();
          throw new Error(`Backend API error (${backendResponse.status}): ${errorText || backendResponse.statusText}`);
        }
        
        const backendData = await backendResponse.json();
        
        // Debug: Log backend response
        console.log('[SafetyRoutes] Backend response:', {
          has_safest_route: !!backendData.safest_route,
          has_all_routes: !!backendData.all_routes,
          all_routes_count: backendData.all_routes?.length || 0,
          data_keys: Object.keys(backendData)
        });
        
        // Extract route data from backend response
        // New format: {safest_route: {...}, all_routes: [...]}
        // Old format (fallback): {route: [...], safety_score: ...}
        let safestRoute, allRoutesData;
        
        if (backendData.safest_route && backendData.all_routes) {
          // New format with all routes
          safestRoute = backendData.safest_route;
          allRoutesData = backendData.all_routes || [];
          console.log(`[SafetyRoutes] Using new format: ${allRoutesData.length} route(s) received`);
        } else {
          // Old format - convert to new format
          console.log('[SafetyRoutes] Using old format (fallback)');
          safestRoute = {
            route: backendData.route || [],
            safety_score: backendData.safety_score || 50,
            distance_km: backendData.distance_km || null,
            duration_min: backendData.duration_min || null
          };
          allRoutesData = [safestRoute];
        }
        
        if (!safestRoute.route || safestRoute.route.length === 0) {
          setErrorMsg('No route found from backend.');
          return;
        }
        
        // Debug: Log route details
        console.log('[SafetyRoutes] Routes summary:', {
          total_routes: allRoutesData.length,
          routes: allRoutesData.map((r, i) => ({
            index: i,
            safety_score: r.safety_score,
            distance_km: r.distance_km,
            duration_min: r.duration_min,
            coordinates_count: r.route?.length || 0
          }))
        });
        
        // Store all routes for display
        setAllRoutes(allRoutesData);
        setSelectedRouteForMaps(safestRoute); // Default to safest route
        
        // Use the safest route for map display (already in [lat, lng] format)
        const flattened = safestRoute.route;
        setGeoRoute(flattened);
        setSafetyScore(safestRoute.safety_score);
        
        const info = {
          distanceKm: safestRoute.distance_km,
          durationMin: safestRoute.duration_min,
          safetyScore: safestRoute.safety_score
        };

        const addRoute = () => {
          const lineCoords = flattened.map(([lat, lng]) => [lng, lat]);
          const lineGeoJSON = { type: 'Feature', geometry: { type: 'LineString', coordinates: lineCoords }, properties: {} };
          
          // Determine route color based on safety score (use safest route's score)
          const routeColor = getRouteColor(info.safetyScore);
          
          if (map.getSource(routeSourceIdRef.current)) {
            map.getSource(routeSourceIdRef.current).setData(lineGeoJSON);
            // Update color if layer exists
            if (map.getLayer('route-line')) {
              map.setPaintProperty('route-line', 'line-color', routeColor);
            }
          } else {
            map.addSource(routeSourceIdRef.current, { type: 'geojson', data: lineGeoJSON });
            if (!map.getLayer('route-line')) {
              // ROUTE DRAWING LOGIC (MapLibre layer) - Color coded by safety
              map.addLayer({ 
                id: 'route-line', 
                type: 'line', 
                source: routeSourceIdRef.current, 
                layout: { 
                  'line-join': 'round', 
                  'line-cap': 'round' 
                }, 
                paint: { 
                  'line-color': routeColor, 
                  'line-width': 6 
                } 
              });
            }
          }
          const lngs = lineCoords.map(c => c[0]);
          const lats = lineCoords.map(c => c[1]);
          map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, linear: true });

          // Markers: green start, red end
          const green = document.createElement('div'); green.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 0 0 2px #10b981';
          const red = document.createElement('div');   red.style.cssText   = 'width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 2px #ef4444';
          startMarkerRef.current = new maplibregl.Marker({ element: green, anchor: 'center' }).setLngLat([start.lng, start.lat]).addTo(map);
          endMarkerRef.current   = new maplibregl.Marker({ element: red,   anchor: 'center' }).setLngLat([end.lng, end.lat]).addTo(map);
          // Save for Open in Maps button and info
          setLastStart(start);
          setLastEnd(end);
          setRouteInfo(info);
        };

        if (mapReady || (map && map.isStyleLoaded && map.isStyleLoaded())) {
          addRoute();
        } else {
          const once = () => { addRoute(); map.off('load', once); };
          map.on('load', once);
        }
      } catch (backendError) {
        // Fallback to direct Geoapify if backend fails
        console.warn('[SafetyRoutes] Backend API failed, falling back to Geoapify:', backendError);
        setErrorMsg(`Backend unavailable: ${backendError.message}. Using fallback route.`);
        
        // Fallback: use Geoapify directly (shortest route)
        async function fetchRoute(mode) {
          const url = `https://api.geoapify.com/v1/routing?waypoints=${start.lat}%2C${start.lng}%7C${end.lat}%2C${end.lng}&mode=${mode}&apiKey=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) return null;
          const d = await res.json();
          return d?.features?.[0]?.geometry ? d : null;
        }
        let data = await fetchRoute('drive,safe');
        if (!data) data = await fetchRoute('drive');
        if (!data) { setErrorMsg('No route found.'); return; }
        const geom = data.features[0].geometry;
        const props = data.features[0].properties || {};
        const distanceM = props.distance ?? props?.summary?.distance ?? props?.legs?.[0]?.distance;
        const durationS = props.time ?? props?.summary?.duration ?? props?.legs?.[0]?.duration;
        const info = {
          distanceKm: typeof distanceM === 'number' ? (distanceM / 1000) : null,
          durationMin: typeof durationS === 'number' ? (durationS / 60) : null,
          safetyScore: null // No safety score in fallback
        };
        const flattened = geom.type === 'MultiLineString'
          ? (geom.coordinates || []).flat(1).map(([lon, lat]) => [lat, lon])
          : (geom.coordinates || []).map(([lon, lat]) => [lat, lon]);
        if (flattened.length === 0) { setErrorMsg('Empty route.'); return; }
        setGeoRoute(flattened);
        setSafetyScore(null);
        
        const addRoute = () => {
          const lineCoords = flattened.map(([lat, lng]) => [lng, lat]);
          const lineGeoJSON = { type: 'Feature', geometry: { type: 'LineString', coordinates: lineCoords }, properties: {} };
          if (map.getSource(routeSourceIdRef.current)) {
            map.getSource(routeSourceIdRef.current).setData(lineGeoJSON);
          } else {
            map.addSource(routeSourceIdRef.current, { type: 'geojson', data: lineGeoJSON });
            if (!map.getLayer('route-line')) {
              map.addLayer({ id: 'route-line', type: 'line', source: routeSourceIdRef.current, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 6 } });
            }
          }
          const lngs = lineCoords.map(c => c[0]);
          const lats = lineCoords.map(c => c[1]);
          map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, linear: true });
          const green = document.createElement('div'); green.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 0 0 2px #10b981';
          const red = document.createElement('div');   red.style.cssText   = 'width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 2px #ef4444';
          startMarkerRef.current = new maplibregl.Marker({ element: green, anchor: 'center' }).setLngLat([start.lng, start.lat]).addTo(map);
          endMarkerRef.current   = new maplibregl.Marker({ element: red,   anchor: 'center' }).setLngLat([end.lng, end.lat]).addTo(map);
          setLastStart(start);
          setLastEnd(end);
          setRouteInfo(info);
        };
        
        if (mapReady || (map && map.isStyleLoaded && map.isStyleLoaded())) {
          addRoute();
        } else {
          const once = () => { addRoute(); map.off('load', once); };
          map.on('load', once);
        }
      }
    } catch (e) {
      setErrorMsg(e.message || 'Failed to build route.');
      console.error('[SafetyRoutes] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="mx-auto max-w-3xl p-4 pb-24">
        <div className="mb-7 rounded-2xl bg-white/70 shadow border border-pink-200 p-4 flex flex-col gap-4">
          {/* Inputs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-3 text-pink-400 text-lg"><FaWalking /></span>
              <input
                id="startLocation"
                value={startVal}
                onChange={e => {
                  const v = e.target.value; setStartVal(v);
                  if (startDebRef.current) clearTimeout(startDebRef.current);
                  // Reduced debounce from 300ms to 150ms for faster search
                  startDebRef.current = setTimeout(async () => {
                    if (!v || v.length < 2) { setStartSug([]); return; }
                    try {
                      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(v)}&limit=5&filter=countrycode:in&apiKey=${apiKey}`;
                      const res = await fetch(url); 
                      if (!res.ok) throw new Error('Search failed');
                      const data = await res.json();
                      setStartSug((data.features||[]).map(f => ({ label: f.properties.formatted, lat: f.properties.lat, lon: f.properties.lon })));
                    } catch { setStartSug([]); }
                  }, 150);
                }}
                placeholder="Search start location..."
                className="pl-10 pr-9 py-3 w-full rounded-xl border border-pink-200 text-gray-900 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
              />
              <span className="absolute right-3 top-3.5 text-pink-400 text-md cursor-pointer"><FaSearch /></span>
              {startSug.length > 0 && (
                <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-pink-200 rounded-xl shadow max-h-60 overflow-auto">
                  {startSug.map((s, i) => (
                    <div 
                      key={i} 
                      className="px-3 py-2 text-sm text-gray-800 hover:bg-pink-50 cursor-pointer transition-colors" 
                      onMouseDown={() => { 
                        setStartVal(s.label); 
                        setStartSug([]);
                        // Auto-set coordinates when suggestion is selected
                        setStartCoord({ lat: s.lat, lng: s.lon });
                      }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-3 text-pink-400 text-lg"><FaFlag /></span>
              <input
                id="endLocation"
                value={destVal}
                onChange={e => {
                  const v = e.target.value; setDestVal(v);
                  if (destDebRef.current) clearTimeout(destDebRef.current);
                  // Reduced debounce from 300ms to 150ms for faster search
                  destDebRef.current = setTimeout(async () => {
                    if (!v || v.length < 2) { setDestSug([]); return; }
                    try {
                      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(v)}&limit=5&filter=countrycode:in&apiKey=${apiKey}`;
                      const res = await fetch(url); 
                      if (!res.ok) throw new Error('Search failed');
                      const data = await res.json();
                      setDestSug((data.features||[]).map(f => ({ label: f.properties.formatted, lat: f.properties.lat, lon: f.properties.lon })));
                    } catch { setDestSug([]); }
                  }, 150);
                }}
                placeholder="Search destination location..."
                className="pl-10 pr-9 py-3 w-full rounded-xl border border-pink-200 text-gray-900 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
              />
              <span className="absolute right-3 top-3.5 text-pink-400 text-md cursor-pointer"><FaSearch /></span>
              {destSug.length > 0 && (
                <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-pink-200 rounded-xl shadow max-h-60 overflow-auto">
                  {destSug.map((s, i) => (
                    <div 
                      key={i} 
                      className="px-3 py-2 text-sm text-gray-800 hover:bg-pink-50 cursor-pointer transition-colors" 
                      onMouseDown={() => { 
                        setDestVal(s.label); 
                        setDestSug([]);
                        // Auto-set coordinates when suggestion is selected
                        setEndCoord({ lat: s.lat, lng: s.lon });
                      }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Removed route mode buttons per request; app will try safest first and fallback to shortest automatically */}
          <button
            id="startJourneyBtn"
            disabled={isLoading}
            className={`mt-2 w-full rounded-xl px-5 py-4 text-white text-lg font-bold shadow-md transition-all duration-200 ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95 cursor-pointer'
            }`}
            onClick={handleJourney}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding safest route...
              </span>
            ) : (
              'Start Journey'
            )}
          </button>
        </div>
        <div className="rounded-3xl border border-pink-200 shadow bg-white overflow-hidden">
          <div ref={mapContainerRef} style={{ minHeight: 380, minWidth: '100%' }} />
        </div>
        {/* Route Options with Scores */}
        {allRoutes.length > 0 && (
          <div className="mt-3 rounded-xl border border-pink-200 bg-white p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Available Routes</h3>
            <div className="space-y-2">
              {allRoutes.map((route, index) => {
                const isSafest = index === 0; // Routes are sorted by safety score
                // Compare routes by checking if they're the same object reference or have matching key properties
                const isSelected = selectedRouteForMaps && 
                  route === selectedRouteForMaps || (
                    Math.abs(route.safety_score - selectedRouteForMaps.safety_score) < 0.01 &&
                    Math.abs((route.distance_km || 0) - (selectedRouteForMaps.distance_km || 0)) < 0.01
                  );
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSafest 
                        ? 'border-green-500 bg-green-50' 
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSafest && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                            SAFEST
                          </span>
                        )}
                        <span className="text-sm font-semibold text-gray-700">
                          Route {index + 1}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        route.safety_score >= 70 ? 'text-green-600' :
                        route.safety_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {route.safety_score.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      {route.distance_km != null && (
                        <span>📏 {route.distance_km.toFixed(1)} km</span>
                      )}
                      {route.duration_min != null && (
                        <span>⏱️ {Math.round(route.duration_min)} min</span>
                      )}
                    </div>
                    {lastStart && lastEnd && (
                      <button
                        className={`w-full mt-2 rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedRouteForMaps(route);
                          // Open selected route in Google Maps
                          const url = `https://www.google.com/maps/dir/?api=1&origin=${lastStart.lat},${lastStart.lng}&destination=${lastEnd.lat},${lastEnd.lng}&travelmode=driving`;
                          window.open(url, '_blank', 'noopener');
                        }}
                      >
                        {isSelected ? '✓ Selected - Open in Maps' : 'Open This Route in Maps'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Route info + Google Maps button (for backwards compatibility) */}
        <div id="routeInfo" className="mt-3">
          {routeInfo && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-pink-200 bg-white px-4 py-3">
              <div className="text-sm text-gray-800 flex flex-wrap gap-3">
                {routeInfo.distanceKm != null && (
                  <span>Distance: {routeInfo.distanceKm.toFixed(1)} km</span>
                )}
                {routeInfo.durationMin != null && (
                  <span>Time: {Math.round(routeInfo.durationMin)} min</span>
                )}
                {routeInfo.safetyScore != null && (
                  <span className={`font-semibold ${
                    routeInfo.safetyScore >= 70 ? 'text-green-600' :
                    routeInfo.safetyScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Safety: {routeInfo.safetyScore.toFixed(1)}/100
                  </span>
                )}
              </div>
              {lastStart && lastEnd && selectedRouteForMaps && (
                <button
                  className="rounded-lg px-4 py-2 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                  onClick={() => {
                    // GOOGLE MAPS REDIRECT HANDLER - Use selected route
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${lastStart.lat},${lastStart.lng}&destination=${lastEnd.lat},${lastEnd.lng}&travelmode=driving`;
                    window.open(url, '_blank', 'noopener');
                  }}
                >Open Selected Route in Maps</button>
              )}
            </div>
          )}
        </div>
        {errorMsg && (
          <div className="mt-3 text-sm text-red-600">{errorMsg}</div>
        )}
      </div>
    </div>
  );
}

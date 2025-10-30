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
  const apiKey = '90ada7c794c2445185ce843bb63da847';
  const [mapReady, setMapReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  function handleJourney() {
    // For demo, mock geocode New Delhi
    const center = newDelhi;
    const start = startVal ? randomOffset(center, 0.014, 0.017) : null;
    const end = destVal ? randomOffset(center, 0.014, 0.017) : null;
    setStartCoord(start);
    setEndCoord(end);
    // Reset previous animation/route
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    setIsAnimating(false);
    setGeoRoute([]);
    setErrorMsg('');

    if (start && end) {
      // Fetch routing from Geoapify
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start.lat}%2C${start.lng}%7C${end.lat}%2C${end.lng}&mode=drive&apiKey=${apiKey}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          try {
            const geom = data?.features?.[0]?.geometry;
            if (!geom) { setErrorMsg('No route found.'); return; }
            let flattened = [];
            if (geom.type === 'MultiLineString') {
              flattened = (geom.coordinates || []).flat(1).map(([lon, lat]) => [lat, lon]);
            } else if (geom.type === 'LineString') {
              flattened = (geom.coordinates || []).map(([lon, lat]) => [lat, lon]);
            } else {
              setErrorMsg('Unknown route geometry type.');
              return;
            }
            if (flattened.length > 0) {
              setGeoRoute(flattened);
              // Draw route and animate
              const map = mapInstanceRef.current;
              if (!map) return;
              const addRouteToMap = () => {
                const lineCoords = flattened.map(([lat, lng]) => [lng, lat]);
                const lineGeoJSON = {
                  type: 'Feature',
                  geometry: { type: 'LineString', coordinates: lineCoords },
                  properties: {}
                };
                if (map.getSource(routeSourceIdRef.current)) {
                  map.getSource(routeSourceIdRef.current).setData(lineGeoJSON);
                } else {
                  map.addSource(routeSourceIdRef.current, { type: 'geojson', data: lineGeoJSON });
                  if (!map.getLayer('route-line')) {
                    map.addLayer({
                      id: 'route-line',
                      type: 'line',
                      source: routeSourceIdRef.current,
                      layout: { 'line-join': 'round', 'line-cap': 'round' },
                      paint: { 'line-color': '#2563eb', 'line-width': 6 }
                    });
                  }
                }
                // Fit bounds to route
                const lngs = lineCoords.map(c => c[0]);
                const lats = lineCoords.map(c => c[1]);
                const bounds = [
                  [Math.min(...lngs), Math.min(...lats)],
                  [Math.max(...lngs), Math.max(...lats)]
                ];
                map.fitBounds(bounds, { padding: 60, linear: true });

                // Point source for moving marker (circle)
                const startPoint = { type: 'Feature', geometry: { type: 'Point', coordinates: lineCoords[0] }, properties: {} };
                if (map.getSource(pointSourceIdRef.current)) {
                  map.getSource(pointSourceIdRef.current).setData(startPoint);
                } else {
                  map.addSource(pointSourceIdRef.current, { type: 'geojson', data: startPoint });
                  if (!map.getLayer('runner-circle')) {
                    map.addLayer({
                      id: 'runner-circle',
                      type: 'circle',
                      source: pointSourceIdRef.current,
                      paint: { 'circle-radius': 6, 'circle-color': '#0ea5e9', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' }
                    });
                  }
                }

                // Animate along the route (only if enough points)
                if (lineCoords.length > 1) {
                  setIsAnimating(true);
                  let idx = 0;
                  if (animTimerRef.current) clearInterval(animTimerRef.current);
                  animTimerRef.current = setInterval(() => {
                    idx = Math.min(idx + 1, lineCoords.length - 1);
                    const next = { type: 'Feature', geometry: { type: 'Point', coordinates: lineCoords[idx] }, properties: {} };
                    const src = map.getSource(pointSourceIdRef.current);
                    if (src) src.setData(next);
                    map.easeTo({ center: lineCoords[idx], duration: 450, easing: t => t });
                    if (idx >= lineCoords.length - 1) {
                      clearInterval(animTimerRef.current);
                      animTimerRef.current = null;
                      setIsAnimating(false);
                    }
                  }, 500);
                }
              };

              if (mapReady || (map && map.isStyleLoaded && map.isStyleLoaded())) {
                addRouteToMap();
              } else {
                const once = () => {
                  addRouteToMap();
                  map.off('load', once);
                };
                map.on('load', once);
              }
            }
          } catch (e) {
            console.error('Route parse error', e);
            setErrorMsg('Failed to parse route response.');
          }
        })
        .catch((e) => {
          console.error('Route fetch error', e);
          setErrorMsg('Failed to fetch route. Check API key/network.');
        });
    } else {
      // Clear route/point layers if present
      const map = mapInstanceRef.current;
      if (map) {
        if (map.getLayer('route-line')) map.removeLayer('route-line');
        if (map.getSource(routeSourceIdRef.current)) map.removeSource(routeSourceIdRef.current);
        if (map.getLayer('runner-circle')) map.removeLayer('runner-circle');
        if (map.getSource(pointSourceIdRef.current)) map.removeSource(pointSourceIdRef.current);
      }
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
                value={startVal}
                onChange={e => setStartVal(e.target.value)}
                placeholder="Search start location..."
                className="pl-10 pr-9 py-3 w-full rounded-xl border border-pink-200 text-gray-900 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
              />
              <span className="absolute right-3 top-3.5 text-pink-400 text-md cursor-pointer"><FaSearch /></span>
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-3 text-pink-400 text-lg"><FaFlag /></span>
              <input
                value={destVal}
                onChange={e => setDestVal(e.target.value)}
                placeholder="Search destination location..."
                className="pl-10 pr-9 py-3 w-full rounded-xl border border-pink-200 text-gray-900 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
              />
              <span className="absolute right-3 top-3.5 text-pink-400 text-md cursor-pointer"><FaSearch /></span>
            </div>
          </div>
          <button
            className="mt-2 w-full rounded-xl px-5 py-4 bg-blue-600 text-white text-lg font-bold shadow-md hover:bg-blue-700 transition"
            onClick={handleJourney}
          >
            Start journey
          </button>
        </div>
        <div className="rounded-3xl border border-pink-200 shadow bg-white overflow-hidden">
          <div ref={mapContainerRef} style={{ minHeight: 380, minWidth: '100%' }} />
        </div>
        {errorMsg && (
          <div className="mt-3 text-sm text-red-600">{errorMsg}</div>
        )}
      </div>
    </div>
  );
}

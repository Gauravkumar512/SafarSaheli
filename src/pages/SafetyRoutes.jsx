import { useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaWalking, FaFlag, FaSearch } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
const newDelhi = { lat: 28.6139, lng: 77.2090 };

const iconBlue = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@v1.1.1/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41],
});
const iconHospital = new L.DivIcon({
  html: '<span style="font-size: 1.5rem;">🏥</span>'
});
const iconPolice = new L.DivIcon({
  html: '<span style="font-size: 1.5rem;">👮‍♀️</span>'
});

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
  const [routes, setRoutes] = useState([]);
  const [safestRouteIdx, setSafestRouteIdx] = useState(null);
  const mapRef = useRef(null);

  function handleJourney() {
    // For demo, mock geocode New Delhi
    const center = newDelhi;
    const start = startVal ? randomOffset(center, 0.014, 0.017) : null;
    const end = destVal ? randomOffset(center, 0.014, 0.017) : null;
    setStartCoord(start);
    setEndCoord(end);
    if (start && end) {
      const rts = getMockRoutes(start, end);
      setRoutes(rts);
      const best = rts.reduce((idx, r, i, arr) => r.score > arr[idx].score ? i : idx, 0);
      setSafestRouteIdx(best);
    } else {
      setRoutes([]);
      setSafestRouteIdx(null);
    }
  }

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
          <MapContainer
            ref={mapRef}
            center={[newDelhi.lat, newDelhi.lng]}
            zoom={13}
            style={{ minHeight: 340, minWidth: '100%' }}
          >
            <TileLayer
              attribution='<a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Markers for start/destination */}
            {startCoord && <Marker position={[startCoord.lat, startCoord.lng]} icon={iconBlue}><Popup>Start</Popup></Marker>}
            {endCoord && <Marker position={[endCoord.lat, endCoord.lng]} icon={iconBlue}><Popup>Destination</Popup></Marker>}
            {/* Safest route in green, others in grey */}
            {routes.map((r, i) => (
              <Polyline
                key={i}
                positions={r.polyline.map(p => [p.lat, p.lng])}
                color={i === safestRouteIdx ? '#16a34a' : '#a3a3a3'}
                weight={i === safestRouteIdx ? 7 : 6}
                opacity={i === safestRouteIdx ? 0.8 : 0.4}
                dashArray={i === safestRouteIdx ? null : '6'}
              />
            ))}
            {/* Place markers along safest route */}
            {routes[safestRouteIdx]?.polyline && getNearbyMarkers(routes[safestRouteIdx].polyline).map((m, idx) => (
              <Marker position={[m.lat, m.lng]} icon={m.icon} key={`${m.type}-${idx}`}>
                <Popup>{m.type === 'hospital' ? 'Hospital' : 'Police Station'} nearby</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {/* Route safety score legend */}
        {routes.length > 0 && (
          <div className="mt-5 flex flex-col gap-1">
            <div className="text-gray-700 font-semibold text-base mb-1">Route Safety Scores</div>
            <div className="flex gap-4">
              {routes.map((r, i) => (
                <div key={i} className={`flex-1 px-4 py-2 rounded-xl font-bold text-center border ${i === safestRouteIdx ? 'bg-green-100 border-green-400 text-green-900' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                  Route {i+1}: {r.score}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-2">(Safest route shown in green, others for comparison only)</div>
          </div>
        )}
      </div>
    </div>
  );
}

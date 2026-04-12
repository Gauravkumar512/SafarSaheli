import { useEffect, useState, useCallback } from 'react';
import Spinner from '../components/Spinner';
import PlaceCard from '../components/PlaceCard';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

const categories = [
  { id: 'hospital',  icon: '🏥', label: 'Hospital',  geo: 'healthcare.hospital' },
  { id: 'hotel',     icon: '🏨', label: 'Hotel',     geo: 'accommodation.hotel' },
  { id: 'police',    icon: '👮', label: 'Police',    geo: 'service.police' },
  { id: 'washroom',  icon: '🚻', label: 'Washroom',  geo: 'amenity.toilets' },
  { id: 'pharmacy',  icon: '💊', label: 'Pharmacy',  geo: 'healthcare.pharmacy' },
  { id: 'metro',     icon: '🚇', label: 'Metro',     geo: 'public_transport.subway' },
];

/** Haversine distance in meters */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Safety() {
  const [userPos, setUserPos] = useState(null);      // { lat, lng }
  const [locStatus, setLocStatus] = useState('loading'); // loading | granted | denied
  const [activeCat, setActiveCat] = useState(null);
  const [places, setPlaces] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // ---- Get location on mount ----
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('granted');
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ---- Fetch places when category or position changes ----
  const fetchPlaces = useCallback(async (catId) => {
    if (!userPos || !catId) return;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    setFetching(true);
    setFetchError('');
    setPlaces([]);

    try {
      const url =
        `https://api.geoapify.com/v2/places` +
        `?categories=${cat.geo}` +
        `&filter=circle:${userPos.lng},${userPos.lat},2000` +
        `&limit=6` +
        `&apiKey=${GEOAPIFY_KEY}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      const mapped = (data.features || [])
        .map((f) => {
          const p = f.properties || {};
          return {
            id: p.place_id || f.id || Math.random().toString(36).slice(2),
            name: p.name || p.address_line1 || '',
            address: p.formatted || p.address_line2 || '',
            phone: p.contact?.phone || p.datasource?.raw?.phone || null,
            lat: p.lat,
            lng: p.lon,
            distance: haversine(userPos.lat, userPos.lng, p.lat, p.lon),
          };
        })
        .sort((a, b) => a.distance - b.distance);

      setPlaces(mapped);
    } catch (e) {
      setFetchError(e.message || 'Failed to fetch places');
    } finally {
      setFetching(false);
    }
  }, [userPos]);

  useEffect(() => {
    if (activeCat && userPos) fetchPlaces(activeCat);
  }, [activeCat, userPos, fetchPlaces]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl text-pink-700 shrink-0">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Safety &amp; Hygiene
              </h1>
              <p className="mt-0.5 text-sm text-gray-600">
                Find verified safe places around you
              </p>
            </div>
          </div>
        </div>

        {/* Location status */}
        {locStatus === 'loading' && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-pink-50 border border-pink-200 p-3 text-sm text-pink-700">
            <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
            📍 Getting your location...
          </div>
        )}
        {locStatus === 'denied' && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            📍 Please enable location access to find safe places near you.
            <button
              onClick={() => window.location.reload()}
              className="ml-3 underline font-semibold hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Category grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {categories.map((cat) => {
            const isActive = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                disabled={locStatus !== 'granted'}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? 'border-pink-500 bg-pink-50 shadow-md scale-[1.03]'
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/40'
                }`}
              >
                <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                <span className={`text-xs sm:text-sm font-semibold ${isActive ? 'text-pink-700' : 'text-gray-700'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        {!activeCat && locStatus === 'granted' && (
          <div className="rounded-2xl border border-dashed border-pink-300 bg-pink-50/50 p-10 text-center text-gray-500">
            <p className="text-lg mb-1">👆</p>
            <p className="font-semibold text-gray-700">Select a category above</p>
            <p className="text-sm">to find safe places within 2 km</p>
          </div>
        )}

        {fetching && <Spinner label="Finding safe places near you..." />}

        {fetchError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-3xl mb-2">😕</p>
            <p className="font-semibold text-red-700 mb-1">Something went wrong</p>
            <p className="text-sm text-red-600 mb-3">{fetchError}</p>
            <button
              onClick={() => fetchPlaces(activeCat)}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        )}

        {!fetching && !fetchError && activeCat && places.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-semibold text-gray-700 mb-1">
              No {categories.find((c) => c.id === activeCat)?.label || 'places'} found within 2 km
            </p>
            <p className="text-sm">Try a different category or expand your search area.</p>
          </div>
        )}

        {!fetching && places.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place, idx) => (
              <PlaceCard
                key={place.id}
                place={place}
                userLat={userPos.lat}
                userLng={userPos.lng}
                isNearest={idx === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
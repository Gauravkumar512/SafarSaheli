import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG pin icon (outline pin with inner circle)
const pinIcon = new L.DivIcon({
  className: '',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s-7-5.373-7-12a7 7 0 1 1 14 0c0 6.627-7 12-7 12z" fill="#ffffff"/>
      <circle cx="12" cy="10" r="3" fill="#ffffff" />
    </svg>
  `,
  iconSize: [26, 34],
  iconAnchor: [13, 34],
  popupAnchor: [0, -30]
});

const categories = [
  { type: 'hospital', icon: '🏥', name: 'Hospital', overpass: 'amenity=hospital' },
  { type: 'lodging', icon: '🏨', name: 'Hotel', overpass: 'tourism=hotel' },
  { type: 'police', icon: '👮‍♀️', name: 'Police', overpass: 'amenity=police' },
  // Washrooms: include public toilets and places with toilets=yes (private access in venues)
  { type: 'washroom', icon: '🚻', name: 'Washroom', overpass: ['amenity=toilets', 'toilets=yes'] }
];

// 🔍 Using a 10 km radius now
function getOverpassQuery({ lat, lng }, kv) {
  const filters = Array.isArray(kv) ? kv : [kv];
  const blocks = filters.map(f => `
      node[${f}](around:10000,${lat},${lng});
      way[${f}](around:10000,${lat},${lng});
      rel[${f}](around:10000,${lat},${lng});
  `).join('\n');
  return `
    [out:json][timeout:25];
    (
      ${blocks}
    );
    out center;
  `;
}

function FlyTo({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 15);
  }, [pos, map]);
  return null;
}

function FitToPlaces({ places }) {
  const map = useMap();
  useEffect(() => {
    if (!places || places.length === 0) return;
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.15));
  }, [places, map]);
  return null;
}

export default function GoogleMap() {
  const [center, setCenter] = useState(null);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [places, setPlaces] = useState({});
  const [loading, setLoading] = useState(false);

  async function ensureLocationAndSet(cat) {
    setActiveCat(cat);
    setPlaces(ps => ({ ...ps, [cat]: undefined }));
    setError('');
    setLoading(true);
    try {
      if (!center) {
        await new Promise((res, rej) => {
          if (!navigator.geolocation) return rej('No Geolocation support');
          navigator.geolocation.getCurrentPosition(
            pos => {
              setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              res();
            },
            () => {
              setError('Location permission is required to show nearby places.');
              setLoading(false);
              rej();
            },
            { timeout: 10000 }
          );
        });
      }
    } catch {
      setLoading(false);
      return;
    }
  }

  useEffect(() => {
    if (!activeCat || !center) return;
    setLoading(true);
    setError('');
    const catData = categories.find(c => c.type === activeCat);
    if (!catData) return;
    const url = 'https://overpass-api.de/api/interpreter';
    const body = getOverpassQuery(center, catData.overpass);

    fetch(url, { method: 'POST', body })
      .then(r => r.json())
      .then(data => {
        const locs = (data.elements || []).map(e => ({
          id: e.id,
          lat: e.lat || e.center?.lat,
          lng: e.lon || e.center?.lon,
          tags: e.tags || {},
        })).filter(e => e.lat && e.lng).slice(0, 50); // increased max results
        setPlaces(ps => ({ ...ps, [activeCat]: locs }));
        setLoading(false);
      })
      .catch(() => {
        setError('Could not fetch locations. Try refreshing or check your connection.');
        setLoading(false);
      });
  }, [center, activeCat]);

  return (
    <div>
      <div className="rounded-3xl border border-pink-200 bg-white shadow-md mb-6 overflow-hidden">
        <div className="flex flex-wrap gap-2 p-3 border-b border-pink-100 bg-pink-50/40 justify-center">
          {categories.map(c => (
            <button
              key={c.type}
              onClick={() => ensureLocationAndSet(c.type)}
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-2 text-base font-semibold transition-all
                ${activeCat === c.type
                  ? 'border-pink-500 bg-pink-100 text-pink-700 shadow'
                  : 'border-pink-200 bg-white text-pink-600 hover:bg-pink-50'}`}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
        <div className="h-72 sm:h-96 relative">
          {(!activeCat || !center) && (
            <div className="absolute inset-0 flex items-center justify-center text-pink-600 bg-pink-50 font-medium">
              {loading
                ? 'Detecting location...'
                : error
                  ? error
                  : 'Select a location type above to find places near you.'}
            </div>
          )}
          {center && (
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={15}
              className="h-72 sm:h-96 w-full rounded-b-3xl z-0"
              dragging={!!activeCat}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              zoomControl={false}
              attributionControl={true}
            >
              <FlyTo pos={center} />
              <TileLayer
                attribution='<a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {(() => {
                const visible = activeCat === 'washroom' ? (places[activeCat] || []) : (places[activeCat] || []).filter(p => p.tags?.name);
                return (
                  <>
                    <FitToPlaces places={visible} />
                    {visible.map((p) => (
                      <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon}>
                        <Popup>
                          <div style={{ minWidth: 120 }}>
                            {p.tags.name && (<b>{p.tags.name}</b>)}
                            <div className="text-xs text-gray-700 mt-1">
                              {p.tags['addr:street']}&nbsp;{p.tags['addr:housenumber']}<br />
                              {p.tags['addr:city'] || ''}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                );
              })()}
            </MapContainer>
          )}
        </div>
      </div>
      {activeCat && center && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading && <div className="text-center text-pink-500 py-12">Searching nearby places...</div>}
          {!loading && (!places[activeCat] || places[activeCat].length === 0) && (
            <div className="text-center text-gray-600 py-10">No results found close by.</div>
          )}
          {(() => {
            const visible = activeCat === 'washroom' ? (places[activeCat] || []) : (places[activeCat] || []).filter(p => p.tags?.name);
            return visible.map((p) => (
            <div key={p.id} className="rounded-2xl border border-pink-200 bg-white p-4 shadow group hover:border-pink-300">
              <div className="font-bold text-pink-700 mb-0.5 flex items-center gap-1">
                {p.tags.name || ''}
              </div>
              <div className="text-gray-600 text-xs mb-2">{p.tags['addr:street']} {p.tags['addr:housenumber']} {p.tags['addr:city']}</div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=19/${p.lat}/${p.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-block mt-1 text-xs rounded-full border border-pink-200 px-2 py-1 text-pink-600 hover:bg-pink-50 transition"
              >View on OpenStreetMap →</a>
            </div>
          )) })()}
        </div>
      )}
    </div>
  );
}

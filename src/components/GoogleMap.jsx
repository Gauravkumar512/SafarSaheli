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

// 🔍 Using a 8 km radius (maximum)
function getOverpassQuery({ lat, lng }, kv) {
  const filters = Array.isArray(kv) ? kv : [kv];
  const blocks = filters.map(f => `
      node[${f}](around:8000,${lat},${lng});
      way[${f}](around:8000,${lat},${lng});
      rel[${f}](around:8000,${lat},${lng});
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

function FlyToSelectedPlace({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) {
      map.flyTo([pos.lat, pos.lng], 16, {
        animate: true,
        duration: 1.5
      });
    }
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
  const [selectedPlace, setSelectedPlace] = useState(null); // Selected place to show on map
  const [selectedPlaceCoords, setSelectedPlaceCoords] = useState(null); // Geocoded coordinates
  
  // Geoapify API key (same as used in SafetyRoutes)
  const geoapifyApiKey = 'd188108bd5574dddaa900e8036d19f2a';

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

  // Geocode a place using Geoapify
  async function geocodePlace(place) {
    try {
      // Build search query from place name and address
      const name = place.tags?.name || '';
      const street = place.tags?.['addr:street'] || '';
      const city = place.tags?.['addr:city'] || 'Delhi';
      const searchQuery = `${name} ${street} ${city}`.trim();
      
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&limit=1&filter=countrycode:in&apiKey=${geoapifyApiKey}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await res.json();
      const feature = data.features?.[0];
      
      if (feature) {
        return {
          lat: feature.properties.lat,
          lng: feature.properties.lon,
          formatted: feature.properties.formatted
        };
      }
      
      // Fallback to original coordinates if geocoding fails
      return {
        lat: place.lat,
        lng: place.lng,
        formatted: name
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback to original coordinates
      return {
        lat: place.lat,
        lng: place.lng,
        formatted: place.tags?.name || 'Location'
      };
    }
  }

  // Handle place click
  async function handlePlaceClick(place) {
    setSelectedPlace(place);
    setLoading(true);
    
    try {
      // Geocode the place to get accurate coordinates
      const coords = await geocodePlace(place);
      setSelectedPlaceCoords(coords);
    } catch (error) {
      console.error('Error geocoding place:', error);
      // Use original coordinates as fallback
      setSelectedPlaceCoords({
        lat: place.lat,
        lng: place.lng,
        formatted: place.tags?.name || 'Location'
      });
    } finally {
      setLoading(false);
    }
  }

  // Open in Google Maps with navigation
  function openInGoogleMaps(place, coords) {
    if (!coords) {
      // Fallback to original coordinates
      const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`;
      window.open(url, '_blank', 'noopener');
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener');
  }

  useEffect(() => {
    if (!activeCat || !center) return;
    setLoading(true);
    setError('');
    setSelectedPlace(null);
    setSelectedPlaceCoords(null);
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
        })).filter(e => e.lat && e.lng).slice(0, 6); // Maximum 6 results
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
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-2 text-base font-semibold transition-all cursor-pointer
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
              <FlyToSelectedPlace pos={selectedPlaceCoords} />
              <TileLayer
                attribution='<a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {(() => {
                const visible = activeCat === 'washroom' ? (places[activeCat] || []) : (places[activeCat] || []).filter(p => p.tags?.name);
                return (
                  <>
                    {!selectedPlaceCoords && <FitToPlaces places={visible} />}
                    {visible.map((p) => {
                      const isSelected = selectedPlace && selectedPlace.id === p.id;
                      return (
                        <Marker 
                          key={p.id} 
                          position={[p.lat, p.lng]} 
                          icon={pinIcon}
                        >
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
                      );
                    })}
                    {/* Highlight selected place with a different marker */}
                    {selectedPlaceCoords && (
                      <Marker 
                        position={[selectedPlaceCoords.lat, selectedPlaceCoords.lng]}
                        icon={new L.DivIcon({
                          className: '',
                          html: `
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 22s-7-5.373-7-12a7 7 0 1 1 14 0c0 6.627-7 12-7 12z" fill="#ef4444" fill-opacity="0.3"/>
                              <circle cx="12" cy="10" r="4" fill="#ef4444"/>
                            </svg>
                          `,
                          iconSize: [32, 40],
                          iconAnchor: [16, 40],
                          popupAnchor: [0, -40]
                        })}
                      >
                        <Popup>
                          <div style={{ minWidth: 150 }}>
                            <b className="text-red-600">{selectedPlace?.tags?.name || 'Selected Location'}</b>
                            <div className="text-xs text-gray-700 mt-1">
                              {selectedPlaceCoords.formatted}
                            </div>
                            <button
                              onClick={() => openInGoogleMaps(selectedPlace, selectedPlaceCoords)}
                              className="mt-2 w-full rounded-lg px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer transition"
                            >
                              Navigate in Google Maps
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    )}
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
            return visible.map((p) => {
              const isSelected = selectedPlace && selectedPlace.id === p.id;
              return (
                <div 
                  key={p.id} 
                  className={`rounded-2xl border p-4 shadow group transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                      : 'border-pink-200 bg-white hover:border-pink-300 hover:shadow-md'
                  }`}
                  onClick={() => handlePlaceClick(p)}
                >
                  <div className={`font-bold mb-0.5 flex items-center gap-1 ${
                    isSelected ? 'text-red-700' : 'text-pink-700'
                  }`}>
                    {p.tags.name || ''}
                    {isSelected && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Selected</span>}
                  </div>
                  <div className="text-gray-600 text-xs mb-2">
                    {p.tags['addr:street']} {p.tags['addr:housenumber']} {p.tags['addr:city']}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInGoogleMaps(p, selectedPlace && selectedPlace.id === p.id ? selectedPlaceCoords : null);
                      }}
                      className="text-xs rounded-lg px-3 py-1.5 bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer transition"
                    >
                      Navigate in Google Maps
                    </button>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=19/${p.lat}/${p.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block text-xs rounded-lg border border-pink-200 px-3 py-1.5 text-pink-600 hover:bg-pink-50 transition cursor-pointer"
                    >
                      View on OSM →
                    </a>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

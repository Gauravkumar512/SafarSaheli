import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { categories } from '../../demoData';

function isVerified(p) {
  return p.upvotes > 10 && p.downvotes < 3;
}

export default function Safety() {
  const { safetyPlaces, setSafetyPlaces, loggedInUser } = useApp();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('map');
  const [showAdd, setShowAdd] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', category: categories[0], lat: '', lng: '' });

  const filtered = useMemo(() => safetyPlaces.filter(p => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q)
    );
  }), [safetyPlaces, query]);

  const vote = (id, type) => {
    setSafetyPlaces(prev => prev.map(p => p.id === id ? { ...p, [type]: (p[type] || 0) + 1 } : p));
  };

  const addPlace = (e) => {
    e.preventDefault();
    const id = 'p' + Math.random().toString(36).slice(2, 8);
    const place = {
      id,
      name: newPlace.name.trim(),
      category: newPlace.category,
      lat: parseFloat(newPlace.lat) || 0,
      lng: parseFloat(newPlace.lng) || 0,
      upvotes: 0,
      downvotes: 0,
      addedBy: loggedInUser?.id,
    };
    if (!place.name) return;
    setSafetyPlaces(prev => [place, ...prev]);
    setShowAdd(false);
    setNewPlace({ name: '', category: categories[0], lat: '', lng: '' });
  };

  const mapSrc = useMemo(() => {
    const center = filtered[0] || { lat: 28.6139, lng: 77.2090 };
    const q = filtered.length ? `${center.lat},${center.lng}` : 'New Delhi';
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=12&output=embed`;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-green-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 pb-28">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-2xl">🛡️</div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Safety & Hygiene</h1>
              <p className="mt-1 text-gray-600">Find verified safe places around you</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl border border-white/40 bg-white/80 p-5 sm:p-8 shadow-xl backdrop-blur-sm mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {['Hotel','Hospital','Police','Washroom'].map(c => (
              <button key={c} onClick={() => { setQuery(c); setView('list'); }} className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Controls Card */}
        <div className="rounded-3xl border border-white/40 bg-white/80 p-5 sm:p-8 shadow-xl backdrop-blur-sm mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span>🔍</span> Search places or categories
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Hotel, Police, Washroom, Medico"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>
            <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
              <button
                onClick={() => setView('map')}
                className={`px-6 py-3 font-semibold transition ${
                  view === 'map'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🗺️ Map
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-6 py-3 font-semibold transition ${
                  view === 'list'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Map or List View */}
        {view === 'map' ? (
          <div className="rounded-3xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-sm overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
              <p className="text-sm text-gray-600">Click on markers to see details</p>
            </div>
            <iframe
              title="Safety Map"
              src={mapSrc}
              className="w-full h-[400px]"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {filtered.map((place, index) => (
              <div
                key={place.id}
                className={`rounded-3xl border p-6 shadow-lg transition hover:shadow-2xl ${
                  isVerified(place) ? 'border-emerald-300 bg-white/90' : 'border-yellow-300 bg-white/80'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{place.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isVerified(place)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isVerified(place) ? '✅ Verified' : '⚠️ Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>🏷️ {place.category}{place.type ? ` — ${place.type}` : ''}</span>
                      <span className="text-gray-300">•</span>
                      <span>📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => vote(place.id, 'upvotes')}
                      className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:scale-105"
                    >
                      <span>👍</span>
                      <span>{place.upvotes || 0}</span>
                    </button>
                    <button
                      onClick={() => vote(place.id, 'downvotes')}
                      className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100 hover:scale-105"
                    >
                      <span>👎</span>
                      <span>{place.downvotes || 0}</span>
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Added by {place.addedBy === loggedInUser?.id ? 'You' : 'Community'}
                  </div>
                </div>
              </div>
            ))}

            {!filtered.length && (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-gray-600">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No places found</h3>
                <p>Try searching for a different location or add a new place</p>
              </div>
            )}
          </div>
        )}

        {/* Add Place Button */}
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-6 py-4 text-white shadow-2xl transition hover:scale-105 hover:shadow-3xl z-40"
        >
          <span className="text-xl mr-2">+</span>
          Add Place
        </button>

        {/* Add Place Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add Safe Place</h2>
                <p className="text-gray-600 mt-2">Help the community by adding a verified safe location</p>
              </div>

              <form onSubmit={addPlace} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Place Name</label>
                  <input
                    value={newPlace.name}
                    onChange={(e) => setNewPlace(v => ({ ...v, name: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 p-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                    placeholder="Enter place name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Category</label>
                  <select
                    value={newPlace.category}
                    onChange={(e) => setNewPlace(v => ({ ...v, category: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 p-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Latitude</label>
                    <input
                      value={newPlace.lat}
                      onChange={(e) => setNewPlace(v => ({ ...v, lat: e.target.value }))}
                      className="w-full rounded-xl border-2 border-gray-200 p-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                      placeholder="28.6139"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Longitude</label>
                    <input
                      value={newPlace.lng}
                      onChange={(e) => setNewPlace(v => ({ ...v, lng: e.target.value }))}
                      className="w-full rounded-xl border-2 border-gray-200 p-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                      placeholder="77.2090"
                      type="number"
                      step="any"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold hover:from-emerald-600 hover:to-lime-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add Place
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
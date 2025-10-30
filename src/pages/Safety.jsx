import LeafletMap from '../components/GoogleMap';
// ...existing imports...

export default function Safety() {
  // ...keep only the header, remove custom search/cards/list/map state...
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 pb-28">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl text-pink-700"><span role="img" aria-label="Shield">🛡️</span></div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Safety & Hygiene</h1>
              <p className="mt-1 text-gray-600">Find verified safe places around you</p>
            </div>
          </div>
        </div>
        {/* Pink Leaflet/OSM map & results only */}
        <LeafletMap />
      </div>
    </div>
  );
}
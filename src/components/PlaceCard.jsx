/**
 * PlaceCard — shows a nearby place result with name, address, distance,
 * and action buttons (Navigate, Call).
 */
export default function PlaceCard({ place, userLat, userLng, isNearest = false }) {
  const { name, address, distance, phone, lat, lng } = place;

  const distanceLabel = distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(1)} km`;

  const navigateUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${lat},${lng}`;

  return (
    <div className="rounded-2xl border border-pink-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">{name || 'Unknown Place'}</h3>
            {isNearest && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full border border-green-200">
                Nearest
              </span>
            )}
          </div>
          {address && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{address}</p>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600">
            📍 {distanceLabel}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <a
          href={navigateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600 active:scale-95"
        >
          🧭 Navigate
        </a>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 active:scale-95"
          >
            📞 Call
          </a>
        )}
      </div>
    </div>
  );
}

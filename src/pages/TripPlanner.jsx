import { useState } from 'react';
import { demoTrips } from '../../demoData';
import { generateItinerary } from '../services/ai';
import { FiMapPin, FiCalendar, FiDollarSign, FiStar, FiUsers, FiBookmark, FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';

export default function TripPlanner() {
  const [destination, setDestination] = useState('');
  // Keep user-editable strings for inputs; parse on submit to avoid forced values
  const [daysText, setDaysText] = useState('3');
  const [budgetText, setBudgetText] = useState('15000');
  const [style, setStyle] = useState('Mid-Range');
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [structured, setStructured] = useState([]);
  const interestKeywords = {
    Adventure: ['adventure', 'trek', 'hike', 'rafting', 'zipline', 'paragliding', 'camp'],
    Culture: ['culture', 'temple', 'palace', 'heritage', 'museum', 'folk', 'festival'],
    Food: ['food', 'cafe', 'restaurant', 'street food', 'breakfast', 'lunch', 'dinner'],
    Nature: ['park', 'lake', 'beach', 'garden', 'sunset point', 'waterfall', 'nature'],
    Shopping: ['market', 'bazaar', 'shopping', 'mall', 'souvenir'],
    Relaxation: ['spa', 'relax', 'leisure', 'chill', 'sunset', 'resort'],
    History: ['fort', 'monument', 'histor', 'ruins'],
    Art: ['art', 'gallery', 'craft', 'handicraft'],
    Photography: ['photo', 'viewpoint', 'photography', 'scenic', 'sunrise', 'sunset'],
    Wildlife: ['wildlife', 'sanctuary', 'safari', 'zoo'],
  };

  // Removed 'Budget' from travel style options as requested
  const allStyles = ['Mid-Range', 'Luxury', 'Homestay'];
  const allInterests = ['Adventure', 'Culture', 'Food', 'Nature', 'Shopping', 'Relaxation', 'History', 'Art', 'Photography', 'Wildlife'];

  const suggestions = demoTrips.filter(t => !destination || t.destination.toLowerCase().includes(destination.toLowerCase()));

  const toggleInterest = (i) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.concat(i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const days = Math.max(1, parseInt(daysText || '1', 10));
      const budget = Math.max(0, parseInt(budgetText || '0', 10));
      const request = {
        destination,
        days,
        budget,
        style,
        interests,
      };
      const raw = await generateItinerary(request);
      const text = normalizeCurrency(raw);
      setAiPlan(text);
      setStructured(parseItinerary(text));
    } catch (err) {
      setAiPlan(`There was a problem generating the itinerary. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  function parseItinerary(text) {
    if (!text) return [];
    const clean = (t) => t
      .replace(/^([#>*`~_\-+]+)\s*/g, '')
      .replace(/^\d+\.\s*/g, '')
      .replace(/[`*_]{1,}/g, '')
      .trim();
    const lines = text.split(/\r?\n/);
    const sections = [];
    let current = null;
    const dayHeader = /^\s*(day\s*\d+[^:]*):?/i;
    lines.forEach(raw => {
      const line = clean(raw.trim());
      if (!line) return;
      const m = line.match(dayHeader);
      if (m) {
        const title = clean(m[1]).replace(/\s+/g, ' ').replace(/(^.)(.*)/, (_, a, b) => a.toUpperCase() + b);
        current = { title, items: [], meta: {} };
        sections.push(current);
        return;
      }
      if (!current) {
        current = { title: 'Overview', items: [], meta: {} };
        sections.push(current);
      }
      const lower = line.toLowerCase();
      if (lower.startsWith('budget')) { current.meta.budget = line.replace(/^budget[:\-]\s*/i, ''); return; }
      if (lower.startsWith('safety')) { current.meta.safety = line.replace(/^safety[:\-]\s*/i, ''); return; }
      if (lower.startsWith('time')) { current.meta.time = line.replace(/^time[:\-]\s*/i, ''); return; }
      const bullet = clean(line.replace(/^[\-•\u2022]+\s*/, ''));
      current.items.push(bullet);
    });
    return sections;
  }

  function normalizeCurrency(t) {
    if (!t) return t;
    return t.replace(/[₹$]\s?/g, 'Rs ');
  }

  function categorizeByInterest(items) {
    const groups = {};
    const selected = interests?.length ? interests : Object.keys(interestKeywords);
    selected.forEach(i => { groups[i] = []; });
    const other = [];
    for (const it of items) {
      const low = it.toLowerCase();
      let matched = false;
      for (const i of selected) {
        const kws = interestKeywords[i] || [];
        if (kws.some(k => low.includes(k))) {
          groups[i].push(it);
          matched = true;
          break;
        }
      }
      if (!matched) other.push(it);
    }
    return { groups, other };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 pb-28">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl text-pink-700">✈️</div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">AI Trip Planner</h1>
              <p className="mt-1 text-gray-600">Get your personalized travel itinerary in minutes</p>
            </div>
          </div>
        </div>

        {/* Planner Card */}
        <div className="rounded-3xl border border-pink-200 bg-white p-5 sm:p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inputs Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiMapPin /> Where do you want to go?
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Agra, Jaipur, Goa"
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiCalendar /> How many days?
                </span>
                <input
                  type="number"
                  min={1}
                  value={daysText}
                  onChange={(e) => setDaysText(e.target.value)}
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiDollarSign /> Budget (Rs)
                </span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={budgetText}
                  onChange={(e) => setBudgetText(e.target.value)}
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">Travel Style</span>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-xl border-2 border-pink-200 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                >
                  {allStyles.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Accommodation chips */}
            <div>
              <div className="mb-2 text-sm font-semibold text-gray-700">Preferred Accommodation</div>
              <div className="flex flex-wrap gap-3">
                {allStyles.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      style === s
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-pink-200 bg-white text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests chips */}
            <div>
              <div className="mb-2 text-sm font-semibold text-gray-700">What interests you? (Select 3–5)</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {allInterests.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      interests.includes(i)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-pink-500 py-4 font-semibold text-white shadow-md transition hover:bg-pink-600 focus:outline-none focus:ring-4 focus:ring-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generating itinerary…' : 'Generate Trip Plan'}
            </button>
          </form>
        </div>

        {/* Suggestions */}
        <div className="mt-8">
          {structured.length ? (
            <div className="mb-8 overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">AI Itinerary</h2>
                <div className="text-sm text-gray-500">based on your preferences</div>
              </div>
              <div className="space-y-6">
                {structured.map((sec) => {
                  const { groups, other } = categorizeByInterest(sec.items);
                  const selected = interests?.length ? interests : Object.keys(groups);
                  return (
                    <div key={sec.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 text-center">
                        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-1 text-sm font-semibold text-pink-700 border border-pink-200">
                          {sec.title}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-600">
                          {sec.meta?.time && (<span className="inline-flex items-center gap-1"><FiClock /> {sec.meta.time}</span>)}
                          {sec.meta?.budget && (<span className="inline-flex items-center gap-1"><FiDollarSign /> {sec.meta.budget}</span>)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {selected.map((name) => (
                          <div key={name} className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                            <div className="mb-2 text-sm font-semibold text-gray-900">{name}</div>
                            <ul className="space-y-2 min-h-[2rem]">
                              {(groups[name] || []).length ? (
                                groups[name].map((it, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-800">
                                    <FiCheckCircle className="mt-0.5 text-emerald-500" />
                                    <span>{it}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500 text-sm">No items</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                      {!!other.length && (
                        <div className="mt-4 rounded-2xl bg-white border border-dashed border-gray-300 p-4">
                          <div className="text-sm font-semibold text-gray-900 mb-2">Other</div>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {other.map((it, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-700">
                                <FiCheckCircle className="mt-0.5 text-emerald-500" />
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sec.meta?.safety && (
                        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm inline-flex items-start gap-2">
                          <FiAlertTriangle className="mt-0.5" />
                          <span><span className="font-semibold">Safety tip:</span> {sec.meta.safety}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600">View raw response</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">{aiPlan}</pre>
              </details>
            </div>
          ) : (
            aiPlan && (
              <div className="mb-8 overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">AI Itinerary</h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{aiPlan}</pre>
              </div>
            )
          )}
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Suggested Trips</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {suggestions.map((trip) => (
              <div
                key={trip.id}
                className="overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition hover:shadow-2xl"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{trip.title}</h3>
                    <div className="text-pink-600">{trip.destination}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                    <FiStar /> {trip.rating}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-4">
                  <div className="inline-flex items-center gap-2"><FiCalendar /> <span>{trip.days} days</span></div>
                  <div className="inline-flex items-center gap-2"><FiDollarSign /> <span>{trip.budget}</span></div>
                  <div className="inline-flex items-center gap-2"><FiUsers /> <span>{trip.crowd || '—'}</span></div>
                  <div className="inline-flex items-center gap-2"><FiMapPin /> <span>India</span></div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-gray-600">{trip.description}</p>

                <div className="flex gap-3">
                  <button className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-cyan-600">
                    View Details
                  </button>
                  <button className="rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition hover:bg-gray-200">
                    <FiBookmark />
                  </button>
                </div>
              </div>
            ))}

            {!suggestions.length && (
              <div className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-gray-600">
                No trips found. Try searching for a different destination.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
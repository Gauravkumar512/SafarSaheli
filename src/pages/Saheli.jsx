import { useEffect, useRef, useState } from 'react';
import { chatWithGemini } from '../services/ai';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export default function Saheli() {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi, I am Saheli! Ask me anything about safe travel, tips, or routes. 🌸' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // ---- Location + time context ----
  const [userCity, setUserCity] = useState('');

  useEffect(() => {
    // Reverse-geocode user's position to get city name
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_KEY}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          const city =
            data.features?.[0]?.properties?.city ||
            data.features?.[0]?.properties?.county ||
            data.features?.[0]?.properties?.state ||
            '';
          if (city) setUserCity(city);
        } catch {
          // Ignore — city context is a nice-to-have
        }
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend(e) {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: 'user', text: trimmed }];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);

    // Build system context
    const currentTime = new Date().toLocaleString('en-IN', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const systemContext = `You are Saheli, a compassionate AI safety companion for women in India. You help with: safety tips, route advice, what to do in unsafe situations, nearby help resources. Current context: ${userCity ? `User is in ${userCity}` : 'User location unknown'}, current time is ${currentTime}. Always be warm, practical, and calm. Never be alarmist. Give actionable advice. If user seems to be in immediate danger, always tell them to call 112 (India emergency) first.`;

    try {
      const reply = await chatWithGemini(next.slice(-12), systemContext);
      const cleaned = String(reply).replace(/\*\*/g, '');
      setMessages((curr) => [...curr, { role: 'model', text: cleaned }]);
    } catch (e) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
        <div className="mb-4 rounded-2xl border border-pink-200 bg-pink-50/60 p-4">
          <h1 className="text-xl font-bold text-pink-700">Saheli</h1>
          <p className="text-sm text-pink-700/80">
            Your friendly women-safety travel companion.
            {userCity && <span className="ml-1 text-pink-500">📍 {userCity}</span>}
          </p>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-white shadow-sm">
          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pink-50/50 to-white"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`${
                    m.role === 'user' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-900'
                  } rounded-2xl px-4 py-2 max-w-[80%] whitespace-pre-wrap text-sm`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-pink-100 px-4 py-2 text-pink-900 text-sm flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
                  Typing…
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="border-t border-pink-200 bg-pink-50 px-4 py-2 text-sm text-pink-800">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-pink-200 bg-pink-50/60 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Saheli about safety tips, routes, or local info…"
              className="flex-1 rounded-xl border border-pink-300 bg-white px-4 py-3 text-sm outline-none placeholder-pink-400 focus:ring-2 focus:ring-pink-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 disabled:opacity-60 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { chatWithGemini } from '../services/ai';
import BottomNav from '../components/BottomNav';

export default function Saheli() {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi, I am Saheli! Ask me anything about safe travel, tips, or routes. 🌸' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

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
    try {
      const reply = await chatWithGemini(next.slice(-12));
      const cleaned = String(reply).replace(/\*\*/g, '');
      setMessages(curr => [...curr, { role: 'model', text: cleaned }]);
    } catch (e) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 rounded-2xl border border-pink-200 bg-pink-50/60 p-4">
          <h1 className="text-xl font-bold text-pink-700">Saheli</h1>
          <p className="text-sm text-pink-700/80">Your friendly women-safety travel companion.</p>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-white shadow-sm">
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pink-50/50 to-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-900'} rounded-2xl px-4 py-2 max-w-[80%] whitespace-pre-wrap`}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-pink-100 px-4 py-2 text-pink-900">Typing…</div>
              </div>
            )}
          </div>

          {error && (
            <div className="border-t border-pink-200 bg-pink-50 px-4 py-2 text-sm text-pink-800">{error}</div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pink-200 bg-pink-50/60 p-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Saheli about safety tips, routes, or local info…"
              className="flex-1 rounded-xl border border-pink-300 bg-white px-4 py-3 text-sm outline-none placeholder-pink-400 focus:ring-2 focus:ring-pink-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}



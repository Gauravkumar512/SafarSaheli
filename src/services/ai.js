export async function generateItinerary(input) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env file.');
  }

  const prompt = typeof input === 'string' ? input : JSON.stringify(input);

  // Try to discover available models dynamically, then call the first viable one
  async function listModels(apiVersion) {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ListModels ${apiVersion} failed: ${res.status}`);
    const data = await res.json();
    return (data.models || []).map(m => m.name?.replace(`models/`, ''));
  }

  const tried = [];
  let lastErrorText = '';

  const versions = ['v1', 'v1beta'];
  for (const version of versions) {
    try {
      const names = await listModels(version);
      const preferred = names.filter(n => /gemini-1\.5/i.test(n));
      const fallbacks = names.filter(n => /gemini/i.test(n) && !/1\.5/i.test(n));
      const candidates = [...preferred, ...fallbacks];

      for (const model of candidates) {
        tried.push(`${version}/${model}`);
        const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
        const res = await fetch(`${endpoint}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Create a concise day-by-day travel itinerary. Keep it readable with headings per day, bullets for activities, indicative budget ranges, and brief safety notes for women travelers.\nUser request:\n${prompt}`,
                  },
                ],
              },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
          return text.trim();
        }
        lastErrorText = await res.text().catch(() => '');
        if (!(res.status === 404 || res.status === 400)) {
          throw new Error(lastErrorText);
        }
      }
    } catch (e) {
      lastErrorText = String(e);
      // Try next version
    }
  }

  throw new Error(`Gemini API error after trying: ${tried.join(', ')}\n${lastErrorText || 'Unknown error'}`);
}


export async function chatWithGemini(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env file.');
  }

  const versions = ['v1', 'v1beta'];

  async function listModels(apiVersion) {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ListModels ${apiVersion} failed: ${res.status}`);
    const data = await res.json();
    return (data.models || []).map(m => m.name?.replace(`models/`, ''));
  }

  const tried = [];
  let lastErrorText = '';

  const contents = (messages || []).map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text || '') }],
  }));

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello!' }] });
  }

  for (const version of versions) {
    try {
      const names = await listModels(version);
      const preferred = names.filter(n => /gemini-1\.5/i.test(n));
      const fallbacks = names.filter(n => /gemini/i.test(n) && !/1\.5/i.test(n));
      const candidates = [...preferred, ...fallbacks];

      for (const model of candidates) {
        tried.push(`${version}/${model}`);
        const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
        const res = await fetch(`${endpoint}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
          return text.trim();
        }
        lastErrorText = await res.text().catch(() => '');
        if (!(res.status === 404 || res.status === 400)) {
          throw new Error(lastErrorText);
        }
      }
    } catch (e) {
      lastErrorText = String(e);
    }
  }

  throw new Error(`Gemini chat error after trying: ${tried.join(', ')}\n${lastErrorText || 'Unknown error'}`);
}


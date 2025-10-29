import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoUsers, demoSafetyPlaces, demoLeaderboard } from '../../demoData';

const STORAGE_KEYS = {
  user: 'safarsaheli:user',
  places: 'safarsaheli:places',
  theme: 'safarsaheli:theme',
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [safetyPlaces, setSafetyPlaces] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.places);
      const stored = raw ? JSON.parse(raw) : [];
      // Merge stored with latest demo places by unique name
      const byName = new Map(stored.map(p => [p.name, p]));
      for (const p of demoSafetyPlaces) {
        if (!byName.has(p.name)) byName.set(p.name, p);
      }
      return Array.from(byName.values());
    } catch {
      return demoSafetyPlaces;
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(STORAGE_KEYS.theme, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [loggedInUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.places, JSON.stringify(safetyPlaces));
  }, [safetyPlaces]);

  const login = (email, password) => {
    const match = demoUsers.find((u) => u.email === email && u.password === password);
    if (match) {
      const lb = demoLeaderboard.find((x) => x.id === match.id);
      setLoggedInUser({ id: match.id, name: match.name, email: match.email, age: match.age, points: lb?.points ?? 0 });
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials' };
  };

  const logout = () => setLoggedInUser(null);

  const value = useMemo(() => ({ loggedInUser, safetyPlaces, setSafetyPlaces, login, logout, theme, setTheme }), [loggedInUser, safetyPlaces, theme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

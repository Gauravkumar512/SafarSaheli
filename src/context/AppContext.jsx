import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoUsers, demoSafetyPlaces } from '../../demoData';

const STORAGE_KEYS = {
  user: 'safarsaheli:user',
  places: 'safarsaheli:places',
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
      return raw ? JSON.parse(raw) : demoSafetyPlaces;
    } catch {
      return demoSafetyPlaces;
    }
  });

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
      setLoggedInUser({ id: match.id, name: match.name, email: match.email });
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials' };
  };

  const logout = () => setLoggedInUser(null);

  const value = useMemo(() => ({ loggedInUser, safetyPlaces, setSafetyPlaces, login, logout }), [loggedInUser, safetyPlaces]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

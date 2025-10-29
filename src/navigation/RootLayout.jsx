import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

function ProtectedOutlet() {
  const { loggedInUser } = useApp();
  const location = useLocation();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // wait a tick so context can hydrate from localStorage
    const id = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!hydrated) return null;
  if (!loggedInUser) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <TopBar />
      <ProtectedOutlet />
    </div>
  );
}

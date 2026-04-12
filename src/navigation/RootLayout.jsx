import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

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
      {/* pb-24 on mobile for BottomNav clearance, pb-0 on desktop */}
      <div className="pb-24 md:pb-0">
        <ProtectedOutlet />
      </div>
      <BottomNav />
    </div>
  );
}

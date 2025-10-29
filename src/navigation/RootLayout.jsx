import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
      <BottomNav />
    </div>
  );
}

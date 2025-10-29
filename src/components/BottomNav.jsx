import { NavLink } from 'react-router-dom';
import { FaHome, FaRoute, FaShieldAlt, FaBell, FaUser } from 'react-icons/fa';

const tabs = [
  { to: '/', label: 'Home', icon: FaHome },
  { to: '/trip', label: 'Trip', icon: FaRoute },
  { to: '/safety', label: 'Safety', icon: FaShieldAlt },
  { to: '/sos', label: 'SOS', icon: FaBell },
  { to: '/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm z-50">
      <div className="max-w-5xl mx-auto grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex flex-col items-center justify-center py-2 text-xs ${isActive ? 'text-pink-600' : 'text-gray-500'}`}
          >
            <Icon className="text-lg" />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

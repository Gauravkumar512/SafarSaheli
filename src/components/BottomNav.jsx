import { NavLink } from 'react-router-dom';
import { FaHome, FaRoute, FaShieldAlt, FaBell, FaUser, FaComments } from 'react-icons/fa';

const tabs = [
  { to: '/home', label: 'Home', icon: FaHome },
  { to: '/trip', label: 'Trip', icon: FaRoute },
  { to: '/safety', label: 'Safety', icon: FaShieldAlt },
  { to: '/sos', label: 'SOS', icon: FaBell },
  { to: '/saheli', label: 'Saheli', icon: FaComments },
  { to: '/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-50">
      <div className="max-w-5xl mx-auto grid grid-cols-6">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="group py-3 px-2">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center text-xs transition-all duration-200">
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-pink-100 shadow-md text-pink-600' : 'group-hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}>
                  <Icon className={`text-lg transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                </div>
                <span className={`mt-1 font-medium transition-all duration-200 ${
                  isActive ? 'text-pink-600' : 'text-gray-500 group-hover:text-gray-700'
                }`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

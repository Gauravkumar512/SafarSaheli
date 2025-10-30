import { Link, NavLink } from 'react-router-dom';
import { FaHome, FaRoute, FaShieldAlt, FaBell, FaTrophy, FaHeart, FaUser, FaComments, FaHandHoldingHeart } from 'react-icons/fa';

const tabs = [
  { to: '/home', label: 'Home', icon: FaHome },
  { to: '/trip', label: 'Trip Planner', icon: FaRoute },
  { to: '/safety', label: 'Safety', icon: FaShieldAlt },
  { to: '/sos', label: 'SOS', icon: FaBell },
  { to: '/leaderboard', label: 'Leaderboard', icon: FaTrophy },
  { to: '/saheli', label: 'Saheli', icon: FaComments },
];

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white ring-1 ring-white/40">
            <FaHandHoldingHeart />
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest text-gray-500">SafarSaheli</div>
          </div>
        </Link>

        <nav className="hidden gap-2 md:flex">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"><FaHeart /> 1250</div>
          <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
            <FaUser />
          </Link>
        </div>
      </div>
    </header>
  );
}

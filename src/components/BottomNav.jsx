import { NavLink } from 'react-router-dom';
import { FaHome, FaShieldAlt, FaComments } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import { MdSos } from 'react-icons/md';

const tabs = [
  { to: '/home', label: 'Home', icon: FaHome },
  { to: '/routes', label: 'Routes', icon: FiMapPin },
  { to: '/safety', label: 'Safety', icon: FaShieldAlt },
  { to: '/sos', label: 'SOS', icon: MdSos, isSOS: true },
  { to: '/saheli', label: 'Saheli', icon: FaComments },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {tabs.map(({ to, label, icon: Icon, isSOS }) => (
          <NavLink key={to} to={to} className="group relative flex flex-col items-center py-2">
            {({ isActive }) => (
              <>
                {isSOS ? (
                  /* SOS — red pill, always prominent */
                  <div className="relative -mt-5 mb-0.5">
                    <div
                      className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-red-600 scale-110 ring-4 ring-red-200'
                          : 'bg-red-500 group-hover:bg-red-600 group-hover:scale-105'
                      }`}
                    >
                      <Icon className="text-white text-2xl" />
                    </div>
                  </div>
                ) : (
                  /* Normal tab */
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-pink-100 text-pink-600 shadow-sm'
                        : 'text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'
                    }`}
                  >
                    <Icon className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  </div>
                )}
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                    isSOS
                      ? isActive ? 'text-red-600' : 'text-red-500'
                      : isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

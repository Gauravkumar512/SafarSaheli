import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FiMapPin, FiShield, FiBell, FiAward, FiUser, FiMessageSquare, FiBookmark } from 'react-icons/fi';

export default function Home() {
  const { loggedInUser } = useApp();
  const cards = [
    { to: '/trip', title: 'Trip Planner', subtitle: 'Plan your journey', icon: FiMapPin, color: 'from-blue-500 to-cyan-500', hoverColor: 'hover:from-blue-600 hover:to-cyan-600' },
    { to: '/safety', title: 'Safety & Hygiene', subtitle: 'Find safe places', icon: FiShield, color: 'from-emerald-500 to-lime-500', hoverColor: 'hover:from-emerald-600 hover:to-lime-600' },
    { to: '/sos', title: 'SOS', subtitle: 'Emergency help', icon: FiBell, color: 'from-rose-500 to-pink-500', hoverColor: 'hover:from-rose-600 hover:to-pink-600' },
    { to: '/leaderboard', title: 'Leaderboard', subtitle: 'Community ranking', icon: FiAward, color: 'from-violet-500 to-purple-500', hoverColor: 'hover:from-violet-600 hover:to-purple-600' },
    { to: '/profile', title: 'Profile', subtitle: 'Your account', icon: FiUser, color: 'from-amber-500 to-orange-500', hoverColor: 'hover:from-amber-600 hover:to-orange-600' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="p-6 pb-24 max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="mb-10 overflow-hidden rounded-3xl border border-white/30 bg-white/70 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Travel safe. Explore confidently.
              </h1>
              <p className="mt-3 text-gray-700 max-w-prose">
                SafarSaheli helps women plan trips, share live location with trusted contacts, and
                find safer routes and nearby assistance—anytime, anywhere.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/sos"
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:from-pink-600 hover:to-purple-700"
                >
                  Set up Emergency Contacts
                </Link>
                <Link
                  to="/safety"
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Safer Places Near Me
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 to-purple-300/30" />
              <div className="h-full w-full" />
            </div>
          </div>
        </section>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hi {loggedInUser?.name || 'Traveler'} 👋
              </h1>
              <p className="text-gray-600 mt-1">Where are we going today?</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <FiShield className="text-white text-2xl" />
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-pink-600">12</div>
              <div className="text-sm text-gray-600">Safe Places</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-600">Trips Planned</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-indigo-600">1.2k</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <Link 
              key={card.to} 
              to={card.to} 
              className={`group relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br ${card.color} ${card.hoverColor} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/20 rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <card.icon className="text-4xl" />
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <FiBookmark className="text-lg text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{card.title}</h3>
                <p className="text-white/80 text-sm">{card.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Safety Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/90 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white">
                  <FiMapPin />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Share Live Location</div>
                  <div className="text-sm text-gray-600">Send to trusted contacts</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/90 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
                  <FiMessageSquare />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Report Unsafe Area</div>
                  <div className="text-sm text-gray-600">Help others stay safe</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/90 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
                  <FiShield />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Nearest Help</div>
                  <div className="text-sm text-gray-600">Police & medical around you</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
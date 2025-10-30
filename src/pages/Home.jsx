import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FiMapPin, FiShield, FiBell, FiAward, FiUser, FiMessageSquare, FiBookmark } from 'react-icons/fi';
import { FaCompass } from 'react-icons/fa';

export default function Home() {
  const { loggedInUser } = useApp();
  const cards = [
    { to: '/routes', title: 'Safety Routes', subtitle: 'See safest paths', icon: FaCompass },
    { to: '/trip', title: 'Trip Planner', subtitle: 'Plan your journey', icon: FiMapPin },
    { to: '/safety', title: 'Safety & Hygiene', subtitle: 'Find safe places', icon: FiShield },
    { to: '/sos', title: 'SOS', subtitle: 'Emergency help', icon: FiBell },
    { to: '/saheli', title: 'Saheli', subtitle: 'AI safety chatbot', icon: FiMessageSquare },
    { to: '/leaderboard', title: 'Leaderboard', subtitle: 'Community ranking', icon: FiAward },
    { to: '/profile', title: 'Profile', subtitle: 'Your account', icon: FiUser },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
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
              <div className="h-full w-full flex items-center justify-center p-10">
                <div className="relative max-w-md rounded-3xl border border-white/50 bg-white/70 backdrop-blur-md shadow-xl p-6">
                  <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-pink-300/30 blur-2xl" />
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-purple-300/30 blur-2xl" />
                  <p className="text-xl font-semibold leading-relaxed text-gray-900">
                    "Your safety is your superpower. We’re here with you, every step."
                  </p>
                  <p className="mt-3 text-sm font-medium text-pink-700">— SafarSaheli</p>
                </div>
              </div>
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
            <div className="bg-white rounded-2xl p-4 border border-pink-200 shadow-sm">
              <div className="text-2xl font-bold text-pink-600">12</div>
              <div className="text-sm text-gray-600">Safe Places</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-pink-200 shadow-sm">
              <div className="text-2xl font-bold text-pink-600">5</div>
              <div className="text-sm text-gray-600">Trips Planned</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-pink-200 shadow-sm">
              <div className="text-2xl font-bold text-pink-600">1.2k</div>
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
              className={`group relative overflow-hidden rounded-3xl p-6 bg-white border border-pink-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-pink-300`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <card.icon className="text-4xl text-pink-600" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-gray-900">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Safety Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-pink-200 hover:border-pink-300 hover:bg-pink-50/40 transition-colors shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-700">
                  <FiMapPin />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Share Live Location</div>
                  <div className="text-sm text-gray-600">Send to trusted contacts</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-pink-200 hover:border-pink-300 hover:bg-pink-50/40 transition-colors shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-700">
                  <FiMessageSquare />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Report Unsafe Area</div>
                  <div className="text-sm text-gray-600">Help others stay safe</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-pink-200 hover:border-pink-300 hover:bg-pink-50/40 transition-colors shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-700">
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
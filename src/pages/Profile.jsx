import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { demoUsers, demoLeaderboard } from '../../demoData';
import { FiUser, FiMail, FiAward, FiLogOut, FiSmartphone, FiBell, FiMoon, FiLock } from 'react-icons/fi';

export default function Profile() {
  const { loggedInUser, logout, theme, setTheme } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const stats = [
    { label: 'Safe Places Added', value: '12', color: 'from-emerald-400 to-green-500' },
    { label: 'Trips Planned', value: '5', color: 'from-blue-400 to-cyan-500' },
    { label: 'Community Points', value: ((loggedInUser?.points ?? (demoLeaderboard.find(x=>x.id===loggedInUser?.id)?.points ?? 0))).toLocaleString(), color: 'from-yellow-400 to-orange-500' },
    { label: 'Reviews Given', value: '8', color: 'from-purple-400 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="p-6 pb-24 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white">
              <FiUser className="text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center text-white">
              <FiUser className="text-3xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{loggedInUser?.name}</h2>
              <p className="text-gray-600">{loggedInUser?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">Verified User</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">Community Member</span>
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Name</div>
              <div className="text-lg font-semibold text-gray-900">{loggedInUser?.name || '—'}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Age</div>
              <div className="text-lg font-semibold text-gray-900">{loggedInUser?.age ?? (demoUsers.find(u=>u.id===loggedInUser?.id)?.age ?? '—')}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Email</div>
              <div className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2"><FiMail /> {loggedInUser?.email || '—'}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white font-semibold`}>
                  <FiAward />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* App Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">App Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={logout}
              className="flex items-center justify-center space-x-3 p-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 rounded-2xl font-semibold transition-all duration-200 hover:scale-105"
            >
              <FiLogOut className="text-xl" />
              <span>Logout</span>
            </button>
            
            <button 
              onClick={installApp} 
              disabled={!deferredPrompt || installed}
              className={`flex items-center justify-center space-x-3 p-4 rounded-2xl font-semibold transition-all duration-200 hover:scale-105 ${
                deferredPrompt && !installed
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiSmartphone className="text-xl" />
              <span>{installed ? 'Installed' : 'Install App'}</span>
            </button>
          </div>
        </div>

        {/* Saved Items */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Saved Items</h3>
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No saved items yet</h4>
            <p className="text-gray-600">Your saved trips and places will appear here</p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <FiBell className="text-xl" />
                <div>
                  <div className="font-semibold text-gray-900">Push Notifications</div>
                  <div className="text-sm text-gray-600">Get alerts for safety updates</div>
                </div>
              </div>
              <div className="w-12 h-6 bg-green-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
              </div>
            </div>
            
            {/* Dark mode removed per request */}
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <FiLock className="text-xl" />
                <div>
                  <div className="font-semibold text-gray-900">Privacy Settings</div>
                  <div className="text-sm text-gray-600">Manage your data privacy</div>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
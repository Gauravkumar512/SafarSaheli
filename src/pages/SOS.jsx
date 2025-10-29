import { useEffect, useState } from 'react';

const STORAGE_KEY = 'safarsaheli:sosContacts';

export default function SOS() {
  const [contacts, setContacts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [alertActive, setAlertActive] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const add = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setContacts(prev => [...prev, { 
      id: Math.random().toString(36).slice(2), 
      name: name.trim(), 
      phone: phone.trim() 
    }]);
    setName('');
    setPhone('');
  };

  const sendAlert = () => {
    setAlertActive(true);
    setMsg('Opening WhatsApp to send alerts...');

    const formatPhone = (raw) => {
      if (!raw) return '';
      const digits = String(raw).replace(/\D/g, '');
      if (!digits) return '';
      // If 10 digits, assume India and prefix +91. Otherwise, prefix + if missing.
      if (digits.length === 10) return `+91${digits}`;
      return digits.startsWith('0') ? `+91${digits.slice(1)}` : (digits.startsWith('91') ? `+${digits}` : `+${digits}`);
    };

    const openWhatsApp = (phone, text) => {
      const to = formatPhone(phone);
      const url = to ? `https://wa.me/${encodeURIComponent(to)}?text=${encodeURIComponent(text)}`
                     : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    const notifyAll = (text) => {
      if (!contacts.length) {
        openWhatsApp('', text);
        return;
      }
      contacts.forEach((c) => openWhatsApp(c.phone, text));
    };

    const complete = () => setTimeout(() => { setMsg(''); setAlertActive(false); }, 1500);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const maps = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const text = `Emergency alert from SafarSaheli. My live location: ${maps}`;
          notifyAll(text);
          complete();
        },
        () => {
          const text = 'Emergency alert from SafarSaheli. Please call me immediately.';
          notifyAll(text);
          complete();
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      const text = 'Emergency alert from SafarSaheli. Please call me immediately.';
      notifyAll(text);
      complete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 pb-28">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Emergency SOS</h1>
          <p className="mt-1 text-gray-600">Send your location to trusted contacts over WhatsApp</p>
        </div>

        {/* SOS Button Card */}
        <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-sm mb-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Alert</h2>
            <p className="text-gray-600">Press the button below to send your location to emergency contacts</p>
          </div>
          
          <button
            onClick={sendAlert}
            disabled={alertActive}
            className={`relative w-48 h-48 rounded-full text-white font-bold text-2xl transition-all duration-300 transform ${
              alertActive 
                ? 'bg-red-600 scale-95 shadow-inner' 
                : 'bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:scale-105'
            } disabled:cursor-not-allowed shadow-2xl hover:shadow-3xl`}
          >
            {alertActive ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                <span className="text-lg">Sending...</span>
              </div>
            ) : (
              <span className="text-xl font-semibold">Send WhatsApp Alert</span>
            )}
          </button>

          {msg && (
            <div className="mt-6 p-4 bg-red-100 border-2 border-red-300 rounded-2xl text-red-800 font-semibold animate-pulse">
              {msg}
            </div>
          )}
        </div>

        {/* Emergency Contacts Card */}
        <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Emergency Contacts</h3>
                <p className="text-gray-600">Add trusted contacts for emergency situations</p>
              </div>
            </div>

          {/* Add Contact Form */}
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Contact Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="rounded-xl border-2 border-gray-200 p-3 text-gray-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone"
                className="rounded-xl border-2 border-gray-200 p-3 text-gray-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                type="tel"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition hover:from-rose-600 hover:to-pink-600 hover:shadow-xl"
              >
                Add Contact
              </button>
            </div>
          </form>

          {/* Contacts List */}
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="group rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-gray-100 hover:shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white font-bold text-lg">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-100">
                      Call
                    </button>
                    <button
                      onClick={() => setContacts(prev => prev.filter(x => x.id !== contact.id))}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {!contacts.length && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No contacts added</h4>
                <p>Add emergency contacts to get help when you need it</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition hover:shadow-xl">
            <div className="font-semibold text-gray-900">Police</div>
            <div className="text-sm text-gray-600">Call 100</div>
          </div>
          
          <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition hover:shadow-xl">
            <div className="font-semibold text-gray-900">Medical</div>
            <div className="text-sm text-gray-600">Call 108</div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'safarsaheli:sosContacts';
const VEHICLE_KEY = 'safarsaheli:vehicleNumber';

export default function SOS() {
  // ---- contacts + vehicle state (preserved from original) ----
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
  const [vehicleNumber, setVehicleNumber] = useState(() => {
    try {
      return localStorage.getItem(VEHICLE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(VEHICLE_KEY, vehicleNumber);
  }, [vehicleNumber]);

  const add = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setContacts((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name: name.trim(), phone: phone.trim() },
    ]);
    setName('');
    setPhone('');
  };

  // ---- SOS flow state ----
  const [phase, setPhase] = useState('idle');
  // idle → countdown → capturing → sending → done
  const [countdown, setCountdown] = useState(3);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // blob URL
  const [capturedAudioUrl, setCapturedAudioUrl] = useState(null); // blob URL
  const [sosLocation, setSosLocation] = useState(null); // { lat, lng }
  const [sosError, setSosError] = useState('');

  const countdownRef = useRef(null);
  const streamRef = useRef(null);
  const photoBlobRef = useRef(null);
  const audioBlobRef = useRef(null);

  // ---- helpers ----
  const formatPhone = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+91${digits}`;
    return digits.startsWith('0')
      ? `+91${digits.slice(1)}`
      : digits.startsWith('91')
        ? `+${digits}`
        : `+${digits}`;
  };

  const openWhatsApp = (phoneNum, text) => {
    const to = formatPhone(phoneNum);
    const url = to
      ? `https://wa.me/${encodeURIComponent(to)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const buildMessage = (locationUrl, hasLocation) => {
    let message = '🚨 EMERGENCY ALERT from SafarSaheli\n\n';
    if (hasLocation && locationUrl) {
      message += `📍 My Location: ${locationUrl}\n`;
    } else {
      message += '📍 Location: Unable to get current location. Please call me immediately!\n';
    }
    if (vehicleNumber?.trim()) {
      message += `🚗 Vehicle Number: ${vehicleNumber.trim()}\n`;
    }
    message += `⏰ Time: ${new Date().toLocaleString('en-IN')}\n`;
    message += '\nPlease help immediately!';
    return message;
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ---- Cleanup helper ----
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ---- Cancel SOS ----
  const cancelSOS = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    stopStream();
    setPhase('idle');
    setCountdown(3);
    setSosError('');
  }, [stopStream]);

  // ---- Start SOS ----
  const startSOS = () => {
    setPhase('countdown');
    setCountdown(3);
    setSosError('');
    setCapturedPhoto(null);
    setCapturedAudioUrl(null);
    setSosLocation(null);
    photoBlobRef.current = null;
    audioBlobRef.current = null;

    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        doCapture();
      }
    }, 1000);
  };

  // ---- Capture photo + audio + location ----
  const doCapture = async () => {
    setPhase('capturing');

    // 1. Get location in parallel
    const locPromise = new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    // 2. Try to get camera + mic
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      streamRef.current = stream;
    } catch {
      // Fallback: try audio-only
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch {
        // No media access at all — continue with location only
        setSosError('Camera/microphone access denied. Sending location only.');
      }
    }

    // 3. Capture photo if we have video track
    const videoTrack = stream?.getVideoTracks()?.[0];
    if (videoTrack) {
      try {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        // Wait a moment for the camera to focus
        await new Promise((r) => setTimeout(r, 500));
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const photoBlob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
        photoBlobRef.current = photoBlob;
        setCapturedPhoto(URL.createObjectURL(photoBlob));
      } catch {
        // Photo capture failed — not critical
      }
    }

    // 4. Record 10 seconds of audio if we have audio track
    const audioTrack = stream?.getAudioTracks()?.[0];
    if (audioTrack) {
      try {
        const audioStream = new MediaStream([audioTrack]);
        const mediaRecorder = new MediaRecorder(audioStream);
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.start();

        await new Promise((r) => setTimeout(r, 10000)); // 10 seconds

        const audioBlob = await new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            resolve(new Blob(chunks, { type: 'audio/webm' }));
          };
          mediaRecorder.stop();
        });
        audioBlobRef.current = audioBlob;
        setCapturedAudioUrl(URL.createObjectURL(audioBlob));
      } catch {
        // Audio recording failed — not critical
      }
    }

    // 5. Stop all tracks
    stopStream();

    // 6. Get location result
    const loc = await locPromise;
    setSosLocation(loc);

    // 7. Send phase
    setPhase('sending');

    // Download files to device
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (photoBlobRef.current) {
      downloadBlob(photoBlobRef.current, `SOS_photo_${timestamp}.jpg`);
    }
    if (audioBlobRef.current) {
      downloadBlob(audioBlobRef.current, `SOS_audio_${timestamp}.webm`);
    }

    // Build message and open WhatsApp
    const mapsUrl = loc ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}` : '';
    const message = buildMessage(mapsUrl, !!loc);

    if (!contacts.length) {
      openWhatsApp('', message);
    } else {
      contacts.forEach((c) => openWhatsApp(c.phone, message));
    }

    setPhase('done');
  };

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      cancelSOS();
      if (capturedPhoto) URL.revokeObjectURL(capturedPhoto);
      if (capturedAudioUrl) URL.revokeObjectURL(capturedAudioUrl);
    };
  }, []);

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Emergency SOS
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Send your location, photo &amp; audio to trusted contacts
          </p>
        </div>

        {/* ==================== SOS BUTTON / FLOW ==================== */}
        <div className="rounded-3xl border border-pink-200 bg-white p-6 sm:p-8 shadow-md mb-8 text-center">
          {/* IDLE state */}
          {phase === 'idle' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Emergency Alert</h2>
                <p className="text-sm text-gray-600">
                  Captures photo + 10s audio + location, downloads files, and opens WhatsApp
                </p>
              </div>

              {/* Vehicle Number */}
              <div className="mb-6 max-w-md mx-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Vehicle Number (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g., DL-01-AB-1234"
                    className="flex-1 rounded-xl border-2 border-pink-200 p-3 text-gray-900 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                  {vehicleNumber && (
                    <button
                      onClick={() => setVehicleNumber('')}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition cursor-pointer"
                      title="Clear vehicle number"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {vehicleNumber && (
                  <div className="mt-2 text-left">
                    <span className="text-xs text-gray-600">Vehicle: </span>
                    <span className="text-sm font-semibold text-pink-700 bg-pink-50 px-2 py-1 rounded">
                      {vehicleNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Big SOS button */}
              <button
                onClick={startSOS}
                className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-xl sm:text-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] active:scale-95 cursor-pointer mx-auto"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-4xl">🆘</span>
                  <span>Send SOS</span>
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-30" />
              </button>
            </>
          )}

          {/* COUNTDOWN state */}
          {phase === 'countdown' && (
            <div className="py-8">
              <div className="text-7xl sm:text-8xl font-black text-red-500 mb-4 animate-pulse">
                {countdown}
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-6">
                Sending SOS in {countdown}...
              </p>
              <button
                onClick={cancelSOS}
                className="rounded-xl bg-gray-800 px-8 py-3 text-white font-semibold text-lg transition hover:bg-gray-900 active:scale-95 cursor-pointer"
              >
                ✕ TAP TO CANCEL
              </button>
            </div>
          )}

          {/* CAPTURING state */}
          {phase === 'capturing' && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-800 mb-2">Capturing evidence...</p>
              <p className="text-sm text-gray-500">📸 Photo + 🎤 10s Audio + 📍 Location</p>
              {sosError && (
                <p className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2">
                  ⚠️ {sosError}
                </p>
              )}
            </div>
          )}

          {/* SENDING state */}
          {phase === 'sending' && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-800">Opening WhatsApp...</p>
            </div>
          )}

          {/* DONE state */}
          {phase === 'done' && (
            <div className="py-6">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">SOS Sent!</h2>
              <p className="text-sm text-gray-600 mb-4">
                Your emergency contact has been notified via WhatsApp.
              </p>

              {/* Captured evidence */}
              <div className="max-w-sm mx-auto space-y-3 mb-6">
                {capturedPhoto && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={capturedPhoto} alt="SOS capture" className="w-full h-40 object-cover" />
                    <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
                      📸 Photo saved to device
                    </div>
                  </div>
                )}
                {capturedAudioUrl && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 mb-1">🎤 Audio recording (10s)</p>
                    <audio controls src={capturedAudioUrl} className="w-full h-10" />
                    <p className="text-xs text-gray-400 mt-1">Audio saved to device</p>
                  </div>
                )}
                {sosLocation && (
                  <a
                    href={`https://www.google.com/maps?q=${sosLocation.lat},${sosLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-semibold hover:bg-green-100 transition"
                  >
                    📍 View location on map →
                  </a>
                )}
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Share the downloaded photo/audio in your WhatsApp conversation manually.
              </p>

              <button
                onClick={() => {
                  setPhase('idle');
                  setCapturedPhoto(null);
                  setCapturedAudioUrl(null);
                  setSosLocation(null);
                  setSosError('');
                }}
                className="rounded-xl bg-pink-500 px-6 py-3 text-white font-semibold transition hover:bg-pink-600 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* ==================== EMERGENCY CONTACTS ==================== */}
        <div className="rounded-3xl border border-pink-200 bg-white p-6 sm:p-8 shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Emergency Contacts</h3>
              <p className="text-sm text-gray-600">
                Add trusted contacts for emergency situations
              </p>
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
                className="rounded-xl border-2 border-pink-200 p-3 text-gray-900 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone"
                className="rounded-xl border-2 border-pink-200 p-3 text-gray-900 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                type="tel"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-pink-500 py-3 font-semibold text-white shadow-md transition hover:bg-pink-600 hover:shadow-lg cursor-pointer"
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
                className="group rounded-2xl border border-pink-200 bg-white p-4 transition hover:bg-pink-50 hover:shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white font-bold text-lg shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${contact.phone}`}
                      className="rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-100 font-semibold"
                    >
                      Call
                    </a>
                    <button
                      onClick={() => setContacts((prev) => prev.filter((x) => x.id !== contact.id))}
                      className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-red-100 hover:text-red-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!contacts.length && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No contacts added</h4>
                <p>Add emergency contacts to get help when you need it</p>
              </div>
            )}
          </div>
        </div>

        {/* ==================== QUICK ACTIONS ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="tel:112"
            className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-red-300 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl shrink-0">
              🚨
            </div>
            <div>
              <div className="font-semibold text-red-700">Emergency</div>
              <div className="text-sm text-gray-600">Call 112</div>
            </div>
          </a>
          <a
            href="tel:100"
            className="rounded-2xl border border-pink-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-pink-300 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-xl shrink-0">
              👮
            </div>
            <div>
              <div className="font-semibold text-pink-700">Police</div>
              <div className="text-sm text-gray-600">Call 100</div>
            </div>
          </a>
          <a
            href="tel:108"
            className="rounded-2xl border border-pink-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-pink-300 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-xl shrink-0">
              🏥
            </div>
            <div>
              <div className="font-semibold text-pink-700">Medical</div>
              <div className="text-sm text-gray-600">Call 108</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
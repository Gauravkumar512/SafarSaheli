# SafarSaheli - AI-Powered Women's Safety Route Planner

A Progressive Web App (PWA) that uses machine learning to help women find the safest routes between locations, avoiding high-risk crime areas.

## 🎯 Overview

SafarSaheli is a hackathon project that combines:
- **Frontend**: React + Vite + TailwindCSS v4 + MapLibre GL JS
- **Backend**: FastAPI with ML-powered route safety scoring
- **ML Model**: KMeans clustering on crime data to identify high-risk zones

Instead of just finding the shortest route, SafarSaheli analyzes crime data and recommends the **safest route** based on proximity to crime clusters.

## 🏗️ Architecture

```
SafarSaheli/
├── backend/              # FastAPI backend server
│   ├── main.py          # FastAPI app with endpoints
│   ├── ml_service.py    # ML model service (KMeans clustering)
│   └── requirements.txt # Python dependencies
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx    # Mobile bottom navigation (md:hidden)
│   │   ├── TopBar.jsx       # Top navigation bar
│   │   ├── Spinner.jsx      # Reusable loading spinner
│   │   ├── PlaceCard.jsx    # Reusable place result card
│   │   └── GoogleMap.jsx    # Leaflet map + Overpass API (used in Safety)
│   ├── context/
│   │   └── AppContext.jsx   # Global app state (auth, theme)
│   ├── navigation/
│   │   └── RootLayout.jsx   # Protected layout with TopBar + BottomNav
│   ├── pages/
│   │   ├── Home.jsx         # Dashboard with feature cards
│   │   ├── SafetyRoutes.jsx # AI-scored safest route finder
│   │   ├── Safety.jsx       # Nearby safe places (Geoapify Places API)
│   │   ├── SOS.jsx          # Emergency SOS with photo/audio capture
│   │   ├── Saheli.jsx       # AI chat companion (Gemini + location context)
│   │   ├── TripPlanner.jsx  # AI-powered trip planning
│   │   └── ...
│   └── services/
│       └── ai.js            # Gemini API integration
├── crime.csv                # Crime dataset (used by ML model)
├── .env                     # API keys (Gemini, Geoapify, Google Maps)
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 18+** (for frontend)
- **Geoapify API Key** (already configured in `.env`)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Load `crime.csv` from the project root
- Train KMeans clustering model on startup
- Be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📱 Mobile-First Design

The app is designed mobile-first for women using phones in real safety situations:

- **Bottom Navigation** (mobile only): 5 tabs — Home, Routes, Safety, SOS, Saheli
- **SOS tab** is always red and prominent — accessible in one tap
- **Top bar** on mobile shows only logo + profile icon
- **Desktop** uses the full top navigation with all tabs
- Safe area support for notched devices (iPhone, etc.)
- Minimum 44px touch targets on all interactive elements

## 🛡️ Features

### Safety & Hygiene
Find verified safe places within 2km using Geoapify Places API:
- 🏥 Hospitals, 🏨 Hotels, 👮 Police stations
- 🚻 Washrooms, 💊 Pharmacies, 🚇 Metro stations
- Distance calculation, Navigate button (Google Maps), Call button
- Share location via WhatsApp

### Emergency SOS
- **3-second countdown** with cancel button (prevents accidental triggers)
- **Photo capture** from device camera
- **10-second audio recording** from microphone
- **GPS location** capture
- Files are **downloaded to device** automatically
- **WhatsApp alert** sent to emergency contacts with location link
- Quick dial buttons for 112 (Emergency), 100 (Police), 108 (Medical)

### AI Safety Routes
- Multiple route options from Geoapify
- ML-powered safety scoring (KMeans clustering on Delhi crime data)
- Color-coded routes: 🟢 Safe (70+), 🟡 Moderate (40-69), 🔴 High risk (<40)

### Saheli AI Chat
- Powered by Google Gemini
- Contextual: knows user's city and current time
- Safety tips, route advice, emergency guidance
- System prompt tuned for women's safety in India

## 📡 API Endpoints

### Backend API (`http://localhost:8000`)

#### `POST /safest-route`
Find the safest route between two coordinates.

```json
{
  "start": [28.6139, 77.2090],
  "end": [28.5363, 77.2492]
}
```

#### `POST /sos`
Mock SOS endpoint for emergency location tracking.

#### `GET /health`
Health check endpoint.

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_GEOAPIFY_API_KEY=your_geoapify_key
VITE_BACKEND_URL=http://localhost:8000
```

## 🐛 Troubleshooting

### SOS Camera/Microphone
- Camera and microphone require HTTPS or localhost
- If permissions are denied, SOS falls back to location-only alerts
- Photo and audio are downloaded to your device — share manually in WhatsApp

### Backend Connection
- Ensure backend is running on port 8000
- Frontend falls back to direct Geoapify if backend is unavailable
- Check CORS settings if connecting from a different origin

## 📝 Notes for Hackathon Demo

1. **Start backend first** (`uvicorn main:app --reload`)
2. **Then start frontend** (`npm run dev`)
3. **Demo on phone** — use Chrome DevTools device mode or actual phone
4. **SOS demo** — requires camera/mic permissions (HTTPS or localhost)

## 📄 License

This is a hackathon project for demonstration purposes.

---

**Built with ❤️ for women's safety**

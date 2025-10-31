# SafarSaheli - AI-Powered Women's Safety Route Planner

A Progressive Web App (PWA) that uses machine learning to help women find the safest routes between locations, avoiding high-risk crime areas.

## 🎯 Overview

SafarSaheli is a hackathon project that combines:
- **Frontend**: React + Vite + TailwindCSS + MapLibre GL JS
- **Backend**: FastAPI with ML-powered route safety scoring
- **ML Model**: KMeans clustering on crime data to identify high-risk zones

Instead of just finding the shortest route, SafarSaheli analyzes crime data and recommends the **safest route** based on proximity to crime clusters.

## 🏗️ Architecture

```
SafarSaheli/
├── backend/              # FastAPI backend server
│   ├── main.py          # FastAPI app with endpoints
│   ├── ml_service.py   # ML model service (KMeans clustering)
│   ├── requirements.txt # Python dependencies
│   └── README.md        # Backend documentation
├── SafarSaheli/         # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── SafetyRoutes.jsx  # Safety Routes page (integrated with backend)
│   │   └── ...
│   └── package.json
├── crime.csv            # Crime dataset (used by ML model)
├── datahelper.py       # Data preprocessing helpers
├── KMeans.py          # Original ML model code
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 18+** (for frontend)
- **Geoapify API Key** (already configured in code)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Load `crime.csv` from the project root
- Train KMeans clustering model on startup
- Be available at `http://localhost:8000`

**Verify backend is running:**
```bash
curl http://localhost:8000/health
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd SafarSaheli

# Install Node dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Using the App

1. Open `http://localhost:5173` in your browser
2. Navigate to **Safety Routes** section
3. Enter start and destination locations
4. Click **"Start journey"**
5. The app will:
   - Call the backend API (`/safest-route`)
   - Get the safest route (AI-scored)
   - Display route on map with color coding:
     - 🟢 **Green** (70+): Safe route
     - 🟡 **Yellow** (40-69): Moderate risk
     - 🔴 **Red** (<40): Higher risk
   - Show safety score, distance, and duration

## 📡 API Endpoints

### Backend API (`http://localhost:8000`)

#### `POST /safest-route`
Find the safest route between two coordinates.

**Request:**
```json
{
  "start": [28.6139, 77.2090],
  "end": [28.5363, 77.2492]
}
```

**Response:**
```json
{
  "route": [[28.6139, 77.2090], [28.6, 77.22], ...],
  "safety_score": 75.5,
  "distance_km": 12.3,
  "duration_min": 25.0
}
```

#### `POST /sos`
Mock SOS endpoint for emergency location tracking.

**Request:**
```json
{
  "location": [28.6139, 77.2090],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "status": "activated",
  "message": "SOS alert sent successfully. Help is on the way.",
  "location": [28.6139, 77.2090]
}
```

#### `GET /health`
Health check endpoint.

## 🧠 How It Works

### ML Model Pipeline

1. **Data Loading**: Loads `crime.csv` with crime statistics for Delhi regions
2. **Feature Extraction**: Uses columns [1-7, 12]:
   - Murder, rape, gangrape, robbery, theft, assault, harassment
   - Crime/area ratio
3. **Clustering**: Trains KMeans with 6 clusters to group similar crime patterns
4. **Risk Scoring**: Computes risk scores per cluster based on crime severity

### Route Safety Scoring

1. **Route Fetching**: Backend fetches multiple route options from Geoapify
2. **Proximity Analysis**: For each route point, finds nearby crime data points (within 2km)
3. **Risk Calculation**: Weighted risk based on distance and crime severity
4. **Safety Score**: Converts to 0-100 scale (higher = safer)
5. **Route Selection**: Returns route with highest safety score

### Frontend Integration

- Frontend calls `/safest-route` with start/end coordinates
- Receives safest route with safety score
- Displays route on MapLibre map with color-coded polyline
- Shows safety score in UI

## 🔧 Configuration

### Backend URL (Frontend)

By default, frontend connects to `http://localhost:8000`. To change:

1. Create `.env` file in `SafarSaheli/` directory:
```env
VITE_BACKEND_URL=http://localhost:8000
```

2. Or modify `BACKEND_URL` in `SafetyRoutes.jsx`:
```javascript
const BACKEND_URL = 'http://your-backend-url:8000';
```

### CORS

Backend is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (React default)
- `http://127.0.0.1:5173`

Modify `allow_origins` in `backend/main.py` if needed.

## 📁 File Structure

### Backend Files

- `backend/main.py`: FastAPI application with endpoints
- `backend/ml_service.py`: ML model service (KMeans clustering + route scoring)
- `backend/requirements.txt`: Python dependencies

### Frontend Files

- `SafarSaheli/src/pages/SafetyRoutes.jsx`: Safety Routes page (updated to use backend)

### ML Files

- `crime.csv`: Crime dataset (166 regions in Delhi)
- `datahelper.py`: Data preprocessing helpers
- `KMeans.py`: Original ML model implementation

## 🐛 Troubleshooting

### Backend Issues

1. **ML model not loading**: Ensure `crime.csv` exists in project root
2. **Import errors**: Check Python dependencies are installed (`pip install -r backend/requirements.txt`)
3. **Port already in use**: Change port in `uvicorn` command or `main.py`

### Frontend Issues

1. **Backend connection failed**: 
   - Check backend is running on port 8000
   - Check CORS configuration
   - Verify `BACKEND_URL` is correct
2. **Routes not showing**: Check browser console for errors
3. **Fallback route**: If backend is unavailable, frontend falls back to direct Geoapify (shortest route)

### Common Errors

- **"ML model not loaded"**: Backend didn't start properly, check startup logs
- **"No route found"**: Invalid coordinates or Geoapify API issue
- **CORS errors**: Add your frontend URL to `allow_origins` in `backend/main.py`

## 🎨 Features

- ✅ AI-powered safest route recommendation
- ✅ Color-coded route visualization (green/yellow/red)
- ✅ Safety score display (0-100)
- ✅ Distance and duration information
- ✅ Fallback to shortest route if backend unavailable
- ✅ Real-time route calculation
- ✅ Mock SOS endpoint for emergencies

## 📝 Notes for Hackathon Demo

1. **Start backend first** (`uvicorn main:app --reload`)
2. **Then start frontend** (`npm run dev`)
3. **Demo flow**:
   - Show shortest route vs safest route comparison
   - Explain how ML model scores routes
   - Demonstrate color-coded safety visualization
   - Show safety score impact

## 🔮 Future Enhancements

- Real-time crime data updates
- Multiple route options with comparison
- User feedback loop for route quality
- SOS integration with real emergency services
- Historical route tracking
- Personalized safety preferences

## 📄 License

This is a hackathon project for demonstration purposes.

---

**Built with ❤️ for women's safety**

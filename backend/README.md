# SafarSaheli Backend API

FastAPI backend for AI-powered safety route planning using KMeans clustering.

## Overview

This backend integrates the existing ML model (`KMeans.py` and `datahelper.py`) to provide safety-scored route recommendations. It analyzes crime data from `crime.csv` and uses KMeans clustering to identify high-risk areas, then scores routes based on proximity to these areas.

## Architecture

```
backend/
├── main.py          # FastAPI application with endpoints
├── ml_service.py    # ML model service (KMeans clustering + route scoring)
├── requirements.txt # Python dependencies
└── README.md        # This file
```

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Ensure Crime Data is Available

Make sure `crime.csv` is in the project root directory (one level up from `backend/`).

### 3. Run the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python main.py
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "SafarSaheli Backend API",
  "ml_model_loaded": true
}
```

### `GET /health`
Detailed health check with ML model status.

**Response:**
```json
{
  "status": "healthy",
  "ml_model_loaded": true,
  "crime_data_points": 166
}
```

### `POST /safest-route`
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

### `POST /sos`
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

## ML Model Details

### Data Processing

The backend loads `crime.csv` and extracts:
- **Columns 1-7**: Crime features (murder, rape, gangrape, robbery, theft, assault, harassment)
- **Column 12**: Crime/area ratio
- **Columns 10-11**: Geographic coordinates (longitude, latitude)

### KMeans Clustering

- **Clusters**: 6 (as per `KMeans.py`)
- **Features**: 8 normalized features (columns [1,2,3,4,5,6,7,12])
- **Initialization**: k-means++ with random_state=42

### Route Safety Scoring

1. **Proximity Analysis**: For each route point, find nearby crime data points (within 2km radius)
2. **Risk Calculation**: Weighted risk based on distance and crime severity
3. **Aggregation**: Average risk across entire route
4. **Safety Score**: Convert to 0-100 scale (higher = safer)

## Integration with Frontend

The frontend (`SafetyRoutes.jsx`) calls this backend instead of directly using Geoapify. The backend:
1. Fetches multiple route options from Geoapify
2. Scores each route using ML model
3. Returns the safest route to the frontend

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (React default)
- `http://127.0.0.1:5173`

Adjust `CORS_Middleware` in `main.py` if needed.

## Environment Variables

No environment variables are required by default. The Geoapify API key is currently hardcoded in `ml_service.py` (same as frontend).

## Testing

Test the API using curl:

```bash
# Health check
curl http://localhost:8000/health

# Safest route
curl -X POST http://localhost:8000/safest-route \
  -H "Content-Type: application/json" \
  -d '{"start": [28.6139, 77.2090], "end": [28.5363, 77.2492]}'
```

## Performance Notes

- ML model loads once on server startup (not per request)
- Route scoring samples route points to avoid over-processing
- Async HTTP requests for Geoapify API
- Efficient Haversine distance calculations

## Troubleshooting

1. **ML model not loading**: Check that `crime.csv` exists in project root
2. **Import errors**: Ensure all dependencies are installed (`pip install -r requirements.txt`)
3. **CORS errors**: Verify frontend URL is in allowed origins
4. **Geoapify errors**: Check API key is valid


"""
FastAPI Backend for SafarSaheli - Women's Safety Route Planner
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from contextlib import asynccontextmanager
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import os
import sys

# Import ML utilities
from ml_service import MLModelService

# Global ML service instance
ml_service: MLModelService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML model on startup"""
    global ml_service
    try:
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        crime_csv_path = os.path.join(root_dir, "crime.csv")
        
        print(f"[Backend] Loading ML model from: {crime_csv_path}")
        ml_service = MLModelService(crime_csv_path)
        print(f"[Backend] ML model loaded successfully!")
        print(f"[Backend] Crime data points: {len(ml_service.crime_coords)}")
        print(f"[Backend] Clusters: {ml_service.kmeans_model.n_clusters}")
    except Exception as e:
        print(f"[Backend] ERROR loading ML model: {e}")
        raise
    
    yield


# Initialize FastAPI app ONCE
app = FastAPI(
    title="SafarSaheli Backend API",
    description="AI-powered safety route planner for women's safety",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS ONCE - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class RouteRequest(BaseModel):
    """Request model for safest route endpoint"""
    start: List[float]  # [lat, lng]
    end: List[float]    # [lat, lng]

class RouteResponse(BaseModel):
    """Response model for safest route endpoint"""
    route: List[List[float]]  # [[lat, lng], ...]
    safety_score: float       # Overall safety score (0-100, higher = safer)
    distance_km: float        # Approximate distance in kilometers
    duration_min: float       # Approximate duration in minutes

class SOSRequest(BaseModel):
    """Request model for SOS endpoint"""
    location: List[float]  # [lat, lng]
    timestamp: str = None

class SOSResponse(BaseModel):
    """Response model for SOS endpoint"""
    status: str
    message: str
    location: List[float]


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "SafarSaheli Backend API",
        "ml_model_loaded": ml_service is not None
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "ml_model_loaded": ml_service is not None,
        "crime_data_points": len(ml_service.crime_coords) if ml_service else 0
    }


@app.post("/safest-route", response_model=RouteResponse)
async def get_safest_route(request: RouteRequest):
    """Find the safest route between start and end coordinates"""
    if ml_service is None:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    
    if len(request.start) != 2 or len(request.end) != 2:
        raise HTTPException(status_code=400, detail="Invalid coordinates format")
    
    start_lat, start_lng = request.start[0], request.start[1]
    end_lat, end_lng = request.end[0], request.end[1]
    
    try:
        # Get multiple route options from Geoapify
        routes = await ml_service.get_route_options(start_lat, start_lng, end_lat, end_lng)
        
        if not routes:
            raise HTTPException(status_code=404, detail="No routes found")
        
        # Score each route using ML model
        scored_routes = []
        for route in routes:
            safety_score = ml_service.score_route_safety(route["coordinates"])
            scored_routes.append({
                **route,
                "safety_score": safety_score
            })
        
        # Select route with highest safety score
        safest_route = max(scored_routes, key=lambda r: r["safety_score"])
        
        return RouteResponse(
            route=safest_route["coordinates"],
            safety_score=safest_route["safety_score"],
            distance_km=safest_route.get("distance_km", 0),
            duration_min=safest_route.get("duration_min", 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Backend] Error in /safest-route: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/sos", response_model=SOSResponse)
async def trigger_sos(request: SOSRequest):
    """Mock SOS endpoint for emergency location tracking"""
    if len(request.location) != 2:
        raise HTTPException(status_code=400, detail="Invalid location format")
    
    lat, lng = request.location[0], request.location[1]
    
    print(f"[SOS] Emergency triggered at location: {lat}, {lng}")
    print(f"[SOS] Timestamp: {request.timestamp or 'N/A'}")
    
    return SOSResponse(
        status="activated",
        message="SOS alert sent successfully. Help is on the way.",
        location=[lat, lng]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
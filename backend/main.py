"""
FastAPI Backend for SafarSaheli - Women's Safety Route Planner

This backend integrates with the existing ML model (KMeans clustering)
to provide safety-scored route recommendations based on crime data.

Main Endpoints:
- POST /safest-route: Returns the safest route between two points
- POST /sos: Mock SOS endpoint for emergency location tracking
- POST /send-sms: Send SMS alerts via Twilio to emergency contacts
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple, Optional
from contextlib import asynccontextmanager
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import os
import sys
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables from .env file
# Use override=True to ensure fresh load and verbose=True for debugging
load_dotenv(override=True)

# Import our ML utilities (ml_service.py is in the same backend directory)
from ml_service import MLModelService

# Global ML service instance (loaded once on startup)
ml_service: MLModelService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load ML model and crime data on server startup.
    This ensures the model is ready before handling requests.
    """
    # Startup
    global ml_service
    try:
        # Get the root directory (parent of backend)
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
    
    # Shutdown (if needed)
    pass


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="SafarSaheli Backend API",
    description="AI-powered safety route planner for women's safety",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class RouteRequest(BaseModel):
    """Request model for safest route endpoint"""
    start: List[float]  # [lat, lng]
    end: List[float]    # [lat, lng]

class RouteOption(BaseModel):
    """Individual route option with metadata"""
    route: List[List[float]]  # [[lat, lng], ...]
    safety_score: float       # Overall safety score (0-100, higher = safer)
    distance_km: float        # Approximate distance in kilometers
    duration_min: float       # Approximate duration in minutes

class RouteResponse(BaseModel):
    """Response model for safest route endpoint"""
    safest_route: RouteOption  # The route with highest safety score
    all_routes: List[RouteOption]  # All available routes with scores

class SOSRequest(BaseModel):
    """Request model for SOS endpoint"""
    location: List[float]  # [lat, lng]
    timestamp: str = None

class SOSResponse(BaseModel):
    """Response model for SOS endpoint"""
    status: str
    message: str
    location: List[float]

class SMSRequest(BaseModel):
    """Request model for SMS endpoint"""
    to_numbers: List[str]  # List of phone numbers to send SMS to
    message: str           # SMS message content
    location: Optional[List[float]] = None  # Optional location [lat, lng]
    vehicle_number: Optional[str] = None   # Optional vehicle number

class SMSResponse(BaseModel):
    """Response model for SMS endpoint"""
    status: str
    message: str
    sent_count: int
    failed_count: int


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
    """
    Find the safest route between start and end coordinates.
    
    Algorithm:
    1. Fetch multiple route options from Geoapify API
    2. Score each route based on proximity to high-risk crime clusters
    3. Return the route with the lowest cumulative risk score
    
    Args:
        request: RouteRequest with start [lat, lng] and end [lat, lng]
    
    Returns:
        RouteResponse with safest route coordinates and metadata
    """
    if ml_service is None:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    
    if len(request.start) != 2 or len(request.end) != 2:
        raise HTTPException(status_code=400, detail="Invalid coordinates format")
    
    start_lat, start_lng = request.start[0], request.start[1]
    end_lat, end_lng = request.end[0], request.end[1]
    
    # NOTE: Model is trained on Delhi crime data, so scoring will be most accurate for Delhi region
    # Coordinate validation removed to allow other cities, but accuracy may be limited
    # For Delhi: ~28.4-28.9 lat, 76.8-77.4 lng
    # For best results, use coordinates within Delhi region
    
    try:
        # Get multiple route options from Geoapify
        routes = await ml_service.get_route_options(start_lat, start_lng, end_lat, end_lng)
        
        if not routes:
            raise HTTPException(status_code=404, detail="No routes found")
        
        # Score each route using ML model
        scored_routes = []
        for route in routes:
            safety_score = ml_service.score_route_safety(route["coordinates"])
            scored_routes.append(RouteOption(
                route=route["coordinates"],
                safety_score=safety_score,
                distance_km=route.get("distance_km", 0),
                duration_min=route.get("duration_min", 0)
            ))
        
        # Sort routes by safety score (highest first)
        scored_routes.sort(key=lambda r: r.safety_score, reverse=True)
        
        # Select route with highest safety score (lowest risk)
        safest_route = scored_routes[0] if scored_routes else None
        
        if not safest_route:
            raise HTTPException(status_code=404, detail="No routes found")
        
        return RouteResponse(
            safest_route=safest_route,
            all_routes=scored_routes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Backend] Error in /safest-route: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/sos", response_model=SOSResponse)
async def trigger_sos(request: SOSRequest):
    """
    Mock SOS endpoint for emergency location tracking.
    
    In a production system, this would:
    - Send alerts to emergency contacts
    - Notify nearby authorities
    - Track location continuously
    - Log incident for safety records
    
    Args:
        request: SOSRequest with current location [lat, lng]
    
    Returns:
        SOSResponse confirming SOS activation
    """
    if len(request.location) != 2:
        raise HTTPException(status_code=400, detail="Invalid location format")
    
    lat, lng = request.location[0], request.location[1]
    
    # Mock SOS processing
    print(f"[SOS] Emergency triggered at location: {lat}, {lng}")
    print(f"[SOS] Timestamp: {request.timestamp or 'N/A'}")
    print(f"[SOS] Alert sent to emergency contacts")
    print(f"[SOS] Nearby authorities notified")
    
    return SOSResponse(
        status="activated",
        message="SOS alert sent successfully. Help is on the way.",
        location=[lat, lng]
    )


@app.post("/send-sms", response_model=SMSResponse)
async def send_sms(request: SMSRequest):
    """
    Send SMS alerts to multiple phone numbers using Twilio.
    
    Requires Twilio credentials in environment variables:
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - TWILIO_PHONE_NUMBER
    
    Args:
        request: SMSRequest with phone numbers, message, and optional location/vehicle number
    
    Returns:
        SMSResponse with send status and counts
    """
    # Get Twilio credentials from environment variables
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Check if credentials are set and not placeholder values
    if not account_sid or not auth_token or not twilio_phone:
        raise HTTPException(
            status_code=500,
            detail="Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables in the .env file."
        )
    
    # Check for placeholder values
    if (account_sid == "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" or 
        auth_token == "your_auth_token_here_32_chars_long" or 
        twilio_phone == "+1234567890"):
        raise HTTPException(
            status_code=500,
            detail="Twilio credentials are still set to placeholder values. Please update the .env file with your actual Twilio credentials and restart the backend server."
        )
    
    if not request.to_numbers or len(request.to_numbers) == 0:
        raise HTTPException(status_code=400, detail="No phone numbers provided")
    
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        sent_count = 0
        failed_count = 0
        errors = []
        
        # Format phone numbers (ensure they start with +)
        def format_phone_number(phone):
            """Format phone number to E.164 format for Twilio"""
            if not phone:
                return None
            # Remove all non-digit characters except +
            digits = ''.join(c for c in phone if c.isdigit() or c == '+')
            # If starts with +, keep it; otherwise add country code
            if digits.startswith('+'):
                return digits
            # If 10 digits, assume India (+91)
            if len(digits) == 10:
                return f"+91{digits}"
            # If starts with 0, remove it and add +91
            if digits.startswith('0'):
                return f"+91{digits[1:]}"
            # If starts with 91, add +
            if digits.startswith('91'):
                return f"+{digits}"
            # Default: add +91
            return f"+91{digits}"
        
        # Send SMS to each number
        for phone_number in request.to_numbers:
            try:
                formatted_number = format_phone_number(phone_number)
                if not formatted_number:
                    failed_count += 1
                    errors.append(f"Invalid phone number: {phone_number}")
                    continue
                
                # Send SMS via Twilio
                message = client.messages.create(
                    body=request.message,
                    from_=twilio_phone,
                    to=formatted_number
                )
                
                sent_count += 1
                print(f"[SMS] Sent to {formatted_number}: {message.sid}")
                
            except Exception as e:
                failed_count += 1
                error_msg = f"Failed to send to {phone_number}: {str(e)}"
                errors.append(error_msg)
                print(f"[SMS] Error: {error_msg}")
        
        # Build response message
        if sent_count > 0 and failed_count == 0:
            status_msg = f"Successfully sent {sent_count} SMS alert(s)"
        elif sent_count > 0 and failed_count > 0:
            status_msg = f"Sent {sent_count} SMS, {failed_count} failed"
        else:
            status_msg = f"Failed to send SMS alerts. Errors: {', '.join(errors[:3])}"
        
        return SMSResponse(
            status="completed" if sent_count > 0 else "failed",
            message=status_msg,
            sent_count=sent_count,
            failed_count=failed_count
        )
        
    except Exception as e:
        print(f"[SMS] Twilio error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send SMS: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


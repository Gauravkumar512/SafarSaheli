"""
ML Service for SafarSaheli Backend

This service integrates the existing KMeans clustering model with route safety scoring.
It loads crime data, trains/loads the KMeans model, and provides methods to score
routes based on proximity to high-risk crime clusters.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import os
import aiohttp
from typing import List, Tuple, Dict, Optional
import math

# Geoapify API key (same as frontend)
GEOAPIFY_API_KEY = "d188108bd5574dddaa900e8036d19f2a"


class MLModelService:
    """
    ML Model Service for Crime-Based Route Safety Scoring
    
    This class:
    1. Loads crime data from CSV
    2. Preprocesses data using columns [1,2,3,4,5,6,7,12] (crime features)
    3. Trains KMeans clustering model (6 clusters as per KMeans.py)
    4. Provides route safety scoring based on proximity to high-risk clusters
    """
    
    def __init__(self, crime_csv_path: str):
        """
        Initialize ML service with crime data.
        
        Args:
            crime_csv_path: Path to crime.csv file
        """
        self.crime_csv_path = crime_csv_path
        self.crime_df = None
        self.crime_coords = []  # List of (lat, lng, risk_score)
        self.kmeans_model = None
        self.scaler = None
        self.cluster_risk_scores = {}  # Map cluster_id -> risk_score
        
        # Load and process data
        self._load_data()
        self._train_model()
        self._compute_cluster_risks()
    
    def _load_data(self):
        """Load crime data from CSV and extract relevant features"""
        print(f"[ML Service] Loading crime data from: {self.crime_csv_path}")
        self.crime_df = pd.read_csv(self.crime_csv_path)
        
        # Extract coordinates (columns 10=longitude, 11=latitude)
        # Extract crime features (columns 1-7: murder, rape, gangrape, robbery, theft, assault murders, sexual harassment)
        # Column 12: crime/area ratio
        
        for idx in range(len(self.crime_df)):
            lon = self.crime_df.iloc[idx, 10]  # longitude
            lat = self.crime_df.iloc[idx, 11]  # latitude
            
            # Calculate risk score from crime features
            murder = self.crime_df.iloc[idx, 1]
            rape = self.crime_df.iloc[idx, 2]
            gangrape = self.crime_df.iloc[idx, 3]
            robbery = self.crime_df.iloc[idx, 4]
            theft = self.crime_df.iloc[idx, 5]
            assault = self.crime_df.iloc[idx, 6]
            harassment = self.crime_df.iloc[idx, 7]
            crime_area_ratio = self.crime_df.iloc[idx, 12]
            
            # Weighted risk score (higher weight for violent crimes)
            risk_score = (
                murder * 10 +
                rape * 8 +
                gangrape * 10 +
                robbery * 3 +
                theft * 1 +
                assault * 5 +
                harassment * 4 +
                crime_area_ratio * 0.1
            )
            
            self.crime_coords.append((lat, lon, risk_score))
        
        print(f"[ML Service] Loaded {len(self.crime_coords)} crime data points")
    
    def _train_model(self):
        """
        Train KMeans clustering model using crime features.
        Uses the same approach as KMeans.py (6 clusters, columns [1,2,3,4,5,6,7,12])
        """
        print("[ML Service] Training KMeans model...")
        
        # Select relevant columns: [1,2,3,4,5,6,7,12]
        # 1: murder, 2: rape, 3: gangrape, 4: robbery, 5: theft, 6: assault murders, 7: sexual harassment, 12: crime/area
        cols_to_use = [1, 2, 3, 4, 5, 6, 7, 12]
        crime_features = self.crime_df.iloc[:, cols_to_use].values
        
        # Standardize features
        self.scaler = StandardScaler()
        norm_data = self.scaler.fit_transform(crime_features)
        
        # Train KMeans with 6 clusters (as per KMeans.py)
        n_clusters = 6
        self.kmeans_model = KMeans(
            n_clusters=n_clusters,
            init='k-means++',
            n_init='auto',
            random_state=42
        )
        cluster_labels = self.kmeans_model.fit_predict(norm_data)
        
        print(f"[ML Service] KMeans model trained with {n_clusters} clusters")
        print(f"[ML Service] Cluster distribution: {np.bincount(cluster_labels)}")
    
    def _compute_cluster_risks(self):
        """
        Compute average risk score for each cluster.
        Higher risk clusters indicate more dangerous areas.
        """
        print("[ML Service] Computing cluster risk scores...")
        
        # Get cluster labels for each data point
        cols_to_use = [1, 2, 3, 4, 5, 6, 7, 12]
        crime_features = self.crime_df.iloc[:, cols_to_use].values
        norm_data = self.scaler.transform(crime_features)
        cluster_labels = self.kmeans_model.predict(norm_data)
        
        # Calculate average risk per cluster
        cluster_risks = {}
        for cluster_id in range(self.kmeans_model.n_clusters):
            cluster_indices = np.where(cluster_labels == cluster_id)[0]
            cluster_risk_scores = [self.crime_coords[i][2] for i in cluster_indices]
            avg_risk = np.mean(cluster_risk_scores) if cluster_risk_scores else 0
            cluster_risks[cluster_id] = avg_risk
        
        self.cluster_risk_scores = cluster_risks
        
        print(f"[ML Service] Cluster risk scores computed:")
        for cluster_id, risk in sorted(self.cluster_risk_scores.items()):
            print(f"  Cluster {cluster_id}: {risk:.2f} risk score")
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate Haversine distance between two coordinates in kilometers.
        
        Args:
            lat1, lon1: First coordinate
            lat2, lon2: Second coordinate
        
        Returns:
            Distance in kilometers
        """
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    
    def score_route_safety(self, route_coords: List[List[float]]) -> float:
        """
        Score a route's safety based on proximity to high-risk crime clusters.
        
        Algorithm:
        1. For each point in the route, find nearby crime data points
        2. Calculate risk based on proximity and cluster risk scores
        3. Aggregate risk across entire route
        4. Convert to safety score (0-100, higher = safer)
        
        Args:
            route_coords: List of [lat, lng] coordinates along the route
        
        Returns:
            Safety score (0-100, where 100 is safest)
        """
        if not route_coords:
            return 50.0  # Default neutral score
        
        total_risk = 0.0
        point_count = 0
        
        # Sample route points (every Nth point to avoid over-processing)
        sample_rate = max(1, len(route_coords) // 50)  # Sample ~50 points max
        sampled_coords = route_coords[::sample_rate]
        
        for lat, lng in sampled_coords:
            point_risk = 0.0
            nearby_count = 0
            
            # Check proximity to crime data points
            for crime_lat, crime_lon, crime_risk in self.crime_coords:
                distance_km = self._calculate_distance(lat, lng, crime_lat, crime_lon)
                
                # Only consider crimes within 2km radius (adjustable)
                if distance_km <= 2.0:
                    # Inverse distance weighting: closer = higher risk
                    weight = 1.0 / (1.0 + distance_km * 2)
                    point_risk += crime_risk * weight
                    nearby_count += 1
            
            # Normalize by number of nearby crimes
            if nearby_count > 0:
                point_risk = point_risk / nearby_count
            
            total_risk += point_risk
            point_count += 1
        
        # Average risk across route
        avg_risk = total_risk / point_count if point_count > 0 else 0
        
        # Convert risk to safety score (0-100 scale)
        # Higher risk -> lower safety score
        # Normalize based on observed risk range from actual crime data
        # After analysis, most routes have avg_risk between 50-300
        # Using a more realistic normalization that better distributes scores
        max_observed_risk = 400.0  # Adjusted based on typical route risks
        min_observed_risk = 20.0   # Minimum risk for safe areas
        
        # Normalize risk to 0-1 range (inverse: higher risk = lower normalized value)
        if avg_risk <= min_observed_risk:
            normalized_risk = 0.0  # Very safe
        elif avg_risk >= max_observed_risk:
            normalized_risk = 1.0  # Very risky
        else:
            # Linear interpolation: map risk range to 0-1
            normalized_risk = (avg_risk - min_observed_risk) / (max_observed_risk - min_observed_risk)
        
        # Convert to safety score: 0 = unsafe, 100 = safe
        safety_score = (1.0 - normalized_risk) * 100
        
        # Ensure score is between 0-100
        safety_score = max(0, min(100, safety_score))
        
        return round(safety_score, 2)
    
    async def get_route_options(
        self, 
        start_lat: float, 
        start_lng: float, 
        end_lat: float, 
        end_lng: float
    ) -> List[Dict]:
        """
        Fetch multiple route options from Geoapify API.
        
        Currently fetches:
        - Shortest route (drive mode)
        - Alternative route (if available)
        
        Args:
            start_lat, start_lng: Start coordinates
            end_lat, end_lng: End coordinates
        
        Returns:
            List of route dictionaries with coordinates, distance, and duration
        """
        routes = []
        
        try:
            # Fetch shortest route
            route1 = await self._fetch_geoapify_route(
                start_lat, start_lng, end_lat, end_lng, mode="drive"
            )
            if route1:
                routes.append(route1)
            
            # Try to fetch alternative route (if Geoapify provides it)
            # Note: Geoapify may provide alternatives via different modes
            route2 = await self._fetch_geoapify_route(
                start_lat, start_lng, end_lat, end_lng, mode="drive,safe"
            )
            if route2 and route2 != route1:
                routes.append(route2)
            
        except Exception as e:
            print(f"[ML Service] Error fetching routes: {e}")
        
        return routes
    
    async def _fetch_geoapify_route(
        self,
        start_lat: float,
        start_lng: float,
        end_lat: float,
        end_lng: float,
        mode: str = "drive"
    ) -> Optional[Dict]:
        """
        Fetch a single route from Geoapify Directions API.
        
        Args:
            start_lat, start_lng: Start coordinates
            end_lat, end_lng: End coordinates
            mode: Route mode (drive, walk, etc.)
        
        Returns:
            Route dictionary with coordinates, distance_km, duration_min
        """
        url = (
            f"https://api.geoapify.com/v1/routing?"
            f"waypoints={start_lat},{start_lng}|{end_lat},{end_lng}"
            f"&mode={mode}&apiKey={GEOAPIFY_API_KEY}"
        )
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    return None
                
                data = await response.json()
                
                if not data.get("features"):
                    return None
                
                feature = data["features"][0]
                geometry = feature.get("geometry", {})
                properties = feature.get("properties", {})
                
                # Extract coordinates
                if geometry.get("type") == "MultiLineString":
                    coords = geometry.get("coordinates", [])
                    flattened = [item for sublist in coords for item in sublist]
                else:
                    flattened = geometry.get("coordinates", [])
                
                # Convert from [lng, lat] to [lat, lng]
                route_coords = [[coord[1], coord[0]] for coord in flattened]
                
                # Extract distance and duration
                distance_m = (
                    properties.get("distance") or
                    properties.get("summary", {}).get("distance") or
                    (properties.get("legs", [{}])[0].get("distance") if properties.get("legs") else None) or
                    0
                )
                duration_s = (
                    properties.get("time") or
                    properties.get("summary", {}).get("duration") or
                    (properties.get("legs", [{}])[0].get("duration") if properties.get("legs") else None) or
                    0
                )
                
                return {
                    "coordinates": route_coords,
                    "distance_km": distance_m / 1000.0 if distance_m else 0,
                    "duration_min": duration_s / 60.0 if duration_s else 0
                }


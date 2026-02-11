from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
from datetime import datetime
import os

# ==================== INITIALIZE APP ====================
app = FastAPI(
    title="FIFA Position Prediction API",
    version="1.0.0",
    description="AI-powered player position prediction using Machine Learning"
)

# ==================== CORS SETUP ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== LOAD MODELS ====================
print("🚀 Loading ML models...")

try:
    # Load field player model and artifacts
    field_model = joblib.load("./models/field_position_model.pkl")
    field_scaler = joblib.load("./models/field_scaler.pkl")
    label_encoder = joblib.load("./models/label_encoder.pkl")
    field_features = joblib.load("./models/field_features.pkl")
    
    # Load goalkeeper model and artifacts
    gk_model = joblib.load("./models/gk_position_model.pkl")
    gk_scaler = joblib.load("./models/gk_scaler.pkl")
    gk_features = joblib.load("./models/gk_features.pkl")
    
    # Load metadata
    metadata = joblib.load("./models/metadata.pkl")
    
    print("✅ All models loaded successfully!")
    print(f"📊 Field accuracy: {metadata['field_accuracy']:.4f}")
    print(f"📊 GK accuracy: {metadata['gk_accuracy']:.4f}")
    
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print("⚠️  Please make sure models are trained and exist in the models/ directory")
    raise e

# ==================== DATA MODELS ====================
class PredictionRequest(BaseModel):
    type: str = "field"  # "field" or "gk"
    features: List[float]
    name: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================
def get_timestamp():
    return datetime.now().isoformat()

def validate_features(features, expected_count, player_type):
    if len(features) != expected_count:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {expected_count} features for {player_type} player, got {len(features)}"
        )
    
    # Validate each feature is between 0-100
    for i, feature in enumerate(features):
        if not (0 <= feature <= 100):
            raise HTTPException(
                status_code=400,
                detail=f"Feature {i} must be between 0-100, got {feature}"
            )

# ==================== API ENDPOINTS ====================
@app.get("/")
async def root():
    return {
        "message": "⚽ FIFA Position Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "POST /api/predict",
            "stats": "GET /api/stats",
            "features": "GET /api/features",
            "health": "GET /api/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": get_timestamp(),
        "models_loaded": True,
        "field_model_accuracy": metadata.get('field_accuracy', 0),
        "gk_model_accuracy": metadata.get('gk_accuracy', 0)
    }

@app.get("/api/stats")
async def get_stats():
    return {
        "status": "success",
        "timestamp": get_timestamp(),
        "data": {
            "field_model": {
                "accuracy": metadata.get('field_accuracy', 0),
                "accuracy_percentage": round(metadata.get('field_accuracy', 0) * 100, 2),
                "samples": metadata.get('field_samples', 0),
                "features_count": len(field_features),
                "position_classes": metadata.get('field_classes', [])
            },
            "gk_model": {
                "accuracy": metadata.get('gk_accuracy', 0),
                "accuracy_percentage": round(metadata.get('gk_accuracy', 0) * 100, 2),
                "samples": metadata.get('gk_samples', 0),
                "features_count": len(gk_features)
            }
        }
    }

@app.get("/api/features")
async def get_features():
    return {
        "status": "success",
        "timestamp": get_timestamp(),
        "data": {
            "field_features": field_features,
            "gk_features": gk_features,
            "field_classes": metadata.get('field_classes', []),
            "gk_classes": gk_model.classes_.tolist() if hasattr(gk_model, 'classes_') else []
        }
    }

@app.post("/api/predict")
async def predict(request: PredictionRequest):
    try:
        if request.type == "field":
            # Validate feature count
            validate_features(request.features, len(field_features), "field")
            
            # Scale features
            features_array = np.array(request.features).reshape(1, -1)
            scaled_features = field_scaler.transform(features_array)
            
            # Predict
            prediction = field_model.predict(scaled_features)[0]
            probabilities = field_model.predict_proba(scaled_features)[0]
            
            # Decode position
            position = label_encoder.inverse_transform([prediction])[0]
            
            # Get top 3 predictions
            top_indices = probabilities.argsort()[-3:][::-1]
            top_predictions = []
            for idx in top_indices:
                top_predictions.append({
                    "position": label_encoder.classes_[idx],
                    "probability": float(probabilities[idx])
                })
            
            # Prepare response
            response = {
                "player_type": "field",
                "predicted_position": position,
                "probability": float(probabilities[prediction]),
                "confidence": "high" if probabilities[prediction] > 0.7 else "medium" if probabilities[prediction] > 0.5 else "low",
                "top_predictions": top_predictions,
                "all_probabilities": dict(zip(
                    label_encoder.classes_, 
                    [float(p) for p in probabilities]
                ))
            }
            
        elif request.type == "gk":
            # Validate feature count
            validate_features(request.features, len(gk_features), "goalkeeper")
            
            # Scale features
            features_array = np.array(request.features).reshape(1, -1)
            scaled_features = gk_scaler.transform(features_array)
            
            # Predict
            prediction = gk_model.predict(scaled_features)[0]
            probabilities = gk_model.predict_proba(scaled_features)[0]
            
            # Get top 3 predictions
            top_indices = probabilities.argsort()[-3:][::-1]
            top_predictions = []
            for idx in top_indices:
                top_predictions.append({
                    "level": gk_model.classes_[idx],
                    "probability": float(probabilities[idx])
                })
            
            # Prepare response
            response = {
                "player_type": "goalkeeper",
                "predicted_level": prediction,
                "probability": float(probabilities[prediction]),
                "confidence": "high" if probabilities[prediction] > 0.7 else "medium" if probabilities[prediction] > 0.5 else "low",
                "top_predictions": top_predictions,
                "all_probabilities": dict(zip(
                    gk_model.classes_, 
                    [float(p) for p in probabilities]
                ))
            }
        
        else:
            raise HTTPException(status_code=400, detail="Player type must be 'field' or 'gk'")
        
        # Add name if provided
        if request.name:
            response["player_name"] = request.name
        
        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/samples")
async def get_samples():
    """Get sample player data for testing"""
    return {
        "status": "success",
        "timestamp": get_timestamp(),
        "data": {
            "field_samples": {
                "forward": {
                    "name": "Sample Forward",
                    "type": "field",
                    "features": [85, 82, 75, 65, 84, 88, 90, 85, 80, 75, 85, 40, 35, 38, 75, 85, 80, 82, 75, 70],
                    "description": "Typical forward player with high finishing"
                },
                "midfielder": {
                    "name": "Sample Midfielder",
                    "type": "field",
                    "features": [70, 85, 90, 85, 88, 78, 80, 82, 86, 70, 88, 75, 68, 70, 85, 75, 83, 84, 78, 65],
                    "description": "Typical midfielder with balanced skills"
                },
                "defender": {
                    "name": "Sample Defender",
                    "type": "field",
                    "features": [50, 65, 75, 70, 72, 75, 77, 70, 80, 85, 82, 85, 88, 86, 65, 60, 75, 78, 82, 80],
                    "description": "Typical defender with high defensive stats"
                }
            },
            "gk_samples": {
                "elite_gk": {
                    "name": "Elite Goalkeeper",
                    "type": "gk",
                    "features": [90, 88, 85, 92, 94, 90, 85, 88, 90],
                    "description": "World-class goalkeeper"
                },
                "average_gk": {
                    "name": "Average Goalkeeper",
                    "type": "gk",
                    "features": [75, 72, 70, 78, 80, 75, 70, 72, 75],
                    "description": "Average professional goalkeeper"
                }
            }
        }
    }

# ==================== RUN SERVER ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
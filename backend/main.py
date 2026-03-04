from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
from datetime import datetime
import os
import pandas as pd

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

# ==================== DINAMIK KEY FEATURES (CSV ASOSIDA, ORIGINAL NOMLAR BILAN) ====================
print("📂 CSV dan dinamik key features hisoblanmoqda...")
field_position_features = {}   # pozitsiya -> eng muhim atributlar (original nomlar)
gk_level_features = {}         # darvozabon darajasi -> eng muhim atributlar (original nomlar)

try:
    # CSV faylni yuklash
    df = pd.read_csv("FIFA-2019.csv")

    # 1. MAYDON O'YINCHILARI UCHUN
    print("   👤 Maydon o'yinchilari pozitsiyalari tahlil qilinmoqda...")
    field_positions = metadata.get('field_classes', [])

    # Position ustunini tozalash (agar vergul bilan ajratilgan bo'lsa)
    df['MainPosition'] = df['Position'].apply(
        lambda x: str(x).split(',')[0] if pd.notnull(x) else None
    )

    for pos in field_positions:
        # Shu pozitsiyadagi o'yinchilarni filtrlash
        pos_df = df[df['MainPosition'] == pos]

        if not pos_df.empty and len(pos_df) > 5:  # Kamida 5 ta o'yinchi bo'lishi kerak
            # field_features dan mavjud bo'lganlarini olish
            available_features = [f for f in field_features if f in pos_df.columns]

            if available_features:
                # O'rtacha qiymatlarni hisoblash
                means = pos_df[available_features].mean().sort_values(ascending=False)
                # Eng yuqori 5 tasini olish
                top_features = means.head(5).index.tolist()

                # ORIGINAL NOMLAR BILAN SAQLAYMIZ (hech qanday o'zgartirishsiz)
                field_position_features[pos] = top_features
                print(f"     ✓ {pos}: {', '.join(field_position_features[pos][:3])}...")
            else:
                # Agar featurelar topilmasa, model featurelaridan foydalanamiz
                field_position_features[pos] = field_features[:5]
        else:
            # Agar ma'lumot yetarli bo'lmasa, umumiy o'rtachadan foydalanamiz
            all_field_df = df[df['MainPosition'].isin(field_positions)]
            if not all_field_df.empty:
                available_features = [f for f in field_features if f in all_field_df.columns]
                means = all_field_df[available_features].mean().sort_values(ascending=False)
                top_features = means.head(5).index.tolist()
                field_position_features[pos] = top_features
            else:
                field_position_features[pos] = field_features[:5]

    # 2. DARVOZABONLAR UCHUN (Overall asosida darajalarni aniqlash)
    print("   🧤 Darvozabonlar tahlil qilinmoqda...")

    # GK larni ajratish
    gk_df = df[df['MainPosition'] == 'GK'].copy()

    if not gk_df.empty and 'Overall' in gk_df.columns:
        # Overall asosida darajalarni yaratish
        gk_df['Level'] = pd.cut(
            gk_df['Overall'],
            bins=[0, 65, 75, 85, 100],
            labels=['Bronze', 'Silver', 'Gold', 'Elite']
        )

        gk_levels = ['Elite', 'Gold', 'Silver', 'Bronze']

        for level in gk_levels:
            level_df = gk_df[gk_df['Level'] == level]

            if not level_df.empty and len(level_df) > 3:
                available_features = [f for f in gk_features if f in level_df.columns]

                if available_features:
                    means = level_df[available_features].mean().sort_values(ascending=False)
                    top_features = means.head(5).index.tolist()

                    # ORIGINAL NOMLAR BILAN SAQLAYMIZ
                    gk_level_features[level] = top_features
                    print(f"     ✓ {level}: {', '.join(gk_level_features[level][:3])}...")
                else:
                    gk_level_features[level] = gk_features[:5]
            else:
                # Agar ma'lumot yetarli bo'lmasa, barcha GK larning o'rtachasini olamiz
                available_features = [f for f in gk_features if f in gk_df.columns]
                means = gk_df[available_features].mean().sort_values(ascending=False)
                top_features = means.head(5).index.tolist()
                gk_level_features[level] = top_features
    else:
        # Agar GK ma'lumotlari bo'lmasa, model featurelaridan foydalanamiz
        for level in ['Elite', 'Gold', 'Silver', 'Bronze']:
            gk_level_features[level] = gk_features[:5]

    print("✅ Dinamik key features muvaffaqiyatli hisoblandi!")
    print(f"   📊 {len(field_position_features)} ta pozitsiya va {len(gk_level_features)} ta daraja uchun ma'lumot tayyor")

    # Test uchun bir nechta misol
    print("\n📋 Misollar:")
    for pos, features in list(field_position_features.items())[:3]:
        print(f"   {pos}: {features}")
    for level, features in list(gk_level_features.items())[:2]:
        print(f"   {level}: {features}")

except Exception as e:
    print(f"❌ Dinamik hisoblashda xatolik: {e}")
    print("⚠️ FALLBACK: Model featurelaridan foydalaniladi")

    # FALLBACK - model featurelaridan foydalanamiz
    for pos in metadata.get('field_classes', []):
        field_position_features[pos] = field_features[:5]

    for level in ['Elite', 'Gold', 'Silver', 'Bronze']:
        gk_level_features[level] = gk_features[:5]

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
            prediction_idx = field_model.predict(scaled_features)[0]
            probabilities = field_model.predict_proba(scaled_features)[0]

            # Decode position
            position = label_encoder.inverse_transform([prediction_idx])[0]

            # Get top 3 predictions
            top_indices = probabilities.argsort()[-3:][::-1]
            top_predictions = []
            for idx in top_indices:
                idx = int(idx)
                top_predictions.append({
                    "position": label_encoder.classes_[idx],
                    "probability": float(probabilities[idx])
                })

            # Ehtimolliklarni klass nomlari bilan bog‘lash
            prob_dict = dict(zip(label_encoder.classes_, probabilities))
            prob_of_predicted = prob_dict[position]

            # ===== YANGI: O'YINCHINING KUCHLI TOMONLARI =====
            # Featurelar va ularning qiymatlarini juftlash
            player_features = dict(zip(field_features, request.features))

            # Eng yuqori 5 atributni topish (qiymati bo'yicha)
            sorted_features = sorted(player_features.items(), key=lambda x: x[1], reverse=True)
            top_strengths = [{"name": feat, "value": round(val, 1)} for feat, val in sorted_features[:5]]

            response = {
                "player_type": "field",
                "predicted_position": position,
                "probability": float(prob_of_predicted),
                "confidence": "high" if prob_of_predicted > 0.7 else "medium" if prob_of_predicted > 0.5 else "low",
                "top_predictions": top_predictions,
                "all_probabilities": dict(zip(label_encoder.classes_, [float(p) for p in probabilities])),
                "player_strengths": top_strengths,  # <-- KUCHLI TOMONLAR
                "all_features": player_features      # <-- ISTASA HAMMA FEATURELAR
            }

        elif request.type == "gk":
            # Validate feature count
            validate_features(request.features, len(gk_features), "goalkeeper")

            # Scale features
            features_array = np.array(request.features).reshape(1, -1)
            scaled_features = gk_scaler.transform(features_array)

            # Predict
            predicted_level = gk_model.predict(scaled_features)[0]
            probabilities = gk_model.predict_proba(scaled_features)[0]

            # Get top 3 predictions
            top_indices = probabilities.argsort()[-3:][::-1]
            top_predictions = []
            for idx in top_indices:
                idx = int(idx)
                top_predictions.append({
                    "level": gk_model.classes_[idx],
                    "probability": float(probabilities[idx])
                })

            # Ehtimolliklarni klass nomlari bilan bog‘lash
            prob_dict = dict(zip(gk_model.classes_, probabilities))
            prob_of_predicted = prob_dict[predicted_level]

            # ===== YANGI: DARVOZABONNING KUCHLI TOMONLARI =====
            # Featurelar va ularning qiymatlarini juftlash
            player_features = dict(zip(gk_features, request.features))

            # Eng yuqori 5 atributni topish (qiymati bo'yicha)
            sorted_features = sorted(player_features.items(), key=lambda x: x[1], reverse=True)
            top_strengths = [{"name": feat, "value": round(val, 1)} for feat, val in sorted_features[:5]]

            response = {
                "player_type": "goalkeeper",
                "predicted_level": predicted_level,
                "probability": float(prob_of_predicted),
                "confidence": "high" if prob_of_predicted > 0.7 else "medium" if prob_of_predicted > 0.5 else "low",
                "top_predictions": top_predictions,
                "all_probabilities": dict(zip(gk_model.classes_, [float(p) for p in probabilities])),
                "player_strengths": top_strengths,  # <-- KUCHLI TOMONLAR
                "all_features": player_features      # <-- ISTASA HAMMA FEATURELAR
            }

        else:
            raise HTTPException(status_code=400, detail="Player type must be 'field' or 'gk'")

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

# ==================== POSITIONS ENDPOINT ====================
@app.get("/api/positions")
async def get_positions():
    """CSV dan barcha pozitsiyalarni olish"""
    try:
        df = pd.read_csv("FIFA-2019.csv")

        # Position ustunini olish va tozalash
        all_positions = set()
        for pos in df['Position'].dropna():
            # Vergul bilan ajratilgan bo'lsa, birinchi pozitsiyani olamiz
            main_pos = str(pos).split(',')[0].strip()
            if main_pos and main_pos != 'nan' and main_pos != '':
                all_positions.add(main_pos)

        # Pozitsiyalarni tartiblash (GK birinchi, keyin boshqalar)
        sorted_positions = sorted(list(all_positions))

        # GK ni birinchi qilish
        if 'GK' in sorted_positions:
            sorted_positions.remove('GK')
            sorted_positions.insert(0, 'GK')

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": sorted_positions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading positions: {str(e)}")

# ==================== PLAYER ENDPOINTS (TO'LIQ) ====================

@app.get("/api/players")
async def get_players(
    search: Optional[str] = None,
    position: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """O'yinchilarni qidirish va filterlash (CSV dan)"""
    try:
        df = pd.read_csv("FIFA-2019.csv")

        # Kerakli ustunlarni tanlash
        players = df[['ID', 'Name', 'Age', 'Overall', 'Position', 'Club', 'Nationality', 'Photo', 'Flag']].copy()

        # Position ni tozalash (asosiy pozitsiya)
        players['MainPosition'] = players['Position'].apply(
            lambda x: str(x).split(',')[0].strip() if pd.notnull(x) and str(x) != 'nan' else 'Unknown'
        )

        # Qidiruv filtri (name bo'yicha)
        if search:
            players = players[players['Name'].str.contains(search, case=False, na=False)]

        # Pozitsiya filtri
        if position and position != 'all' and position != '':
            players = players[players['MainPosition'] == position]

        # Null qiymatlarni tozalash
        players = players.dropna(subset=['Name', 'Overall'])

        # Umumiy soni
        total_count = len(players)

        # Overall bo'yicha tartiblash va limit/offset
        players = players.nlargest(total_count, 'Overall')
        players = players.iloc[offset:offset + limit]

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "data": players.to_dict(orient='records')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading players: {str(e)}")

@app.get("/api/players/top")
async def get_top_players(limit: int = 100):
    """Eng yaxshi o'yinchilarni olish (Overall bo'yicha)"""
    try:
        df = pd.read_csv("FIFA-2019.csv")

        # Kerakli ustunlarni tanlash
        players = df[['ID', 'Name', 'Age', 'Overall', 'Position', 'Club', 'Nationality', 'Photo']].copy()

        # Position ni tozalash
        players['MainPosition'] = players['Position'].apply(
            lambda x: str(x).split(',')[0].strip() if pd.notnull(x) and str(x) != 'nan' else 'Unknown'
        )

        # Null qiymatlarni tozalash
        players = players.dropna(subset=['Name', 'Overall'])

        # Overall bo'yicha tartiblash va limit
        players = players.nlargest(limit, 'Overall')

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": players.to_dict(orient='records')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading top players: {str(e)}")

@app.get("/api/players/position/{position}")
async def get_players_by_position(position: str, limit: int = 50):
    """Pozitsiya bo'yicha o'yinchilarni olish"""
    try:
        df = pd.read_csv("FIFA-2019.csv")

        # Position ni tozalash
        df['MainPosition'] = df['Position'].apply(
            lambda x: str(x).split(',')[0].strip() if pd.notnull(x) and str(x) != 'nan' else 'Unknown'
        )

        # Pozitsiya bo'yicha filter
        players = df[df['MainPosition'] == position]

        # Kerakli ustunlarni tanlash
        players = players[['ID', 'Name', 'Age', 'Overall', 'Position', 'Club', 'Nationality', 'Photo']].copy()

        # Null qiymatlarni tozalash
        players = players.dropna(subset=['Name', 'Overall'])

        # Overall bo'yicha tartiblash va limit
        players = players.nlargest(limit, 'Overall')

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "position": position,
            "count": len(players),
            "data": players.to_dict(orient='records')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading players by position: {str(e)}")

@app.post("/api/player-comparison")
async def get_player_comparison(player_ids: List[int]):
    """Tanlangan o'yinchilarning barcha featurelarini qaytaradi"""
    try:
        df = pd.read_csv("FIFA-2019.csv")

        # Tanlangan o'yinchilarni olish
        selected_players = df[df['ID'].isin(player_ids)]

        if selected_players.empty:
            raise HTTPException(status_code=404, detail="Players not found")

        result = []
        for _, player in selected_players.iterrows():
            # Position ni aniqlash
            position = str(player['Position']).split(',')[0].strip() if pd.notnull(player['Position']) and str(player['Position']) != 'nan' else 'Unknown'
            player_type = "gk" if position == "GK" else "field"

            # Featurelarni yig'ish
            features = {}

            if player_type == "field":
                # Field featurelari
                for feat in field_features:
                    if feat in player.index and pd.notnull(player[feat]):
                        try:
                            features[feat] = float(player[feat])
                        except:
                            features[feat] = 50.0
            else:
                # GK featurelari
                for feat in gk_features:
                    if feat in player.index and pd.notnull(player[feat]):
                        try:
                            features[feat] = float(player[feat])
                        except:
                            features[feat] = 50.0

            # Agar featurelar bo'lmasa, barcha mavjud statistikani olish
            if not features:
                # Barcha statistik ustunlarni olish
                stat_columns = [col for col in player.index if col not in ['ID', 'Name', 'Photo', 'Flag', 'Club Logo', 'Nationality', 'Club']]
                for col in stat_columns:
                    if pd.notnull(player[col]) and isinstance(player[col], (int, float)):
                        try:
                            features[col] = float(player[col])
                        except:
                            pass

            result.append({
                "id": int(player['ID']),
                "name": str(player['Name']) if pd.notnull(player['Name']) else "Unknown",
                "type": player_type,
                "position": position,
                "overall": int(player['Overall']) if pd.notnull(player['Overall']) else 0,
                "club": str(player['Club']) if pd.notnull(player['Club']) and str(player['Club']) != 'nan' else "Free Agent",
                "nationality": str(player['Nationality']) if pd.notnull(player['Nationality']) and str(player['Nationality']) != 'nan' else "Unknown",
                "age": int(player['Age']) if pd.notnull(player['Age']) else 0,
                "photo": str(player['Photo']) if pd.notnull(player['Photo']) and str(player['Photo']) != 'nan' else "",
                "features": features,
                "key_features": field_position_features.get(position, field_features[:5]) if player_type == "field"
                              else gk_level_features.get(position, gk_features[:5])
            })

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/player/{player_id}")
async def get_player_details(player_id: int):
    """Bitta o'yinchining batafsil ma'lumotlari"""
    try:
        df = pd.read_csv("FIFA-2019.csv")

        player = df[df['ID'] == player_id]
        if player.empty:
            raise HTTPException(status_code=404, detail="Player not found")

        player = player.iloc[0]

        # Position ni aniqlash
        position = str(player['Position']).split(',')[0].strip() if pd.notnull(player['Position']) and str(player['Position']) != 'nan' else 'Unknown'
        player_type = "gk" if position == "GK" else "field"

        # Featurelarni yig'ish
        features = {}
        feature_list = field_features if player_type == "field" else gk_features

        for feat in feature_list:
            if feat in player.index and pd.notnull(player[feat]):
                try:
                    features[feat] = float(player[feat])
                except:
                    pass

        # Eng kuchli 10 feature
        top_features = sorted(features.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": {
                "id": int(player['ID']),
                "name": str(player['Name']) if pd.notnull(player['Name']) else "Unknown",
                "type": player_type,
                "position": position,
                "overall": int(player['Overall']) if pd.notnull(player['Overall']) else 0,
                "club": str(player['Club']) if pd.notnull(player['Club']) and str(player['Club']) != 'nan' else "Free Agent",
                "nationality": str(player['Nationality']) if pd.notnull(player['Nationality']) and str(player['Nationality']) != 'nan' else "Unknown",
                "age": int(player['Age']) if pd.notnull(player['Age']) else 0,
                "photo": str(player['Photo']) if pd.notnull(player['Photo']) and str(player['Photo']) != 'nan' else "",
                "features": features,
                "top_features": top_features,
                "key_features": field_position_features.get(position, field_features[:5]) if player_type == "field"
                              else gk_level_features.get(position, gk_features[:5])
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ==================== FEATURE IMPORTANCE ENDPOINT ====================
@app.get("/api/feature-importance")
async def get_feature_importance():
    """Feature importance ma'lumotlarini qaytaradi"""
    try:
        # Field feature importance
        field_importance = {}
        if hasattr(field_model, 'feature_importances_'):
            for i, feat in enumerate(field_features):
                if i < len(field_model.feature_importances_):
                    field_importance[feat] = float(field_model.feature_importances_[i])

        # GK feature importance
        gk_importance = {}
        if hasattr(gk_model, 'feature_importances_'):
            for i, feat in enumerate(gk_features):
                if i < len(gk_model.feature_importances_):
                    gk_importance[feat] = float(gk_model.feature_importances_[i])

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": {
                "field": field_importance,
                "gk": gk_importance
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ==================== EXPORT PLAYERS ENDPOINT ====================
@app.post("/api/export-players")
async def export_players(player_ids: List[int]):
    """O'yinchilarni JSON formatida eksport qilish"""
    try:
        df = pd.read_csv("FIFA-2019.csv")
        selected_players = df[df['ID'].isin(player_ids)]

        if selected_players.empty:
            raise HTTPException(status_code=404, detail="Players not found")

        # JSON formatiga o'tkazish
        result = selected_players.to_dict(orient='records')

        return {
            "status": "success",
            "timestamp": get_timestamp(),
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
# ==================== RUN SERVER ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
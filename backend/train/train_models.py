import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

def train_fifa_models():
    print("🚀 Starting FIFA model training...")
    
    # Create directories
    os.makedirs("models", exist_ok=True)
    
    # ==================== 1. LOAD DATA ====================
    print("📊 Loading data...")
    df = pd.read_csv("FIFA-2019.csv")
    print(f"Dataset shape: {df.shape}")
    
    # ==================== 2. CLEAN POSITION DATA ====================
    print("🧹 Cleaning position data...")
    df["Position"] = df["Position"].apply(lambda x: str(x).split(",")[0] if pd.notnull(x) else "Unknown")
    
    # Separate GK and field players
    gk_df = df[df["Position"] == "GK"].copy()
    field_df = df[df["Position"] != "GK"].copy()
    
    print(f"Goalkeepers: {len(gk_df)}")
    print(f"Field players: {len(field_df)}")
    
    # ==================== 3. POSITION GROUPING ====================
    def group_position(pos):
        if pos == "Unknown":
            return "Unknown"
        if pos in ["ST", "CF", "LF", "RF", "LS", "RS"]:
            return "Forward"
        elif pos in ["LW", "RW"]:
            return "Winger"
        elif pos in ["CAM", "CM", "LM", "RM", "LCM", "RCM", "LAM", "RAM"]:
            return "Midfielder"
        elif pos in ["CDM", "LDM", "RDM"]:
            return "DefensiveMid"
        elif pos in ["CB", "LCB", "RCB"]:
            return "CenterBack"
        elif pos in ["LB", "RB", "LWB", "RWB"]:
            return "FullBack"
        else:
            return "Other"
    
    field_df["Position_Group"] = field_df["Position"].apply(group_position)
    
    # ==================== 4. FEATURE SELECTION ====================
    print("🔍 Selecting features...")
    
    field_features = [
        "Finishing", "Dribbling", "ShortPassing", "LongPassing",
        "BallControl", "SprintSpeed", "Acceleration", "Agility",
        "Reactions", "Strength", "Stamina", "Interceptions",
        "Marking", "StandingTackle", "Vision", "Positioning",
        "Composure", "Balance", "Jumping", "Aggression"
    ]
    
    gk_features = [
        "GKDiving", "GKHandling", "GKKicking", "GKPositioning",
        "GKReflexes", "Reactions", "Strength", "Jumping", "Composure"
    ]
    
    # Clean data
    field_df = field_df[field_df["Position_Group"] != "Unknown"].copy()
    field_df = field_df.dropna(subset=field_features + ["Position_Group"])
    gk_df = gk_df.dropna(subset=gk_features)
    
    print(f"Clean field players: {len(field_df)}")
    print(f"Clean goalkeepers: {len(gk_df)}")
    
    # ==================== 5. TRAIN FIELD MODEL ====================
    print("\n🎯 Training Field Player Model...")
    
    # Encode labels
    label_encoder = LabelEncoder()
    field_df["Position_Group_Encoded"] = label_encoder.fit_transform(field_df["Position_Group"])
    
    # Scale features
    scaler_field = StandardScaler()
    X_field = scaler_field.fit_transform(field_df[field_features])
    y_field = field_df["Position_Group_Encoded"]
    
    # Split data
    X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
        X_field, y_field, test_size=0.2, random_state=42, stratify=y_field
    )
    
    # Train model
    field_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=25,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    field_model.fit(X_train_f, y_train_f)
    
    # Evaluate
    y_pred_f = field_model.predict(X_test_f)
    acc_field = accuracy_score(y_test_f, y_pred_f)
    
    print(f"✅ Field Model Accuracy: {acc_field:.4f}")
    print("Classification Report:")
    print(classification_report(y_test_f, y_pred_f, target_names=label_encoder.classes_))
    
    # ==================== 6. TRAIN GK MODEL ====================
    print("\n🧤 Training Goalkeeper Model...")
    
    # Create GK levels
    gk_df["GK_Level"] = pd.cut(gk_df["Overall"], 
                              bins=[0, 65, 75, 85, 100], 
                              labels=["Bronze", "Silver", "Gold", "Elite"])
    
    # Scale features
    scaler_gk = StandardScaler()
    X_gk = scaler_gk.fit_transform(gk_df[gk_features])
    y_gk = gk_df["GK_Level"]
    
    # Split data
    X_train_g, X_test_g, y_train_g, y_test_g = train_test_split(
        X_gk, y_gk, test_size=0.2, random_state=42, stratify=y_gk
    )
    
    # Train model
    gk_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    
    gk_model.fit(X_train_g, y_train_g)
    
    # Evaluate
    y_pred_g = gk_model.predict(X_test_g)
    acc_gk = accuracy_score(y_test_g, y_pred_g)
    
    print(f"✅ GK Model Accuracy: {acc_gk:.4f}")
    print("Classification Report:")
    print(classification_report(y_test_g, y_pred_g))
    
    # ==================== 7. SAVE MODELS ====================
    print("\n💾 Saving models...")
    
    # Save models
    joblib.dump(field_model, "models/field_position_model.pkl")
    joblib.dump(gk_model, "models/gk_position_model.pkl")
    joblib.dump(scaler_field, "models/field_scaler.pkl")
    joblib.dump(scaler_gk, "models/gk_scaler.pkl")
    joblib.dump(label_encoder, "models/label_encoder.pkl")
    joblib.dump(field_features, "models/field_features.pkl")
    joblib.dump(gk_features, "models/gk_features.pkl")
    
    # Save metadata
    metadata = {
        'field_classes': label_encoder.classes_.tolist(),
        'field_accuracy': float(acc_field),
        'gk_accuracy': float(acc_gk),
        'field_samples': int(len(field_df)),
        'gk_samples': int(len(gk_df)),
        'training_date': pd.Timestamp.now().isoformat()
    }
    
    joblib.dump(metadata, "models/metadata.pkl")
    
    # ==================== 8. FEATURE IMPORTANCE ====================
    print("\n📈 Feature Importance Analysis")
    
    print("Top 10 Field Features:")
    field_importance = pd.DataFrame({
        'Feature': field_features,
        'Importance': field_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print(field_importance.head(10).to_string(index=False))
    
    print("\nTop 10 GK Features:")
    gk_importance = pd.DataFrame({
        'Feature': gk_features,
        'Importance': gk_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print(gk_importance.head(10).to_string(index=False))
    
    print("\n" + "="*50)
    print("✅ Training completed successfully!")
    print(f"📁 Models saved in: {os.path.abspath('models')}")
    print("="*50)

if __name__ == "__main__":
    train_fifa_models()
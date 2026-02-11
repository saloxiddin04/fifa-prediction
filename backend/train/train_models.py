# import pandas as pd
# import numpy as np
# import joblib
# import os
# from sklearn.model_selection import train_test_split, GridSearchCV
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.preprocessing import StandardScaler, LabelEncoder
# from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
# # import matplotlib.pyplot as plt
# # import seaborn as sns
# from warnings import filterwarnings
# filterwarnings('ignore')

# # ==============================
# # 1️⃣ LOAD DATA
# # ==============================

# print("Loading data...")
# df = pd.read_csv("FIFA-2019.csv")
# print(f"Dataset shape: {df.shape}")
# print(f"Columns: {df.columns.tolist()}")

# # ==============================
# # 2️⃣ CLEAN DATA
# # ==============================

# print("\nCleaning data...")

# # Positionni tozalash (faqat birinchi pozitsiya)
# def clean_position(x):
#     if pd.isnull(x):
#         return "Unknown"
#     try:
#         return str(x).split(",")[0].strip()
#     except:
#         return "Unknown"

# df["Position"] = df["Position"].apply(clean_position)

# # Pozitsiyalar taqsimotini ko'rish
# print("\nPosition distribution:")
# print(df["Position"].value_counts().head(10))

# # GK va Field ajratish
# gk_df = df[df["Position"] == "GK"].copy()
# field_df = df[df["Position"] != "GK"].copy()

# print(f"\nGoalkeepers count: {len(gk_df)}")
# print(f"Field players count: {len(field_df)}")

# # ==============================
# # 3️⃣ POSITION GROUPING FOR FIELD PLAYERS
# # ==============================

# def group_position(pos):
#     if pos == "Unknown":
#         return "Unknown"
#     elif pos in ["ST", "CF", "LF", "RF", "LS", "RS"]:
#         return "Forward"
#     elif pos in ["LW", "RW"]:
#         return "Winger"
#     elif pos in ["CAM", "CM", "LM", "RM", "LCM", "RCM", "LAM", "RAM"]:
#         return "Midfielder"
#     elif pos in ["CDM", "LDM", "RDM"]:
#         return "DefensiveMid"
#     elif pos in ["CB", "LCB", "RCB"]:
#         return "CenterBack"
#     elif pos in ["LB", "RB", "LWB", "RWB"]:
#         return "FullBack"
#     else:
#         return "Other"

# field_df["Position_Group"] = field_df["Position"].apply(group_position)

# # Guruhlar taqsimotini ko'rish
# print("\nField position groups distribution:")
# print(field_df["Position_Group"].value_counts())

# # ==============================
# # 4️⃣ FEATURE SELECTION
# # ==============================

# # Field players uchun eng muhim feature'lar
# field_features = [
#     "Finishing",      # Hujumkor o'yinchilar uchun
#     "Dribbling",      # Dribling
#     "ShortPassing",   # Qisqa uzatma
#     "LongPassing",    # Uzoq uzatma
#     "BallControl",    # To'pni ushlash
#     "SprintSpeed",    # Tezlik
#     "Acceleration",   # Tezlanish
#     "Agility",        # Chaqqonlik
#     "Reactions",      # Reaksiya
#     "Strength",       # Kuch
#     "Stamina",        # Chidamlilik
#     "Interceptions",  # To'pni kesish
#     "Marking",        # Markirovka
#     "StandingTackle", # Tik turib to'p olish
#     "Vision",         # Ko'rish
#     "Positioning",    # Pozitsiyalashish
#     "Composure",      # O'zini tutish
#     "Balance",        # Muvozanat
#     "Jumping",        # Sakrash
#     "Aggression"      # Agressiya
# ]

# # Goalkeepers uchun feature'lar
# gk_features = [
#     "GKDiving",       # Sakrash
#     "GKHandling",     # Qo'l texnikasi
#     "GKKicking",      # Zarba
#     "GKPositioning",  # Pozitsiyalashish
#     "GKReflexes",     # Reaksiya
#     "Reactions",      # Umumiy reaksiya
#     "Strength",       # Kuch
#     "Jumping",        # Sakrash
#     "Composure"       # O'zini tutish
# ]

# print(f"\nField features count: {len(field_features)}")
# print(f"GK features count: {len(gk_features)}")

# # NaNlarni tozalash
# field_df_clean = field_df[field_df["Position_Group"] != "Unknown"].copy()
# field_df_clean = field_df_clean.dropna(subset=field_features + ["Position_Group"])

# gk_df_clean = gk_df.dropna(subset=gk_features)

# print(f"\nAfter cleaning:")
# print(f"Clean field players: {len(field_df_clean)}")
# print(f"Clean goalkeepers: {len(gk_df_clean)}")

# # ==============================
# # 5️⃣ DATA PREPROCESSING
# # ==============================

# # Label encoding for field positions
# label_encoder = LabelEncoder()
# field_df_clean["Position_Group_Encoded"] = label_encoder.fit_transform(field_df_clean["Position_Group"])

# # Save label encoder classes
# label_mapping = dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_)))
# print("\nLabel mapping for field positions:")
# for label, code in label_mapping.items():
#     print(f"  {label}: {code}")

# # Scaling data
# scaler_field = StandardScaler()
# X_field = scaler_field.fit_transform(field_df_clean[field_features])
# y_field = field_df_clean["Position_Group_Encoded"]

# scaler_gk = StandardScaler()
# X_gk = scaler_gk.fit_transform(gk_df_clean[gk_features])
# y_gk = gk_df_clean["Position"]

# # ==============================
# # 6️⃣ TRAIN FIELD MODEL
# # ==============================

# print("\n" + "="*50)
# print("TRAINING FIELD PLAYER MODEL")
# print("="*50)

# X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
#     X_field, y_field, test_size=0.2, random_state=42, stratify=y_field
# )

# print(f"Training samples: {X_train_f.shape[0]}")
# print(f"Testing samples: {X_test_f.shape[0]}")

# # Optimized Random Forest parameters
# field_model = RandomForestClassifier(
#     n_estimators=300,
#     max_depth=25,
#     min_samples_split=5,
#     min_samples_leaf=2,
#     max_features='sqrt',
#     random_state=42,
#     n_jobs=-1,
#     verbose=1
# )

# print("\nTraining field model...")
# field_model.fit(X_train_f, y_train_f)

# # Predictions
# y_pred_f = field_model.predict(X_test_f)
# y_pred_proba_f = field_model.predict_proba(X_test_f)

# # Metrics
# acc_field = accuracy_score(y_test_f, y_pred_f)
# print(f"\nField Model Accuracy: {acc_field:.4f}")

# # Detailed classification report
# print("\nClassification Report for Field Players:")
# print(classification_report(y_test_f, y_pred_f, 
#                           target_names=label_encoder.classes_))

# # ==============================
# # 7️⃣ TRAIN GK MODEL
# # ==============================

# print("\n" + "="*50)
# print("TRAINING GOALKEEPER MODEL")
# print("="*50)

# # For goalkeepers, we'll predict specific positions
# # But since all are GK, we might want to predict something else like overall rating groups
# # Let's create categories for goalkeepers based on overall rating
# gk_df_clean["GK_Level"] = pd.cut(gk_df_clean["Overall"], 
#                                 bins=[0, 65, 75, 85, 100], 
#                                 labels=["Bronze", "Silver", "Gold", "Elite"])

# X_train_g, X_test_g, y_train_g, y_test_g = train_test_split(
#     X_gk, gk_df_clean["GK_Level"], test_size=0.2, random_state=42, stratify=gk_df_clean["GK_Level"]
# )

# print(f"Training samples: {X_train_g.shape[0]}")
# print(f"Testing samples: {X_test_g.shape[0]}")

# gk_model = RandomForestClassifier(
#     n_estimators=200,
#     max_depth=20,
#     random_state=42,
#     n_jobs=-1
# )

# print("\nTraining GK model...")
# gk_model.fit(X_train_g, y_train_g)

# y_pred_g = gk_model.predict(X_test_g)
# acc_gk = accuracy_score(y_test_g, y_pred_g)

# print(f"\nGK Model Accuracy: {acc_gk:.4f}")
# print("\nClassification Report for Goalkeepers:")
# print(classification_report(y_test_g, y_pred_g))

# # ==============================
# # 8️⃣ FEATURE IMPORTANCE ANALYSIS
# # ==============================

# print("\n" + "="*50)
# print("FEATURE IMPORTANCE ANALYSIS")
# print("="*50)

# # Field model feature importance
# field_importance = pd.DataFrame({
#     'Feature': field_features,
#     'Importance': field_model.feature_importances_
# }).sort_values('Importance', ascending=False)

# print("\nTop 10 Most Important Features for Field Players:")
# print(field_importance.head(10).to_string(index=False))

# # GK model feature importance
# gk_importance = pd.DataFrame({
#     'Feature': gk_features,
#     'Importance': gk_model.feature_importances_
# }).sort_values('Importance', ascending=False)

# print("\nTop 10 Most Important Features for Goalkeepers:")
# print(gk_importance.head(10).to_string(index=False))

# # ==============================
# # 9️⃣ SAVE MODELS AND ARTIFACTS
# # ==============================

# print("\n" + "="*50)
# print("SAVING MODELS AND ARTIFACTS")
# print("="*50)

# # Create models directory if not exists
# os.makedirs("models", exist_ok=True)

# # Save models
# joblib.dump(field_model, "models/field_position_model.pkl")
# joblib.dump(gk_model, "models/gk_position_model.pkl")
# joblib.dump(scaler_field, "models/field_scaler.pkl")
# joblib.dump(scaler_gk, "models/gk_scaler.pkl")
# joblib.dump(label_encoder, "models/label_encoder.pkl")
# joblib.dump(field_features, "models/field_features.pkl")
# joblib.dump(gk_features, "models/gk_features.pkl")

# # Save metadata
# metadata = {
#     'field_classes': label_encoder.classes_.tolist(),
#     'field_class_mapping': label_mapping,
#     'field_features': field_features,
#     'gk_features': gk_features,
#     'field_accuracy': float(acc_field),
#     'gk_accuracy': float(acc_gk),
#     'field_samples': int(len(field_df_clean)),
#     'gk_samples': int(len(gk_df_clean))
# }

# joblib.dump(metadata, "models/metadata.pkl")

# print("✓ All models and artifacts saved successfully!")

# # ==============================
# # 🔟 PREDICTION FUNCTION
# # ==============================

# def predict_position(player_features, is_goalkeeper=False):
#     """
#     Predict position for a new player
#     """
#     if is_goalkeeper:
#         # Scale features
#         scaled_features = scaler_gk.transform([player_features])
#         # Predict
#         prediction = gk_model.predict(scaled_features)[0]
#         probabilities = gk_model.predict_proba(scaled_features)[0]
        
#         return {
#             'predicted_position': prediction,
#             'probabilities': dict(zip(gk_model.classes_, probabilities))
#         }
#     else:
#         # Scale features
#         scaled_features = scaler_field.transform([player_features])
#         # Predict
#         encoded_pred = field_model.predict(scaled_features)[0]
#         probabilities = field_model.predict_proba(scaled_features)[0]
        
#         predicted_position = label_encoder.inverse_transform([encoded_pred])[0]
        
#         return {
#             'predicted_position': predicted_position,
#             'probabilities': dict(zip(label_encoder.classes_, probabilities))
#         }

# # Test prediction with example data
# print("\n" + "="*50)
# print("TESTING PREDICTION FUNCTION")
# print("="*50)

# # Example field player (average midfielder stats)
# example_field_player = [75, 80, 85, 75, 82, 78, 80, 79, 82, 70, 85, 65, 60, 62, 75, 70, 75, 78, 70, 60]
# example_gk_player = [80, 75, 70, 82, 85, 82, 70, 75, 78]

# print("\nExample Field Player Prediction:")
# field_pred = predict_position(example_field_player, is_goalkeeper=False)
# print(f"Predicted Position: {field_pred['predicted_position']}")
# print("Probabilities:")
# for pos, prob in sorted(field_pred['probabilities'].items(), key=lambda x: x[1], reverse=True):
#     print(f"  {pos}: {prob:.4f}")

# print("\nExample Goalkeeper Prediction:")
# gk_pred = predict_position(example_gk_player, is_goalkeeper=True)
# print(f"Predicted Level: {gk_pred['predicted_position']}")
# print("Probabilities:")
# for level, prob in sorted(gk_pred['probabilities'].items(), key=lambda x: x[1], reverse=True):
#     print(f"  {level}: {prob:.4f}")

# # ==============================
# # 11️⃣ SUMMARY
# # ==============================

# print("\n" + "="*50)
# print("TRAINING SUMMARY")
# print("="*50)
# print(f"Field Players Model Accuracy: {acc_field:.4f}")
# print(f"Goalkeepers Model Accuracy: {acc_gk:.4f}")
# print(f"Total Field Players Used: {len(field_df_clean)}")
# print(f"Total Goalkeepers Used: {len(gk_df_clean)}")
# print(f"Field Position Groups: {len(label_encoder.classes_)}")
# print(f"Saved Models: 5 (field, gk, scalers, encoder)")
# print(f"Models Location: ./models/")
# print("="*50)

# print("\nTraining completed successfully! ✓")

"""
Training script for FIFA Position Prediction Models
Run this first to train and save models
"""
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
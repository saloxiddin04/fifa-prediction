#!/usr/bin/env python3
"""
Run script for FIFA Prediction API
"""
import os
import sys
import subprocess

def check_requirements():
    """Check if required packages are installed"""
    required_packages = ['fastapi', 'uvicorn', 'pandas', 'numpy', 'joblib', 'sklearn']
    
    missing = []
    for package in required_packages:
        try:
            if package == 'sklearn':
                __import__('sklearn')
            else:
                __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print("❌ Missing required packages:")
        for package in missing:
            print(f"  - {package}")
        print("\nPlease install them using:")
        print("  pip install fastapi uvicorn pandas numpy scikit-learn joblib python-dotenv")
        return False
    
    return True

def check_models():
    """Check if model files exist"""
    model_files = [
        "field_position_model.pkl",
        "gk_position_model.pkl",
        "field_scaler.pkl",
        "gk_scaler.pkl",
        "label_encoder.pkl",
        "field_features.pkl",
        "gk_features.pkl",
        "metadata.pkl"
    ]
    
    missing = []
    print("🔍 Checking model files...")
    
    for file in model_files:
        file_path = f"./models/{file}"
        if os.path.exists(file_path):
            print(f"  ✓ {file}")
        else:
            print(f"  ✗ {file} (missing)")
            missing.append(file)
    
    if missing:
        print(f"\n⚠️  {len(missing)} model files are missing")
        print("Please run the training script first:")
        print("  python train/train_models.py")
        return False
    
    return True

def main():
    print("⚽ FIFA Position Prediction API")
    print("="*50)
    
    # Check requirements
    print("\n📦 Checking requirements...")
    if not check_requirements():
        sys.exit(1)
    
    # Check models
    print("\n🤖 Checking models...")
    if not check_models():
        response = input("\n⚠️  Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Run FastAPI server
    print("\n" + "="*50)
    print("🚀 Starting FastAPI server...")
    print("📡 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("🎯 Health: http://localhost:8000/api/health")
    print("="*50)
    
    try:
        # Import and run uvicorn
        import uvicorn
        from main import app
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\nMake sure all requirements are installed:")
        print("  pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()
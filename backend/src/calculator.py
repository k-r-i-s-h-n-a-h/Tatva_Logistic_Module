import math
import joblib
import os
import pandas as pd

class LogisticsCalculator:
    def __init__(self, json_data):
        self.data = json_data
        self.measurements = self.data.get('measurements', {})
        self.packaging = self.data.get('packaging', {})
        self.order_details = self.data.get('order_details', {})
        
        # Paths to our AI brain
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(os.path.dirname(script_dir), "models", "divisor_model.pkl")
        self.encoder_path = os.path.join(os.path.dirname(script_dir), "models", "label_encoders.pkl")

    def get_ai_predicted_divisor(self, features):
        """Uses the trained Random Forest model to predict the optimal divisor."""
        try:
            if not os.path.exists(self.model_path):
                return 5000 # Fallback if model isn't trained yet
            
            model = joblib.load(self.model_path)
            encoders = joblib.load(self.encoder_path)

            # Prepare the data for the AI
            # AI needs a DataFrame with the exact column names used during training
            input_df = pd.DataFrame([{
                "Service_Category": encoders['Service_Category'].transform([features['category']])[0],
                "Material_Shape": encoders['Material_Shape'].transform([features['shape']])[0],
                "Is_Fragile": int(features['is_fragile']),
                "Length_cm": features['l'],
                "Width_cm": features['w'],
                "Height_cm": features['h'],
                "Actual_Weight_kg": features['weight'],
                "Density": features['density']
            }])

            prediction = model.predict(input_df)[0]
            return round(prediction)
        except Exception as e:
            print(f"AI Prediction Error: {e}. Falling back to standard 5000.")
            return 5000

    def calculate_metrics(self):
        # 1. Basic Measurements
        l = self.measurements.get('length', 0)
        w = self.measurements.get('width', 0)
        h = self.measurements.get('height', 0)
        weight = self.measurements.get('actual_weight_kg', 0)
        qty = self.packaging.get('quantity', 1)

        # 2. Physics Calculations
        vol = l * w * h * qty
        density = (weight * qty) / vol if vol > 0 else 0
        
        # 3. GET AI DIVISOR
        feature_set = {
            "category": self.order_details.get('service_category', 'Interiors'),
            "shape": "Box" if self.packaging.get('shape') == "N/A" else self.packaging.get('shape', 'Box'),
            "is_fragile": self.order_details.get('is_fragile', False),
            "l": l, "w": w, "h": h, "weight": weight, "density": density
        }
        
        divisor = self.get_ai_predicted_divisor(feature_set)
        
        # 4. Final Logistics Math
        volumetric_weight = vol / divisor
        actual_total_weight = weight * qty
        chargeable_weight = max(actual_total_weight, volumetric_weight)

        return {
            "total_dead_weight_kg": round(actual_total_weight, 2),
            "total_volume_cm3": round(vol, 2),
            "chargeable_weight_kg": math.ceil(chargeable_weight),
            "dynamic_divisor_used": divisor,
            "max_dimension_cm": max(l, w, h),
            "is_fragile": feature_set['is_fragile'],
            "ai_mode": True # Just to track it's using the model
        }
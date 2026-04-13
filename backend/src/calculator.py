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
        self.items = self.data.get('items', [])
        self.BULK_DENSITY = {
            "Loose Sand / Jelly": 1600, 
            "Bricks": 1900,
            "Cement Sacks": 1500,
            "Default_Bulk": 1600
        }
        
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
        total_dead_weight = 0
        total_volume_cm3 = 0
        total_volumetric_weight = 0
        max_dim_overall = 0
        is_fragile_overall = False

        for item in self.items:
            qty = item.get('quantity', 1)
            weight_per_unit = item.get('weight', 0)
            item_dead_weight = weight_per_unit * qty
            
            # --- NEW LOGIC FOR CONSTRUCTION ---
            if item.get('shape') == "Loose Bulk":
                # Volume (m3) = Mass / Density
                material = item.get('material_type', 'Default_Bulk')
                density = self.BULK_DENSITY.get(material, 1600)
                
                volume_m3 = item_dead_weight / density
                item_vol = volume_m3 * 1000000 # Convert m3 to cm3
                
                # For bulk, max dimension is roughly the cube root of volume
                l = w = h = (item_vol ** (1/3))
            else:
                l = item.get('length', 0)
                w = item.get('width', 0)
                h = item.get('height', 0)
                item_vol = l * w * h * qty

            density_calc = item_dead_weight / item_vol if item_vol > 0 else 0
            
            feature_set = {
                "category": item.get('category', 'Interiors'),
                "shape": "Box" if item.get('shape') in ["N/A", "Loose Bulk"] else item.get('shape', 'Box'),
                "is_fragile": item.get('is_fragile', False),
                "l": l, "w": w, "h": h, "weight": weight_per_unit, "density": density_calc
            }
            divisor = self.get_ai_predicted_divisor(feature_set)
            
            total_dead_weight += item_dead_weight
            total_volume_cm3 += item_vol
            total_volumetric_weight += (item_vol / divisor)
            max_dim_overall = max(max_dim_overall, l, w, h)
            if item.get('is_fragile'): is_fragile_overall = True

        chargeable_weight = max(total_dead_weight, total_volumetric_weight)

        return {
            "total_dead_weight_kg": round(total_dead_weight, 2),
            "total_volume_cm3": round(total_volume_cm3, 2),
            "chargeable_weight_kg": math.ceil(chargeable_weight),
            "dynamic_divisor_used": "Mixed (AI per item)",
            "max_dimension_cm": round(max_dim_overall, 2),
            "is_fragile": is_fragile_overall,
            "item_count": len(self.items),
            "ai_mode": True
        }
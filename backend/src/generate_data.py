import pandas as pd
import random
import numpy as np
import os

def generate_synthetic_logistics_data(num_samples=10000):
    data = []
    
    # Define our Tatvaops Categories and their realistic physical boundaries
    categories = [
        {"name": "Painting", "shape": "Cylindrical", "fragile": False, "l_range": (20, 40), "w_range": (20, 40), "h_range": (30, 50), "wt_range": (10, 30)},
        {"name": "Interiors", "shape": "Box", "fragile": False, "l_range": (50, 200), "w_range": (50, 100), "h_range": (50, 100), "wt_range": (15, 60)},
        {"name": "Interiors_Glass", "shape": "Wrapped", "fragile": True, "l_range": (40, 150), "w_range": (40, 150), "h_range": (5, 20), "wt_range": (10, 40)},
        {"name": "Solar Services", "shape": "Box", "fragile": True, "l_range": (150, 220), "w_range": (80, 110), "h_range": (4, 10), "wt_range": (18, 30)},
        {"name": "Construction", "shape": "Irregular", "fragile": False, "l_range": (30, 100), "w_range": (30, 100), "h_range": (20, 50), "wt_range": (40, 100)}
    ]

    for _ in range(num_samples):
        # 1. Pick a random category
        cat = random.choice(categories)
        
        # 2. Generate random dimensions within the realistic limits
        length = round(random.uniform(*cat["l_range"]), 1)
        width = round(random.uniform(*cat["w_range"]), 1)
        height = round(random.uniform(*cat["h_range"]), 1)
        weight = round(random.uniform(*cat["wt_range"]), 1)
        
        volume = length * width * height
        density = weight / volume if volume > 0 else 0
        
        # 3. The "Oracle" Logic: Assigning the Target Divisor
        # This is what our ML model will eventually learn to predict on its own
        if cat["fragile"]:
            target_divisor = 3500  # Penalize for un-stackable/fragile
        elif cat["shape"] == "Cylindrical" or cat["shape"] == "Irregular":
            target_divisor = 4500  # Penalize slightly for wasted gap space
        elif density > 0.0005: 
            # High density items (like construction materials) get a better divisor 
            # because they are compact and heavy
            target_divisor = 5500 
        else:
            target_divisor = 5000  # Standard stackable box

        # 4. Append to dataset
        data.append({
            "Service_Category": cat["name"].split("_")[0],
            "Material_Shape": cat["shape"],
            "Is_Fragile": int(cat["fragile"]),
            "Length_cm": length,
            "Width_cm": width,
            "Height_cm": height,
            "Volume_cm3": round(volume, 2),
            "Actual_Weight_kg": weight,
            "Density": round(density, 6),
            "Target_Divisor": target_divisor # <--- THE Y VARIABLE
        })
        
    # Convert to Pandas DataFrame
    df = pd.DataFrame(data)
    
    # --- OS LOGIC (Happens AFTER data is generated) ---
    # Get the folder where this script lives (src) and go up one level (to backend)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(os.path.dirname(script_dir), "data")
    
    # Create the 'data' folder if it doesn't exist
    os.makedirs(data_dir, exist_ok=True)
    
    # Save the file safely using the correct dynamic path
    file_path = os.path.join(data_dir, "synthetic_logistics_data.csv")
    df.to_csv(file_path, index=False)
    # --------------------------------------------------

    print(f"Successfully generated {num_samples} rows of training data at: {file_path}")
    print(df.head())

    
if __name__ == "__main__":
    generate_synthetic_logistics_data(10000)
import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error
import joblib

def train_dynamic_divisor_model():
    print("Loading synthetic data...")
    # Find the data file we generated earlier
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(os.path.dirname(script_dir), "data", "synthetic_logistics_data.csv")
    
    df = pd.read_csv(data_path)

    # 1. Preprocessing: Convert text (like "Box", "Cylindrical") into numbers for the AI
    print("Preprocessing data...")
    label_encoders = {}
    for column in ['Service_Category', 'Material_Shape']:
        le = LabelEncoder()
        df[column] = le.fit_transform(df[column])
        label_encoders[column] = le

    # 2. Define Features (X) and Target (y)
    # These are the inputs the AI will look at to make a decision
    X = df[['Service_Category', 'Material_Shape', 'Is_Fragile', 'Length_cm', 'Width_cm', 'Height_cm', 'Actual_Weight_kg', 'Density']]
    
    # This is what the AI is trying to predict
    y = df['Target_Divisor']

    # 3. Split the data (80% for training, 20% for testing)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Train the AI Model (Random Forest is great for this kind of tabular data)
    print("Training the Random Forest AI Model. This might take a few seconds...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 5. Test the Model
    predictions = model.predict(X_test)
    error = mean_absolute_error(y_test, predictions)
    print(f"Model Training Complete!")
    print(f"Mean Absolute Error: {round(error, 2)} (On average, the AI's divisor prediction is off by this much)")

    # 6. Save the trained model and the encoders so the calculator can use them later
    model_dir = os.path.join(os.path.dirname(script_dir), "models")
    os.makedirs(model_dir, exist_ok=True)
    
    joblib.dump(model, os.path.join(model_dir, "divisor_model.pkl"))
    joblib.dump(label_encoders, os.path.join(model_dir, "label_encoders.pkl"))
    print(f"Model successfully saved to backend/models/!")

if __name__ == "__main__":
    train_dynamic_divisor_model()
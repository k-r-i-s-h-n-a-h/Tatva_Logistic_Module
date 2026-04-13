from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from .calculator import LogisticsCalculator
from .optimizer import LogisticsOptimizer
from .analyst import LogisticsAnalyst
from dotenv import load_dotenv
from ultralytics import SAM  # <-- UPGRADED: Replaced YOLO with Segment Anything Model 2
from google import genai
from google.genai import types
import os, json, ast, shutil
from PIL import Image

load_dotenv()

app = FastAPI(title="TatvaConnect Smart Engine API")

# Allow the React frontend to talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the optimizer once
optimizer = LogisticsOptimizer()
analyst = LogisticsAnalyst(optimizer.vehicles)

# --- UPGRADED: AI MODEL STACK ---
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 2. SAM 2: Pixel-Perfect Edge Refinement
sam_model = SAM("sam2.1_t.pt")

# --- HELPER: Metric Math ---
def get_cm(relative_length, ref_relative_length, ref_actual_cm=25):
    if ref_relative_length <= 0: return 0
    return round((relative_length / ref_relative_length) * ref_actual_cm, 1) 


# --- ENDPOINT 1: ANALYZE (The New Intelligence Phase) ---
@app.post("/cargo/analyze")
async def analyze_cargo(image: UploadFile = File(...), view_type: str = Form(...)):
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # 1. SPATIAL GROUNDING (Gemini 1.5 Flash)
        image_data = open(temp_path, "rb").read()
        vlm_prompt = """
        Analyze this logistics cargo image.
        1. Identify the reference object (e.g., a bottle) used for scale.
        2. Identify the main cargo material (e.g., Plywood, Cement Sacks, Cartons).
        3. Return their bounding boxes in normalized coordinates [ymin, xmin, ymax, xmax] scaled from 0 to 1000.
        
        Return ONLY valid JSON:
        {
          "cargo": {"category": "string", "is_fragile": boolean, "box_2d": [ymin, xmin, ymax, xmax]},
          "reference": {"label": "string", "box_2d": [ymin, xmin, ymax, xmax]}
        }
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_data, mime_type='image/jpeg'),
                vlm_prompt
            ]
        )
        
        # Parse AI response safely
        try:
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            ai_data = ast.literal_eval(cleaned_json) if "'" in cleaned_json else json.loads(cleaned_json)
        except Exception as e:
            print(f"VLM Parse Error: {e}")
            ai_data = {"cargo": {"category": "Cargo", "box_2d": [0,0,0,0]}, "reference": {"box_2d": [0,0,0,0]}}

        cargo_info = ai_data.get("cargo", {})
        ref_info = ai_data.get("reference", {})
        cargo_box = cargo_info.get("box_2d", [0,0,0,0])
        ref_box = ref_info.get("box_2d", [0,0,0,0])

        # Initialize Results
        # Initialize Results
        dims = {"l": 0, "w": 0, "h": 0}
        final_ui_box = cargo_box # Default to Gemini's box just in case
        
        # 2. DUAL-OBJECT REFINEMENT (SAM 2)
        with Image.open(temp_path) as img:
            img_w, img_h = img.size

        if sum(cargo_box) > 0 and sum(ref_box) > 0:
            cargo_px = [(cargo_box[1]/1000)*img_w, (cargo_box[0]/1000)*img_h, (cargo_box[3]/1000)*img_w, (cargo_box[2]/1000)*img_h]
            ref_px = [(ref_box[1]/1000)*img_w, (ref_box[0]/1000)*img_h, (ref_box[3]/1000)*img_w, (ref_box[2]/1000)*img_h]

            sam_results = sam_model.predict(source=temp_path, bboxes=[cargo_px, ref_px], verbose=False)
            
            if len(sam_results) > 0 and len(sam_results[0].boxes) >= 2:
                # SAM Result Index 0 = Cargo, Index 1 = Reference
                cargo_refined = sam_results[0].boxes.xyxy[0].tolist() # Format: [xmin, ymin, xmax, ymax] in Pixels
                ref_refined = sam_results[0].boxes.xyxy[1].tolist()

                # Calculate spans in raw pixels for math
                cargo_w_px = cargo_refined[2] - cargo_refined[0]
                cargo_h_px = cargo_refined[3] - cargo_refined[1]
                ref_h_px = ref_refined[3] - ref_refined[1] 
                
                # --- NEW: Convert SAM 2 Pixels back to 0-1000 scale for React ---
                final_ui_box = [
                    (cargo_refined[1] / img_h) * 1000, # ymin
                    (cargo_refined[0] / img_w) * 1000, # xmin
                    (cargo_refined[3] / img_h) * 1000, # ymax
                    (cargo_refined[2] / img_w) * 1000  # xmax
                ]
                
                # 3. PRECISION MATH
                if ref_h_px > 0:
                    if view_type == "front":
                        dims["l"] = get_cm(cargo_w_px, ref_h_px, 25)
                        dims["h"] = get_cm(cargo_h_px, ref_h_px, 25)
                    else:
                        dims["w"] = get_cm(cargo_w_px, ref_h_px, 25)

        # 4. FINAL PAYLOAD
        return {
            "status": "success",
            "detected_items": [{
                "label": cargo_info.get("category", "Cargo"),
                "box_2d": final_ui_box, # <--- Send the SAM 2 refined box!
                "dimensions": dims,
                "requires_manual_entry": False if (dims["l"] > 0 or dims["w"] > 0) else True
            }]
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# --- ENDPOINT 2: ESTIMATE (Math Phase) ---
@app.post("/cargo/estimate")
async def estimate_metrics(payload: dict):
    calc = LogisticsCalculator(payload)
    metrics = calc.calculate_metrics()
    return {"status": "success", "metrics": metrics}


# --- ENDPOINT 3: RECOMMEND (Decision Phase) ---
@app.post("/vehicle/recommend")
async def recommend_vehicle(payload: dict):
    metrics = payload.get('metrics')
    items = payload.get('items')
    
    recommendation = optimizer.recommend_vehicle(metrics, payload)
    expert_insight = analyst.get_expert_review(metrics, items, recommendation['vehicle'])
    
    if expert_insight and expert_insight.get('override_vehicle') != "None":
        recommendation['vehicle'] = expert_insight['override_vehicle']
        recommendation['reasoning_note'] = expert_insight.get('reasoning')
        recommendation['stacking_advice'] = expert_insight.get('stacking_plan')

    return recommendation
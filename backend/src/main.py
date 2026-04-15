import os
from dotenv import load_dotenv

# 1. Explicitly point to the .env file in the parent directory BEFORE importing local modules
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# 2. Now import everything else
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .calculator import LogisticsCalculator
from .optimizer import LogisticsOptimizer
from .analyst import LogisticsAnalyst
from ultralytics import SAM
from google import genai
from google.genai import types
import json, ast, shutil
import numpy as np
import cv2
from PIL import Image

from pydantic import BaseModel
import asyncio
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

# ... rest of your code ...

class QuoteRequest(BaseModel):
    pickup_pincode: str
    delivery_pincode: str
    weight_kg: float

class BookRequest(BaseModel):
    carrier_id: int
    order_details: dict

load_dotenv()

app = FastAPI(title="TatvaConnect Smart Engine API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

optimizer = LogisticsOptimizer()
analyst   = LogisticsAnalyst(optimizer.vehicles)
client    = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
sam_model = SAM("sam2.1_t.pt")


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def box_coverage(box_2d: list) -> tuple[float, float]:
    ymin, xmin, ymax, xmax = box_2d
    return (xmax - xmin) / 1000, (ymax - ymin) / 1000


def is_valid_cargo_box(box_2d: list) -> bool:
    """
    Only reject when BOTH axes exceed 90 % simultaneously.
    This is the "grabbed the entire warehouse scene" signature.
    A close-up box legitimately filling 85 %+ of ONE axis is fine.
    """
    w_frac, h_frac = box_coverage(box_2d)
    return not (w_frac > 0.90 and h_frac > 0.90)


def is_valid_mask(mask_tensor, max_fill: float = 0.55) -> bool:
    """Reject SAM masks that fill more than 55 % of the image."""
    mask_np = mask_tensor.cpu().numpy()
    return (mask_np.sum() / mask_np.size) < max_fill


# ─────────────────────────────────────────────────────────────────────────────
# GEOMETRY
# ─────────────────────────────────────────────────────────────────────────────

def pixels_to_cm(pixel_len: float, ref_h_px: float, ref_cm: float = 25.0) -> float:
    if ref_h_px <= 0:
        return 0.0
    return round((pixel_len / ref_h_px) * ref_cm, 1)


def get_mask_bbox_height(mask_tensor) -> float:
    mask_np = mask_tensor.cpu().numpy().astype(np.uint8)
    rows = np.any(mask_np, axis=1)
    if not rows.any():
        return 0.0
    rmin, rmax = np.where(rows)[0][[0, -1]]
    return float(rmax - rmin)


def extract_true_edges(mask_tensor, epsilon_factor: float = 0.02) -> dict:
    """
    findContours → approxPolyDP → classify edges as horizontal or vertical.
    Returns longest H edge (→ Length or Width) and longest V edge (→ Height).
    """
    mask_np = mask_tensor.cpu().numpy().astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return {"longest_h_px": 0.0, "longest_v_px": 0.0, "approx_pts": []}

    largest = max(contours, key=cv2.contourArea)
    epsilon = epsilon_factor * cv2.arcLength(largest, closed=True)
    approx  = cv2.approxPolyDP(largest, epsilon, closed=True)
    pts     = approx.reshape(-1, 2).astype(float)

    longest_h = longest_v = 0.0
    for i in range(len(pts)):
        p1, p2   = pts[i], pts[(i + 1) % len(pts)]
        dx, dy   = abs(p2[0] - p1[0]), abs(p2[1] - p1[1])
        edge_len = float(np.hypot(dx, dy))
        if dx >= dy:
            longest_h = max(longest_h, edge_len)
        else:
            longest_v = max(longest_v, edge_len)

    return {"longest_h_px": longest_h, "longest_v_px": longest_v, "approx_pts": pts.tolist()}


def normalise_pts(pts: list, mask_w: int, mask_h: int) -> list:
    return [[round((p[0] / mask_w) * 1000), round((p[1] / mask_h) * 1000)] for p in pts]


def mask_tight_ui_box(mask_tensor, img_w: int, img_h: int) -> list:
    mask_np = mask_tensor.cpu().numpy().astype(np.uint8)
    rows = np.any(mask_np, axis=1)
    cols = np.any(mask_np, axis=0)
    if not rows.any() or not cols.any():
        return [0, 0, 0, 0]
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    return [
        round((rmin / img_h) * 1000), round((cmin / img_w) * 1000),
        round((rmax / img_h) * 1000), round((cmax / img_w) * 1000),
    ]


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 1 — ANALYZE
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/cargo/analyze")
async def analyze_cargo(image: UploadFile = File(...), view_type: str = Form(...)):
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buf:
            shutil.copyfileobj(image.file, buf)

        image_bytes = open(temp_path, "rb").read()

        # ── Step 1: Gemini spatial grounding ─────────────────────────────
        vlm_prompt = """
You are a logistics cargo measurement assistant.

TASK:
1. Find the SINGLE PRIMARY cargo item — the ONE box/sack/package that is the
   main subject (closest to camera, most centred, largest foreground item).
2. Find the REFERENCE OBJECT — a water bottle (~25 cm tall) placed beside the
   cargo for scale calibration.

RULES:
- Draw TIGHT bounding boxes that closely hug each individual object.
- Do NOT let the cargo box include background shelves, floor, walls, or
  adjacent boxes — only the single primary foreground item.
- If the reference bottle is NOT visible in the image set its box_2d to
  [0,0,0,0] and set "bottle_present" to false.
- When unsure, draw the box SMALLER rather than larger.

Return ONLY valid JSON, no markdown:
{
  "cargo":          { "category": "string", "is_fragile": boolean, "box_2d": [ymin, xmin, ymax, xmax] },
  "reference":      { "label": "string",    "box_2d": [ymin, xmin, ymax, xmax] },
  "bottle_present": true
}
All coordinates are integers 0–1000.
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                vlm_prompt,
            ],
        )

        try:
            cleaned = response.text.strip().replace("```json", "").replace("```", "")
            ai_data = ast.literal_eval(cleaned) if "'" in cleaned else json.loads(cleaned)
        except Exception as e:
            print(f"[VLM parse error] {e}")
            return _fallback("Could not parse AI response — please enter dimensions manually.", "parse_error")

        cargo_info     = ai_data.get("cargo",     {})
        ref_info       = ai_data.get("reference", {})
        bottle_present = ai_data.get("bottle_present", True)
        cargo_box      = cargo_info.get("box_2d", [0, 0, 0, 0])
        ref_box        = ref_info.get("box_2d",   [0, 0, 0, 0])

        # ── Step 2: No-cargo guard ────────────────────────────────────────
        if sum(cargo_box) == 0:
            return _fallback("No cargo detected — please enter dimensions manually.", "no_cargo")

        # ── Step 3: Scene-grab guard (both axes > 90 %) ───────────────────
        if not is_valid_cargo_box(cargo_box):
            return _fallback(
                "Detection covered the whole scene — frame the box more tightly and retry, or enter manually.",
                "too_broad"
            )

        # ── Step 4: Bottle presence ───────────────────────────────────────
        bottle_missing = (not bottle_present) or sum(ref_box) == 0

        # ── Step 5: Image size ────────────────────────────────────────────
        with Image.open(temp_path) as img:
            img_w, img_h = img.size

        def to_px(box):
            return [
                (box[1] / 1000) * img_w, (box[0] / 1000) * img_h,
                (box[3] / 1000) * img_w, (box[2] / 1000) * img_h,
            ]

        # ── Step 6: SAM 2 — segment cargo (+bottle if present) ───────────
        bboxes = [to_px(cargo_box)]
        if not bottle_missing:
            bboxes.append(to_px(ref_box))

        sam_results = sam_model.predict(source=temp_path, bboxes=bboxes, verbose=False)

        if not sam_results or len(sam_results[0].masks.data) < 1:
            return _fallback("SAM returned no masks — please enter dimensions manually.", "sam_failed")

        masks      = sam_results[0].masks.data
        cargo_mask = masks[0]

        # ── Step 7: Mask quality gate ─────────────────────────────────────
        if not is_valid_mask(cargo_mask):
            return _fallback(
                "Cargo mask was too large — try framing the box more tightly, or enter manually.",
                "mask_too_large"
            )

        # ── Step 8: Corner/keypoint extraction ───────────────────────────
        cargo_edges    = extract_true_edges(cargo_mask)
        mask_h, mask_w = cargo_mask.shape[-2], cargo_mask.shape[-1]
        norm_pts       = normalise_pts(cargo_edges["approx_pts"], mask_w, mask_h)
        ui_box         = mask_tight_ui_box(cargo_mask, img_w, img_h)

        # ── Step 9: Real-world dimension math ────────────────────────────
        dims            = {"l": 0, "w": 0, "h": 0}
        requires_manual = True
        warning         = None

        if bottle_missing:
            warning = "No reference bottle in photo — polygon shown but dimensions need manual entry."
        elif len(masks) >= 2:
            ref_h_px = get_mask_bbox_height(masks[1])
            if ref_h_px > 0:
                if view_type == "front":
                    dims["l"] = pixels_to_cm(cargo_edges["longest_h_px"], ref_h_px)
                    dims["h"] = pixels_to_cm(cargo_edges["longest_v_px"], ref_h_px)
                else:
                    dims["w"] = pixels_to_cm(cargo_edges["longest_h_px"], ref_h_px)
                requires_manual = not any(v > 0 for v in dims.values())
            else:
                warning = "Reference bottle mask was empty — please enter dimensions manually."
        else:
            warning = "Reference bottle not segmented — please enter dimensions manually."

        return {
            "status":         "success",
            "bottle_detected": not bottle_missing,
            "warning":         warning,
            "detected_items": [{
                "label":                 cargo_info.get("category", "Cargo"),
                "box_2d":                ui_box,
                "approx_pts":            norm_pts,
                "dimensions":            dims,
                "requires_manual_entry": requires_manual,
            }],
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def _fallback(message: str, reason: str = "unknown") -> dict:
    return {
        "status":  "manual_required",
        "reason":  reason,
        "message": message,
        "detected_items": [],
    }


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 2 — ESTIMATE
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/cargo/estimate")
async def estimate_metrics(payload: dict):
    calc    = LogisticsCalculator(payload)
    metrics = calc.calculate_metrics()
    return {"status": "success", "metrics": metrics}


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 3 — RECOMMEND
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/vehicle/recommend")
async def recommend_vehicle(payload: dict):
    metrics = payload.get("metrics")
    items   = payload.get("items")
    rec     = optimizer.recommend_vehicle(metrics, payload)
    expert  = analyst.get_expert_review(metrics, items, rec["vehicle"])

    if expert and expert.get("override_vehicle") != "None":
        rec["vehicle"]         = expert["override_vehicle"]
        rec["reasoning_note"]  = expert.get("reasoning")
        rec["stacking_advice"] = expert.get("stacking_plan")

    return rec

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 4 — MCP SHIPROCKET QUOTE 
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/carrier/quote")
async def get_quotes(request: QuoteRequest):
    # Setup parameters for the MCP server process
    server_params = StdioServerParameters(
        command="python",
        args=["src/mcp_shiprocket.py"],
        env=os.environ.copy()
    )
    
    try:
        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                
                result = await session.call_tool(
                    "fetch_carrier_quotes",
                    arguments={
                        "pickup_pincode": request.pickup_pincode,
                        "delivery_pincode": request.delivery_pincode,
                        "weight_kg": request.weight_kg
                    }
                )
                return {"status": "success", "data": result.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 5 — MCP SHIPROCKET BOOKING 
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/carrier/book")
async def book_shipment_endpoint(request: BookRequest):
    # Setup parameters identical to the quote endpoint
    server_params = StdioServerParameters(
        command="python",
        args=["src/mcp_shiprocket.py"],
        env=os.environ.copy()
    )
    
    try:
        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                
                # ── Call the 'book_shipment' tool ──
                # This passes the carrier_id and the dict of order details 
                # (address, customer info, etc.) to the MCP server.
                result = await session.call_tool(
                    "book_shipment",
                    arguments={
                        "carrier_id": request.carrier_id,
                        "order_details": request.order_details
                    }
                )
                
                return {"status": "success", "data": result.content}
                
    except Exception as e:
        print(f"MCP Booking Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
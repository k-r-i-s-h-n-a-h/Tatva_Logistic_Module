# backend/src/mcp_shiprocket.py
import os
import sys
import json
import requests
import logging
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# Setup logging to help debug MCP server
logging.basicConfig(
    level=logging.DEBUG,
    format='[MCP-Shiprocket] %(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# ⬇️ ADD THIS: Point the MCP subprocess to the .env file ⬇️
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"SHIPROCKET_EMAIL loaded: {bool(os.getenv('SHIPROCKET_EMAIL'))}")

mcp = FastMCP("Tatva-Shiprocket-Adapter")
SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external"

def get_token():
    # Authenticate with Shiprocket to get the token
    auth_data = {
        "email": os.getenv("SHIPROCKET_EMAIL"),
        "password": os.getenv("SHIPROCKET_PASSWORD")
    }
    response = requests.post(f"{SHIPROCKET_API}/auth/login", json=auth_data)
    return response.json().get("token")

@mcp.tool()
async def fetch_carrier_quotes(pickup_pincode: str, delivery_pincode: str, weight_kg: float) -> dict:
    """Fetches shipping rates from Shiprocket."""
    logger.info(f"Tool called: fetch_carrier_quotes({pickup_pincode}, {delivery_pincode}, {weight_kg})")
    try:
        token = get_token()
        if not token:
            logger.error("Failed to get Shiprocket token")
            return {"error": "Authentication failed", "status": 401}
        
        headers = {"Authorization": f"Bearer {token}"}
        SERVICE_URL = f"{SHIPROCKET_API}/courier/serviceability/"

        params = {
            "pickup_postcode": pickup_pincode,
            "delivery_postcode": delivery_pincode,
            "weight": weight_kg,
            "cod": 0,
            "is_return": 0,
            "declared_value": 500
        }
        
        logger.info(f"Calling Shiprocket API with params: {params}")
        response = requests.get(SERVICE_URL, headers=headers, params=params)
        logger.info(f"Shiprocket response status: {response.status_code}")
        return response.json()
    except Exception as e:
        logger.error(f"Error in fetch_carrier_quotes: {str(e)}", exc_info=True)
        return {"error": "Connection Error", "message": str(e), "status": 500}

@mcp.tool()
def book_shipment(carrier_id: int, order_details: dict) -> dict:
    """Confirms the shipment and generates the AWB tracking number using a specific carrier."""
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # ── Step 1: Create the Order in Shiprocket ──────────────────────────────
    # Map your internal Tatva Connect order_details to Shiprocket's required fields
    create_order_payload = {
        "order_id": order_details.get("order_id"), # e.g., "TATVA-CONNECT-1001"
        "order_date": order_details.get("order_date"),
        "pickup_location": order_details.get("pickup_location", "Primary"),
        "billing_customer_name": order_details.get("customer_name", "TatvaOps User"),
        "billing_last_name": order_details.get("customer_last_name", ""),
        "billing_address": order_details.get("address", "Site Address"),
        "billing_city": order_details.get("city", "Bengaluru"),
        "billing_pincode": order_details.get("pincode"),
        "billing_state": order_details.get("state", "Karnataka"),
        "billing_country": order_details.get("country", "India"),
        "billing_email": order_details.get("email", "logistics@tatvaops.com"),
        "billing_phone": order_details.get("phone", "9999999999"),
        "shipping_is_billing": True,
        "order_items": order_details.get("items", [{"name": "Construction Material", "sku": "MAT-1", "units": 1, "selling_price": 100}]),
        "payment_method": "Prepaid",
        "sub_total":100,
        "length": order_details.get("length", 10),
        "breadth": order_details.get("width", 10),
        "height": order_details.get("height", 10),
        "weight": order_details.get("weight", 1)
    }
    
    order_response = requests.post(f"{SHIPROCKET_API}/orders/create/ad-hoc", headers=headers, json=create_order_payload)
    order_data = order_response.json()
    
    # Check if order creation failed
    if order_response.status_code != 200 or "shipment_id" not in order_data:
        return {
            "status": "error", 
            "step": "order_creation", 
            "message": "Failed to create order in Shiprocket", 
            "shiprocket_response": order_data
        }
        
    shipment_id = order_data["shipment_id"]
    
    # ── Step 2: Assign the Specific Carrier and Generate AWB ────────────────
    awb_payload = {
        "shipment_id": shipment_id,
        "courier_id": carrier_id
    }
    
    awb_response = requests.post(f"{SHIPROCKET_API}/courier/generate/awb", headers=headers, json=awb_payload)
    awb_data = awb_response.json()
    
    if awb_response.status_code != 200 or awb_data.get("awb_assign_status") != 1:
        return {
            "status": "error",
            "step": "awb_generation",
            "message": "Order created, but failed to assign the specific carrier.",
            "order_id": order_data.get("order_id"),
            "shiprocket_response": awb_data
        }

    # ── Step 3: Return the clean success payload to your FastAPI Client ─────
    return {
        "status": "success",
        "shiprocket_order_id": order_data.get("order_id"),
        "shipment_id": shipment_id,
        "awb_tracking_number": awb_data["response"]["data"]["awb_number"],
        "courier_name": awb_data["response"]["data"]["courier_name"],
        "routing_code": awb_data["response"]["data"]["routing_code"]
    }

if __name__ == "__main__":
    mcp.run()
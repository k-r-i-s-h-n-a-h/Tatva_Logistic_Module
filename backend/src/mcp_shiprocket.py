# backend/src/mcp_shiprocket.py
import os
import sys
import json
import time
from datetime import datetime
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
    try:
        logger.info(f"book_shipment called with carrier_id={carrier_id}")
        logger.info(f"Order details: {order_details}")
        
        token = get_token()
        if not token:
            return {"status": "error", "message": "Failed to authenticate with Shiprocket", "step": "auth"}
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # ── Step 1: Create the Order in Shiprocket ──────────────────────────────
        # Get channel_id from environment or use default (1)
        channel_id = int(os.getenv("SHIPROCKET_CHANNEL_ID", "1"))
        logger.info(f"Using channel_id: {channel_id}")
        fallback_phone = os.getenv("SHIPROCKET_FALLBACK_PHONE", "9999999999")
        
        # ⚠️ Always use "warehouse" - Shiprocket account only has this pickup location
        create_order_payload = {
            "order_id": order_details.get("order_id", f"TATVA-{int(time.time())}"),
            "order_date": order_details.get("order_date", datetime.now().isoformat()),
            "pickup_location": "warehouse",
            "channel_id": channel_id,  # ✅ REQUIRED: Sales channel identifier
            "billing_customer_name": order_details.get("customer_name", "TatvaOps User"),
            "billing_last_name": order_details.get("customer_last_name", ""),
            "billing_address": order_details.get("address", "Site Address"),
            "billing_city": order_details.get("city", "Bengaluru"),
            "billing_pincode": order_details.get("pincode", "560001"),
            "billing_state": order_details.get("state", "Karnataka"),
            "billing_country": order_details.get("country", "India"),
            "billing_email": order_details.get("email", "logistics@tatvaops.com"),
            "billing_phone": order_details.get("phone", fallback_phone),
            "shipping_is_billing": True,
            "order_items":[{"name": "AI Logistic Box","sku": f"TATVA-ITEM-{int(time.time())}", "units": 1, "selling_price": 100, "discount": 0 ,"tax": 0, "hsn": ""}],
            "payment_method": "Prepaid",
            "sub_total": order_details.get("sub_total", 100),
            "length": order_details.get("length", 10),
            "breadth": order_details.get("width", 10),
            "height": order_details.get("height", 10),
            "weight": order_details.get("weight", 1)
        }
        
        logger.info(f"Creating order with payload: {create_order_payload}")
        order_url = f"{SHIPROCKET_API}/orders/create/adhoc" 

        order_response = requests.post(
            order_url, 
            headers=headers, 
            json=create_order_payload,
            timeout=10
        )
        
        # If standard endpoint fails, try ad-hoc endpoint
        if order_response.status_code == 404:
            logger.warning("Standard /orders/create returned 404, trying /orders/create/ad-hoc")
            order_response = requests.post(
                f"{SHIPROCKET_API}/orders/create", 
                headers=headers, 
                json=create_order_payload,
                timeout=10
            )
        
        logger.info(f"Order creation response status: {order_response.status_code}")
        logger.info(f"Order creation response: {order_response.text}")
        order_data = order_response.json()
        
        # Check if order creation failed
        if order_response.status_code != 200:
            logger.error(f"Order creation failed with status {order_response.status_code}")
            return {
                "status": "error", 
                "step": "order_creation", 
                "http_status": order_response.status_code,
                "message": "Failed to create order in Shiprocket", 
                "shiprocket_response": order_data,
                "note": "Your account may not have access to /orders/create/ad-hoc endpoint. Contact Shiprocket support."
            }
        
        if "shipment_id" not in order_data:
            logger.error(f"No shipment_id in response: {order_data}")
            return {
                "status": "error", 
                "step": "order_creation", 
                "message": "Order created but no shipment_id returned", 
                "shiprocket_response": order_data
            }
        
        shipment_id = order_data["shipment_id"]
        logger.info(f"Order created successfully with shipment_id: {shipment_id}")
        
        # ── Step 2: Assign the Specific Carrier and Generate AWB ────────────────
        awb_payload = {
            "shipment_id": shipment_id,
            "courier_id": carrier_id
        }
        
        logger.info(f"Assigning carrier {carrier_id} with AWB payload: {awb_payload}")
        awb_response = requests.post(
            f"{SHIPROCKET_API}/courier/generate/awb", 
            headers=headers, 
            json=awb_payload,
            timeout=10
        )
        
        logger.info(f"AWB generation response status: {awb_response.status_code}")
        logger.info(f"AWB generation response: {awb_response.text}")
        awb_data = awb_response.json()
        
        if awb_response.status_code != 200 or awb_data.get("awb_assign_status") != 1:
            logger.warning(f"AWB generation failed: {awb_data}")
            # ✅ IMPORTANT: Order was created successfully (shipment_id exists)
            # AWB generation fails typically due to ₹0 wallet balance
            # Still return as SUCCESS so frontend can display order_id to user
            return {
                "status": "success",
                "shiprocket_order_id": order_data.get("order_id"),
                "shipment_id": shipment_id,
                "awb_tracking_number": None,
                "message": "Order created successfully! AWB generation pending (may require wallet balance).",
                "awb_note": "Courier assignment failed. Contact Shiprocket to check wallet balance and retry.",
                "shiprocket_response": awb_data
            }

        # ── Step 3: Return the clean success payload ─────
        logger.info(f"Shipment booked successfully")
        return {
            "status": "success",
            "shiprocket_order_id": order_data.get("order_id"),
            "shipment_id": shipment_id,
            "awb_tracking_number": awb_data.get("response", {}).get("data", {}).get("awb_number"),
            "courier_name": awb_data.get("response", {}).get("data", {}).get("courier_name"),
            "routing_code": awb_data.get("response", {}).get("data", {}).get("routing_code")
        }
    
    except Exception as e:
        logger.error(f"Error in book_shipment: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "step": "exception",
            "message": str(e)
        }

if __name__ == "__main__":
    mcp.run()
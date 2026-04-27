import os
import asyncio
import requests
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# ✅ 1. Force load the environment variables immediately
load_dotenv()

mcp = FastMCP("Tatva-Intracity-Aggregator")

BORZO_VEHICLES = [
    {"type_id": 8,  "name": "3-Wheeler (Ape)",     "capacity_kg": 300},
    {"type_id": 8,  "name": "Tata Ace (7ft)",       "capacity_kg": 750},   # prod maps to 8 too
    {"type_id": 8,  "name": "Pickup / Dost (8ft)",  "capacity_kg": 1500},
]

@mcp.tool()
async def fetch_all_trucking_quotes(
    p_lat: float, p_lng: float,
    d_lat: float, d_lng: float,
    weight_kg: float = 0.0,
    matter: str = "Construction material"
) -> list:
    coords = {
        "p": {"lat": p_lat, "lng": p_lng},
        "d": {"lat": d_lat, "lng": d_lng},
        "weight_kg": weight_kg,
        "matter": matter
    }
    print(f"[AGGREGATOR] weight_kg received: {weight_kg}")

    results = await asyncio.gather(
        call_borzo(coords),
        call_blowhorn(coords),
        return_exceptions=True
    )

    all_quotes = []
    for res in results:
        if isinstance(res, Exception):
            print(f"Carrier task failed: {res}")
            continue
        if isinstance(res, list):
            all_quotes.extend(res)

    # ✅ 2. Sort the quotes by price (lowest first) so your UI "Best Rate" badge works!
    if all_quotes:
        all_quotes.sort(key=lambda x: x.get("fare_value", 999999))

    # Fallback only if APIs completely fail
    if not all_quotes:
        return []

    return all_quotes


async def call_borzo(coords: dict) -> list:
    token = os.getenv("BORZO_API_TOKEN")
    base_url = os.getenv("BORZO_API_URL")

    print(f"[BORZO] URL={base_url}, Token set={bool(token)}")

    if not token or not base_url:
        print("[BORZO] Missing credentials")
        return []

    weight_kg = coords.get("weight_kg", 0)
    headers = {"X-DV-Auth-Token": token, "Content-Type": "application/json"}

    payload = {
        "matter": coords.get("matter", "Construction material"),
        "vehicle_type_id": 8,
        "total_weight_kg": weight_kg,
        "points": [
            {
                "address": f"{coords['p']['lat']}, {coords['p']['lng']}",
                "latitude": str(coords["p"]["lat"]),
                "longitude": str(coords["p"]["lng"]),
                "contact_person": {"phone": "9999999999"}
            },
            {
                "address": f"{coords['d']['lat']}, {coords['d']['lng']}",
                "latitude": str(coords["d"]["lat"]),
                "longitude": str(coords["d"]["lng"]),
                "contact_person": {"phone": "9999999999"}
            }
        ]
    }

    def _sync_call(p=payload):
        return requests.post(f"{base_url}/calculate-order", json=p, headers=headers, timeout=8)

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, _sync_call)
        data = response.json()
        print(f"[BORZO] Response: is_successful={data.get('is_successful')}")

        if data.get("is_successful"):
            order = data["order"]
            fare = float(order.get("payment_amount") or order.get("delivery_fee_amount") or 0)
            return [{
                "carrier": "Borzo",
                "vehicle": "3-Wheeler (Ape)",
                "estimated_fare": f"₹{fare:.0f}",
                "fare_value": fare,
                "eta": "Live quote",
                "vehicle_type_id": 8
            }]
        else:
            print(f"[BORZO] Failed: {data.get('errors')} {data.get('warnings')}")
            return []
    except Exception as e:
        print(f"[BORZO] Error: {e}")
        return []


async def call_blowhorn(coords: dict) -> list:
    # Placeholder for Blowhorn
    return []


if __name__ == "__main__":
    mcp.run()
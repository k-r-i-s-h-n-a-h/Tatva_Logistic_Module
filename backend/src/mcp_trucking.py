import os
import asyncio
import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Tatva-Intracity-Aggregator")

BORZO_VEHICLES = [
    {"type_id": 8,  "name": "3-Wheeler",         "capacity_kg": 300},
    {"type_id": 9,  "name": "Tata Ace (7ft)",     "capacity_kg": 750},
    {"type_id": 10, "name": "Pickup / Dost (8ft)", "capacity_kg": 1500},
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

    if not all_quotes:
        all_quotes.append({
            "carrier": "System Estimate",
            "vehicle": "Tata Ace (7ft)",
            "estimated_fare": "₹550",
            "eta": "~30 mins"
        })

    return all_quotes


async def call_borzo(coords: dict) -> list:
    token = os.getenv("BORZO_API_TOKEN")
    base_url = os.getenv("BORZO_API_URL")

    if not token or not base_url:
        print("[BORZO] Token or URL missing.")
        return []

    weight_kg = coords.get("weight_kg", 0)
    print(f"[BORZO] weight_kg: {weight_kg}")

    # Only show vehicles that can handle the cargo weight
    eligible_vehicles = [
        v for v in BORZO_VEHICLES
        if v["capacity_kg"] >= weight_kg
    ]

    if not eligible_vehicles:
        eligible_vehicles = [BORZO_VEHICLES[-1]]

    print(f"[BORZO] Eligible: {[v['name'] for v in eligible_vehicles]}")

    headers = {
        "X-DV-Auth-Token": token,
        "Content-Type": "application/json"
    }

    quotes = []
    for vehicle in eligible_vehicles:
        payload = {
            "matter": coords.get("matter", "Construction material"),
            "vehicle_type_id": vehicle["type_id"],
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
            return requests.post(
                f"{base_url}/calculate-order",
                json=p, headers=headers, timeout=6
            )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, _sync_call)
            data = response.json()

            if data.get("is_successful"):
                order = data.get("order", {})

                # ── Test API maps all requests to type_id 8 (3-Wheeler) ──
                # Use OUR vehicle name based on what we requested, not what
                # Borzo echoes back — test API always echoes type_id 8
                returned_type = order.get("vehicle_type_id")
                if returned_type != vehicle["type_id"]:
                    print(f"[BORZO] Test API remapped {vehicle['type_id']} → {returned_type}, using our name")

                fare = order.get("delivery_fee_amount") or order.get("payment_amount") or "N/A"

                quotes.append({
                    "carrier": "Borzo",
                    "vehicle": vehicle["name"],   # ← always use our requested name
                    "estimated_fare": f"₹{float(fare):.0f}" if fare != "N/A" else "₹N/A",
                    "eta": "Live quote",
                    "vehicle_type_id": vehicle["type_id"]
                })
                print(f"[BORZO] {vehicle['name']}: ₹{fare}")
            else:
                print(f"[BORZO] {vehicle['name']} failed: {data.get('warnings')}")

        except Exception as e:
            print(f"[BORZO] {vehicle['name']} error: {e}")

    return quotes


async def call_blowhorn(coords: dict) -> list:
    if not os.getenv("BLOWHORN_API_KEY"):
        return []
    return []


if __name__ == "__main__":
    mcp.run()
import googlemaps
import math
import os 

class LogisticsOptimizer:
    def __init__(self):
        self.gmaps = googlemaps.Client(os.getenv('GOOGLE_MAPS_API_KEY'))
        self.vehicles = [
            {
                "name": "2-Wheeler (Bike)",
                "max_weight_kg": 20,
                "max_dim_cm": 40,
                "max_width_cm": 40,
                "cabin_height_cm": 0, # No cabin lean possible
                "max_vol_cm3": 64000, # 40x40x40 box
                "base_fare": 40,
                "per_km": 10,
                "best_for": "Instant Deliveries, small hardware, documents",
                "providers": [{"name": "Borzo", "url": "https://borzodelivery.com/"}, {"name": "Porter", "url": "https://porter.in/"}]
            },
            {
                "name": "3-Wheeler",
                "max_weight_kg": 500,
                "max_dim_cm": 150, 
                "max_width_cm": 120, 
                "cabin_height_cm": 130, 
                "max_vol_cm3": 2490000,
                "base_fare": 250,
                "per_km": 18,
                "best_for": "Local paint/hardware deliveries",
                "providers": [{"name": "Porter", "url": "https://porter.in/"}, {"name": "Blowhorn", "url": "https://blowhorn.com/"}]
            },
            {
                "name": "Tata Ace (7ft)",
                "max_weight_kg": 750, # Standardized Shiprocket limit
                "max_dim_cm": 210, 
                "max_width_cm": 145, 
                "cabin_height_cm": 140, 
                "max_vol_cm3": 4450000,
                "base_fare": 450,
                "per_km": 22,
                "best_for": "1-BHK size loads, fragile interiors",
                "providers": [{"name": "Porter", "url": "https://porter.in/"}, {"name": "Delhivery", "url": "https://www.delhivery.com/"}]
            },
            {
                "name": "Pickup / Dost (8ft)",
                "max_weight_kg": 1500,
                "max_dim_cm": 240, 
                "max_width_cm": 165, 
                "cabin_height_cm": 150, 
                "max_vol_cm3": 5600000,
                "base_fare": 700,
                "per_km": 28,
                "best_for": "Plywood, small batches of tiles",
                "providers": [{"name": "Porter", "url": "https://porter.in/"}, {"name": "Mahindra Logistics", "url": "https://mahindralogistics.com/"}]
            },
            {
                "name": "Tata 407 (10ft)",
                "max_weight_kg": 2500,
                "max_dim_cm": 300, 
                "max_width_cm": 180, 
                "cabin_height_cm": 170, 
                "max_vol_cm3": 11000000,
                "base_fare": 1200,
                "per_km": 35,
                "best_for": "Heavy furniture, bathroom fittings",
                "providers": [{"name": "Porter", "url": "https://porter.in/"}, {"name": "XpressBees", "url": "https://www.xpressbees.com/"}]
            },
            {
                "name": "Canter (14ft)",
                "max_weight_kg": 4000,
                "max_dim_cm": 420, 
                "max_width_cm": 200, 
                "cabin_height_cm": 180, 
                "max_vol_cm3": 15000000,
                "base_fare": 1800,
                "per_km": 40,
                "best_for": "Medium commercial cargo, pipes",
                "providers": [{"name": "Delhivery Freight", "url": "https://www.delhivery.com/"}, {"name": "Rivigo", "url": "https://www.rivigo.com/"}]
            },
            {
                "name": "Eicher (17ft)",
                "max_weight_kg": 5000,
                "max_dim_cm": 510, 
                "max_width_cm": 210, 
                "cabin_height_cm": 190, 
                "max_vol_cm3": 20000000,
                "base_fare": 2200,
                "per_km": 43,
                "best_for": "Palletized goods, solar panels",
                "providers": [{"name": "BlackBuck", "url": "https://www.blackbuck.com/"}, {"name": "TCI", "url": "https://www.tcil.com/"}]
            },
            {
                "name": "Eicher (19ft)",
                "max_weight_kg": 7000,
                "max_dim_cm": 580, 
                "max_width_cm": 210, 
                "cabin_height_cm": 190, 
                "max_vol_cm3": 23000000,
                "base_fare": 2500,
                "per_km": 45,
                "best_for": "Bulk construction raw materials",
                "providers": [{"name": "BlackBuck", "url": "https://www.blackbuck.com/"}, {"name": "TCI", "url": "https://www.tcil.com/"}]
            },
            {
                "name": "22ft Container",
                "max_weight_kg": 10000,
                "max_dim_cm": 670, 
                "max_width_cm": 240, 
                "cabin_height_cm": 240, # Fully enclosed
                "max_vol_cm3": 38000000,
                "base_fare": 3500,
                "per_km": 50,
                "best_for": "Apparel, secure FMCG transport",
                "providers": [{"name": "Delhivery", "url": "https://www.delhivery.com/"}, {"name": "Gati", "url": "https://www.gati.com/"}]
            },
            {
                "name": "32ft SXL (Single Axle)",
                "max_weight_kg": 7500, # Volume optimized, not weight
                "max_dim_cm": 970, 
                "max_width_cm": 240, 
                "cabin_height_cm": 250, 
                "max_vol_cm3": 58000000,
                "base_fare": 4500,
                "per_km": 55,
                "best_for": "High-volume, low-weight goods (e.g., empty bottles, foam)",
                "providers": [{"name": "Rivigo", "url": "https://www.rivigo.com/"}, {"name": "VRL", "url": "https://www.vrlgroup.in/"}]
            },
            {
                "name": "32ft MXL (Multi Axle)",
                "max_weight_kg": 15000, # Heavy load version
                "max_dim_cm": 970, 
                "max_width_cm": 240, 
                "cabin_height_cm": 250, 
                "max_vol_cm3": 58000000,
                "base_fare": 5000,
                "per_km": 60,
                "best_for": "Heavy industrial shipments, full factory loads",
                "providers": [{"name": "Rivigo", "url": "https://www.rivigo.com/"}, {"name": "VRL", "url": "https://www.vrlgroup.in/"}]
            },
            {
                "name": "Trailer / Flatbed (40ft)",
                "max_weight_kg": 35000,
                "max_dim_cm": 1200, 
                "max_width_cm": 250, 
                "cabin_height_cm": 200, 
                "max_vol_cm3": 72500000,
                "base_fare": 8000,
                "per_km": 85,
                "best_for": "Steel rods, heavy machinery, large pipes",
                "providers": [{"name": "BlackBuck", "url": "https://www.blackbuck.com/"}, {"name": "TCI", "url": "https://www.tcil.com/"}]
            }
        ]

    def get_distance(self, origin, destination):
        """Uses Google Maps API to get actual road distance in KM."""
        try:
            result = self.gmaps.distance_matrix(origin, destination, mode='driving')
            # Extract distance in meters and convert to KM
            distance_meters = result['rows'][0]['elements'][0]['distance']['value']
            return distance_meters / 1000
        except:
            return 10 # Fallback to 10km if API fails

    # Inside backend/src/optimizer.py
    def recommend_vehicle(self, metrics, payload):
        weight = metrics['chargeable_weight_kg']
        max_dim = metrics['max_dimension_cm']
        total_vol = metrics['total_volume_cm3']

        # --- 1. ADDED THIS: Get addresses and calculate distance ---
        origin = payload.get('route', {}).get('pickup_address', '')
        dest = payload.get('route', {}).get('delivery_address', '')
        distance_km = self.get_distance(origin, dest)
        # -----------------------------------------------------------

        # --- NEW: Check if we have "Long but Leanable" items ---
        items = payload.get('items', [])
        longest_item_cm = max([i.get('length', 0) for i in items]) if items else 0
        is_long_pole = any(word in i.get('material_type', '').upper() for i in items for word in ["PIPE", "TMT", "ROD", "POLE"])


        effective_volume = total_vol * 1.15 
        eligible = []
        for v in self.vehicles:
            # 1. Weight and Volume MUST always fit
            if weight <= v['max_weight_kg'] and effective_volume <= v['max_vol_cm3']:
                
                # 2. Standard Items: Strict length check
                if longest_item_cm <= v['max_dim_cm']:
                    eligible.append(v)
                    
                # 3. Long Poles (Pipes/TMT): Pythagorean "Cabin Lean" Math
                elif is_long_pole:
                    # a^2 + b^2 = c^2 (Base = Bed Length, Height = Cabin Height)
                    bed_length = v['max_dim_cm']
                    cabin_height = v.get('cabin_height_cm', 150) # Fallback if missing
                    
                    # Calculate the diagonal resting length (hypotenuse)
                    diagonal_length = math.sqrt((bed_length**2) + (cabin_height**2))
                    
                    # Add "Jugaad" Overhang: ~100cm front + ~50cm rear = 150cm
                    safe_overhang = 150 
                    max_supported_length = diagonal_length + safe_overhang
                    
                    # Safety Check: Don't crush small cabins with heavy loads
                    is_roof_safe = True
                    if v['name'] == "3-Wheeler" and weight > 150:
                        is_roof_safe = False
                    elif v['name'] == "Tata Ace" and weight > 400:
                        is_roof_safe = False

                    # If the pipe fits the math AND won't crush the roof
                    if longest_item_cm <= max_supported_length and is_roof_safe:
                        eligible.append(v)

        if not eligible:
            return { "vehicle": "Specialized Truck", "providers": ["TCI", "VRL"], "stacking_advice": ["Contact HQ"] }

        best_fit = eligible[0]
        utilization_pct = round((effective_volume / best_fit['max_vol_cm3']) * 100)

        # Efficiency Logic
        efficiency_status = "OPTIMAL" if utilization_pct >= 80 else "LOW_EFFICIENCY"
        efficiency_note = ""
        if utilization_pct < 80:
            efficiency_note = f"⚠️ This vehicle is only {utilization_pct}% full. You are paying for wasted space. Consider adding more items or checking for a smaller local carrier to save costs."

        # Stacking Advice
        first_item = items[0] if items else {}
        expert_tips = self.get_stacking_advice(
            first_item.get('shape', 'Box'), 
            first_item.get('quantity', 1), 
            metrics.get('is_fragile', False), 
            utilization_pct
        )

        total_fare = best_fit['base_fare'] + (best_fit['per_km'] * distance_km)

        return {
            "vehicle": best_fit['name'],
            "suitability": best_fit['best_for'],
            "providers": best_fit['providers'], 
            "utilization": utilization_pct,
            "efficiency_status": efficiency_status,
            "efficiency_note": efficiency_note,
            "distance_text": f"{round(distance_km, 1)} KM",
            "estimated_fare": f"₹{round(total_fare)}",
            "stacking_advice": expert_tips,
        }
    # Inside LogisticsOptimizer class in optimizer.py

    def get_stacking_advice(self, shape, qty, is_fragile, utilization):
    # This acts as our 'Logistics Expert'
        advice = []
        if is_fragile:
            advice.append("⚠️ DO NOT STACK: This material is fragile. Place on floor level only.")
        elif shape == "Cylindrical / Bucket":
            advice.append("🪣 STAGGERED STACKING: Arrange buckets in a 'honeycomb' pattern to prevent sliding.")
            if qty > 10:
                advice.append("📦 Use wooden planks between layers if stacking buckets vertically.")
        elif shape == "Box" and utilization > 70:
            advice.append("🏗️ VERTICAL UTILIZATION: Place heaviest boxes at the bottom; stack lighter ones up to the ceiling.")
        
        if not advice:
            advice.append("✅ STANDARD LOAD: Distribute weight evenly across the vehicle axle.")
            
        return advice
from google import genai
import os
import json

class LogisticsAnalyst:
    def __init__(self, vehicle_fleet):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.fleet_specs = vehicle_fleet

    def get_expert_review(self, metrics, items, current_vehicle_name):
        # ... (keep your existing critical case checks) ...

        # 2. ENHANCED REFLEXIVE PROMPT
        system_rules = """
        You are the Tatvaops 'Jugaad' Expert & Stacking Auditor. Your goal is to optimize for Indian road reality where COST is king, but items must arrive undamaged.

        --- OPERATIONAL (JUGAAD) LOGIC ---
        1. THE HYPOTENUSE RULE: For MS Pipes, PVC, or TMT longer than the bed, assume they will be tilted upwards (leaned on the cabin). Do NOT override for length unless the item is >20ft for a 3-wheeler or >25ft for a Tata Ace.
        2. COST BIAS: If Total Weight < 500kg, prioritize the 3-Wheeler. Suggest a 'Protective Barrier' (plastic/tarpaulin) between incompatible items (like Paint and Plywood) rather than upgrading the vehicle.
        3. 4-WHEELER UPGRADE: Only override to a Tata Ace if the 3-wheeler's volume is >90% full or if the items are physically too wide for the 3-wheeler's narrow bed.
        4. OVERHANG WARNING: If you see a 600cm (20ft) item placed on a Tata Ace or 8ft Pickup, you MUST advise the user to tie a 'Red Danger Flag' at the rear overhang and secure the front of the pipes to the front bumper to prevent tipping.

        --- STACKING PHYSICS RULES ---
        1. BUCKETS (Cylindrical): Use 'Honeycomb' pattern at the base. Place a plastic sheet/plywood on top before adding other items.
        2. BOXES/HEAVY: Must form the base layer for a low center of gravity.
        3. GLASS/FRAGILE: Must be placed vertically (on edge) against the cabin wall, never flat.
        4. LONG ITEMS: Lean against the cabin ('Cabin Lean') and secure with nylon ropes to the rear hooks.
        5. LOOSE BULK: Must be covered with Tarpaulin. No mixed loads with loose sand.

        --- FINAL OUTPUT ---
        If you override, explain the cost-to-safety tradeoff. If you don't override, explain how to fit the complex load safely using 'Jugaad' methods.
        """

        prompt = f"""
        {system_rules}

        VEHICLE FLEET SPECS: {self.fleet_specs}
        MATH SUGGESTION: {current_vehicle_name}
        MANIFEST: {[{'cat': i['category'], 'mat': i['material_type'], 'qty': i['quantity'], 'l': i['length'],'w': i['width']} for i in items]}

        ### STEP-BY-STEP AUDIT (Internal Thinking):
        1. List the longest item in the manifest and compare it to {current_vehicle_name}'s bed length.
        2. Check for material incompatibility (e.g., Cement vs. Furniture).
        3. Verify if the weight distribution is safe.
        4. If any check fails, select the smallest vehicle from FLEET SPECS that passes.

        ### FINAL OUTPUT INSTRUCTIONS:
        Return ONLY valid JSON.
        {{
          "override_vehicle": "Name or None",
          "reasoning": "A 1-line helpful explanation for the user (e.g., 'Upgraded to Tata Ace to safely separate paint and plywood').",
          "stacking_plan": {{
             "bottom_layer": "...",
             "top_layer": "...",
             "stability_tips": []
          }}
        }}
        """

        try:
            # We use the 'JSON' response schema if possible, otherwise clean it manually
            response = self.client.models.generate_content(
                model='gemini-2.5-flash', # Or 'gemini-2.5-flash' if you want speed for the text review
                contents=prompt
            )
            clean_json = response.text.replace('```json', '').replace('```', '').strip()
            
            # This turns the string into a real Python Dictionary
            result = json.loads(clean_json)
            
            # --- THE REFLEXION STEP (Self-Correction) ---
            # If the LLM missed a length error, we can force a second look or 
            # simply rely on the Step-by-Step Audit we added above.
            return result

        except Exception as e:
            print(f"LLM Error: {e}")
            return None
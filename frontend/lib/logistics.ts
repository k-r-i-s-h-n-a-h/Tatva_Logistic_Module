export const MATERIAL_MAP = {
  "Interiors":       ["Plywood / Boards", "Glass / Fragile", "Furniture / Decor", "Hardware Fittings"],
  "Painting":        ["Liquid / Paint"],
  "Solar Services":  ["Solar Panels", "Inverters / Batteries"],
  "Construction":    ["Loose Sand / Jelly (Bulk)", "Bricks (Bulk)", "Cement Sacks (Stackable)"],
  "Electrical":      ["Electronics", "Cables / Wiring"],
  "Plumbing":        ["PVC Pipes (6m/20ft)", "CPVC Fittings", "Water Tanks (Sintax)"],
};

export const ITEM_STANDARDS: Record<string, { l: number; w: number; h: number; weight: number; unit: string }> = {
  "Cement Sacks (Stackable)":  { l: 60,  w: 40,  h: 15,  weight: 50,   unit: "KG" },
  "Bricks (Bulk)":             { l: 23,  w: 11,  h: 7,   weight: 3.5,  unit: "KG" },
  "Loose Sand / Jelly (Bulk)": { l: 0,   w: 0,   h: 0,   weight: 1000, unit: "KG" }, // <-- ADDED THIS
  "Liquid / Paint":            { l: 30,  w: 30,  h: 40,  weight: 20,   unit: "KG" },
  "Solar Panels":              { l: 200, w: 100, h: 5,   weight: 22,   unit: "KG" },
  "PVC Pipes (6m/20ft)":       { l: 600, w: 10,  h: 10,  weight: 5,    unit: "KG" },
  "Water Tanks (Sintax)":      { l: 120, w: 120, h: 150, weight: 40,   unit: "KG" },
};

export interface DeliveryItem {
  id: string; // Needed for your new ActiveManifest component
  material_type: string;
  category: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  shape: string;
  is_fragile: boolean;
}

export interface RouteInfo {
  pickupPincode: string;
  deliveryPincode: string;
}

export interface OptimizationResult {
  chargeableWeight: number;
  cargoVolume: number;
  fleetMatch: {
    vehicle: string;
    fare: number;
    distance: number;
  };
  stackingAdvice?: string[]; // Adding this so we can map real AI tips later
}
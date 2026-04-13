"use client";

import React, { useState } from "react";

// --- CONSTANTS ---
const MATERIAL_MAP: Record<string, string[]> = {
  "Interiors": ["Plywood / Boards", "Glass / Fragile", "Furniture / Decor", "Hardware Fittings"],
  "Painting": ["Liquid / Paint"],
  "Solar Services": ["Solar Panels", "Inverters / Batteries"],
  "Construction": ["Loose Sand / Jelly (Bulk)", "Bricks (Bulk)", "Cement Sacks (Stackable)"], 
  "Electrical": ["Electronics", "Cables / Wiring"],
  "Plumbing": ["PVC Pipes (6m/20ft)", "CPVC Fittings", "Water Tanks (Sintax)"]
};

const ITEM_STANDARDS: Record<string, { l: number, w: number, h: number, weight: number, unit: string }> = {
  "Cement Sacks (Stackable)": { l: 60, w: 40, h: 15, weight: 50, unit: "KG" },
  "Bricks (Bulk)": { l: 23, w: 11, h: 7, weight: 3.5, unit: "KG" },
  "Liquid / Paint": { l: 30, w: 30, h: 40, weight: 20, unit: "KG" },
  "Solar Panels": { l: 200, w: 100, h: 5, weight: 22, unit: "KG" },
  "PVC Pipes (6m/20ft)": { l: 600, w: 10, h: 10, weight: 5, unit: "KG" },
  "Water Tanks (Sintax)": { l: 120, w: 120, h: 150, weight: 40, unit: "KG" }
};

export default function Home() {
  // UI State
  const [deliveryMode, setDeliveryMode] = useState<"domestic" | "instant">("domestic");
  
  // Form State (Instant Delivery)
  const [selectedService, setSelectedService] = useState("Interiors");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [shipmentType, setShipmentType] = useState("Single Unit");
  
  // App State
  const [items, setItems] = useState<any[]>([]);
  const [pickupPincode, setPickupPincode] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [outputData, setOutputData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [sidePreviewUrl, setSidePreviewUrl] = useState<string | null>(null);
  
  const [frontDetections, setFrontDetections] = useState<any[]>([]);
  const [sideDetections, setSideDetections] = useState<any[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State for manual/AI-filled dimensions
  const [manualLength, setManualLength] = useState<string>("");
  const [manualWidth, setManualWidth] = useState<string>("");
  const [manualHeight, setManualHeight] = useState<string>("");
  const [manualWeight, setManualWeight] = useState<string>("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>,viewType: 'front' | 'side') => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);

  //making the correct preview and detection state updates based on the view type (front or side)
  if (viewType === 'front') setFrontPreviewUrl(url);
  else setSidePreviewUrl(url);

  setIsAnalyzing(true); // Start scanning UI

  const formData = new FormData();
  formData.append("image", file);
  formData.append("view_type", viewType);

  try {
    const response = await fetch("http://127.0.0.1:8001/cargo/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
       throw new Error(`Server responded with ${response.status}`);
    }
    const data = await response.json();

    if (data.status === "success" && data.detected_items?.length > 0) {
      
      const item = data.detected_items[0];

      if (viewType === 'front') {
        setFrontDetections(data.detected_items);
        // Front view typically provides Length (l) and Height (h) [cite: 30]
        setManualLength(String(item.dimensions.l));
        setManualHeight(String(item.dimensions.h));
      } else {
        setSideDetections(data.detected_items);
        // Side view provides the Depth/Width (w) [cite: 30]
        setManualWidth(String(item.dimensions.w));
      }
    }
      else {
       alert(data.message || "Cargo detection failed. Please enter details manually.");
    }
  } catch (error) {
    console.error("AI Analysis failed:", error);
    alert("Connection error. Please enter cargo details manually.");
  } finally {
    // ALWAYS stop the loading animation, even if there's an error
    setIsAnalyzing(false); 
  }
};
  // Add Item to Manifest (UPDATED WITH AUTO-FILL LOGIC)
  // Add Item to Manifest
  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Capture the quantity from your new input
    const globalQty = parseInt(formData.get("quantity") as string) || 1;

    let newItem: any = {};

    if (deliveryMode === "domestic") {
      // Domestic Item (Simple Box)
      newItem = {
        category: "General Courier",
        material_type: "Standard Box",
        length: parseFloat(formData.get("length") as string) || 0,
        width: parseFloat(formData.get("width") as string) || 0,
        height: parseFloat(formData.get("height") as string) || 0,
        weight: parseFloat(formData.get("weight") as string) || 0,
        quantity: globalQty,
        shape: "Box",
        is_fragile: false
      };
    } else {
      // Instant Delivery Item (Complex Cargo)
      const materialType = formData.get("materialType") as string;
      if (!materialType) return alert("Please select a Material Type.");

      const standard = ITEM_STANDARDS[materialType];
      const isBulk = materialType.includes("(Bulk)");
      
      const l = standard ? standard.l : parseFloat(formData.get("length") as string) || 0;
      const w = standard ? standard.w : parseFloat(formData.get("width") as string) || 0;
      const h = standard ? standard.h : parseFloat(formData.get("height") as string) || 0;
      const weight = standard ? standard.weight : parseFloat(formData.get("weight") as string) || 0;
      
      // SMART LOGIC: If bulk, force Quantity to 1 (1 truckload) and Shape to "Loose Bulk"
      const qty = isBulk ? 1 : (shipmentType === "Multiple Units" ? parseInt(formData.get("quantity") as string) : 1);
      const shape = isBulk ? "Loose Bulk" : (formData.get("shape") as string || "Standard Box");

      newItem = {
        category: selectedService,
        material_type: materialType || "Standard Box",
        length: l,
        width: w,
        height: h,
        weight: weight,
        quantity: globalQty,
        shape: shape,
        is_fragile: materialType.includes("Glass") || materialType.includes("Electronics"),
      };
    }

    setItems([...items, newItem]);
    setSelectedMaterial("");
    (e.target as HTMLFormElement).reset();
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit to FastAPI
  const handleOptimize = async () => {
    if (items.length === 0) return alert("Please add items.");
    setIsLoading(true);

    try {
        // STEP 1: Get AI Metrics (Estimate)
        const estRes = await fetch("http://localhost:8001/cargo/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
        });
        const estData = await estRes.json();

        // STEP 2: Get Vehicle Recommendation
        const recRes = await fetch("http://localhost:8001/vehicle/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                metrics: estData.metrics, 
                items, 
                route: { pickup_address: pickupPincode, delivery_address: deliveryPincode } 
            }),
        });
        const recData = await recRes.json();

        // Display results (Combine metrics and recommendation for UI)
        setOutputData({
            metrics: estData.metrics,
            recommendation: recData
        });
    } catch (error) {
        setOutputData({ error: "Optimization chain failed." });
    } finally {
        setIsLoading(false);
    }
};

  // UI Helpers
  const inputClass = "w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-black outline-none";
  const labelClass = "block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans text-gray-900">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center md:text-left mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Logistics & Fleet Optimizer</h1>
          <p className="text-gray-500 text-lg">Optimize your delivery routes and fleet management</p>
        </div>

        {/* Master Toggle */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm max-w-4xl mx-auto">
          <button 
            type="button"
            onClick={() => {setDeliveryMode("domestic"); setItems([]); setOutputData(null);}}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${deliveryMode === "domestic" ? "bg-black text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Domestic Shipping
          </button>
          <button 
            type="button"
            onClick={() => {setDeliveryMode("instant"); setItems([]); setOutputData(null);}}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${deliveryMode === "instant" ? "bg-black text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Instant Delivery
          </button>
        </div>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input & Forms (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* AI DUAL-CAPTURE (FRONT & SIDE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* FRONT VIEW */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50 relative overflow-hidden">
                <label className={labelClass}>1. Front View (L & H)</label>
                {!frontPreviewUrl ? (
                  <label className="cursor-pointer block mt-2">
                    <span className="bg-black text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-colors inline-block">📷 Upload Front</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'front')} />
                  </label>
                ) : (
                  <div className="relative inline-block rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <img src={frontPreviewUrl} className="max-h-48 rounded-lg" alt="Front View" />
                    
                    {/* UPDATED FRONT BOX LOGIC */}
                    {frontDetections.map((det, i) => {
                      // 1. Check if det exists AND box_2d is actually a list
                      if (!det || !det.box_2d || !Array.isArray(det.box_2d)) {
                        return null; // Skip this one, don't crash
                      }

                      return (
                        <div 
                          key={i}
                          className="absolute border-2 border-blue-500 bg-blue-500/10 rounded"
                          style={{
                            top: `${(det.box_2d[0] / 1000) * 100}%`,
                            left: `${(det.box_2d[1] / 1000) * 100}%`,
                            height: `${((det.box_2d[2] - det.box_2d[0]) / 1000) * 100}%`,
                            width: `${((det.box_2d[3] - det.box_2d[1]) / 1000) * 100}%`,
                          }}
                        >
                          <span className="absolute -top-4 left-0 bg-blue-500 text-white text-[8px] px-1 font-black">
                            {det.label}
                          </span>
                        </div>
                      );
                    })}
                    
                    <button onClick={() => {setFrontPreviewUrl(null); setFrontDetections([]);}} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs z-10">✕</button>
                  </div>
                )}
                {isAnalyzing && !frontPreviewUrl && <div className="animate-pulse text-[8px] mt-2">ANALYZING FRONT...</div>}
              </div>

              {/* SIDE VIEW */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50 relative overflow-hidden">
                <label className={labelClass}>2. Side View (Width)</label>
                {!sidePreviewUrl ? (
                  <label className="cursor-pointer block mt-2">
                    <span className="bg-black text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-colors inline-block">📷 Upload Side</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'side')} />
                  </label>
                ) : (
                  <div className="relative inline-block rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <img src={sidePreviewUrl} className="max-h-48 rounded-lg" alt="Side View" />
                    
                    {/* UPDATED SIDE BOX LOGIC */}
                    {sideDetections.map((det, i) => {
                    // Check if box exists and isn't just [0,0,0,0]
                    if (!det?.box_2d || det.box_2d.every(v => v === 0)) return null;

                    return (
                      <div 
                        key={i}
                        className="absolute border-2 border-green-500 bg-green-500/10 rounded"
                        style={{
                          top: `${(det.box_2d[0] / 1000) * 100}%`,
                          left: `${(det.box_2d[1] / 1000) * 100}%`,
                          height: `${((det.box_2d[2] - det.box_2d[0]) / 1000) * 100}%`,
                          width: `${((det.box_2d[3] - det.box_2d[1]) / 1000) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-4 left-0 bg-green-500 text-white text-[8px] px-1 font-black whitespace-nowrap">
                          {det.label}
                        </span>
                      </div>
                    );
                  })}
                    
                    <button onClick={() => {setSidePreviewUrl(null); setSideDetections([]);}} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs z-10">✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Input Form Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <form onSubmit={handleAddItem} className="space-y-4">
                
                {/* --- QUANTITY / NO. OF ITEMS BOX --- */}
                <div className="pb-4 border-b border-gray-50">
                  <label className={labelClass}>No. of Items</label>
                  <input 
                    name="quantity" 
                    type="number" 
                    min="1" 
                    defaultValue="1" 
                    placeholder="1"
                    className={inputClass} 
                    required 
                  />
                  <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Specify quantity for the detected cargo dimensions</p>
                </div>

                {/* Existing Dimensions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><label className={labelClass}>L (cm)</label><input name="length" type="number" value={manualLength || ""} onChange={(e) => setManualLength(e.target.value)} className={inputClass} required /></div>
                  <div><label className={labelClass}>W (cm)</label><input name="width" type="number" value={manualWidth || ""} onChange={(e) => setManualWidth(e.target.value)} className={inputClass} required /></div>
                  <div><label className={labelClass}>H (cm)</label><input name="height" type="number" value={manualHeight || ""} onChange={(e) => setManualHeight(e.target.value)} className={inputClass} required /></div>
                  <div><label className={labelClass}>Wt (kg)</label><input name="weight" type="number" value={manualWeight || ""} onChange={(e) => setManualWeight(e.target.value)} className={inputClass} required /></div>
                </div>

                <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-lg uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors">
                  Add To Manifest
                </button>
              </form>
            </div>

            {/* Sub-Grid for Manifest and Route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className={labelClass}>Active Manifest</h3>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {items.length === 0 ? <p className="text-gray-400 text-xs italic">Empty...</p> : items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 text-[10px]">
                      <span className="font-bold">{item.quantity}x {item.material_type || "Box"}</span>
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 uppercase font-black">✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className={labelClass}>Route Info</h3>
                <div className="space-y-2">
                  <input type="text" value={pickupPincode} onChange={(e) => setPickupPincode(e.target.value)} placeholder="Pickup Pincode" className={inputClass} />
                  <input type="text" value={deliveryPincode} onChange={(e) => setDeliveryPincode(e.target.value)} placeholder="Delivery Pincode" className={inputClass} />
                </div>
              </div>
            </div>

            <button type="button" onClick={handleOptimize} disabled={isLoading || items.length === 0} className="w-full py-4 bg-blue-600 text-white font-black text-md rounded-xl uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg">
              {isLoading ? "Optimizing..." : "Optimize Logistics"}
            </button>
          </div>

          {/* RIGHT COLUMN: Results (5/12) - Sticky */}
          <div className="lg:col-span-5 sticky top-8">
            <div className="bg-white p-8 rounded-xl shadow-md border-2 border-black min-h-[400px]">
              <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-gray-100 pb-4 mb-6">Optimization Results</h3>
              {!outputData ? (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-30">
                  <div className="w-12 h-12 border-4 border-dashed border-gray-300 rounded-full animate-spin mb-4"></div>
                  <p className="text-xs font-bold uppercase">Waiting for optimization...</p>
                </div>
              ) : outputData.error ? (
                <p className="text-red-500 text-sm font-bold">{outputData.error}</p>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="p-4 bg-gray-900 text-white rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Chargeable Weight</p>
                    <p className="text-3xl font-black">{outputData.metrics?.chargeable_weight_kg || 0} KG</p>
                  </div>
                  {outputData.recommendation && (
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <p className="text-[10px] text-green-700 uppercase font-bold mb-1">Recommended Vehicle</p>
                      <p className="text-2xl font-black text-green-900 uppercase">{outputData.recommendation.vehicle}</p>
                      <p className="text-sm font-bold text-green-700 mt-2">{outputData.recommendation.estimated_fare}</p>
                    </div>
                  )}
                  {outputData.recommendation?.stacking_advice && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Stacking Protocol</p>
                      
                      {/* SAFETY CHECK: Check if it's an array before using .map */}
                      {Array.isArray(outputData.recommendation.stacking_advice) ? (
                        outputData.recommendation.stacking_advice.map((tip: string, i: number) => (
                          <div key={i} className="text-[11px] text-gray-700 p-3 bg-gray-50 rounded-md border border-gray-200 border-l-4 border-l-black">
                            {tip}
                          </div>
                        ))
                      ) : (
                        /* FALLBACK: If it's a string, just show the text */
                        <div className="text-[11px] text-gray-700 p-3 bg-gray-50 rounded-md border border-gray-200 border-l-4 border-l-black whitespace-pre-line">
                          {outputData.recommendation.stacking_advice}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
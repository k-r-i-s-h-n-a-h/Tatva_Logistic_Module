"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ActiveManifest } from "@/components/ActiveManifest";
import { CameraCard } from "@/components/CameraCard";
import { DeliveryItem } from "@/lib/logistics";

// 1. Updated Props to include onAddItem
interface AutoCaptureProps {
  onDimensionsUpdate: (dims: { l?: string; w?: string; h?: string; weight?: string }) => void;
  onAddItem: (item: DeliveryItem) => void; // Critical for the 'Add to Cart' logic
  items: DeliveryItem[];
  onRemoveItem: (id: string) => void;
}

export default function AutoCapture({ onDimensionsUpdate, onAddItem, items, onRemoveItem }: AutoCaptureProps) {
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [sidePreviewUrl, setSidePreviewUrl] = useState<string | null>(null);
  const [frontDetections, setFrontDetections] = useState<any[]>([]);
  const [sideDetections, setSideDetections] = useState<any[]>([]);
  const [frontStatus, setFrontStatus] = useState<any>({ type: "idle" });
  const [sideStatus, setSideStatus] = useState<any>({ type: "idle" });
  
  const [frontDims, setFrontDims] = useState<{ l?: string; h?: string }>({});
  const [sideDims, setSideDims] = useState<{ w?: string }>({});
  const [localWeight, setLocalWeight] = useState("");
  const [showManual, setShowManual] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, viewType: "front" | "side") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    
    if (viewType === "front") {
      setFrontPreviewUrl(url);
      setFrontStatus({ type: "analyzing" });
    } else {
      setSidePreviewUrl(url);
      setSideStatus({ type: "analyzing" });
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("view_type", viewType);

    try {
      const response = await fetch("http://127.0.0.1:8001/cargo/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.status === "success" && data.detected_items?.length > 0) {
        const item = data.detected_items[0];
        const lVal = item.dimensions?.l ? String(item.dimensions.l) : undefined;
        const wVal = item.dimensions?.w ? String(item.dimensions.w) : undefined;
        const hVal = item.dimensions?.h ? String(item.dimensions.h) : undefined;

        if (viewType === "front") {
          setFrontDetections(data.detected_items);
          setFrontStatus({ type: "success", bottleDetected: data.bottle_detected });
          setFrontDims({ l: lVal, h: hVal });
          onDimensionsUpdate({ l: lVal, h: hVal });
        } else {
          setSideDetections(data.detected_items);
          setSideStatus({ type: "success", bottleDetected: data.bottle_detected });
          setSideDims({ w: wVal });
          onDimensionsUpdate({ w: wVal });
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // ─── THE NEW CONFIRMATION LOGIC ───
  const handleConfirmAdd = () => {
    if (!frontDims.l || !sideDims.w || !localWeight) {
      alert("Please ensure both views are scanned and weight is entered.");
      return;
    }

    const newItem: DeliveryItem = {
      id: Date.now().toString(),
      material_type: "AI Scanned Box",
      category: "Courier",
      length: parseFloat(frontDims.l),
      width: parseFloat(sideDims.w),
      height: parseFloat(frontDims.h || "0"),
      weight: parseFloat(localWeight),
      quantity: 1,
      shape: "Box",
      is_fragile: true
    };

    onAddItem(newItem); // This officially adds it to the list!
    
    // Clear local inputs for next item
    setLocalWeight("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CameraCard 
          title="1. Front View (L & H)" 
          previewUrl={frontPreviewUrl} 
          detections={frontDetections} 
          dims={frontDims} 
          status={frontStatus} 
          color="blue" 
          onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e, "front")} 
          onClear={() => {setFrontPreviewUrl(null); setFrontDims({});}}
        />
        <CameraCard 
          title="2. Side View (Width)" 
          previewUrl={sidePreviewUrl} 
          detections={sideDetections} 
          dims={sideDims} 
          status={sideStatus} 
          color="green" 
          onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e, "side")} 
          onClear={() => {setSidePreviewUrl(null); setSideDims({});}}
        />
      </div>

      {/* STEP 2: COMPLETE CARGO DETAILS */}
      <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded">STEP 2</span>
          <h3 className="text-xs font-black uppercase tracking-widest">Confirm AI Extraction</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2 flex gap-4 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 mb-2 font-mono text-[10px]">
            <span className="text-blue-600 font-bold">L: {frontDims.l || "—"}</span>
            <span className="text-green-600 font-bold">W: {sideDims.w || "—"}</span>
            <span className="text-blue-600 font-bold">H: {frontDims.h || "—"}</span>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase">Actual Weight (kg)</Label>
            <input 
              type="number" 
              value={localWeight}
              onChange={(e) => setLocalWeight(e.target.value)}
              className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 focus:border-black outline-none font-bold"
              placeholder="0.0"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleConfirmAdd} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"
            >
              Add to Manifest
            </Button>
          </div>
        </div>
      </div>

      {/* ─── THE MANIFEST (CART) ─── */}
      {items.length > 0 && (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-2 mb-3">
             <div className="h-[2px] flex-1 bg-slate-100"></div>
             <p className="text-[10px] font-black uppercase text-slate-400 px-2">Ready to Ship</p>
             <div className="h-[2px] flex-1 bg-slate-100"></div>
           </div>
           <ActiveManifest items={items} onRemoveItem={onRemoveItem} />
        </div>
      )}
    </div>
  );
}
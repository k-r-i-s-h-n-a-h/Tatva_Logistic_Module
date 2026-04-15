'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ITEM_STANDARDS, MATERIAL_MAP, DeliveryItem } from '@/lib/logistics'

// 1. ADD 'mode' AND 'label' TO PROPS
interface ManualEntryProps {
  mode: 'auto' | 'manual'; 
  onAddItem: (item: DeliveryItem) => void;
  prefilledDims: { l: string; w: string; h: string; label?: string };
}

// 2. DESTRUCTURE 'mode' HERE
export function ManualEntry({ mode, onAddItem, prefilledDims }: ManualEntryProps) {
  const [service, setService] = useState<string>(Object.keys(MATERIAL_MAP)[0]);
  const [material, setMaterial] = useState<string>("");

  const [l, setL] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [weight, setWeight] = useState("");
  const [qty, setQty] = useState("1");
  
  const [isFixed, setIsFixed] = useState(false);

  // Auto-fill dims ONLY if in Auto Mode
  useEffect(() => {
    if (!isFixed && mode === 'auto') {
      if (prefilledDims.l) setL(prefilledDims.l);
      if (prefilledDims.w) setW(prefilledDims.w);
      if (prefilledDims.h) setH(prefilledDims.h);
    }
  }, [prefilledDims, isFixed, mode]);

  useEffect(() => { setMaterial(""); }, [service]);

  // Apply standard dimensions ONLY in Manual Mode
  useEffect(() => {
    if (mode === 'manual' && material && ITEM_STANDARDS[material]) {
      const std = ITEM_STANDARDS[material];
      setL(String(std.l)); setW(String(std.w)); setH(String(std.h)); setWeight(String(std.weight));
      setIsFixed(true); 
    } else {
      setIsFixed(false); 
    }
  }, [material, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalMaterial = material;
    let finalCategory = service;

    // 3. SMART SUBMIT LOGIC: Bypass dropdown check if in Auto mode
    if (mode === 'auto') {
      finalMaterial = prefilledDims.label || "Auto-Detected Cargo";
      finalCategory = "AI Vision Scan";
    } else {
      if (!material) return alert("Please select a material type.");
    }

    const isBulk = finalMaterial.includes("(Bulk)");
    const finalQty = parseInt(qty) || 1;
    const shape = isBulk ? "Loose Bulk" : "Box";

    const newItem: DeliveryItem = {
      id: Math.random().toString(36).substring(2, 9),
      material_type: finalMaterial,
      category: finalCategory,
      length: parseFloat(l) || 0,
      width: parseFloat(w) || 0,
      height: parseFloat(h) || 0,
      weight: parseFloat(weight) || 0,
      quantity: finalQty,
      shape: shape,
      is_fragile: finalMaterial.includes("Glass") || finalMaterial.includes("Electronics")
    };
    
    onAddItem(newItem);
    setMaterial("");
  };

  const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base uppercase tracking-wide flex justify-between items-center">
          Cargo Details
          {isFixed && mode === 'manual' && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">Standard Size Applied</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 4. CONDITIONALLY RENDER DROPDOWNS: Only show in 'manual' mode */}
          {mode === 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="uppercase text-xs font-semibold tracking-wide">Service Category</Label>
                <select value={service} onChange={(e) => setService(e.target.value)} className={selectClass}>
                  {Object.keys(MATERIAL_MAP).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-xs font-semibold tracking-wide">Product / Material</Label>
                <select value={material} onChange={(e) => setMaterial(e.target.value)} className={selectClass} required>
                  <option value="" disabled>Select material...</option>
                  {MATERIAL_MAP[service as keyof typeof MATERIAL_MAP]?.map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Label className="uppercase text-xs font-semibold tracking-wide">No. of Items / Units</Label>
            <Input 
              type="number" 
              min="1" 
              value={qty} 
              onChange={(e) => setQty(e.target.value)} 
              //disabled={mode === 'manual' && material.includes("(Bulk)")} 
              //className={mode === 'manual' && material.includes("(Bulk)") ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
              required 
            />
          </div>

          {/* DIMENSIONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="space-y-2">
              <Label>L (cm)</Label>
              <Input type="number" value={l} onChange={(e) => setL(e.target.value)} disabled={isFixed && mode === 'manual'} className={isFixed && mode === 'manual' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""} required />
            </div>
            <div className="space-y-2">
              <Label>W (cm)</Label>
              <Input type="number" value={w} onChange={(e) => setW(e.target.value)} disabled={isFixed && mode === 'manual'} className={isFixed && mode === 'manual' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""} required />
            </div>
            <div className="space-y-2">
              <Label>H (cm)</Label>
              <Input type="number" value={h} onChange={(e) => setH(e.target.value)} disabled={isFixed && mode === 'manual'} className={isFixed && mode === 'manual' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""} required />
            </div>
            <div className="space-y-2">
              <Label>Wt (kg)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={isFixed && mode === 'manual'} className={isFixed && mode === 'manual' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""} required />
            </div>
          </div>

          <Button type="submit" className="w-full uppercase tracking-widest text-xs font-bold mt-4">
            Add To Manifest
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ITEM_STANDARDS, MATERIAL_MAP, DeliveryItem } from '@/lib/logistics'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface ManualEntryProps {
  mode: 'auto' | 'manual'; 
  onAddItem: (item: DeliveryItem) => void;
  prefilledDims: { l: string; w: string; h: string; label?: string };
}

export function ManualEntry({ mode, onAddItem, prefilledDims }: ManualEntryProps) {
  // Initialize with empty strings to allow the "Select..." placeholder to show up
  const [service, setService] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [l, setL] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [weight, setWeight] = useState("");
  const [qty, setQty] = useState("1");
  const [isFixed, setIsFixed] = useState(false);

  // Auto-fill logic for VLM mode
  useEffect(() => {
    if (!isFixed && mode === 'auto') {
      if (prefilledDims.l) setL(prefilledDims.l);
      if (prefilledDims.w) setW(prefilledDims.w);
      if (prefilledDims.h) setH(prefilledDims.h);
    }
  }, [prefilledDims, isFixed, mode]);

  // Standard size logic for Manual mode
  useEffect(() => {
    if (mode === 'manual' && material && ITEM_STANDARDS[material]) {
      const std = ITEM_STANDARDS[material];
      setL(String(std.l)); setW(String(std.w)); setH(String(std.h)); setWeight(String(std.weight));
      setIsFixed(true); 
    } else {
      setIsFixed(false); 
    }
  }, [material, mode]);

  // THE MASTER SAVE FUNCTION
  const processAddition = () => {
    if (!material || !weight) {
      alert("Please fill in material and weight before adding.");
      return false;
    }

    const newItem: DeliveryItem = {
      id: Math.random().toString(36).substring(2, 9),
      material_type: material,
      category: service,
      length: parseFloat(l) || 0,
      width: parseFloat(w) || 0,
      height: parseFloat(h) || 0,
      weight: parseFloat(weight) || 0,
      quantity: parseInt(qty) || 1,
      shape: material.includes("(Bulk)") ? "Loose Bulk" : "Box",
      is_fragile: material.includes("Liquid") || material.includes("Glass") || material.includes("Fragile")
    };

    onAddItem(newItem);

    // TOTAL RESET: Clear everything for a fresh start
    setService("");
    setMaterial("");
    setL("");
    setW("");
    setH("");
    setWeight("");
    setQty("1");
    return true;
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (processAddition()) {
      console.log("Item saved. Form ready for next separate item.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processAddition();
  };

  const selectClass = "flex h-12 w-full items-center justify-between rounded-md border-2 border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle className="text-base uppercase tracking-widest flex justify-between items-center font-black">
          Cargo Details
          {isFixed && mode === 'manual' && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full border border-amber-300">
              Standard Size Applied
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-slate-500">Service Category</Label>
              <select 
                value={service} 
                onChange={(e) => {
                  setService(e.target.value);
                  setMaterial(""); // Reset material when category changes
                }} 
                className={selectClass}
              >
                <option value="" disabled>Select Category...</option>
                {Object.keys(MATERIAL_MAP).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-slate-500">Product / Material</Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger className="h-12 border-2 border-slate-200">
                  <SelectValue placeholder="Select Material..." />
                </SelectTrigger>
                <SelectContent>
                  {service && MATERIAL_MAP[service as keyof typeof MATERIAL_MAP] ? (
                    MATERIAL_MAP[service as keyof typeof MATERIAL_MAP].map((mat) => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Select category first</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-bold tracking-widest text-slate-500">No. of Items / Units</Label>
            <Input 
              type="number" 
              value={qty} 
              onChange={(e) => setQty(e.target.value)} 
              className="h-12 border-2 border-slate-200"
              required 
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* L, W, H, Weight Inputs */}
            {[ {l: 'L', v: l, s: setL}, {l: 'W', v: w, s: setW}, {l: 'H', v: h, s: setH}, {l: 'Wt', v: weight, s: setWeight} ].map((field) => (
              <div key={field.l} className="space-y-2">
                <Label className="text-xs">{field.l} (cm/kg)</Label>
                <Input 
                  type="number" 
                  value={field.v} 
                  onChange={(e) => field.s(e.target.value)} 
                  disabled={isFixed && mode === 'manual'} 
                  className={`h-12 border-2 ${isFixed ? "bg-slate-50 border-slate-100 text-slate-400" : "border-slate-200"}`}
                  required 
                />
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t-2 border-dashed border-slate-100">
            <div className="grid grid-cols-4 gap-2">
              <Button 
                type="button"
                variant="outline"
                className="col-span-3 h-12 border-2 border-slate-200 font-bold uppercase text-[10px] tracking-wider"
                onClick={() => alert("Current form data is ready for the manifest.")}
              >
                Review Entry
              </Button>
              <Button 
                type="button"
                onClick={handlePlusClick}
                className="col-span-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"
              >
                +
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Add to Cart
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
'use client'

import React, { useState } from "react"
import { ModeSelector } from "@/components/ModeSelector"
import { ManualEntry } from "@/components/ManualEntry"
import { ActiveManifest } from "@/components/ActiveManifest"
import { RouteInformation } from "@/components/RouteInformation"
import { ResultsDashboard } from "@/components/ResultsDashboard"
import AutoCapture from "@/components/AutoCapture" // The one we built previously
import { DeliveryItem, RouteInfo, OptimizationResult } from "@/lib/logistics"
import { Button } from "@/components/ui/button"

export default function Home() {
  // 1. App State
  const [calcMode, setCalcMode] = useState<'auto' | 'manual'>('auto');
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ pickupPincode: '', deliveryPincode: '' });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [carrierQuotes, setCarrierQuotes] = useState<any[]>([]);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  

  const [quoteError, setQuoteError] = useState<string | null>(null);

  // AI Extracted Dimensions State
  const [autoDims, setAutoDims] = useState({ l: "", w: "", h: "" });

  // 2. Handlers
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDimensionsFound = (dims: { l?: string; w?: string; h?: string }) => {
    setAutoDims(prev => ({
      l: dims.l || prev.l,
      w: dims.w || prev.w,
      h: dims.h || prev.h
    }));
  };

  const handleOptimize = async () => {
  if (items.length === 0) return alert("Please add items to manifest.");
  setIsLoading(true);
  
  try {
    // Step 1: Metrics Estimation
    const estRes = await fetch("http://127.0.0.1:8001/cargo/estimate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!estRes.ok) throw new Error("Estimate API failed");
    const estData = await estRes.json();

    // Step 2: Vehicle Recommendation
    const recRes = await fetch("http://127.0.0.1:8001/vehicle/recommend", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics: estData.metrics, items, route: routeInfo }),
    });
    if (!recRes.ok) throw new Error("Recommend API failed");
    const recData = await recRes.json();

    // Step 3: Local Volume Calculation (Backup)
    const calculatedVolumeM3 = items.reduce((total, item) => {
      return total + ((item.length * item.width * item.height) / 1000000 * item.quantity);
    }, 0);

    // Step 4: Construct the Result Object
    const newResult = {
      chargeableWeight: estData.metrics.chargeable_weight_kg || 0,
      cargoVolume: estData.metrics.total_volume_cbm || calculatedVolumeM3,
      fleetMatch: {
        vehicle: recData.vehicle,
        fare: parseInt(recData.estimated_fare.replace(/[^0-9]/g, '')) || 0,
        distance: parseFloat(recData.distance_text) || 15 
      }
    };

    setResult(newResult);

    // Step 5: Trigger MCP Shiprocket Quotes using the NEW result
    await handleFetchQuotes(newResult); 

  } catch (error) {
    console.error("Optimization failed", error);
    alert("Check terminal: Is FastAPI running?");
  } finally {
    setIsLoading(false);
  }
};

  // Inside your Home component in app/page.tsx

const handleFetchQuotes = async (currentResult: OptimizationResult | null) => {
  const targetResult = currentResult || result;
  if (!targetResult) return;
  
  setIsFetchingQuotes(true);
  setQuoteError(null); // Reset error state at the start of a new request

  try {
    const res = await fetch("http://127.0.0.1:8001/carrier/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup_pincode: routeInfo.pickupPincode,
        delivery_pincode: routeInfo.deliveryPincode,
        weight_kg: targetResult.chargeableWeight
      }),
    });

    const mcpWrapper = await res.json();
    
    // Safety check for empty or malformed MCP data
    if (!mcpWrapper.data || mcpWrapper.data.length === 0) {
      throw new Error("No data received from MCP server");
    }

    const shiprocketResponse = JSON.parse(mcpWrapper.data[0].text);

    // ── 1. CHECK FOR ERRORS FIRST (The Guard Clause) ──
    if (shiprocketResponse.status === 404 || !shiprocketResponse.data?.available_courier_companies) {
      setCarrierQuotes([]);
      setQuoteError(shiprocketResponse.message || "Bulk Shipment: Standard couriers do not support this load.");
      return; // Stop here!
    }

    // ── 2. IF SUCCESSFUL, MAP THE DATA ──
    const companies = shiprocketResponse.data.available_courier_companies;
    const formattedQuotes = companies.map((c: any) => ({
      courier_name: c.courier_name,
      rate: c.rate,
      etd: c.etd || `${c.estimated_delivery_days} Days`,
      courier_company_id: c.courier_company_id,
      rating: parseFloat(c.rating) || 0
    }));

    setCarrierQuotes(formattedQuotes);

  } catch (error) {
    console.error("Critical Parsing Error:", error);
    setQuoteError("Service Temporarily Unavailable: Check terminal for MCP connection.");
  } finally {
    setIsFetchingQuotes(false);
  }
};

  return (
    <div className="min-h-screen bg-background py-12 px-4 font-sans text-foreground">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center md:text-left mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Logistics & Fleet Optimizer</h1>
          <p className="text-muted-foreground text-lg">Optimize your delivery routes and fleet management</p>
        </div>

        {/* Navigation / Mode Selection */}
        <ModeSelector mode={calcMode} setMode={setCalcMode} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Inputs */}
          <div className="lg:col-span-7 space-y-6">
            
            {calcMode === 'auto' && (
              <AutoCapture onDimensionsUpdate={handleDimensionsFound} />
            )}

            <ManualEntry 
              mode={calcMode} 
              onAddItem={(item) => setItems([...items, item])} 
              prefilledDims={autoDims} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActiveManifest items={items} onRemoveItem={handleRemoveItem} />
              <RouteInformation routeInfo={routeInfo} onChange={setRouteInfo} />
            </div>

            <Button 
              onClick={handleOptimize} 
              disabled={isLoading || items.length === 0}
              className="w-full h-14 text-md font-black uppercase tracking-widest"
              size="lg"
            >
              {isLoading ? "Optimizing..." : "Optimize Logistics"}
            </Button>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-5 sticky top-8">
             <ResultsDashboard result={result} quotes={carrierQuotes}/>
          </div>

          {/* Add this simple alert message below the dashboard if there's an error */}
          {quoteError && (
            <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-500 text-orange-700 text-sm">
              <strong>Logistics Note:</strong> {quoteError}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
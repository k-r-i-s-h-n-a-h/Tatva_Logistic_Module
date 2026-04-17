'use client'

import React, { useState } from "react"
import { ModeSelector } from "@/components/ModeSelector"
import { ManualEntry } from "@/components/ManualEntry"
import { ActiveManifest } from "@/components/ActiveManifest"
import { RouteInformation } from "@/components/RouteInformation"
import { ResultsDashboard } from "@/components/ResultsDashboard"
import AutoCapture from "@/components/AutoCapture"
import { DeliveryItem, RouteInfo, OptimizationResult } from "@/lib/logistics"
import { Button } from "@/components/ui/button"
import { GoogleMapsPicker } from "@/components/GoogleMapsPicker"

export default function Home() {
  const [serviceType, setServiceType] = useState<'courier' | 'trucking' | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ pickupPincode: '', deliveryPincode: '' });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [carrierQuotes, setCarrierQuotes] = useState<any[]>([]);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [autoDims, setAutoDims] = useState({ l: "", w: "", h: "" });
  const [truckLocations, setTruckLocations] = useState({ pickup: null, delivery: null });

  // ─── HANDLERS ──────────────────────────────────────────────────────────

  const handleAddItem = (newItem: DeliveryItem) => {
    const itemWithId = { ...newItem, id: Date.now().toString() };
    setItems((prev) => [...prev, itemWithId]);
    setResult(null);
    setCarrierQuotes([]);
  };

  const handleLocationSelect = (type: 'pickup' | 'delivery', placeData: any) => {
    setTruckLocations(prev => ({ ...prev, [type]: placeData }));
    const pincode = placeData.address_components?.find((c: any) => c.types.includes("postal_code"))?.long_name;
    if (pincode) {
      setRouteInfo(prev => ({ ...prev, [type === 'pickup' ? 'pickupPincode' : 'deliveryPincode']: pincode }));
    }
  };

  const handleDimensionsFound = (dims: { l?: string; w?: string; h?: string; weight?: string }) => {
    setAutoDims(prev => ({
      l: dims.l || prev.l,
      w: dims.w || prev.w,
      h: dims.h || prev.h
    }));

  // If weight is passed from the AutoCapture form, save it to the main weight state
  if (dims.weight) {
    // Assuming your weight state in page.tsx is named 'weight'
    // If you don't have a separate weight state, you'll need to create one
    // or handle it within your 'items' logic.
  }
};

  const handleFetchQuotes = async (currentResult: OptimizationResult | null) => {
  const targetResult = currentResult || result;
  if (!targetResult) return;
  
  setIsFetchingQuotes(true);
  setQuoteError(null);

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
    
    // ─── THE CRITICAL FIX: Parsing the inner 'text' string ───
    const shiprocketResponse = JSON.parse(mcpWrapper.data[0].text);

    // Check if Shiprocket actually returned courier companies
    if (shiprocketResponse.status === 200 && shiprocketResponse.data?.available_courier_companies) {
      const companies = shiprocketResponse.data.available_courier_companies;
      
      const formattedQuotes = companies.map((c: any) => ({
        courier_name: c.courier_name,
        rate: c.rate,
        etd: c.etd || `${c.estimated_delivery_days} Days`,
        courier_company_id: c.courier_company_id,
        rating: parseFloat(c.rating) || 0
      }));

      setCarrierQuotes(formattedQuotes);
    } else {
      setQuoteError(shiprocketResponse.message || "No couriers available for this route.");
    }

  } catch (error) {
    console.error("Parsing Error:", error);
    setQuoteError("Unable to process carrier data. Check console.");
  } finally {
    setIsFetchingQuotes(false);
  }
};

  const handleOptimize = async () => {
    if (items.length === 0) return alert("Please add items to manifest.");
    setIsLoading(true);
    try {
      const estRes = await fetch("http://127.0.0.1:8001/cargo/estimate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const estData = await estRes.json();

      const recRes = await fetch("http://127.0.0.1:8001/vehicle/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          metrics: estData.metrics, 
          items, 
          // Ensure this matches your FastAPI Pydantic model!
          route: {
            pickup_pincode: routeInfo.pickupPincode,
            delivery_pincode: routeInfo.deliveryPincode
          }
        }),
      });
      const recData = await recRes.json();

      const newResult = {
        chargeableWeight: estData.metrics.chargeable_weight_kg || 0,
        cargoVolume: estData.metrics.total_volume_cbm || 0,
        fleetMatch: {
          vehicle: recData.vehicle,
          fare: parseInt(recData.estimated_fare.replace(/[^0-9]/g, '')) || 0,
          distance: parseFloat(recData.distance_text) || 15 
        }
      };
      setResult(newResult);
      await handleFetchQuotes(newResult); 
    } catch (error) {
      alert("Check terminal: Is FastAPI running?");
    } finally {
      setIsLoading(false);
    }
  };

const handleRemoveItem = (id: string) => {
  // Use a functional update to ensure we have the latest state
  setItems((prevItems) => {
    const updatedItems = prevItems.filter((item) => item.id !== id);
    console.log(`Item ${id} removed. New count: ${updatedItems.length}`);
    return updatedItems;
  });

  // Also clear results if the manifest is now empty
  if (items.length <= 1) {
    setResult(null);
    setCarrierQuotes([]);
  }
};

const handleBookCourier = (courier: any) => {
  console.log("Booking initiated for:", courier.courier_name);
  // Future logic: call /carrier/book endpoint
};
  // ─── RENDER SELECTION CARDS ──────────────────────────────────────────

  if (!serviceType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-6 bg-gray-50">
        <h1 className="text-4xl font-black uppercase tracking-tight text-center">...Tatva Connect...</h1>
        <h2 className="text-4xl font-black uppercase tracking-tight text-center">How can we help you today?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button onClick={() => setServiceType('courier')} className="group p-10 border-4 border-black bg-white hover:bg-black hover:text-white transition-all text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-2xl font-bold uppercase mb-2">Send a Parcel</h3>
            <p className="opacity-70">Small boxes and packages. AI-powered measurements for express courier networks.</p>
          </button>
          <button onClick={() => setServiceType('trucking')} className="group p-10 border-4 border-black bg-white hover:bg-black hover:text-white transition-all text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl mb-4">🚛</div>
            <h3 className="text-2xl font-bold uppercase mb-2">Hire a Truck</h3>
            <p className="opacity-70">Heavy material and construction goods. Professional freight fleet matching.</p>
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER MAIN APP ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background py-12 px-4 font-sans text-foreground">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Logistics Optimizer</h1>
            <p className="text-muted-foreground font-medium">Expert guidance for your {serviceType} needs</p>
          </div>
          <button onClick={() => setServiceType(null)} className="text-xs font-bold uppercase tracking-widest border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-all w-fit">
            ← Switch Service
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {serviceType === 'courier' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="bg-blue-50 p-4 border-l-4 border-blue-600 text-blue-800 text-sm font-bold flex items-center gap-2">
                  <span>📦</span> COURIER MODE: Use AI Image Capture for Box Dimensions
                </div>
                <AutoCapture
                  onDimensionsUpdate={handleDimensionsFound}
                  onAddItem={handleAddItem} // <--- Very important!
                  items={items}             // <--- To show the list
                  onRemoveItem={handleRemoveItem}
                />
                <RouteInformation routeInfo={routeInfo} onChange={setRouteInfo} />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="bg-green-50 p-4 border-l-4 border-green-600 text-green-800 text-sm font-bold flex items-center gap-2">
                  <span>🚛</span> TRUCKING MODE: Manual Entry + Precise Map Locations
                </div>
                <ManualEntry mode="manual" onAddItem={handleAddItem} prefilledDims={autoDims} />
                {/* ─── THE "CART" VIEW ─── */}
                {items.length > 0 && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span>🛒</span> Current Manifest ({items.length} items)
                    </h3>
                    <ActiveManifest items={items} onRemoveItem={handleRemoveItem} />
                  </div>
                )}
                <GoogleMapsPicker onLocationSelect={handleLocationSelect} />
              </div>
            )}

            <Button onClick={handleOptimize} disabled={isLoading || items.length === 0} className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              {isLoading ? "Analyzing Cargo..." : "Get Live Quotes"}
            </Button>
            {quoteError && <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm font-bold">{quoteError}</div>}
          </div>

          <div className="lg:col-span-5 sticky top-8">
             <ResultsDashboard result={result} quotes={carrierQuotes} mode={serviceType} onSelectCourier={handleBookCourier} />
          </div>
        </div>
      </div>
    </div>
  );
}
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
import { LocationIQPicker } from "@/components/LocationIQPicker"

export default function Home() {
  const [serviceType, setServiceType] = useState<'courier' | 'trucking' | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ 
    pickupPincode: '', 
    deliveryPincode: '', 
    pickupCoords: undefined, 
    deliveryCoords: undefined 
  });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [carrierQuotes, setCarrierQuotes] = useState<any[]>([]);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [autoDims, setAutoDims] = useState({ l: "", w: "", h: "" });
  const [truckLocations, setTruckLocations] = useState({ 
    pickup: null as any, 
    delivery: null as any 
  });
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  // ─── HANDLERS ──────────────────────────────────────────────────────────

  const handleAddItem = (newItem: DeliveryItem) => {
    const itemWithId = { ...newItem, id: Date.now().toString() };
    setItems((prev) => [...prev, itemWithId]);
    setResult(null);
    setCarrierQuotes([]);
  };

  const handleLocationSelect = (type: 'pickup' | 'delivery', placeData: any) => {
  // Safety check: make sure Google actually gave us a location
  if (!placeData?.geometry?.location) return;

  // Unpack the data here
  const lat = placeData.geometry.location.lat();
  const lng = placeData.geometry.location.lng();
  
  // Update the state
  setRouteInfo(prev => ({
    ...prev,
    [type === 'pickup' ? 'pickupCoords' : 'deliveryCoords']: { lat, lng }
  }));
};
const getDistanceWithLocationIQ = async (p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) => {
  const token = process.env.NEXT_PUBLIC_LOCATION_IQ_TOKEN;
  console.log("DEBUG: Using LocationIQ Token:", token);
  // This uses the 'Directions' endpoint
  const url = `https://us1.locationiq.com/v1/directions/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?key=${token}&overview=false`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    // distance is returned in meters, convert to km
    const distanceKm = data.routes[0].distance / 1000;
    return distanceKm;
  } catch (error) {
    console.error("LocationIQ Error:", error);
    return 15; // Your default fallback
  }
};

  const handleDimensionsFound = (dims: { l?: string; w?: string; h?: string; weight?: string }) => {
    setAutoDims(prev => ({
      l: dims.l || prev.l,
      w: dims.w || prev.w,
      h: dims.h || prev.h
    }));
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
      const shiprocketResponse = JSON.parse(mcpWrapper.data[0].text);

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
        setQuoteError(shiprocketResponse.message || "No couriers available.");
      }
    } catch (error) {
      setQuoteError("Carrier data sync failed.");
    } finally {
      setIsFetchingQuotes(false);
    }
  };

const handleOptimize = async () => {
    if (items.length === 0) return alert("Please add items to manifest.");
    
    if (!routeInfo.pickupCoords || !routeInfo.deliveryCoords) {
      return alert("Please select both pickup and delivery locations.");
    }

    setIsLoading(true);
    
    try {
      // 1. Cargo Estimation (Physics)
      const estRes = await fetch("http://localhost:8001/cargo/estimate", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!estRes.ok) throw new Error("Cargo estimation failed");
      const estData = await estRes.json();

      // 2. Fleet Recommendation (Logistics + Geography)
      const recRes = await fetch("http://localhost:8001/vehicle/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          metrics: estData.metrics, 
          items, 
          route: {
            pickup_lat: routeInfo.pickupCoords.lat,
            pickup_lng: routeInfo.pickupCoords.lng,
            delivery_lat: routeInfo.deliveryCoords.lat,
            delivery_lng: routeInfo.deliveryCoords.lng,
          }
        }),
      });
      const recData = await recRes.json();

      // ─── STEP 2.5: FETCH ALL PORTER LIVE RATES (The New Part) ───
      // We only do this if serviceType is 'trucking'
      if (serviceType === 'trucking') {
        const porterRes = await fetch("http://localhost:8001/carrier/all-trucking-quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup_lat: routeInfo.pickupCoords.lat,
            pickup_lng: routeInfo.pickupCoords.lng,
            delivery_lat: routeInfo.deliveryCoords.lat,
            delivery_lng: routeInfo.deliveryCoords.lng,
          }),
        });
        
        if (porterRes.ok) {
          const porterData = await porterRes.json();
          // Assuming you have a state: const [allQuotes, setAllQuotes] = useState([]);
          setAllQuotes(porterData.data || []); 
        }
      }

      // 3. UI Scaling and State Update
      const volumeInM3 = estData.metrics.total_volume_cm3 / 1000000;
      const distanceNum = (recData.distance_text && parseFloat(recData.distance_text)) || recData.distance || 0;

      const newResult = {
        chargeableWeight: estData.metrics.chargeable_weight_kg || 0,
        cargoVolume: volumeInM3,
        fleetMatch: {
          vehicle: recData.vehicle || "Standard Truck",
          fare: recData.estimated_fare ? parseInt(String(recData.estimated_fare).replace(/[^0-9]/g, '')) : 0,
          distance: distanceNum
        }
      };

      setResult(newResult);

      // Handle Courier Mode (Shiprocket)
      if (serviceType === 'courier') {
        await handleFetchQuotes(newResult); 
      }

    } catch (error) {
      console.error("Optimization Error:", error);
      alert("Backend Connection Error. Check FastAPI logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (items.length <= 1) {
      setResult(null);
      setCarrierQuotes([]);
    }
  };

  const handleBookCourier = (courier: any) => {
    console.log("Booking initiated:", courier.courier_name);
  };

  // ─── RENDER LOGIC ──────────────────────────────────────────────────

  if (!serviceType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-6 bg-gray-50">
        <h1 className="text-4xl font-black uppercase tracking-tight text-center">...Tatva Connect...</h1>
        <h2 className="text-2xl font-black uppercase tracking-tight text-center text-slate-500">How can we help you today?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button onClick={() => setServiceType('courier')} className="group p-10 border-4 border-black bg-white hover:bg-black hover:text-white transition-all text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📦</div>
            <h3 className="text-2xl font-bold uppercase mb-2">Send a Parcel</h3>
            <p className="opacity-70">AI-powered measurements for express courier networks.</p>
          </button>
          <button onClick={() => setServiceType('trucking')} className="group p-10 border-4 border-black bg-white hover:bg-black hover:text-white transition-all text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚛</div>
            <h3 className="text-2xl font-bold uppercase mb-2">Hire a Truck</h3>
            <p className="opacity-70">Professional freight fleet matching for heavy material.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 font-sans text-foreground">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Logistics Optimizer</h1>
            <p className="text-muted-foreground font-medium italic">Expert guidance for your {serviceType} needs</p>
          </div>
          <button onClick={() => setServiceType(null)} className="text-xs font-bold uppercase tracking-widest border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
            ← Switch Service
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {serviceType === 'courier' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="bg-blue-50 p-4 border-l-4 border-blue-600 text-blue-800 text-xs font-bold flex items-center gap-2">
                  <span>📦</span> COURIER MODE: Use AI Image Capture for Box Dimensions
                </div>
                <AutoCapture
                  onDimensionsUpdate={handleDimensionsFound}
                  onAddItem={handleAddItem}
                  items={items}
                  onRemoveItem={handleRemoveItem}
                />
                <RouteInformation routeInfo={routeInfo} onChange={setRouteInfo} />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="bg-green-50 p-4 border-l-4 border-green-600 text-green-800 text-xs font-bold flex items-center gap-2">
                  <span>🚛</span> TRUCKING MODE: Manual Entry + Precise Map Locations
                </div>
                <ManualEntry mode="manual" onAddItem={handleAddItem} prefilledDims={autoDims} />
                {items.length > 0 && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-slate-400">
                      <span>🛒</span> Current Manifest ({items.length} items)
                    </h3>
                    <ActiveManifest items={items} onRemoveItem={handleRemoveItem} />
                  </div>
                )}
                <LocationIQPicker onLocationSelect={handleLocationSelect} />
              </div>
            )}

            <Button 
              onClick={handleOptimize} 
              disabled={isLoading || items.length === 0} 
              className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              {isLoading ? "Analyzing Cargo..." : "Get Live Quotes"}
            </Button>
            {quoteError && <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm font-bold">{quoteError}</div>}
          </div>

          <div className="lg:col-span-5 sticky top-8">
             <ResultsDashboard 
                result={result} 
                quotes={carrierQuotes} 
                mode={serviceType} 
                onSelectCourier={handleBookCourier} 
              />
          </div>
        </div>
      </div>
    </div>
  );
}
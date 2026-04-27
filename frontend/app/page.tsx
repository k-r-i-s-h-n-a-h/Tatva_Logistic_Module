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
import { BookingModal } from "@/components/BookingModal" // ← IMPORTED MODAL
import { TruckBookingModal } from "@/components/TruckBookingModal" // ← ADD THIS

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
  const [allQuotes, setAllQuotes] = useState<any[]>([]);

  // ─── NEW BOOKING STATES ──────────────────────────────────────────
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingCourier, setSelectedBookingCourier] = useState<any>(null);
  const [isBookingSubmit, setIsBookingSubmit] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  // ─── TRUCKING BOOKING STATES ──────────────────────────────────────────
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [isTruckBookingSubmit, setIsTruckBookingSubmit] = useState(false);
  const [borzoSuccessData, setBorzoSuccessData] = useState<any>(null);

  // ─── HANDLERS ──────────────────────────────────────────────────────────

  const handleAddItem = (newItem: DeliveryItem) => {
    const itemWithId = { ...newItem, id: Date.now().toString() };
    setItems((prev) => [...prev, itemWithId]);
    setResult(null);
    setCarrierQuotes([]);
  };

  const handleLocationSelect = (type: 'pickup' | 'delivery', data: any) => {
    if (type === 'pickup') {
      setRouteInfo(prev => ({
        ...prev,
        pickupPincode: data.pincode,
        pickupCoords: { lat: data.lat, lng: data.lng }
      }));
    } else {
      setRouteInfo(prev => ({
        ...prev,
        deliveryPincode: data.pincode,
        deliveryCoords: { lat: data.lat, lng: data.lng }
      }));
    }
  };

  const handleDimensionsFound = (dims: { l?: string; w?: string; h?: string; weight?: string }) => {
    setAutoDims(prev => ({
      l: dims.l || prev.l,
      w: dims.w || prev.w,
      h: dims.h || prev.h
    }));
  };

  const handleOptimize = async () => {
    if (items.length === 0) return alert("Please add items to manifest.");
    
    if (serviceType === 'trucking' && (!routeInfo.pickupCoords || !routeInfo.deliveryCoords)) {
      return alert("Please select both pickup and delivery locations on the map.");
    }
    if (serviceType === 'courier' && (!routeInfo.pickupPincode || !routeInfo.deliveryPincode)) {
      return alert("Please enter both Pickup and Delivery Pincodes.");
    }

    setIsLoading(true);
    setQuoteError(null);
    setBookingSuccessData(null); // Clear previous booking success
    
    try {
      // --- STEP 1: Cargo Estimation (Physics) ---
      const estRes = await fetch("http://localhost:8001/cargo/estimate", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!estRes.ok) throw new Error("Cargo estimation failed");
      const estData = await estRes.json();

      // --- STEP 2: Unified Carrier Quote Fetching ---
      if (serviceType === 'trucking' && routeInfo.pickupCoords && routeInfo.deliveryCoords) {
        const truckRes = await fetch("http://localhost:8001/carrier/all-trucking-quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup_lat: routeInfo.pickupCoords.lat,
            pickup_lng: routeInfo.pickupCoords.lng,
            delivery_lat: routeInfo.deliveryCoords.lat,
            delivery_lng: routeInfo.deliveryCoords.lng,
            weight_kg: estData.metrics.chargeable_weight_kg,
            matter: items[0]?.material_type || "Construction material"
          }),
        });
        
        if (truckRes.ok) {
          const porterData = await truckRes.json();
          setAllQuotes(porterData.data || []); 
        }
      }

      if (serviceType === 'courier') {
        const courierRes = await fetch("http://127.0.0.1:8001/carrier/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup_pincode: routeInfo.pickupPincode,
            delivery_pincode: routeInfo.deliveryPincode,
            weight_kg: estData.metrics.chargeable_weight_kg
          }),
        });

        const mcpWrapper = await courierRes.json();
        
        if (!mcpWrapper.data || !mcpWrapper.data[0] || !mcpWrapper.data[0].text) {
          setQuoteError("Invalid response structure from backend");
          throw new Error("Invalid MCP response structure");
        }

        let shiprocketResponse;
        try {
          shiprocketResponse = JSON.parse(mcpWrapper.data[0].text);
        } catch (parseError) {
          setQuoteError("Backend error: " + mcpWrapper.data[0].text);
          throw new Error("Failed to parse Shiprocket response");
        }

        if (shiprocketResponse.status === 200) {
           const companies = shiprocketResponse.data.available_courier_companies;
           setCarrierQuotes(companies.map((c: any) => ({
             courier_name: c.courier_name,
             rate: c.rate,
             etd: c.etd || `${c.estimated_delivery_days} Days`,
             courier_company_id: c.courier_company_id,
             rating: parseFloat(c.rating) || 0
           })));
        }
      }

      // --- STEP 3: Fleet Recommendation & UI Update ---
      const recRes = await fetch("http://localhost:8001/vehicle/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          metrics: estData.metrics, 
          items, 
          route: serviceType === 'trucking' && routeInfo.pickupCoords && routeInfo.deliveryCoords ? {
            pickup_lat: routeInfo.pickupCoords?.lat,
            pickup_lng: routeInfo.pickupCoords?.lng,
            delivery_lat: routeInfo.deliveryCoords?.lat,
            delivery_lng: routeInfo.deliveryCoords?.lng,
          } : {
            pickup_pincode: routeInfo.pickupPincode,
            delivery_pincode: routeInfo.deliveryPincode
          }
        }),
      });
      const recData = await recRes.json();

      const volumeInM3 = estData.metrics.total_volume_cm3 / 1000000;
      setResult({
        chargeableWeight: estData.metrics.chargeable_weight_kg || 0,
        cargoVolume: volumeInM3,
        fleetMatch: {
          vehicle: recData.vehicle || "Standard Truck",
          fare: recData.estimated_fare ? parseInt(String(recData.estimated_fare).replace(/[^0-9]/g, '')) : 0,
          distance: recData.distance || 0
        }
      });

    } catch (error) {
      console.error("Optimization Error:", error);
      setQuoteError("Failed to sync carrier data. Please check connection.");
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

  // ─── NEW BOOKING HANDLERS ──────────────────────────────────────
  
  const handleBookCourier = (courier: any) => {
    // Open the modal and set the selected courier
    setSelectedBookingCourier(courier);
    setIsBookingModalOpen(true);
  };

  const handleSelectTruck = (truck: any) => {
    setSelectedTruck(truck);
    setIsTruckModalOpen(true);
  };

  const handleConfirmTruckBooking = async (formData: any) => {
    if (!selectedTruck || !routeInfo.pickupCoords || !routeInfo.deliveryCoords) return;
    setIsTruckBookingSubmit(true);

    try {
      const res = await fetch("http://localhost:8001/carrier/trucking-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: "Borzo",
          vehicle_type_id: selectedTruck.vehicle_type_id || 8,
          pickup_lat: routeInfo.pickupCoords.lat,
          pickup_lng: routeInfo.pickupCoords.lng,
          delivery_lat: routeInfo.deliveryCoords.lat,
          delivery_lng: routeInfo.deliveryCoords.lng,
          contact_phone: formData.receiverPhone, // ✅ Grabbing phone from Modal!
          weight_kg: result?.chargeableWeight || 0,
          matter: items[0]?.material_type || "Construction material"
        })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setBorzoSuccessData(data); // ✅ Save success data
        setIsTruckModalOpen(false); // Close Modal
      } else {
        alert(`❌ Borzo Booking Failed: ${data.message}`);
      }
    } catch (error) {
      alert(`Connection Error: ${error}`);
    } finally {
      setIsTruckBookingSubmit(false);
    }
  };

  const handleConfirmBooking = async (formData: any) => {
    if (!selectedBookingCourier || !result) return;
    setIsBookingSubmit(true);

    try {
      // Map frontend Modal data to Shiprocket payload format
      const orderDetails = {
        order_id: `TATVA-CON-${Math.floor(1000 + Math.random() * 9000)}`, // Generate random Order ID
        order_date: new Date().toISOString().split('T')[0],
        customer_name: formData.receiverName,
        address: formData.receiverAddress,
        city: "Destination City", // Could prompt for this, but acceptable default for API
        pincode: routeInfo.deliveryPincode,
        state: "Destination State",
        country: "India",
        phone: formData.receiverPhone,
        email: "customer@tatvaops.com",
        length: autoDims.l || 10,
        width: autoDims.w || 10,
        height: autoDims.h || 10,
        weight: result.chargeableWeight || 1,
        items: items.length > 0 
          ? items.map(i => ({ name: i.material_type || "Logistics Cargo", sku: "TC-SKU", units: 1, selling_price: 100 })) 
          : [{ name: "Box", sku: "TC-BOX", units: 1, selling_price: 100 }]
      };

      const payload = {
        carrier_id: selectedBookingCourier.courier_company_id,
        order_details: orderDetails
      };

      const response = await fetch("http://127.0.0.1:8001/carrier/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      // Parse the MCP output string
      let parsedResult;
      try {
        parsedResult = JSON.parse(data.data[0].text);
      } catch (e) {
        throw new Error(data.data[0].text);
      }

      if (parsedResult.status === "success") {
        parsedResult.requested_courier = selectedBookingCourier.courier_name;
        // ✅ SUCCESS: Order created (even if AWB generation pending)
        setBookingSuccessData(parsedResult);
        setIsBookingModalOpen(false);
      } else {
        alert(`❌ Booking Failed: ${parsedResult.message || JSON.stringify(parsedResult)}`);
      }

    } catch (error) {
      console.error("Booking failed:", error);
      alert(`Booking Connection Error: ${error}`);
    } finally {
      setIsBookingSubmit(false);
    }
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
    <div className="min-h-screen bg-background py-12 px-4 font-sans text-foreground relative">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Logistics Optimizer</h1>
            <p className="text-muted-foreground font-medium italic">Expert guidance for your {serviceType} needs</p>
          </div>
          <button 
            onClick={() => {
              setServiceType(null);
              setItems([]);
              setResult(null);
              setCarrierQuotes([]);
              setAllQuotes([]);
              setRouteInfo({ pickupPincode: '', deliveryPincode: '', pickupCoords: undefined, deliveryCoords: undefined });
              setBookingSuccessData(null); // ✅ Clear Shiprocket Banner
            }} 
            className="text-xs font-bold uppercase tracking-widest border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
          >
            ← Switch Service
          </button>
        </div>

        {/* Success Banner if booking goes through */}
        {/*
        {bookingSuccessData && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-4 border-green-600 rounded-lg animate-in fade-in slide-in-from-top-4 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-black uppercase text-green-800">🎉 Order Created Successfully!</h3>
              <button 
                onClick={() => setBookingSuccessData(null)}
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            
           
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-bold mb-4">
              <div className="bg-white p-3 rounded border-2 border-green-200">
                <p className="text-[10px] text-green-600 uppercase">Order ID</p>
                <p className="text-lg font-mono text-gray-900">{bookingSuccessData.shiprocket_order_id}</p>
              </div>
              <div className="bg-white p-3 rounded border-2 border-green-200">
                <p className="text-[10px] text-green-600 uppercase">Shipment ID</p>
                <p className="text-lg font-mono text-gray-900">{bookingSuccessData.shipment_id}</p>
              </div>
              <div className="bg-white p-3 rounded border-2 border-blue-200">
                <p className="text-[10px] text-blue-600 uppercase">AWB Tracking</p>
                <p className="text-lg font-mono text-gray-900">{bookingSuccessData.awb_tracking_number || 'Pending'}</p>
              </div>
              <div className="bg-white p-3 rounded border-2 border-blue-200">
                <p className="text-[10px] text-blue-600 uppercase">Courier</p>
                <p className="text-lg text-gray-900">{bookingSuccessData.courier_name || 'TBD'}</p>
              </div>
            </div>
            
        
            {bookingSuccessData.message && (
              <p className="text-sm text-green-700 bg-green-100 p-3 rounded mb-2 font-semibold">✅ {bookingSuccessData.message}</p>
            )}
            {bookingSuccessData.awb_note && (
              <p className="text-sm text-blue-700 bg-blue-100 p-3 rounded font-semibold">📌 {bookingSuccessData.awb_note}</p>
            )}
          </div>
        )}
        */}

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
                <GoogleMapsPicker onLocationSelect={handleLocationSelect} />
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
              truckingQuotes={allQuotes}
              mode={serviceType} 
              onSelectCourier={handleBookCourier}
              onSelectTruck={handleSelectTruck}
              pickupCoords={routeInfo.pickupCoords}
              deliveryCoords={routeInfo.deliveryCoords}
              
              // Shiprocket Banner Props
              bookingSuccessData={bookingSuccessData}
              onClearBooking={() => setBookingSuccessData(null)}
              
              // ✅ ADDED: Borzo Banner Props!
              borzoSuccessData={borzoSuccessData}
              onClearBorzoBooking={() => setBorzoSuccessData(null)}
            />
          </div>
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        courier={selectedBookingCourier} 
        routeInfo={routeInfo} 
        onConfirm={handleConfirmBooking} 
        isBooking={isBookingSubmit} 
      />

      {/* ── TRUCK BOOKING MODAL ── */}
      <TruckBookingModal
        isOpen={isTruckModalOpen}
        onClose={() => setIsTruckModalOpen(false)}
        truck={selectedTruck}
        isBooking={isTruckBookingSubmit}
        onConfirm={handleConfirmTruckBooking}
      />

    </div>
  );
}
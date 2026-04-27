'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OptimizationResult } from '@/lib/logistics'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ResultsDashboardProps {
  result: OptimizationResult | null;
  quotes?: any[];
  truckingQuotes?: any[];
  mode: 'courier' | 'trucking' | null;
  onSelectCourier?: (courier: any) => void;
  isLoading?: boolean;
  pickupCoords?: { lat: number; lng: number };
  deliveryCoords?: { lat: number; lng: number };
  
  bookingSuccessData?: any; 
  onClearBooking?: () => void;
  
  // ✅ Trucking Props added properly
  onSelectTruck?: (truck: any) => void;
  borzoSuccessData?: any; 
  onClearBorzoBooking?: () => void;
}

export function ResultsDashboard({
  result,
  quotes = [],
  truckingQuotes = [],
  mode,
  onSelectCourier,
  isLoading,
  pickupCoords,
  deliveryCoords,
  bookingSuccessData,
  onClearBooking,
  onSelectTruck,
  borzoSuccessData,
  onClearBorzoBooking
}: ResultsDashboardProps) {

  const title = mode === 'trucking' ? "Freight Matching Results" : "Shipping Summary";

  if (!result) {
    return (
      <Card className="border-2 border-dashed border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm uppercase">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">
            Manifest empty. Add items to calculate.
          </p>
        </CardContent>
      </Card>
    );
  }

  const MetricCard = ({ label, value, unit }: { label: string; value: string | number; unit?: string }) => (
    <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <Label className="text-[10px] font-black uppercase text-slate-500">{label}</Label>
      <div className="text-2xl font-black flex items-baseline">
        {isLoading
          ? <span className="animate-pulse text-slate-300">...</span>
          : <>{value}{unit && <span className="text-sm ml-1 font-bold text-slate-500">{unit}</span>}</>
        }
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">

      {/* ══════════════════════════════════════
          TRUCKING MODE
      ══════════════════════════════════════ */}
      {mode === 'trucking' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Chargeable Weight" value={result.chargeableWeight.toFixed(2)} unit="kg" />
            <MetricCard label="Distance" value={result.fleetMatch?.distance || 0} unit="km" />
          </div>

          <MetricCard label="Cargo Volume" value={result.cargoVolume.toFixed(2)} unit="m³" />

          {/* AI Recommended Fleet */}
          <Card className="p-6 border-2 border-black bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black uppercase tracking-tighter">Recommended Fleet</h3>
              <Badge className="bg-green-600">Available</Badge>
            </div>
            <div className="text-xl font-bold">
              {isLoading ? "Analyzing..." : (result.fleetMatch?.vehicle || "Not Specified")}
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400">EST. FARE</p>
                <p className="text-lg font-black">
                  {isLoading ? "..." : `₹${result.fleetMatch?.fare || 0}`}
                </p>
              </div>
              <Button className="bg-black text-white px-6">Book Truck</Button>
            </div>
          </Card>

          {/* Live Carrier Rates */}
          <div className="space-y-3">
             {borzoSuccessData?.status === "success" && (
               <div className="p-5 border-2 border-green-500 bg-green-50 rounded-lg space-y-3 mb-6">
                 <div className="flex justify-between items-center">
                   <h3 className="font-black text-green-700 uppercase text-sm">🎉 Borzo Order Created!</h3>
                   <button onClick={onClearBorzoBooking} className="text-xs text-slate-400 hover:text-black font-bold">✕ New</button>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div className="p-2 bg-white border border-green-200 rounded">
                     <p className="text-[9px] font-black uppercase text-green-600">Order ID</p>
                     <p className="font-black text-sm">{borzoSuccessData.order_id || "—"}</p>
                   </div>
                   <div className="p-2 bg-white border border-green-200 rounded">
                     <p className="text-[9px] font-black uppercase text-green-600">Fare</p>
                     <p className="font-black text-sm">₹{borzoSuccessData.fare || "—"}</p>
                   </div>
                 </div>
                 {borzoSuccessData.tracking_url && (
                   <a
                     href={borzoSuccessData.tracking_url}
                     target="_blank"
                     rel="noreferrer"
                     className="block text-center py-2 border-2 border-black text-xs font-black uppercase hover:bg-black hover:text-white transition-all"
                   >
                     Track on Borzo →
                   </a>
                 )}
               </div>
             )}

             <div className="flex items-center gap-2">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Intracity Rates</h4>
               <div className="h-[1px] flex-1 bg-slate-100" />
             </div>

             {isLoading || truckingQuotes.length === 0 ? (
               <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                 <p className="text-xs italic text-slate-400">{isLoading ? "Fetching live rates..." : "Fetching live carrier rates..."}</p>
               </div>
             ) : (
                truckingQuotes.map((q, idx) => {
                  const isBooked = borzoSuccessData?.status === "success" && borzoSuccessData.vehicle_type_id === q.vehicle_type_id;

                  return (
                    <div key={idx} className={`relative flex justify-between items-center p-4 border-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${isBooked ? 'border-green-500' : 'border-black'}`}>
                      {idx === 0 && !isBooked && (
                        <span className="absolute -top-2 -left-2 bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase">Best Rate</span>
                      )}
                      {isBooked && (
                        <span className="absolute -top-3 -right-2 bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-sm uppercase border-2 border-black">✅ Booked</span>
                      )}
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tighter leading-none">{q.carrier}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium">{q.vehicle}</span>
                          <span className="text-slate-300 text-xs">|</span>
                          <span className="text-[10px] text-blue-500 font-bold">ETA: {q.eta}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-green-600 leading-none">{q.estimated_fare}</p>
                        <button 
                          onClick={() => onSelectTruck?.(q)} 
                          className={`mt-1 text-[10px] font-black uppercase tracking-wider hover:underline ${isBooked ? 'text-green-600' : 'text-blue-600'}`}
                        >
                          {isBooked ? "Book Another" : "Select and Book"}
                        </button>
                      </div>
                    </div>
                  )
                })
             )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          COURIER MODE
      ══════════════════════════════════════ */}
      {mode === 'courier' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Chargeable Weight" value={result.chargeableWeight.toFixed(2)} unit="kg" />
            <MetricCard label="Distance" value={result.fleetMatch?.distance || 0} unit="km" />
            <MetricCard label="Volume" value={result.cargoVolume.toFixed(2)} unit="m³" />
          </div>

          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. SUCCESS BANNER */}
            {bookingSuccessData && (
              <div className="p-6 bg-white border-2 border-green-500 rounded-lg shadow-lg relative mt-6 mb-8">
                <button onClick={onClearBooking} className="absolute top-4 right-4 text-xl text-gray-400 hover:text-gray-800">✕</button>
                <h3 className="text-xl font-black uppercase text-green-800 flex items-center gap-2 mb-6">🎉 Order Created Successfully!</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-bold mb-6">
                  <div className="p-3 border-2 border-green-200 rounded">
                    <p className="text-[9px] text-green-600 uppercase font-black">Order ID</p>
                    <p className="text-base text-gray-900 truncate">{bookingSuccessData.shiprocket_order_id}</p>
                  </div>
                  <div className="p-3 border-2 border-green-200 rounded">
                    <p className="text-[9px] text-green-600 uppercase font-black">Shipment ID</p>
                    <p className="text-base text-gray-900 truncate">{bookingSuccessData.shipment_id}</p>
                  </div>
                  <div className="p-3 border-2 border-blue-200 rounded">
                    <p className="text-[9px] text-blue-600 uppercase font-black">AWB Tracking</p>
                    <p className="text-base text-gray-900">{bookingSuccessData.awb_tracking_number || 'Pending'}</p>
                  </div>
                  <div className="p-3 border-2 border-blue-200 rounded">
                    <p className="text-[9px] text-blue-600 uppercase font-black">Courier</p>
                    <p className="text-base text-gray-900 truncate">{bookingSuccessData.courier_name || bookingSuccessData.requested_courier || 'TBD'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-green-800 bg-green-100 p-3 rounded font-bold border border-green-200">✅ Order created successfully! AWB generation pending.</p>
                  <p className="text-xs text-green-800 bg-green-100 p-3 rounded font-bold border border-green-200"> Currently our wallet balance is 0.</p>
                  {bookingSuccessData.message && bookingSuccessData.message.includes("failed") && (
                    <p className="text-xs text-blue-800 bg-blue-100 p-3 rounded font-bold border border-blue-200">📌 {bookingSuccessData.message}. Check wallet balance.</p>
                  )}
                </div>
              </div>
            )}

            {/* 2. AVAILABLE COURIERS */}
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Couriers</h4>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            {isLoading || quotes.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                <p className="text-xs italic text-slate-400">
                  {isLoading ? "Calculating dimensions..." : "Searching Shiprocket network..."}
                </p>
              </div>
            ) : (
              quotes.map((quote, idx) => {
                const isBooked = bookingSuccessData && 
                                (bookingSuccessData.courier_name === quote.courier_name || 
                                 bookingSuccessData.requested_courier === quote.courier_name);

                return (
                  <div
                    key={idx}
                    className={`group relative flex justify-between items-center p-4 border-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer ${isBooked ? 'border-green-500' : 'border-black'}`}
                    onClick={() => onSelectCourier?.(quote)}
                  >
                    {idx === 0 && !isBooked && (
                      <span className="absolute -top-3 -left-2 bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-sm uppercase border-2 border-black">
                        Best Value
                      </span>
                    )}

                    {isBooked && (
                      <span className="absolute -top-3 -right-2 bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-sm uppercase border-2 border-black">
                        ✅ Booked
                      </span>
                    )}

                    <div className="space-y-1">
                      <p className="font-black text-lg uppercase tracking-tighter leading-none">
                        {quote.courier_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Delivery: {quote.etd}</span>
                        <span className="text-slate-200 text-xs">|</span>
                        <span className="text-[11px] text-amber-500 font-bold">⭐ {quote.rating}/5</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-green-600 leading-none">₹{quote.rate}</p>
                      <button className={`mt-1 text-[10px] font-black uppercase tracking-wider hover:underline ${isBooked ? 'text-green-600' : 'text-blue-600'}`}>
                        {isBooked ? 'Book Another' : 'Select and Book'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <p className="text-[10px] text-slate-400 text-center italic mt-4">
              * Rates provided via Shiprocket network
            </p>
          </div>
        </>
      )}
    </div>
  );
}
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OptimizationResult } from '@/lib/logistics'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ResultsDashboardProps {
  result: OptimizationResult | null;
  quotes?: any[];
  truckingQuotes?: any[];   // ← live carrier quotes for trucking mode
  mode: 'courier' | 'trucking' | null;
  onSelectCourier?: (courier: any) => void;
  isLoading?: boolean;
}

export function ResultsDashboard({
  result,
  quotes = [],
  truckingQuotes = [],
  mode,
  onSelectCourier,
  isLoading
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

  return (
    <div className="space-y-4">

      {/* ── TRUCKING MODE ─────────────────────────────────────────────── */}
      {mode === 'trucking' && (
        <>
          {/* Row 1: Weight + Distance */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-[10px] font-black uppercase text-slate-500">Chargeable Weight</Label>
              <div className="text-2xl font-black">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>{result.chargeableWeight.toFixed(2)} <span className="text-sm">kg</span></>
                )}
              </div>
            </Card>

            <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-[10px] font-black uppercase text-slate-500">Distance</Label>
              <div className="text-2xl font-black">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>{result.fleetMatch?.distance || 0} <span className="text-sm">km</span></>
                )}
              </div>
            </Card>
          </div>

          {/* Row 2: Volume */}
          <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Label className="text-[10px] font-black uppercase text-slate-500">Cargo Volume</Label>
            <div className="text-2xl font-black">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>{result.cargoVolume.toFixed(2)} <span className="text-sm">m³</span></>
              )}
            </div>
          </Card>

          {/* Row 3: AI Recommended Fleet */}
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

          {/* Row 4: Live Carrier Quotes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Live Intracity Rates
              </h4>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            {isLoading || truckingQuotes.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                <p className="text-xs italic text-slate-400">
                  {isLoading ? "Analyzing network routes..." : "Fetching live carrier rates..."}
                </p>
              </div>
            ) : (
              truckingQuotes.map((q, idx) => (
                <div
                  key={idx}
                  className="relative flex justify-between items-center p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                >
                  {idx === 0 && (
                    <span className="absolute -top-2 -left-2 bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                      Best Rate
                    </span>
                  )}

                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase tracking-tighter leading-none">
                      {q.carrier}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {q.vehicle}
                      </span>
                      <span className="text-slate-300 text-xs">|</span>
                      <span className="text-[10px] text-blue-500 font-bold">
                        ETA: {q.eta}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-green-600 leading-none">
                      {q.estimated_fare}
                    </p>
                    <button className="mt-1 text-[9px] font-bold uppercase text-blue-600 hover:underline">
                      Book Now
                    </button>
                  </div>
                </div>
              ))
            )}
            <p className="text-[9px] text-slate-400 text-center italic">
              * Live rates via Borzo · Blowhorn · Porter network
            </p>
          </div>
        </>
      )}

      {/* ── COURIER MODE ──────────────────────────────────────────────── */}
      {mode === 'courier' && (
        <>
          {/* Row 1: The Three Main Metrics (3-column grid) */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-[10px] font-black uppercase text-slate-500">Weight</Label>
              <div className="text-xl font-black">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>{result.chargeableWeight.toFixed(2)}<span className="text-xs">kg</span></>
                )}
              </div>
            </Card>

            <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-[10px] font-black uppercase text-slate-500">Distance</Label>
              <div className="text-xl font-black">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>{result.fleetMatch?.distance || 0}<span className="text-xs">km</span></>
                )}
              </div>
            </Card>

            <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-[10px] font-black uppercase text-slate-500">Volume</Label>
              <div className="text-xl font-black">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>{result.cargoVolume.toFixed(2)}<span className="text-xs">m³</span></>
                )}
              </div>
            </Card>
          </div>

          {/* Shiprocket carrier quotes */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Available Couriers
              </h4>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            {isLoading || quotes.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                <p className="text-xs italic text-slate-400">
                  {isLoading ? "Calculating dimensions..." : "Searching Shiprocket network for best rates..."}
                </p>
              </div>
            ) : (
              quotes.map((quote, idx) => (
                <div
                  key={idx}
                  className="group relative flex justify-between items-center p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                  onClick={() => onSelectCourier?.(quote)}
                >
                  {idx === 0 && (
                    <span className="absolute -top-2 -left-2 bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                      Best Value
                    </span>
                  )}

                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase tracking-tighter leading-none">
                      {quote.courier_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Delivery: {quote.etd}
                      </span>
                      <span className="text-slate-200 text-xs">|</span>
                      <span className="text-[10px] text-amber-500 font-bold">
                        ⭐ {quote.rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-green-600 leading-none">
                      ₹{quote.rate}
                    </p>
                    <button className="mt-1 text-[9px] font-bold uppercase text-blue-600 hover:underline">
                      Select and Book
                    </button>
                  </div>
                </div>
              ))
            )}

            <p className="text-[9px] text-slate-400 text-center italic">
              * Rates provided via Shiprocket network
            </p>
          </div>
        </>
      )}

    </div>
  );
}
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OptimizationResult } from '@/lib/logistics'
import { Truck, Zap, Box, TrendingUp } from 'lucide-react'
import { Ship as ShipIcon } from 'lucide-react'
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";


interface Courier {
  courier_name: string;
  rate: number;
  etd: string;
  courier_company_id: number;
  rating: number;
}

interface ResultsDashboardProps {
  result: OptimizationResult | null;
  quotes?: any[];
  mode: 'courier' | 'trucking' | null;
  onSelectCourier?: (courier: any) => void; // Add this line
}

export function ResultsDashboard({ result, quotes = [], mode }: ResultsDashboardProps) {
  const title = mode === 'trucking' ? "Freight Matching Results" : "Shipping Summary";

  if (!result) {
    return (
      <Card className="border-2 border-dashed border-slate-200">
        <CardHeader><CardTitle className="text-sm uppercase">{title}</CardTitle></CardHeader>
        <CardContent><p className="text-xs text-muted-foreground italic">Manifest empty. Add items to calculate.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* ALWAYS SHOW: Weight & Distance */}
        <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Label className="text-[10px] font-black uppercase text-slate-500">chargeable Weight</Label>
          <div className="text-2xl font-black">{result.chargeableWeight.toFixed(2)} <span className="text-sm">kg</span></div>
        </Card>

        <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Label className="text-[10px] font-black uppercase text-slate-500">Distance</Label>
          <div className="text-2xl font-black">{result.fleetMatch?.distance || 0} <span className="text-sm">km</span></div>
        </Card>
      </div>

      {/* ONLY SHOW IN TRUCKING MODE: Volume & Vehicle */}
      {mode === 'trucking' && (
        <>
          <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Label className="text-[10px] font-black uppercase text-slate-500">Cargo Volume</Label>
            <div className="text-2xl font-black">{result.cargoVolume.toFixed(2)} <span className="text-sm">m³</span></div>
          </Card>

          <Card className="p-6 border-2 border-black bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             <div className="flex justify-between items-start mb-4">
                <h3 className="font-black uppercase tracking-tighter">Recommended Fleet</h3>
                <Badge className="bg-green-600">Available</Badge>
             </div>
             <div className="text-xl font-bold">{result.fleetMatch?.vehicle || "Not Specified"}</div>
             <div className="mt-4 flex justify-between border-t pt-4 border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">EST. FARE</p>
                  <p className="text-lg font-black">₹{result.fleetMatch?.fare}</p>
                </div>
                <Button className="bg-black text-white px-6">Book Truck</Button>
             </div>
          </Card>
        </>
      )}

      {/* ─── COURIER QUOTES (Shiprocket Integration) ─── */}
      {mode === 'courier' && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Available Live Carriers
            </h4>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {quotes.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
              <p className="text-xs italic text-slate-400">
                Searching Shiprocket network for best rates...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote, idx) => (
                <div 
                  key={idx} 
                  className="group relative flex justify-between items-center p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                >
                  {/* Badge for the first (usually cheapest) quote */}
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
                      <div className="text-[10px] text-amber-500 font-bold">
                        ⭐ {quote.rating}/5
                      </div>
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
              ))}
            </div>
          )}
          
          <p className="text-[9px] text-slate-400 text-center italic">
            * Rates provided via Shiprocket MCP Server
          </p>
        </div>
      )}
    </div>
  );
}
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OptimizationResult } from '@/lib/logistics'
import { Truck, Zap, Box, TrendingUp } from 'lucide-react'
import { Ship as ShipIcon } from 'lucide-react'


interface Courier {
  courier_name: string;
  rate: number;
  etd: string;
  courier_company_id: number;
  rating: number;
}

interface ResultsDashboardProps {
  result: OptimizationResult | null
  quotes?: Courier[]
  onSelectCourier?: (courier: Courier) => void
}

export function ResultsDashboard({ result, quotes = [], onSelectCourier = () => {} }: ResultsDashboardProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-wide">Optimization Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Optimize your logistics to see results</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              Chargeable Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{result.chargeableWeight.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">kg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Cargo Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{result.cargoVolume.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">m³</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-wide flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Fleet Matching Success
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{result.fleetMatch.vehicle}</p>
              <p className="text-xs text-muted-foreground mt-1">Recommended Vehicle</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">Available</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                Estimated Fare
              </p>
              <p className="text-xl font-bold text-primary">₹{result.fleetMatch.fare}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                Distance
              </p>
              <p className="text-xl font-bold text-primary">{result.fleetMatch.distance} km</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {quotes.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShipIcon className="w-5 h-5" /> Live Courier Quotes (via Shiprocket)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((courier: Courier) => (
              <div 
                key={courier.courier_company_id}
                className="p-4 border rounded-xl hover:border-blue-500 transition-all cursor-pointer bg-white shadow-sm group"
                onClick={() => onSelectCourier(courier)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg group-hover:text-blue-600">
                      {courier.courier_name}
                    </p>
                    <p className="text-sm text-gray-500">Delivery by: {courier.etd}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">₹{courier.rate}</p>
                    <div className="flex items-center gap-1 text-yellow-500 text-xs">
                      <span>⭐</span> {courier.rating}
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-4 py-2 bg-black text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Select & Book
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-wide flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Expert Stacking Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'Optimized weight distribution for fuel efficiency',
            'Maximum space utilization achieved',
            'Climate-controlled storage recommended',
            'Real-time tracking enabled',
          ].map((tip, index) => (
            <div key={index} className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">{index + 1}</span>
              </div>
              <p className="text-sm text-foreground">{tip}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

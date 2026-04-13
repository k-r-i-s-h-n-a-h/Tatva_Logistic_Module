'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OptimizationResult } from '@/lib/logistics'
import { Truck, Zap, Box, TrendingUp } from 'lucide-react'

interface ResultsDashboardProps {
  result: OptimizationResult | null
}

export function ResultsDashboard({ result }: ResultsDashboardProps) {
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

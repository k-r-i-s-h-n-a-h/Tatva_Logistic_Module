'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RouteInfo } from '@/lib/logistics'

interface RouteInformationProps {
  routeInfo: RouteInfo
  onChange: (routeInfo: RouteInfo) => void
}

export function RouteInformation({ routeInfo, onChange }: RouteInformationProps) {
  const handleChange = (field: keyof RouteInfo, value: string) => {
    onChange({
      ...routeInfo,
      [field]: value,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base uppercase tracking-wide">Route Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pickup" className="uppercase text-xs font-semibold tracking-wide">
            Pickup Pincode
          </Label>
          <Input
            id="pickup"
            type="text"
            placeholder="e.g., 400001"
            value={routeInfo.pickupPincode}
            onChange={(e) => handleChange('pickupPincode', e.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delivery" className="uppercase text-xs font-semibold tracking-wide">
            Delivery Pincode
          </Label>
          <Input
            id="delivery"
            type="text"
            placeholder="e.g., 560001"
            value={routeInfo.deliveryPincode}
            onChange={(e) => handleChange('deliveryPincode', e.target.value)}
            className="h-10"
          />
        </div>
      </CardContent>
    </Card>
  )
}

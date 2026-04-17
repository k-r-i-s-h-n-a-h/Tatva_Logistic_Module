'use client'

declare global {
  interface Window {
    google: any;
  }
}

import React, { useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface GoogleMapsPickerProps {
  onLocationSelect: (type: 'pickup' | 'delivery', data: any) => void
}

export function GoogleMapsPicker({ onLocationSelect }: GoogleMapsPickerProps) {
  const pickupRef = useRef<HTMLInputElement>(null)
  const deliveryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Ensure Google Maps script is loaded globally
    if (typeof window !== 'undefined' && window.google) {
      const options = { fields: ["formatted_address", "geometry", "name"] }

      const pickupAuto = new window.google.maps.places.Autocomplete(pickupRef.current!, options)
      const deliveryAuto = new window.google.maps.places.Autocomplete(deliveryRef.current!, options)

      pickupAuto.addListener("place_changed", () => {
        const place = pickupAuto.getPlace()
        onLocationSelect('pickup', place)
      })

      deliveryAuto.addListener("place_changed", () => {
        const place = deliveryAuto.getPlace()
        onLocationSelect('delivery', place)
      })
    }
  }, [onLocationSelect])

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <CardTitle className="text-sm uppercase flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Set Exact Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase mb-1 block">Pickup Location</label>
          <input 
            ref={pickupRef}
            type="text" 
            placeholder="Search address or landmark..." 
            className="w-full p-3 border-2 border-slate-200 focus:border-black outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase mb-1 block">Delivery Location</label>
          <input 
            ref={deliveryRef}
            type="text" 
            placeholder="Search address or landmark..." 
            className="w-full p-3 border-2 border-slate-200 focus:border-black outline-none transition-all"
          />
        </div>
      </CardContent>
    </Card>
  )
}
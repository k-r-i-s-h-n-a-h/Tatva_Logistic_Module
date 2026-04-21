'use client'

declare global {
  interface Window {
    google: any;
  }
}

import React, { useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface GoogleMapsPickerProps {
  onLocationSelect: (type: 'pickup' | 'delivery', data: any) => void
}

export function GoogleMapsPicker({ onLocationSelect }: GoogleMapsPickerProps) {
  const pickupRef = useRef<HTMLInputElement>(null)
  const deliveryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      
      const bengaluruBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(12.8340, 77.4600),
        new window.google.maps.LatLng(13.1400, 77.7840)
      );

      const options = {
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry", "formatted_address"],
        bounds: bengaluruBounds,
        strictBounds: true,
      };

      const pickupAuto = new window.google.maps.places.Autocomplete(pickupRef.current!, options);
      const deliveryAuto = new window.google.maps.places.Autocomplete(deliveryRef.current!, options);

      pickupAuto.addListener("place_changed", () => {
        const place = pickupAuto.getPlace();
        if (place.geometry) {
            // Send the raw 'place' object directly
            onLocationSelect('pickup', place); 
            }
        });

      deliveryAuto.addListener("place_changed", () => {
        const place = deliveryAuto.getPlace();
        if (place.geometry) {
          onLocationSelect('delivery', {
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            pincode: place.address_components?.find((c: any) => 
              c.types.includes("postal_code"))?.long_name
          });
        }
      });
    }
  }, [onLocationSelect]); // Closes useEffect

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm uppercase flex items-center gap-2 font-black">
            <MapPin className="w-4 h-4 text-blue-600" /> Set Exact Locations
          </CardTitle>
          <Badge variant="outline" className="text-[9px] border-blue-500 text-blue-600 font-bold">
            BENGALURU ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 block">Pickup Location</label>
          <input 
            ref={pickupRef}
            type="text" 
            placeholder="Search Jayanagar, Indiranagar, etc..." 
            className="w-full h-12 p-3 border-2 border-slate-100 focus:border-black bg-slate-50 outline-none rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 block">Delivery Location</label>
          <input 
            ref={deliveryRef}
            type="text" 
            placeholder="Search Whitefield, Electronic City, etc..." 
            className="w-full h-12 p-3 border-2 border-slate-100 focus:border-black bg-slate-50 outline-none rounded-lg"
          />
        </div>

        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-100">
          <Info className="w-3 h-3 text-blue-500 mt-0.5" />
          <p className="text-[9px] text-blue-700 leading-tight">
            Our AI logistics fleet is optimized for **Intracity Bengaluru** routes.
          </p>
        </div>
      </CardContent>
    </Card>
  ); // Closes return
} // Closes GoogleMapsPicker function
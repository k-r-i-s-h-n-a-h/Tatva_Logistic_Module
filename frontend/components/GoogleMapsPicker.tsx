'use client'

declare global {
  interface Window {
    google: any;
  }
}

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface GoogleMapsPickerProps {
  onLocationSelect: (type: 'pickup' | 'delivery', data: any) => void
}

export function GoogleMapsPicker({ onLocationSelect }: GoogleMapsPickerProps) {
  const pickupRef = useRef<HTMLInputElement>(null)
  const deliveryRef = useRef<HTMLInputElement>(null)
  const [locations, setLocations] = useState({ pickup: '', delivery: '' });
  const lastPickupData = useRef<any>(null);
  const lastDeliveryData = useRef<any>(null);


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
        if (!place.geometry?.location) return;
        const data = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          pincode: place.address_components?.find((c: any) =>
            c.types.includes("postal_code"))?.long_name
        };
        lastPickupData.current = data;  // ← store it
        onLocationSelect('pickup', data);
      });

      deliveryAuto.addListener("place_changed", () => {
        const place = deliveryAuto.getPlace();
        if (!place.geometry?.location) return;
        const data = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          pincode: place.address_components?.find((c: any) =>
            c.types.includes("postal_code"))?.long_name
        };
        lastDeliveryData.current = data;  // ← store it
        onLocationSelect('delivery', data);
      });

      deliveryAuto.addListener("place_changed", () => {
        const place = deliveryAuto.getPlace();
        if (!place.geometry?.location) return;
        const data = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          pincode: place.address_components?.find((c: any) =>
            c.types.includes("postal_code"))?.long_name
        };
        lastDeliveryData.current = data;  // ← store it
        onLocationSelect('delivery', data);
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

          {/* ── SWAP BUTTON ── */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            // Swap the input values visually
            const pickupVal = pickupRef.current?.value || '';
            const deliveryVal = deliveryRef.current?.value || '';
            
            if (pickupRef.current) pickupRef.current.value = deliveryVal;
            if (deliveryRef.current) deliveryRef.current.value = pickupVal;
            
            // Swap the coords in parent state too
            // We fire both callbacks with swapped data
            if (pickupVal && deliveryVal) {
              // Re-trigger geocoding for swapped values
              // Simplest: just alert user to reselect — autocomplete won't re-fire
              // Better: store last selected place data and swap it
            }
          }}
          className="flex items-center gap-2 px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
          type="button"
        >
          ⇅ Swap
        </button>
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
            Our AI logistics fleet is optimized for{' '}
            <strong>Intracity Bengaluru</strong> routes.
          </p>
        </div>
      </CardContent>
    </Card>
  ); // Closes return
} // Closes GoogleMapsPicker function
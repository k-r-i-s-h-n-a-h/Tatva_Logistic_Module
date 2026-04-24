import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Truck, Loader2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: any;
  routeInfo: any;
  onConfirm: (bookingDetails: any) => void;
  isBooking: boolean;
}

export function BookingModal({ isOpen, onClose, courier, routeInfo, onConfirm, isBooking }: BookingModalProps) {
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
  });

  const senderAddrRef = useRef<HTMLInputElement>(null);
  const receiverAddrRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && window.google && window.google.maps) {
      // Configuration for Autocomplete
      // Note: Google doesn't have a hard "pincode" restriction, 
      // but we use 'country' and can add 'types: ["address"]' for better accuracy.
      const baseOptions = {
        componentRestrictions: { country: "in" },
        fields: ["formatted_address", "address_components"],
        types: ["address"],
      };

      // 1. Sender Autocomplete
      const senderAuto = new window.google.maps.places.Autocomplete(senderAddrRef.current!, baseOptions);
      senderAuto.addListener("place_changed", () => {
        const place = senderAuto.getPlace();
        setFormData(prev => ({ ...prev, senderAddress: place.formatted_address || '' }));
      });

      // 2. Receiver Autocomplete
      const receiverAuto = new window.google.maps.places.Autocomplete(receiverAddrRef.current!, baseOptions);
      receiverAuto.addListener("place_changed", () => {
        const place = receiverAuto.getPlace();
        setFormData(prev => ({ ...prev, receiverAddress: place.formatted_address || '' }));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white max-h-[90vh] overflow-y-auto">
        
        <CardHeader className="border-b-2 border-black flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6" /> Complete Booking
            </CardTitle>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              {courier?.courier_name} • ₹{courier?.rate}
            </p>
          </div>
          <button onClick={onClose} disabled={isBooking} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Sender Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 text-blue-600">
                1. Pickup Details (Sender)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Contact Name</Label>
                  <Input required name="senderName" value={formData.senderName} onChange={handleChange} className="border-2 border-slate-200 focus:border-black rounded-none" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</Label>
                  <Input required type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="border-2 border-slate-200 focus:border-black rounded-none" placeholder="9876543210" />
                </div>
                <div className="col-span-2 space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Full Pickup Address</Label>
                    <span className="text-[10px] font-bold text-blue-600">PIN: {routeInfo?.pickupPincode}</span>
                  </div>
                  {/* REF ADDED HERE */}
                  <Input 
                    ref={senderAddrRef} 
                    required 
                    name="senderAddress" 
                    value={formData.senderAddress} 
                    onChange={handleChange} 
                    className="border-2 border-slate-200 focus:border-black rounded-none" 
                    placeholder="Search address..." 
                  />
                </div>
              </div>
            </div>

            {/* Receiver Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 text-green-600">
                2. Delivery Details (Receiver)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Contact Name</Label>
                  <Input required name="receiverName" value={formData.receiverName} onChange={handleChange} className="border-2 border-slate-200 focus:border-black rounded-none" placeholder="Jane Smith" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</Label>
                  <Input required type="tel" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} className="border-2 border-slate-200 focus:border-black rounded-none" placeholder="9123456780" />
                </div>
                <div className="col-span-2 space-y-1">
                   <div className="flex justify-between">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Full Delivery Address</Label>
                    <span className="text-[10px] font-bold text-green-600">PIN: {routeInfo?.deliveryPincode}</span>
                  </div>
                  {/* REF FIXED: Moved from Contact Name to Address field */}
                  <Input 
                    ref={receiverAddrRef} 
                    required 
                    name="receiverAddress" 
                    value={formData.receiverAddress} 
                    onChange={handleChange} 
                    className="border-2 border-slate-200 focus:border-black rounded-none" 
                    placeholder="Search address..." 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isBooking} className="border-2 border-black rounded-none font-bold uppercase">
                Cancel
              </Button>
              <Button type="submit" disabled={isBooking} className="bg-black text-white hover:bg-slate-800 rounded-none font-black uppercase tracking-widest px-8">
                {isBooking ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating AWB...</>
                ) : (
                  "Confirm & Generate AWB"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
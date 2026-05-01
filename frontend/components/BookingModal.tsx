import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Truck, Loader2 } from 'lucide-react';

export function BookingModal({ isOpen, onClose, courier, routeInfo, onConfirm, isBooking }: any) {
  // ── Form States ──
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // ── Error States for our Smart Boundary ──
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // ── Refs for Google Maps Autocomplete ──
  const pickupAddrRef = useRef<HTMLInputElement>(null);
  const deliveryAddrRef = useRef<HTMLInputElement>(null);

  // ── SMART BOUNDARY VALIDATION ──
  const validateAddress = (address: string, requiredPincode: string) => {
    if (address.length > 0 && address.length < 10) {
      return "Address must be at least 10 characters.";
    }

    const foundPincodes = address.match(/\b\d{6}\b/g);
    if (foundPincodes && !foundPincodes.includes(requiredPincode)) {
      return `❌ Address mismatch: Expected pincode ${requiredPincode}, but found ${foundPincodes.join(', ')}`;
    }
    
    return null; 
  };

  // ── INITIALIZE GOOGLE MAPS AUTOCOMPLETE ──
useEffect(() => {
  if (!isOpen || !(window as any).google?.maps?.places) return;

  // ← Add 'address_components' to fields
  const options = {
    componentRestrictions: { country: 'in' },
    fields: ['formatted_address', 'address_components'],
  };

  let pickupAC: any, deliveryAC: any;

  if (pickupAddrRef.current) {
    pickupAC = new (window as any).google.maps.places.Autocomplete(pickupAddrRef.current, options);
    pickupAC.addListener('place_changed', () => {
      const place = pickupAC.getPlace();
      const addr = place.formatted_address || '';
      setPickupAddress(addr);

      // Extract actual pincode from Google's response
      const postalComp = place.address_components?.find((c: any) =>
        c.types.includes('postal_code')
      );
      const actualPin = postalComp?.long_name || '';
      const expectedPin = routeInfo?.pickupPincode || '';

      if (actualPin && actualPin !== expectedPin) {
        setPickupError(`❌ This location is in pincode ${actualPin}, but you need ${expectedPin}. Please select a different address.`);
      } else if (!actualPin) {
        setPickupError(`⚠️ Could not verify pincode. Please ensure this address is within ${expectedPin}.`);
      } else {
        setPickupError(null); // ✅ Match
      }
    });
  }

  if (deliveryAddrRef.current) {
    deliveryAC = new (window as any).google.maps.places.Autocomplete(deliveryAddrRef.current, options);
    deliveryAC.addListener('place_changed', () => {
      const place = deliveryAC.getPlace();
      const addr = place.formatted_address || '';
      setDeliveryAddress(addr);

      const postalComp = place.address_components?.find((c: any) =>
        c.types.includes('postal_code')
      );
      const actualPin = postalComp?.long_name || '';
      const expectedPin = routeInfo?.deliveryPincode || '';

      if (actualPin && actualPin !== expectedPin) {
        setDeliveryError(`❌ This location is in pincode ${actualPin}, but you need ${expectedPin}. Please select a different address.`);
      } else if (!actualPin) {
        setDeliveryError(`⚠️ Could not verify pincode. Ensure this address is within ${expectedPin}.`);
      } else {
        setDeliveryError(null); // ✅ Match
      }
    });
  }

  return () => {
    if (pickupAC) (window as any).google.maps.event.clearInstanceListeners(pickupAC);
    if (deliveryAC) (window as any).google.maps.event.clearInstanceListeners(deliveryAC);
  };
}, [isOpen, routeInfo?.pickupPincode, routeInfo?.deliveryPincode]);

  if (!isOpen) return null;

  // Manual typing handlers
  const handlePickupChange = (val: string) => {
    setPickupAddress(val);
    setPickupError(validateAddress(val, routeInfo?.pickupPincode || ''));
  };

  const handleDeliveryChange = (val: string) => {
    setDeliveryAddress(val);
    setDeliveryError(validateAddress(val, routeInfo?.deliveryPincode || ''));
  };

  const handleConfirmClick = () => {
    const finalPickup = pickupAddrRef.current?.value || pickupAddress;
    const finalDelivery = deliveryAddrRef.current?.value || deliveryAddress;

    onConfirm({
      senderName,
      senderPhone,
      senderAddress: finalPickup,
      receiverName,
      receiverPhone,
      receiverAddress: finalDelivery
    });
  };

const handleAddressChange = (value: string, type: 'pickup' | 'delivery') => {
  if (type === 'pickup') {
    setPickupAddress(value);
    setPickupError(null); // Clear error while typing, autocomplete will re-validate on select
  } else {
    setDeliveryAddress(value);
    setDeliveryError(null);
  }
};
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* ✅ CSS INJECTION FIX: Forces Google's dropdown to appear above the modal */}
      <style dangerouslySetInnerHTML={{__html: `
        .pac-container {
          z-index: 99999 !important;
          border: 2px solid black !important;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,1) !important;
        }
      `}} />

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
          <div className="space-y-8">
            
            {/* ═════════ 1. SENDER SECTION ═════════ */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 text-blue-600">
                1. Pickup Details (Sender)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Contact Name</Label>
                  <Input 
                    value={senderName} 
                    onChange={(e) => setSenderName(e.target.value)} 
                    className="border-2 border-slate-200 focus:border-black rounded-none" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</Label>
                  <Input 
                    type="tel" 
                    value={senderPhone} 
                    onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, ''))} 
                    className="border-2 border-slate-200 focus:border-black rounded-none" 
                    placeholder="9876543210" 
                    maxLength={10}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-end mb-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Pickup Address</Label>
                      <span className="text-[10px] font-bold text-blue-600">PIN: {routeInfo?.pickupPincode}</span>
                  </div>
                  <Input 
                    ref={pickupAddrRef}
                    value={pickupAddress} 
                    onChange={(e) => handleAddressChange(e.target.value, 'pickup')}
                    placeholder={`Search address in pincode ${routeInfo?.deliveryPincode}...`}
                />
                {/* Render the error if it exists */}
                {pickupError && <p className="text-xs text-red-600 font-bold mt-1">{pickupError}</p>}
                </div>
              </div>
            </div>
        
            {/* ═════════ 2. RECEIVER SECTION ═════════ */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 text-green-600">
                2. Delivery Details (Receiver)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Contact Name</Label>
                  <Input 
                    value={receiverName} 
                    onChange={(e) => setReceiverName(e.target.value)} 
                    className="border-2 border-slate-200 focus:border-black rounded-none" 
                    placeholder="Jane Smith" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</Label>
                  <Input 
                    type="tel" 
                    value={receiverPhone} 
                    onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ''))} 
                    className="border-2 border-slate-200 focus:border-black rounded-none" 
                    placeholder="9123456780" 
                    maxLength={10}
                  />
                </div>
                <div className="col-span-2">
                   <div className="flex justify-between items-end mb-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Delivery Address</Label>
                    <span className="text-[10px] font-bold text-green-600">PIN: {routeInfo?.deliveryPincode}</span>
                  </div>
                  <Input 
                    ref={deliveryAddrRef}
                    value={deliveryAddress} 
                    onChange={(e) => handleAddressChange(e.target.value, 'delivery')}
                    placeholder="Search or type delivery address..."
                />
                {/* Render the error if it exists */}
                {deliveryError && <p className="text-xs text-red-600 font-bold mt-1">{deliveryError}</p>}
                </div>
              </div>
            </div>

            {/* ═════════ ACTIONS ═════════ */}
            <div className="pt-4 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isBooking} className="border-2 border-black rounded-none font-bold uppercase">
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmClick}
                disabled={
                  isBooking || 
                  pickupError !== null || 
                  deliveryError !== null ||
                  pickupAddress.length < 10 || 
                  deliveryAddress.length < 10 ||
                  senderPhone.length < 10 ||
                  receiverPhone.length < 10
                } 
                className="bg-black text-white hover:bg-slate-800 rounded-none font-black uppercase tracking-widest px-8 disabled:opacity-50"
              >
                {isBooking ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating AWB...</>
                ) : (
                  "Confirm & Generate AWB"
                )}
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
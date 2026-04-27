import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

export function TruckBookingModal({ isOpen, onClose, truck, onConfirm, isBooking }: any) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('Site Manager'); // Borzo requires a contact name

  if (!isOpen || !truck) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white border-4 border-black rounded-xl p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            🚛 Dispatch {truck.carrier}
          </h2>
          <button onClick={onClose} className="text-2xl font-bold text-gray-400 hover:text-black transition-colors">✕</button>
        </div>

        {/* Truck Details Summary */}
        <div className="bg-slate-50 p-4 border-2 border-black rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-500">Vehicle Type</span>
            <span className="font-black text-sm text-right">{truck.vehicle}</span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-slate-200 border-dashed">
            <span className="text-xs font-bold uppercase text-slate-500">Est. Fare</span>
            <span className="font-black text-green-600 text-xl">{truck.estimated_fare}</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
              Receiver Name (Required by Borzo)
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 font-bold focus:border-black outline-none transition-all" 
              placeholder="e.g., Krishna"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
              Contact Phone (10 digits)
            </label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Ensures only numbers
              maxLength={10}
              className="w-full border-2 border-slate-200 rounded-lg p-3 font-bold focus:border-black outline-none tracking-widest transition-all" 
              placeholder="9999999999"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 border-2 border-black font-bold uppercase h-12"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm({ receiverName: name, receiverPhone: phone })} 
            disabled={isBooking || phone.length < 10}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] h-12 disabled:opacity-50 disabled:shadow-none"
          >
            {isBooking ? 'Dispatching...' : 'Confirm Dispatch'}
          </Button>
        </div>
        
      </div>
    </div>
  );
}
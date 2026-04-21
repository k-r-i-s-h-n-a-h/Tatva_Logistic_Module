'use client'
import React, { useState } from 'react';

export function LocationIQPicker({ onLocationSelect }: { onLocationSelect: (type: 'pickup' | 'delivery', data: any) => void }) {
  // 1. Hooks are correctly placed at the top level of the function body
  const [suggestions, setSuggestions] = useState<{pickup: any[], delivery: any[]}>({ pickup: [], delivery: [] });
  const [query, setQuery] = useState({ pickup: '', delivery: '' });
  const token = process.env.NEXT_PUBLIC_LOCATION_IQ_TOKEN;

  const handleSearch = async (type: 'pickup' | 'delivery', val: string) => {
    // Update the text in the box immediately as the user types
    setQuery(prev => ({ ...prev, [type]: val }));

    if (val.length < 3) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    const lat = "12.9716";
    const lon = "77.5946";
    const viewbox = "77.40,13.14,77.80,12.83";
    
    const url = `https://us1.locationiq.com/v1/autocomplete?key=${token}&q=${val}&limit=5&countrycodes=in&viewbox=${viewbox}&bounded=1&location_bias=point:${lat},${lon}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setSuggestions(prev => ({ ...prev, [type]: data }));
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSelect = (type: 'pickup' | 'delivery', item: any) => {
    // Sets the full address string into the input box
    setQuery(prev => ({ ...prev, [type]: item.display_name }));

    const mockPlace = {
      formatted_address: item.display_name,
      geometry: {
        location: {
          lat: () => parseFloat(item.lat),
          lng: () => parseFloat(item.lon)
        }
      }
    };
    onLocationSelect(type, mockPlace);
    setSuggestions(prev => ({ ...prev, [type]: [] })); 
  };

  return (
    <div className="space-y-4 p-4 border-2 border-black rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {(['pickup', 'delivery'] as const).map((type) => (
        <div key={type} className="relative">
          <label className="text-[10px] font-bold uppercase mb-1 block text-slate-500">{type} Location</label>
          <input 
            className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-black"
            placeholder={`Type ${type} address...`}
            value={query[type]} // This makes the "Full Address" appear after click
            onChange={(e) => handleSearch(type, e.target.value)}
          />
          {suggestions[type].length > 0 && (
            <div className="absolute z-50 w-full bg-white border-2 border-black mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {suggestions[type].map((item, i) => (
                <div 
                  key={i} 
                  className="p-3 hover:bg-slate-100 cursor-pointer text-xs border-b last:border-0"
                  onClick={() => handleSelect(type, item)}
                >
                  {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
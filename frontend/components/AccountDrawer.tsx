'use client'

import React from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AccountDrawer() {
  const { user, isAuthenticated } = useAuth();

  // Hide the hamburger if they aren't logged in
  if (!isAuthenticated || !user) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 border-2 border-black rounded hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
          <Menu size={24} />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="border-l-4 border-black w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader className="border-b-4 border-black pb-4 mb-6">
          <SheetTitle className="font-black uppercase text-2xl text-left">Menu</SheetTitle>
        </SheetHeader>

        <div>
          <h3 className="font-black uppercase text-lg mb-4">Recent Shipments</h3>
          {/* Placeholder for actual orders */}
          <div className="border-2 border-black p-4 mb-3 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">Order #1316439397</span>
              <span className="bg-yellow-300 text-[10px] font-black px-2 py-1 border-2 border-black uppercase">Pending</span>
            </div>
            <p className="text-xs text-slate-600 font-bold mb-1">Delhivery Surface 10kg</p>
            <p className="text-xs font-medium">Distance: 1033 km • Wt: 14kg</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
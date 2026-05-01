'use client'

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, Package, ChevronRight } from "lucide-react";

export function UserMenu({ openAuth, recentShipments = [] }: { 
  openAuth: (intent: 'login' | 'register') => void;
  recentShipments?: any[];
}) {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <button 
          onClick={() => openAuth('login')} 
          className="text-xs font-black uppercase tracking-widest hover:underline"
        >
          Log In
        </button>
        <Button 
          onClick={() => openAuth('register')} 
          className="bg-black text-white text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          Sign Up
        </Button>
      </div>
    );
  }

  const renderAvatar = (sizeClass: string, textSize: string = "text-lg") => {
    if (user?.profileImage?.url) {
      return (
        <img 
          src={user.profileImage.url} 
          alt="Profile" 
          className={`${sizeClass} rounded-full object-cover`} 
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-slate-800 text-white flex items-center justify-center font-black ${textSize}`}>
        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative outline-none cursor-pointer group">
          <div className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all rounded-full">
            {renderAvatar("w-10 h-10", "text-base")}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-72 p-0 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center gap-3">
          <div className="border-2 border-yellow-400 rounded-full">
            {renderAvatar("w-12 h-12", "text-lg")}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black uppercase text-sm leading-tight truncate">
              {user?.fullName || 'User'}
            </h2>
            <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mt-0.5">
              {user?.userName ? `@${user.userName}` : 'No username set'}
            </p>
          </div>
        </div>

        {/* Recent Shipments */}
        {recentShipments.length > 0 && (
          <div className="border-b-2 border-black">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 pt-3 pb-1">
              Recent Shipments
            </p>
            {recentShipments.slice(0, 2).map((s: any, i: number) => (
              <div key={i} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-black uppercase leading-none">Order #{s.order_id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.courier} • {s.weight}kg</p>
                </div>
                <span className="text-[8px] font-black uppercase bg-yellow-400 border border-black px-2 py-0.5">
                  {s.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Menu Items */}
        <div className="p-2">
          {[
            { icon: User, label: 'Profile', onClick: () => {} },
            { icon: Settings, label: 'Settings', onClick: () => {} },
            { icon: Package, label: 'My Shipments', onClick: () => {} },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 group/item transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 group-hover/item:text-black transition-colors" />
                <span className="text-xs font-black uppercase tracking-wide">{label}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover/item:text-black transition-colors" />
            </button>
          ))}

          <div className="h-[2px] bg-black my-1 mx-3" />

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 group/logout transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover/logout:text-red-600 transition-colors" />
            <span className="text-xs font-black uppercase tracking-wide text-red-500 group-hover/logout:text-red-700">
              Logout
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
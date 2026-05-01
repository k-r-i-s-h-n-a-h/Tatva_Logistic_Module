'use client'

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function UserMenu({ openAuth }: { openAuth: (intent: 'login' | 'register') => void }) {
  const { user, isAuthenticated, logout } = useAuth();

  // If NOT logged in, show the Login/Signup buttons
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => openAuth('login')} className="text-xs font-black uppercase hover:underline">
          Log In
        </button>
        <Button onClick={() => openAuth('register')} className="bg-black text-white border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform">
          Sign Up
        </Button>
      </div>
    );
  }

  // Logic for Image vs Initial
  const renderAvatar = (sizeClass: string) => {
    if (user?.profileImage?.url) {
      return <img src={user.profileImage.url} alt="Profile" className={`${sizeClass} rounded-full border-2 border-white object-cover`} />;
    }
    return (
      <div className={`${sizeClass} rounded-full bg-slate-800 text-white flex items-center justify-center font-bold border-2 border-white`}>
        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative outline-none cursor-pointer hover:scale-105 transition-transform">
          {renderAvatar("w-12 h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-black border-2")}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden mr-4 mt-2" align="end">
        <div className="h-24 bg-yellow-400 border-b-4 border-black" />
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-8 left-6">
            {renderAvatar("w-16 h-16 shadow-none border-4 border-black")}
          </div>
          <div className="mt-10">
            <h2 className="text-xl font-black uppercase text-slate-900">{user?.fullName || 'User'}</h2>
            <p className="text-sm text-slate-500 font-bold">Explorer • {user?.userName || 'No username'}</p>
          </div>
          <div className="mt-6 space-y-3 font-bold uppercase text-sm">
            <button className="w-full text-left hover:underline">Profile</button>
            <button className="w-full text-left hover:underline">Settings</button>
            <div className="h-[2px] bg-black my-2" />
            <button onClick={logout} className="w-full text-left text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
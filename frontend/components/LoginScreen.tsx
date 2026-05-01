// frontend/components/LoginScreen.tsx
'use client'

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileSettings } from './ProfileSettings';

export function LoginScreen({ isModal = false, onClose, initialIntent = 'login' }: { isModal?: boolean, onClose?: () => void, initialIntent?: 'login' | 'register' }) {
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  
  // 🔴 Expanded Steps to include success screens
  const [step, setStep] = useState<'phone' | 'otp' | 'register_form' | 'success'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectMsg, setRedirectMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    if (!/^\d{10}$/.test(phoneNumber)) { setError("Valid 10-digit number required."); setIsLoading(false); return; }

    try {
      const response = await authApi.sendOtp(phoneNumber);
      if (response.status === 'success' || response.message?.includes('sent')) {
        setStep('otp'); 
      } else {
        setError(response.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Connection error with Auth API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);

    try {
      const response = await authApi.verifyOtp(phoneNumber, otp);
      const token = response.data?.tokens?.accessToken;
      const userData = response.data?.user || { phone: phoneNumber, name: "Unknown" };

      if (response.success && token) {
        const isNewUser = !userData.fullName || userData.fullName === "Unknown" || userData.fullName === "";

        // SCENARIO 1: Clicked Login, but is a New User
        if (initialIntent === 'login' && isNewUser) {
          setRedirectMsg("Account not found. Redirecting to registration...");
          // Wait 2 seconds so they can read the message, then show the form
          setTimeout(() => {
             setRedirectMsg(null);
             setStep('register_form');
             // We save token so the Profile API has authorization, but don't finalize 'login' state yet
             login(userData, token); 
          }, 2000);
        }
        
        // SCENARIO 2: Clicked Login, and is an Existing User
        else if (initialIntent === 'login' && !isNewUser) {
          login(userData, token);
          triggerSuccess("Logged in successfully!");
        }

        // SCENARIO 3: Clicked Register, but is already an Existing User
        else if (initialIntent === 'register' && !isNewUser) {
          setRedirectMsg("Account already exists! Logging you in...");
          setTimeout(() => {
             login(userData, token);
             triggerSuccess("Logged in successfully!");
          }, 2000);
        }

        // SCENARIO 4: Clicked Register, and is a New User
        else {
          login(userData, token);
          setStep('register_form');
        }

      } else {
        setError(response.message || "Invalid OTP.");
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔴 Helper to show the success screen for 1.5 seconds, then close modal
  const triggerSuccess = (message: string) => {
    setSuccessMsg(message);
    setStep('success');
    setTimeout(() => {
      if (onClose) onClose();
    }, 1500);
  };

 return (
  <div className="w-full relative min-h-[150px]">

    {/* Redirect overlay */}
    {redirectMsg && (
      <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center animate-in fade-in gap-3">
        <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase text-center text-slate-600">{redirectMsg}</p>
      </div>
    )}

    {/* Error */}
    {error && (
      <div className="p-3 mb-4 border-2 border-red-500 bg-red-50 text-red-700 font-bold text-[10px] uppercase flex items-center gap-2">
        <span>⚠</span> {error}
      </div>
    )}

    {/* STEP 1: Phone */}
    {step === 'phone' && (
      <form onSubmit={handleSendOtp} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Phone Number
          </label>
          <div className="flex border-2 border-black focus-within:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <span className="px-3 py-2.5 bg-slate-100 border-r-2 border-black font-black text-sm text-slate-600">
              +91
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="flex-1 px-3 py-2.5 outline-none font-bold text-sm"
              placeholder="Enter 10-digit number"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || phoneNumber.length < 10}
          className="w-full py-3 bg-black text-white font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          {isLoading ? "Sending OTP..." : "Get OTP →"}
        </button>
      </form>
    )}

    {/* STEP 2: OTP */}
    {step === 'otp' && (
      <form onSubmit={handleVerifyOtp} className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              6-Digit OTP
            </label>
            <span className="text-[10px] text-slate-400 font-bold">
              Sent to +91 {phoneNumber}
            </span>
          </div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full border-2 border-black px-4 py-3 text-center tracking-[0.8em] font-black text-xl outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
            placeholder="••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || otp.length < 6}
          className="w-full py-3 bg-black text-white font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Verify & Continue →"}
        </button>
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-black transition-colors"
        >
          ← Change number
        </button>
      </form>
    )}

    {/* STEP 3: Registration Form */}
    {step === 'register_form' && (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <ProfileSettings
          isModalView={true}
          onComplete={() => triggerSuccess("Registered successfully!")}
        />
      </div>
    )}

    {/* STEP 4: Success */}
    {step === 'success' && (
      <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-300 gap-4">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-black uppercase">{successMsg}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Redirecting...</p>
        </div>
      </div>
    )}

  </div>
);
}
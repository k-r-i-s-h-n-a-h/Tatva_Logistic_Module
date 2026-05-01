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
      {/* Redirection Overlay */}
      {redirectMsg && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center animate-in fade-in">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-black uppercase text-center">{redirectMsg}</p>
        </div>
      )}

      {error && <div className="p-3 mb-4 border-2 border-red-500 bg-red-50 text-red-700 font-bold text-[10px] uppercase">{error}</div>}

     {/* STEP 1: PHONE INPUT */}
     {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">+91</span>
              <Input 
                type="tel" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="border-2 border-black pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-black text-white" disabled={isLoading}>
              {isLoading ? "Sending..." : "Get OTP →"}
          </Button>
        </form>
      )}

      {/* STEP 2: OTP INPUT */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">6-Digit Code</label>
            <Input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="border-2 border-black text-center tracking-[0.5em] font-black"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-black text-white" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify & Continue"}
          </Button>
        </form>
      )}

      {/* STEP 3: REGISTRATION FORM */}
      {step === 'register_form' && (
        <div className="space-y-4 animate-in slide-in-from-right-4">
          <ProfileSettings 
            isModalView={true} 
            onComplete={() => triggerSuccess("Registered successfully!")} 
          />
        </div>
      )}

      {/* STEP 4: SUCCESS SCREEN */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center border-4 border-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-lg font-black uppercase text-center">{successMsg}</h3>
        </div>
      )}
    </div>
  );
}
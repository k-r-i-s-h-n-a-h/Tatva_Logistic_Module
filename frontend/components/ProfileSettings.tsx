// frontend/components/ProfileSettings.tsx
'use client'

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProfileSettingsProps {
  isModalView?: boolean;
  onComplete?: () => void;
}

export function ProfileSettings({ isModalView = false, onComplete }: ProfileSettingsProps) {
  const { user, token, login} = useAuth();
  
  // Pre-fill state with existing user data if available
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    userName: user?.userName || '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !token) return;

    setStatus({ type: 'loading', message: 'Updating profile...' });

    // Build the FormData object exactly like the Postman collection
    const uploadData = new FormData();
    uploadData.append('phoneNumber', user?.phoneNumber || ''); // Keep existing phone
    uploadData.append('fullName', formData.fullName);
    uploadData.append('email', formData.email);
    uploadData.append('userName', formData.userName);
    uploadData.append('status', 'active');
    
    if (profileImage) {
      uploadData.append('profileImage', profileImage);
    }

    try {
    const response = await authApi.updateUser(user._id, token, uploadData);
    
    // 🔴 CHECK FOR response.success HERE
        if (response.success) {
        const updatedUser = response.data.user; // Extract the user from the 'data' wrapper
        
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
        
        // Update global context so the Avatar and name update in the header instantly
        login(updatedUser, token);

        // Close the modal and show the green success checkmark
        if (onComplete) {
            setTimeout(() => onComplete(), 1000); 
        }
        } else {
        // Handle cases where success might be false but didn't throw an exception
        setStatus({ type: 'error', message: response.message || 'Failed to update profile.' });
        }
    } catch (err) {
        setStatus({ type: 'error', message: 'Connection error. Please try again.' });
    }
  };

  if (!user) return null; // Don't show if not logged in

  return (
    <div className="p-6 max-w-lg mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">Profile Settings</h2>
      
      {status.message && (
        <div className={`p-3 mb-4 text-[10px] font-bold uppercase border-2 ${status.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500">Full Name</label>
          <Input 
            value={formData.fullName} 
            onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
            className="border-2 border-black" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500">Email Address</label>
          <Input 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="border-2 border-black" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500">Username</label>
          <Input 
            value={formData.userName} 
            onChange={(e) => setFormData({...formData, userName: e.target.value})} 
            className="border-2 border-black" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500">Profile Image</label>
          <Input 
            type="file" 
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files?.[0] || null)} 
            className="border-2 border-black file:bg-black file:text-white file:border-0 file:px-4 file:py-1 file:mr-4 file:text-xs file:font-bold file:uppercase cursor-pointer" 
          />
        </div>

        <Button type="submit" disabled={status.type === 'loading'} className="w-full bg-black text-white font-bold uppercase mt-4">
          {status.type === 'loading' ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
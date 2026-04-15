'use client'
import React from 'react'

interface ModeSelectorProps {
  mode: 'auto' | 'manual';
  setMode: (mode: 'auto' | 'manual') => void;
}

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="flex bg-white rounded-xl border border-border p-1 shadow-sm max-w-4xl mx-auto mb-8">
      <button 
        onClick={() => setMode('auto')}
        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'auto' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"}`}
      >
        📷 Auto Image Capture
      </button>
      <button  
        onClick={() => setMode('manual')}
        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'manual' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"}`}
      >
        ✍️ Manual Entry
      </button>
    </div>
  )
}
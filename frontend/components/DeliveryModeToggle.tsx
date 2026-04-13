'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface DeliveryModeToggleProps {
  mode: 'domestic' | 'instant'
  onChange: (mode: 'domestic' | 'instant') => void
}

export function DeliveryModeToggle({ mode, onChange }: DeliveryModeToggleProps) {
  return (
    <div className="flex gap-3 mb-8">
      <Button
        onClick={() => onChange('domestic')}
        variant={mode === 'domestic' ? 'default' : 'outline'}
        className="flex-1 uppercase tracking-wide text-xs font-semibold"
      >
        Domestic Shipping
      </Button>
      <Button
        onClick={() => onChange('instant')}
        variant={mode === 'instant' ? 'default' : 'outline'}
        className="flex-1 uppercase tracking-wide text-xs font-semibold"
      >
        Instant Delivery
      </Button>
    </div>
  )
}

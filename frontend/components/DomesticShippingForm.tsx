'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeliveryItem } from '@/lib/logistics'

interface DomesticShippingFormProps {
  onAddItem: (item: DeliveryItem) => void
}

export function DomesticShippingForm({ onAddItem }: DomesticShippingFormProps) {
  const [formData, setFormData] = useState({
    length: '',
    width: '',
    height: '',
    weight: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.length || !formData.width || !formData.height || !formData.weight) {
      return
    }

    const newItem: DeliveryItem = {
      id: Date.now().toString(),
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      quantity: 1,
    }

    onAddItem(newItem)
    setFormData({ length: '', width: '', height: '', weight: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="length" className="uppercase text-xs font-semibold tracking-wide">
            Length (cm)
          </Label>
          <Input
            id="length"
            name="length"
            type="number"
            placeholder="30"
            value={formData.length}
            onChange={handleChange}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width" className="uppercase text-xs font-semibold tracking-wide">
            Width (cm)
          </Label>
          <Input
            id="width"
            name="width"
            type="number"
            placeholder="20"
            value={formData.width}
            onChange={handleChange}
            className="h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="uppercase text-xs font-semibold tracking-wide">
            Height (cm)
          </Label>
          <Input
            id="height"
            name="height"
            type="number"
            placeholder="15"
            value={formData.height}
            onChange={handleChange}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight" className="uppercase text-xs font-semibold tracking-wide">
            Weight (kg)
          </Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            placeholder="2.5"
            value={formData.weight}
            onChange={handleChange}
            className="h-10"
          />
        </div>
      </div>

      <Button type="submit" className="w-full uppercase text-xs font-semibold tracking-wide">
        Add to Manifest
      </Button>
    </form>
  )
}

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DeliveryItem, MATERIAL_MAP, ITEM_STANDARDS, PACKAGING_SHAPES } from '@/lib/logistics'

interface InstantDeliveryFormProps {
  onAddItem: (item: DeliveryItem) => void
}

export function InstantDeliveryForm({ onAddItem }: InstantDeliveryFormProps) {
  const [materialType, setMaterialType] = useState<string>('')
  const [packagingShape, setPackagingShape] = useState<string>('')
  const [quantity, setQuantity] = useState('1')

  const selectedStandard = materialType ? ITEM_STANDARDS[materialType as keyof typeof ITEM_STANDARDS] : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialType || !packagingShape || !quantity) {
      return
    }

    const standard = ITEM_STANDARDS[materialType as keyof typeof ITEM_STANDARDS]
    const newItem: DeliveryItem = {
      id: Date.now().toString(),
      material_type: materialType,
      category: "General",
      length: standard.l,        
      width: standard.w,          
      height: standard.h,         
      weight: standard.weight,
      quantity: parseInt(quantity),
      shape: packagingShape,      
      is_fragile: false,          
    }

    onAddItem(newItem)
    setMaterialType('')
    setPackagingShape('')
    setQuantity('1')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="material" className="uppercase text-xs font-semibold tracking-wide">
          Service Category / Material Type
        </Label>
        <Select value={materialType} onValueChange={setMaterialType}>
          <SelectTrigger id="material" className="h-10">
            <SelectValue placeholder="Select material type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MATERIAL_MAP).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStandard && (
        <div className="space-y-2">
          <Label className="uppercase text-xs font-semibold tracking-wide">Auto-filled Standard Dimensions</Label>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">
              {selectedStandard.l}cm L
            </Badge>
            <Badge variant="secondary">
              {selectedStandard.w}cm W
            </Badge>
            <Badge variant="secondary">
              {selectedStandard.h}cm H
            </Badge>
            <Badge variant="secondary">
              {selectedStandard.weight}kg
            </Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="packaging" className="uppercase text-xs font-semibold tracking-wide">
            Packaging Shape
          </Label>
          <Select value={packagingShape} onValueChange={setPackagingShape}>
            <SelectTrigger id="packaging" className="h-10">
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              {PACKAGING_SHAPES.map((shape) => (
                <SelectItem key={shape} value={shape}>
                  {shape}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity" className="uppercase text-xs font-semibold tracking-wide">
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
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

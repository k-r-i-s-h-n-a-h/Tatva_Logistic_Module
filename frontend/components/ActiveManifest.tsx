'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeliveryItem, MATERIAL_MAP } from '@/lib/logistics'
import { X } from 'lucide-react'

interface ActiveManifestProps {
  items: DeliveryItem[]
  onRemoveItem: (id: string) => void
}

export function ActiveManifest({ items, onRemoveItem }: ActiveManifestProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-wide">Active Manifest</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No items added yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base uppercase tracking-wide">Active Manifest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
            <div className="flex-1">
              <div className="flex gap-2 items-center">
                <span className="font-medium text-sm">
                  {item.materialType ? MATERIAL_MAP[item.materialType as keyof typeof MATERIAL_MAP] : 'Custom Item'}
                </span>
                {item.quantity > 1 && (
                  <Badge variant="outline" className="text-xs">
                    x{item.quantity}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.length}×{item.width}×{item.height}cm · {item.weight}kg
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem(item.id)}
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

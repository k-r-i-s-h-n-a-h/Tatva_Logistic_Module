// Material types and their standard dimensions
export const MATERIAL_MAP: Record<string, string> = {
  documents: 'Documents',
  electronics: 'Electronics',
  apparel: 'Apparel',
  food: 'Food & Beverages',
  furniture: 'Furniture',
  fragile: 'Fragile Items',
  hazmat: 'Hazardous Materials',
  pharma: 'Pharmaceutical',
}

// Standard dimensions for each material type (L x W x H in cm)
export const ITEM_STANDARDS: Record<string, { length: number; width: number; height: number }> = {
  documents: { length: 30, width: 20, height: 5 },
  electronics: { length: 25, width: 20, height: 15 },
  apparel: { length: 40, width: 30, height: 20 },
  food: { length: 35, width: 25, height: 15 },
  furniture: { length: 100, width: 80, height: 60 },
  fragile: { length: 30, width: 25, height: 25 },
  hazmat: { length: 40, width: 30, height: 30 },
  pharma: { length: 25, width: 20, height: 12 },
}

// Packaging shapes
export const PACKAGING_SHAPES = ['Box', 'Cylinder', 'Envelope', 'Flat Pack'] as const
export type PackagingShape = (typeof PACKAGING_SHAPES)[number]

// Delivery item interface
export interface DeliveryItem {
  id: string
  type: 'domestic' | 'instant'
  materialType?: string
  length: number
  width: number
  height: number
  weight: number
  quantity: number
  packagingShape?: PackagingShape
}

// Route information
export interface RouteInfo {
  pickupPincode: string
  deliveryPincode: string
}

// Optimization result
export interface OptimizationResult {
  chargeableWeight: number
  cargoVolume: number
  vehicleType: string
  fare: number
  distance: number
  tips: string[]
}

// Calculate chargeable weight (volumetric or actual, whichever is greater)
export function calculateChargeableWeight(
  length: number,
  width: number,
  height: number,
  actualWeight: number,
  quantity: number
): number {
  const volumetricWeight = (length * width * height) / 5000 // Standard volumetric divisor
  const totalActualWeight = actualWeight * quantity
  const totalVolumetricWeight = volumetricWeight * quantity
  return Math.ceil(Math.max(totalActualWeight, totalVolumetricWeight) * 100) / 100
}

// Calculate cargo volume
export function calculateCargoVolume(
  length: number,
  width: number,
  height: number,
  quantity: number
): number {
  const volume = (length * width * height) / 1000 // Convert to liters
  return Math.ceil(volume * quantity * 100) / 100
}

// Fleet matching based on weight
export function matchFleet(totalWeight: number): OptimizationResult {
  let vehicleType = 'Two Wheeler'
  let fare = 50
  let distance = Math.random() * 10 + 5

  if (totalWeight <= 10) {
    vehicleType = 'Two Wheeler'
    fare = 50 + totalWeight * 5
  } else if (totalWeight <= 50) {
    vehicleType = 'Delivery Van'
    fare = 150 + totalWeight * 3
  } else {
    vehicleType = 'Heavy Truck'
    fare = 400 + totalWeight * 2
  }

  const tips = [
    'Optimize route to reduce distance',
    'Stack items efficiently to maximize space',
    'Use protective padding for fragile items',
  ]

  return {
    chargeableWeight: totalWeight,
    cargoVolume: 0,
    vehicleType,
    fare: Math.ceil(fare),
    distance: Math.ceil(distance * 10) / 10,
    tips,
  }
}

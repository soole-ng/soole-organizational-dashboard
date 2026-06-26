/**
 * useMockData — unified data hook for Soole Dashboard
 * Fetches /mock-data.json once, caches in module scope, returns typed collections.
 * All pages should use this hook instead of importing empty static arrays.
 */

import { useState, useEffect } from 'react'
import type { Driver, Vehicle, Route, Trip, Transaction, Payout, Alert, OrganizationMember } from '../types'

export interface MockData {
  routes: Route[]
  drivers: Driver[]
  vehicles: Vehicle[]
  trips: Trip[]
  transactions: Transaction[]
  payouts: Payout[]
  alerts: Alert[]
  organizationMembers: OrganizationMember[]
  weeklyRevenue: { day: string; gross: number; net: number }[]
  vehicleLocations: VehicleLocation[]
  aiAssistantSuggestions: string[]
  locations: Location[]
}

export interface VehicleLocation {
  id: string
  plate: string
  driver: string
  status: 'on_trip' | 'idle'
  lat: number
  lng: number
  trip: string | null
  eta: string | null
  speed: number
}

export interface Location {
  id: string
  name: string
  state: string
  lat: number
  lng: number
}

const EMPTY_DATA: MockData = {
  routes: [],
  drivers: [],
  vehicles: [],
  trips: [],
  transactions: [],
  payouts: [],
  alerts: [],
  organizationMembers: [],
  weeklyRevenue: [],
  vehicleLocations: [],
  aiAssistantSuggestions: [],
  locations: [],
}

// Module-level cache so the JSON is only fetched once per session
let _cache: MockData | null = null
let _promise: Promise<MockData> | null = null

async function fetchMockData(): Promise<MockData> {
  if (_cache) return _cache
  if (_promise) return _promise

  _promise = fetch('/mock-data.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then((raw: any) => {
      _cache = {
        routes: raw.routes ?? [],
        drivers: raw.drivers ?? [],
        vehicles: raw.vehicles ?? [],
        trips: raw.trips ?? [],
        transactions: raw.transactions ?? [],
        payouts: raw.payouts ?? [],
        alerts: raw.alerts ?? [],
        organizationMembers: raw.organizationMembers ?? [],
        weeklyRevenue: raw.weeklyRevenue ?? [],
        vehicleLocations: raw.vehicleLocations ?? [],
        aiAssistantSuggestions: raw.aiAssistantSuggestions ?? [],
        locations: raw.locations ?? [],
      }
      return _cache
    })

  return _promise
}

/** Invalidate cache — call after mock data mutations in dev */
export function invalidateMockCache() {
  _cache = null
  _promise = null
}

export interface UseMockDataResult {
  data: MockData
  loading: boolean
  error: string | null
}

export function useMockData(): UseMockDataResult {
  const [data, setData] = useState<MockData>(_cache ?? EMPTY_DATA)
  const [loading, setLoading] = useState<boolean>(!_cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (_cache) {
      setData(_cache)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchMockData()
      .then(d => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load data')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}

/** Convenience hook: get mock passengers for a trip */
export function useMockPassengers(tripId: string) {
  return [
    { id: `${tripId}-p1`, seatNumber: 1, name: 'Adaeze Okonkwo', phone: '+2348031112233', paymentStatus: 'paid' as const, boardingStatus: 'boarded' as const, boardedAt: '2026-06-26T06:02:00', fare: 5000 },
    { id: `${tripId}-p2`, seatNumber: 2, name: 'Emeka Nwosu', phone: '+2348044556677', paymentStatus: 'paid' as const, boardingStatus: 'boarded' as const, boardedAt: '2026-06-26T05:58:00', fare: 5000 },
    { id: `${tripId}-p3`, seatNumber: 3, name: 'Halima Abdullahi', phone: '+2348077889900', paymentStatus: 'paid' as const, boardingStatus: 'waiting' as const, fare: 5000 },
    { id: `${tripId}-p4`, seatNumber: 4, name: 'Tunde Fashola', phone: '+2348055667788', paymentStatus: 'pending' as const, boardingStatus: 'waiting' as const, fare: 5000 },
    { id: `${tripId}-p5`, seatNumber: 5, name: 'Ngozi Eze', phone: '+2348022334455', paymentStatus: 'paid' as const, boardingStatus: 'boarded' as const, boardedAt: '2026-06-26T06:05:00', fare: 5000 },
  ]
}

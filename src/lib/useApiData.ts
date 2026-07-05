/**
 * useApiData — unified real-backend data hook for the Soole Dashboard.
 * Replaces useMockData: fetches every collection a page needs from soole-backend,
 * scoped to the current organization (org_uuid from OrgContext/localStorage).
 */
import { useState, useEffect, useCallback } from 'react'
import type { Driver, Vehicle, Trip, Transaction, Payout, Alert, OrganizationMember, Route } from '../types'
import { organizationApi, vehiclesApi, driversApi, reportsApi, moneyApi, trackingApi, notificationsApi, settingsApi } from '../api/client'
import {
  adaptDriverIdentity, mergeDriverStats, adaptVehicle, adaptTrip,
  adaptTransaction, adaptPayout, adaptVehicleLocation, adaptOrganizationMember,
  adaptAlert, adaptWeeklyRevenueDay, adaptPassenger,
} from './adapters'

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

export interface ApiData {
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
}

const EMPTY_DATA: ApiData = {
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
}

function getOrgUuid(): string | null {
  return localStorage.getItem('org_uuid')
}

async function fetchAll(orgUuid: string): Promise<ApiData> {
  // These list endpoints are server-paginated (trips default to 12/page,
  // vehicles/transactions/payouts to 20/page) - fetching with the default
  // limit meant the dashboard only ever saw page 1, so any org with more
  // than one page of trips/vehicles/transactions silently lost the rest
  // regardless of which filter tab was clicked. Requesting a generous
  // limit here is a stopgap; a real fix would thread pagination through
  // each consuming page instead of the single shared useApiData cache.
  const LIST_FETCH_LIMIT = 500

  const [
    driversRaw, driverStats, vehiclesRes, tripsRes, transactionsRes,
    payoutsRes, alertsRes, membersRes, weeklyRevenueRes, locationsRaw, routesRaw,
  ] = await Promise.all([
    driversApi.getDrivers(orgUuid).catch(() => []),
    reportsApi.getDriverReport(orgUuid).catch(() => ({ drivers: [] })),
    vehiclesApi.getVehicles(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ vehicles: [], total: 0 })),
    organizationApi.getTrips(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ trips: [], total: 0, page: 1, limit: 20 })),
    moneyApi.getTransactions(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ transactions: [], total_count: 0, page: 1, limit: 20 })),
    moneyApi.getPayouts(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ payouts: [], total_amount: 0, total_count: 0, page: 1, limit: 20 })),
    notificationsApi.getNotifications(orgUuid).catch(() => ({ notifications: [], total: 0, unread_count: 0 })),
    settingsApi.getMembers(orgUuid).catch(() => []),
    moneyApi.getWeeklyRevenue(orgUuid).catch(() => ({ daily_breakdown: [] })),
    trackingApi.getVehiclesLocations(orgUuid).catch(() => []),
    organizationApi.getRoutes(orgUuid).catch(() => []),
  ]) as [any[], any, any, any, any, any, any, any, any, any[], any[]]

  const statsById = new Map((driverStats.drivers || []).map((d: any) => [d.id, d]))
  const drivers = (driversRaw || []).map((d: any) => mergeDriverStats(adaptDriverIdentity(d), statsById.get(d.uuid)))

  return {
    routes: (routesRaw || []).map((r: any) => ({
      id: r.id,
      origin: r.origin,
      destination: r.destination,
      baseFare: parseFloat(r.base_fare ?? '0'),
      durationMinutes: r.estimated_duration_minutes ?? 0,
      distanceKm: r.distance_km ?? 0,
    })),
    drivers,
    vehicles: (vehiclesRes.vehicles || []).map(adaptVehicle),
    trips: (tripsRes.trips || []).map(adaptTrip),
    transactions: (transactionsRes.transactions || []).map(adaptTransaction),
    payouts: (payoutsRes.payouts || []).map(adaptPayout),
    alerts: (alertsRes.notifications || []).map(adaptAlert),
    organizationMembers: (membersRes || []).map(adaptOrganizationMember),
    weeklyRevenue: (weeklyRevenueRes.daily_breakdown || []).map(adaptWeeklyRevenueDay),
    vehicleLocations: (locationsRaw || []).map(adaptVehicleLocation),
    aiAssistantSuggestions: [],
  }
}

let _cache: ApiData | null = null
let _cacheOrgUuid: string | null = null
let _promise: Promise<ApiData> | null = null

function loadApiData(orgUuid: string): Promise<ApiData> {
  if (_cache && _cacheOrgUuid === orgUuid) return Promise.resolve(_cache)
  if (_promise && _cacheOrgUuid === orgUuid) return _promise

  _cacheOrgUuid = orgUuid
  _promise = fetchAll(orgUuid).then(d => {
    _cache = d
    return d
  })
  return _promise
}

/** Invalidate cache — call after mutations (create trip, invite driver, etc.) */
export function invalidateApiDataCache() {
  _cache = null
  _promise = null
  _cacheOrgUuid = null
}

export interface UseApiDataResult {
  data: ApiData
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApiData(): UseApiDataResult {
  const orgUuid = getOrgUuid()
  const [data, setData] = useState<ApiData>(_cache && _cacheOrgUuid === orgUuid ? _cache : EMPTY_DATA)
  const [loading, setLoading] = useState<boolean>(!(orgUuid && _cache && _cacheOrgUuid === orgUuid))
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    if (!orgUuid) {
      setLoading(false)
      setError('No organization selected')
      return
    }

    if (_cache && _cacheOrgUuid === orgUuid && refetchToken === 0) {
      setData(_cache)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    loadApiData(orgUuid)
      .then(d => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load dashboard data')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgUuid, refetchToken])

  const refetch = useCallback(() => {
    invalidateApiDataCache()
    setRefetchToken(t => t + 1)
  }, [])

  return { data, loading, error, refetch }
}

export interface HomeStats {
  tripsToday: number
  bookingsToday: number
  revenueToday: number
  walletBalance: number
  activeTripsCount: number
  weekOverWeekPercent: number | null
  previousWeekRevenue: number
}

/** Real headline stats for the Home page hero band — replaces hardcoded demo numbers. */
export function useHomeStats(): { stats: HomeStats; loading: boolean } {
  const { data, loading: dataLoading } = useApiData()
  const [balance, setBalance] = useState(0)
  const [weekOverWeekPercent, setWeekOverWeekPercent] = useState<number | null>(null)
  const [previousWeekRevenue, setPreviousWeekRevenue] = useState(0)
  const [loadingExtra, setLoadingExtra] = useState(true)

  useEffect(() => {
    const orgUuid = getOrgUuid()
    if (!orgUuid) {
      setLoadingExtra(false)
      return
    }
    let cancelled = false
    Promise.all([
      moneyApi.getBalance(orgUuid).catch(() => null),
      moneyApi.getWeeklyRevenue(orgUuid).catch(() => null),
    ]).then(([balanceRes, weekRes]: [any, any]) => {
      if (cancelled) return
      if (balanceRes) setBalance(Number(balanceRes.available_balance ?? 0))
      if (weekRes?.comparison_previous_week) {
        setWeekOverWeekPercent(Number(weekRes.comparison_previous_week.revenue_change_percent ?? 0))
        setPreviousWeekRevenue(Number(weekRes.comparison_previous_week.previous_week_revenue ?? 0))
      }
      setLoadingExtra(false)
    })
    return () => { cancelled = true }
  }, [])

  const todayStr = new Date().toDateString()
  const todaysTrips = data.trips.filter(t => new Date(t.departureAt).toDateString() === todayStr)

  const stats: HomeStats = {
    tripsToday: todaysTrips.length,
    bookingsToday: todaysTrips.reduce((sum, t) => sum + t.bookedSeats, 0),
    revenueToday: todaysTrips.reduce((sum, t) => sum + t.grossRevenue, 0),
    walletBalance: balance,
    activeTripsCount: data.trips.filter(t => t.status === 'boarding' || t.status === 'in_progress').length,
    weekOverWeekPercent,
    previousWeekRevenue,
  }

  return { stats, loading: dataLoading || loadingExtra }
}

/** Fetch a single trip's detail (passengers + comments) directly from the backend. */
export function useTripDetail(tripId: string | undefined) {
  const orgUuid = getOrgUuid()
  const [trip, setTrip] = useState<any | null>(null)
  const [passengers, setPassengers] = useState<ReturnType<typeof adaptPassenger>[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgUuid || !tripId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    organizationApi.getTripDetail(orgUuid, tripId)
      .then((raw: any) => {
        if (cancelled) return
        setTrip(raw)
        setPassengers((raw.passengers || []).map(adaptPassenger))
        setComments(raw.comments || [])
        setLoading(false)
      })
      .catch((err: any) => {
        if (cancelled) return
        setError(err?.message ?? 'Failed to load trip')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [orgUuid, tripId])

  return { trip, passengers, comments, loading, error }
}

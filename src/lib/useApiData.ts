/**
 * useApiData — unified real-backend data hook for the Soole Dashboard.
 * Replaces useMockData: fetches every collection a page needs from soole-backend,
 * scoped to the current organization (org_uuid from OrgContext/localStorage).
 */
import { useState, useEffect, useCallback } from 'react'
import type { Driver, Vehicle, Trip, Transaction, Payout, Alert, OrganizationMember, Route } from '../types'
import { organizationApi, vehiclesApi, fleetApi, moneyApi, trackingApi, notificationsApi, settingsApi, dashboardApi } from '../api/client'
import {
  adaptFleetDriver, adaptVehicle, adaptTrip,
  adaptTransaction, adaptPayout, adaptVehicleLocation, adaptOrganizationMember,
  adaptAlert, adaptWeeklyRevenueDay, adaptPassenger,
} from './adapters'

export interface BankAccountRow {
  uuid: string
  bank_name: string
  bank_code?: string
  account_number: string
  account_name: string
  account_type?: string
  is_primary: boolean
  verification_status?: string
  verification_date?: string
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
  bankAccounts: BankAccountRow[]
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
  bankAccounts: [],
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
    driversRes, vehiclesRes, tripsRes, transactionsRes,
    payoutsRes, alertsRes, membersRes, weeklyRevenueRes, locationsRaw, routesRaw,
    bankAccountsRaw,
  ] = await Promise.all([
    fleetApi.getDrivers(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ drivers: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } })),
    vehiclesApi.getVehicles(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ vehicles: [], total: 0 })),
    organizationApi.getTrips(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ trips: [], total: 0, page: 1, limit: 20 })),
    moneyApi.getTransactions(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ transactions: [], total_count: 0, page: 1, limit: 20 })),
    moneyApi.getPayouts(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ payouts: [], total_amount: 0, total_count: 0, page: 1, limit: 20 })),
    notificationsApi.getNotifications(orgUuid).catch(() => ({ notifications: [], total: 0, unread_count: 0 })),
    settingsApi.getMembers(orgUuid).catch(() => []),
    moneyApi.getWeeklyRevenue(orgUuid).catch(() => ({ daily_breakdown: [] })),
    trackingApi.getVehiclesLocations(orgUuid).catch(() => []),
    organizationApi.getRoutes(orgUuid).catch(() => []),
    settingsApi.getBankAccounts(orgUuid).catch(() => []),
  ]) as [any, any, any, any, any, any, any, any, any[], any[], BankAccountRow[]]

  const drivers = (driversRes.drivers || []).map(adaptFleetDriver)

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
    bankAccounts: bankAccountsRaw || [],
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

// Every mounted useApiData() instance registers a listener here. Clearing
// the module-level cache above only affects the *next* call to loadApiData
// - without this, a screen that's already mounted (e.g. the trips list
// open in another tab, or the vehicles page sitting behind the current
// route) would never re-fetch just because notificationsSocket.ts heard a
// server-side event; it'd stay stale until its own local mutation or a
// manual refresh. This is what makes a websocket push actually propagate
// to every open screen instead of just the one that happens to remount.
const _listeners = new Set<() => void>()

/** Clears the cache and tells every mounted useApiData() to refetch now. */
export function notifyDataChanged() {
  invalidateApiDataCache()
  _listeners.forEach(listener => listener())
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
    const listener = () => setRefetchToken(t => t + 1)
    _listeners.add(listener)
    return () => { _listeners.delete(listener) }
  }, [])

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
  const [tripsToday, setTripsToday] = useState(0)
  const [bookingsToday, setBookingsToday] = useState(0)
  const [revenueToday, setRevenueToday] = useState(0)
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
      // Trips today / bookings today / today's revenue - previously
      // re-derived client-side from data.trips using the browser's local
      // timezone (toDateString()), which drifts from the backend's
      // Africa/Lagos day boundary and never reflected real credited
      // revenue in the first place (see dashboard/api.py's
      // revenue_from_transactions). Call the real endpoint instead.
      dashboardApi.getSummary().catch(() => null),
    ]).then(([balanceRes, weekRes, summaryRes]: [any, any, any]) => {
      if (cancelled) return
      if (balanceRes) setBalance(Number(balanceRes.available_balance ?? 0))
      if (weekRes?.comparison_previous_week) {
        setWeekOverWeekPercent(Number(weekRes.comparison_previous_week.revenue_change_percent ?? 0))
        setPreviousWeekRevenue(Number(weekRes.comparison_previous_week.previous_week_revenue ?? 0))
      }
      if (summaryRes) {
        setTripsToday(Number(summaryRes.trips_today ?? 0))
        setBookingsToday(Number(summaryRes.total_bookings_today ?? 0))
        setRevenueToday(Number(summaryRes.todays_revenue?.gross ?? 0))
      }
      setLoadingExtra(false)
    })
    return () => { cancelled = true }
  }, [])

  const stats: HomeStats = {
    tripsToday,
    bookingsToday,
    revenueToday,
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

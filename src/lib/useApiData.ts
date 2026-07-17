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
  weeklyRevenue: { day: string; gross: number; net: number; bookings: number }[]
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

// These list endpoints are server-paginated (trips default to 12/page,
// vehicles/transactions/payouts to 20/page) - fetching with the default
// limit meant the dashboard only ever saw page 1, so any org with more
// than one page of trips/vehicles/transactions silently lost the rest
// regardless of which filter tab was clicked. Requesting a generous
// limit here is a stopgap; a real fix would thread pagination through
// each consuming page instead of the single shared useApiData cache.
const LIST_FETCH_LIMIT = 500

export type ApiDataKey = keyof ApiData

// One fetcher per resource, each returning just its own slice of ApiData.
// This is what makes scoped refreshes possible below: a mutation that only
// touches drivers (e.g. removing one) can re-fetch just `drivers` instead
// of re-running all 11 requests that fetchAll used to fire as one unit.
const RESOURCE_FETCHERS: { [K in ApiDataKey]: (orgUuid: string) => Promise<Pick<ApiData, K>> } = {
  routes: async (orgUuid) => {
    const routesRaw = await organizationApi.getRoutes(orgUuid).catch(() => [])
    return {
      routes: (routesRaw || []).map((r: any) => ({
        id: r.id,
        origin: r.origin,
        destination: r.destination,
        baseFare: parseFloat(r.base_fare ?? '0'),
        durationMinutes: r.estimated_duration_minutes ?? 0,
        distanceKm: r.distance_km ?? 0,
      })),
    }
  },
  drivers: async (orgUuid) => {
    const driversRes: any = await fleetApi.getDrivers(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ drivers: [] }))
    return { drivers: (driversRes.drivers || []).map(adaptFleetDriver) }
  },
  vehicles: async (orgUuid) => {
    const vehiclesRes: any = await vehiclesApi.getVehicles(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ vehicles: [] }))
    return { vehicles: (vehiclesRes.vehicles || []).map(adaptVehicle) }
  },
  trips: async (orgUuid) => {
    const tripsRes: any = await organizationApi.getTrips(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ trips: [] }))
    return { trips: (tripsRes.trips || []).map(adaptTrip) }
  },
  transactions: async (orgUuid) => {
    const transactionsRes: any = await moneyApi.getTransactions(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ transactions: [] }))
    return { transactions: (transactionsRes.transactions || []).map(adaptTransaction) }
  },
  payouts: async (orgUuid) => {
    const payoutsRes: any = await moneyApi.getPayouts(orgUuid, { limit: LIST_FETCH_LIMIT }).catch(() => ({ payouts: [] }))
    return { payouts: (payoutsRes.payouts || []).map(adaptPayout) }
  },
  alerts: async (orgUuid) => {
    const alertsRes: any = await notificationsApi.getNotifications(orgUuid).catch(() => ({ notifications: [] }))
    return { alerts: (alertsRes.notifications || []).map(adaptAlert) }
  },
  organizationMembers: async (orgUuid) => {
    const membersRes: any = await settingsApi.getMembers(orgUuid).catch(() => [])
    return { organizationMembers: (membersRes || []).map(adaptOrganizationMember) }
  },
  weeklyRevenue: async (orgUuid) => {
    const weeklyRevenueRes: any = await moneyApi.getWeeklyRevenue(orgUuid).catch(() => ({ daily_breakdown: [] }))
    return { weeklyRevenue: (weeklyRevenueRes.daily_breakdown || []).map(adaptWeeklyRevenueDay) }
  },
  vehicleLocations: async (orgUuid) => {
    const locationsRaw = await trackingApi.getVehiclesLocations(orgUuid).catch(() => [])
    return { vehicleLocations: (locationsRaw || []).map(adaptVehicleLocation) }
  },
  aiAssistantSuggestions: async () => ({ aiAssistantSuggestions: [] }),
  bankAccounts: async (orgUuid) => {
    const bankAccountsRaw = await settingsApi.getBankAccounts(orgUuid).catch(() => [])
    return { bankAccounts: (bankAccountsRaw as BankAccountRow[]) || [] }
  },
}

const ALL_RESOURCE_KEYS = Object.keys(RESOURCE_FETCHERS) as ApiDataKey[]

async function fetchAll(orgUuid: string): Promise<ApiData> {
  const parts = await Promise.all(ALL_RESOURCE_KEYS.map(key => RESOURCE_FETCHERS[key](orgUuid)))
  return Object.assign({}, EMPTY_DATA, ...parts) as ApiData
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
//
// A listener is called with the refreshed ApiData when a *scoped* refresh
// (see refreshResources below) already has fresh data ready to hand over -
// each hook just adopts it directly, no loading flicker. It's called with
// no argument for a full invalidate, which still goes through the normal
// loading state since there's no data to hand over yet.
const _listeners = new Set<(updated?: ApiData) => void>()

/**
 * Re-fetches only the given resources and merges them into the existing
 * cache, instead of nuking and re-fetching all 11 collections. Falls back
 * to a full invalidate if there's no valid cache to merge into (e.g. the
 * org changed or nothing has loaded yet).
 */
async function refreshResources(orgUuid: string, keys: ApiDataKey[]) {
  if (!(_cache && _cacheOrgUuid === orgUuid)) {
    invalidateApiDataCache()
    _listeners.forEach(listener => listener())
    return
  }
  const uniqueKeys = Array.from(new Set(keys))
  try {
    const parts = await Promise.all(uniqueKeys.map(key => RESOURCE_FETCHERS[key](orgUuid)))
    // Re-check after the await: another refresh/invalidate may have run
    // while these requests were in flight (e.g. org switched, or a manual
    // "Refresh" was clicked), in which case this stale merge should be
    // dropped rather than clobbering newer data.
    if (!(_cache && _cacheOrgUuid === orgUuid)) return
    _cache = Object.assign({}, _cache, ...parts)
    _listeners.forEach(listener => listener(_cache!))
  } catch {
    invalidateApiDataCache()
    _listeners.forEach(listener => listener())
  }
}

/**
 * Tells every mounted useApiData() to refresh now.
 * - No args: full invalidate + refetch of all 11 collections (used by the
 *   manual "Refresh" button, where the intent is genuinely "reload
 *   everything").
 * - With `keys`: merges just those resources into the existing cache. Use
 *   this whenever the caller knows exactly what changed (a mutation, a
 *   targeted websocket event) - it avoids the full 11-request fetch and
 *   the page-wide loading flicker that comes with it.
 */
export function notifyDataChanged(keys?: ApiDataKey[]) {
  const orgUuid = getOrgUuid()
  if (keys && keys.length && orgUuid) {
    refreshResources(orgUuid, keys)
    return
  }
  invalidateApiDataCache()
  _listeners.forEach(listener => listener())
}

export interface UseApiDataResult {
  data: ApiData
  loading: boolean
  error: string | null
  /** Pass specific keys (e.g. `['drivers']`) when the caller knows exactly
   *  what changed, to avoid re-fetching all 11 collections and the
   *  page-wide loading flicker that comes with a full refetch. Omit for a
   *  full reload. */
  refetch: (keys?: ApiDataKey[]) => void
}

export function useApiData(): UseApiDataResult {
  const orgUuid = getOrgUuid()
  const [data, setData] = useState<ApiData>(_cache && _cacheOrgUuid === orgUuid ? _cache : EMPTY_DATA)
  const [loading, setLoading] = useState<boolean>(!(orgUuid && _cache && _cacheOrgUuid === orgUuid))
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const listener = (updated?: ApiData) => {
      if (updated) {
        // Scoped refresh: fresh data is already in hand, adopt it directly
        // instead of routing through the loading-state effect below.
        setData(updated)
        return
      }
      setRefetchToken(t => t + 1)
    }
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

  const refetch = useCallback((keys?: ApiDataKey[]) => {
    const currentOrgUuid = getOrgUuid()
    if (keys && keys.length && currentOrgUuid && _cache && _cacheOrgUuid === currentOrgUuid) {
      refreshResources(currentOrgUuid, keys)
      return
    }
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

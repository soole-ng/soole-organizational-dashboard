/**
 * API client for map.soole.ng (Soole staff only).
 *
 * Its own storage keys, so a staff session and a company session in the same
 * browser never overwrite each other - the company dashboard keeps
 * `auth_token`, this keeps `ops_token`.
 */
import { API_BASE_URL } from '../api/client'

const TOKEN = 'ops_token'
const REFRESH = 'ops_refresh_token'
const STAFF = 'ops_staff'

export type Point = { latitude: number; longitude: number }

export type Staff = { name: string | null; email: string | null; is_superuser: boolean }

export type Person = { uuid: string | null; name: string | null; phone: string | null; photo: string | null }

export type Vehicle = { plate: string | null; name: string | null; color: string | null }

export type LiveTrip = {
  trip_uuid: string
  kind: 'company' | 'independent'
  company: string | null
  driver: Person
  vehicle: Vehicle
  origin: string | null
  destination: string | null
  started_at: string | null
  position: Point | null
  last_seen_at: string | null
  speed_kmh: number | null
  eta: string | null
  minutes_left: number | null
  passengers: { waiting: number; on_board: number; dropped_off: number }
  flags: { sos: boolean; no_gps: boolean }
}

export type PlaceSeen = Point & { recorded_at: string; source: 'passenger_phone' | 'vehicle' }

export type TripPassenger = {
  name: string | null
  phone: string | null
  photo: string | null
  seats: number | null
  status: 'waiting' | 'on_board' | 'dropped_off' | 'cancelled'
  payment: 'not_paid' | 'held' | 'first_share_released' | 'fully_released' | 'refunded' | 'cancelled'
  requested_pickup: { point: Point | null; address: string | null }
  requested_dropoff: { point: Point | null; address: string | null }
  picked_up_at: string | null
  actual_pickup: PlaceSeen | null
  dropped_off_at: string | null
  actual_dropoff: PlaceSeen | null
  dropoff_distance_from_requested_km: number | null
  dropoff_far_from_requested: boolean
  reported_non_travel: boolean
}

export type TripDetail = {
  trip_uuid: string
  kind: 'company' | 'independent'
  company: string | null
  status: string
  driver: Person
  vehicle: Vehicle
  origin: string | null
  destination: string | null
  origin_point: Point | null
  destination_point: Point | null
  departure_date: string | null
  started_at: string | null
  ended_at: string | null
  position: Point | null
  last_seen_at: string | null
  eta: string | null
  minutes_left: number | null
  distance_left_km: number | null
  speed_kmh: number | null
  recent_average_speed_kmh: number | null
  trip_average_speed_kmh: number | null
  distance_travelled_km: number | null
  end_trip_available_at: string | null
  flags: { sos: boolean; no_gps: boolean }
  passengers: TripPassenger[]
}

export type RecentTrip = {
  trip_uuid: string
  kind: 'company' | 'independent'
  company: string | null
  status: string
  driver: Person
  vehicle: Vehicle
  origin: string | null
  destination: string | null
  started_at: string | null
  ended_at: string | null
  has_unconfirmed_passengers: boolean
}

export type TrailPoint = Point & { at: string }

export class OpsError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const opsSession = {
  isSignedIn: () => !!localStorage.getItem(TOKEN),
  staff: (): Staff | null => {
    try {
      return JSON.parse(localStorage.getItem(STAFF) || 'null')
    } catch {
      return null
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN)
    localStorage.removeItem(REFRESH)
    localStorage.removeItem(STAFF)
  },
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    return body?.detail || body?.message || 'Something went wrong. Try again.'
  } catch {
    return 'Something went wrong. Try again.'
  }
}

async function refresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH)
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE_URL}/accounts/login/refresh-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const body = await res.json()
    const access = body?.data?.access_token
    if (!access) return false
    localStorage.setItem(TOKEN, access)
    const nextRefresh = body?.data?.refresh_token?.token ?? body?.data?.refresh_token
    if (typeof nextRefresh === 'string') localStorage.setItem(REFRESH, nextRefresh)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = localStorage.getItem(TOKEN)
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/ops${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    })
  } catch {
    throw new OpsError(0, 'No connection to Soole. Check the internet and try again.')
  }
  if (res.status === 401 && !retried && path !== '/login') {
    if (await refresh()) return request<T>(path, init, true)
    opsSession.clear()
    window.location.assign('/login')
  }
  if (!res.ok) throw new OpsError(res.status, await readError(res))
  return res.json()
}

export const opsApi = {
  async login(identifier: string, password: string): Promise<Staff> {
    const body = await request<{
      access_token: string
      refresh_token: { token: string } | string
      staff: Staff
    }>('/login', { method: 'POST', body: JSON.stringify({ identifier, password }) })
    localStorage.setItem(TOKEN, body.access_token)
    const r = typeof body.refresh_token === 'string' ? body.refresh_token : body.refresh_token?.token
    if (r) localStorage.setItem(REFRESH, r)
    localStorage.setItem(STAFF, JSON.stringify(body.staff))
    return body.staff
  },

  liveTrips(params: { kind?: string; q?: string }) {
    const qs = new URLSearchParams()
    if (params.kind && params.kind !== 'all') qs.set('kind', params.kind)
    if (params.q) qs.set('q', params.q)
    return request<LiveTrip[]>(`/live/trips?${qs}`)
  },

  recentTrips(params: { kind?: string; q?: string; days?: number }) {
    const qs = new URLSearchParams()
    if (params.kind && params.kind !== 'all') qs.set('kind', params.kind)
    if (params.q) qs.set('q', params.q)
    qs.set('days', String(params.days ?? 7))
    return request<RecentTrip[]>(`/trips/recent?${qs}`)
  },

  trip: (uuid: string) => request<TripDetail>(`/trips/${uuid}`),
  trail: (uuid: string) => request<TrailPoint[]>(`/trips/${uuid}/trail`),
}

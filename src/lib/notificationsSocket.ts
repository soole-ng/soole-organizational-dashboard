/**
 * Live client for the backend's notifications websocket
 * (notifications/consumers.py, wss://<host>/ws/notifications/?token=<jwt>).
 *
 * Every event pushed here means "something this dashboard shows may now be
 * stale" - invitations, members, vehicle verification, trips, etc. all
 * change as a side effect of a notification firing. Rather than teach every
 * screen its own subscription, this just calls notifyDataChanged() so the
 * shared useApiData cache refreshes everywhere it's mounted, the same way a
 * local mutation already does. The payload doesn't say which resource
 * changed, so this can't scope the refresh to a specific collection like
 * a known mutation can - it stays a full refetch of all 11 collections.
 * It's debounced below so a burst of notifications (e.g. several trips
 * booked back-to-back) collapses into one refetch instead of one per event.
 */
import { notifyDataChanged } from './useApiData'

const NOTIFY_DEBOUNCE_MS = 500
let notifyTimer: ReturnType<typeof setTimeout> | null = null
function scheduleDataRefresh() {
  if (notifyTimer) return
  notifyTimer = setTimeout(() => {
    notifyTimer = null
    notifyDataChanged()
  }, NOTIFY_DEBOUNCE_MS)
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://soole-backend-8cku.onrender.com/api'

function wsUrl(token: string): string {
  const httpBase = API_BASE_URL.replace(/\/api\/?$/, '')
  const wsBase = httpBase.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
  return `${wsBase}/ws/notifications/?token=${encodeURIComponent(token)}`
}

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
const MAX_RECONNECT_DELAY_MS = 30000
let onNotificationCallback: ((payload: any) => void) | null = null
let stopped = true

function connect() {
  if (stopped) return
  const token = localStorage.getItem('auth_token')
  if (!token) return

  socket = new WebSocket(wsUrl(token))

  socket.onopen = () => {
    reconnectDelay = 1000
  }

  socket.onmessage = event => {
    let payload: any
    try {
      payload = JSON.parse(event.data)
    } catch {
      return
    }
    if (payload?.type !== 'notification') return
    scheduleDataRefresh()
    onNotificationCallback?.(payload)
  }

  socket.onclose = () => {
    socket = null
    if (stopped) return
    reconnectTimer = setTimeout(connect, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
  }

  socket.onerror = () => {
    socket?.close()
  }
}

/** Call once (e.g. from AppShell) after login/org-select to start the live connection. */
export function startNotificationsSocket(onNotification?: (payload: any) => void) {
  onNotificationCallback = onNotification ?? null
  stopped = false
  if (socket || reconnectTimer) return
  connect()
}

export function stopNotificationsSocket() {
  stopped = true
  onNotificationCallback = null
  if (notifyTimer) {
    clearTimeout(notifyTimer)
    notifyTimer = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  socket?.close()
  socket = null
}

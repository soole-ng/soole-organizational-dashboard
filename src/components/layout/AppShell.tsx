/**
 * AppShell — main layout wrapper
 * Manages notification drawer state globally.
 * ≤ 400 lines
 */
import { Outlet, useLocation } from 'react-router-dom'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useOrg } from '../../lib/OrgContext'
import { NotificationDrawer, type Notification } from './NotificationDrawer'
import { TourGuide } from './TourGuide'
import { ProfileCompletionModal } from '../auth/ProfileCompletionModal'
import { AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationsApi } from '../../api/client'
import { startNotificationsSocket, stopNotificationsSocket } from '../../lib/notificationsSocket'

// Client-only synthetic notifications (e.g. TripDetailPage's live speed-
// violation alerts, id `speed-${plate}-${Date.now()}`) get pushed into
// this same notifications list but were never persisted on the backend -
// sending their id to dismiss/markRead would 404. Real notification ids
// are always backend UUIDs, so a UUID-format check reliably tells them apart.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isBackendNotificationId = (id: string) => UUID_RE.test(id)

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

/** Returns a live countdown string (updates every minute) for the 48hr review window. */
function usePendingCountdown(): string {
  const getLabel = () => {
    const raw = localStorage.getItem('soole_verification_submitted_at')
    if (!raw) return 'within 48 hours'
    const submittedAt = parseInt(raw, 10)
    if (isNaN(submittedAt)) return 'within 48 hours'
    const remaining = submittedAt + FORTY_EIGHT_HOURS_MS - Date.now()
    if (remaining <= 0) return 'shortly'
    const totalMins = Math.floor(remaining / 60000)
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    if (hours > 0 && mins > 0) return `in ${hours}h ${mins}m`
    if (hours > 0) return `in ${hours}h`
    return `in ${mins}m`
  }
  const [label, setLabel] = useState(getLabel)
  useEffect(() => {
    const id = setInterval(() => setLabel(getLabel()), 60_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return label
}

function adaptNotification(raw: any): Notification {
  return {
    id: raw.uuid,
    type: (['warning', 'danger', 'info', 'success'].includes(raw.type) ? raw.type : 'info') as Notification['type'],
    title: raw.title,
    message: raw.message,
    read: !!raw.read,
    createdAt: raw.created_at,
    action: raw.action_label && raw.action_href ? { label: raw.action_label, href: raw.action_href } : undefined,
  }
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  // Was a new object literal on every AppShell render (including the 60s
  // countdown tick and 30s notification poll) - every useOutletContext()
  // consumer (HomePage, TripDetailPage, ...) re-rendered on a timer even
  // when neither notifications nor the page itself actually changed.
  const outletContext = useMemo(
    () => ({ notifications, setNotifications }),
    [notifications],
  )
  const [showProfileModal, setShowProfileModal] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const { org, orgUuid } = useOrg()
  const pendingCountdown = usePendingCountdown()

  useEffect(() => {
    if (!orgUuid) return
    let cancelled = false

    const load = () => {
      notificationsApi.getNotifications(orgUuid)
        .then((res: any) => {
          if (!cancelled) setNotifications((res.notifications || []).map(adaptNotification))
        })
        .catch(() => {})
    }

    load()
    // The websocket below covers instant updates; this interval stays as
    // a fallback for the connection being down (or the notification's
    // in-app channel being disabled for this recipient - the websocket
    // only fires alongside a Notification row, same as the poll).
    const interval = setInterval(load, 30000)

    // Live push: the moment a server-side event creates a Notification
    // for this user, refetch the notification list immediately instead
    // of waiting up to 30s, and refresh every other open screen's stale
    // data (invitations, members, verification stats, trips, ...) via
    // notifyDataChanged() inside the socket client.
    startNotificationsSocket(load)

    return () => {
      cancelled = true
      clearInterval(interval)
      stopNotificationsSocket()
    }
  }, [orgUuid])

  // Reset scroll position on page/route changes (essential for iOS PWA smoothness)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
  }, [pathname])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (orgUuid && isBackendNotificationId(id)) notificationsApi.dismiss(orgUuid, id).catch(() => {})
  }, [orgUuid])

  const handleMarkAllRead = useCallback(() => {
    if (!orgUuid) return
    // API calls fire here, outside the setState updater - a functional
    // updater can run more than once per commit (React 18 StrictMode
    // double-invoke, concurrent-render replay), which would have fired
    // duplicate markRead requests for the same notifications.
    notifications.filter(n => !n.read && isBackendNotificationId(n.id)).forEach(n => {
      notificationsApi.markRead(orgUuid, n.id).catch(() => {})
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [orgUuid, notifications])

  const handleMarkRead = useCallback((id: string) => {
    if (!orgUuid) return
    if (isBackendNotificationId(id)) notificationsApi.markRead(orgUuid, id).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [orgUuid])

  const handleClearAll = useCallback(() => {
    setNotifications([])
    if (orgUuid) notificationsApi.clearAll(orgUuid).catch(() => {})
  }, [orgUuid])

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true)
  }, [])

  useEffect(() => {
    const handleOpen = () => setDrawerOpen(true)
    const handleProfile = () => setShowProfileModal(true)
    const handleToast = (e: Event) => {
      const msg = (e as CustomEvent).detail
      toast.error(msg)
    }
    
    window.addEventListener('open-notifications', handleOpen)
    window.addEventListener('require-profile-completion', handleProfile)
    window.addEventListener('require-approval-toast', handleToast)
    return () => {
      window.removeEventListener('open-notifications', handleOpen)
      window.removeEventListener('require-profile-completion', handleProfile)
      window.removeEventListener('require-approval-toast', handleToast)
    }
  }, [])

  const isFullscreen = pathname === '/live-map' || pathname === '/ai'

  return (
    <div className="min-h-screen w-screen flex overflow-hidden">
      <Sidebar unreadCount={unreadCount} onOpenNotifications={handleOpenDrawer} />

      <main
        ref={mainRef}
        className={`flex-1 flex flex-col w-full lg-ml-76 ${
          isFullscreen ? 'overflow-hidden h-screen' : 'min-h-screen overflow-y-auto overflow-x-hidden'
        }`}
      >
        {isFullscreen ? (
          // Live Map: full-bleed, no padding, no max-width constraint
          <div className="flex-1 w-full overflow-hidden flex flex-col">
            {org.approvalStatus === 'incomplete' && (
              <div className="bg-secondary-500 text-white px-4 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">Your profile is incomplete. You are in read-only mode.</span>
                </div>
                <button onClick={() => setShowProfileModal(true)} className="bg-white text-secondary-500 px-3 py-1 rounded-lg text-xs font-black shadow-sm">Complete Profile Now</button>
              </div>
            )}
            {org.approvalStatus === 'pending' && (
              <div className="bg-primary-500 text-white px-4 py-3 flex items-center gap-2 z-50">
                <Clock className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold">
                  Your account is under review. We'll get back to you {pendingCountdown} — explore the dashboard in read-only mode.
                </span>
              </div>
            )}
            <Outlet context={outletContext} />
          </div>
        ) : (
          // All other pages: 5% padding left/right on desktop to give 20% more horizontal screen space
          <div className="flex-1 pb-24 lg:pb-0 w-full lg:px-[5%] flex flex-col">
            {org.approvalStatus === 'incomplete' && (
              <div className="bg-secondary-500 text-white px-4 py-3 flex items-center justify-between mb-4 lg:mt-4 rounded-xl z-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">Your profile is incomplete. You are in read-only mode.</span>
                </div>
                <button onClick={() => setShowProfileModal(true)} className="bg-white text-secondary-500 px-3 py-1 rounded-lg text-xs font-black shadow-sm shrink-0">Complete Profile Now</button>
              </div>
            )}
            {org.approvalStatus === 'pending' && (
              <div className="bg-primary-500 text-white px-4 py-3 flex items-center gap-2 mb-4 lg:mt-4 rounded-xl z-50">
                <Clock className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold">
                  Your account is under review. We'll get back to you {pendingCountdown} — explore the dashboard in read-only mode.
                </span>
              </div>
            )}
            <Outlet context={outletContext} />
          </div>
        )}
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav unreadCount={unreadCount} onOpenNotifications={handleOpenDrawer} />

      {/* Notification drawer (shared across mobile & desktop) */}
      <NotificationDrawer
        open={drawerOpen}
        notifications={notifications}
        onClose={() => setDrawerOpen(false)}
        onDismiss={handleDismiss}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
        onClearAll={handleClearAll}
      />
      <TourGuide />
      {showProfileModal && <ProfileCompletionModal onClose={() => setShowProfileModal(false)} />}
    </div>
  )
}

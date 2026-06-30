/**
 * AppShell — main layout wrapper
 * Manages notification drawer state globally.
 * ≤ 400 lines
 */
import { Outlet, useLocation } from 'react-router-dom'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useOrg } from '../../lib/OrgContext'
import { NotificationDrawer, type Notification } from './NotificationDrawer'
import { TourGuide } from './TourGuide'
import { ProfileCompletionModal } from '../auth/ProfileCompletionModal'
import { AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

// Mock notification data — will be replaced by API calls
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1-speed',
    type: 'warning',
    title: 'Speed limit exceeded — LSD 234 KJ',
    message: 'Akin Bello is estimated to be travelling at ~115 km/h, exceeding the 100 km/h fleet limit on the Lagos → Ibadan route.',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    action: { label: 'View on map', href: '/live-map' },
  },
  {
    id: 'n2',
    type: 'danger',
    title: 'Document pending — Road Worthiness',
    message: 'KJA 008 MN road worthiness certificate is under review. Vehicle cannot be used for new trips until approved.',
    read: false,
    createdAt: '2026-06-25T12:00:00Z',
    action: { label: 'View documents', href: '/fleet/vehicles' },
  },
  {
    id: 'n3',
    type: 'warning',
    title: 'Driver Ibrahim Musa — invite pending',
    message: 'Ibrahim has not yet completed his sign-up. Resend the invite if needed.',
    read: true,
    createdAt: '2026-06-20T08:00:00Z',
    action: { label: 'View driver', href: '/fleet/drivers' },
  },
]

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const { org } = useOrg()

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
  }, [])

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const handleClearAll = useCallback(() => {
    setNotifications([])
  }, [])

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
                <Clock className="w-5 h-5" />
                <span className="text-sm font-bold">Your account is pending approval. You can explore the dashboard in read-only mode.</span>
              </div>
            )}
            <Outlet context={{ notifications, setNotifications }} />
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
                <Clock className="w-5 h-5" />
                <span className="text-sm font-bold">Your account is pending approval. You can explore the dashboard in read-only mode.</span>
              </div>
            )}
            <Outlet context={{ notifications, setNotifications }} />
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

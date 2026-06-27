/**
 * AppShell — main layout wrapper
 * Manages notification drawer state globally.
 * ≤ 400 lines
 */
import { Outlet, useLocation } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { OrgProvider } from '../../lib/OrgContext'
import { NotificationDrawer, type Notification } from './NotificationDrawer'

// Mock notification data — will be replaced by API calls
const MOCK_NOTIFICATIONS: Notification[] = [
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

  const { pathname } = useLocation()
  const isFullscreen = pathname === '/live-map'

  return (
    <OrgProvider>
    <div className="min-h-screen w-screen flex overflow-hidden">
      <Sidebar unreadCount={unreadCount} onOpenNotifications={handleOpenDrawer} />

      <main className={`flex-1 lg:ml-64 flex flex-col w-full ${
        isFullscreen ? 'overflow-hidden h-screen' : 'min-h-screen overflow-y-auto overflow-x-hidden'
      }`}>
        {/* Mobile TopBar — hidden on desktop */}
        <TopBar
          unreadCount={unreadCount}
          onOpenNotifications={handleOpenDrawer}
        />

        {isFullscreen ? (
          // Live Map: full-bleed, no padding, no max-width constraint
          <div className="flex-1 w-full overflow-hidden">
            <Outlet context={{ notifications, setNotifications }} />
          </div>
        ) : (
          // All other pages: 20% padding left/right on desktop, full width within that
          <div className="flex-1 pb-24 lg:pb-0 w-full lg:px-[20%]">
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
    </div>
    </OrgProvider>
  )
}

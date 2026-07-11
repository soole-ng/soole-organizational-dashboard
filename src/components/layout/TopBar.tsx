/**
 * TopBar — mobile sticky header
 * Shows Soole branding, current page, notification bell with badge, PWA install prompt.
 * ≤ 400 lines
 */
import { Power, ChevronLeft, Bell, Sparkles } from 'lucide-react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import { useOrg } from '../../lib/OrgContext'
import { authApi } from '../../api/client'
import toast from 'react-hot-toast'

interface TopBarProps {
  title?: string
  backHref?: string
  actions?: React.ReactNode
  transparent?: boolean
  unreadCount?: number
  onOpenNotifications?: () => void
}

const pageTitles: Record<string, string> = {
  '/':               'Home',
  '/trips':          'Trips',
  '/trips/new':      'New Trip',
  '/fleet':          'Fleet',
  '/fleet/drivers':  'Drivers',
  '/fleet/vehicles': 'Vehicles',
  '/live-map':       'Live Map',
  '/admin':          'Admin',
  '/money':          'Money',
  '/reports':        'Reports',
  '/settings':       'Settings',
  '/help':           'Help',
}

export function TopBar({
  title,
  backHref,
  actions,
  transparent,
  unreadCount,
  onOpenNotifications,
}: TopBarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { org } = useOrg()
  const resolvedTitle = title ?? pageTitles[pathname] ?? 'Soole'
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)

  // Retrieve notifications from outlet context if props aren't explicitly passed
  let outletContext: any = null
  try {
    outletContext = useOutletContext()
  } catch (e) {
    // Ignore error if not rendered in Router context (e.g. testing)
  }
  
  const contextNotifications = outletContext?.notifications || []
  const resolvedUnreadCount = unreadCount ?? contextNotifications.filter((n: any) => !n.read).length

  // Capture the PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  const handleOpenAlerts = () => {
    if (onOpenNotifications) {
      onOpenNotifications()
    } else {
      window.dispatchEvent(new CustomEvent('open-notifications'))
    }
  }

  const handleTriggerTour = () => {
    window.dispatchEvent(new CustomEvent('start-soole-tour'))
  }

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex items-center h-14 px-4 gap-3 lg:hidden safe-top',
        transparent ? 'bg-transparent' : 'bg-white border-b border-neutral-50',
      )}
    >
      {backHref ? (
        <button
          onClick={() => navigate(backHref)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-50 -ml-1 active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-primary-500" />
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Soole icon mark */}
          <img
            src="/soole-icon.png"
            alt="Soole"
            className="w-8 h-8 rounded-xl object-contain"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {backHref ? (
          <h1 className="text-base font-semibold text-primary-500 truncate">{resolvedTitle}</h1>
        ) : (
          <>
            <h1 className="text-sm font-bold text-primary-500 leading-tight truncate">{org.name}</h1>
            <p className="text-[10px] text-neutral-200 leading-tight">{resolvedTitle}</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* PWA Install button — only shows when installable */}
        {!installed && installPrompt && (
          <button
            onClick={handleInstall}
            className="text-[10px] font-semibold text-accent-500 bg-accent-50 border border-accent-200 rounded-full px-2.5 py-1 hover:bg-accent-100 transition-colors"
            aria-label="Install app"
          >
            Install
          </button>
        )}

        {/* Alerts (Bell) Button */}
        <button
          onClick={handleOpenAlerts}
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-50 active:scale-95 transition-all text-primary-500"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          {resolvedUnreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[13px] h-[13px] bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 border border-white">
              {resolvedUnreadCount > 9 ? '9+' : resolvedUnreadCount}
            </span>
          )}
        </button>

        {/* Tour (Sparkles) Button */}
        <button
          onClick={handleTriggerTour}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-50 active:scale-95 transition-all text-accent-400"
          aria-label="Start Website Tour"
        >
          <Sparkles className="w-5 h-5" strokeWidth={1.8} />
        </button>

        {/* Sign Out Button */}
        <button
          onClick={async () => {
            const confirmLogout = window.confirm('Are you sure you want to sign out?')
            if (confirmLogout) {
              await authApi.logout()
              toast.success('Signed out successfully')
              navigate('/login')
            }
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-50 active:scale-95 transition-all text-danger-300 animate-pulse-subtle"
          aria-label="Sign out"
        >
          <Power className="w-5 h-5" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}

export function DesktopPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="hidden lg:flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-500">{title}</h1>
        {subtitle && (
          <p className="text-sm text-neutral-200 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

/**
 * BottomNav — mobile bottom tab bar
 * 5 tabs: Home | Trips | Fleet | Money | AI
 * Notification badge on bell icon in TopBar (not duplicated here).
 * ≤ 400 lines
 */
import { NavLink } from 'react-router-dom'
import { Home, Route, Users, Wallet, Sparkles, Bell } from 'lucide-react'
import { clsx } from 'clsx'

import { useOrg } from '../../lib/OrgContext'

interface BottomNavProps {
  unreadCount?: number
  onOpenNotifications?: () => void
}

const tabs = [
  { to: '/',      label: 'Home',   icon: Home },
  { to: '/trips', label: 'Trips',  icon: Route },
  { to: '/fleet', label: 'Fleet',  icon: Users },
  { to: '/money', label: 'Money',  icon: Wallet },
]

export function BottomNav({ unreadCount = 0, onOpenNotifications }: BottomNavProps) {
  const { org } = useOrg()
  const userRole = org.role ? org.role.toLowerCase() : 'owner'

  const filteredTabs = tabs.filter(tab => {
    if (userRole === 'finance') {
      return ['/money'].includes(tab.to)
    } else if (userRole === 'dispatcher') {
      return tab.to !== '/money'
    }
    return true
  })

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-50 bottom-nav lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex">
        {filteredTabs.map(({ to, label, icon: Icon, accent }: any) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-medium transition-colors min-w-0',
                accent
                  ? isActive ? 'text-accent-500' : 'text-neutral-200'
                  : isActive ? 'text-primary-500' : 'text-neutral-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'w-11 h-7 flex items-center justify-center rounded-full transition-colors',
                    accent
                      ? isActive && 'bg-accent-100'
                      : isActive && 'bg-primary-75',
                  )}
                >
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>
                <span className="truncate w-full text-center">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Tour tab — triggers the tour guide */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('start-soole-tour'))
          }}
          className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-medium text-neutral-200 transition-colors min-w-0"
          aria-label="Start Website Tour"
        >
          <span className="w-11 h-7 flex items-center justify-center rounded-full">
            <Sparkles className="w-5 h-5 text-accent-400" strokeWidth={1.8} />
          </span>
          <span className="truncate w-full text-center">Tour</span>
        </button>

        {/* Bell tab — not a nav route, opens drawer */}
        <button
          onClick={onOpenNotifications}
          className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-medium text-neutral-200 transition-colors min-w-0"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        >
          <span className="relative w-11 h-7 flex items-center justify-center rounded-full">
            <Bell className="w-5 h-5" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1.5 min-w-[13px] h-[13px] bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="truncate w-full text-center">Alerts</span>
        </button>
      </div>
    </nav>
  )
}

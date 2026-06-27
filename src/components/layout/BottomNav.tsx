/**
 * BottomNav — mobile bottom tab bar
 * 5 tabs: Home | Trips | Fleet | Money | AI
 * Notification badge on bell icon in TopBar (not duplicated here).
 * ≤ 400 lines
 */
import { NavLink } from 'react-router-dom'
import { Home, Route, Users, Wallet, Bell, Map, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'

import { useOrg } from '../../lib/OrgContext'

interface BottomNavProps {
  unreadCount?: number
  onOpenNotifications?: () => void
}

const tabs = [
  { to: '/',      label: 'Home',   icon: Home },
  { to: '/trips', label: 'Trips',  icon: Route },
  { to: '/live-map', label: 'Map',  icon: Map },
  { to: '/fleet', label: 'Fleet',  icon: Users },
  { to: '/money', label: 'Money',  icon: Wallet },
  { to: '/ai',    label: 'AI',     icon: MessageSquare },
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
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-50 bottom-nav lg:hidden shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-16">
        {filteredTabs.map(({ to, label, icon: Icon, accent }: any) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-colors min-w-0',
                accent
                  ? isActive ? 'text-accent-500' : 'text-neutral-200'
                  : isActive ? 'text-primary-500 font-bold' : 'text-neutral-200 hover:text-neutral-300',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'w-12 h-8 flex items-center justify-center rounded-full transition-colors',
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
                <span className="truncate w-full text-center text-[10px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/**
 * Sidebar — Desktop left nav
 * • Soole icon mark (Logo 2 / soole-icon.png) at the top
 * • Organization's own logo + name displayed prominently
 * • Sign-out + notification bell moved to the top header strip
 * • All brand colours only (#042011, #254832, #1D754C, #095B4F, #A7C957, #A7C957)
 * • "Soole Organization Dashboard" branding hidden (shown in Settings/Help instead)
 * ≤ 400 lines
 */
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Route, Map, Users, Car, Wallet, BarChart2,
  Settings, HelpCircle, Power, Sparkles, Bell,
  ChevronRight, Upload,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { useOrg, orgInitials } from '../../lib/OrgContext'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>
  accent?: boolean
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Home', icon: Home },
      { to: '/trips', label: 'Trips', icon: Route },
      { to: '/live-map', label: 'Live Map', icon: Map },
      { to: '/ai', label: 'AI Assistant', icon: Sparkles, accent: true },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { to: '/fleet/drivers', label: 'Drivers', icon: Users },
      { to: '/fleet/vehicles', label: 'Vehicles', icon: Car },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/money', label: 'Money', icon: Wallet },
      { to: '/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/help', label: 'Help', icon: HelpCircle },
    ],
  },
]

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 w-full group',
          item.accent
            ? isActive
              ? 'bg-accent-100 text-accent-400'
              : 'text-gray-800 hover:bg-accent-50 hover:text-accent-300'
            : isActive
              ? 'bg-primary-75 text-primary-500 shadow-sm'
              : 'text-gray-800 hover:bg-primary-75 hover:text-primary-500',
        )
      }
    >
      <item.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.8} />
      <span className="flex-1 truncate">{item.label}</span>
    </NavLink>
  )
}

interface SidebarProps {
  unreadCount?: number
  onOpenNotifications?: () => void
}

export function Sidebar({ unreadCount = 0, onOpenNotifications }: SidebarProps) {
  const navigate = useNavigate()
  const { org, updateOrg } = useOrg()
  const [signingOut, setSigningOut] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleSignOut = () => {
    setSigningOut(true)
    setTimeout(() => {
      setSigningOut(false)
      toast.success('Signed out successfully')
      navigate('/login')
    }, 600)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      updateOrg({ logoUrl: reader.result as string })
      toast.success('Organization logo updated!')
    }
    reader.readAsDataURL(file)
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-50 min-h-screen fixed left-0 top-0 z-40">

      {/* ── Top header strip: Soole icon + Actions ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-500 border-b border-primary-400">
        {/* Soole icon mark */}
        <div className="flex items-center gap-2">
          <img
            src="/soole-icon.png"
            alt="Soole"
            className="w-8 h-8 rounded-xl object-contain bg-primary-400 p-0.5"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="text-white font-bold text-sm tracking-tight">Soole</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-4 h-4 text-white/80" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={clsx(
              'w-8 h-8 flex items-center justify-center rounded-xl transition-all',
              signingOut
                ? 'opacity-50'
                : 'hover:bg-danger-300/20 group',
            )}
            title="Sign out"
            aria-label="Sign out"
          >
            {signingOut
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Power className="w-4 h-4 text-white/70 group-hover:text-danger-200 transition-colors" />
            }
          </button>
        </div>
      </div>

      {/* ── Organization Profile ── */}
      <div className="px-4 py-4 border-b border-neutral-50">
        <div className="flex items-center gap-3">
          {/* Org logo — clickable to upload */}
          <div className="relative flex-shrink-0 group">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              aria-label="Upload organization logo"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="relative w-12 h-12 rounded-2xl overflow-hidden bg-primary-75 border-2 border-primary-100 flex items-center justify-center group-hover:border-accent-300 transition-colors"
              title="Click to change your organization logo"
            >
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-primary-400 tracking-tight">
                  {orgInitials(org.name)}
                </span>
              )}
              {/* Upload overlay */}
              <div className="absolute inset-0 bg-primary-500/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary-500 truncate leading-tight">{org.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-300 animate-pulse" />
              <p className="text-[11px] text-secondary-300 font-medium">{org.role} · Active</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-primary-75 text-neutral-200 hover:text-primary-400 transition-colors flex-shrink-0"
            title="Organization settings"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-bold text-neutral-200 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Powered by footer ── */}
      <div className="px-4 py-3 border-t border-neutral-50 flex items-center justify-center opacity-40">
        <p className="text-[10px] text-neutral-300 font-medium">Powered by Mobiliti</p>
      </div>
    </aside>
  )
}

import { Link } from 'react-router-dom'
import { Bus, Map, Plus, UserPlus } from 'lucide-react'
import { useOrg } from '../../../lib/OrgContext'

const ACTIONS = [
  { to: '/trips/new', label: 'New trip', icon: Plus, guarded: true },
  { to: '/live-map', label: 'Live map', icon: Map, guarded: false },
  { to: '/fleet/drivers', label: 'Drivers', icon: UserPlus, guarded: false },
  { to: '/fleet/vehicles/new', label: 'Add vehicle', icon: Bus, guarded: true },
]

/**
 * The four things a dispatcher does most, one tap away. Fills the space
 * beside the trip list on a computer, and sits under the summary on a
 * phone (2026-10-15: use the white space; colours unchanged).
 */
export function QuickActions() {
  const { guardAction } = useOrg()
  return (
    <div className="card p-4">
      <p className="text-sm font-bold text-primary-500 mb-3">Quick actions</p>
      <div className="grid grid-cols-4 lg:grid-cols-2 gap-3">
        {ACTIONS.map(({ to, label, icon: Icon, guarded }) => (
          <Link
            key={to}
            to={to}
            onClick={guarded ? (guardAction as any) : undefined}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary-50 hover:bg-primary-75 transition-colors py-3 lg:py-5 text-center"
          >
            <span className="w-10 h-10 rounded-xl bg-white grid place-items-center text-primary-500">
              <Icon className="w-5 h-5" />
            </span>
            <span className="text-[11px] lg:text-xs font-semibold text-primary-500">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

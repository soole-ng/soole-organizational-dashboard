import { TrendingUp, Bus, Users, Wallet } from 'lucide-react'
import { MoneyDisplay } from '../../../components/ui/MoneyDisplay'
import { formatMoney } from '../../../lib/formatters'

const stats = [
  { label: 'Trips Today',    value: '3',            icon: Bus,        color: 'text-secondary-300' },
  { label: 'Bookings Today', value: '34',            icon: Users,      color: 'text-teal-300' },
  { label: "Today's Revenue", value: 'NGN 269,000', icon: TrendingUp, color: 'text-accent-300' },
  { label: 'Wallet Balance', value: 'NGN 47,300',   icon: Wallet,     color: 'text-accent-200' },
]

import { useOrg } from '../../../lib/OrgContext'

export function HeroBand() {
  const { org } = useOrg()

  return (
    <div className="bg-primary-500 text-white px-4 py-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-primary-200 text-xs font-medium">Good morning,</p>
          <h2 className="text-lg font-bold leading-tight">{org.name}</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary-500 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 bg-accent-300 rounded-full animate-pulse" />
          <span className="text-xs text-accent-200 font-medium">3 active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-primary-400 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary-300 flex items-center justify-center">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <p className="text-[11px] text-primary-100 font-medium leading-tight">{label}</p>
            </div>
            <p className="text-base font-bold stat-number text-white truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 bg-primary-400 rounded-xl px-3.5 py-2.5">
        <TrendingUp className="w-3.5 h-3.5 text-accent-300 flex-shrink-0" />
        <p className="text-xs text-primary-100">
          <span className="text-accent-300 font-semibold">+18% </span>
          vs last week · NGN 228,300 same period
        </p>
      </div>
    </div>
  )
}

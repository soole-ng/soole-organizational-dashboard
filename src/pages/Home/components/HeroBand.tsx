import { TrendingUp, Bus, Users, Wallet, Eye, EyeOff } from 'lucide-react'
import { MoneyDisplay } from '../../../components/ui/MoneyDisplay'
import { formatMoneyCompact } from '../../../lib/formatters'
import { useOrg } from '../../../lib/OrgContext'
import { useHomeStats } from '../../../lib/useApiData'

export function HeroBand() {
  const { org, updateOrg } = useOrg()
  const isHidden = org.isBalanceHidden || false
  const { stats: homeStats } = useHomeStats()

  const stats = [
    { label: 'Trips Today',    value: `${homeStats.tripsToday}`, icon: Bus,        color: 'text-secondary-300' },
    { label: 'Bookings Today', value: `${homeStats.bookingsToday}`, icon: Users,      color: 'text-teal-300' },
    { label: "Today's Revenue", value: isHidden ? '****' : `NGN ${homeStats.revenueToday.toLocaleString()}`, icon: TrendingUp, color: 'text-accent-300' },
    { label: 'Wallet Balance', value: isHidden ? '****' : `NGN ${homeStats.walletBalance.toLocaleString()}`,   icon: Wallet,     color: 'text-accent-200' },
  ]

  return (
    <div className="bg-primary-500 text-white px-4 py-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-primary-200 text-xs font-medium">Good day,</p>
          <h2 className="text-lg font-bold leading-tight">{org.name}</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary-500 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 bg-accent-300 rounded-full animate-pulse" />
          <span className="text-xs text-accent-200 font-medium">{homeStats.activeTripsCount} active</span>
        </div>
      </div>

      <div id="tour-metrics-mobile" className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-primary-400 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary-300 flex items-center justify-center">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="flex items-center justify-between flex-1">
                <p className="text-[11px] text-primary-100 font-medium leading-tight">{label}</p>
                {label === 'Wallet Balance' && (
                  <button onClick={() => updateOrg({ isBalanceHidden: !isHidden })} className="text-primary-100 hover:text-white">
                    {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            <p className="text-base font-bold stat-number text-white truncate">{value}</p>
          </div>
        ))}
      </div>

      {homeStats.weekOverWeekPercent != null && (
        <div className="mt-3 flex items-center gap-2 bg-primary-400 rounded-xl px-3.5 py-2.5">
          <TrendingUp className="w-3.5 h-3.5 text-accent-300 flex-shrink-0" />
          <p className="text-xs text-primary-100">
            <span className="text-accent-300 font-semibold">
              {homeStats.weekOverWeekPercent >= 0 ? '+' : ''}{homeStats.weekOverWeekPercent.toFixed(0)}%{' '}
            </span>
            vs last week · {formatMoneyCompact(homeStats.previousWeekRevenue)} same period
          </p>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMoneyCompact } from '../../../lib/formatters'

export function QuickStats() {
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);

  useEffect(() => {
    fetch('/mock-data.json')
      .then(res => res.json())
      .then(data => setWeeklyRevenue(data.weeklyRevenue || []))
      .catch(console.error);
  }, []);

  return (
    <div className="px-4">
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-neutral-200 font-medium">This week</p>
            <p className="text-3xl sm:text-4xl font-black text-primary-500 stat-number">NGN 451K</p>
            <p className="text-xs text-accent-400 font-semibold mt-1">+18% vs last week</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-200 font-medium">Last week</p>
            <p className="text-xl font-bold text-neutral-200 stat-number">NGN 382K</p>
          </div>
        </div>

        {weeklyRevenue.length > 0 && (
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={weeklyRevenue} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1D754C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1D754C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#DEDBEC' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [formatMoneyCompact(v), 'Net']}
                contentStyle={{ background: '#042011', border: 'none', borderRadius: 12, fontSize: 11, color: '#fff', padding: '6px 12px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#DEDBEC', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="net" stroke="#1D754C" strokeWidth={2} fill="url(#netGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-50 text-center text-xs">
          <div>
            <p className="text-neutral-200">Trips</p>
            <p className="font-bold text-primary-500 mt-0.5">21</p>
          </div>
          <div className="border-x border-neutral-50">
            <p className="text-neutral-200">Bookings</p>
            <p className="font-bold text-accent-400 mt-0.5">187</p>
          </div>
          <div>
            <p className="text-neutral-200">Avg occupancy</p>
            <p className="font-bold text-secondary-300 mt-0.5">84%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

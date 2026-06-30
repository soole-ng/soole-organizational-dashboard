import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMoneyCompact } from '../../../lib/formatters'
import { useQuery } from '@tanstack/react-query'
import { tripsApi } from '../../../api/trips'

export function QuickStats() {
  const { data: weeklyRevenue = [] } = useQuery({
    queryKey: ['weeklyRevenue'],
    queryFn: tripsApi.getRevenue
  })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#042011] p-3 rounded-xl border border-neutral-100/20 text-xs shadow-lg">
          <p className="font-bold text-white mb-1 uppercase tracking-wider text-[10px]">Revenue Trend</p>
          <div className="flex items-center gap-4 justify-between">
            <span className="text-neutral-200">{data.day}day:</span>
            <span className="font-bold text-[#A7C957]">{formatMoneyCompact(data.net)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

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
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={weeklyRevenue} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D754C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1D754C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8aad96', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#A7C957', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="net" stroke="#1D754C" strokeWidth={2.5} fill="url(#netGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

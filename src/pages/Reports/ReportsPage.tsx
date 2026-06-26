import { BarChart2, Bus, Users, Car, TrendingUp, Navigation, Download } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useMockData } from '../../lib/useMockData'
import { formatMoneyCompact } from '../../lib/formatters'

const reportTypes = [
  { icon: Bus, label: 'Trip Report', desc: 'All trips with revenue, occupancy and status', color: 'bg-secondary-50 text-secondary-300' },
  { icon: Users, label: 'Driver Report', desc: 'Per-driver performance and earnings', color: 'bg-teal-50 text-teal-400' },
  { icon: Car, label: 'Vehicle Report', desc: 'Mileage, fuel usage and downtime', color: 'bg-accent-50 text-accent-400' },
  { icon: TrendingUp, label: 'Revenue Report', desc: 'Earnings by route, week and month', color: 'bg-success-light text-secondary-300' },
  { icon: Navigation, label: 'Route Report', desc: 'Top routes by occupancy and revenue', color: 'bg-primary-75 text-primary-400' },
]

const dateRanges = ['Today', 'This Week', 'This Month', 'Custom']

export function ReportsPage() {
  const { data, loading } = useMockData()

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <TopBar title="Reports" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 w-full">
          <div className="h-12 bg-white rounded-2xl w-48 mb-4" />
          <div className="h-48 bg-white rounded-card w-full" />
        </div>
      </div>
    )
  }

  const weeklyRevData = data.weeklyRevenue.length > 0 ? data.weeklyRevenue : [
    { day: 'Mon', gross: 45000, net: 41400 },
    { day: 'Tue', gross: 62000, net: 57040 },
    { day: 'Wed', gross: 38000, net: 34960 },
    { day: 'Thu', gross: 71000, net: 65320 },
    { day: 'Fri', gross: 88000, net: 80960 },
    { day: 'Sat', gross: 95000, net: 87400 },
    { day: 'Sun', gross: 52000, net: 47840 },
  ]

  const totalNet = weeklyRevData.reduce((a, d) => a + d.net, 0)
  const totalGross = weeklyRevData.reduce((a, d) => a + d.gross, 0)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Reports" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Reports" subtitle="Business performance at a glance" />

        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {dateRanges.map((r, i) => (
            <button
              key={r}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${i === 1
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-200 border-neutral-50'
                }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Trips', value: data.trips.length.toString() },
            { label: 'Total Gross', value: formatMoneyCompact(totalGross) },
            { label: 'Avg Occupancy', value: `${Math.round(data.trips.reduce((a, t) => a + (t.bookedSeats / t.capacity), 0) / Math.max(data.trips.length, 1) * 100)}%` },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-lg font-black text-primary-500 stat-number">{s.value}</p>
              <p className="text-[10px] text-neutral-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-neutral-200">This week's revenue</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-500 stat-number">
                NGN {totalNet.toLocaleString()}
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-secondary-300 font-semibold border border-secondary-100 rounded-full px-3 py-1.5">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyRevData} barSize={20} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A7C957" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8896b0' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [formatMoneyCompact(v), 'Net']}
                contentStyle={{ background: '#042011', border: 'none', borderRadius: 12, fontSize: 11, color: '#fff', padding: '6px 12px' }}
                cursor={{ fill: '#A7C957' }}
              />
              <Bar dataKey="net" fill="#1D754C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-50 text-center text-xs">
            <div><p className="text-neutral-200">Total Trips</p><p className="font-bold text-primary-500 mt-0.5">{data.trips.length}</p></div>
            <div className="border-x border-neutral-50"><p className="text-neutral-200">Total Gross</p><p className="font-bold text-primary-500 mt-0.5">{formatMoneyCompact(totalGross)}</p></div>
            <div><p className="text-neutral-200">Avg Occupancy</p><p className="font-bold text-secondary-300 mt-0.5">{Math.round(data.trips.reduce((a, t) => a + (t.bookedSeats / t.capacity), 0) / Math.max(data.trips.length, 1) * 100)}%</p></div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">Report Types</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {reportTypes.map(({ icon: Icon, label, desc, color }) => (
              <button key={label} className="card text-left hover:shadow-card-hover transition-shadow flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-500">{label}</p>
                  <p className="text-xs text-neutral-200 mt-0.5 leading-relaxed">{desc}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="text-[10px] text-secondary-300 font-semibold border border-secondary-100 rounded-lg px-2 py-1">PDF</button>
                  <button className="text-[10px] text-secondary-300 font-semibold border border-secondary-100 rounded-lg px-2 py-1">XLS</button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

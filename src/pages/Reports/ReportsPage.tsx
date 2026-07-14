import { useState } from 'react'
import { BarChart2, Bus, Users, Car, TrendingUp, Navigation, Download, AlertCircle } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { useOrg } from '../../lib/OrgContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApiData } from '../../lib/useApiData'
import { reportsApi } from '../../api/client'
import { formatMoneyCompact } from '../../lib/formatters'
import { downloadReportCsv, downloadReportPdf } from '../../lib/reportExport'
import toast from 'react-hot-toast'

type ReportKey = 'trip' | 'driver' | 'vehicle' | 'revenue' | 'route'

const reportTypes: { key: ReportKey; icon: any; label: string; desc: string; color: string }[] = [
  { key: 'trip', icon: Bus, label: 'Trip Report', desc: 'All trips with revenue, occupancy and status', color: 'bg-white text-secondary-300' },
  { key: 'driver', icon: Users, label: 'Driver Report', desc: 'Per-driver performance and earnings', color: 'bg-white text-teal-400' },
  { key: 'vehicle', icon: Car, label: 'Vehicle Report', desc: 'Mileage, fuel usage and downtime', color: 'bg-white text-accent-400' },
  { key: 'revenue', icon: TrendingUp, label: 'Revenue Report', desc: 'Earnings by route, week and month', color: 'bg-white text-secondary-300' },
  { key: 'route', icon: Navigation, label: 'Route Report', desc: 'Top routes by occupancy and revenue', color: 'bg-white text-primary-400' },
]

const formatDateParam = (d: Date) => d.toISOString().slice(0, 10)

export function ReportsPage() {
  const { org, orgUuid } = useOrg()
  const { data, loading } = useApiData()
  const [exportingKey, setExportingKey] = useState<string | null>(null)
  const isProfileIncomplete = org.approvalStatus === 'incomplete'
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Hoisted above the `loading` early-return below (previously declared
  // after it, with eslint-disable comments suppressing the resulting
  // rules-of-hooks violation) - calling hooks conditionally breaks on the
  // loading -> loaded transition, which is exactly when this state starts
  // to matter.
  const [selectedRange, setSelectedRange] = useState('This Week')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customDates, setCustomDates] = useState({ start: '', end: '' })

  const handleAction = () => {
    if (isProfileIncomplete) {
      setShowProfileModal(true)
      return
    }
  }

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

  const weeklyRevData = data.weeklyRevenue

  const totalNet = weeklyRevData.reduce((a, d) => a + d.net, 0)

  const dateRanges = ['Today', 'This Week', 'This Month', 'Custom']

  // Derives the actual [start, end] window the selected tab represents,
  // then filters trips by departureAt - this is what makes the tabs above
  // do something, instead of just toggling which one looks highlighted.
  const now = new Date()
  let filterStart: Date
  let filterEnd: Date
  if (selectedRange === 'Today') {
    filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  } else if (selectedRange === 'This Month') {
    filterStart = new Date(now.getFullYear(), now.getMonth(), 1)
    filterEnd = now
  } else if (selectedRange === 'Custom' && customDates.start && customDates.end) {
    filterStart = new Date(customDates.start)
    filterEnd = new Date(new Date(customDates.end).getTime() + 86400000 - 1)
  } else {
    // 'This Week', and the fallback for an unapplied Custom range
    filterStart = new Date(now.getTime() - 7 * 86400000)
    filterEnd = now
  }

  const filteredTrips = data.trips.filter(t => {
    const time = new Date(t.departureAt).getTime()
    return time >= filterStart.getTime() && time <= filterEnd.getTime()
  })
  const totalGross = filteredTrips.reduce((a, t) => a + t.grossRevenue, 0)
  const avgOccupancyPct = Math.round(
    filteredTrips.reduce((a, t) => a + (t.capacity > 0 ? t.bookedSeats / t.capacity : 0), 0) / Math.max(filteredTrips.length, 1) * 100
  )

  const handleExport = async (reportKey: ReportKey, format: 'pdf' | 'csv') => {
    if (!orgUuid) return
    setExportingKey(`${reportKey}-${format}`)
    const dateParams = { start_date: formatDateParam(filterStart), end_date: formatDateParam(filterEnd) }
    try {
      let headers: string[]
      let rows: (string | number)[][]
      let title: string

      if (reportKey === 'trip') {
        const res: any = await reportsApi.getTripsReport(orgUuid, dateParams)
        title = 'Trip Report'
        headers = ['Date', 'Route', 'Driver', 'Vehicle', 'Status', 'Distance (km)', 'Passengers', 'Capacity', 'Occupancy %', 'Revenue', 'Commission', 'Net']
        rows = res.trips.map((t: any) => [t.date, t.route, t.driver, t.vehicle, t.status, t.distance, t.passengers, t.capacity, t.occupancy, t.revenue, t.commission, t.net])
      } else if (reportKey === 'driver') {
        const res: any = await reportsApi.getDriverReport(orgUuid, dateParams)
        title = 'Driver Report'
        headers = ['Driver', 'Trips Completed', 'Total Earnings', 'Avg Rating', 'Total Passengers', 'Total Distance (km)', 'Total Hours', 'Speed Violations', 'Safety Score']
        rows = res.drivers.map((d: any) => [d.name, d.trips_completed, d.total_earnings, d.average_rating, d.total_passengers, d.total_distance, d.total_hours, d.speed_violations, d.safety_score])
      } else if (reportKey === 'vehicle') {
        const res: any = await reportsApi.getVehicleReport(orgUuid, dateParams)
        title = 'Vehicle Report'
        headers = ['Plate', 'Model', 'Trips Completed', 'Total Distance (km)', 'Total Fuel (L)', 'Avg Fuel Consumption', 'Maintenance Cost', 'Downtime (hrs)', 'Utilization %']
        rows = res.vehicles.map((v: any) => [v.plate, v.model, v.trips_completed, v.total_distance, v.total_fuel_liters, v.average_fuel_consumption, v.maintenance_cost, v.downtime, v.utilization])
      } else if (reportKey === 'revenue') {
        const res: any = await reportsApi.getRevenueReport(orgUuid, dateParams)
        title = 'Revenue Report'
        headers = ['Date', 'Gross', 'Commission', 'Net', 'Trips']
        rows = res.data.map((r: any) => [r.date, r.gross, r.commission, r.net, r.trips])
      } else {
        // Route report has no date-range filtering on the backend
        const res: any = await reportsApi.getRouteReport(orgUuid)
        title = 'Route Report'
        headers = ['Route', 'Trips Completed', 'Total Revenue', 'Avg Occupancy %', 'Avg Passengers', 'Profit Margin %']
        rows = res.routes.map((r: any) => [r.name, r.trips_completed, r.total_revenue, r.average_occupancy, r.average_passengers, r.profit_margin])
      }

      const filenameBase = `${reportKey}-report-${formatDateParam(filterStart)}-to-${formatDateParam(filterEnd)}`
      if (format === 'csv') {
        downloadReportCsv(`${filenameBase}.csv`, headers, rows)
      } else {
        downloadReportPdf(`${filenameBase}.pdf`, title, headers, rows)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to export report')
    } finally {
      setExportingKey(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Reports" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Reports" subtitle="Business performance at a glance" />

        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {dateRanges.map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedRange(r)
                if (r === 'Custom') {
                  setShowCustomPicker(true)
                }
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedRange === r
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-200 border-neutral-50'
                }`}
            >
              {r === 'Custom' && customDates.start && customDates.end
                ? `${customDates.start} - ${customDates.end}`
                : r
              }
            </button>
          ))}
        </div>

        {/* Custom date range modal */}
        {showCustomPicker && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCustomPicker(false)}
          >
            <div
              className="bg-white w-full max-w-md mx-4 rounded-3xl shadow-float flex flex-col p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-bold text-primary-500">Custom Date Range</h3>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
                >&#x2715;</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={customDates.start}
                    onChange={e => setCustomDates(p => ({ ...p, start: e.target.value }))}
                    className="input-field bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">End Date</label>
                  <input
                    type="date"
                    value={customDates.end}
                    onChange={e => setCustomDates(p => ({ ...p, end: e.target.value }))}
                    className="input-field bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setCustomDates({ start: '', end: '' })
                    setSelectedRange('This Week')
                    setShowCustomPicker(false)
                  }}
                  className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    if (!customDates.start || !customDates.end) {
                      toast.error('Please select both start and end dates')
                      return
                    }
                    setShowCustomPicker(false)
                  }}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Trips', value: filteredTrips.length.toString() },
            { label: 'Total Earnings', value: formatMoneyCompact(totalGross) },
            { label: 'Avg Occupancy', value: `${avgOccupancyPct}%` },
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
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleAction()
                  if (!isProfileIncomplete) handleExport('revenue', 'pdf')
                }}
                disabled={exportingKey === 'revenue-pdf'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-primary-500 border border-neutral-100 transition-colors disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" /> {exportingKey === 'revenue-pdf' ? 'Exporting…' : 'PDF'}
              </button>
              <button
                onClick={() => {
                  handleAction()
                  if (!isProfileIncomplete) handleExport('revenue', 'csv')
                }}
                disabled={exportingKey === 'revenue-csv'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-[#1D754C] border border-neutral-100 transition-colors disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" /> {exportingKey === 'revenue-csv' ? 'Exporting…' : 'Excel'}
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyRevData} barSize={20} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A7C957" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8896b0' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [formatMoneyCompact(v), 'Net']}
                contentStyle={{ background: '#ffffff', border: '1px solid #DEDBEC', borderRadius: 12, fontSize: 11, color: '#000000', padding: '6px 12px' }}
                itemStyle={{ color: '#000000' }}
                labelStyle={{ color: '#042011', fontWeight: 'bold' }}
                cursor={{ fill: 'rgba(4, 32, 17, 0.05)' }}
              />
              <Bar dataKey="net" fill="#1D754C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-50 text-center text-xs">
            <div><p className="text-neutral-200">Total Trips</p><p className="font-bold text-primary-500 mt-0.5">{filteredTrips.length}</p></div>
            <div className="border-x border-neutral-50"><p className="text-neutral-200">Total Earnings</p><p className="font-bold text-primary-500 mt-0.5">{formatMoneyCompact(totalGross)}</p></div>
            <div><p className="text-neutral-200">Avg Occupancy</p><p className="font-bold text-secondary-300 mt-0.5">{avgOccupancyPct}%</p></div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">Report Types</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {reportTypes.map(({ key, icon: Icon, label, desc, color }) => (
              <div key={label} className="card p-4 hover:shadow-card-hover transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} border border-neutral-100`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary-500">{label}</p>
                    <p className="text-xs text-neutral-200 mt-0.5 leading-relaxed truncate">{desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      handleAction()
                      if (!isProfileIncomplete) handleExport(key, 'pdf')
                    }}
                    disabled={exportingKey === `${key}-pdf`}
                    className="w-8 h-8 rounded-xl bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center border border-neutral-100 text-primary-400 hover:text-primary-500 transition-colors disabled:opacity-60"
                    title="Export PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      handleAction()
                      if (!isProfileIncomplete) handleExport(key, 'csv')
                    }}
                    disabled={exportingKey === `${key}-csv`}
                    className="w-8 h-8 rounded-xl bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center border border-neutral-100 text-[#1D754C] hover:text-[#16593a] transition-colors disabled:opacity-60"
                    title="Export Excel"
                  >
                    <span className="text-[10px] font-bold">XLS</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Incomplete Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm p-6 shadow-float space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-secondary-500 rounded-3xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-primary-500">Profile Incomplete</h2>
              <p className="text-sm text-neutral-300">Please complete your profile to generate reports.</p>
            </div>
            <div className="bg-secondary-500/10 border border-secondary-300 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-black uppercase tracking-wider">What's needed:</p>
              <ul className="text-xs text-neutral-300 space-y-2 text-left">
                <li>✓ Organization details</li>
                <li>✓ Director information</li>
                <li>✓ Bank account setup</li>
                <li>✓ Security questions</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 bg-neutral-50 hover:bg-neutral-100 text-black font-semibold rounded-xl px-4 py-2 text-sm transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.dispatchEvent(new Event('require-profile-completion'))}
                className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all whitespace-nowrap"
              >
                Complete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

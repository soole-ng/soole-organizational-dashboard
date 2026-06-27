import { Link } from 'react-router-dom'
import { Users, Car, ChevronRight, AlertTriangle, TrendingUp, Activity } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'
import { DriverAvatar } from '../../components/ui/DriverAvatar'

export function FleetPage() {
  const { data, loading } = useMockData()

  const pendingDrivers = data.drivers.filter(d => d.status === 'pending').length
  const pendingDocs = data.vehicles.reduce((acc, v) =>
    acc + v.documents.filter(d => d.status === 'pending' || d.status === 'uploaded').length, 0)
  const verifiedDrivers = data.drivers.filter(d => d.status === 'verified').length
  const verifiedVehicles = data.vehicles.filter(v => v.status === 'verified').length
  const totalSeats = data.vehicles.reduce((t, v) => t + v.capacity, 0)
  const avgRating = data.drivers
    .filter(d => (d.avgRating ?? 0) > 0)
    .reduce((a, d, _, arr) => a + (d.avgRating ?? 0) / arr.length, 0)

  const hasAlerts = pendingDrivers > 0 || pendingDocs > 0

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <TopBar title="Fleet" />
        <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
          <div className="h-12 bg-white rounded-2xl w-48 mb-4" />
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Fleet" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Fleet" subtitle="Manage drivers and vehicles" />

        {/* Alerts Banner */}
        {hasAlerts && (
          <div className="bg-warning-50 border border-warning-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-warning mb-1">Action Required</p>
              <div className="space-y-0.5 text-xs text-warning">
                {pendingDrivers > 0 && <p>• {pendingDrivers} driver invite{pendingDrivers > 1 ? 's' : ''} still pending</p>}
                {pendingDocs > 0 && <p>• {pendingDocs} document{pendingDocs > 1 ? 's' : ''} under review</p>}
              </div>
            </div>
          </div>
        )}

        {/* Quick Metric Tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Verified Drivers', value: verifiedDrivers, total: data.drivers.length, icon: Users, color: 'bg-white text-secondary-300', progress: (verifiedDrivers / Math.max(data.drivers.length, 1)) * 100 },
            { label: 'Active Vehicles', value: verifiedVehicles, total: data.vehicles.length, icon: Car, color: 'bg-white text-teal-400', progress: (verifiedVehicles / Math.max(data.vehicles.length, 1)) * 100 },
            { label: 'Total Seats', value: totalSeats, total: null, icon: Activity, color: 'bg-white text-info-400', progress: null },
            { label: 'Avg Rating', value: avgRating.toFixed(1) + '★', total: null, icon: TrendingUp, color: 'bg-white text-accent-400', progress: (avgRating / 5) * 100 },
          ].map(({ label, value, total, icon: Icon, color, progress }) => (
            <div key={label} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                </div>
                {total !== null && (
                  <span className="text-[10px] text-neutral-200">/ {total}</span>
                )}
              </div>
              <p className="text-2xl font-black text-primary-500 stat-number">{value}</p>
              <p className="text-[10px] text-neutral-200 mt-0.5">{label}</p>

            </div>
          ))}
        </div>

        {/* Driver Status Strip */}
        <div className="card">
          <p className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-3">Driver Status</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {data.drivers.map(driver => {
              const statusColor = driver.status === 'verified' ? 'bg-secondary-300' : driver.status === 'pending' ? 'bg-warning' : 'bg-danger'
              return (
                <div key={driver.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14">
                  <div className="relative">
                    <DriverAvatar driverId={driver.id} name={driver.name} size="md" />
                    <span className={clsx('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white', statusColor)} />
                  </div>
                  <p className="text-[9px] text-neutral-200 text-center truncate w-full font-medium">{driver.name.split(' ')[0]}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation Cards */}
        <Link to="/fleet/drivers" className="card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 block">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-secondary-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary-500">Drivers</p>
              <p className="text-xs text-neutral-200 mt-0.5">
                {verifiedDrivers} verified · {pendingDrivers} pending
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-primary-500 stat-number">{data.drivers.length}</span>
              <ChevronRight className="w-5 h-5 text-neutral-100" />
            </div>
          </div>
        </Link>

        <Link to="/fleet/vehicles" className="card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 block">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0">
              <Car className="w-6 h-6 text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary-500">Vehicles</p>
              <p className="text-xs text-neutral-200 mt-0.5">
                {verifiedVehicles} verified · {totalSeats} total seats
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-primary-500 stat-number">{data.vehicles.length}</span>
              <ChevronRight className="w-5 h-5 text-neutral-100" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

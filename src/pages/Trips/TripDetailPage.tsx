import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Edit2, Copy, XCircle, Bus, User, Navigation, Clock, Gauge, RefreshCw } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { ManifestList } from './components/ManifestList'
import { useMockData } from '../../lib/useMockData'
import { mockPassengers } from '../../lib/mockData'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

/** Estimate average speed in km/h from total distance and scheduled duration */
function calcAvgSpeed(distanceKm: number, durationMinutes: number): number {
  if (!durationMinutes) return 0
  return Math.round((distanceKm / durationMinutes) * 60)
}

function LiveTracker({ trip, distanceKm, durationMinutes }: {
  trip: any; distanceKm: number; durationMinutes: number
}) {
  const baseProgress = trip.status === 'boarding' ? 0.05 : trip.status === 'in_progress' ? 0.42 : 0
  const [progress, setProgress] = useState(baseProgress)

  useEffect(() => {
    if (trip.status !== 'boarding' && trip.status !== 'in_progress') return
    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 0.001, 0.99))
    }, 3000)
    return () => clearInterval(timer)
  }, [trip.status])

  const coveredKm = Math.round(distanceKm * progress)
  const remainingKm = distanceKm - coveredKm

  const dep = new Date(trip.departureAt)
  const etaMs = dep.getTime() + durationMinutes * 60 * 1000
  const etaStr = new Date(etaMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const remainingMin = Math.max(0, Math.round((etaMs - Date.now()) / 60000))

  const avgSpeed = calcAvgSpeed(distanceKm, durationMinutes)

  const stats = [
    { icon: Navigation, label: 'Covered', value: `${coveredKm} km`, color: 'text-secondary-300' },
    { icon: Navigation, label: 'Remaining', value: `${remainingKm} km`, color: 'text-teal-400' },
    { icon: Gauge, label: 'Avg Speed', value: `${avgSpeed} km/h`, color: 'text-primary-400' },
  ]

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-black uppercase tracking-wider">Live Trip Tracker</p>
        <span className="flex items-center gap-1 text-[10px] text-secondary-300 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-300 animate-pulse inline-block" />
          LIVE
        </span>
      </div>

      {/* Route progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-black mb-1 font-medium">
          <span>{trip.origin?.split('(')[0].trim() ?? 'Origin'}</span>
          <span className="text-neutral-200 text-[10px]">{Math.round(progress * 100)}% complete</span>
          <span>{trip.destination?.split('(')[0].trim() ?? 'Destination'}</span>
        </div>
        <div className="h-2 bg-neutral-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary-300 rounded-full transition-all duration-[3000ms]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      {/* ETA strip */}
      <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-bold text-primary-500">ETA {etaStr}</span>
        </div>
        <span className="text-[11px] text-neutral-200">{remainingMin} min remaining</span>
      </div>

      {/* 3-column stats */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-neutral-100 flex flex-col items-center text-center gap-1">
            <Icon className={clsx('w-4 h-4', color)} />
            <p className="text-sm font-black text-black stat-number leading-tight">{value}</p>
            <p className="text-[10px] text-neutral-200 leading-none">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TripDetailPage() {
  const { id } = useParams()
  const { data } = useMockData()

  const trip = data.trips.find((t: any) => t.id === id) ?? data.trips[0]
  const route = data.routes?.find((r: any) => r.id === trip?.routeId)
  const vehicle = data.vehicles?.find((v: any) => v.id === trip?.vehicleId)

  if (!trip) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar title="Trip" backHref="/trips" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-neutral-200">Trip not found.</p>
        </div>
      </div>
    )
  }

  const distanceKm: number = route?.distanceKm ?? 148
  const durationMinutes: number = route?.durationMinutes ?? 165

  const pct = Math.round((trip.bookedSeats / trip.capacity) * 100)
  const isLive = trip.status === 'boarding' || trip.status === 'in_progress'
  const isScheduled = trip.status === 'scheduled'
  const isCompleted = trip.status === 'completed'

  const passengers = mockPassengers(trip.id)
  // Only paid passengers are counted as booked
  const paidPassengers = passengers.filter(p => p.paymentStatus === 'paid')

  const handleEdit = () => toast('Edit trip details')
  const handleDuplicate = () => toast.success('Trip duplicated')
  const handleCancel = () => toast.error('Cancel this trip?')

  // Build action buttons based on status
  const actions = [
    isScheduled && { icon: Edit2, label: 'Edit', action: handleEdit, danger: false },
    { icon: Copy, label: 'Duplicate', action: handleDuplicate, danger: false },
    isScheduled && { icon: XCircle, label: 'Cancel', action: handleCancel, danger: true },
  ].filter(Boolean) as { icon: any; label: string; action: () => void; danger: boolean }[]

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title={trip.routeName} backHref="/trips" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        {/* Trip info card */}
        <div className="card">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-primary-500">{trip.routeName}</h2>
              <p className="text-xs text-neutral-200 mt-0.5">
                {formatDate(trip.departureAt)} · {formatTime(trip.departureAt)}
              </p>
              <p className="text-[10px] text-neutral-200 mt-0.5">
                {distanceKm} km · ~{Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m route
              </p>
            </div>
            <StatusPill status={trip.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-neutral-100">
              <div className="flex items-center gap-1.5 text-xs text-neutral-200 mb-1">
                <Bus className="w-3.5 h-3.5" /> Vehicle
              </div>
              <p className="text-sm font-semibold text-primary-500">{trip.vehiclePlate}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-neutral-100">
              <div className="flex items-center gap-1.5 text-xs text-neutral-200 mb-1">
                <User className="w-3.5 h-3.5" /> Driver
              </div>
              <p className="text-sm font-semibold text-primary-500 truncate">{trip.driverName}</p>
            </div>
          </div>

          <div className="text-center py-4 border-y border-neutral-100 mb-4">
            <p className="text-5xl font-bold text-primary-500 stat-number">{paidPassengers.length}</p>
            <p className="text-sm text-neutral-200 mt-1">of {trip.capacity} seats paid &amp; booked</p>
            <div className="h-2 bg-neutral-50 rounded-full mt-3 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  pct >= 90 ? 'bg-secondary-300' : pct >= 60 ? 'bg-warning' : 'bg-secondary-100',
                )}
                style={{ width: `${Math.round((paidPassengers.length / trip.capacity) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs mt-2 px-2">
            <span className="text-neutral-200">Total Est. Revenue</span>
            <span className="font-bold text-secondary-300 text-sm stat-number">NGN {trip.grossRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Live tracker — shown when boarding or in_progress */}
        {isLive && (
          <LiveTracker
            trip={trip}
            distanceKm={distanceKm}
            durationMinutes={durationMinutes}
          />
        )}

        {/* Action buttons — context-aware */}
        {actions.length > 0 && (
          <div className={clsx('grid gap-2', `grid-cols-${actions.length}`)}>
            {actions.map(({ icon: Icon, label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={clsx(
                  'flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-medium transition-colors',
                  danger
                    ? 'text-danger-300 bg-white border-neutral-100 hover:bg-danger-50'
                    : 'text-primary-400 bg-white border-neutral-100 hover:bg-primary-75',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="card">
          <ManifestList
            passengers={passengers}
            tripStatus={trip.status}
          />
        </div>
      </div>
    </div>
  )
}

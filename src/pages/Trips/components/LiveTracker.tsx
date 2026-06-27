import { useState, useEffect, useRef } from 'react'
import { Navigation, Clock, Gauge, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

const SPEED_LIMIT_KMH = 100

function calcAvgSpeed(distanceKm: number, durationMinutes: number): number {
  if (!durationMinutes) return 0
  return Math.round((distanceKm / durationMinutes) * 60)
}

interface LiveTrackerProps {
  trip: any
  distanceKm: number
  durationMinutes: number
  vehiclePlate: string
  driverName: string
  onSpeedViolation: (speed: number, plate: string, driver: string) => void
}

export function LiveTracker({
  trip, distanceKm, durationMinutes, vehiclePlate, driverName, onSpeedViolation,
}: LiveTrackerProps) {
  const baseProgress = trip.status === 'boarding' ? 0.05 : trip.status === 'in_progress' ? 0.42 : 0
  const [progress, setProgress] = useState(baseProgress)

  const prevProgressRef = useRef(baseProgress)
  const prevTimestampRef = useRef(Date.now())
  const violationFiredRef = useRef(false)

  useEffect(() => {
    if (trip.status !== 'boarding' && trip.status !== 'in_progress') return

    const TICK_MS = 3000
    const PROGRESS_INCREMENT = 0.001

    const timer = setInterval(() => {
      const now = Date.now()
      const elapsedHours = (now - prevTimestampRef.current) / 3_600_000

      setProgress(p => {
        const next = Math.min(p + PROGRESS_INCREMENT, 0.99)
        const kmSinceLast = (next - prevProgressRef.current) * distanceKm
        const estimatedSpeedKmh = elapsedHours > 0 ? kmSinceLast / elapsedHours : 0

        if (estimatedSpeedKmh > SPEED_LIMIT_KMH && !violationFiredRef.current) {
          violationFiredRef.current = true
          onSpeedViolation(Math.round(estimatedSpeedKmh), vehiclePlate, driverName)
        }

        prevProgressRef.current = next
        prevTimestampRef.current = now
        return next
      })
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [trip.status, distanceKm, driverName, vehiclePlate, onSpeedViolation])

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

      <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-bold text-primary-500">ETA {etaStr}</span>
        </div>
        <span className="text-[11px] text-neutral-200">{remainingMin} min remaining</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-neutral-100 flex flex-col items-center text-center gap-1">
            <Icon className={clsx('w-4 h-4', color)} />
            <p className="text-sm font-black text-black stat-number leading-tight">{value}</p>
            <p className="text-[10px] text-neutral-200 leading-none">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-1">
        <AlertTriangle className="w-3 h-3 text-neutral-200 flex-shrink-0" />
        <p className="text-[10px] text-neutral-200">Fleet speed limit: {SPEED_LIMIT_KMH} km/h — violations trigger an alert</p>
      </div>
    </div>
  )
}

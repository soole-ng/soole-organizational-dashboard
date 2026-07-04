import { useState, useEffect, useRef } from 'react'
import { Navigation, Clock, Gauge, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { trackingApi } from '../../../api/client'

interface LiveTrackerProps {
  orgUuid: string
  tripId: string
  vehiclePlate: string
  driverName: string
  onSpeedViolation: (speed: number, plate: string, driver: string) => void
}

export function LiveTracker({
  orgUuid, tripId, vehiclePlate, driverName, onSpeedViolation,
}: LiveTrackerProps) {
  const [tracking, setTracking] = useState<any | null>(null)
  const violationFiredRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      trackingApi.getTripTracking(orgUuid, tripId)
        .then((raw: any) => {
          if (cancelled) return
          setTracking(raw)
          if (raw.speed_violation_alert && !violationFiredRef.current) {
            violationFiredRef.current = true
            onSpeedViolation(raw.speed ?? 0, vehiclePlate, driverName)
          }
        })
        .catch(() => {})
    }

    poll()
    const interval = setInterval(poll, 8000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [orgUuid, tripId, vehiclePlate, driverName, onSpeedViolation])

  const speed = tracking?.speed ?? 0
  const speedLimit = tracking?.speed_limit ?? 100
  const distanceRemaining = tracking?.distance_remaining
  const durationRemaining = tracking?.duration_remaining
  const eta = tracking?.eta ? new Date(tracking.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

  const stats = [
    { icon: Navigation, label: 'Distance Left', value: distanceRemaining != null ? `${distanceRemaining} km` : '—', color: 'text-teal-400' },
    { icon: Clock, label: 'Time Left', value: durationRemaining != null ? `${durationRemaining} min` : '—', color: 'text-orange-400' },
    { icon: Gauge, label: 'Current Speed', value: `${speed} km/h`, color: 'text-primary-400' },
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

      <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-bold text-primary-500">ETA {eta}</span>
        </div>
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
        <p className="text-[10px] text-neutral-200">Fleet speed limit: {speedLimit} km/h — violations trigger an alert</p>
      </div>
    </div>
  )
}

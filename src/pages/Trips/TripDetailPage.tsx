import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Edit2, XCircle, Bus, User, Navigation, Clock, Gauge, AlertTriangle, Droplets, MessageSquare, Send, Star } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { ManifestList } from './components/ManifestList'
import { useMockData } from '../../lib/useMockData'
import { mockPassengers } from '../../lib/mockData'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

/** Fleet-wide hard speed limit in km/h */
const SPEED_LIMIT_KMH = 100

/** Estimate scheduled average speed in km/h */
function calcAvgSpeed(distanceKm: number, durationMinutes: number): number {
  if (!durationMinutes) return 0
  return Math.round((distanceKm / durationMinutes) * 60)
}
/** Trip comment shape */
interface TripComment {
  id: string
  author: string
  initials: string
  text: string
  timestamp: string
}

/** Seed comments shown on completed trips */
const seedComments: TripComment[] = [
  { id: 'c1', author: 'Akin Bello', initials: 'AB', text: 'Driver reported minor traffic near Sagamu interchange. Trip completed smoothly overall.', timestamp: '2026-06-25T09:18:00' },
  { id: 'c2', author: 'Ops Team',   initials: 'OT', text: 'Revenue reconciled. Two passengers requested receipts via email.', timestamp: '2026-06-25T10:05:00' },
]

interface LiveTrackerProps {
  trip: any
  distanceKm: number
  durationMinutes: number
  vehiclePlate: string
  driverName: string
  onSpeedViolation: (speed: number, plate: string, driver: string) => void
}

function LiveTracker({
  trip, distanceKm, durationMinutes, vehiclePlate, driverName, onSpeedViolation,
}: LiveTrackerProps) {
  const baseProgress = trip.status === 'boarding' ? 0.05 : trip.status === 'in_progress' ? 0.42 : 0
  const [progress, setProgress] = useState(baseProgress)

  // Track previous values to estimate real-time speed between ticks
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

        // Compute km covered since last tick and derive instantaneous speed
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

      {/* Speed limit note */}
      <div className="flex items-center gap-1.5 px-1">
        <AlertTriangle className="w-3 h-3 text-neutral-200 flex-shrink-0" />
        <p className="text-[10px] text-neutral-200">Fleet speed limit: {SPEED_LIMIT_KMH} km/h — violations trigger an alert</p>
      </div>
    </div>
  )
}

export function TripDetailPage() {
  const { id } = useParams()
  const { data } = useMockData()
  const ctx = useOutletContext<any>()
  const notifications = ctx?.notifications ?? []
  const setNotifications = ctx?.setNotifications

  const trip = data.trips.find((t: any) => t.id === id) ?? data.trips[0]
  const route = data.routes?.find((r: any) => r.id === trip?.routeId)

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

  const isLive = trip.status === 'boarding' || trip.status === 'in_progress'
  const isScheduled = trip.status === 'scheduled'
  const isCompleted = trip.status === 'completed'

  const [comments, setComments] = useState<TripComment[]>(seedComments)
  const [newComment, setNewComment] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [modalComment, setModalComment] = useState('')

  const submitComment = (text: string, fromModal = false) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setComments(prev => [
      ...prev,
      {
        id: `c${Date.now()}`,
        author: 'You',
        initials: 'ME',
        text: trimmed,
        timestamp: new Date().toISOString(),
      },
    ])
    if (fromModal) setModalComment('')
    else setNewComment('')
    toast.success('Comment added')
  }

  const passengers = mockPassengers(trip.id)
  const paidPassengers = passengers.filter(p => p.paymentStatus === 'paid')

  const handleEdit = () => toast('Edit trip details')
  const handleCancel = () => toast.error('Cancel this trip?')

  const actions = [
    isScheduled && { icon: Edit2, label: 'Edit', action: handleEdit, danger: false },
    isScheduled && { icon: XCircle, label: 'Cancel', action: handleCancel, danger: true },
  ].filter(Boolean) as { icon: any; label: string; action: () => void; danger: boolean }[]

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleSpeedViolation = useCallback((speed: number, plate: string, driver: string) => {
    // Show immediate toast alert
    toast.error(`⚠ Speed limit exceeded! ${plate} is travelling at ~${speed} km/h`, {
      duration: 8000,
      style: { maxWidth: 380 },
    })

    // Push into the global notification bell (if context available)
    if (setNotifications) {
      const newNotif = {
        id: `speed-${plate}-${Date.now()}`,
        type: 'warning' as const,
        title: `Speed limit exceeded — ${plate}`,
        message: `${driver} is estimated to be travelling at ~${speed} km/h, exceeding the ${SPEED_LIMIT_KMH} km/h fleet limit on the ${trip.routeName} route.`,
        read: false,
        createdAt: new Date().toISOString(),
        action: { label: 'View on map', href: '/live-map' },
      }
      setNotifications((prev: any[]) => [newNotif, ...prev])
    }
  }, [setNotifications, trip.routeName])

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <TopBar title={trip.routeName} backHref="/trips" />

      <div className="flex-1 p-2 pt-2 lg:pt-3 lg:px-4 w-full">
        {/* Side-by-side layout on desktop, stacked on mobile */}
        <div className="lg:grid lg:gap-4 space-y-4 lg:space-y-0 w-full" style={{ gridTemplateColumns: '2fr 3fr' }}>

          {/* LEFT — Trip info + tracker + actions (sticky so it doesn't scroll away) */}
          <div className="space-y-4 lg:sticky lg:top-2 lg:self-start">
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
                <p className="text-sm text-neutral-200 mt-1">of {trip.capacity} seats booked</p>
              </div>

              <div className="flex justify-between items-center text-xs mt-2 px-2">
                <span className="text-neutral-200">Total Est. Revenue</span>
                <span className="font-bold text-secondary-300 text-sm stat-number">NGN {trip.grossRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Completed trip summary stats — only for completed trips */}
            {isCompleted && (() => {
              const avgSpeed = calcAvgSpeed(distanceKm, durationMinutes)
              const estFuelL = Math.round((distanceKm / 100) * 10) // ~10L per 100km for a bus
              const hrs = Math.floor(durationMinutes / 60)
              const mins = durationMinutes % 60
              const timeTaken = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`

              // Find driver details & reviews to show the specific trip rating
              const driverObj = data.drivers?.find((d: any) => d.id === trip.driverId)
              const tripReviews = driverObj?.reviews?.filter((r: any) => r.tripId === trip.id) ?? []
              const avgTripRating = tripReviews.length > 0
                ? (tripReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / tripReviews.length).toFixed(1)
                : '4.8' // Fallback to driver's default or common rating if none found

              const completedStats = [
                { icon: Navigation, label: 'Distance Covered', value: `${distanceKm} km`,  color: 'text-secondary-300' },
                { icon: Gauge,      label: 'Avg Speed',        value: `${avgSpeed} km/h`,   color: 'text-primary-400'   },
                { icon: Droplets,   label: 'Est. Fuel Used',   value: `${estFuelL} L`,      color: 'text-blue-400'      },
                { icon: Clock,      label: 'Time Taken',       value: timeTaken,             color: 'text-orange-400'    },
              ]
              return (
                <div className="bg-white rounded-xl border border-neutral-100 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <p className="text-xs font-bold text-black uppercase tracking-wider">Trip Summary</p>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-700">{avgTripRating} Rating</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {completedStats.map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="flex flex-col items-center text-center gap-1 bg-white border border-neutral-100 rounded-xl p-3">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <p className="text-sm font-black text-black stat-number leading-tight">{value}</p>
                        <p className="text-[10px] text-neutral-200 leading-none">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Live tracker — only when in_progress / boarding */}
            {isLive && (
              <LiveTracker
                trip={trip}
                distanceKm={distanceKm}
                durationMinutes={durationMinutes}
                vehiclePlate={trip.vehiclePlate}
                driverName={trip.driverName}
                onSpeedViolation={handleSpeedViolation}
              />
            )}

            {/* Action buttons — context-aware per status */}
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

            {/* Comments — completed trips only */}
            {isCompleted && (
              <div className="bg-white rounded-xl border border-neutral-100 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-primary-400" />
                  <p className="text-xs font-bold text-black uppercase tracking-wider">Comments</p>
                  <span className="ml-auto text-[10px] text-neutral-200 font-medium">{comments.length} note{comments.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Preview: latest 3 comments */}
                <div className="space-y-3 mb-3">
                  {comments.slice(-3).map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-75 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black text-primary-500">{c.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-primary-500">{c.author}</span>
                          <span className="text-[10px] text-neutral-200">{formatTime(c.timestamp)}</span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed mt-0.5 line-clamp-2">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View all button */}
                {comments.length > 3 && (
                  <button
                    onClick={() => setShowAllComments(true)}
                    className="w-full text-xs text-primary-400 font-semibold py-2 rounded-xl border border-neutral-100 hover:bg-primary-75 transition-colors mb-3"
                  >
                    View all {comments.length} comments
                  </button>
                )}

                {/* Inline new comment input */}
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(newComment) } }}
                    placeholder="Add a note about this trip…"
                    rows={2}
                    className="flex-1 text-xs text-primary-500 placeholder-neutral-200 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary-200 transition-colors"
                  />
                  <button
                    onClick={() => submitComment(newComment)}
                    disabled={!newComment.trim()}
                    className="self-end w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white hover:bg-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Post comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Passengers manifest (scrollable) */}
          <div className="card lg:overflow-y-auto lg:max-h-[calc(100vh-90px)]">
            <ManifestList passengers={passengers} tripStatus={trip.status} tripId={trip.id} />
          </div>

        </div>
      </div>

      {/* ── All Comments Modal ── */}
      {showAllComments && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAllComments(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-3xl shadow-float flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-400" />
              <div>
                <h2 className="text-sm font-bold text-primary-500">All Comments</h2>
                <p className="text-[11px] text-neutral-200">{trip.routeName} &middot; {comments.length} note{comments.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setShowAllComments(false)}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors text-lg font-light"
                aria-label="Close"
              >&#x2715;</button>
            </div>

            {/* Scrollable comment list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {comments.map((c, i) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-75 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-black text-primary-500">{c.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-primary-500">{c.author}</span>
                      <span className="text-xs text-neutral-200">{formatTime(c.timestamp)}</span>
                      <span className="text-[10px] text-neutral-200 ml-auto">#{i + 1}</span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed mt-1">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal post input */}
            <div className="px-5 py-4 border-t border-neutral-100 flex gap-2 flex-shrink-0">
              <textarea
                value={modalComment}
                onChange={e => setModalComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(modalComment, true) } }}
                placeholder="Add a note…"
                rows={2}
                className="flex-1 text-sm text-primary-500 placeholder-neutral-200 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary-200 transition-colors"
              />
              <button
                onClick={() => submitComment(modalComment, true)}
                disabled={!modalComment.trim()}
                className="self-end w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white hover:bg-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Post comment"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

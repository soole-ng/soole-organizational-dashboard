import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Edit2, XCircle, Bus, User, Navigation, Clock, Gauge, AlertTriangle, Droplets, MessageSquare, Star } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { ManifestList } from './components/ManifestList'
import { useMockData } from '../../lib/useMockData'
import { mockPassengers } from '../../lib/mockData'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { LiveTracker } from './components/LiveTracker'
import { CommentsModal } from './components/CommentsModal'

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



export function TripDetailPage() {
  const { id } = useParams()
  const { data, loading } = useMockData()
  const ctx = useOutletContext<any>()
  const notifications = ctx?.notifications ?? []
  const setNotifications = ctx?.setNotifications

  const [comments, setComments] = useState<TripComment[]>(seedComments)
  const [newComment, setNewComment] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [modalComment, setModalComment] = useState('')

  const handleSpeedViolation = useCallback((speed: number, plate: string, driver: string) => {
    // Show immediate toast alert
    toast.error(`⚠ Speed limit exceeded! ${plate} is travelling at ~${speed} km/h`, {
      duration: 8000,
      style: { maxWidth: 380 },
    })

    const currentTrip = data.trips.find((t: any) => t.id === id) ?? data.trips[0]

    // Push into the global notification bell (if context available)
    if (setNotifications) {
      const newNotif = {
        id: `speed-${plate}-${Date.now()}`,
        type: 'warning' as const,
        title: `Speed limit exceeded — ${plate}`,
        message: `${driver} is estimated to be travelling at ~${speed} km/h, exceeding the ${SPEED_LIMIT_KMH} km/h fleet limit on the ${currentTrip?.routeName ?? 'Lagos → Ibadan'} route.`,
        read: false,
        createdAt: new Date().toISOString(),
        action: { label: 'View on map', href: '/live-map' },
      }
      setNotifications((prev: any[]) => [newNotif, ...prev])
    }
  }, [setNotifications, data.trips, id])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar title="Loading Trip..." backHref="/trips" />
        <div className="flex-1 flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const trip = data.trips.find((t: any) => t.id === id) ?? data.trips[0]

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

  const route = data.routes?.find((r: any) => r.id === trip.routeId)
  const distanceKm: number = route?.distanceKm ?? 148
  const durationMinutes: number = route?.durationMinutes ?? 165

  const isLive = trip.status === 'boarding' || trip.status === 'in_progress'
  const isScheduled = trip.status === 'scheduled'
  const isCompleted = trip.status === 'completed'

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

  const passengers = mockPassengers(trip.id).slice(0, trip.capacity)
  const paidPassengers = passengers.filter(p => p.paymentStatus === 'paid')

  const handleEdit = () => toast('Edit trip details')
  const handleCancel = () => toast.error('Cancel this trip?')

  const actions = [
    isScheduled && { icon: Edit2, label: 'Edit', action: handleEdit, danger: false },
    isScheduled && { icon: XCircle, label: 'Cancel', action: handleCancel, danger: true },
  ].filter(Boolean) as { icon: any; label: string; action: () => void; danger: boolean }[]

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

            {/* Comments Button — completed trips only */}
            {isCompleted && (
              <button
                onClick={() => setShowAllComments(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-100 bg-white hover:bg-neutral-50 text-primary-500 font-semibold transition-all duration-150"
              >
                <MessageSquare className="w-4 h-4 text-primary-400" />
                <span>Comments & Ratings ({comments.length + (data.drivers?.find((d: any) => d.id === trip.driverId)?.reviews?.filter((r: any) => r.tripId === trip.id)?.length ?? 0)})</span>
              </button>
            )}
          </div>

          {/* RIGHT — Passengers manifest (scrollable) */}
          <div className="card lg:overflow-y-auto lg:max-h-[calc(100vh-90px)]">
            <ManifestList passengers={passengers} tripStatus={trip.status} tripId={trip.id} />
          </div>

        </div>
      </div>

      {/* Comments Modal */}
      {showAllComments && (
        <CommentsModal
          trip={trip}
          data={data}
          onClose={() => setShowAllComments(false)}
        />
      )}
    </div>
  )
}

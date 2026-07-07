import { useState, useCallback } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { Edit2, XCircle, Bus, User, Navigation, Clock, Gauge, AlertTriangle, Droplets, MessageSquare, Star } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { ManifestList } from './components/ManifestList'
import { useApiData, useTripDetail, invalidateApiDataCache } from '../../lib/useApiData'
import { adaptTrip } from '../../lib/adapters'
import { organizationApi } from '../../api/client'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../lib/OrgContext'
import { LiveTracker } from './components/LiveTracker'
import { CommentsModal } from './components/CommentsModal'
import { EditTripModal } from './components/EditTripModal'
import { ReassignTripModal } from './components/ReassignTripModal'

/** Fleet-wide hard speed limit in km/h */
const SPEED_LIMIT_KMH = 100

export function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orgUuid } = useOrg()
  const { data } = useApiData()
  const { trip: rawTrip, passengers, comments, loading } = useTripDetail(id)
  const { guardAction } = useOrg()
  const ctx = useOutletContext<any>()
  const notifications = ctx?.notifications ?? []
  const setNotifications = ctx?.setNotifications

  const [showAllComments, setShowAllComments] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)

  const trip = rawTrip ? adaptTrip(rawTrip) : null

  const handleSpeedViolation = useCallback((speed: number, plate: string, driver: string) => {
    toast.error(`⚠ Speed limit exceeded! ${plate} is travelling at ~${speed} km/h`, {
      duration: 8000,
      style: { maxWidth: 380 },
    })

    if (setNotifications && trip) {
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
  }, [setNotifications, trip])

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

  const { distanceKm, durationMinutes, avgSpeedKmh, estimatedFuelLiters } = trip
  const hasTelemetry = distanceKm > 0

  const isLive = trip.status === 'boarding' || trip.status === 'in_progress'
  const isScheduled = trip.status === 'scheduled'
  const isCompleted = trip.status === 'completed'

  const paidPassengers = passengers.filter(p => p.paymentStatus === 'paid')

  const handleEdit = () => guardAction(undefined, () => setShowEditModal(true))
  const handleReassign = () => guardAction(undefined, () => setShowReassignModal(true))
  const handleCancel = () => guardAction(undefined, async () => {
    if (!orgUuid || !id) return
    try {
      await organizationApi.cancelTrip(orgUuid, id)
      invalidateApiDataCache()
      toast.success('Trip cancelled')
      navigate('/trips')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to cancel trip')
    }
  })

  const actions = [
    isLive && { icon: Navigation, label: 'View on Map', action: () => navigate('/live-map'), danger: false },
    isScheduled && { icon: Edit2, label: 'Edit', action: handleEdit, danger: false },
    isScheduled && { icon: User, label: 'Reassign', action: handleReassign, danger: false },
    isScheduled && { icon: XCircle, label: 'Cancel', action: handleCancel, danger: true },
  ].filter(Boolean) as { icon: any; label: string; action: () => void; danger: boolean }[]

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <TopBar title={trip.routeName} backHref="/trips" />

      <div className="flex-1 p-4 pt-4 lg:pt-6 lg:px-8 w-full">
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
              const hrs = Math.floor(durationMinutes / 60)
              const mins = durationMinutes % 60
              const timeTaken = hasTelemetry ? (hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`) : 'N/A'

              const driverObj = data.drivers?.find((d: any) => d.id === trip.driverId)
              const avgTripRating = driverObj?.avgRating ? driverObj.avgRating.toFixed(1) : '—'

              const completedStats = [
                { icon: Navigation, label: 'Distance Covered', value: hasTelemetry ? `${distanceKm} km` : 'N/A',  color: 'text-secondary-300' },
                { icon: Gauge,      label: 'Avg Speed',        value: hasTelemetry ? `${avgSpeedKmh} km/h` : 'N/A',   color: 'text-primary-400'   },
                { icon: Droplets,   label: 'Est. Fuel Used',   value: hasTelemetry ? `${estimatedFuelLiters} L` : 'N/A',      color: 'text-blue-400'      },
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
            {isLive && orgUuid && (
              <LiveTracker
                orgUuid={orgUuid}
                tripId={trip.id}
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
                <span>Comments & Ratings ({comments.length})</span>
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
          tripRouteName={trip.routeName}
          comments={comments}
          onClose={() => setShowAllComments(false)}
        />
      )}

      {/* Edit Trip Modal */}
      {showEditModal && orgUuid && id && (
        <EditTripModal
          orgUuid={orgUuid}
          tripId={id}
          departureAt={trip.departureAt}
          pricePerSeat={trip.fare}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* Reassign Trip Modal */}
      {showReassignModal && orgUuid && id && (
        <ReassignTripModal
          orgUuid={orgUuid}
          tripId={id}
          currentDriverId={trip.driverId}
          currentVehicleId={trip.vehicleId || undefined}
          drivers={data.drivers.filter(d =>
            (!d.isPendingInvite && d.status !== 'suspended') || d.id === trip.driverId
          )}
          vehicles={data.vehicles}
          onClose={() => setShowReassignModal(false)}
          onSaved={() => {
            invalidateApiDataCache()
            setShowReassignModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

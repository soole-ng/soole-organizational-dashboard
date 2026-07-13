import { ChevronRight, Clock, Users, MapPin, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../../../components/ui/StatusPill'
import { useOrg } from '../../../lib/OrgContext'
import { useApiData } from '../../../lib/useApiData'
import { formatTime, formatOccupancy } from '../../../lib/formatters'
import { clsx } from 'clsx'

function TripSkeleton() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-neutral-100 rounded w-32" />
        <div className="h-5 bg-neutral-100 rounded-full w-16" />
      </div>
      <div className="h-3 bg-neutral-100 rounded w-24" />
      <div className="h-1.5 bg-neutral-100 rounded-full" />
    </div>
  )
}

export function UpcomingTrips() {
  // Shared useApiData cache, not its own react-query fetch - see
  // TripsListPage for why (trip cancel/board/refund invalidate this cache;
  // a separate react-query cache under the same key never saw those).
  const { data, loading } = useApiData()
  const trips = data.trips
  const { guardAction } = useOrg()

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-neutral-100 rounded w-28 animate-pulse" />
        </div>
        <TripSkeleton />
        <TripSkeleton />
      </div>
    )
  }

  const upcoming = trips
    .filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 3)

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary-500">Upcoming Trips</h3>
        <Link
          to="/trips"
          className="text-xs text-secondary-300 font-semibold flex items-center gap-0.5 hover:text-secondary-400 transition-colors"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="card text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-sm font-semibold text-primary-500 mb-1">No upcoming trips</p>
          <p className="text-xs text-neutral-200 mb-4">Create a trip to get started.</p>
          <Link to="/trips/new" onClick={guardAction as any} className="btn-accent text-sm">
            + New Trip
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(trip => {
            const bookedSeats = Math.min(trip.bookedSeats, trip.capacity)
            const pct = Math.round((bookedSeats / trip.capacity) * 100)
            return (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="card hover:shadow-card-hover transition-all duration-200 block hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    {/* Route with arrow */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-semibold text-primary-500 truncate">
                        {trip.origin}{trip.originState ? `, ${trip.originState}` : ''}
                      </p>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-200 flex-shrink-0" />
                      <p className="text-sm font-semibold text-primary-500 truncate">
                        {trip.destination}{trip.destinationState ? `, ${trip.destinationState}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-200 truncate">{trip.vehiclePlate} · {trip.driverName}</p>
                  </div>
                  <StatusPill status={trip.status} size="sm" />
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-200">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(trip.departureAt)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-200">
                    <Users className="w-3.5 h-3.5" />
                    {formatOccupancy(bookedSeats, trip.capacity)} seats
                  </div>
                </div>

                <div className="flex items-center justify-end text-[10px] text-neutral-200">
                  <span className="font-semibold text-secondary-300">
                    {trip.capacity - bookedSeats} seats left
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

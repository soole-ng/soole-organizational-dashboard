import { format, formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, Phone, SatelliteDish, Siren, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { PlaceSeen, TripDetail, TripPassenger } from './api'

const time = (iso: string | null) => (iso ? format(new Date(iso), 'h:mm a') : null)
const dayTime = (iso: string | null) => (iso ? format(new Date(iso), 'EEE d MMM, h:mm a') : null)
const ago = (iso: string | null) => (iso ? `${formatDistanceToNowStrict(new Date(iso))} ago` : 'never')

const STATUS: Record<TripPassenger['status'], { label: string; cls: string }> = {
  waiting: { label: 'Waiting', cls: 'bg-[#eef2fb] text-[#2f4b8a]' },
  on_board: { label: 'On board', cls: 'bg-[#e6f4ec] text-[#0b6e4f]' },
  dropped_off: { label: 'Dropped off', cls: 'bg-[#eceeed] text-[#3d4f45]' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#fdeceb] text-[#a8231a]' },
}

const PAYMENT: Record<TripPassenger['payment'], string> = {
  not_paid: 'Not paid',
  held: 'Paid, held by Soole',
  first_share_released: '70% released to driver',
  fully_released: 'Fully released to driver',
}

const TRIP_STATUS: Record<string, string> = {
  in_progress: 'In progress',
  completed: 'Completed',
  upcoming: 'Upcoming',
  available: 'Available',
  full: 'Full',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

function where(p: PlaceSeen | null) {
  if (!p) return null
  return p.source === 'passenger_phone' ? "from the passenger's phone" : "from the vehicle's position"
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 text-sm py-1">
      <dt className="text-[#5e7266]">{label}</dt>
      <dd className="text-[#13241b] min-w-0 break-words">{children}</dd>
    </div>
  )
}

function Passenger({ p, n }: { p: TripPassenger; n: number }) {
  const s = STATUS[p.status]
  return (
    <li className="py-4 border-t border-[#e3e9e5] first:border-t-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid place-items-center w-6 h-6 shrink-0 rounded-full bg-[#13241b] text-white text-xs font-bold tabular-nums">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[#13241b]">{p.name ?? 'Passenger'}</p>
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', s.cls)}>{s.label}</span>
            {p.seats && p.seats > 1 && <span className="text-xs text-[#5e7266]">{p.seats} seats</span>}
          </div>
          {p.phone && (
            <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-sm text-[#0e7c86] hover:underline mt-0.5">
              <Phone size={13} /> {p.phone}
            </a>
          )}
          <dl className="mt-2">
            <Row label="Payment">{PAYMENT[p.payment]}</Row>
            <Row label="Asked pickup">{p.requested_pickup.address ?? 'Not given'}</Row>
            <Row label="Got in">
              {p.picked_up_at
                ? <>{time(p.picked_up_at)}{p.actual_pickup && <span className="text-[#5e7266]"> · {where(p.actual_pickup)}</span>}</>
                : <span className="text-[#5e7266]">Not yet</span>}
            </Row>
            <Row label="Asked drop-off">{p.requested_dropoff.address ?? 'Not given'}</Row>
            <Row label="Got out">
              {p.dropped_off_at
                ? <>{time(p.dropped_off_at)}{p.actual_dropoff && <span className="text-[#5e7266]"> · {where(p.actual_dropoff)}</span>}</>
                : <span className="text-[#5e7266]">Not yet</span>}
            </Row>
          </dl>
          {p.dropoff_distance_from_requested_km != null && (
            <p className={clsx(
              'mt-2 text-sm rounded-md px-2.5 py-1.5 flex items-start gap-1.5',
              p.dropoff_far_from_requested ? 'bg-[#fff1e8] text-[#9a3412]' : 'bg-[#f2f5f3] text-[#3d4f45]',
            )}>
              {p.dropoff_far_from_requested && <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
              Got out {p.dropoff_distance_from_requested_km} km from where they asked.
            </p>
          )}
          {p.reported_non_travel && (
            <p className="mt-2 text-sm rounded-md px-2.5 py-1.5 bg-[#fdeceb] text-[#a8231a]">
              Reported that they did not travel.
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

export function TripPanel({ trip, loading, error, onClose }: {
  trip: TripDetail | null
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  return (
    <aside className="h-full flex flex-col bg-white border-l border-[#dce3de]" aria-label="Trip details">
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#e3e9e5]">
        <div className="min-w-0">
          {trip ? (
            <>
              <p className="text-xs uppercase tracking-wider text-[#5e7266]">
                {trip.kind === 'company' ? `Company · ${trip.company ?? ''}` : 'Independent driver'}
              </p>
              <h2 className="text-lg font-semibold text-[#13241b] truncate">
                {trip.vehicle.plate ?? 'No plate'}{' '}
                <span className="font-normal text-[#5e7266]">
                  {[trip.vehicle.color, trip.vehicle.name].filter(Boolean).join(' ')}
                </span>
              </h2>
            </>
          ) : (
            <h2 className="text-lg font-semibold text-[#13241b]">{loading ? 'Loading trip…' : 'Trip'}</h2>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close trip"
          className="w-9 h-9 grid place-items-center rounded-lg hover:bg-[#f2f5f3] text-[#3d4f45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e7c86]"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {error && <p className="mt-4 text-sm text-[#a8231a]">{error}</p>}
        {trip && (
          <>
            {(trip.flags.sos || trip.flags.no_gps) && (
              <div className="mt-4 flex flex-col gap-2">
                {trip.flags.sos && (
                  <p className="flex items-center gap-2 text-sm font-medium rounded-lg bg-[#d92d20] text-white px-3 py-2">
                    <Siren size={16} /> An SOS on this trip is still open.
                  </p>
                )}
                {trip.flags.no_gps && (
                  <p className="flex items-center gap-2 text-sm rounded-lg bg-[#fdf3e1] text-[#8a5a12] px-3 py-2">
                    <SatelliteDish size={16} /> No location for over 10 minutes. Last seen {ago(trip.last_seen_at)}.
                  </p>
                )}
              </div>
            )}

            <dl className="mt-4">
              <Row label="Status">{TRIP_STATUS[trip.status] ?? trip.status}</Row>
              <Row label="Driver">
                {trip.driver.name ?? 'Unknown'}
                {trip.driver.phone && (
                  <a href={`tel:${trip.driver.phone}`} className="ml-2 inline-flex items-center gap-1 text-[#0e7c86] hover:underline">
                    <Phone size={13} /> {trip.driver.phone}
                  </a>
                )}
              </Row>
              <Row label="From">{trip.origin ?? '-'}</Row>
              <Row label="To">{trip.destination ?? '-'}</Row>
              <Row label="Started">{dayTime(trip.started_at) ?? 'Not started'}</Row>
              {trip.ended_at ? (
                <Row label="Ended">{dayTime(trip.ended_at)}</Row>
              ) : (
                <>
                  <Row label="Arrives">
                    {trip.eta ? time(trip.eta) : '-'}
                    {trip.minutes_left != null && <span className="text-[#5e7266]"> · {trip.minutes_left} min left</span>}
                    {trip.distance_left_km != null && <span className="text-[#5e7266]"> · {trip.distance_left_km} km</span>}
                  </Row>
                  <Row label="Speed">
                    {trip.speed_kmh != null ? `${Math.round(trip.speed_kmh)} km/h now` : 'Not moving or no reading'}
                    {trip.recent_average_speed_kmh != null && (
                      <span className="text-[#5e7266]"> · {Math.round(trip.recent_average_speed_kmh)} km/h last 5 min</span>
                    )}
                  </Row>
                  <Row label="Trip average">
                    {trip.trip_average_speed_kmh != null ? `${Math.round(trip.trip_average_speed_kmh)} km/h` : '-'}
                    {trip.distance_travelled_km != null && (
                      <span className="text-[#5e7266]"> · {trip.distance_travelled_km} km travelled</span>
                    )}
                  </Row>
                  <Row label="Last GPS">{ago(trip.last_seen_at)}</Row>
                  {trip.end_trip_available_at && (
                    <Row label="Can end from">{dayTime(trip.end_trip_available_at)}</Row>
                  )}
                </>
              )}
            </dl>

            <h3 className="mt-6 text-xs uppercase tracking-wider text-[#5e7266]">
              Passengers ({trip.passengers.length})
            </h3>
            {trip.passengers.length === 0 ? (
              <p className="mt-2 text-sm text-[#5e7266]">Nobody has booked this trip.</p>
            ) : (
              <ul className="mt-1">
                {trip.passengers.map((p, i) => <Passenger key={i} p={p} n={i + 1} />)}
              </ul>
            )}

            <div className="mt-6 rounded-lg bg-[#f4f6f3] px-3 py-3 text-xs text-[#3d4f45] grid gap-1.5">
              <p className="font-semibold text-[#13241b]">On the map</p>
              <p className="flex items-center gap-2"><span className="ops-pin ops-asked !w-4 !h-4 text-[9px]">1</span> Where the passenger asked to get out</p>
              <p className="flex items-center gap-2"><span className="ops-pin ops-actual !w-4 !h-4 text-[9px]">1</span> Where they actually got out</p>
              <p className="flex items-center gap-2"><span className="inline-block w-6 border-t-2 border-dashed border-[#c2410c]" /> More than 2 km apart</p>
              <p className="flex items-center gap-2"><span className="inline-block w-6 border-t-4 border-[#0b6e4f] rounded" /> The path the vehicle took</p>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

import { useParams } from 'react-router-dom'
import { Edit2, Copy, XCircle, Share2, Bus, User } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { ManifestList } from './components/ManifestList'
import { mockTrips } from '../../lib/mockData'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

export function TripDetailPage() {
  const { id } = useParams()
  const trip = mockTrips.find(t => t.id === id) ?? mockTrips[0]
  const pct = Math.round((trip.bookedSeats / trip.capacity) * 100)

  return (
    <div className="flex flex-col min-h-screen bg-primary-75">
      <TopBar title={trip.routeName} backHref="/trips" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
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
            <div className="bg-primary-75 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-200 mb-1">
                <Bus className="w-3.5 h-3.5" /> Vehicle
              </div>
              <p className="text-sm font-semibold text-primary-500">{trip.vehiclePlate}</p>
            </div>
            <div className="bg-primary-75 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-200 mb-1">
                <User className="w-3.5 h-3.5" /> Driver
              </div>
              <p className="text-sm font-semibold text-primary-500 truncate">{trip.driverName}</p>
            </div>
          </div>

          <div className="text-center py-4 border-y border-neutral-50 mb-4">
            <p className="text-5xl font-bold text-primary-500 stat-number">{trip.bookedSeats}</p>
            <p className="text-sm text-neutral-200 mt-1">of {trip.capacity} seats booked</p>
            <div className="h-2 bg-neutral-50 rounded-full mt-3 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  pct >= 90 ? 'bg-secondary-300' : pct >= 60 ? 'bg-warning' : 'bg-secondary-100',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs mt-2 px-2">
            <span className="text-neutral-200">Total Est. Revenue</span>
            <span className="font-bold text-secondary-300 text-sm stat-number">NGN {trip.grossRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Edit2, label: 'Edit', action: () => toast('Open edit') },
            { icon: Copy, label: 'Duplicate', action: () => toast('Trip duplicated') },
            { icon: Share2, label: 'Share', action: () => { navigator.clipboard.writeText('https://soole.ng/book/t1'); toast.success('Link copied!') } },
            { icon: XCircle, label: 'Cancel', action: () => toast.error('Cancel trip?'), danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              onClick={action}
              className={clsx(
                'flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-medium transition-colors',
                danger
                  ? 'text-danger-300 bg-danger-50 border-danger-100 hover:bg-danger-50'
                  : 'text-primary-400 bg-white border-neutral-50 hover:bg-primary-75',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="card">
          <ManifestList passengers={trip.passengers.length > 0 ? trip.passengers : []} />
        </div>
      </div>
    </div>
  )
}

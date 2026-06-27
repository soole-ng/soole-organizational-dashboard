import { Link } from 'react-router-dom'
import { Clock, Users, ArrowRight, MapPin } from 'lucide-react'
import { clsx } from 'clsx'
import { StatusPill } from '../../../components/ui/StatusPill'
import type { Trip } from '../../../types'
import { formatTime, formatMoney } from '../../../lib/formatters'

interface TripCardProps {
  trip: Trip
  compact?: boolean
}

const getDriverAvatar = (name: string) => {
  const avatars: Record<string, string> = {
    'Akin Bello': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'Chidi Okafor': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'Ibrahim Musa': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    'Funke Adeleke': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  }
  return avatars[name] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
}

function DriverAvatar({ name }: { name: string }) {
  return (
    <img
      src={getDriverAvatar(name)}
      alt={name}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-neutral-100/50"
    />
  )
}

export function TripCard({ trip, compact }: TripCardProps) {
  const seatsLeft = trip.capacity - trip.bookedSeats

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="card hover:shadow-card-hover transition-all duration-200 block hover:-translate-y-0.5 overflow-hidden p-0"
    >
      {/* Flat Header */}
      <div className="p-4 pb-3 bg-white border-b border-neutral-50">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Route */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 text-primary-300 flex-shrink-0" />
                <p className="text-xs font-bold text-primary-500 truncate">{trip.origin}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-neutral-200 flex-shrink-0" />
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 text-secondary-300 flex-shrink-0" />
                <p className="text-xs font-bold text-primary-500 truncate">{trip.destination}</p>
              </div>
            </div>
          </div>
          <span
            className="font-black uppercase tracking-wider font-sans"
            style={{
              fontSize: '12px',
              lineHeight: '1.2',
              color: trip.status === 'completed'
                ? '#00C853'
                : (trip.status === 'boarding' || trip.status === 'in_progress')
                ? '#FF5500'
                : trip.status === 'scheduled'
                ? '#0070FF'
                : '#9CA3AF'
            }}
          >
            {trip.status === 'boarding' ? 'Trip in Progress' : trip.status === 'in_progress' ? '' : trip.status}
          </span>
        </div>

        {/* Departure time + seats */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-neutral-200 font-medium">
            <Clock className="w-3 h-3" />
            {formatTime(trip.departureAt)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-200 font-medium">
            <Users className="w-3 h-3" />
            {trip.bookedSeats}/{trip.capacity} booked
          </span>
        </div>
      </div>

      {/* Body */}
      {!compact && (
        <div className="px-4 pb-4 pt-3 space-y-2 bg-white">
          {/* Driver + Revenue row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DriverAvatar name={trip.driverName} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-primary-500 truncate">{trip.driverName}</p>
                <p className="text-[10px] text-neutral-200">{trip.vehiclePlate}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black text-secondary-300">{formatMoney(trip.netRevenue)}</p>
              <p className="text-[9px] text-neutral-200">revenue</p>
            </div>
          </div>

          {/* Seats left — plain figure only */}
          <div className="flex items-center justify-end">
            <span className={clsx(
              'text-[10px] font-bold',
              seatsLeft === 0 ? 'text-secondary-300' : seatsLeft <= 2 ? 'text-warning' : 'text-neutral-200'
            )}>
              {seatsLeft === 0 ? 'Fully booked' : `${seatsLeft} seats left`}
            </span>
          </div>
        </div>
      )}
    </Link>
  )
}

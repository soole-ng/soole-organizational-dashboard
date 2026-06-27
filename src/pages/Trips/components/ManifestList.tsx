import { useState } from 'react'
import { Phone, CheckCircle2, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import type { Passenger } from '../../../types'
import { formatTime } from '../../../lib/formatters'
import toast from 'react-hot-toast'

interface ManifestListProps {
  passengers: Passenger[]
  /** The parent trip status — drives what actions are available */
  tripStatus: string
}

/**
 * Map passenger names to realistic AI-generated portrait photos.
 * Uses randomuser.me portraits (seeded by index slot for consistency).
 */
const FEMALE_PORTRAITS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/women/25.jpg',
  'https://randomuser.me/api/portraits/women/55.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
]
const MALE_PORTRAITS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/men/47.jpg',
  'https://randomuser.me/api/portraits/men/64.jpg',
  'https://randomuser.me/api/portraits/men/15.jpg',
  'https://randomuser.me/api/portraits/men/78.jpg',
]

// Female names detector (simple — checks common Nigerian female name patterns)
const FEMALE_NAMES = ['adaeze', 'halima', 'ngozi', 'funke', 'chioma', 'amaka', 'blessing', 'grace', 'mary', 'fatima']

function getPortrait(name: string, index: number): string {
  const firstName = name.split(' ')[0].toLowerCase()
  const isFemale = FEMALE_NAMES.some(f => firstName.startsWith(f) || firstName === f)
  const pool = isFemale ? FEMALE_PORTRAITS : MALE_PORTRAITS
  return pool[index % pool.length]
}

export function ManifestList({ passengers: initial, tripStatus }: ManifestListProps) {
  // Filter out pending-payment passengers — they don't appear in the manifest
  const [passengers, setPassengers] = useState(
    initial.filter(p => p.paymentStatus !== 'pending')
  )

  const isBoarding = tripStatus === 'boarding'
  const isCompleted = tripStatus === 'completed'
  const isScheduled = tripStatus === 'scheduled'

  const markBoarded = (id: string) => {
    setPassengers(p =>
      p.map(pass => pass.id === id
        ? { ...pass, boardingStatus: 'boarded' as const, boardedAt: new Date().toISOString() }
        : pass,
      ),
    )
    const pass = passengers.find(p => p.id === id)
    if (pass) toast.success(`${pass.name} marked as boarded`)
  }

  const processRefund = (id: string) => {
    setPassengers(p =>
      p.map(pass => pass.id === id
        ? { ...pass, paymentStatus: 'refunded' as const }
        : pass,
      ),
    )
    const pass = passengers.find(p => p.id === id)
    if (pass) toast.success(`Refund initiated for ${pass.name}`)
  }

  const boarded = passengers.filter(p => p.boardingStatus === 'boarded').length

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-primary-500">Passengers</h3>
        <span className="text-sm text-neutral-200">
          <span className="text-secondary-300 font-semibold">{boarded}</span>/{passengers.length} boarded
        </span>
      </div>

      {/* Contextual status note */}
      {isScheduled && (
        <p className="text-sm text-neutral-200 mb-3 px-0.5">
          Passengers on a scheduled trip can only pay. Boarding opens when the trip status changes to <span className="font-semibold text-primary-400">Boarding</span>.
        </p>
      )}
      {isBoarding && (
        <p className="text-sm text-secondary-300 font-medium mb-3 px-0.5">
          Boarding is open — tap the circle to mark a passenger as boarded.
        </p>
      )}

      {/* 2-column grid, each card is vertical */}
      <div className="grid grid-cols-2 gap-3">
        {passengers.map((pass, idx) => {
          const isPaid = pass.paymentStatus === 'paid'
          const isRefunded = pass.paymentStatus === 'refunded'
          const isBoarded = pass.boardingStatus === 'boarded'
          // Refundable: completed, paid, didn't board
          const canRefund = isCompleted && isPaid && !isBoarded
          const portrait = getPortrait(pass.name, idx)

          return (
            <div
              key={pass.id}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-neutral-100 bg-white text-center transition-colors"
            >
              {/* AI portrait photo */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-100 flex-shrink-0">
                <img
                  src={portrait}
                  alt={pass.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Name + status */}
              <div className="w-full min-w-0">
                <p className="text-base font-semibold text-primary-500 truncate">{pass.name}</p>
                <p className={clsx(
                  'text-sm font-medium mt-0.5',
                  isRefunded ? 'text-neutral-300' : 'text-secondary-300',
                )}>
                  {isRefunded ? 'Refunded' : 'Paid'}
                </p>
                {isBoarded && pass.boardedAt && (
                  <p className="text-sm text-neutral-200 mt-0.5">Boarded {formatTime(pass.boardedAt)}</p>
                )}
                {isCompleted && isPaid && !isBoarded && !isRefunded && (
                  <p className="text-sm text-orange-400 mt-0.5">Did not board</p>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 mt-auto">
                {/* Call */}
                {!isRefunded && (
                  <a
                    href={`tel:${pass.phone}`}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-neutral-100 text-primary-400 hover:bg-primary-100 transition-colors"
                    aria-label={`Call ${pass.name}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}

                {/* Status / action */}
                {isBoarded ? (
                  <div className="w-9 h-9 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-secondary-300" />
                  </div>
                ) : canRefund ? (
                  <button
                    onClick={() => processRefund(pass.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-500 text-sm font-semibold hover:bg-orange-100 transition-colors"
                    aria-label={`Process refund for ${pass.name}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refund
                  </button>
                ) : isBoarding ? (
                  <button
                    onClick={() => markBoarded(pass.id)}
                    className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-400 transition-colors active:scale-95"
                    aria-label={`Mark ${pass.name} as boarded`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </button>
                ) : isScheduled ? (
                  <span className="text-xs text-neutral-200 font-medium text-center leading-tight">Awaiting<br/>boarding</span>
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-100" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

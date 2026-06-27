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

/** Generate a DiceBear face avatar URL based on name seed */
function faceAvatar(name: string): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/8.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
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
        <h3 className="text-sm font-semibold text-primary-500">Passengers</h3>
        <span className="text-xs text-neutral-200">
          <span className="text-secondary-300 font-semibold">{boarded}</span>/{passengers.length} boarded
        </span>
      </div>

      {/* Contextual status note */}
      {isScheduled && (
        <p className="text-[11px] text-neutral-200 mb-3 px-0.5">
          Passengers on a scheduled trip can only pay. Boarding opens when the trip status changes to <span className="font-semibold text-primary-400">Boarding</span>.
        </p>
      )}
      {isBoarding && (
        <p className="text-[11px] text-secondary-300 font-medium mb-3 px-0.5">
          Boarding is open — tap the circle to mark a passenger as boarded.
        </p>
      )}

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-3">
        {passengers.map(pass => {
          const isPaid = pass.paymentStatus === 'paid'
          const isRefunded = pass.paymentStatus === 'refunded'
          const isBoarded = pass.boardingStatus === 'boarded'
          // Refundable: completed, paid, didn't board
          const canRefund = isCompleted && isPaid && !isBoarded

          return (
            <div
              key={pass.id}
              className={clsx(
                'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors text-center',
                isBoarded
                  ? 'bg-success-light border-secondary-100'
                  : isRefunded
                  ? 'bg-neutral-50 border-neutral-100'
                  : 'bg-white border-neutral-100',
              )}
            >
              {/* Face avatar */}
              <div className={clsx(
                'w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0',
                isBoarded ? 'border-secondary-200' : 'border-neutral-100',
              )}>
                <img
                  src={faceAvatar(pass.name)}
                  alt={pass.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Name */}
              <div className="w-full min-w-0">
                <p className="text-xs font-semibold text-primary-500 truncate">{pass.name}</p>
                <p className={clsx(
                  'text-[10px] font-medium mt-0.5',
                  isRefunded ? 'text-neutral-300' : 'text-secondary-300',
                )}>
                  {isRefunded ? 'Refunded' : 'Paid'}
                </p>
                {isBoarded && pass.boardedAt && (
                  <p className="text-[10px] text-neutral-200 mt-0.5">Boarded {formatTime(pass.boardedAt)}</p>
                )}
                {isCompleted && isPaid && !isBoarded && !isRefunded && (
                  <p className="text-[10px] text-orange-400 mt-0.5">Did not board</p>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-1.5 mt-auto">
                {/* Call */}
                {!isRefunded && (
                  <a
                    href={`tel:${pass.phone}`}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-neutral-100 text-primary-400 hover:bg-primary-100 transition-colors"
                    aria-label={`Call ${pass.name}`}
                  >
                    <Phone className="w-3 h-3" />
                  </a>
                )}

                {/* Status / action */}
                {isBoarded ? (
                  <div className="w-7 h-7 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-secondary-300" />
                  </div>
                ) : canRefund ? (
                  <button
                    onClick={() => processRefund(pass.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-500 text-[10px] font-semibold hover:bg-orange-100 transition-colors"
                    aria-label={`Process refund for ${pass.name}`}
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Refund
                  </button>
                ) : isBoarding ? (
                  <button
                    onClick={() => markBoarded(pass.id)}
                    className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-400 transition-colors active:scale-95"
                    aria-label={`Mark ${pass.name} as boarded`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : isScheduled ? (
                  // Scheduled — boarding not open yet, show nothing actionable
                  <span className="text-[9px] text-neutral-200 font-medium text-center leading-tight">Awaiting<br/>boarding</span>
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-neutral-100" />
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

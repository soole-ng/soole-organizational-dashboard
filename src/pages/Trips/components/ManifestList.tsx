import { useState } from 'react'
import { Phone, CheckCircle2, RefreshCw, Ban } from 'lucide-react'
import { clsx } from 'clsx'
import type { Passenger } from '../../../types'
import { formatTime } from '../../../lib/formatters'
import toast from 'react-hot-toast'

interface ManifestListProps {
  passengers: Passenger[]
  /** The parent trip status — drives what actions are available */
  tripStatus: string
}

/** Generate a DiceBear avatar URL based on name seed */
function faceAvatar(name: string): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/8.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export function ManifestList({ passengers: initial, tripStatus }: ManifestListProps) {
  const [passengers, setPassengers] = useState(initial)

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

  // Only paid passengers count as booked
  const paidPassengers = passengers.filter(p => p.paymentStatus === 'paid' || p.paymentStatus === 'refunded')
  const boarded = passengers.filter(p => p.boardingStatus === 'boarded').length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary-500">Passengers</h3>
        <span className="text-xs text-neutral-200">
          <span className="text-secondary-300 font-semibold">{boarded}</span>/{paidPassengers.length} boarded
        </span>
      </div>

      <div className="space-y-2">
        {passengers.map(pass => {
          const isPaid = pass.paymentStatus === 'paid'
          const isPending = pass.paymentStatus === 'pending'
          const isRefunded = pass.paymentStatus === 'refunded'
          const isBoarded = pass.boardingStatus === 'boarded'
          const isNoShow = !isBoarded && (isCompleted || pass.boardingStatus === 'no_show')
          // Refundable: completed trip, paid, didn't board
          const canRefund = isCompleted && isPaid && !isBoarded

          return (
            <div
              key={pass.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-2xl border transition-colors',
                isBoarded
                  ? 'bg-success-light border-secondary-100'
                  : isRefunded
                  ? 'bg-neutral-50 border-neutral-100'
                  : isPending
                  ? 'bg-orange-50/40 border-orange-100'
                  : 'bg-white border-neutral-50',
              )}
            >
              {/* Face avatar */}
              <div className={clsx(
                'w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2',
                isBoarded ? 'border-secondary-200' : isPending ? 'border-orange-200' : 'border-neutral-100',
              )}>
                <img
                  src={faceAvatar(pass.name)}
                  alt={pass.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'text-sm font-semibold truncate',
                  isPending ? 'text-neutral-300' : 'text-primary-500',
                )}>
                  {pass.name}
                  {isPending && <span className="ml-1 text-[10px] font-normal text-orange-400">(not booked — payment pending)</span>}
                  {isRefunded && <span className="ml-1 text-[10px] font-normal text-neutral-300">(refunded)</span>}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-neutral-200 flex-wrap">
                  <span className={clsx(
                    'font-medium',
                    isRefunded ? 'text-neutral-300' : isPaid ? 'text-secondary-300' : 'text-orange-400',
                  )}>
                    {isRefunded ? 'Refunded' : isPaid ? 'Paid' : 'Payment pending'}
                  </span>
                  {isBoarded && pass.boardedAt && (
                    <span>· Boarded {formatTime(pass.boardedAt)}</span>
                  )}
                  {isNoShow && isPaid && !isRefunded && (
                    <span className="text-orange-400">· Did not board</span>
                  )}
                </div>
              </div>

              {/* Call button — only for paid */}
              {isPaid && !isRefunded && (
                <a
                  href={`tel:${pass.phone}`}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-primary-400 hover:bg-primary-100 transition-colors flex-shrink-0"
                  aria-label={`Call ${pass.name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Right action */}
              {isBoarded ? (
                // Already boarded — green tick
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-secondary-300" />
                </div>
              ) : canRefund ? (
                // Completed trip, paid, didn't board → Refund button
                <button
                  onClick={() => processRefund(pass.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-500 text-[11px] font-semibold hover:bg-orange-100 transition-colors flex-shrink-0"
                  aria-label={`Process refund for ${pass.name}`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Refund
                </button>
              ) : isPending ? (
                // Pending payment → cannot board
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <Ban className="w-4 h-4 text-orange-300" />
                </div>
              ) : isBoarding && isPaid ? (
                // Active boarding session — show board button
                <button
                  onClick={() => markBoarded(pass.id)}
                  className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center hover:bg-primary-400 transition-colors active:scale-95 flex-shrink-0"
                  aria-label={`Mark ${pass.name} as boarded`}
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </button>
              ) : isRefunded ? null : (
                // Scheduled / other — waiting, show nothing interactive
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-100" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pending-payment note */}
      {passengers.some(p => p.paymentStatus === 'pending') && (
        <p className="text-[11px] text-orange-400 mt-3 px-1">
          ⚠ Passengers with pending payment are not counted as booked and cannot board.
        </p>
      )}
    </div>
  )
}

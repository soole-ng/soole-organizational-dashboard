import { useState } from 'react'
import { Phone, CheckCircle2, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import type { Passenger } from '../../../types'
import { formatTime } from '../../../lib/formatters'
import toast from 'react-hot-toast'

interface ManifestListProps {
  passengers: Passenger[]
}

export function ManifestList({ passengers: initial }: ManifestListProps) {
  const [passengers, setPassengers] = useState(initial)

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

  const boarded = passengers.filter(p => p.boardingStatus === 'boarded').length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary-500">Passengers</h3>
        <span className="text-xs text-neutral-200">
          <span className="text-secondary-300 font-semibold">{boarded}</span>/{passengers.length} boarded
        </span>
      </div>

      <div className="space-y-2">
        {passengers.map(pass => (
          <div
            key={pass.id}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-2xl border transition-colors',
              pass.boardingStatus === 'boarded'
                ? 'bg-success-light border-secondary-100'
                : 'bg-white border-neutral-50',
            )}
          >
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              pass.boardingStatus === 'boarded' ? 'bg-secondary-300 text-white' : 'bg-white text-primary-400',
            )}>
              {pass.seatNumber}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-500 truncate">{pass.name}</p>
              <div className="flex items-center gap-2 text-[11px] text-neutral-200">
                <span className={clsx(
                  'font-medium',
                  pass.paymentStatus === 'paid' ? 'text-secondary-300' : 'text-accent-400',
                )}>
                  {pass.paymentStatus === 'paid' ? 'Paid' : 'Pending payment'}
                </span>
                {pass.boardingStatus === 'boarded' && pass.boardedAt && (
                  <span className="flex items-center gap-0.5">
                    · Boarded {formatTime(pass.boardedAt)}
                  </span>
                )}
              </div>
            </div>

            <a
              href={`tel:${pass.phone}`}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-primary-400 hover:bg-primary-100 transition-colors flex-shrink-0"
              aria-label={`Call ${pass.name}`}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>

            {pass.boardingStatus === 'boarded' ? (
              <div className="w-9 h-9 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-secondary-300" />
              </div>
            ) : (
              <button
                onClick={() => markBoarded(pass.id)}
                className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center hover:bg-primary-400 transition-colors active:scale-95 flex-shrink-0"
                aria-label={`Mark ${pass.name} as boarded`}
              >
                <Clock className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

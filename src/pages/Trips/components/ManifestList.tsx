import { useState } from 'react'
import { Phone, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { Passenger } from '../../../types'
import { formatTime } from '../../../lib/formatters'
import { requestRefund } from '../../../lib/refundApi'
import { organizationApi } from '../../../api/client'
import toast from 'react-hot-toast'
import { useOrg } from '../../../lib/OrgContext'

interface ManifestListProps {
  passengers: Passenger[]
  /** The parent trip status — drives what actions are available */
  tripStatus: string
  /** Trip ID — sent to backend on refund request */
  tripId: string
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

export function ManifestList({ passengers: initial, tripStatus, tripId }: ManifestListProps) {
  const { guardAction } = useOrg()
  // Filter out pending-payment passengers — they don't appear in the manifest
  const [passengers, setPassengers] = useState(
    initial.filter(p => p.paymentStatus !== 'pending')
  )

  // boarding and in_progress are the same — driver has started the trip
  const isBoarding = tripStatus === 'boarding' || tripStatus === 'in_progress'
  const isCompleted = tripStatus === 'completed'
  const isScheduled = tripStatus === 'scheduled'

  const [boardingIds, setBoardingIds] = useState<Set<string>>(new Set())

  const markBoarded = (id: string) => {
    guardAction(undefined, async () => {
      const orgUuid = localStorage.getItem('org_uuid')
      const pass = passengers.find(p => p.id === id)
      if (!pass || !orgUuid) return

      setBoardingIds(prev => new Set(prev).add(id))
      try {
        await organizationApi.boardPassenger(orgUuid, tripId, id)
        setPassengers(p =>
          p.map(pa => pa.id === id
            ? { ...pa, boardingStatus: 'boarded' as const, boardedAt: new Date().toISOString() }
            : pa,
          ),
        )
        toast.success(`${pass.name} marked as boarded`)
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to mark passenger as boarded')
      } finally {
        setBoardingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    })
  }

  const [refunding, setRefunding] = useState<string | null>(null)

  const processRefund = async (id: string) => {
    guardAction(undefined, async () => {
      const pass = passengers.find(p => p.id === id)
      if (!pass) return
      setRefunding(id)
      try {
        await requestRefund({
          tripId,
          passengerId: pass.id,
          passengerName: pass.name,
          amount: pass.fare ?? 0,
          reason: 'Did not board — refund requested by operator',
        })
        setPassengers(p =>
          p.map(pa => pa.id === id ? { ...pa, paymentStatus: 'refunded' as const } : pa)
        )
        toast.success(`Refund initiated for ${pass.name}`)
      } catch (err: any) {
        toast.error(err?.message ?? 'Refund request failed. Please try again.')
      } finally {
        setRefunding(null)
      }
    })
  }

  const boarded = passengers.filter(p => p.boardingStatus === 'boarded').length

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-primary-500">Passengers</h3>
        {/* Boarded count only relevant once boarding has started or is done */}
        {(isBoarding || isCompleted) && (
          <span className="text-sm text-neutral-200">
            <span className="text-secondary-300 font-semibold">{boarded}</span>/{passengers.length} boarded
          </span>
        )}
      </div>

      {/* Contextual status note */}
      {isScheduled && (
        <p className="text-sm text-neutral-200 mb-3 px-0.5">
          Passengers can pay to secure their seat. Boarding will open when the driver departs.
        </p>
      )}
      {isBoarding && (
        <p className="text-sm text-neutral-200 mb-3 px-0.5">
          Passengers confirmed from the system are shown below. Tap the circle to mark anyone not yet boarded.
        </p>
      )}

      {/* Responsive grid — 2 columns on mobile, 3 columns on larger screens */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {passengers.map((pass, idx) => {
          const isPaid = pass.paymentStatus === 'paid'
          const isRefunded = pass.paymentStatus === 'refunded'
          const isBoarded = pass.boardingStatus === 'boarded'
          // Green check shows if they've boarded, or if they paid and the trip is scheduled
          const showCheck = isBoarded || (isScheduled && isPaid)
          // Refundable: completed, paid, didn't board
          const canRefund = isCompleted && isPaid && !isBoarded
          const portrait = getPortrait(pass.name, idx)

          return (
            <div
              key={pass.id}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-neutral-100 bg-white text-center transition-colors"
            >
              {/* AI portrait photo */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 flex-shrink-0">
                <img
                  src={portrait}
                  alt={pass.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Name + status */}
              <div className="w-full min-w-0">
                <p className="text-base font-semibold text-primary-500 leading-tight">{pass.name}</p>
                <p className={clsx(
                  'text-sm font-medium mt-0.5',
                  isRefunded ? 'text-neutral-300' : 'text-secondary-300',
                )}>
                  {isRefunded ? 'Refunded' : 'Paid'}
                </p>
                {isBoarded && pass.boardedAt && (isBoarding || isCompleted) && (
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
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-300 hover:border-primary-200 hover:text-primary-400 transition-colors"
                    aria-label={`Call ${pass.name}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}

                {/* Status / action */}
                {showCheck ? (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
                  </div>
                ) : canRefund ? (
                  <button
                    onClick={() => processRefund(pass.id)}
                    disabled={refunding === pass.id}
                    className="flex items-center justify-center md:justify-start gap-1.5 w-9 h-9 md:w-auto md:px-3 md:py-1.5 rounded-full md:rounded-lg bg-orange-50 border border-orange-200 text-orange-500 text-sm font-semibold hover:bg-orange-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label={`Process refund for ${pass.name}`}
                  >
                    {refunding === pass.id
                      ? <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" />
                      : <RefreshCw className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    }
                    <span className="hidden md:inline">
                      {refunding === pass.id ? 'Sending…' : 'Refund'}
                    </span>
                  </button>
                ) : isBoarding ? (
                  <button
                    onClick={() => markBoarded(pass.id)}
                    disabled={boardingIds.has(pass.id)}
                    className="w-9 h-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:border-secondary-300 hover:bg-secondary-50 transition-colors active:scale-95 disabled:opacity-60"
                    aria-label={`Mark ${pass.name} as boarded`}
                  >
                    {boardingIds.has(pass.id)
                      ? <Loader2 className="w-4 h-4 text-neutral-300 animate-spin" />
                      : <CheckCircle2 className="w-5 h-5 text-neutral-300" strokeWidth={1.2} />
                    }
                  </button>
                ) : (
                  // Scheduled or in_progress — no action available
                  <div className="w-9 h-9" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

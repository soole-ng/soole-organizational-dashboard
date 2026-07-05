import { useRef } from 'react'
import { X, Star, MapPin, Hash, User } from 'lucide-react'
import { DriverAvatar } from '../../../components/ui/DriverAvatar'
import { StarRating } from '../../../components/ui/StarRating'

interface DriverDetailModalProps {
  selectedDriver: any
  onClose: () => void
}

export function DriverDetailModal({ selectedDriver, onClose }: DriverDetailModalProps) {
  const reviewScrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-float flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-100 flex-shrink-0">
          <DriverAvatar photoUrl={selectedDriver.photo} name={selectedDriver.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-black truncate">{selectedDriver.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={selectedDriver.avgRating} size="md" />
              <span className="text-sm font-bold text-black">
                {selectedDriver.avgRating > 0 ? `${selectedDriver.avgRating.toFixed(1)} / 5.0` : 'No rating yet'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-neutral-50 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-neutral-100 flex-shrink-0">
          {[
            { label: 'Avg Rating', value: selectedDriver.avgRating > 0 ? selectedDriver.avgRating.toFixed(1) : '—' },
            { label: 'Trips Done', value: selectedDriver.tripsCompleted },
            { label: 'Reviews', value: selectedDriver.reviews?.length ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-neutral-100">
              <p className="text-3xl font-black text-black stat-number">{s.value}</p>
              <p className="text-xs text-black mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
            <p className="text-sm font-bold text-black uppercase tracking-wider">
              Passenger Comments
              {selectedDriver.reviews?.length > 0 && (
                <span className="ml-2 text-[10px] font-bold text-primary-400 normal-case tracking-normal">
                  ({selectedDriver.reviews.length})
                </span>
              )}
            </p>
            {selectedDriver.reviews?.length > 2 && (
              <button
                onClick={() => reviewScrollRef.current?.scrollBy({ top: 220, behavior: 'smooth' })}
                className="text-[10px] font-semibold text-primary-400 flex items-center gap-1 hover:text-primary-500 transition-colors"
              >
                Scroll ↓
              </button>
            )}
          </div>

          <div
            ref={reviewScrollRef}
            className="flex-1 overflow-y-auto px-6 pb-4 space-y-3"
            style={{ scrollBehavior: 'smooth' }}
          >
            {!selectedDriver.reviews || selectedDriver.reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
                <Star className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-black">No comments yet</p>
                <p className="text-xs text-black mt-1">Reviews appear after completed trips.</p>
              </div>
            ) : (
              selectedDriver.reviews.map((rev: any) => (
                <div key={rev.id} className="bg-white rounded-2xl p-4 border border-neutral-100">
                  {rev.tripRoute && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5 text-[10px] text-primary-400 font-semibold">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{rev.tripRoute}</span>
                      </div>
                      {rev.tripId && (
                        <span className="flex items-center gap-0.5 text-[10px] text-neutral-200 font-mono">
                          <Hash className="w-2.5 h-2.5" />{rev.tripId}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-400" />
                      </div>
                      <p className="text-sm font-bold text-black">{rev.passengerName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating rating={rev.rating} size="sm" />
                      <span className="text-xs font-bold text-black">{rev.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-black leading-relaxed">"{rev.comment}"</p>
                  <p className="text-[10px] text-neutral-200 text-right mt-2">{rev.date}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

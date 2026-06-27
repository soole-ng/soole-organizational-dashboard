import { MessageSquare, User, Star } from 'lucide-react'

interface CommentsModalProps {
  trip: any
  data: any
  onClose: () => void
}

export function CommentsModal({ trip, data, onClose }: CommentsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg mx-4 rounded-3xl shadow-float flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <div>
            <h2 className="text-sm font-bold text-primary-500">Comments & Ratings</h2>
            <p className="text-[11px] text-neutral-200">{trip.routeName} &middot; Passenger Feedback</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors text-lg font-light"
            aria-label="Close"
          >&#x2715;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-neutral-50/50">
          {(() => {
            const driverObj = data.drivers?.find((d: any) => d.id === trip.driverId)
            const tripReviews = driverObj?.reviews?.filter((r: any) => 
              r.tripId?.toLowerCase() === trip.id?.toLowerCase() || 
              (trip.id === 't4' && r.tripId === 'T-004')
            ) ?? []

            const avgRating = tripReviews.length > 0
              ? (tripReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / tripReviews.length).toFixed(1)
              : 'N/A'

            return (
              <div className="space-y-4">
                {trip.status === 'completed' && (
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div className="bg-white p-3.5 rounded-2xl border border-neutral-100 text-center shadow-sm">
                      <p className="text-xl font-extrabold text-primary-500 stat-number">{avgRating}</p>
                      <p className="text-[9px] text-neutral-200 uppercase font-bold mt-0.5">Avg Rating</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-neutral-100 text-center shadow-sm">
                      <p className="text-xl font-extrabold text-primary-500 stat-number">{driverObj?.tripsCompleted || 0}</p>
                      <p className="text-[9px] text-neutral-200 uppercase font-bold mt-0.5">Trips Done</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-neutral-100 text-center shadow-sm">
                      <p className="text-xl font-extrabold text-primary-500 stat-number">{tripReviews.length}</p>
                      <p className="text-[9px] text-neutral-200 uppercase font-bold mt-0.5">Reviews</p>
                    </div>
                  </div>
                )}

                {tripReviews.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
                    <Star className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-black">No passenger comments yet</p>
                    <p className="text-xs text-neutral-200 mt-1">Reviews appear after completed trips.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tripReviews.map((rev: any) => (
                      <div key={rev.id} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center flex-shrink-0 border border-neutral-100">
                              <User className="w-4 h-4 text-primary-400" />
                            </div>
                            <p className="text-sm font-bold text-black">{rev.passengerName}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-primary-75/40 px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-black">{rev.rating}</span>
                          </div>
                        </div>

                        <p className="text-xs text-black leading-relaxed mt-1.5">"{rev.comment}"</p>
                        <p className="text-[9px] text-neutral-200 text-right mt-2">{rev.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

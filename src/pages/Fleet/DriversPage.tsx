import { useState, useRef } from 'react'
import { Plus, Phone, Car, Star, Award, X, User, MapPin, Hash } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState } from '../../components/ui/EmptyState'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useMockData } from '../../lib/useMockData'
import { Users } from 'lucide-react'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import toast from 'react-hot-toast'

const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const filled = Math.round(rating)
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={clsx(cls, i <= filled ? 'text-accent fill-accent' : 'text-neutral-100 fill-neutral-100')}
        />
      ))}
    </div>
  )
}

/** Generic avatar — placeholder until real profile images are added */
function GenericAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-11 h-11' : 'w-8 h-8'
  const iconClass = size === 'lg' ? 'w-9 h-9' : size === 'md' ? 'w-6 h-6' : 'w-4 h-4'
  return (
    <div className={clsx('rounded-full bg-white flex items-center justify-center flex-shrink-0', sizeClass)}>
      <User className={clsx('text-primary-400', iconClass)} />
    </div>
  )
}

export function DriversPage() {
  const { data, loading } = useMockData()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const reviewScrollRef = useRef<HTMLDivElement>(null)

  const filtered = data.drivers.filter(d => filter === 'all' || d.status === filter)
  const verified = data.drivers.filter(d => d.status === 'verified').length
  const totalTrips = data.drivers.reduce((a, d) => a + d.tripsCompleted, 0)
  const avgRating = data.drivers.filter(d => (d.avgRating ?? 0) > 0)
    .reduce((a, d, _, arr) => a + (d.avgRating ?? 0) / arr.length, 0)

  const handleInvite = () => {
    if (!form.name || !form.phone) return
    setShowAddSheet(false)
    setForm({ name: '', phone: '' })
    toast.success(`Invite sent to ${form.name}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <TopBar title="Drivers" backHref="/fleet" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-neutral-100 rounded-card" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Drivers" backHref="/fleet" />

      {/* Summary strip */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3 grid grid-cols-3 gap-3 lg:hidden">
        <div className="text-center">
          <p className="text-base font-black text-black">{verified}</p>
          <p className="text-[10px] text-black">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-black">{totalTrips}</p>
          <p className="text-[10px] text-black">Total Trips</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-black">{avgRating > 0 ? avgRating.toFixed(1) : '—'}★</p>
          <p className="text-[10px] text-black">Avg Rating</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="bg-white border-b border-neutral-100 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                filter === f.value
                  ? 'bg-[#042011] text-white border-[#042011]'
                  : 'bg-white text-black border-neutral-100 hover:border-primary-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 max-w-5xl mx-auto w-full">
        <DesktopPageHeader
          title="Drivers"
          subtitle={`${filtered.length} drivers · ${verified} verified · Avg ${avgRating > 0 ? avgRating.toFixed(1) : '—'}★`}
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No drivers yet"
            description="Invite your first driver by phone number."
            action={{ label: '+ Invite Driver', onClick: () => setShowAddSheet(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(driver => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                className="bg-white rounded-card border border-neutral-100 shadow-card hover:shadow-card-hover transition-all cursor-pointer overflow-hidden"
              >
                {/* Header — dark green, 40% transparent */}
                <div className="bg-[#042011]/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#042011]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold !text-white truncate">{driver.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating rating={driver.avgRating ?? 0} />
                        <span className="text-[10px] font-bold !text-white/80">
                          {(driver.avgRating ?? 0) > 0 ? (driver.avgRating ?? 0).toFixed(1) : 'No rating'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="font-black uppercase tracking-wider font-sans"
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.2',
                      color: driver.status === 'verified' ? '#00C853' : driver.status === 'pending' ? '#FF5500' : '#9CA3AF'
                    }}
                  >
                    {driver.status}
                  </span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-black">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>
                    {driver.vehiclePlate && (
                      <span className="flex items-center gap-1 ml-auto"><Car className="w-3 h-3" />{driver.vehiclePlate}</span>
                    )}
                  </div>

                  {/* Trips completed — plain number only */}
                  <div className="flex justify-between text-[10px]">
                    <span className="text-black">Trips completed</span>
                    <span className="font-bold text-black">{driver.tripsCompleted}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    {(driver.reviews?.length ?? 0) > 0 ? (
                      <span className="flex items-center gap-1 text-[10px] text-black font-semibold">
                        <Award className="w-3 h-3" />
                        {driver.reviews!.length} review{driver.reviews!.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-black">No reviews yet</span>
                    )}
                    <div className="flex items-center gap-2">
                      {driver.status === 'pending' && (
                        <button
                          onClick={e => { e.stopPropagation(); toast.success(`Invite resent to ${driver.name}`) }}
                          className="text-[10px] text-secondary-300 font-bold border border-secondary-300 rounded-lg px-2 py-1"
                        >
                          Resend invite
                        </button>
                      )}
                      <a
                        href={`tel:${driver.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-primary-400 hover:bg-primary-500 hover:text-white transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add driver"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Driver Detail Modal (full-page overlay) ── */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-float flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-100 flex-shrink-0">
              <GenericAvatar size="lg" />
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
                onClick={() => setSelectedDriver(null)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-neutral-50 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats row */}
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

            {/* Scrollable comments */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header row with scroll hint */}
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
                      {/* Trip route + ID */}
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

                      {/* Passenger + rating */}
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
      )}

      {/* Invite Sheet */}
      <BottomSheet open={showAddSheet} onClose={() => setShowAddSheet(false)} title="Invite a Driver">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Driver's Name</label>
            <input className="input-field" placeholder="e.g. Akin Bello" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Phone Number</label>
            <input className="input-field" type="tel" placeholder="+234 803 123 4567" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <p className="text-xs text-black bg-white rounded-xl p-3 leading-relaxed border border-neutral-100">
            {form.name || 'The driver'} will receive an SMS to download the Soole driver app and complete verification.
          </p>
          <button onClick={handleInvite} disabled={!form.name || !form.phone} className="btn-primary w-full">Send Invite</button>
        </div>
      </BottomSheet>
    </div>
  )
}

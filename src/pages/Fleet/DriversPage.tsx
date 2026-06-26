import { useState } from 'react'
import { Plus, Phone, Car, Star, Award } from 'lucide-react'
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

const avatarColors = [
  'bg-secondary-300', 'bg-teal-400', 'bg-info-300', 'bg-accent',
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

function DriverAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const color = avatarColors[name.charCodeAt(0) % avatarColors.length]
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-base' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={clsx('rounded-full flex items-center justify-center text-white font-black flex-shrink-0', sizeClass, color)}>
      {initials}
    </div>
  )
}

export function DriversPage() {
  const { data, loading } = useMockData()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })

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
      <div className="flex flex-col min-h-screen bg-primary-75 animate-pulse">
        <TopBar title="Drivers" backHref="/fleet" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-card" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary-75">
      <TopBar title="Drivers" backHref="/fleet" />

      {/* Summary strip */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3 grid grid-cols-3 gap-3 lg:hidden">
        <div className="text-center">
          <p className="text-base font-black text-secondary-300">{verified}</p>
          <p className="text-[10px] text-neutral-200">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-primary-500">{totalTrips}</p>
          <p className="text-[10px] text-neutral-200">Total Trips</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-accent">{avgRating > 0 ? avgRating.toFixed(1) : '—'}★</p>
          <p className="text-[10px] text-neutral-200">Avg Rating</p>
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
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-200 border-neutral-100 hover:border-primary-400',
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
            {filtered.map(driver => {
              const tripTarget = 200
              const progress = Math.min((driver.tripsCompleted / tripTarget) * 100, 100)
              return (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className="bg-white rounded-card border border-neutral-100 shadow-card hover:shadow-card-hover transition-all cursor-pointer overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-primary-75 px-4 py-3 flex items-start gap-3">
                    <DriverAvatar name={driver.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-bold text-primary-500 truncate">{driver.name}</p>
                        <StatusPill status={driver.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StarRating rating={driver.avgRating ?? 0} />
                        <span className="text-[10px] font-bold text-primary-400">
                          {(driver.avgRating ?? 0) > 0 ? (driver.avgRating ?? 0).toFixed(1) : 'No rating'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3 space-y-3">
                    <div className="flex items-center gap-3 text-[11px] text-neutral-200">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>
                      {driver.vehiclePlate && (
                        <span className="flex items-center gap-1 ml-auto"><Car className="w-3 h-3" />{driver.vehiclePlate}</span>
                      )}
                    </div>

                    {/* Trips progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-neutral-200">Trips completed</span>
                        <span className="font-bold text-primary-500">{driver.tripsCompleted}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', progress >= 60 ? 'bg-secondary-300' : 'bg-accent')}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                      {(driver.reviews?.length ?? 0) > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-accent font-semibold">
                          <Award className="w-3 h-3" />
                          {driver.reviews!.length} review{driver.reviews!.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-200">No reviews yet</span>
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
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-75 text-primary-400 hover:bg-primary-500 hover:text-white transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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

      {/* Reviews Bottom Sheet */}
      <BottomSheet open={!!selectedDriver} onClose={() => setSelectedDriver(null)} title={`${selectedDriver?.name ?? ''} — Reviews`}>
        {selectedDriver && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Avg Rating', value: selectedDriver.avgRating > 0 ? selectedDriver.avgRating.toFixed(1) : '—', color: 'text-accent' },
                { label: 'Trips Done', value: selectedDriver.tripsCompleted, color: 'text-primary-500' },
                { label: 'Reviews', value: selectedDriver.reviews?.length ?? 0, color: 'text-secondary-300' },
              ].map(s => (
                <div key={s.label} className="bg-primary-75 rounded-2xl p-3 text-center border border-neutral-100">
                  <p className={clsx('text-2xl font-black stat-number', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-neutral-200 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {selectedDriver.avgRating > 0 && (
              <div className="flex items-center gap-2 justify-center py-1">
                <StarRating rating={selectedDriver.avgRating} size="md" />
                <span className="text-sm font-bold text-primary-500">{selectedDriver.avgRating.toFixed(1)} / 5.0</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-bold text-primary-400 uppercase tracking-wider">Passenger Comments</p>
              {!selectedDriver.reviews || selectedDriver.reviews.length === 0 ? (
                <div className="text-center py-8 bg-primary-75 rounded-2xl border border-neutral-100">
                  <Star className="w-7 h-7 text-neutral-100 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-200">No comments yet</p>
                  <p className="text-[10px] text-neutral-200 mt-0.5">Reviews appear after completed trips.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {selectedDriver.reviews.map((rev: any) => (
                    <div key={rev.id} className="bg-primary-75 rounded-2xl p-3.5 border border-neutral-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary-300 flex items-center justify-center text-white text-[10px] font-black">
                            {rev.passengerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <p className="text-xs font-bold text-primary-500">{rev.passengerName}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarRating rating={rev.rating} />
                          <span className="text-[10px] font-bold text-accent">{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-200 leading-relaxed italic">"{rev.comment}"</p>
                      <p className="text-[9px] text-neutral-200 text-right mt-1">{rev.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Invite Sheet */}
      <BottomSheet open={showAddSheet} onClose={() => setShowAddSheet(false)} title="Invite a Driver">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Driver's Name</label>
            <input className="input-field" placeholder="e.g. Akin Bello" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Phone Number</label>
            <input className="input-field" type="tel" placeholder="+234 803 123 4567" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <p className="text-xs text-neutral-200 bg-primary-75 rounded-xl p-3 leading-relaxed border border-neutral-100">
            {form.name || 'The driver'} will receive an SMS to download the Soole driver app and complete verification.
          </p>
          <button onClick={handleInvite} disabled={!form.name || !form.phone} className="btn-primary w-full">Send Invite</button>
        </div>
      </BottomSheet>
    </div>
  )
}

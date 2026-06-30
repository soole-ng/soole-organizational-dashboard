import { useState, useRef } from 'react'
import { Plus, Phone, Award, Users } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMockData } from '../../lib/useMockData'
import { useOrg } from '../../lib/OrgContext'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import toast from 'react-hot-toast'
import { StarRating } from '../../components/ui/StarRating'
import { DriverAvatar, getDriverAvatar } from '../../components/ui/DriverAvatar'
import { InviteDriverModal } from './components/InviteDriverModal'
import { DriverDetailModal } from './components/DriverDetailModal'

const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]



export function DriversPage() {
  const { data, loading } = useMockData()
  const { guardAction } = useOrg()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)

  const filtered = data.drivers.filter(d => filter === 'all' || d.status === filter)
  const verified = data.drivers.filter(d => d.status === 'verified').length
  const totalTrips = data.drivers.reduce((a, d) => a + d.tripsCompleted, 0)
  const avgRating = data.drivers.filter(d => (d.avgRating ?? 0) > 0)
    .reduce((a, d, _, arr) => a + (d.avgRating ?? 0) / arr.length, 0)



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

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 max-w-7xl mx-auto w-full">
        <DesktopPageHeader
          title="Drivers"
          subtitle={`${filtered.length} drivers · ${verified} verified · Avg ${avgRating > 0 ? avgRating.toFixed(1) : '—'}★`}
          actions={
            <button
              onClick={(e) => guardAction(e, () => setShowAddSheet(true))}
              className="flex items-center gap-2 bg-[#042011] text-white font-semibold rounded-btn px-5 py-2.5 text-sm hover:bg-primary-400 transition-colors"
            >
              + Invite Driver
            </button>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No drivers yet"
            description="Invite your first driver by phone number."
            action={{ label: '+ Invite Driver', onClick: () => guardAction(undefined, () => setShowAddSheet(true)) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(driver => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                className="bg-white rounded-card border border-neutral-100 shadow-card hover:shadow-card-hover transition-all cursor-pointer overflow-hidden"
              >
                {/* Header — dark green, 40% transparent */}
                <div className="bg-[#042011]/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getDriverAvatar(driver.id)}
                      alt={driver.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/20"
                    />
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
                  <div className="flex items-center gap-3 text-xs text-black">
                    <span className="flex items-center gap-1 font-semibold"><Phone className="w-3.5 h-3.5" />{driver.phone}</span>
                  </div>

                  {/* Trips completed — plain number only */}
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-black font-semibold">Trips completed</span>
                    <span className="text-black">{driver.tripsCompleted}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    {(driver.reviews?.length ?? 0) > 0 ? (
                      <span className="flex items-center gap-1 text-sm text-black font-bold">
                        <Award className="w-3.5 h-3.5 text-accent-500" />
                        {driver.reviews!.length} review{driver.reviews!.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-black font-bold">No reviews yet</span>
                    )}
                    <div className="flex items-center gap-2">
                      {driver.status === 'pending' && (
                        <button
                          onClick={e => { e.stopPropagation(); guardAction(e, () => toast.success(`Invite resent to ${driver.name}`)) }}
                          className="text-[13px] text-secondary-300 font-bold border border-secondary-300 rounded-lg px-2 py-1"
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
        onClick={(e) => guardAction(e, () => setShowAddSheet(true))}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add driver"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Driver Detail Modal (full-page overlay) ── */}
      {selectedDriver && (
        <DriverDetailModal
          selectedDriver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
        />
      )}

      {/* Invite Center Dialog Popup */}
      {showAddSheet && (
        <InviteDriverModal onClose={() => setShowAddSheet(false)} />
      )}
    </div>
  )
}

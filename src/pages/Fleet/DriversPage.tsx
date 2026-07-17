import { useMemo, useState } from 'react'
import { Plus, Phone, Award, Users, RefreshCw, Loader2, X, Star } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { useApiData, invalidateApiDataCache } from '../../lib/useApiData'
import { useOrg } from '../../lib/OrgContext'
import { fleetApi, driversApi } from '../../api/client'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import { StarRating } from '../../components/ui/StarRating'
import { DriverAvatar } from '../../components/ui/DriverAvatar'
import { InviteDriverModal } from './components/InviteDriverModal'
import { DriverDetailModal } from './components/DriverDetailModal'
import toast from 'react-hot-toast'

const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]



export function DriversPage() {
  const { data, loading, refetch } = useApiData()
  const { guardAction, orgUuid, org } = useOrg()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [removingDriver, setRemovingDriver] = useState<{ id: string; name: string } | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [removeRating, setRemoveRating] = useState(0)
  const [removeSubmitting, setRemoveSubmitting] = useState(false)
  // Caps rendered driver cards instead of rendering all of them at once -
  // filtered can be up to 500 rows (useApiData's fetch cap), and unlike
  // TripsListPage this list previously had no pagination or windowing at
  // all.
  const [visibleCount, setVisibleCount] = useState(30)
  // Matches the backend's own gate (org_trip_api.py's suspend/reinstate
  // both require OWNER or ADMIN/"finance" role).
  const canChangeDriverStatus = org.role === 'owner' || org.role === 'finance'

  const resendInvite = (driverId: string, driverName: string) => {
    guardAction(undefined, async () => {
      if (!orgUuid) return
      setResendingId(driverId)
      try {
        const res = await fleetApi.resendInvite(orgUuid, driverId)
        toast.success(res.message ?? `Invite resent to ${driverName}`)
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to resend invite')
      } finally {
        setResendingId(null)
      }
    })
  }

  const removeDriver = (driverId: string, driverName: string) => {
    guardAction(undefined, () => {
      setRemoveReason('')
      setRemoveRating(0)
      setRemovingDriver({ id: driverId, name: driverName })
    })
  }

  const confirmRemoveDriver = async () => {
    if (!orgUuid || !removingDriver) return
    if (!removeReason.trim()) {
      toast.error('A reason is required to remove a driver')
      return
    }
    setRemoveSubmitting(true)
    try {
      await driversApi.removeDriver(orgUuid, removingDriver.id, removeReason.trim(), removeRating || undefined)
      toast.success(`${removingDriver.name} has been removed`)
      invalidateApiDataCache()
      refetch()
      setRemovingDriver(null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to remove driver')
    } finally {
      setRemoveSubmitting(false)
    }
  }

  const reinstateDriver = (driverId: string, driverName: string) => {
    guardAction(undefined, async () => {
      if (!orgUuid) return
      setStatusChangingId(driverId)
      try {
        await driversApi.reinstateDriver(orgUuid, driverId)
        toast.success(`${driverName} has been reinstated`)
        invalidateApiDataCache()
        refetch()
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to reinstate driver')
      } finally {
        setStatusChangingId(null)
      }
    })
  }

  // data.drivers can be up to 500 rows (useApiData's fetch cap) - these
  // were recomputed on every render (e.g. every keystroke in unrelated
  // modals) instead of only when drivers/filter actually change.
  const filtered = useMemo(
    () => data.drivers.filter(d => filter === 'all' || d.status === filter),
    [data.drivers, filter],
  )
  const { verified, totalTrips, avgRating } = useMemo(() => {
    const verified = data.drivers.filter(d => d.status === 'verified').length
    const totalTrips = data.drivers.reduce((a, d) => a + d.tripsCompleted, 0)
    const rated = data.drivers.filter(d => (d.avgRating ?? 0) > 0)
    const avgRating = rated.reduce((a, d, _, arr) => a + (d.avgRating ?? 0) / arr.length, 0)
    return { verified, totalTrips, avgRating }
  }, [data.drivers])



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
              onClick={() => { setFilter(f.value); setVisibleCount(30) }}
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
            {filtered.slice(0, visibleCount).map(driver => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                className="bg-white rounded-card border border-neutral-100 shadow-card hover:shadow-card-hover transition-all cursor-pointer overflow-hidden"
              >
                {/* Header — dark green, 40% transparent */}
                <div className="bg-[#042011]/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DriverAvatar photoUrl={driver.photo} name={driver.name} size="md" />
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
                      {driver.isPendingInvite && (
                        <button
                          onClick={e => { e.stopPropagation(); resendInvite(driver.id, driver.name) }}
                          disabled={resendingId === driver.id}
                          className="flex items-center gap-1 text-[13px] text-secondary-300 font-bold border border-secondary-300 rounded-lg px-2 py-1 disabled:opacity-60"
                        >
                          {resendingId === driver.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />
                          }
                          Resend
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

                  {canChangeDriverStatus && !driver.isPendingInvite && (
                    <div className="pt-1">
                      {driver.status === 'suspended' ? (
                        <button
                          onClick={e => { e.stopPropagation(); reinstateDriver(driver.id, driver.name) }}
                          disabled={statusChangingId === driver.id}
                          className="w-full text-xs text-secondary-300 font-bold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-secondary-300 hover:bg-secondary-50 transition-colors disabled:opacity-60"
                        >
                          {statusChangingId === driver.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); removeDriver(driver.id, driver.name) }}
                          disabled={statusChangingId === driver.id}
                          className="w-full text-xs text-red-500 font-bold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {statusChangingId === driver.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Remove Driver
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {visibleCount < filtered.length && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount(c => c + 30)}
              className="px-4 py-2 text-sm font-semibold text-primary-500 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
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

      {/* Remove Driver Modal — reason (required) + exit rating (optional) */}
      {removingDriver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card w-full max-w-md p-6 shadow-float relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setRemovingDriver(null)}
              className="absolute right-4 top-4 text-neutral-200 hover:text-primary-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-primary-500 mb-1">Remove {removingDriver.name}?</h3>
            <p className="text-xs text-neutral-200 mb-4">This permanently removes them from your driver roster and cannot be undone.</p>

            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Why are you removing this driver?</label>
            <textarea
              value={removeReason}
              onChange={e => setRemoveReason(e.target.value)}
              rows={3}
              autoFocus
              className="input-field bg-white resize-none"
              placeholder="e.g. Repeated no-shows, relocating, requested by driver…"
            />

            <label className="block text-xs font-semibold text-primary-400 mb-1.5 mt-4">
              Rate this driver's time with your company <span className="text-neutral-200 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRemoveRating(r => r === i ? 0 : i)}
                  aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
                  className="p-0.5"
                >
                  <Star
                    className={clsx('w-6 h-6 transition-colors', i <= removeRating ? 'text-accent fill-accent' : 'fill-white')}
                    style={i > removeRating ? { stroke: 'rgba(0, 0, 0, 0.4)' } : undefined}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setRemovingDriver(null)}
                disabled={removeSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveDriver}
                disabled={removeSubmitting || !removeReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-btn px-4 py-2.5 text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {removeSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {removeSubmitting ? 'Removing…' : 'Remove Driver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

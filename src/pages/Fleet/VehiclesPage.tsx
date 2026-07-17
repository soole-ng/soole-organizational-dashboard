import { useMemo, useState } from 'react'
import { Plus, History, Car, CheckCircle2, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useApiData, invalidateApiDataCache } from '../../lib/useApiData'
import { useOrg } from '../../lib/OrgContext'
import { vehiclesApi } from '../../api/client'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import { VehicleIcon, docStatusIcon } from '../../components/ui/VehicleIcons'
import { VehicleHistoryModal } from './components/VehicleHistoryModal'
const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Retired', value: 'retired' },
]



export function VehiclesPage() {
  const { data, loading, refetch } = useApiData()
  const { guardAction, orgUuid, org } = useOrg()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [historyVehicle, setHistoryVehicle] = useState<any | null>(null)
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; plate: string } | null>(null)
  // Caps rendered vehicle cards instead of rendering all of them at once -
  // filtered can be up to 500 rows (useApiData's fetch cap), and unlike
  // TripsListPage this list previously had no pagination or windowing.
  const [visibleCount, setVisibleCount] = useState(30)
  // Matches the backend's own gate (organization_vehicles_api.py's
  // delete_vehicle requires OWNER or ADMIN/"finance" role).
  const canChangeVehicleStatus = org.role === 'owner' || org.role === 'finance'

  const handleDeleteVehicle = (vehicleId: string, plate: string) => {
    setPendingDelete({ id: vehicleId, plate })
  }

  const confirmDeleteVehicle = async () => {
    if (!orgUuid || !pendingDelete) return
    setDeletingVehicleId(pendingDelete.id)
    try {
      await vehiclesApi.deleteVehicle(orgUuid, pendingDelete.id)
      toast.success('Vehicle deleted')
      invalidateApiDataCache()
      refetch()
      setPendingDelete(null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete vehicle')
    } finally {
      setDeletingVehicleId(null)
    }
  }


  // data.vehicles/data.trips can each be up to 500 rows (useApiData's
  // fetch cap) - these were recomputed on every render instead of only
  // when the underlying data/filter/selected vehicle actually change.
  const filtered = useMemo(
    () => data.vehicles.filter(v => filter === 'all' || v.status === filter),
    [data.vehicles, filter],
  )
  const { totalSeats, verified } = useMemo(() => ({
    totalSeats: data.vehicles.reduce((a, v) => a + v.capacity, 0),
    verified: data.vehicles.filter(v => v.status === 'verified').length,
  }), [data.vehicles])

  const vehicleTrips = useMemo(
    () => historyVehicle
      ? data.trips.filter((t: any) => t.vehicleId === historyVehicle.id)
      : [],
    [data.trips, historyVehicle],
  )

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <TopBar title="Vehicles" backHref="/fleet" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8">
          {[1, 2, 3].map(i => <div key={i} className="h-52 bg-white rounded-card w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Vehicles" backHref="/fleet" />

      {/* Summary strip */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3 grid grid-cols-3 gap-3 lg:hidden">
        <div className="text-center">
          <p className="text-base font-black text-black">{verified}</p>
          <p className="text-[10px] text-black">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-black">{data.vehicles.length}</p>
          <p className="text-[10px] text-black">Total</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-black">{totalSeats}</p>
          <p className="text-[10px] text-black">Seats</p>
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
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-200 border-neutral-100 hover:border-primary-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 max-w-7xl mx-auto w-full">
        <DesktopPageHeader
          title="Vehicles"
          subtitle={`${filtered.length} vehicles · ${totalSeats} total seats`}
          actions={
            <Link
              to="/fleet/vehicles/new"
              onClick={guardAction as any}
              className="flex items-center gap-2 bg-[#042011] text-white font-semibold rounded-btn px-5 py-2.5 text-sm hover:bg-primary-400 transition-colors"
            >
              + Add Vehicle
            </Link>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles yet" description="Add your first vehicle to start publishing trips." action={{ label: '+ Add Vehicle', onClick: () => guardAction(undefined, () => navigate('/fleet/vehicles/new')) }} />
        ) : (
          <div id="tour-vehicles-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice(0, visibleCount).map(vehicle => {
              const approvedDocs = vehicle.documents.filter((d: any) => d.status === 'approved').length
              const totalDocs = vehicle.documents.length

              return (
                <div key={vehicle.id} className="bg-white rounded-card border border-neutral-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                  {/* Card header — dark green, 40% transparent */}
                  <div className="bg-[#042011]/60 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                        <VehicleIcon type={vehicle.type} className="w-5 h-5 text-[#042011]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold !text-white flex items-center gap-1.5">
                          {vehicle.plate}
                          {vehicle.status === 'verified' && (
                            <CheckCircle2 className="w-4 h-4 text-[#00C853] flex-shrink-0" aria-label="Fully verified" />
                          )}
                        </p>
                        <p className="text-[10px] !text-white/80">{vehicle.model} · {vehicle.year} · {vehicle.capacity} seats</p>
                      </div>
                    </div>
                    <span
                      className="font-black uppercase tracking-wider font-sans"
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.2',
                        color: vehicle.status === 'verified' ? '#00C853' : vehicle.status === 'pending' ? '#FF5500' : '#9CA3AF'
                      }}
                    >
                      {vehicle.status}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 space-y-3">

                    {/* Documents */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-xs font-bold text-black">
                        <span className="text-black font-semibold">Documents</span>
                        <span className={clsx('font-black', approvedDocs === totalDocs ? 'text-[#00C853]' : 'text-[#FF5500]')}>
                          {approvedDocs}/{totalDocs} approved
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {vehicle.documents.map((doc: any) => (
                          <div key={doc.type} className="flex items-center gap-1 text-[11px] bg-white border border-neutral-100 rounded-lg px-2 py-0.5">
                            {docStatusIcon(doc.status)}
                            <span className="text-black font-semibold">{doc.label.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {vehicle.status !== 'pending' ? (
                        <button
                          onClick={() => setHistoryVehicle(vehicle)}
                          className="flex-1 text-xs text-primary-400 font-bold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-100 hover:bg-primary-75 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" /> View Trip History
                        </button>
                      ) : (
                        <div className="flex-1 text-xs text-neutral-200 font-medium flex items-center justify-center gap-1.5 py-2 bg-neutral-50 rounded-xl border border-neutral-100 cursor-not-allowed select-none">
                          <History className="w-3.5 h-3.5 text-neutral-200" /> History Unavailable
                        </div>
                      )}
                      {canChangeVehicleStatus && (
                        <button
                          onClick={() => guardAction(undefined, () => handleDeleteVehicle(vehicle.id, vehicle.plate))}
                          disabled={deletingVehicleId === vehicle.id}
                          aria-label={`Delete vehicle ${vehicle.plate}`}
                          className="flex-shrink-0 p-2 rounded-xl border border-neutral-100 text-red-500 hover:bg-red-50 disabled:opacity-60 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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

      <Link
        to="/fleet/vehicles/new"
        onClick={guardAction as any}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add vehicle"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Vehicle History Modal */}
      {historyVehicle && (
        <VehicleHistoryModal
          historyVehicle={historyVehicle}
          vehicleTrips={vehicleTrips}
          onClose={() => setHistoryVehicle(null)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete vehicle?"
        description={pendingDelete ? `Delete vehicle ${pendingDelete.plate}? This cannot be undone.` : ''}
        confirmLabel={deletingVehicleId ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        loading={deletingVehicleId !== null}
        onConfirm={confirmDeleteVehicle}
        onCancel={() => setPendingDelete(null)}
      />

    </div>
  )
}

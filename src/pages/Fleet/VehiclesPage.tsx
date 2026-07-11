import { useState } from 'react'
import { Plus, History, Car } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { useApiData, invalidateApiDataCache } from '../../lib/useApiData'
import { useOrg } from '../../lib/OrgContext'
import { vehiclesApi } from '../../api/client'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import { VehicleIcon, docStatusIcon } from '../../components/ui/VehicleIcons'
import { VehicleHistoryModal } from './components/VehicleHistoryModal'
import { VehicleReviewModal } from './components/VehicleReviewModal'
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
  const [reviewingVehicleId, setReviewingVehicleId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  // Matches the backend's own gate (organization_vehicles_api.py's
  // update_vehicle_status requires OWNER or ADMIN/"finance" role).
  const canChangeVehicleStatus = org.role === 'owner' || org.role === 'finance'
  // Matches /documents/review's own gate (OWNER or ADMIN/"finance") - other
  // roles can still open the combined PDF to look, just not decide.
  const canReviewDocuments = org.role === 'owner' || org.role === 'finance'

  const handleStatusChange = async (vehicleId: string, status: 'active' | 'suspended' | 'retired') => {
    if (!orgUuid) return
    setUpdatingStatusId(vehicleId)
    try {
      await vehiclesApi.updateVehicleStatus(orgUuid, vehicleId, status)
      toast.success(`Vehicle marked as ${status}`)
      invalidateApiDataCache()
      refetch()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update vehicle status')
    } finally {
      setUpdatingStatusId(null)
    }
  }


  const filtered = data.vehicles.filter(v => filter === 'all' || v.status === filter)
  const totalSeats = data.vehicles.reduce((a, v) => a + v.capacity, 0)
  const verified = data.vehicles.filter(v => v.status === 'verified').length

  const vehicleTrips = historyVehicle
    ? data.trips.filter((t: any) => t.vehicleId === historyVehicle.id)
    : []

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
            {filtered.map(vehicle => {
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
                        <p className="text-sm font-bold !text-white">{vehicle.plate}</p>
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
                      {totalDocs > 0 && (
                        <button
                          onClick={() => setReviewingVehicleId(vehicle.id)}
                          className="w-full mt-1 py-1.5 rounded-lg border border-primary-100 text-[11px] font-bold text-primary-500 hover:bg-primary-75 transition-colors"
                        >
                          {canReviewDocuments ? 'Review Submission' : 'View Submission'}
                        </button>
                      )}
                    </div>

                    {canChangeVehicleStatus && (
                      <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                        <span className="text-xs font-bold text-black">Operational Status</span>
                        <select
                          value={vehicle.operationalStatus}
                          onChange={e => guardAction(undefined, () => handleStatusChange(vehicle.id, e.target.value as 'active' | 'suspended' | 'retired'))}
                          disabled={updatingStatusId === vehicle.id}
                          className="input-field bg-white text-xs py-1.5 disabled:opacity-60"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="retired">Retired</option>
                        </select>
                      </div>
                    )}

                    {vehicle.status !== 'pending' ? (
                      <button
                        onClick={() => setHistoryVehicle(vehicle)}
                        className="w-full text-xs text-primary-400 font-bold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-100 hover:bg-primary-75 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" /> View Trip History
                      </button>
                    ) : (
                      <div className="w-full text-xs text-neutral-200 font-medium flex items-center justify-center gap-1.5 py-2 bg-neutral-50 rounded-xl border border-neutral-100 cursor-not-allowed select-none">
                        <History className="w-3.5 h-3.5 text-neutral-200" /> History Unavailable
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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

      {reviewingVehicleId && orgUuid && (() => {
        const reviewVehicle = filtered.find(v => v.id === reviewingVehicleId)
        if (!reviewVehicle) return null
        return (
          <VehicleReviewModal
            vehicle={reviewVehicle}
            orgUuid={orgUuid}
            canReview={canReviewDocuments}
            onClose={() => setReviewingVehicleId(null)}
            onReviewed={() => { invalidateApiDataCache(); refetch() }}
          />
        )
      })()}

    </div>
  )
}

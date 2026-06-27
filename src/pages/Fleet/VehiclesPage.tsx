import { useState } from 'react'
import { Plus, Users, CheckCircle2, Clock, XCircle, Car, Bus, UserPlus, X, History } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMockData } from '../../lib/useMockData'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import toast from 'react-hot-toast'

const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]

function VehicleIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'Hiace' || type === 'Coaster') return <Bus className={className} />
  return <Car className={className} />
}

function docStatusIcon(status: string) {
  if (status === 'approved') return <CheckCircle2 className="w-3 h-3 text-secondary-300" />
  if (status === 'pending' || status === 'uploaded') return <Clock className="w-3 h-3 text-warning" />
  return <XCircle className="w-3 h-3 text-warning" />
}

export function VehiclesPage() {
  const { data, loading } = useMockData()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [historyVehicle, setHistoryVehicle] = useState<any | null>(null)

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

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 max-w-5xl mx-auto w-full">
        <DesktopPageHeader title="Vehicles" subtitle={`${filtered.length} vehicles · ${totalSeats} total seats`} />

        {filtered.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles yet" description="Add your first vehicle to start publishing trips." action={{ label: '+ Add Vehicle', onClick: () => {} }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {/* Driver row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-200" />
                        {vehicle.assignedDriverName ? (
                          <span className="text-black font-medium">{vehicle.assignedDriverName}</span>
                        ) : (
                          <button
                            onClick={() => toast('Assign driver — coming soon!')}
                            className="flex items-center gap-1 text-secondary-300 font-semibold hover:text-secondary-400 transition-colors"
                          >
                            <UserPlus className="w-3 h-3" /> Assign Driver
                          </button>
                        )}
                      </div>
                      {vehicle.assignedDriverName && (
                        <button
                          onClick={() => toast('Change driver — coming soon!')}
                          className="text-[10px] text-neutral-200 hover:text-primary-400 transition-colors"
                        >
                          Change →
                        </button>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-black font-medium">Documents</span>
                        <span className={clsx('font-bold', approvedDocs === totalDocs ? 'text-secondary-300' : 'text-warning')}>
                          {approvedDocs}/{totalDocs} approved
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {vehicle.documents.map((doc: any) => (
                          <div key={doc.type} className="flex items-center gap-1 text-[9px] bg-[#042011]/60 rounded-lg px-2 py-0.5">
                            {docStatusIcon(doc.status)}
                            <span className="!text-white">{doc.label.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* View history button */}
                    <button
                      onClick={() => setHistoryVehicle(vehicle)}
                      className="w-full text-[11px] text-primary-400 font-semibold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-100 hover:bg-primary-75 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" /> View Trip History
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add vehicle"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Vehicle History Modal */}
      {historyVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-float flex flex-col max-h-[80vh]">
            {/* Modal header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#042011]/60 flex items-center justify-center flex-shrink-0">
                <VehicleIcon type={historyVehicle.type} className="w-5 h-5 !text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-black">{historyVehicle.plate} — Trip History</h2>
                <p className="text-[10px] text-neutral-200">{historyVehicle.model} · {historyVehicle.year} · {historyVehicle.capacity} seats</p>
              </div>
              <button
                onClick={() => setHistoryVehicle(null)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-neutral-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin">
              {vehicleTrips.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-10 h-10 text-neutral-100 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-black">No trip history yet</p>
                  <p className="text-xs text-neutral-200 mt-1">Completed trips will appear here.</p>
                </div>
              ) : (
                vehicleTrips.map((trip: any) => (
                  <div key={trip.id} className="bg-white rounded-xl p-3 border border-neutral-100">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-bold text-black leading-snug">
                        {trip.origin} → {trip.destination}
                      </p>
                      <StatusPill status={trip.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-200">
                      <span>{formatDate(trip.departureAt)}</span>
                      <span>{formatTime(trip.departureAt)}</span>
                      <span className="ml-auto text-black font-semibold">{trip.driverName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-200 mt-1">
                      <span>{trip.bookedSeats}/{trip.capacity} seats booked</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

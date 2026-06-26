import { useState } from 'react'
import { Plus, Fuel, Users, AlertTriangle, CheckCircle2, Clock, XCircle, Car, Bus } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'

const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]

// SVG vehicle icon by type — no emoji
function VehicleIcon({ type, className }: { type: string; className?: string }) {
  // Hiace and Coaster → Bus icon; Sienna and others → Car icon
  if (type === 'Hiace' || type === 'Coaster') {
    return <Bus className={className} />
  }
  return <Car className={className} />
}

function docStatusIcon(status: string) {
  if (status === 'approved') return <CheckCircle2 className="w-3 h-3 text-secondary-300" />
  if (status === 'pending' || status === 'uploaded') return <Clock className="w-3 h-3 text-warning" />
  return <XCircle className="w-3 h-3 text-warning" />
}

/** Plain fuel level display — no bar */
function FuelLevel({ level }: { level: number }) {
  const pct = Math.round(level * 100)
  const isLow = pct <= 25
  return (
    <div className="flex items-center justify-between text-[10px]">
      <div className="flex items-center gap-1">
        <Fuel className={clsx('w-3 h-3', isLow ? 'text-warning' : 'text-secondary-300')} />
        <span className="text-black">Estimated fuel</span>
      </div>
      <span className={clsx('font-bold', isLow ? 'text-warning' : 'text-black')}>{pct}%</span>
    </div>
  )
}

export function VehiclesPage() {
  const { data, loading } = useMockData()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')

  const filtered = data.vehicles.filter(v => filter === 'all' || v.status === filter)
  const totalSeats = data.vehicles.reduce((a, v) => a + v.capacity, 0)
  const verified = data.vehicles.filter(v => v.status === 'verified').length

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
              const approvedDocs = vehicle.documents.filter(d => d.status === 'approved').length
              const totalDocs = vehicle.documents.length
              const docsPct = Math.round((approvedDocs / totalDocs) * 100)

              return (
                <div key={vehicle.id} className="bg-white rounded-card border border-neutral-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                  {/* Card header */}
                  <div className="bg-primary-75 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center flex-shrink-0">
                        <VehicleIcon type={vehicle.type} className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-500">{vehicle.plate}</p>
                        <p className="text-[10px] text-neutral-200">{vehicle.model} · {vehicle.year} · {vehicle.capacity} seats</p>
                      </div>
                    </div>
                    <StatusPill status={vehicle.status} size="sm" />
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 space-y-3">
                    {/* Driver row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-200">
                        <Users className="w-3.5 h-3.5" />
                        <span>{vehicle.assignedDriverName ?? <span className="text-warning font-semibold">No driver assigned</span>}</span>
                      </div>
                      <span className="text-neutral-200 font-mono text-[11px]">{vehicle.totalKm.toLocaleString()} km</span>
                    </div>

                    {/* Fuel — plain number */}
                    <FuelLevel level={vehicle.fuelLevel} />

                    {/* Documents */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-black font-medium">Documents</span>
                        <span className={clsx('font-bold', approvedDocs === totalDocs ? 'text-secondary-300' : 'text-warning')}>
                          {approvedDocs}/{totalDocs} approved
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {vehicle.documents.map(doc => (
                          <div key={doc.type} className="flex items-center gap-1 text-[9px] text-neutral-200 bg-primary-75 rounded-lg px-2 py-0.5">
                            {docStatusIcon(doc.status)}
                            <span>{doc.label.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
    </div>
  )
}

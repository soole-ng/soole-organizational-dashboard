import { Navigation, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

type VehicleLoc = {
  id: string
  plate: string
  driver: string
  status: 'on_trip' | 'idle'
  lat: number
  lng: number
  trip: string | null
  eta: string | null
  speed: number
}

interface DriverSidebarProps {
  drivers: VehicleLoc[]
  selectedDriver: VehicleLoc | null
  onSelectDriver: (driver: VehicleLoc) => void
  allCount: number
  onTripCount: number
  idleCount: number
  filter: 'all' | 'on_trip' | 'idle'
  onFilterChange: (filter: 'all' | 'on_trip' | 'idle') => void
  markerColor: (status: string) => string
}

export function DriverSidebar({
  drivers,
  selectedDriver,
  onSelectDriver,
  allCount,
  onTripCount,
  idleCount,
  filter,
  onFilterChange,
  markerColor,
}: DriverSidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-neutral-50">
        <h2 className="text-lg font-bold text-primary-500 mb-3">Live Drivers</h2>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { value: 'all' as const, label: `All (${allCount})` },
            { value: 'on_trip' as const, label: `On Trip (${onTripCount})` },
            { value: 'idle' as const, label: `Last Known (${idleCount})` },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                filter === tab.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-primary-75 text-primary-400 hover:bg-primary-100',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <AlertCircle className="w-8 h-8 text-neutral-200 mb-2" />
            <p className="text-sm font-semibold text-neutral-400">No drivers {filter !== 'all' ? `${filter === 'on_trip' ? 'on trip' : 'with last known location'}` : ''}</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => onSelectDriver(driver)}
                className={clsx(
                  'w-full text-left px-3 py-3 rounded-xl transition-all border-2 group',
                  selectedDriver?.id === driver.id
                    ? 'bg-primary-75 border-accent-300 shadow-card'
                    : 'bg-white border-transparent hover:bg-primary-75 hover:border-primary-100',
                )}
              >
                {/* Status Indicator & Plate */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: markerColor(driver.status) }}
                  />
                  <p className="font-bold text-sm text-primary-500 truncate">{driver.plate}</p>
                </div>

                {/* Driver Name */}
                <p className="text-xs text-neutral-300 truncate px-5">{driver.driver}</p>

                {/* Trip Status */}
                <div className="mt-2 px-5 pt-2 border-t border-neutral-50 text-xs space-y-1">
                  {driver.trip ? (
                    <>
                      <p className="flex items-center gap-1.5 text-secondary-300 font-medium">
                        <Navigation className="w-3 h-3" />
                        {driver.trip}
                      </p>
                      {driver.eta && (
                        <p className="text-neutral-200">ETA: <span className="font-semibold text-secondary-300">{driver.eta}</span></p>
                      )}
                    </>
                  ) : (
                    <p className="text-neutral-200">
                      Last Known · <span className="font-semibold text-secondary-300">{driver.speed} km/h</span>
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-neutral-50 bg-primary-75 text-xs text-center">
        <p className="font-semibold text-primary-500">
          {drivers.length} of {allCount} driver{allCount !== 1 ? 's' : ''} visible
        </p>
      </div>
    </div>
  )
}

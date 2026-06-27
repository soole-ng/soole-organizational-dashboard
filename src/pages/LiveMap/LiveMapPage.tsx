import { useState, useCallback, useRef, useMemo } from 'react'
import { MapPin, Navigation, Activity, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { MapContainer } from './components/MapContainer'
import { DriverSidebar } from './components/DriverSidebar'
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

type BasemapStyle = 'osm' | 'carto-light' | 'carto-dark' | 'google' | 'google-satellite'

const basemapStyles: Record<BasemapStyle, { name: string; style: string }> = {
  'osm': {
    name: 'OpenStreetMap',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'carto-light': {
    name: 'Carto Light',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'carto-dark': {
    name: 'Carto Dark',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'google': {
    name: 'Google Maps',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'google-satellite': {
    name: 'Google Satellite',
    style: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
  },
}

export function LiveMapPage() {
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLoc[]>([])
  const [selectedDriver, setSelectedDriver] = useState<VehicleLoc | null>(null)
  const [filter, setFilter] = useState<'all' | 'on_trip' | 'idle'>('all')
  const [basemap, setBasemap] = useState<BasemapStyle>('osm')
  const [showBasemapMenu, setShowBasemapMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const mapRef = useRef<any>(null)

  // Load vehicle locations from mock data
  useMemo(() => {
    fetch('/mock-data.json')
      .then(res => res.json())
      .then(data => setVehicleLocations(data.vehicleLocations || []))
      .catch(console.error)
  }, [])

  const filtered = useMemo(() =>
    vehicleLocations.filter(v =>
      filter === 'all' || v.status === filter,
    ), [vehicleLocations, filter])

  const handleSelectDriver = useCallback((vehicle: VehicleLoc) => {
    setSelectedDriver(vehicle)
    mapRef.current?.flyTo({ center: [vehicle.lng, vehicle.lat], zoom: 14, duration: 600 })
  }, [])

  const markerColor = (status: string) => {
    if (status === 'on_trip') return '#1D754C'
    if (status === 'overspeed') return '#A7C957'
    return '#A7C957'
  }

  const onTripCount = vehicleLocations.filter(v => v.status === 'on_trip').length
  const idleCount = vehicleLocations.filter(v => v.status === 'idle').length

  return (
    <div className="flex flex-col h-full bg-primary-500">
      <TopBar title="Live Map" transparent />

      <div className="flex-1 relative overflow-hidden flex">
        {/* Left Sidebar - Driver List */}
        <div
          className={clsx(
            'w-72 bg-white shadow-float z-20 flex flex-col overflow-hidden',
            'absolute left-0 top-0 bottom-0 transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0 lg:relative lg:static lg:w-80'
          )}
        >
          <DriverSidebar
            drivers={filtered}
            selectedDriver={selectedDriver}
            onSelectDriver={handleSelectDriver}
            allCount={vehicleLocations.length}
            onTripCount={onTripCount}
            idleCount={idleCount}
            filter={filter}
            onFilterChange={setFilter}
            markerColor={markerColor}
          />
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            ref={mapRef}
            basemap={basemap}
            selectedDriver={selectedDriver}
            vehicles={filtered}
            onSelectDriver={handleSelectDriver}
            markerColor={markerColor}
          />
        </div>

        {/* Sidebar Toggle Button - Mobile only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={clsx(
            'absolute left-4 top-20 z-30 lg:hidden',
            'w-10 h-10 bg-white rounded-lg shadow-float flex items-center justify-center text-primary-500 transition-all'
          )}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Basemap Switcher */}
        <div className="absolute top-[10px] right-[55px] z-10">
          <div className="relative">
            <button
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="w-10 h-10 flex items-center justify-center bg-white text-primary-500 rounded-full shadow-card hover:bg-primary-75 transition-colors border border-neutral-100/50"
              title="Switch Basemap"
            >
              <Layers className="w-5 h-5" />
            </button>
            {showBasemapMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-float overflow-hidden min-w-48 z-20">
                {Object.entries(basemapStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setBasemap(key as BasemapStyle)
                      setShowBasemapMenu(false)
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-neutral-50 last:border-b-0',
                      basemap === key
                        ? 'bg-primary-75 text-primary-500'
                        : 'text-neutral-400 hover:bg-primary-75 hover:text-primary-500',
                    )}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="bg-white text-center rounded-2xl p-6 shadow-float max-w-xs">
              <MapPin className="w-8 h-8 text-primary-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-primary-500">No drivers on the road</p>
              <p className="text-xs text-neutral-200 mt-1">
                {filter === 'on_trip' ? 'No active trips' : filter === 'idle' ? 'All drivers are busy' : 'All drivers are offline'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

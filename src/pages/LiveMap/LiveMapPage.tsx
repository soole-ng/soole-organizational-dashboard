import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { MapPin, Navigation, Activity, Layers, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { useOrg } from '../../lib/OrgContext'
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
    style: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
  },
}

export function LiveMapPage() {
  const { org } = useOrg()
  const isProfileIncomplete = org.approvalStatus === 'incomplete'
  const [showProfileModal, setShowProfileModal] = useState(false)
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

  // Simulate real-time movement of active vehicles
  useEffect(() => {
    if (vehicleLocations.length === 0) return
    const interval = setInterval(() => {
      setVehicleLocations(prev =>
        prev.map(v => {
          if (v.status !== 'on_trip') return v

          // Define target destinations (approximate coordinates)
          let destLat = v.lat
          let destLng = v.lng
          if (v.driver === 'Akin Bello') { // Lagos -> Ibadan
            destLat = 7.3775
            destLng = 3.9470
          } else if (v.driver === 'Chidi Okafor') { // Lagos -> Abuja
            destLat = 9.0765
            destLng = 7.3986
          } else if (v.driver === 'Funke Adeleke') { // Lagos -> Benin
            destLat = 6.3350
            destLng = 5.6263
          } else {
            return v
          }

          // Move 0.5% closer to destination on each tick
          const step = 0.005
          const newLat = v.lat + (destLat - v.lat) * step
          const newLng = v.lng + (destLng - v.lng) * step

          // If close to destination, loop it back to starting point
          const dist = Math.sqrt(Math.pow(destLat - newLat, 2) + Math.pow(destLng - newLng, 2))
          if (dist < 0.01) {
            return {
              ...v,
              lat: 6.5244 + (Math.random() - 0.5) * 0.05,
              lng: 3.3792 + (Math.random() - 0.5) * 0.05,
            }
          }

          return {
            ...v,
            lat: newLat,
            lng: newLng,
          }
        })
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [vehicleLocations.length])

  const filtered = useMemo(() =>
    vehicleLocations.filter(v =>
      filter === 'all' || v.status === filter,
    ), [vehicleLocations, filter])

  const handleSelectDriver = useCallback((vehicle: VehicleLoc) => {
    if (isProfileIncomplete) {
      setShowProfileModal(true)
      return
    }
    setSelectedDriver(vehicle)
    mapRef.current?.flyTo({ center: [vehicle.lng, vehicle.lat], zoom: 14, duration: 600 })
  }, [isProfileIncomplete])

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
          id="tour-driver-sidebar"
          className={clsx(
            'w-72 bg-white shadow-float z-20 flex flex-col overflow-hidden',
            'absolute left-0 top-0 bottom-0 transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            sidebarOpen ? 'lg:relative lg:static lg:w-80' : 'lg:w-80 lg:absolute'
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
        <div id="tour-map-container" className="flex-1 relative">
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
            'fixed right-4 bottom-28 z-30',
            'w-10 h-10 bg-white rounded-full shadow-float flex items-center justify-center text-primary-500 transition-all border border-neutral-100/50'
          )}
          title={sidebarOpen ? "Close Driver List" : "Open Driver List"}
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

      {/* Profile Incomplete Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm p-6 shadow-float space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-secondary-500 rounded-3xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-primary-500">Profile Incomplete</h2>
              <p className="text-sm text-neutral-300">Please complete your profile to access real-time tracking.</p>
            </div>
            <div className="bg-secondary-500/10 border border-secondary-300 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-black uppercase tracking-wider">What's needed:</p>
              <ul className="text-xs text-neutral-300 space-y-2 text-left">
                <li>✓ Organization details</li>
                <li>✓ Director information</li>
                <li>✓ Bank account setup</li>
                <li>✓ Security questions</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 bg-neutral-50 hover:bg-neutral-100 text-black font-semibold rounded-xl px-4 py-2 text-sm transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.dispatchEvent(new Event('require-profile-completion'))}
                className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all whitespace-nowrap"
              >
                Complete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

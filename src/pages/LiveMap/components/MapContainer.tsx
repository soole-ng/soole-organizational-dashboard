import { forwardRef, useEffect, useState } from 'react'
import { Car, Activity } from 'lucide-react'
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

interface MapContainerProps {
  basemap: string
  selectedDriver: VehicleLoc | null
  vehicles: VehicleLoc[]
  onSelectDriver: (vehicle: VehicleLoc) => void
  markerColor: (status: string) => string
}

export const MapContainer = forwardRef<any, MapContainerProps>(
  ({ basemap, selectedDriver, vehicles, onSelectDriver, markerColor }, ref) => {
    const [mapLoaded, setMapLoaded] = useState(false)

    useEffect(() => {
      // Load MapLibre GL JS
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.js'
      script.onload = () => {
        const link = document.createElement('link')
        link.href = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.css'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
        setMapLoaded(true)
      }
      document.head.appendChild(script)
    }, [])

    useEffect(() => {
      if (!mapLoaded) return

      const ml = (window as any).maplibregl
      const container = document.getElementById('map-container')
      if (!container) return

      const map = new ml.Map({
        container,
        style: getMapStyle(basemap),
        center: [3.3792, 6.5244],
        zoom: 11,
      })

      map.on('load', () => {
        if (ref) {
          (ref as any).current = map
        }
      })

      return () => map.remove()
    }, [mapLoaded, basemap, ref])

    const getMapStyle = (style: string) => {
      const styles: Record<string, any> = {
        'osm': {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
            },
          ],
        },
        'carto-light': {
          version: 8,
          sources: {
            carto: {
              type: 'raster',
              tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'carto',
              type: 'raster',
              source: 'carto',
            },
          ],
        },
        'carto-dark': {
          version: 8,
          sources: {
            carto: {
              type: 'raster',
              tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'carto',
              type: 'raster',
              source: 'carto',
            },
          ],
        },
        'google': {
          version: 8,
          sources: {
            google: {
              type: 'raster',
              tiles: ['https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'google',
              type: 'raster',
              source: 'google',
            },
          ],
        },
        'google-satellite': {
          version: 8,
          sources: {
            'google-satellite': {
              type: 'raster',
              tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'google-satellite',
              type: 'raster',
              source: 'google-satellite',
            },
          ],
        },
      }
      return styles[style] || styles['osm']
    }

    return (
      <div id="map-container" className="flex-1 w-full h-full relative bg-gray-100">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-40">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-primary-500">Loading map...</p>
            </div>
          </div>
        )}

        {/* Vehicle Markers Overlay */}
        {mapLoaded && vehicles.map(vehicle => (
          <div
            key={vehicle.id}
            className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((vehicle.lng + 180) / 360) * 100}%`,
              top: `${((90 - vehicle.lat) / 180) * 100}%`,
            }}
          >
            <button
              onClick={() => onSelectDriver(vehicle)}
              className={clsx(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer shadow-float transition-all hover:scale-110 relative',
                selectedDriver?.id === vehicle.id && 'ring-2 ring-accent-300 ring-offset-2',
              )}
              style={{
                background: markerColor(vehicle.status),
                borderColor: selectedDriver?.id === vehicle.id ? '#A7C957' : '#A7C957',
              }}
              title={vehicle.plate}
            >
              <Car className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </button>

            {/* Popup when selected */}
            {selectedDriver?.id === vehicle.id && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white rounded-xl p-3 min-w-48 shadow-float border border-primary-400 whitespace-nowrap">
                <p className="text-sm font-bold">{vehicle.plate}</p>
                <p className="text-xs text-primary-200">{vehicle.driver}</p>
                <div className="mt-2 pt-2 border-t border-primary-400 text-xs space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-accent-300" />
                    {vehicle.trip ?? 'Idle'}
                  </p>
                  {vehicle.eta && <p className="text-primary-200">ETA: {vehicle.eta}</p>}
                  <p className="text-primary-200">{vehicle.speed} km/h</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }
)

MapContainer.displayName = 'MapContainer'

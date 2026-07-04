import { forwardRef, useEffect, useState, useRef } from 'react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { useApiData } from '../../../lib/useApiData'
import { Activity, WifiOff, MapPin } from 'lucide-react'

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
    const [loadError, setLoadError] = useState(false)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const markersRef = useRef<Record<string, any>>({})
    const popupRef = useRef<any>(null)
    const navigate = useNavigate()
    const { data } = useApiData()
    const trailsRef = useRef<Record<string, [number, number][]>>({})

    useEffect(() => {
      const handleOnline = () => setIsOffline(false)
      const handleOffline = () => setIsOffline(true)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Load MapLibre GL JS
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.js'
      script.onerror = () => {
        setLoadError(true)
      }
      script.onload = () => {
        const link = document.createElement('link')
        link.href = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.css'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
        setMapLoaded(true)
      }
      document.head.appendChild(script)

      // Fallback timer
      const timer = setTimeout(() => {
        if (!(window as any).maplibregl) {
          setLoadError(true)
        }
      }, 4000)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        clearTimeout(timer)
      }
    }, [])

    const [mapInstance, setMapInstance] = useState<any>(null)

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

      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')

      map.on('load', () => {
        if (ref) {
          (ref as any).current = map
        }
        setMapInstance(map)
      })

      return () => map.remove()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapLoaded])

    useEffect(() => {
      if (mapInstance) {
        mapInstance.setStyle(getMapStyle(basemap))
      }
    }, [basemap, mapInstance])

    // Effect to synchronise MapLibre native markers
    useEffect(() => {
      if (!mapLoaded || !ref || !(ref as any).current) return
      const map = (ref as any).current
      const ml = (window as any).maplibregl

      // Clear any outdated markers
      const currentIds = new Set(vehicles.map(v => v.id))
      Object.keys(markersRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      // Add/update markers
      vehicles.forEach(vehicle => {
        const isSelected = selectedDriver?.id === vehicle.id
        let marker = markersRef.current[vehicle.id]

        // Update trail path for active vehicles
        if (vehicle.status === 'on_trip') {
          if (!trailsRef.current[vehicle.id]) {
            const startLng = 3.3792
            const startLat = 6.5244
            const endLng = vehicle.lng
            const endLat = vehicle.lat
            const pts: [number, number][] = []
            for (let i = 0; i <= 6; i++) {
              const t = i / 6
              pts.push([
                startLng + (endLng - startLng) * t,
                startLat + (endLat - startLat) * t,
              ])
            }
            trailsRef.current[vehicle.id] = pts
          } else {
            const path = trailsRef.current[vehicle.id]
            const last = path[path.length - 1]
            if (last && (Math.abs(last[0] - vehicle.lng) > 0.0001 || Math.abs(last[1] - vehicle.lat) > 0.0001)) {
              path.push([vehicle.lng, vehicle.lat])
            }
          }

          const sourceId = `trail-source-${vehicle.id}`
          const layerId = `trail-layer-${vehicle.id}`
          const currentPath = trailsRef.current[vehicle.id]

          if (map.getSource(sourceId)) {
            (map.getSource(sourceId) as any).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: currentPath,
              },
            })
          } else {
            map.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: currentPath,
                },
              },
            })
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#1D754C',
                'line-width': 4,
                'line-opacity': 0.6,
              },
            })
          }
        }

        if (!marker) {
          const el = document.createElement('div')
          el.className = 'custom-map-marker cursor-pointer'
          el.innerHTML = `
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow relative transition-all" style="background: ${markerColor(vehicle.status)}; border-color: #A7C957">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
          `
          el.addEventListener('click', () => {
            onSelectDriver(vehicle)
          })

          marker = new ml.Marker({ element: el })
            .setLngLat([vehicle.lng, vehicle.lat])
            .addTo(map)

          markersRef.current[vehicle.id] = marker
        } else {
          marker.setLngLat([vehicle.lng, vehicle.lat])
          const markerEl = marker.getElement()
          const innerEl = markerEl.querySelector('div')
          if (innerEl) {
            innerEl.style.background = markerColor(vehicle.status)
            if (isSelected) {
              innerEl.style.boxShadow = '0 0 0 4px rgba(167, 201, 87, 0.6)'
            } else {
              innerEl.style.boxShadow = ''
            }
          }
        }
      })

      // Update popup
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }

      if (selectedDriver) {
        const vehicle = vehicles.find(v => v.id === selectedDriver.id) || selectedDriver
        const activeTrip = data?.trips?.find((t: any) => t.vehiclePlate === vehicle.plate && t.status !== 'completed')

        const popupDiv = document.createElement('div')
        popupDiv.className = 'p-3 bg-white text-black rounded-xl min-w-[200px] shadow-lg border border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors'
        popupDiv.innerHTML = `
          <div class="flex items-center justify-between">
            <p class="text-sm font-bold text-black">${vehicle.plate}</p>
            ${activeTrip ? `<span class="text-[9px] bg-secondary-50 text-secondary-300 font-bold px-1.5 py-0.5 rounded-full border border-secondary-100/50">ON GOING</span>` : ''}
          </div>
          <p class="text-xs text-neutral-400 font-medium">${vehicle.driver}</p>
          <div class="mt-2 pt-2 border-t border-neutral-100 text-xs space-y-1">
            <p class="flex items-center gap-1.5 font-bold text-primary-500">
              <span class="w-2 h-2 rounded-full bg-secondary-300"></span>
              ${vehicle.trip ?? 'Idle'}
            </p>
            ${vehicle.eta ? `<p class="text-neutral-500 font-medium">ETA: ${vehicle.eta}</p>` : ''}
            <p class="text-neutral-500 font-bold">${vehicle.speed} km/h</p>
            ${activeTrip ? `<p class="text-[10px] text-secondary-300 font-bold mt-2 pt-1 border-t border-dashed border-neutral-100/50 flex items-center gap-1">Click to view trip details →</p>` : ''}
          </div>
        `

        if (activeTrip) {
          popupDiv.addEventListener('click', () => {
            navigate(`/trips/${activeTrip.id}`)
          })
        }

        popupRef.current = new ml.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'custom-map-popup',
          offset: [0, -15]
        })
          .setLngLat([vehicle.lng, vehicle.lat])
          .setDOMContent(popupDiv)
          .addTo(map)
      }
    }, [mapLoaded, vehicles, selectedDriver, data, navigate])

    // Cleanup markers and popup on unmount
    useEffect(() => {
      return () => {
        Object.values(markersRef.current).forEach(m => m.remove())
        if (popupRef.current) popupRef.current.remove()

        const map = (ref as any)?.current
        if (map && map.getStyle()) {
          Object.keys(trailsRef.current).forEach(id => {
            try {
              if (map.getLayer(`trail-layer-${id}`)) map.removeLayer(`trail-layer-${id}`)
              if (map.getSource(`trail-source-${id}`)) map.removeSource(`trail-source-${id}`)
            } catch (e) {
              // ignore
            }
          })
        }
      }
    }, [])

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
              tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
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

    if (loadError || isOffline) {
      return (
        <div className="flex-1 w-full h-full relative bg-neutral-900 text-white p-6 flex flex-col justify-between overflow-y-auto">
          {/* Header indicator */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
            <div>
              <h3 className="font-semibold text-lg text-accent-400">Offline Live Tracker</h3>
              <p className="text-xs text-neutral-300">Displaying cached status & route checkpoints</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs font-semibold animate-pulse border border-accent-500/30">
              <span className="w-2 h-2 rounded-full bg-accent-500" />
              Progressive PWA Mode
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="flex-1 min-h-[250px] relative bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center p-4">
            <svg viewBox="0 0 500 400" className="w-full h-full max-h-[350px]">
              {/* Route Lines */}
              {/* Lagos -> Ibadan */}
              <path d="M 100 350 L 150 250" stroke="#1D754C" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
              {/* Lagos -> Benin */}
              <path d="M 100 350 L 250 320" stroke="#1D754C" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
              {/* Lagos -> Abuja */}
              <path d="M 100 350 L 300 150" stroke="#1D754C" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />

              {/* Station/City Nodes */}
              <circle cx="100" cy="350" r="8" fill="#A7C957" />
              <text x="70" y="375" fill="#A7C957" fontSize="11" fontWeight="bold">Lagos (Hub)</text>

              <circle cx="150" cy="250" r="6" fill="#ffffff" />
              <text x="162" y="254" fill="#ffffff" fontSize="10">Ibadan</text>

              <circle cx="250" cy="320" r="6" fill="#ffffff" />
              <text x="262" y="324" fill="#ffffff" fontSize="10">Benin City</text>

              <circle cx="300" cy="150" r="8" fill="#A7C957" />
              <text x="280" y="135" fill="#A7C957" fontSize="11" fontWeight="bold">Abuja (Capital)</text>

              {/* Vehicles */}
              {vehicles.map((v, i) => {
                // Calculate static or simulated coordinates on the screen based on driver
                let cx = 100
                let cy = 350
                if (v.driver === 'Akin Bello') {
                  cx = 120
                  cy = 310
                } else if (v.driver === 'Chidi Okafor') {
                  cx = 200
                  cy = 250
                } else if (v.driver === 'Funke Adeleke') {
                  cx = 175
                  cy = 335
                } else {
                  cx = 100 + (i * 30)
                  cy = 350 - (i * 20)
                }

                const isSelected = selectedDriver?.id === v.id

                return (
                  <g
                    key={v.id}
                    className="cursor-pointer"
                    onClick={() => onSelectDriver(v)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 10 : 7}
                      fill={v.status === 'on_trip' ? '#1D754C' : '#9ca3af'}
                      stroke={isSelected ? '#A7C957' : '#ffffff'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className={v.status === 'on_trip' ? 'animate-pulse' : ''}
                    />
                    <text
                      x={cx + 12}
                      y={cy + 4}
                      fill={isSelected ? '#A7C957' : '#ffffff'}
                      fontSize="9"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {v.driver.split(' ')[0]}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Quick list / detail card */}
          <div className="mt-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            {selectedDriver ? (
              <div>
                <h4 className="font-semibold text-accent-400 text-sm">{selectedDriver.driver}</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <span className="text-neutral-400">Vehicle:</span> {selectedDriver.plate}
                  </div>
                  <div>
                    <span className="text-neutral-400">Speed:</span> {selectedDriver.speed} km/h
                  </div>
                  <div>
                    <span className="text-neutral-400">ETA:</span> {selectedDriver.eta || 'N/A'}
                  </div>
                  <div>
                    <span className="text-neutral-400">Status:</span>{' '}
                    <span className={selectedDriver.status === 'on_trip' ? 'text-emerald-400' : 'text-neutral-400'}>
                      {selectedDriver.status === 'on_trip' ? 'On Trip' : 'Idle'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-2">Select a vehicle on the map to see offline telemetry</p>
            )}
          </div>
        </div>
      )
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
      </div>
    )
  }
)

MapContainer.displayName = 'MapContainer'

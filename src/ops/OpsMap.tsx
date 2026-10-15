/**
 * The staff map: every live vehicle, and for the trip that is open, its
 * recorded path and each passenger's requested and actual pickup and
 * drop-off.
 *
 * MapLibre comes from the CDN the company Live Map already uses, so the two
 * sites share the browser cache and neither bundles a map engine.
 */
import { useEffect, useRef, useState } from 'react'
import { Layers } from 'lucide-react'
import type { LiveTrip, Point, TrailPoint, TripDetail } from './api'

const MAPLIBRE = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl'
const NIGERIA: [number, number] = [8.0, 9.1]

let loading: Promise<any> | null = null
function loadMapLibre(): Promise<any> {
  const w = window as any
  if (w.maplibregl) return Promise.resolve(w.maplibregl)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${MAPLIBRE}.css"]`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = `${MAPLIBRE}.css`
        document.head.appendChild(link)
      }
      const script = document.createElement('script')
      script.src = `${MAPLIBRE}.js`
      script.onload = () => resolve(w.maplibregl)
      script.onerror = () => {
        loading = null
        reject(new Error('map'))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}

/** The company Live Map's five maps, the same tiles in the same order. */
const BASEMAPS = {
  osm: { name: 'OpenStreetMap', tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  'carto-light': { name: 'Carto Light', tiles: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png' },
  'carto-dark': { name: 'Carto Dark', tiles: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' },
  google: { name: 'Google Maps', tiles: 'https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}' },
  'google-satellite': { name: 'Google Satellite', tiles: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
} as const
type Basemap = keyof typeof BASEMAPS
const BASEMAP_KEY = 'ops_basemap'

function savedBasemap(): Basemap {
  try {
    const v = localStorage.getItem(BASEMAP_KEY)
    if (v && v in BASEMAPS) return v as Basemap
  } catch { /* private window */ }
  return 'osm'
}

const baseSource = (b: Basemap) => ({ type: 'raster', tiles: [BASEMAPS[b].tiles], tileSize: 256 })

const styleFor = (b: Basemap) => ({
  version: 8,
  sources: { base: baseSource(b) },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
})

export function vehicleTone(t: { kind: string; flags: { sos: boolean; no_gps: boolean } }) {
  if (t.flags.sos) return 'sos'
  if (t.flags.no_gps) return 'nogps'
  return t.kind === 'company' ? 'company' : 'independent'
}

function el(className: string, title: string, text = '') {
  const d = document.createElement('div')
  d.className = className
  d.title = title
  d.textContent = text
  return d
}

const ll = (p: Point): [number, number] => [p.longitude, p.latitude]

type Props = {
  trips: LiveTrip[]
  selectedUuid: string | null
  detail: TripDetail | null
  trail: TrailPoint[]
  onSelect: (uuid: string) => void
}

export function OpsMap({ trips, selectedUuid, detail, trail, onSelect }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const vehicleMarkers = useRef<Record<string, any>>({})
  const detailMarkers = useRef<any[]>([])
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const flownTo = useRef<string | null>(null)
  const [basemap, setBasemap] = useState<Basemap>(savedBasemap)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadMapLibre()
      .then(ml => {
        if (cancelled || !box.current) return
        const m = new ml.Map({ container: box.current, style: styleFor(basemap), center: NIGERIA, zoom: 5.4 })
        m.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
        m.on('load', () => {
          m.addSource('trail', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          m.addLayer({
            id: 'trail', type: 'line', source: 'trail',
            paint: { 'line-color': '#0B6E4F', 'line-width': 4, 'line-opacity': 0.85 },
            layout: { 'line-cap': 'round', 'line-join': 'round' },
          })
          m.addSource('gaps', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          m.addLayer({
            id: 'gaps', type: 'line', source: 'gaps',
            paint: { 'line-color': '#C2410C', 'line-width': 2, 'line-dasharray': [2, 2] },
          })
          setReady(true)
        })
        map.current = m
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Basemap: only the tile layer is swapped, under the trail, so the trip's
  // path and markers stay where they are (setStyle would wipe them).
  const appliedBase = useRef<Basemap>(basemap)
  useEffect(() => {
    const m = map.current
    try { localStorage.setItem(BASEMAP_KEY, basemap) } catch { /* private window */ }
    if (!ready || !m || appliedBase.current === basemap) return
    if (m.getLayer('base')) m.removeLayer('base')
    if (m.getSource('base')) m.removeSource('base')
    m.addSource('base', baseSource(basemap))
    m.addLayer({ id: 'base', type: 'raster', source: 'base' }, m.getLayer('trail') ? 'trail' : undefined)
    appliedBase.current = basemap
  }, [basemap, ready])

  // Vehicles
  useEffect(() => {
    const ml = (window as any).maplibregl
    const m = map.current
    if (!ready || !ml || !m) return
    const seen = new Set<string>()
    for (const t of trips) {
      if (!t.position) continue
      seen.add(t.trip_uuid)
      const cls = `ops-vehicle ops-${vehicleTone(t)}${t.kind === 'company' ? ' ops-co' : ''}${t.trip_uuid === selectedUuid ? ' ops-selected' : ''}`
      const label = `${t.vehicle.plate ?? 'No plate'} · ${t.driver.name ?? 'Driver'}`
      let marker = vehicleMarkers.current[t.trip_uuid]
      if (!marker) {
        const node = el(cls, label)
        node.addEventListener('click', () => onSelect(t.trip_uuid))
        marker = new ml.Marker({ element: node }).setLngLat(ll(t.position)).addTo(m)
        vehicleMarkers.current[t.trip_uuid] = marker
      } else {
        marker.setLngLat(ll(t.position))
        const node = marker.getElement() as HTMLDivElement
        node.className = cls
        node.title = label
      }
    }
    for (const [uuid, marker] of Object.entries(vehicleMarkers.current)) {
      if (!seen.has(uuid)) {
        marker.remove()
        delete vehicleMarkers.current[uuid]
      }
    }
  }, [trips, selectedUuid, ready, onSelect])

  // The open trip: path, passengers, and a dashed line wherever somebody got
  // out more than 2 km from where they asked to go.
  useEffect(() => {
    const ml = (window as any).maplibregl
    const m = map.current
    if (!ready || !ml || !m) return
    detailMarkers.current.forEach(mk => mk.remove())
    detailMarkers.current = []

    const line = trail.length > 1
      ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trail.map(ll) } }]
      : []
    m.getSource('trail')?.setData({ type: 'FeatureCollection', features: line })

    const gaps: any[] = []
    if (detail) {
      const add = (p: Point | null | undefined, cls: string, title: string, text = '') => {
        if (!p) return
        detailMarkers.current.push(new ml.Marker({ element: el(cls, title, text) }).setLngLat(ll(p)).addTo(m))
      }
      add(detail.origin_point, 'ops-end ops-start', `Start: ${detail.origin ?? ''}`, 'A')
      add(detail.destination_point, 'ops-end ops-finish', `Destination: ${detail.destination ?? ''}`, 'B')
      detail.passengers.forEach((p, i) => {
        const n = String(i + 1)
        const who = p.name ?? `Passenger ${n}`
        add(p.requested_dropoff.point, 'ops-pin ops-asked', `${who} asked to get out here`, n)
        add(p.actual_dropoff, 'ops-pin ops-actual', `${who} got out here`, n)
        if (p.dropoff_far_from_requested && p.actual_dropoff && p.requested_dropoff.point) {
          gaps.push({
            type: 'Feature', properties: {},
            geometry: { type: 'LineString', coordinates: [ll(p.requested_dropoff.point), ll(p.actual_dropoff)] },
          })
        }
      })
    }
    m.getSource('gaps')?.setData({ type: 'FeatureCollection', features: gaps })

    // Frame the trip once when it is opened, not on every refresh - staff
    // who have zoomed in somewhere should not be thrown back out.
    if (detail && flownTo.current !== detail.trip_uuid) {
      flownTo.current = detail.trip_uuid
      const pts: [number, number][] = [
        ...trail.map(ll),
        ...[detail.origin_point, detail.destination_point, detail.position]
          .filter((p): p is Point => !!p).map(ll),
      ]
      if (pts.length) {
        const b = new ml.LngLatBounds(pts[0], pts[0])
        pts.forEach(p => b.extend(p))
        m.fitBounds(b, { padding: 70, maxZoom: 13, duration: 600 })
      }
    }
    if (!detail) flownTo.current = null
  }, [detail, trail, ready])

  return (
    <div className="relative h-full w-full bg-[#dfe6e1]">
      <div ref={box} className="absolute inset-0" />
      {/* Map switcher, as on the company Live Map. */}
      <div className="absolute top-[10px] right-[50px] z-10">
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className="w-[29px] h-[29px] grid place-items-center rounded-[4px] bg-white shadow text-[#13241b] hover:bg-[#eef4f0]"
          title="Switch map"
          aria-label="Switch map"
          aria-expanded={menuOpen}
        >
          <Layers className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 min-w-44 overflow-hidden rounded-xl bg-white shadow-lg">
            {(Object.keys(BASEMAPS) as Basemap[]).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => { setBasemap(key); setMenuOpen(false) }}
                className={`block w-full px-4 py-2.5 text-left text-sm ${basemap === key ? 'bg-[#eef4f0] font-semibold text-[#042011]' : 'text-[#45574d] hover:bg-[#f3f6f4]'}`}
              >
                {BASEMAPS[key].name}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* What the shapes mean - company and independent at a glance. */}
      <div className="absolute left-3 bottom-3 z-10 rounded-lg bg-white/95 shadow px-3 py-2 text-xs text-[#13241b] grid gap-1.5">
        <span className="flex items-center gap-2"><span className="ops-vehicle ops-company ops-co !w-3.5 !h-3.5 !border-2" /> Company vehicle (square)</span>
        <span className="flex items-center gap-2"><span className="ops-vehicle ops-independent !w-3.5 !h-3.5 !border-2" /> Independent driver (round)</span>
        <span className="flex items-center gap-2"><span className="ops-vehicle ops-sos !w-3.5 !h-3.5 !border-2 !animate-none" /> SOS open</span>
        <span className="flex items-center gap-2"><span className="ops-vehicle ops-nogps !w-3.5 !h-3.5 !border-2" /> No GPS 10+ min</span>
      </div>
      {failed && (
        <div className="absolute inset-0 grid place-items-center text-sm text-[#45574d]">
          The map could not load. Check the internet and reload the page.
        </div>
      )}
    </div>
  )
}

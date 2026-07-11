import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, ChevronDown, MapPin } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { formatMoney } from '../../lib/formatters'
import { useOrg } from '../../lib/OrgContext'
import { vehiclesApi, driversApi, organizationApi, ridesApi } from '../../api/client'
import { adaptVehicle, adaptDriverIdentity } from '../../lib/adapters'
import { invalidateApiDataCache } from '../../lib/useApiData'
import { NIGERIAN_STATES } from '../../lib/constants'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type BusStop = { id: string; name: string; address: string | null; longitude: number | null; latitude: number | null }

/**
 * Searches the same bus-stop list (rides/retrieve-popular-stops) mobile's
 * own driver/passenger location search picks from, scoped to whatever
 * state the caller has already selected - so a dashboard-published trip
 * carries the exact same stop name and real coordinates a mobile-created
 * one would, instead of arbitrary free text.
 */
function BusStopSearchInput({
  state, value, onChange, onSelectStop, placeholder,
}: {
  state: string
  value: string
  onChange: (text: string) => void
  onSelectStop: (stop: BusStop) => void
  placeholder: string
}) {
  const [stops, setStops] = useState<BusStop[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) {
      setStops([])
      return
    }
    let cancelled = false
    setLoading(true)
    ridesApi.getPopularStops(state)
      .then(res => { if (!cancelled) setStops(res.items || []) })
      .catch(() => { if (!cancelled) setStops([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [state])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const matches = value.trim()
    ? stops.filter(s => s.name.toLowerCase().includes(value.trim().toLowerCase()))
    : stops

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={state ? placeholder : 'Select a state first'}
        disabled={!state}
        className="input-field py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      />
      {open && state && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-neutral-100 rounded-xl shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-xs text-neutral-300">Loading stops…</div>
          ) : matches.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-300">
              No bus stops found for {state}{value.trim() ? ` matching "${value.trim()}"` : ''} - you can still type a custom location.
            </div>
          ) : (
            matches.map(stop => (
              <button
                key={stop.id}
                type="button"
                onClick={() => { onSelectStop(stop); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-primary-75 transition-colors border-b border-neutral-50 last:border-0"
              >
                <p className="font-semibold text-black">{stop.name}</p>
                {stop.address && <p className="text-neutral-300">{stop.address}</p>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function TripCreatePage() {
  const navigate = useNavigate()
  const { orgUuid, org } = useOrg()
  // Fraction (e.g. 0.1), sourced from the org's real commission_rate
  // (see OrgContext) - never hardcoded here.
  const commissionRate = org.commissionPct / 100
  const [form, setForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    originState: '',
    destinationState: '',
    originLat: null as number | null,
    originLng: null as number | null,
    destinationLat: null as number | null,
    destinationLng: null as number | null,
    vehicleId: '',
    driverId: '',
    departureAt: '',
    fare: 5000,
  })
  const [showCalc, setShowCalc] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [vehiclesList, setVehiclesList] = useState<ReturnType<typeof adaptVehicle>[]>([])
  const [driversList, setDriversList] = useState<ReturnType<typeof adaptDriverIdentity>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgUuid) return
    let cancelled = false

    Promise.all([
      vehiclesApi.getVehicles(orgUuid).catch(() => ({ vehicles: [] })),
      driversApi.getDrivers(orgUuid).catch(() => []),
    ]).then(([vehiclesRes, driversRaw]: [any, any[]]) => {
      if (cancelled) return
      const vehicles = (vehiclesRes.vehicles || []).map(adaptVehicle)
      const drivers = (driversRaw || []).map(adaptDriverIdentity)
      setVehiclesList(vehicles)
      setDriversList(drivers)
      setForm(f => ({
        ...f,
        vehicleId: f.vehicleId || vehicles.find((v: any) => v.status === 'verified')?.id || '',
        driverId: f.driverId || drivers[0]?.id || '',
      }))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [orgUuid])

  const selectedVehicle = vehiclesList.find(v => v.id === form.vehicleId)

  const set = (key: string, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }))

  const selectPickupStop = (stop: BusStop) =>
    setForm(p => ({ ...p, pickupLocation: stop.name, originLat: stop.latitude, originLng: stop.longitude }))

  const selectDropoffStop = (stop: BusStop) =>
    setForm(p => ({ ...p, dropoffLocation: stop.name, destinationLat: stop.latitude, destinationLng: stop.longitude }))

  // Manually editing the text after picking a stop means it no longer
  // corresponds to that stop's coordinates - drop the stale lat/lng rather
  // than silently attaching them to a different location.
  const setPickupText = (text: string) =>
    setForm(p => ({ ...p, pickupLocation: text, originLat: null, originLng: null }))

  const setDropoffText = (text: string) =>
    setForm(p => ({ ...p, dropoffLocation: text, destinationLat: null, destinationLng: null }))

  const handlePublish = async () => {
    if (!orgUuid) {
      toast.error('No organization selected')
      return
    }
    if (!form.pickupLocation.trim() || !form.dropoffLocation.trim()) {
      toast.error('Enter pickup and dropoff locations')
      return
    }
    if (!form.originState || !form.destinationState) {
      // Without these, the trip is created but structurally invisible to
      // mobile's passenger search (RideSelector.retrieve_rides_by_filter
      // matches origin_state/destination_state, which are otherwise never set
      // for dashboard-published trips).
      toast.error('Select pickup and dropoff states')
      return
    }
    if (!form.driverId) {
      toast.error('Select a driver')
      return
    }
    if (!form.departureAt) {
      toast.error('Select a departure date and time')
      return
    }
    if (!form.fare || form.fare <= 0) {
      toast.error('Enter a fare greater than zero')
      return
    }

    // form.fare is the org's DESIRED NET PAYOUT per seat, not the amount to
    // charge passengers - price_per_seat must be the fare grossed up so
    // that, after Soole's commission is deducted, the org actually nets
    // form.fare. Previously form.fare was sent as-is, so passengers were
    // charged the net figure directly and the org received commissionRate
    // less than they intended.
    const passengerFarePerSeat = Math.round(form.fare / (1 - commissionRate))

    setPublishing(true)
    try {
      await organizationApi.createTrip(orgUuid, {
        driver_uuid: form.driverId,
        vehicle_uuid: form.vehicleId || undefined,
        origin_address: form.pickupLocation.trim(),
        destination_address: form.dropoffLocation.trim(),
        origin_state: form.originState,
        destination_state: form.destinationState,
        origin_lat: form.originLat ?? undefined,
        origin_lng: form.originLng ?? undefined,
        destination_lat: form.destinationLat ?? undefined,
        destination_lng: form.destinationLng ?? undefined,
        departure_date: new Date(form.departureAt).toISOString(),
        total_seats: selectedVehicle?.capacity || 14,
        price_per_seat: passengerFarePerSeat,
      })
      invalidateApiDataCache()
      toast.success('Trip published!')
      navigate('/trips')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to publish trip')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="New Trip" backHref="/trips" />

      <div className="flex-1 p-4 sm:p-5 space-y-4 lg:pt-8 lg:px-8 w-full max-w-2xl mx-auto">
        <div className="card p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-primary-500 hidden lg:block">Create a trip</h2>

          {/* State first - the bus-stop search below is scoped to whichever
              state is selected, matching mobile's own flow (pick a state,
              then pick a stop within it) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Pickup State</label>
              <div className="relative">
                <select
                  value={form.originState}
                  onChange={e => setForm(p => ({ ...p, originState: e.target.value, pickupLocation: '', originLat: null, originLng: null }))}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Dropoff State</label>
              <div className="relative">
                <select
                  value={form.destinationState}
                  onChange={e => setForm(p => ({ ...p, destinationState: e.target.value, dropoffLocation: '', destinationLat: null, destinationLng: null }))}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pickup & Dropoff bus stop - searches the same stop list mobile uses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Pickup Location
              </label>
              <BusStopSearchInput
                state={form.originState}
                value={form.pickupLocation}
                onChange={setPickupText}
                onSelectStop={selectPickupStop}
                placeholder="Search a bus stop"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Dropoff Location
              </label>
              <BusStopSearchInput
                state={form.destinationState}
                value={form.dropoffLocation}
                onChange={setDropoffText}
                onSelectStop={selectDropoffStop}
                placeholder="Search a bus stop"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle selection */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Vehicle</label>
              <div className="relative">
                <select
                  value={form.vehicleId}
                  onChange={e => set('vehicleId', e.target.value)}
                  disabled={loading}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  {vehiclesList.length === 0 && <option value="">No verified vehicles</option>}
                  {vehiclesList.filter(v => v.status === 'verified').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} — {v.model} ({v.capacity} seats)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>

            {/* Driver selection */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Driver</label>
              <div className="relative">
                <select
                  value={form.driverId}
                  onChange={e => set('driverId', e.target.value)}
                  disabled={loading}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  {driversList.length === 0 && <option value="">No drivers available</option>}
                  {driversList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Departure */}
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Departure Date & Time</label>
            <input
              type="datetime-local"
              value={form.departureAt}
              onChange={e => set('departureAt', e.target.value)}
              className="input-field py-2.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-primary-400">Desired Net Payout per seat</label>
              <button
                onClick={() => setShowCalc(!showCalc)}
                className="flex items-center gap-1 text-xs text-secondary-300 font-medium"
              >
                <Calculator className="w-3.5 h-3.5" /> Calculator
              </button>
            </div>
            <p className="text-[11px] text-neutral-200 mb-2 leading-relaxed">
              Enter the amount you normally charge for the trip. Soole's {org.commissionPct}% commission will be automatically added to this to determine the final passenger fare.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-200">NGN</span>
              <input
                type="text"
                value={form.fare === 0 ? '' : form.fare.toLocaleString('en-US')}
                onChange={e => {
                  const rawVal = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                  if (rawVal === '') {
                    set('fare', 0)
                    return
                  }
                  const num = parseInt(rawVal, 10)
                  if (!isNaN(num)) {
                    set('fare', num)
                  }
                }}
                className="input-field py-2.5 pl-14 stat-number"
              />
            </div>

            {showCalc && (() => {
              const capacity = selectedVehicle?.capacity || 14
              const netPerSeat = form.fare
              // Grossed up (not netPerSeat * (1 + rate)) so that
              // passengerFare * (1 - commissionRate) === netPerSeat exactly
              // - matches what handlePublish actually sends.
              const passengerFare = Math.round(netPerSeat / (1 - commissionRate))
              const totalNet = netPerSeat * capacity

              return (
                <div className="mt-3 p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-black mb-2">Estimated Earnings</p>
                  <div className="flex justify-between items-center text-xs py-1 gap-2">
                    <span className="text-neutral-300 flex-1 min-w-0">Desired Net Payout (per seat)</span>
                    <span className="font-semibold text-black stat-number flex-shrink-0">{formatMoney(netPerSeat)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-t border-neutral-50 mt-1 gap-2">
                    <span className="font-semibold text-black flex-1 min-w-0">Final Passenger Fare (per seat)</span>
                    <span className="font-bold text-secondary-300 stat-number flex-shrink-0">{formatMoney(passengerFare)}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs py-1 border-t border-neutral-100 mt-2 gap-2">
                    <span className="text-neutral-300 flex-1 min-w-0">Total potential net payout (if full)</span>
                    <span className="font-bold text-primary-500 stat-number flex-shrink-0">
                      {formatMoney(totalNet)}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={clsx(
              'btn-primary py-2.5 text-xs w-full flex items-center justify-center gap-2',
              publishing && 'opacity-70',
            )}
          >
            {publishing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Publishing…
              </>
            ) : 'Publish Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

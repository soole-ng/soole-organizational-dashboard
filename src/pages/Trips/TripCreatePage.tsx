import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, ChevronDown, MapPin } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { formatMoney } from '../../lib/formatters'
import { useOrg } from '../../lib/OrgContext'
import { vehiclesApi, fleetApi, driversApi, organizationApi, ridesApi } from '../../api/client'
import { adaptVehicle, adaptFleetDriver, adaptDriverIdentity } from '../../lib/adapters'
import { invalidateApiDataCache } from '../../lib/useApiData'
import { NIGERIAN_STATES } from '../../lib/constants'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type BusStop = { id: string; name: string; address: string | null; longitude: number | null; latitude: number | null; state: string | null }

/**
 * Searches the same bus-stop list (rides/retrieve-popular-stops) mobile's
 * own driver/passenger location search picks from. Scoped to `state` once
 * one's picked (the picker above this field), so results are already
 * guaranteed to be stops in that state - selecting a stop deliberately
 * does NOT touch originState/destinationState. bustops_table is externally
 * populated and doesn't reliably store state names in the canonical form
 * the Pickup/Dropoff State <select> options use (e.g. "Abuja" instead of
 * "FCT", or a different casing/suffix for other states like Lagos) -
 * overwriting the dropdown's already-valid selected value with that raw,
 * possibly-differently-formatted string is exactly what caused the
 * <select> to visually snap back to "Select state" (it matched no
 * <option>) even though a value had genuinely been picked.
 */
function BusStopSearchInput({
  value, onChange, onSelectStop, placeholder, state,
}: {
  value: string
  onChange: (text: string) => void
  onSelectStop: (stop: BusStop) => void
  placeholder: string
  state: string
}) {
  const [stops, setStops] = useState<BusStop[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const query = value.trim()
    if (query.length < 2) {
      setStops([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      ridesApi.searchPopularStops(query, state || undefined)
        .then(res => setStops(res.items || []))
        .catch(() => setStops([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [value, state])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        disabled={!state}
        placeholder={state ? placeholder : 'Select a state first'}
        className="input-field py-2.5 disabled:bg-neutral-50 disabled:text-neutral-200 disabled:cursor-not-allowed"
      />
      {open && state && value.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-neutral-100 rounded-xl shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-xs text-neutral-300">Searching…</div>
          ) : stops.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-300">
              No bus stops in {state} matching "{value.trim()}" - you can still type a custom location.
            </div>
          ) : (
            stops.map(stop => (
              <button
                key={stop.id}
                type="button"
                onClick={() => { onSelectStop(stop); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-primary-75 transition-colors border-b border-neutral-50 last:border-0"
              >
                <p className="font-semibold text-black">{stop.name}</p>
                <p className="text-neutral-300">{stop.address ? `${stop.address} · ` : ''}{stop.state}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Now, formatted for a datetime-local input's `min`.
 *
 * Built from the local clock rather than toISOString(), which converts to
 * UTC - that would shift the floor by the timezone offset and, west of UTC,
 * still allow times earlier today.
 */
function minDepartureAt(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  )
}

export function TripCreatePage() {
  const navigate = useNavigate()
  const { orgUuid } = useOrg()
  const [form, setForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    // Set automatically from the selected bus stop's own `state` field -
    // no separate Pickup/Dropoff State picker.
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
    availableSeats: '' as string | number,
    // Optional - shown to passengers on the ride-details screen if set, but
    // a trip with none of these touched creates no preferences record at
    // all server-side (not a row of un-chosen defaults).
    airConditioning: null as boolean | null,
    smokingAllowed: null as boolean | null,
    allowsFoodDrinks: null as boolean | null,
    musicPreference: '',
    maxLuggageSize: '',
    luggageFeePerItem: '',
    pickupGraceTimeMinutes: '',
    additionalNotes: '',
  })
  const [showCalc, setShowCalc] = useState(true)
  const [showPreferences, setShowPreferences] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [vehiclesList, setVehiclesList] = useState<ReturnType<typeof adaptVehicle>[]>([])
  const [driversList, setDriversList] = useState<ReturnType<typeof adaptFleetDriver>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgUuid) return
    let cancelled = false

    Promise.all([
      vehiclesApi.getVehicles(orgUuid).catch(() => ({ vehicles: [] })),
      fleetApi.getDrivers(orgUuid, { limit: 100 }).catch(() => ({ drivers: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } })),
      driversApi.getDrivers(orgUuid).catch(() => []),
    ]).then(([vehiclesRes, fleetDriversRes, orgDriversRes]: [any, any, any]) => {
      if (cancelled) return
      const vehicles = (vehiclesRes.vehicles || []).map(adaptVehicle)
      
      const fleetDrivers = (fleetDriversRes.drivers || [])
        .map(adaptFleetDriver)
        .filter((d: any) => !d.isPendingInvite && d.status !== 'suspended' && d.status !== 'rejected')
      
      // Fallback/merge orgDrivers if fleetDrivers is empty or incomplete
      const orgDrivers = (Array.isArray(orgDriversRes) ? orgDriversRes : [])
        .map(adaptDriverIdentity)
        .filter((d: any) => d.status !== 'suspended' && d.status !== 'rejected')
      
      const driverMap = new Map<string, any>()
      for (const d of [...fleetDrivers, ...orgDrivers]) {
        if (d.id && !driverMap.has(d.id)) {
          driverMap.set(d.id, d)
        }
      }
      const drivers = Array.from(driverMap.values())

      setVehiclesList(vehicles)
      setDriversList(drivers)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [orgUuid])

  const selectedVehicle = vehiclesList.find(v => v.id === form.vehicleId)

  const set = (key: string, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }))

  // Deliberately does not touch originState/destinationState - the search
  // that produced `stop` was already scoped to the state picked above, so
  // the dropdown's value is already correct. See the comment above
  // BusStopSearchInput for why overwriting it from the stop's own raw
  // `state` field is exactly what broke this before.
  const selectPickupStop = (stop: BusStop) =>
    setForm(p => ({ ...p, pickupLocation: stop.name, originLat: stop.latitude, originLng: stop.longitude }))

  const selectDropoffStop = (stop: BusStop) =>
    setForm(p => ({ ...p, dropoffLocation: stop.name, destinationLat: stop.latitude, destinationLng: stop.longitude }))

  // Manually editing the text after picking a stop means it no longer
  // corresponds to that stop's coordinates - drop those, but keep the
  // state as-is (it's now picked independently, up front).
  const setPickupText = (text: string) =>
    setForm(p => ({ ...p, pickupLocation: text, originLat: null, originLng: null }))

  const setDropoffText = (text: string) =>
    setForm(p => ({ ...p, dropoffLocation: text, destinationLat: null, destinationLng: null }))

  // Changing the state invalidates whatever location was already picked
  // for it (it belonged to the old state's search results).
  const setOriginState = (stateValue: string) =>
    setForm(p => ({ ...p, originState: stateValue, pickupLocation: '', originLat: null, originLng: null }))

  const setDestinationState = (stateValue: string) =>
    setForm(p => ({ ...p, destinationState: stateValue, dropoffLocation: '', destinationLat: null, destinationLng: null }))

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
      // matches origin_state/destination_state) - picking a bus stop fills
      // this in automatically, but it's also directly selectable.
      toast.error('Select pickup and dropoff states')
      return
    }
    if (!form.vehicleId) {
      toast.error('Select a vehicle')
      return
    }

    const capacity = selectedVehicle?.capacity || 14
    const availableSeatsRaw = form.availableSeats === '' ? capacity : Number(form.availableSeats)
    
    if (isNaN(availableSeatsRaw) || availableSeatsRaw < 1 || availableSeatsRaw > capacity) {
      toast.error(`Available seats must be between 1 and the vehicle's capacity (${capacity})`)
      return
    }

    const pre_booked_seats = capacity - availableSeatsRaw

    if (!form.driverId) {
      toast.error('Select a driver')
      return
    }
    if (!form.departureAt) {
      toast.error('Select a departure date and time')
      return
    }
    // The min= on the input only stops the picker offering earlier values -
    // it does not stop a typed or pasted date, and it is not enforced at all
    // once the form is submitted. A trip published in the past is
    // immediately expired: passengers cannot book it and it lands straight
    // in the expiry sweep.
    if (new Date(form.departureAt).getTime() <= Date.now()) {
      toast.error('Departure must be in the future')
      return
    }
    if (!form.fare || form.fare <= 0) {
      toast.error('Enter a fare greater than zero')
      return
    }

    // form.fare is the org's DESIRED NET PAYOUT per seat, and it is sent
    // exactly as entered.
    //
    // It used to be grossed up before sending, which was right when the
    // backend paid out fare - commission. The backend now pays the price in
    // full and adds the commission to the passenger's bill at checkout, so
    // sending a grossed-up figure charges the commission a SECOND time: an
    // org asking to net 200 had 222.22 stored as the price, the passenger
    // was billed 222.22 + commission on that = 246.91, and the org was paid
    // 222.22 instead of the 200 they asked for. The gross-up is a display
    // figure now and nothing else.

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
        total_seats: capacity,
        pre_booked_seats: pre_booked_seats,
        price_per_seat: form.fare,
        air_conditioning: form.airConditioning ?? undefined,
        smoking_allowed: form.smokingAllowed ?? undefined,
        allows_food_drinks: form.allowsFoodDrinks ?? undefined,
        music_preference: form.musicPreference || undefined,
        max_luggage_size: form.maxLuggageSize || undefined,
        luggage_fee_per_item: form.luggageFeePerItem ? Number(form.luggageFeePerItem) : undefined,
        pickup_grace_time_minutes: form.pickupGraceTimeMinutes ? Number(form.pickupGraceTimeMinutes) : undefined,
        additional_notes: form.additionalNotes.trim() || undefined,
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

          {/* Pickup & Dropoff state - picked first, since it scopes the bus
              stop search below to stops actually in that state */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Pickup State <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.originState}
                  onChange={e => setOriginState(e.target.value)}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Dropoff State <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.destinationState}
                  onChange={e => setDestinationState(e.target.value)}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pickup & Dropoff bus stop - searches the same stop list mobile
              uses, scoped to the state picked above */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Pickup Location <span className="text-red-500">*</span>
              </label>
              <BusStopSearchInput
                value={form.pickupLocation}
                onChange={setPickupText}
                onSelectStop={selectPickupStop}
                placeholder="Search a bus stop"
                state={form.originState}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Dropoff Location <span className="text-red-500">*</span>
              </label>
              <BusStopSearchInput
                value={form.dropoffLocation}
                onChange={setDropoffText}
                onSelectStop={selectDropoffStop}
                placeholder="Search a bus stop"
                state={form.destinationState}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle selection */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Vehicle <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.vehicleId}
                  onChange={e => set('vehicleId', e.target.value)}
                  disabled={loading}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  <option value="">Select a vehicle</option>
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
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Driver <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.driverId}
                  onChange={e => set('driverId', e.target.value)}
                  disabled={loading}
                  className="input-field py-2.5 appearance-none pr-10"
                >
                  <option value="">Select a driver</option>
                  {driversList.filter(d => d.status === 'verified').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Departure & Available Seats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Departure Date & Time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.departureAt}
                // Stops the picker offering a past date or time at all. Typed
                // input can still bypass this, so submit re-checks it.
                min={minDepartureAt()}
                onChange={e => set('departureAt', e.target.value)}
                className="input-field py-2.5"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Available Seats (Defaults to vehicle capacity)</label>
              <input
                type="number"
                min="1"
                max={selectedVehicle?.capacity || 14}
                value={form.availableSeats}
                onChange={e => set('availableSeats', e.target.value)}
                placeholder={selectedVehicle ? String(selectedVehicle.capacity) : "14"}
                className="input-field py-2.5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-primary-400">Desired Net Payout per seat <span className="text-red-500">*</span></label>
              <button
                onClick={() => setShowCalc(!showCalc)}
                className="flex items-center gap-1 text-xs text-secondary-300 font-medium"
              >
                <Calculator className="w-3.5 h-3.5" /> Calculator
              </button>
            </div>
            <p className="text-[11px] text-neutral-200 mb-2 leading-relaxed">
              Enter the amount you want to earn per seat. You are paid this in full — Soole's commission is charged to the passenger on top of it, and never comes out of your figure.
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
              // Only the organisation's own money is shown here - the price
              // they set and what a full vehicle earns them.
              //
              // The passenger's total is deliberately absent. It is the
              // passenger's number, on the passenger's receipt; an
              // organisation prices a seat by what they want to earn from
              // it. Showing both invited the reading that the larger figure
              // was theirs, and computing it meant this file carried its own
              // copy of the commission formula - which drifted from the
              // backend's and charged somebody NGN 246.92 for a NGN 200
              // seat. There is no copy here now. The rule is stated above
              // the input in words; the arithmetic happens once, on the
              // server, at checkout.
              const capacity = selectedVehicle?.capacity || 14
              const netPerSeat = form.fare
              const totalNet = netPerSeat * capacity

              return (
                <div className="mt-3 p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-black mb-2">Estimated Earnings</p>
                  <div className="flex justify-between items-center text-xs py-1 gap-2">
                    <span className="text-neutral-300 flex-1 min-w-0">You earn (per seat)</span>
                    <span className="font-semibold text-black stat-number flex-shrink-0">{formatMoney(netPerSeat)}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs py-1 border-t border-neutral-100 mt-2 gap-2">
                    <span className="text-neutral-300 flex-1 min-w-0">Total if every seat sells ({capacity})</span>
                    <span className="font-bold text-primary-500 stat-number flex-shrink-0">
                      {formatMoney(totalNet)}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        <div className="card p-4 sm:p-5 space-y-4">
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h2 className="text-sm font-semibold text-primary-500">Trip Preferences (optional)</h2>
              <p className="text-[11px] text-neutral-200 mt-0.5">
                Shown to passengers on the ride details screen. Leave blank if not applicable.
              </p>
            </div>
            <ChevronDown className={clsx('w-4 h-4 text-neutral-200 transition-transform flex-shrink-0', showPreferences && 'rotate-180')} />
          </button>

          {showPreferences && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  ['airConditioning', 'Air Conditioning'],
                  ['smokingAllowed', 'Smoking Allowed'],
                  ['allowsFoodDrinks', 'Food & Drinks Allowed'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-primary-400 mb-1.5">{label}</label>
                    <div className="relative">
                      <select
                        value={form[key] === null ? '' : form[key] ? 'yes' : 'no'}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value === '' ? null : e.target.value === 'yes' }))}
                        className="input-field py-2.5 appearance-none pr-10"
                      >
                        <option value="">Not set</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary-400 mb-1.5">Music Preference</label>
                  <div className="relative">
                    <select
                      value={form.musicPreference}
                      onChange={e => set('musicPreference', e.target.value)}
                      className="input-field py-2.5 appearance-none pr-10"
                    >
                      <option value="">Not set</option>
                      <option value="none">No Music</option>
                      <option value="soft">Soft/Background Music</option>
                      <option value="upbeat">Upbeat</option>
                      <option value="gbedu">Gbedu</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary-400 mb-1.5">Max Luggage Size</label>
                  <div className="relative">
                    <select
                      value={form.maxLuggageSize}
                      onChange={e => set('maxLuggageSize', e.target.value)}
                      className="input-field py-2.5 appearance-none pr-10"
                    >
                      <option value="">Not set</option>
                      <option value="small">Small (Backpack/Handbag)</option>
                      <option value="medium">Medium (Suitcase)</option>
                      <option value="large">Large (Multiple Suitcases)</option>
                      <option value="xl">Extra Large (Cargo)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary-400 mb-1.5">Luggage Fee Per Item (NGN)</label>
                  <input
                    type="text"
                    value={form.luggageFeePerItem}
                    onChange={e => set('luggageFeePerItem', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="input-field py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary-400 mb-1.5">Pickup Grace Time (minutes)</label>
                  <input
                    type="text"
                    value={form.pickupGraceTimeMinutes}
                    onChange={e => set('pickupGraceTimeMinutes', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10"
                    className="input-field py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">Additional Notes</label>
                <textarea
                  value={form.additionalNotes}
                  onChange={e => set('additionalNotes', e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Anything else passengers should know"
                  className="input-field py-2.5 resize-none"
                />
              </div>
            </div>
          )}
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
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing…
              </>
            ) : 'Publish Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

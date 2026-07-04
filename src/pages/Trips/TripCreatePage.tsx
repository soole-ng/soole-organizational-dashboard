import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, ChevronDown, MapPin } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { formatMoney } from '../../lib/formatters'
import { useOrg } from '../../lib/OrgContext'
import { vehiclesApi, driversApi, organizationApi } from '../../api/client'
import { adaptVehicle, adaptDriverIdentity } from '../../lib/adapters'
import { invalidateApiDataCache } from '../../lib/useApiData'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export function TripCreatePage() {
  const navigate = useNavigate()
  const { orgUuid } = useOrg()
  const [form, setForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
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

  const handlePublish = async () => {
    if (!orgUuid) {
      toast.error('No organization selected')
      return
    }
    if (!form.pickupLocation.trim() || !form.dropoffLocation.trim()) {
      toast.error('Enter pickup and dropoff locations')
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

    setPublishing(true)
    try {
      await organizationApi.createTrip(orgUuid, {
        driver_uuid: form.driverId,
        origin_address: form.pickupLocation.trim(),
        destination_address: form.dropoffLocation.trim(),
        departure_date: new Date(form.departureAt).toISOString(),
        total_seats: selectedVehicle?.capacity || 14,
        price_per_seat: form.fare,
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

          {/* Pickup & Dropoff side-by-side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Pickup Location
              </label>
              <input
                type="text"
                value={form.pickupLocation}
                onChange={e => set('pickupLocation', e.target.value)}
                placeholder="e.g. Lagos"
                className="input-field py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Dropoff Location
              </label>
              <input
                type="text"
                value={form.dropoffLocation}
                onChange={e => set('dropoffLocation', e.target.value)}
                placeholder="e.g. Ibadan"
                className="input-field py-2.5"
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
              Enter the amount you normally charge for the trip. Soole's 8% commission will be automatically added to this to determine the final passenger fare.
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
              const commPerSeat = Math.round(netPerSeat * 0.08)
              const passengerFare = netPerSeat + commPerSeat

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

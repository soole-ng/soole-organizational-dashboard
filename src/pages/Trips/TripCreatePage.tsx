import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, ChevronDown, MapPin } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { formatMoney } from '../../lib/formatters'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export function TripCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    pickupLocation: 'Lagos',
    dropoffLocation: 'Ibadan',
    vehicleId: 'v1',
    driverId: 'd1',
    departureAt: '2026-06-27T06:00',
    fare: 5000,
  })
  const [showCalc, setShowCalc] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [mockVehiclesList, setMockVehiclesList] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  useEffect(() => {
    fetch('/mock-data.json')
      .then(res => res.json())
      .then(data => {
        setMockVehiclesList(data.vehicles || [])
        setLocations(data.locations || [])
      })
      .catch(console.error)
  }, [])

  const selectedVehicle = mockVehiclesList.find(v => v.id === form.vehicleId)

  const set = (key: string, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }))

  const handlePublish = () => {
    setPublishing(true)
    setTimeout(() => {
      setPublishing(false)
      toast.success('Trip published!')
      navigate('/trips')
    }, 1200)
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary-75">
      <TopBar title="New Trip" backHref="/trips" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-primary-500 hidden lg:block">Create a trip</h2>

          {/* Pickup Location */}
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Pickup Location
            </label>
            <div className="relative">
              <select
                value={form.pickupLocation}
                onChange={e => set('pickupLocation', e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
            </div>
          </div>

          {/* Dropoff Location */}
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Dropoff Location
            </label>
            <div className="relative">
              <select
                value={form.dropoffLocation}
                onChange={e => set('dropoffLocation', e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {locations.filter(s => s.name !== form.pickupLocation).map(loc => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
            </div>
            <p className="text-[11px] text-neutral-200 mt-1">
              {form.pickupLocation} → {form.dropoffLocation}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Vehicle</label>
            <div className="relative">
              <select
                value={form.vehicleId}
                onChange={e => set('vehicleId', e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {mockVehiclesList.filter(v => v.status === 'verified').map(v => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.model} ({v.capacity} seats)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
            </div>
            {selectedVehicle?.assignedDriverName && (
              <p className="text-[11px] text-secondary-300 mt-1 font-medium">
                Driver: {selectedVehicle.assignedDriverName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Departure Date & Time</label>
            <input
              type="datetime-local"
              value={form.departureAt}
              onChange={e => set('departureAt', e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-primary-400">Fare per seat</label>
              <button
                onClick={() => setShowCalc(!showCalc)}
                className="flex items-center gap-1 text-xs text-secondary-300 font-medium"
              >
                <Calculator className="w-3.5 h-3.5" /> Calculator
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-200">NGN</span>
              <input
                type="number"
                value={form.fare}
                onChange={e => set('fare', Number(e.target.value))}
                className="input-field pl-14 stat-number"
              />
            </div>

            {showCalc && (
              <div className="mt-3 p-3 bg-primary-75 rounded-xl">
                <p className="text-[11px] text-neutral-200 mb-2 font-medium">Estimated Earnings</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-200">Fare per seat</span>
                  <span className="font-semibold text-primary-500 stat-number">{formatMoney(form.fare)}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1.5 border-t border-primary-100 pt-1.5">
                  <span className="text-neutral-200">Total potential payout (if full)</span>
                  <span className="font-bold text-secondary-300 stat-number">
                    {formatMoney(form.fare * (selectedVehicle?.capacity || 14))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={clsx(
              'btn-primary w-full flex items-center justify-center gap-2',
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
          <button
            onClick={() => toast('Trip saved as draft')}
            className="btn-secondary w-full"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  )
}

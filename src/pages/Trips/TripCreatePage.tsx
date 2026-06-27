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
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="New Trip" backHref="/trips" />

      <div className="flex-1 p-3 space-y-3 lg:pt-6 lg:px-8 w-full max-w-2xl mx-auto">
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-primary-500 hidden lg:block">Create a trip</h2>

          {/* Pickup & Dropoff side-by-side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Pickup Location */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Pickup Location
              </label>
              <div className="relative">
                <select
                  value={form.pickupLocation}
                  onChange={e => set('pickupLocation', e.target.value)}
                  className="input-field py-2 text-xs appearance-none pr-10"
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
              <label className="block text-xs font-semibold text-primary-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Dropoff Location
              </label>
              <div className="relative">
                <select
                  value={form.dropoffLocation}
                  onChange={e => set('dropoffLocation', e.target.value)}
                  className="input-field py-2 text-xs appearance-none pr-10"
                >
                  {locations.filter(s => s.name !== form.pickupLocation).map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Vehicle selection */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1">Vehicle</label>
              <div className="relative">
                <select
                  value={form.vehicleId}
                  onChange={e => set('vehicleId', e.target.value)}
                  className="input-field py-2 text-xs appearance-none pr-10"
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
                <p className="text-[10px] text-secondary-300 mt-0.5 font-medium">
                  Driver: {selectedVehicle.assignedDriverName}
                </p>
              )}
            </div>

            {/* Departure */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1">Departure Date & Time</label>
              <input
                type="datetime-local"
                value={form.departureAt}
                onChange={e => set('departureAt', e.target.value)}
                className="input-field py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-primary-400">Fare per seat</label>
              <button
                onClick={() => setShowCalc(!showCalc)}
                className="flex items-center gap-1 text-[11px] text-secondary-300 font-medium"
              >
                <Calculator className="w-3 h-3" /> Calculator
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-200">NGN</span>
              <input
                type="number"
                value={form.fare}
                onChange={e => set('fare', Number(e.target.value))}
                className="input-field py-2 text-xs pl-14 stat-number"
              />
            </div>

            {showCalc && (
              <div className="mt-2.5 p-3 bg-white border border-neutral-100 rounded-xl shadow-sm">
                <p className="text-[11px] font-bold text-black mb-1">Estimated Earnings & Commission</p>
                <div className="flex justify-between items-center text-[11px] py-0.5">
                  <span className="text-neutral-300">Fare per seat</span>
                  <span className="font-semibold text-black stat-number">{formatMoney(form.fare)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] py-0.5 border-t border-neutral-50 mt-0.5">
                  <span className="text-neutral-300">Total potential gross (if full)</span>
                  <span className="font-bold text-black stat-number">
                    {formatMoney(form.fare * (selectedVehicle?.capacity || 14))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] py-0.5 text-danger">
                  <span className="text-neutral-300">Soole Commission (8%)</span>
                  <span className="font-semibold stat-number">
                    -{formatMoney(form.fare * (selectedVehicle?.capacity || 14) * 0.08)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] py-1 border-t border-neutral-100 mt-0.5">
                  <span className="font-semibold text-black">Net Payout to bank</span>
                  <span className="font-black text-primary-500 stat-number">
                    {formatMoney(form.fare * (selectedVehicle?.capacity || 14) * 0.92)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-1">
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

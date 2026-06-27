import { useState, useEffect } from 'react'
import { Plus, Users, CheckCircle2, Clock, XCircle, Car, Bus, X, History } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState } from '../../components/ui/EmptyState'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useMockData } from '../../lib/useMockData'
import { formatDate, formatTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'
import toast from 'react-hot-toast'

const filters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]

function VehicleIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'Hiace' || type === 'Coaster') return <Bus className={className} />
  return <Car className={className} />
}

function docStatusIcon(status: string) {
  if (status === 'approved') return <CheckCircle2 className="w-3 h-3 text-secondary-300" />
  if (status === 'pending' || status === 'uploaded') return <Clock className="w-3 h-3 text-warning" />
  return <XCircle className="w-3 h-3 text-warning" />
}

const getDriverAvatar = (driverId: string) => {
  const avatars: Record<string, string> = {
    'd1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'd2': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'd3': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    'd4': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  }
  return avatars[driverId] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
}

export function VehiclesPage() {
  const { data, loading } = useMockData()
  const [filter, setFilter] = useState<StatusVariant | 'all'>('all')
  const [historyVehicle, setHistoryVehicle] = useState<any | null>(null)
  
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [vehiclesList, setVehiclesList] = useState<any[]>([])

  useEffect(() => {
    if (data.vehicles.length > 0 && vehiclesList.length === 0) {
      setVehiclesList(data.vehicles)
    }
  }, [data.vehicles])

  const [form, setForm] = useState({
    plate: '',
    type: 'Hiace',
    model: '',
    year: '2023',
    capacity: '14',
    fuelType: 'petrol',
    color: 'White',
  })

  const [uploads, setUploads] = useState<Record<string, boolean>>({
    registration: false,
    roadWorthiness: false,
    insurance: false,
    exteriorFront: false,
    exteriorRear: false,
    exteriorRight: false,
    exteriorLeft: false,
  })

  const filtered = vehiclesList.filter(v => filter === 'all' || v.status === filter)
  const totalSeats = vehiclesList.reduce((a, v) => a + v.capacity, 0)
  const verified = vehiclesList.filter(v => v.status === 'verified').length

  const vehicleTrips = historyVehicle
    ? data.trips.filter((t: any) => t.vehicleId === historyVehicle.id)
    : []

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <TopBar title="Vehicles" backHref="/fleet" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8">
          {[1, 2, 3].map(i => <div key={i} className="h-52 bg-white rounded-card w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Vehicles" backHref="/fleet" />

      {/* Summary strip */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3 grid grid-cols-3 gap-3 lg:hidden">
        <div className="text-center">
          <p className="text-base font-black text-black">{verified}</p>
          <p className="text-[10px] text-black">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-black">{data.vehicles.length}</p>
          <p className="text-[10px] text-black">Total</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-black">{totalSeats}</p>
          <p className="text-[10px] text-black">Seats</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="bg-white border-b border-neutral-100 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                filter === f.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-200 border-neutral-100 hover:border-primary-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 max-w-7xl mx-auto w-full">
        <DesktopPageHeader
          title="Vehicles"
          subtitle={`${filtered.length} vehicles · ${totalSeats} total seats`}
          actions={
            <button
              onClick={() => { setShowAddSheet(true); setCurrentStep(1); }}
              className="flex items-center gap-2 bg-[#042011] text-white font-semibold rounded-btn px-5 py-2.5 text-sm hover:bg-primary-400 transition-colors"
            >
              + Add Vehicle
            </button>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles yet" description="Add your first vehicle to start publishing trips." action={{ label: '+ Add Vehicle', onClick: () => {} }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(vehicle => {
              const approvedDocs = vehicle.documents.filter((d: any) => d.status === 'approved').length
              const totalDocs = vehicle.documents.length

              return (
                <div key={vehicle.id} className="bg-white rounded-card border border-neutral-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                  {/* Card header — dark green, 40% transparent */}
                  <div className="bg-[#042011]/60 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                        <VehicleIcon type={vehicle.type} className="w-5 h-5 text-[#042011]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold !text-white">{vehicle.plate}</p>
                        <p className="text-[10px] !text-white/80">{vehicle.model} · {vehicle.year} · {vehicle.capacity} seats</p>
                      </div>
                    </div>
                    <span
                      className="font-black uppercase tracking-wider font-sans"
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.2',
                        color: vehicle.status === 'verified' ? '#00C853' : vehicle.status === 'pending' ? '#FF5500' : '#9CA3AF'
                      }}
                    >
                      {vehicle.status}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 space-y-3">

                    {/* Documents */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-xs font-bold text-black">
                        <span className="text-black font-semibold">Documents</span>
                        <span className={clsx('font-black', approvedDocs === totalDocs ? 'text-[#00C853]' : 'text-[#FF5500]')}>
                          {approvedDocs}/{totalDocs} approved
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {vehicle.documents.map((doc: any) => (
                          <div key={doc.type} className="flex items-center gap-1 text-[11px] bg-[#042011]/60 rounded-lg px-2 py-0.5">
                            {docStatusIcon(doc.status)}
                            <span className="!text-white font-medium">{doc.label.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setHistoryVehicle(vehicle)}
                      className="w-full text-xs text-primary-400 font-bold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-100 hover:bg-primary-75 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" /> View Trip History
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add vehicle"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Vehicle History Modal */}
      {historyVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-float flex flex-col max-h-[80vh]">
            {/* Modal header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#042011]/60 flex items-center justify-center flex-shrink-0">
                <VehicleIcon type={historyVehicle.type} className="w-5 h-5 !text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-black">{historyVehicle.plate} — Trip History</h2>
                <p className="text-[10px] text-neutral-200">{historyVehicle.model} · {historyVehicle.year} · {historyVehicle.capacity} seats</p>
              </div>
              <button
                onClick={() => setHistoryVehicle(null)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-neutral-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin">
              {vehicleTrips.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-10 h-10 text-neutral-100 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-black">No trip history yet</p>
                  <p className="text-xs text-neutral-200 mt-1">Completed trips will appear here.</p>
                </div>
              ) : (
                vehicleTrips.map((trip: any) => (
                  <div key={trip.id} className="bg-white rounded-xl p-3 border border-neutral-100">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-bold text-black leading-snug">
                        {trip.origin} → {trip.destination}
                      </p>
                      <StatusPill status={trip.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-200">
                      <span>{formatDate(trip.departureAt)}</span>
                      <span>{formatTime(trip.departureAt)}</span>
                      <span className="ml-auto text-black font-semibold">{trip.driverName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-200 mt-1">
                      <span>{trip.bookedSeats}/{trip.capacity} seats booked</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setShowAddSheet(true); setCurrentStep(1); }}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add vehicle"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Invite Sheet */}
      <BottomSheet open={showAddSheet} onClose={() => setShowAddSheet(false)} title="Register a Vehicle">
        {/* Progress Bar / Steps indicator */}
        <div className="flex items-center justify-between mb-5 border-b border-neutral-50 pb-3">
          {[
            { step: 1, label: 'Details' },
            { step: 2, label: 'Documents' },
            { step: 3, label: 'Summary' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-1.5">
              <span className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                currentStep === s.step
                  ? 'bg-[#042011] text-white border-[#042011]'
                  : currentStep > s.step
                    ? 'bg-secondary-300 text-white border-secondary-300'
                    : 'bg-white text-neutral-200 border-neutral-100'
              )}>
                {s.step}
              </span>
              <span className={clsx(
                'text-[10px] font-bold',
                currentStep === s.step ? 'text-primary-500' : 'text-neutral-200'
              )}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Basic details form */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Plate Number</label>
              <input
                className="input-field uppercase"
                placeholder="e.g. KJA 008 MN"
                value={form.plate}
                onChange={e => setForm(p => ({ ...p, plate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Vehicle Type</label>
                <select
                  className="input-field"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                >
                  <option value="Hiace">Hiace Bus</option>
                  <option value="Sienna">Sienna Mini-van</option>
                  <option value="Coaster">Coaster Bus</option>
                  <option value="Other">Other Sedan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Fuel Type</label>
                <select
                  className="input-field"
                  value={form.fuelType}
                  onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))}
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Model Name</label>
              <input
                className="input-field"
                placeholder="e.g. Toyota Hiace Hummer"
                value={form.model}
                onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Manufacture Year</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="e.g. 2022"
                  value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Seating Capacity</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="e.g. 14"
                  value={form.capacity}
                  onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Vehicle Color</label>
              <select
                className="input-field"
                value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
              >
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Silver">Silver</option>
                <option value="Grey">Grey</option>
                <option value="Blue">Blue</option>
                <option value="Red">Red</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
            <button
              onClick={() => {
                if (!form.plate || !form.model || !form.year || !form.capacity) {
                  toast.error('Please fill in all details')
                  return
                }
                setCurrentStep(2)
              }}
              className="btn-primary w-full mt-2"
            >
              Continue to Documents
            </button>
          </div>
        )}

        {/* Step 2: Upload Documents checklists */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-50 rounded-xl p-3 border border-neutral-100">
              Attach clear photos of documents and all 4 side views of the vehicle showing the plate number to complete verification. Tap each to attach.
            </p>
            {[
              { key: 'registration', label: 'Vehicle Registration License' },
              { key: 'roadWorthiness', label: 'Road Worthiness Certificate' },
              { key: 'insurance', label: 'Insurance Policy Document' },
              { key: 'exteriorFront', label: 'Vehicle Exterior Photo (Front View - showing plate number)' },
              { key: 'exteriorRear', label: 'Vehicle Exterior Photo (Rear View - showing plate number)' },
              { key: 'exteriorRight', label: 'Vehicle Exterior Photo (Right Side View)' },
              { key: 'exteriorLeft', label: 'Vehicle Exterior Photo (Left Side View)' },
            ].map(d => (
              <button
                key={d.key}
                onClick={() => setUploads(p => ({ ...p, [d.key]: !p[d.key] }))}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-neutral-50 hover:bg-neutral-50/50 transition-colors text-left bg-white"
              >
                <div>
                  <p className="text-xs font-bold text-black">{d.label}</p>
                  <p className="text-[10px] text-neutral-200 mt-0.5">
                    {uploads[d.key] ? 'Attached successfully' : 'Tap to attach document'}
                  </p>
                </div>
                {uploads[d.key] ? (
                  <span className="w-5 h-5 rounded-full bg-secondary-300 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-neutral-50 border border-neutral-100 flex-shrink-0" />
                )}
              </button>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={() => setCurrentStep(1)} className="btn-secondary w-full">Back</button>
              <button
                onClick={() => {
                  const allUploaded = Object.values(uploads).every(v => v)
                  if (!allUploaded) {
                     toast.error('Please upload all required documents and side photos')
                     return
                  }
                  setCurrentStep(3)
                }}
                className="btn-primary w-full"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Registration summary and success */}
        {currentStep === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary-50 text-secondary-300 flex items-center justify-center mx-auto border border-secondary-100 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">Ready for Verification</h3>
              <p className="text-xs text-neutral-200 mt-1 max-w-xs mx-auto leading-relaxed">
                Your vehicle has been registered and all files were uploaded. It will remain in "Pending" status until verified.
              </p>
            </div>
            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-left space-y-1.5 text-xs max-w-sm mx-auto">
              <div className="flex justify-between"><span className="text-neutral-200">Plate Number</span><span className="font-bold text-black uppercase">{form.plate}</span></div>
              <div className="flex justify-between"><span className="text-neutral-200">Color</span><span className="font-bold text-black">{form.color}</span></div>
              <div className="flex justify-between"><span className="text-neutral-200">Model</span><span className="font-bold text-black">{form.model}</span></div>
              <div className="flex justify-between"><span className="text-neutral-200">Capacity</span><span className="font-bold text-black">{form.capacity} seats</span></div>
              <div className="flex justify-between"><span className="text-neutral-200">Fuel Type</span><span className="font-bold text-black capitalize">{form.fuelType}</span></div>
            </div>
            <button
              onClick={() => {
                const newVehicle = {
                  id: `v${Date.now()}`,
                  plate: form.plate.toUpperCase(),
                  model: form.model,
                  year: parseInt(form.year) || 2023,
                  capacity: parseInt(form.capacity) || 14,
                  type: form.type as any,
                  fuelType: form.fuelType as any,
                  status: 'pending' as const,
                  fuelLevel: 100,
                  totalKm: 0,
                  documents: [
                    { type: 'registration' as const, label: 'Registration', status: 'uploaded' as const },
                    { type: 'road_worthiness' as const, label: 'Road Worthiness', status: 'uploaded' as const },
                    { type: 'insurance' as const, label: 'Insurance', status: 'uploaded' as const },
                  ],
                }
                setVehiclesList(prev => [newVehicle, ...prev])
                toast.success('Vehicle registered and pending review!')
                setShowAddSheet(false)
                setCurrentStep(1)
                setForm({
                  plate: '',
                  type: 'Hiace',
                  model: '',
                  year: '2023',
                  capacity: '14',
                  fuelType: 'petrol',
                })
                setUploads({
                  registration: false,
                  roadWorthiness: false,
                  insurance: false,
                  exteriorFront: false,
                  exteriorRear: false,
                })
              }}
              className="btn-primary w-full mt-2"
            >
              Submit & Finish
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

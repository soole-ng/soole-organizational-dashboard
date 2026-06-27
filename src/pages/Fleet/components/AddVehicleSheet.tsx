import { useState } from 'react'
import { CheckCircle2, Upload, Camera } from 'lucide-react'
import { BottomSheet } from '../../../components/ui/BottomSheet'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface AddVehicleSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: (vehicle: any) => void
  currentStep: number
  setCurrentStep: (step: number) => void
}

export function AddVehicleSheet({ open, onClose, onSuccess, currentStep, setCurrentStep }: AddVehicleSheetProps) {
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

  return (
    <BottomSheet open={open} onClose={onClose} title="Register a Vehicle">
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
                  ? 'bg-primary-500 text-white border-primary-500'
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

      {currentStep === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed bg-white rounded-xl p-3 border border-neutral-100">
            Attach clear photos of documents and all 4 side views of the vehicle showing the plate number to complete verification. 
          </p>
          <div className="space-y-2">
            {[
              { key: 'registration', label: 'Vehicle Registration License' },
              { key: 'roadWorthiness', label: 'Road Worthiness Certificate' },
              { key: 'insurance', label: 'Insurance Policy Document' },
              { key: 'exteriorFront', label: 'Vehicle Exterior Photo (Front View - showing plate number)' },
              { key: 'exteriorRear', label: 'Vehicle Exterior Photo (Rear View - showing plate number)' },
              { key: 'exteriorRight', label: 'Vehicle Exterior Photo (Right Side View)' },
              { key: 'exteriorLeft', label: 'Vehicle Exterior Photo (Left Side View)' },
            ].map(d => (
              <div
                key={d.key}
                className="p-3 rounded-2xl border border-neutral-100 bg-white flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black truncate">{d.label}</p>
                  <p className="text-[10px] text-neutral-200 mt-0.5">
                    {uploads[d.key] ? 'Attached successfully' : 'Tap to attach document'}
                  </p>
                </div>

                <input
                  type="file"
                  id={`file-upload-${d.key}`}
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploads(p => ({ ...p, [d.key]: true }))
                      toast.success(`${d.label} file attached!`)
                    }
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id={`camera-capture-${d.key}`}
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploads(p => ({ ...p, [d.key]: true }))
                      toast.success(`${d.label} photo captured!`)
                    }
                  }}
                />

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      document.getElementById(`file-upload-${d.key}`)?.click()
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-white hover:bg-neutral-50 rounded-xl text-primary-500 border border-neutral-100 transition-colors"
                    title="Upload File"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById(`camera-capture-${d.key}`)?.click()
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-white hover:bg-neutral-50 rounded-xl text-primary-500 border border-neutral-100 transition-colors"
                    title="Use Camera"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  {uploads[d.key] ? (
                    <span className="w-5 h-5 rounded-full bg-white border border-primary-500 flex items-center justify-center text-primary-500 text-[10px] font-bold">✓</span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-white border border-neutral-100" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-bold rounded-xl text-primary-500 bg-white transition-colors w-full"
            >
              Back
            </button>
            <button
              onClick={() => {
                const allUploaded = Object.values(uploads).every(v => v)
                if (!allUploaded) {
                   toast.error('Please upload or snap all required documents and side photos')
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

      {currentStep === 3 && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mx-auto border border-primary-100 shadow-sm animate-bounce">
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
              onSuccess(newVehicle)
              toast.success('Vehicle registered and pending review!')
              setForm({
                plate: '',
                type: 'Hiace',
                model: '',
                year: '2023',
                capacity: '14',
                fuelType: 'petrol',
                color: 'White',
              })
              setUploads({
                registration: false,
                roadWorthiness: false,
                insurance: false,
                exteriorFront: false,
                exteriorRear: false,
                exteriorRight: false,
                exteriorLeft: false,
              })
            }}
            className="btn-primary w-full mt-2"
          >
            Submit & Finish
          </button>
        </div>
      )}
    </BottomSheet>
  )
}

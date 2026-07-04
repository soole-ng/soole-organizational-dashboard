import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Upload, Camera, ChevronRight, X, Trash2 } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { kVehicleMakeModels } from '../../lib/constants'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../lib/OrgContext'
import { vehiclesApi } from '../../api/client'
import { invalidateApiDataCache } from '../../lib/useApiData'

const colors = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Gold', 'Other']

const photoSteps = [
  {
    key: 'exteriorFront',
    heading: 'Front View',
    description: 'Make sure the license plate is clearly visible.',
    icon: '/icons/vehicles/front_view.svg'
  },
  {
    key: 'exteriorSideRight',
    heading: 'Side View (Right)',
    description: 'Capture the entire right side of the vehicle.',
    icon: '/icons/vehicles/side_right.svg'
  },
  {
    key: 'exteriorSideLeft',
    heading: 'Side View (Left)',
    description: 'Capture the entire left side of the vehicle.',
    icon: '/icons/vehicles/side_left.svg'
  },
  {
    key: 'exteriorRear',
    heading: 'Rear View',
    description: 'Make sure the rear license plate is visible.',
    icon: '/icons/vehicles/rear_view.svg'
  }
]

const documentSteps = [
  { key: 'registration', label: 'Vehicle Registration License' },
  { key: 'roadWorthiness', label: 'Road Worthiness Certificate' },
  { key: 'insurance', label: 'Insurance Policy Document' },
]

export function AddVehiclePage() {
  const navigate = useNavigate()
  const { orgUuid } = useOrg()
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: Details
  const [year, setYear] = useState('')
  const [brand, setBrand] = useState('')
  const [otherBrand, setOtherBrand] = useState('')
  const [model, setModel] = useState('')
  const [otherModel, setOtherModel] = useState('')
  const [plate, setPlate] = useState('')
  const [capacity, setCapacity] = useState('14')
  const [type, setType] = useState('Hiace')
  const [fuelType, setFuelType] = useState('petrol')
  
  // Step 2: Color
  const [color, setColor] = useState('')
  const [otherColor, setOtherColor] = useState('')
  
  // Step 3: Photos & Docs
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0)
  const [uploads, setUploads] = useState<Record<string, { url: string, file: File } | null>>({
    exteriorFront: null,
    exteriorSideRight: null,
    exteriorSideLeft: null,
    exteriorRear: null,
    registration: null,
    roadWorthiness: null,
    insurance: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const brands = Object.keys(kVehicleMakeModels).sort()
  const models = brand && brand !== 'Other' ? kVehicleMakeModels[brand] || [] : []

  const handleFileUpload = (key: string, file: File) => {
    const url = URL.createObjectURL(file)
    setUploads(prev => ({ ...prev, [key]: { url, file } }))
    toast.success('File attached successfully')
  }

  const renderStepIndicators = () => (
    <div className="flex items-center justify-center gap-2 mb-8 mt-4">
      {[1, 2, 3, 4].map(s => (
        <div
          key={s}
          className={clsx(
            'w-2 h-2 rounded-full transition-colors',
            currentStep === s
              ? 'bg-primary-500 w-6'
              : currentStep > s
                ? 'bg-primary-500/40'
                : 'bg-neutral-100'
          )}
        />
      ))}
    </div>
  )

  const finalBrand = brand === 'Other' ? otherBrand : brand
  const finalModel = model === 'Other' ? otherModel : model
  const finalColor = color === 'Other' ? otherColor : color

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar
        title="Register Vehicle"
        backHref="/fleet/vehicles"
      />

      <div className="flex-1 max-w-xl mx-auto w-full px-4 flex flex-col pb-24">
        {renderStepIndicators()}

        {currentStep === 1 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div>
              <h2 className="text-xl font-bold text-black">Vehicle Details</h2>
              <p className="text-sm text-neutral-300 mt-1">Tell us about your car</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Manufacture Year</label>
                <select className="input-field" value={year} onChange={e => setYear(e.target.value)}>
                  <option value="" disabled>Select Year</option>
                  {Array.from({ length: 75 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Car Brand</label>
                <select className="input-field" value={brand} onChange={e => { setBrand(e.target.value); setModel(''); }}>
                  <option value="" disabled>Select Brand</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="Other">Other</option>
                </select>
                {brand === 'Other' && (
                  <input className="input-field mt-2" placeholder="Enter custom brand" value={otherBrand} onChange={e => setOtherBrand(e.target.value)} />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Car Model</label>
                <select className="input-field" value={model} onChange={e => setModel(e.target.value)} disabled={!brand}>
                  <option value="" disabled>Select Model</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="Other">Other</option>
                </select>
                {model === 'Other' && (
                  <input className="input-field mt-2" placeholder="Enter custom model" value={otherModel} onChange={e => setOtherModel(e.target.value)} />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Plate Number</label>
                <input
                  className="input-field uppercase"
                  placeholder="ABC-123DE"
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-50">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Vehicle Type</label>
                  <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Hiace">Hiace Bus</option>
                    <option value="Sienna">Sienna</option>
                    <option value="Coaster">Coaster</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Fuel Type</label>
                  <select className="input-field" value={fuelType} onChange={e => setFuelType(e.target.value)}>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1.5">Seating Capacity</label>
                  <input className="input-field" type="number" placeholder="e.g. 14" value={capacity} onChange={e => setCapacity(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button
                className="btn-primary w-full"
                onClick={() => {
                  if (!year || !finalBrand || !finalModel || !plate || !capacity) {
                    toast.error('Please fill in all details')
                    return
                  }
                  setCurrentStep(2)
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div>
              <h2 className="text-xl font-bold text-black">What is the car color?</h2>
              <p className="text-sm text-neutral-300 mt-1">Select the primary color of your vehicle.</p>
            </div>

            <div className="flex-1 space-y-2">
              {colors.map(c => (
                <label key={c} className="flex items-center justify-between p-4 border-b border-neutral-50 cursor-pointer hover:bg-neutral-50 transition-colors rounded-xl">
                  <div className="flex items-center gap-3">
                    {c !== 'Other' && (
                      <div 
                        className="w-6 h-6 rounded-full border border-neutral-200" 
                        style={{ backgroundColor: c.toLowerCase() }} 
                      />
                    )}
                    <span className="text-sm font-semibold text-black">{c}</span>
                  </div>
                  <input
                    type="radio"
                    name="color"
                    className="w-5 h-5 accent-primary-500"
                    checked={color === c}
                    onChange={() => setColor(c)}
                  />
                </label>
              ))}
              {color === 'Other' && (
                 <input className="input-field mt-4" placeholder="Enter custom color" value={otherColor} onChange={e => setOtherColor(e.target.value)} />
              )}
            </div>

            <div className="mt-auto pt-8">
              <button
                className="btn-primary w-full"
                disabled={!finalColor}
                onClick={() => setCurrentStep(3)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div>
              <h2 className="text-xl font-bold text-black">Vehicle Images</h2>
              <p className="text-sm text-neutral-300 mt-1">Upload clear photos of the vehicle and its documents.</p>
            </div>

            {/* Photos Carousel */}
            {currentPhotoStep < photoSteps.length ? (() => {
              const step = photoSteps[currentPhotoStep]
              const hasImage = !!uploads[step.key]
              
              return (
                <div className="flex flex-col gap-6 flex-1">
                  <div className="flex gap-2 justify-center">
                     {photoSteps.map((_, i) => (
                       <div key={i} className={clsx("h-1.5 w-8 rounded-full", i === currentPhotoStep ? "bg-primary-500" : "bg-neutral-100")} />
                     ))}
                  </div>

                  <div className="relative h-56 w-full rounded-3xl border border-neutral-100 bg-neutral-50 flex items-center justify-center overflow-hidden shadow-sm">
                    {hasImage ? (
                      <>
                        <img src={uploads[step.key]!.url} alt={step.heading} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setUploads(p => ({ ...p, [step.key]: null }))}
                          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-10 h-10 text-primary-500 mx-auto mb-3 animate-pulse" />
                        <p className="text-lg text-primary-500 font-black uppercase tracking-widest">Tap Here to Upload</p>
                      </div>
                    )}
                    {!hasImage && (
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => {
                          if (e.target.files?.[0]) handleFileUpload(step.key, e.target.files[0])
                        }} 
                      />
                    )}
                  </div>

                  <div className="bg-neutral-50 rounded-3xl p-6 text-center flex-1 flex flex-col items-center justify-center border border-neutral-100">
                    <h3 className="text-base font-bold text-black mb-4">{step.heading}</h3>
                    <img src={step.icon} alt={step.heading} className="h-24 w-auto mb-4 opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    <p className="text-xs text-neutral-300 max-w-[200px]">{step.description}</p>
                  </div>

                  <button
                    className="btn-primary w-full mt-auto"
                    disabled={!hasImage}
                    onClick={() => setCurrentPhotoStep(c => c + 1)}
                  >
                    Continue
                  </button>
                </div>
              )
            })() : (
              /* Documents Sub-step */
              <div className="flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                  <h3 className="text-sm font-bold text-black">Documents</h3>
                  {documentSteps.map(doc => {
                    const isUploaded = !!uploads[doc.key]
                    return (
                      <div key={doc.key} className="p-3 rounded-2xl border border-neutral-100 bg-white flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                        <div className="flex-1 min-w-0 z-10">
                          <p className="text-xs font-bold text-black truncate">{doc.label}</p>
                          <p className="text-[10px] text-neutral-300 mt-0.5">
                            {isUploaded ? 'Attached successfully' : 'Tap to attach document'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 z-10 pointer-events-none">
                           {isUploaded ? (
                             <span className="w-5 h-5 rounded-full bg-white border border-[#00C853] flex items-center justify-center text-[#00C853] text-[10px] font-bold">✓</span>
                           ) : (
                             <span className="w-5 h-5 rounded-full bg-white border border-neutral-200" />
                           )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                          onChange={e => {
                            if (e.target.files?.[0]) handleFileUpload(doc.key, e.target.files[0])
                          }} 
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={() => setCurrentPhotoStep(photoSteps.length - 1)} className="btn-secondary w-full">Back</button>
                  <button
                    className="btn-primary w-full"
                    onClick={() => {
                      const docsUploaded = documentSteps.every(d => uploads[d.key])
                      if (!docsUploaded) {
                        toast.error('Please attach all required documents')
                        return
                      }
                      setCurrentStep(4)
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="text-center py-4 space-y-6 flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mx-auto border border-primary-100 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-black">Ready for Verification</h3>
              <p className="text-sm text-neutral-300 mt-2 max-w-xs mx-auto leading-relaxed">
                Your vehicle details and documents have been captured. It will remain pending until verified by our team.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-5 text-left space-y-3 text-sm max-w-sm mx-auto w-full shadow-sm">
              <div className="flex justify-between"><span className="text-neutral-300">Plate Number</span><span className="font-black text-black uppercase">{plate}</span></div>
              <div className="flex justify-between"><span className="text-neutral-300">Brand & Model</span><span className="font-bold text-black">{finalBrand} {finalModel}</span></div>
              <div className="flex justify-between"><span className="text-neutral-300">Year</span><span className="font-bold text-black">{year}</span></div>
              <div className="flex justify-between"><span className="text-neutral-300">Color</span>
                <span className="font-bold text-black flex items-center gap-2">
                  {finalColor}
                  {finalColor && finalColor.toLowerCase() !== 'other' && (
                    <span className="w-3 h-3 rounded-full border border-neutral-200" style={{ backgroundColor: finalColor.toLowerCase() }} />
                  )}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-neutral-300">Capacity</span><span className="font-bold text-black">{capacity} seats</span></div>
            </div>

            <div className="mt-8">
              <button
                className="btn-primary w-full flex justify-center items-center gap-2"
                disabled={isSubmitting}
                onClick={async () => {
                  if (!orgUuid) {
                    toast.error('No organization selected')
                    return
                  }
                  setIsSubmitting(true)
                  try {
                    const vehicleTypeMap: Record<string, string> = { Hiace: 'bus', Coaster: 'bus', Sienna: 'van', Other: 'sedan' }
                    await vehiclesApi.createVehicle(orgUuid, {
                      plate_number: plate,
                      brand: finalBrand,
                      model: finalModel,
                      year: parseInt(year, 10),
                      color: finalColor,
                      capacity: parseInt(capacity, 10),
                      vehicle_type: vehicleTypeMap[type] ?? 'sedan',
                    })
                    invalidateApiDataCache()
                    toast.success('Vehicle registered and pending review!')
                    navigate('/fleet/vehicles')
                  } catch (err: any) {
                    toast.error(err?.message ?? 'Failed to register vehicle')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vehicle'}
              </button>
              <p className="text-[10px] text-neutral-300 text-center mt-2">
                Document photos are attached to this request but require a follow-up upload step once verification begins.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

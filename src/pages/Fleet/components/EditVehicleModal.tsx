import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehiclesApi } from '../../../api/client'

interface EditVehicleModalProps {
  orgUuid: string
  vehicleId: string
  plate: string
  color?: string
  capacity: number
  onClose: () => void
  onSaved: () => void
}

/**
 * Correcting a vehicle's details after it has been added to the fleet.
 *
 * Seat count in particular: it is typed in once on the Add Vehicle page and
 * had no way back afterwards, so a 14-seater entered as 4 stayed a 4-seater
 * and every trip on it was capped at four seats. That matters more now that
 * a trip is refused if it offers more seats than its vehicle holds.
 */
export function EditVehicleModal({ orgUuid, vehicleId, plate, color, capacity, onClose, onSaved }: EditVehicleModalProps) {
  const [plateNumber, setPlateNumber] = useState(plate)
  const [vehicleColor, setVehicleColor] = useState(color ?? '')
  const [seats, setSeats] = useState(String(capacity))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const newCapacity = parseInt(seats, 10)

    if (isNaN(newCapacity) || newCapacity < 1) {
      toast.error('A vehicle must have at least one seat')
      return
    }
    if (!plateNumber.trim()) {
      toast.error('Plate number is required')
      return
    }

    setSaving(true)
    try {
      await vehiclesApi.updateVehicle(orgUuid, vehicleId, {
        plate_number: plateNumber.trim(),
        color: vehicleColor.trim() || undefined,
        capacity: newCapacity,
      })
      toast.success('Vehicle updated')
      onSaved()
    } catch (err: any) {
      // The backend refuses a capacity cut that would leave an active trip
      // overselling the vehicle, and says which trips - worth showing as-is
      // rather than replacing with something vaguer.
      toast.error(err?.message ?? 'Failed to update vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm mx-4 rounded-3xl shadow-float flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
          <Edit2 className="w-5 h-5 text-primary-400" />
          <h2 className="text-sm font-bold text-primary-500">Edit Vehicle</h2>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors text-lg font-light"
            aria-label="Close"
          >&#x2715;</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Plate Number</label>
            <input
              type="text"
              value={plateNumber}
              onChange={e => setPlateNumber(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Colour</label>
              <input
                type="text"
                value={vehicleColor}
                onChange={e => setVehicleColor(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Seats</label>
              <input
                type="number"
                min="1"
                value={seats}
                onChange={e => setSeats(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
              />
            </div>
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Seats are the vehicle's full capacity. A trip can be put out with fewer
            seats on offer, but never more.
          </p>
        </div>

        <div className="px-5 pb-5 pt-1 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-100 text-sm font-semibold text-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !plateNumber.trim() || !seats}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

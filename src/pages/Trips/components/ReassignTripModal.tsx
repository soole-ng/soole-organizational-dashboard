import { useState } from 'react'
import { Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import { organizationApi } from '../../../api/client'
import type { Driver, Vehicle } from '../../../types'

interface ReassignTripModalProps {
  orgUuid: string
  tripId: string
  currentDriverId: string
  currentVehicleId?: string
  drivers: Driver[]
  vehicles: Vehicle[]
  onClose: () => void
  onSaved: () => void
}

export function ReassignTripModal({
  orgUuid, tripId, currentDriverId, currentVehicleId, drivers, vehicles, onClose, onSaved,
}: ReassignTripModalProps) {
  const [driverId, setDriverId] = useState(currentDriverId)
  const [vehicleId, setVehicleId] = useState(currentVehicleId ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!driverId) {
      toast.error('Select a driver')
      return
    }
    setSaving(true)
    try {
      await organizationApi.reassignTrip(orgUuid, tripId, {
        driver_uuid: driverId,
        vehicle_uuid: vehicleId || undefined,
      })
      toast.success('Trip reassigned')
      onSaved()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reassign trip')
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
          <Navigation className="w-5 h-5 text-primary-400" />
          <h2 className="text-sm font-bold text-primary-500">Reassign Trip</h2>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors text-lg font-light"
            aria-label="Close"
          >&#x2715;</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Driver</label>
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
            >
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Vehicle (optional)</label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
            >
              <option value="">Keep current vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>
              ))}
            </select>
          </div>
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
            disabled={saving || !driverId}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Reassign'}
          </button>
        </div>
      </div>
    </div>
  )
}

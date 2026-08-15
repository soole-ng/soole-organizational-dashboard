import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { organizationApi } from '../../../api/client'

interface EditTripModalProps {
  orgUuid: string
  tripId: string
  departureAt: string
  pricePerSeat: number
  totalSeats: number
  bookedSeats: number
  preBookedSeats: number
  onClose: () => void
  onSaved: () => void
}

export function EditTripModal({ orgUuid, tripId, departureAt, pricePerSeat, totalSeats, bookedSeats, preBookedSeats, onClose, onSaved }: EditTripModalProps) {
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date(departureAt)
    // datetime-local input needs "YYYY-MM-DDTHH:mm" in local time
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [price, setPrice] = useState(String(pricePerSeat))
  const [tSeats, setTSeats] = useState(String(totalSeats))
  const [aSeats, setASeats] = useState(String(Math.max(0, totalSeats - bookedSeats)))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const newTotalSeats = parseInt(tSeats, 10)
      const newAvailableSeats = parseInt(aSeats, 10)

      if (isNaN(newTotalSeats) || newTotalSeats < 1) {
        toast.error('Invalid total seats')
        setSaving(false)
        return
      }

      if (isNaN(newAvailableSeats) || newAvailableSeats < 0 || newAvailableSeats > newTotalSeats) {
        toast.error('Invalid available seats')
        setSaving(false)
        return
      }

      const realPassengers = bookedSeats - preBookedSeats
      const newPreBookedSeats = newTotalSeats - newAvailableSeats - realPassengers

      if (newPreBookedSeats < 0) {
        toast.error(`Cannot increase available seats beyond what is physically available (Real passengers: ${realPassengers})`)
        setSaving(false)
        return
      }

      await organizationApi.updateTrip(orgUuid, tripId, {
        departure_date: new Date(departureDate).toISOString(),
        price_per_seat: parseFloat(price),
        total_seats: newTotalSeats,
        pre_booked_seats: newPreBookedSeats,
      })
      toast.success('Trip updated')
      onSaved()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update trip')
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
          <h2 className="text-sm font-bold text-primary-500">Edit Trip Details</h2>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors text-lg font-light"
            aria-label="Close"
          >&#x2715;</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Departure Date & Time</label>
            <input
              type="datetime-local"
              value={departureDate}
              onChange={e => setDepartureDate(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Price per Seat (NGN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Total Seats</label>
              <input
                type="number"
                min="1"
                value={tSeats}
                onChange={e => setTSeats(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Available Seats</label>
              <input
                type="number"
                min="0"
                value={aSeats}
                onChange={e => setASeats(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
              />
            </div>
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
            disabled={saving || !price || !departureDate}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

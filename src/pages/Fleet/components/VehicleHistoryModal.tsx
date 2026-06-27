import { X, History } from 'lucide-react'
import { StatusPill } from '../../../components/ui/StatusPill'
import { formatDate, formatTime } from '../../../lib/formatters'
import { VehicleIcon } from '../../../components/ui/VehicleIcons'

interface VehicleHistoryModalProps {
  historyVehicle: any
  vehicleTrips: any[]
  onClose: () => void
}

export function VehicleHistoryModal({ historyVehicle, vehicleTrips, onClose }: VehicleHistoryModalProps) {
  return (
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
            onClick={onClose}
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
  )
}

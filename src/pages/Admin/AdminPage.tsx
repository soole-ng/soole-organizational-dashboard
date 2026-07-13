/**
 * AdminPage — single centralized view over trips, vehicles, and drivers.
 * Requested as: "Manage all resources from one centralized page" instead of
 * hopping between /trips, /fleet/vehicles, and /fleet/drivers separately.
 * Trips get full edit/cancel here since that's what was asked for; vehicles
 * and drivers stay read-only tables with a link into their existing (already
 * fully-featured) dedicated pages rather than duplicating that UI.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Route, Car, Users, Search, Edit2, XCircle, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState } from '../../components/ui/EmptyState'
import { useApiData, invalidateApiDataCache } from '../../lib/useApiData'
import { useOrg } from '../../lib/OrgContext'
import { organizationApi } from '../../api/client'
import { formatMoney, formatDateTime } from '../../lib/formatters'
import { EditTripModal } from '../Trips/components/EditTripModal'

type Tab = 'trips' | 'vehicles' | 'drivers'

const TABS: { key: Tab; label: string; icon: typeof Route }[] = [
  { key: 'trips', label: 'Trips', icon: Route },
  { key: 'vehicles', label: 'Vehicles', icon: Car },
  { key: 'drivers', label: 'Drivers', icon: Users },
]

export function AdminPage() {
  const { data, loading } = useApiData()
  const { orgUuid, guardAction } = useOrg()
  const [tab, setTab] = useState<Tab>('trips')
  const [search, setSearch] = useState('')
  const [editingTripId, setEditingTripId] = useState<string | null>(null)
  const [cancellingTripId, setCancellingTripId] = useState<string | null>(null)

  const q = search.trim().toLowerCase()

  const trips = data.trips.filter(t =>
    !q || t.origin.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q) ||
    t.driverName.toLowerCase().includes(q) || t.vehiclePlate.toLowerCase().includes(q)
  )
  const vehicles = data.vehicles.filter(v =>
    !q || v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
  )
  const drivers = data.drivers.filter(d =>
    !q || d.name.toLowerCase().includes(q) || d.phone.toLowerCase().includes(q)
  )

  const editingTrip = editingTripId ? data.trips.find(t => t.id === editingTripId) : null

  const handleCancelTrip = (tripId: string) => guardAction(undefined, async () => {
    if (!orgUuid) return
    setCancellingTripId(tripId)
    try {
      await organizationApi.cancelTrip(orgUuid, tripId)
      invalidateApiDataCache()
      toast.success('Trip cancelled')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to cancel trip')
    } finally {
      setCancellingTripId(null)
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Admin" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 max-w-7xl mx-auto w-full">
        <DesktopPageHeader title="Admin" subtitle="View and manage every trip, vehicle, and driver in one place" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-neutral-50 rounded-xl p-1 w-fit">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  tab === t.key ? 'bg-white text-primary-500 shadow-sm' : 'text-neutral-300 hover:text-primary-400',
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                <span className="text-xs font-medium text-neutral-200">
                  ({t.key === 'trips' ? data.trips.length : t.key === 'vehicles' ? data.vehicles.length : data.drivers.length})
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200" />
            <input
              type="text"
              placeholder={`Search ${tab}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : tab === 'trips' ? (
          trips.length === 0 ? (
            <EmptyState icon={Route} title="No trips found" description="No trips match your search." />
          ) : (
            <div className="overflow-x-auto border border-neutral-100 rounded-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Departure</th>
                    <th className="px-4 py-3">Fare</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {trips.map(trip => {
                    const canManage = trip.status === 'scheduled'
                    return (
                      <tr key={trip.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/trips/${trip.id}`} className="font-semibold text-primary-500 hover:underline">
                            {trip.origin}{trip.originState ? `, ${trip.originState}` : ''} → {trip.destination}{trip.destinationState ? `, ${trip.destinationState}` : ''}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-neutral-400">{trip.driverName || '—'}</td>
                        <td className="px-4 py-3 text-neutral-400">{trip.vehiclePlate || '—'}</td>
                        <td className="px-4 py-3 text-neutral-400">{formatDateTime(trip.departureAt)}</td>
                        <td className="px-4 py-3 text-neutral-400">{formatMoney(trip.fare)}</td>
                        <td className="px-4 py-3"><StatusPill status={trip.status} size="sm" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => guardAction(undefined, () => setEditingTripId(trip.id))}
                              disabled={!canManage}
                              title={canManage ? 'Edit trip' : 'Only scheduled trips can be edited'}
                              className="p-1.5 rounded-lg text-neutral-300 hover:text-primary-500 hover:bg-primary-75 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancelTrip(trip.id)}
                              disabled={!canManage || cancellingTripId === trip.id}
                              title={canManage ? 'Cancel trip' : 'Only scheduled trips can be cancelled'}
                              className="p-1.5 rounded-lg text-neutral-300 hover:text-danger-300 hover:bg-danger-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'vehicles' ? (
          vehicles.length === 0 ? (
            <EmptyState icon={Car} title="No vehicles found" description="No vehicles match your search." />
          ) : (
            <div className="overflow-x-auto border border-neutral-100 rounded-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                    <th className="px-4 py-3">Plate</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Verification</th>
                    <th className="px-4 py-3">Operational</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary-500">{v.plate}</td>
                      <td className="px-4 py-3 text-neutral-400">{v.model}</td>
                      <td className="px-4 py-3 text-neutral-400">{v.capacity} seats</td>
                      <td className="px-4 py-3"><StatusPill status={v.status} size="sm" /></td>
                      <td className="px-4 py-3"><StatusPill status={v.operationalStatus} size="sm" /></td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/fleet/vehicles"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:underline"
                        >
                          Manage <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          drivers.length === 0 ? (
            <EmptyState icon={Users} title="No drivers found" description="No drivers match your search." />
          ) : (
            <div className="overflow-x-auto border border-neutral-100 rounded-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Trips Completed</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {drivers.map(d => (
                    <tr key={d.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary-500">{d.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{d.phone || '—'}</td>
                      <td className="px-4 py-3 text-neutral-400">{d.vehiclePlate || '—'}</td>
                      <td className="px-4 py-3 text-neutral-400">{d.tripsCompleted}</td>
                      <td className="px-4 py-3"><StatusPill status={d.status} size="sm" /></td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/fleet/drivers"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:underline"
                        >
                          Manage <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {editingTrip && orgUuid && (
        <EditTripModal
          orgUuid={orgUuid}
          tripId={editingTrip.id}
          departureAt={editingTrip.departureAt}
          pricePerSeat={editingTrip.fare}
          onClose={() => setEditingTripId(null)}
          onSaved={() => {
            setEditingTripId(null)
            invalidateApiDataCache()
          }}
        />
      )}
    </div>
  )
}

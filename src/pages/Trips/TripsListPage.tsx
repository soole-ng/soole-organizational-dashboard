import { useState } from 'react'
import { Plus, Route, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { TripCard } from './components/TripCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { useOrg } from '../../lib/OrgContext'
import { useApiData } from '../../lib/useApiData'
import { clsx } from 'clsx'
import { isToday, isThisWeek } from 'date-fns'
import type { StatusVariant } from '../../types'

const tabs = ['Today', 'This Week', 'All']
const statusFilters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  // "Published" = the stakeholder's name for a trip that's live/bookable
  // but hasn't started - backend status 'upcoming' (org-dispatched) or
  // 'available' (independent driver rides), both surfaced as the
  // 'scheduled' StatusVariant by adapters.ts's toStatusVariant.
  { label: 'Published', value: 'scheduled' },
  // A trip's real backend status is 'in_progress' while under way - there
  // is no 'boarding' value anywhere in Ride.status (dashboard/api.py maps
  // 'scheduled'/'boarding' as UI-only aliases elsewhere, but this list's
  // adaptTrip never does), so this tab - and the state below defaulting to
  // it - matched nothing, including on first page load.
  { label: 'Active', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function TripsListPage() {
  // Reads from the shared useApiData cache instead of its own react-query
  // fetch (which duplicated the exact same backend call/adapter) - trip
  // cancel/board/refund actions elsewhere already call
  // invalidateApiDataCache(), so this list now actually picks those up
  // instead of only refreshing incidentally via react-query's remount refetch.
  const { data, loading: isLoading } = useApiData()
  const trips = data.trips
  const { guardAction } = useOrg()
  const navigate = useNavigate()
  // "Today" was the default here, silently intersecting with the status
  // chips below it (a separate filter axis) - a trip correctly matching
  // "Published" but departing tomorrow (the normal case for a trip that
  // was just published ahead of time) was invisible on first load with no
  // indication why, since nothing highlighted "Today" as the culprit.
  const [activeTab, setActiveTab] = useState('All')
  const [statusFilter, setStatusFilter] = useState<StatusVariant | 'all'>('in_progress')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: StatusVariant | 'all') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filtered = trips.filter((t: any) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    let matchesTab = true;
    const departureDate = t.departureAt ? new Date(t.departureAt) : null;
    if (departureDate) {
      if (activeTab === 'Today') matchesTab = isToday(departureDate);
      else if (activeTab === 'This Week') matchesTab = isThisWeek(departureDate, { weekStartsOn: 1 });
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.driverName.toLowerCase().includes(q) ||
        t.vehiclePlate.toLowerCase().includes(q);
    }

    return matchesStatus && matchesTab && matchesSearch;
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTrips = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Trips" />

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="bg-white border-b border-neutral-50">
        <div className="flex overflow-x-auto scrollbar-thin px-4 gap-1 pt-3">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={clsx(
                'flex-shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors pb-2.5',
                activeTab === tab
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-200 hover:text-primary-400',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex overflow-x-auto scrollbar-thin px-4 py-2 gap-2">
          {statusFilters.map(sf => (
            <button
              key={sf.value}
              onClick={() => handleStatusChange(sf.value)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                statusFilter === sf.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-200 border-neutral-50 hover:border-primary-100',
              )}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <DesktopPageHeader title="Trips" subtitle={`${filtered.length} trips`} />
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200" />
            <input
              type="text"
              placeholder="Search origin, driver, or plate..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-300 transition-all"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No trips found"
            description="You have no trips matching this filter. Create a new trip to get started."
            action={{ label: '+ New Trip', onClick: () => guardAction(undefined, () => navigate('/trips/new')) }}
          />
        ) : (
          <>
            <div id="tour-trips-list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {paginatedTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 mt-6 border-t border-neutral-50 gap-4">
                <p className="text-xs text-neutral-300 font-medium">
                  Showing <span className="text-black font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-black font-bold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-black font-bold">{filtered.length}</span> trips
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-100 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-400" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={clsx(
                          'w-8 h-8 rounded-lg text-xs font-bold transition-colors flex items-center justify-center',
                          currentPage === i + 1 
                            ? 'bg-primary-500 text-white shadow-sm' 
                            : 'text-neutral-400 hover:bg-neutral-50 border border-transparent hover:border-neutral-100'
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-neutral-100 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Link
        to="/trips/new"
        onClick={guardAction as any}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="New trip"
      >
        <Plus className="w-6 h-6" />
      </Link>

      <div className="hidden lg:block">
        <Link
          to="/trips/new"
          onClick={guardAction as any}
          className="fixed bottom-8 right-8 flex items-center gap-2 bg-primary-500 text-white font-semibold rounded-btn px-5 py-3 shadow-float hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Trip
        </Link>
      </div>
      </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { TripCard } from './components/TripCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMockData } from '../../lib/useMockData'
import { Route } from 'lucide-react'
import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'

const tabs = ['Today', 'This Week', 'All']
const statusFilters: { label: string; value: StatusVariant | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Trip in Progress', value: 'boarding' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function TripsListPage() {
  const { data } = useMockData()
  const [activeTab, setActiveTab] = useState('Today')
  const [statusFilter, setStatusFilter] = useState<StatusVariant | 'all'>('all')

  const filtered = data.trips.filter(t =>
    statusFilter === 'all' || t.status === statusFilter,
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Trips" />

      <div className="bg-white border-b border-neutral-50">
        <div className="flex overflow-x-auto scrollbar-thin px-4 gap-1 pt-3">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
              onClick={() => setStatusFilter(sf.value)}
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

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Trips" subtitle={`${filtered.length} trips`} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No trips found"
            description="You have no trips matching this filter. Create a new trip to get started."
            action={{ label: '+ New Trip', onClick: () => {} }}
          />
        ) : (
          <div id="tour-trips-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </div>

      <Link
        to="/trips/new"
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="New trip"
      >
        <Plus className="w-6 h-6" />
      </Link>

      <div className="hidden lg:block">
        <Link
          to="/trips/new"
          className="fixed bottom-8 right-8 flex items-center gap-2 bg-primary-500 text-white font-semibold rounded-btn px-5 py-3 shadow-float hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Trip
        </Link>
      </div>
    </div>
  )
}

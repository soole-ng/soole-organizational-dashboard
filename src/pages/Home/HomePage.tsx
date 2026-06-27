import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TopBar } from '../../components/layout/TopBar'
import { HeroBand } from './components/HeroBand'
import { AlertsBanner } from './components/AlertsBanner'
import { UpcomingTrips } from './components/UpcomingTrips'
import { QuickStats } from './components/QuickStats'
import { HomeRoutes } from './components/HomeRoutes'
import { useOrg } from '../../lib/OrgContext'
export function HomePage() {
  const { org } = useOrg()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar />

      <div className="lg:hidden">
        <HeroBand />
      </div>

      <div className="hidden lg:block bg-primary-500 px-8 pt-8 pb-10 w-full lg:rounded-b-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-primary-200 text-sm">Good morning,</p>
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
          </div>
          <Link to="/trips/new" className="flex items-center gap-2 bg-white text-primary-500 font-semibold rounded-btn px-5 py-2.5 text-sm hover:bg-primary-75 transition-colors">
            <Plus className="w-4 h-4" />
            New Trip
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Trips Today', value: '3', sub: '+1 vs yesterday' },
            { label: 'Bookings Today', value: '34', sub: '10 seats remaining' },
            { label: "Today's Revenue", value: 'NGN 269K', sub: '+18% vs last week' },
            { label: 'Wallet Balance', value: 'NGN 47.3K', sub: 'Total Amount' },
          ].map(s => (
            <div key={s.label} className="bg-primary-400 rounded-2xl p-4">
              <p className="text-primary-100 text-xs mb-2">{s.label}</p>
              <p className="text-3xl sm:text-4xl font-black text-white stat-number">{s.value}</p>
              <p className="text-primary-200 text-[11px] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 lg:px-8 w-full">
        <div className="space-y-4 py-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 lg:py-8">
          <div className="lg:col-span-2 space-y-4">
            <AlertsBanner />
            <UpcomingTrips />
            <HomeRoutes />
          </div>
          <div className="space-y-4">
            <QuickStats />
          </div>
        </div>
      </div>

      <Link
        to="/trips/new"
        className="lg:hidden fixed bottom-28 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="New trip"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}

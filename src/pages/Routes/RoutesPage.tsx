import { useState } from 'react'
import { Plus, Navigation, ArrowRight, Trash2, TrendingUp } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { MoneyDisplay } from '../../components/ui/MoneyDisplay'
import { useMockData } from '../../lib/useMockData'
import toast from 'react-hot-toast'

export function RoutesPage() {
  const { data, loading } = useMockData()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ origin: '', destination: '', fare: '' })

  const handleAdd = () => {
    setShowAdd(false)
    setForm({ origin: '', destination: '', fare: '' })
    toast.success('Route added')
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-primary-75 animate-pulse">
        <TopBar title="Routes" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 w-full">
          <div className="h-12 bg-white rounded-2xl w-48 mb-4" />
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary-75">
      <TopBar title="Routes" />

      <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Routes" subtitle="Manage your standard routes and fares" />

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Routes', value: data.routes.length.toString() },
            { label: 'Avg Fare', value: `NGN ${Math.round(data.routes.reduce((a, r) => a + r.baseFare, 0) / Math.max(data.routes.length, 1)).toLocaleString()}` },
            { label: 'Total Distance', value: `${data.routes.reduce((a, r) => a + (r.distanceKm ?? 0), 0).toLocaleString()} km` },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-lg font-black text-primary-500 stat-number">{s.value}</p>
              <p className="text-[10px] text-neutral-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {data.routes.length === 0 ? (
          <EmptyState
            icon={Navigation}
            title="No routes yet"
            description="Add your first route — origin, destination, and base fare."
            action={{ label: '+ Add Route', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="space-y-3">
            {data.routes.map(route => (
              <div key={route.id} className="card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary-500">
                      <span className="truncate">{route.origin}</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 text-neutral-100" />
                      <span className="truncate">{route.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-200">
                      <span>{route.distanceKm} km</span>
                      <span>·</span>
                      <span>{Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <MoneyDisplay amount={route.baseFare} size="sm" className="font-semibold" />
                    <p className="text-[10px] text-neutral-200">base fare</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-50">
                  <div className="flex items-center gap-1.5 text-xs text-secondary-300 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>View analytics</span>
                  </div>
                  <button
                    onClick={() => toast('Route deleted')}
                    className="text-xs text-danger flex items-center gap-1 hover:text-danger-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-float text-white z-30"
        aria-label="Add route"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add a Route">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Origin</label>
            <input
              className="input-field"
              placeholder="e.g. Lagos (Ojota)"
              value={form.origin}
              onChange={e => setForm(p => ({ ...p, origin: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Destination</label>
            <input
              className="input-field"
              placeholder="e.g. Ibadan (Challenge)"
              value={form.destination}
              onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Base Fare (NGN)</label>
            <input
              className="input-field stat-number"
              type="number"
              placeholder="5000"
              value={form.fare}
              onChange={e => setForm(p => ({ ...p, fare: e.target.value }))}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.origin || !form.destination || !form.fare}
            className="btn-primary w-full"
          >
            Add Route
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

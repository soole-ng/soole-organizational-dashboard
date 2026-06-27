import { useState, useEffect } from 'react'
import { Navigation, ArrowRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../../../lib/formatters'

interface Route {
  id: string
  origin: string
  destination: string
  baseFare: number
  distanceKm: number
  durationMinutes: number
}

export function HomeRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])

  useEffect(() => {
    fetch('/mock-data.json')
      .then(res => res.json())
      .then(data => setRoutes(data.routes || []))
      .catch(console.error)
  }, [])

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary-500">Active Routes</h3>
        <Link
          to="/routes"
          className="text-xs text-secondary-300 font-semibold flex items-center gap-0.5 hover:text-secondary-400 transition-colors"
        >
          Manage <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {routes.slice(0, 4).map(route => (
          <div key={route.id} className="card p-3.5 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-xs font-bold text-black truncate max-w-[120px]">{route.origin.split(' ')[0]}</span>
                <ArrowRight className="w-3 h-3 text-neutral-200 flex-shrink-0" />
                <span className="text-xs font-bold text-black truncate max-w-[120px]">{route.destination.split(' ')[0]}</span>
              </div>
              <p className="text-[10px] text-neutral-200">{route.distanceKm} km · {Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-neutral-50 flex items-center justify-between">
              <span className="text-[9px] font-bold text-secondary-300 bg-secondary-50 px-1.5 py-0.5 rounded-full">ACTIVE</span>
              <span className="text-xs font-black text-primary-500">{formatMoney(route.baseFare)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

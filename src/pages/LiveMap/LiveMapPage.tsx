import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  MapPin, Navigation, Activity, Layers, ChevronLeft, ChevronRight,
  Send, Sparkles, TrendingUp, Fuel, Car, CreditCard, ClipboardCheck,
  Bot, User, RotateCcw, History, X, Loader2
} from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { MapContainer } from './components/MapContainer'
import { DriverSidebar } from './components/DriverSidebar'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

type VehicleLoc = {
  id: string
  plate: string
  driver: string
  status: 'on_trip' | 'idle'
  lat: number
  lng: number
  trip: string | null
  eta: string | null
  speed: number
}

type BasemapStyle = 'osm' | 'carto-light' | 'carto-dark' | 'google' | 'google-satellite'

interface Message {
  type: 'user' | 'assistant'
  text: string
  timestamp: string
}

interface HistorySession {
  id: string
  title: string
  dateLabel: string
  time: string
}

const basemapStyles: Record<BasemapStyle, { name: string; style: string }> = {
  'osm': {
    name: 'OpenStreetMap',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'carto-light': {
    name: 'Carto Light',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'carto-dark': {
    name: 'Carto Dark',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'google': {
    name: 'Google Maps',
    style: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  'google-satellite': {
    name: 'Google Satellite',
    style: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
  },
}

const mockResponses: Record<string, string> = {
  'revenue':   'Your total revenue this week is NGN 451,000 gross. After 8% commission, net earnings are NGN 414,920. Best day was Saturday with NGN 95,000 — up 18% vs last week.',
  'fuel':      'Estimated fuel level on KJA 008 MN (Toyota Hiace) is below 25%. We recommend confirming with the driver before the Lagos–Abuja trip at 7:30 AM.',
  'driver':    'You have 4 drivers: 3 verified, 1 pending (Ibrahim Musa). Top performer this week: Funke Adeleke (4.9★, 67 trips). No incidents reported.',
  'route':     'Most profitable routes: 1) Lagos–Abuja — NGN 154K gross, 2) Lagos–Ibadan — NGN 60K, 3) Lagos–Benin — NGN 45K. Average occupancy 76%.',
  'verif':     'Pending: KJA 008 MN rear photo and road worthiness review. ABJ 445 EF insurance and rear photo still required. Complete within 7 days.',
  'occupancy': 'Average occupancy this week: 76%. Sienna 85%, Hiace 73%, Coaster 62%. Lagos–Abuja is consistently the most-booked route.',
  'payout':    'Next payout: 1 July 2026 — NGN 47,300 pending. Previous: 24 June (NGN 38,000 ✓), 17 June (NGN 52,400 ✓). Weekly average: NGN 46,233.',
  'trip':      'Today: 3 trips scheduled. Lagos–Ibadan 6 AM (boarding now), Lagos–Abuja 7:30 AM (11/14 booked), Ibadan–Lagos 2 PM (18/30 booked). Expected revenue: NGN 269,000.',
}

const quickSuggestions = [
  { icon: TrendingUp,     label: 'Revenue this week',     query: 'What is my revenue this week?' },
  { icon: Fuel,           label: 'Fuel levels',           query: 'What are the fuel levels?' },
  { icon: Car,            label: 'Driver performance',    query: 'How are my drivers performing?' },
  { icon: Navigation,     label: 'Top routes',            query: 'What are my most profitable routes?' },
  { icon: ClipboardCheck, label: 'Verifications pending', query: 'What verifications are pending?' },
  { icon: CreditCard,     label: 'Next payout',           query: 'When is my next payout?' },
]

const chatHistory: HistorySession[] = [
  { id: 'h1', title: 'Revenue this week',        dateLabel: 'Today',     time: '10:32 AM' },
  { id: 'h2', title: 'Driver performance query',  dateLabel: 'Today',     time: '09:14 AM' },
  { id: 'h3', title: 'Fuel levels check',         dateLabel: 'Yesterday', time: '04:45 PM' },
  { id: 'h4', title: 'Top routes analysis',       dateLabel: 'Yesterday', time: '11:02 AM' },
  { id: 'h5', title: 'Next payout schedule',      dateLabel: 'Jun 25',    time: '02:30 PM' },
  { id: 'h6', title: 'Occupancy stats review',    dateLabel: 'Jun 24',    time: '09:55 AM' },
  { id: 'h7', title: 'Trip planning Lagos–Abuja', dateLabel: 'Jun 23',    time: '03:12 PM' },
]

function findResponse(query: string): string {
  const q = query.toLowerCase()
  for (const [key, response] of Object.entries(mockResponses)) {
    if (q.includes(key)) return response
  }
  return 'I can help with: fleet management, revenue, driver performance, route analytics, document verification, occupancy stats, and payouts. What would you like to know?'
}

function groupHistory(sessions: HistorySession[]) {
  const groups: { label: string; items: HistorySession[] }[] = []
  let lastLabel = ''
  for (const s of sessions) {
    if (s.dateLabel !== lastLabel) {
      groups.push({ label: s.dateLabel, items: [] })
      lastLabel = s.dateLabel
    }
    groups[groups.length - 1].items.push(s)
  }
  return groups
}

export function LiveMapPage() {
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLoc[]>([])
  const [selectedDriver, setSelectedDriver] = useState<VehicleLoc | null>(null)
  const [filter, setFilter] = useState<'all' | 'on_trip' | 'idle'>('all')
  const [basemap, setBasemap] = useState<BasemapStyle>('osm')
  const [showBasemapMenu, setShowBasemapMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Chat states
  const [messages, setMessages] = useState<Message[]>([])
  const [chatQuery, setChatQuery] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const mapRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  // Load vehicle locations from mock data
  useMemo(() => {
    fetch('/mock-data.json')
      .then(res => res.json())
      .then(data => {
        setVehicleLocations(data.vehicleLocations || [])
      })
      .catch(console.error)
  }, [])

  // Simulate real-time movement of active vehicles
  useEffect(() => {
    if (vehicleLocations.length === 0) return
    const interval = setInterval(() => {
      setVehicleLocations(prev =>
        prev.map(v => {
          if (v.status !== 'on_trip') return v

          let destLat = v.lat
          let destLng = v.lng
          if (v.driver === 'Akin Bello') {
            destLat = 7.3775
            destLng = 3.9470
          } else if (v.driver === 'Chidi Okafor') {
            destLat = 9.0765
            destLng = 7.3986
          } else if (v.driver === 'Funke Adeleke') {
            destLat = 6.3350
            destLng = 5.6263
          } else {
            return v
          }

          const step = 0.005
          const newLat = v.lat + (destLat - v.lat) * step
          const newLng = v.lng + (destLng - v.lng) * step

          const dist = Math.sqrt(Math.pow(destLat - newLat, 2) + Math.pow(destLng - newLng, 2))
          if (dist < 0.01) {
            return {
              ...v,
              lat: 6.5244 + (Math.random() - 0.5) * 0.05,
              lng: 3.3792 + (Math.random() - 0.5) * 0.05,
            }
          }

          return {
            ...v,
            lat: newLat,
            lng: newLng,
          }
        })
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [vehicleLocations.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close history dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false)
      }
    }
    if (showHistory) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHistory])

  const sendChatMessage = (text: string) => {
    if (!text.trim() || chatLoading) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { type: 'user', text, timestamp: now }])
    setChatQuery('')
    setChatLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: findResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      setChatLoading(false)
    }, 800 + Math.random() * 400)
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage(chatQuery)
    }
  }

  const filtered = useMemo(() =>
    vehicleLocations.filter(v =>
      filter === 'all' || v.status === filter,
    ), [vehicleLocations, filter])

  const handleSelectDriver = useCallback((vehicle: VehicleLoc) => {
    setSelectedDriver(vehicle)
    mapRef.current?.flyTo({ center: [vehicle.lng, vehicle.lat], zoom: 14, duration: 600 })
  }, [])

  const markerColor = (status: string) => {
    if (status === 'on_trip') return '#1D754C'
    if (status === 'overspeed') return '#A7C957'
    return '#A7C957'
  }

  const onTripCount = vehicleLocations.filter(v => v.status === 'on_trip').length
  const idleCount = vehicleLocations.filter(v => v.status === 'idle').length
  const historyGroups = groupHistory(chatHistory)

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-y-auto pb-16">
      <TopBar title="Live Map" transparent />

      {/* Map Section */}
      <div className="h-[450px] relative overflow-hidden flex flex-shrink-0 border-b border-neutral-100">
        {/* Left Sidebar - Driver List */}
        <div
          id="tour-driver-sidebar"
          className={clsx(
            'w-72 bg-white shadow-float z-20 flex flex-col overflow-hidden',
            'absolute left-0 top-0 bottom-0 transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0 lg:relative lg:static lg:w-80'
          )}
        >
          <DriverSidebar
            drivers={filtered}
            selectedDriver={selectedDriver}
            onSelectDriver={handleSelectDriver}
            allCount={vehicleLocations.length}
            onTripCount={onTripCount}
            idleCount={idleCount}
            filter={filter}
            onFilterChange={setFilter}
            markerColor={markerColor}
          />
        </div>

        {/* Map Container */}
        <div id="tour-map-container" className="flex-1 relative">
          <MapContainer
            ref={mapRef}
            basemap={basemap}
            selectedDriver={selectedDriver}
            vehicles={filtered}
            onSelectDriver={handleSelectDriver}
            markerColor={markerColor}
          />
        </div>

        {/* Sidebar Toggle Button - Mobile only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={clsx(
            'absolute left-4 top-20 z-30 lg:hidden',
            'w-10 h-10 bg-white rounded-lg shadow-float flex items-center justify-center text-primary-500 transition-all'
          )}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Basemap Switcher */}
        <div className="absolute top-[10px] right-[55px] z-10">
          <div className="relative">
            <button
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="w-10 h-10 flex items-center justify-center bg-white text-primary-500 rounded-full shadow-card hover:bg-primary-75 transition-colors border border-neutral-100/50"
              title="Switch Basemap"
            >
              <Layers className="w-5 h-5" />
            </button>
            {showBasemapMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-float overflow-hidden min-w-48 z-20">
                {Object.entries(basemapStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setBasemap(key as BasemapStyle)
                      setShowBasemapMenu(false)
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-neutral-50 last:border-b-0',
                      basemap === key
                        ? 'bg-primary-75 text-primary-500'
                        : 'text-neutral-400 hover:bg-primary-75 hover:text-primary-500',
                    )}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="bg-white text-center rounded-2xl p-6 shadow-float max-w-xs">
              <MapPin className="w-8 h-8 text-primary-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-primary-500">No drivers on the road</p>
              <p className="text-xs text-neutral-200 mt-1">
                {filter === 'on_trip' ? 'No active trips' : filter === 'idle' ? 'All drivers are busy' : 'All drivers are offline'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Section (Below the Live Map) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-[500px]">
        {/* Sub-header: title + history button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-bold text-black">AI Assistant</span>
          </div>

          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(v => !v)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                showHistory
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-primary-500 border-neutral-100 hover:bg-primary-75',
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            {showHistory && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-float z-50 overflow-hidden chat-history-dropdown">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-50">
                  <p className="text-sm font-bold text-black">Chat History</p>
                  <button onClick={() => setShowHistory(false)} className="text-neutral-200 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {historyGroups.map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-4 py-2 bg-neutral-50/50">
                        {group.label}
                      </p>
                      {group.items.map(session => (
                        <button
                          key={session.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-primary-75 transition-colors"
                          onClick={() => {
                            toast(`Loading: "${session.title}"`)
                            setShowHistory(false)
                          }}
                        >
                          <p className="text-xs font-bold text-black truncate">{session.title}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{session.time}</p>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-neutral-50">
                  <button
                    onClick={() => {
                      setMessages([])
                      setShowHistory(false)
                      toast.success('New chat started')
                    }}
                    className="w-full py-2 rounded-xl bg-primary-500 text-white text-xs font-semibold text-center hover:bg-primary-400 transition-colors"
                  >
                    New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages and query area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-primary-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-md mb-4">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-base font-bold text-primary-500 mb-1">AI Assistant</h3>
              <p className="text-xs text-neutral-400 text-center max-w-xs mb-6">
                Ask anything about your fleet, daily operations, routes, or payouts.
              </p>

              {/* Suggestions */}
              <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickSuggestions.map((sug, i) => {
                  const Icon = sug.icon
                  return (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(sug.query)}
                      className="flex items-center gap-3 p-3 bg-white hover:bg-primary-75 rounded-xl text-left border border-neutral-100 hover:border-primary-400 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-75 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 transition-colors">
                        <Icon className="w-4 h-4 text-primary-500 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-semibold text-primary-500">{sug.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto w-full">
              {messages.map((msg, i) => (
                <div key={i} className={clsx('flex gap-2.5', msg.type === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.type === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div className={clsx(
                    'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed border border-neutral-100 shadow-sm bg-white text-black',
                    msg.type === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                  )}>
                    <p className="text-black">{msg.text}</p>
                    <span className="text-[10px] text-neutral-400 mt-1 block text-right">{msg.timestamp}</span>
                  </div>
                  {msg.type === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-neutral-100">
                      <User className="w-4 h-4 text-primary-500" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl border border-neutral-100 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="bg-white px-4 py-4 border-t border-neutral-100 flex justify-center">
          <div className="w-full max-w-2xl flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              rows={2}
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Ask about your fleet... (Enter to send)"
              className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-black resize-none min-h-[64px]"
            />
            <button
              onClick={() => sendChatMessage(chatQuery)}
              disabled={!chatQuery.trim() || chatLoading}
              className="w-12 h-12 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 rounded-2xl flex items-center justify-center text-white transition-all flex-shrink-0 self-end"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

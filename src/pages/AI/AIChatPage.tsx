import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, TrendingUp, Fuel, Car, Navigation, CreditCard, ClipboardCheck, Bot, User, RefreshCw, RotateCcw } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'

interface Message {
  type: 'user' | 'assistant'
  text: string
  timestamp: string
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
  { icon: TrendingUp,      label: 'Revenue this week',    query: 'What is my revenue this week?' },
  { icon: Fuel,            label: 'Fuel levels',          query: 'What are the fuel levels?' },
  { icon: Car,             label: 'Driver performance',   query: 'How are my drivers performing?' },
  { icon: Navigation,      label: 'Top routes',           query: 'What are my most profitable routes?' },
  { icon: ClipboardCheck,  label: 'Verifications pending',query: 'What verifications are pending?' },
  { icon: CreditCard,      label: 'Next payout',          query: 'When is my next payout?' },
]

function findResponse(query: string): string {
  const q = query.toLowerCase()
  for (const [key, response] of Object.entries(mockResponses)) {
    if (q.includes(key)) return response
  }
  return 'I can help with: fleet management, revenue, driver performance, route analytics, document verification, occupancy stats, and payouts. What would you like to know?'
}

export function AIChatPage() {
  const { data } = useMockData()
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { type: 'user', text, timestamp: now }])
    setQuery('')
    setIsLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'assistant', text: findResponse(text), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
      setIsLoading(false)
    }, 800 + Math.random() * 400)
  }

  const verifiedDrivers = data.drivers.filter(d => d.status === 'verified').length

  return (
    <div className="flex flex-col h-screen bg-primary-75">
      <TopBar title="AI Assistant" backHref="/" />

      <div className="flex-1 flex flex-col overflow-hidden max-w-3xl mx-auto w-full">

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full p-5">
              {/* Icon */}
              <div className="w-16 h-16 bg-primary-500 rounded-3xl flex items-center justify-center shadow-float mb-4">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-black text-primary-500 mb-1">AI Assistant</h2>
              <p className="text-xs text-neutral-200 text-center max-w-xs mb-6 leading-relaxed">
                Ask anything about your fleet, revenue, drivers, routes, and daily operations.
              </p>

              {/* Live context chips */}
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {[
                  `${verifiedDrivers} drivers active`,
                  `${data.trips.length} trips today`,
                  'NGN 47.3K balance',
                ].map(c => (
                  <span key={c} className="text-[10px] font-semibold px-3 py-1 rounded-full border border-primary-400 bg-white text-primary-400">
                    {c}
                  </span>
                ))}
              </div>

              {/* Suggestion grid */}
              <div className="w-full max-w-sm">
                <p className="text-[10px] font-bold text-neutral-200 uppercase tracking-wider text-center mb-3">Quick questions</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickSuggestions.map((sug, i) => {
                    const Icon = sug.icon
                    return (
                      <button
                        key={i}
                        onClick={() => sendMessage(sug.query)}
                        className="flex items-center gap-2.5 p-3 bg-white hover:bg-primary-75 rounded-xl text-left transition-all border border-neutral-100 hover:border-primary-400 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary-75 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-primary-500 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-[11px] font-semibold text-primary-400 leading-snug">{sug.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={clsx('flex gap-2', msg.type === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.type === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                  <div className={clsx(
                    'max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.type === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-white text-primary-500 rounded-bl-sm border border-neutral-100 shadow-card'
                  )}>
                    <p>{msg.text}</p>
                    <p className={clsx('text-[10px] mt-1.5', msg.type === 'user' ? 'text-white/50 text-right' : 'text-neutral-200')}>
                      {msg.timestamp}
                    </p>
                  </div>
                  {msg.type === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-primary-75 flex items-center justify-center flex-shrink-0 mt-0.5 border border-neutral-100">
                      <User className="w-3.5 h-3.5 text-primary-500" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl border border-neutral-100 shadow-card">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 150, 300].map(delay => (
                        <div key={delay} className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-neutral-100 p-4">
          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-3 mb-3">
              {quickSuggestions.slice(0, 4).map((sug, i) => {
                const Icon = sug.icon
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(sug.query)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary-75 hover:bg-primary-500 hover:text-white text-primary-500 text-[11px] font-semibold rounded-xl transition-all border border-neutral-100 hover:border-primary-500"
                  >
                    <Icon className="w-3 h-3" />
                    <span>{sug.label}</span>
                  </button>
                )
              })}
              <button
                onClick={() => setMessages([])}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary-75 text-neutral-200 text-[11px] font-semibold rounded-xl border border-neutral-100"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New chat</span>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(query)}
              placeholder="Ask about your fleet, revenue, drivers..."
              className="flex-1 px-4 py-3 bg-primary-75 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
            <button
              onClick={() => sendMessage(query)}
              disabled={!query.trim() || isLoading}
              className="w-12 h-12 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

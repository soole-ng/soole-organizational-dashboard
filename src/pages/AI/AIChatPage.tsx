import { useState, useEffect, useRef } from 'react'
import {
  Send, Sparkles, TrendingUp, Car, Navigation,
  CreditCard, ClipboardCheck, Bot, User, RotateCcw,
  History, X,
} from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

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

const mockResponses: Record<string, string> = {
  'revenue':   'Your total revenue this week is NGN 451,000 gross. After 8% commission, net earnings are NGN 414,920. Best day was Saturday with NGN 95,000 — up 18% vs last week.',
  'driver':    'You have 4 drivers: 3 verified, 1 pending (Ibrahim Musa). Top performer this week: Funke Adeleke (4.9★, 67 trips). No incidents reported.',
  'route':     'Most profitable routes: 1) Lagos–Abuja — NGN 154K gross, 2) Lagos–Ibadan — NGN 60K, 3) Lagos–Benin — NGN 45K. Average occupancy 76%.',
  'verif':     'Pending: KJA 008 MN rear photo and road worthiness review. ABJ 445 EF insurance and rear photo still required. Complete within 7 days.',
  'occupancy': 'Average occupancy this week: 76%. Sienna 85%, Hiace 73%, Coaster 62%. Lagos–Abuja is consistently the most-booked route.',
  'payout':    'Next payout: 1 July 2026 — NGN 47,300 pending. Previous: 24 June (NGN 38,000 ✓), 17 June (NGN 52,400 ✓). Weekly average: NGN 46,233.',
  'trip':      'Today: 3 trips scheduled. Lagos–Ibadan 6 AM (boarding now), Lagos–Abuja 7:30 AM (11/14 booked), Ibadan–Lagos 2 PM (18/30 booked). Expected revenue: NGN 269,000.',
}

const quickSuggestions = [
  { icon: TrendingUp,     label: 'Revenue this week',     query: 'What is my revenue this week?' },
  { icon: Bot,            label: 'Occupancy rates',       query: 'What is my average occupancy rate?' },
  { icon: Car,            label: 'Driver performance',    query: 'How are my drivers performing?' },
  { icon: Navigation,     label: 'Top routes',            query: 'What are my most profitable routes?' },
  { icon: ClipboardCheck, label: 'Verifications pending', query: 'What verifications are pending?' },
  { icon: CreditCard,     label: 'Next payout',           query: 'When is my next payout?' },
]

const chatHistory: HistorySession[] = [
  { id: 'h1', title: 'Revenue this week',        dateLabel: 'Today',     time: '10:32 AM' },
  { id: 'h2', title: 'Driver performance query',  dateLabel: 'Today',     time: '09:14 AM' },
  { id: 'h3', title: 'Occupancy rates check',     dateLabel: 'Yesterday', time: '04:45 PM' },
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

export function AIChatPage() {
  const { data } = useMockData()
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

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

  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { type: 'user', text, timestamp: now }])
    setQuery('')
    setIsLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: findResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      setIsLoading(false)
    }, 800 + Math.random() * 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(query)
    }
  }

  const verifiedDrivers = data.drivers.filter((d: any) => d.status === 'verified').length
  const historyGroups = groupHistory(chatHistory)

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="AI Assistant" backHref="/" />

      {/* ── Chat sub-header: title + history icon ── */}
      <div className="hidden lg:flex items-center gap-4 px-6 py-3 border-b border-neutral-100 bg-white flex-shrink-0">
        {/* History icon button — left side, directly next to sidebar */}
        <div className="relative" ref={historyRef}>
          <button
            onClick={() => setShowHistory(v => !v)}
            title="Chat history"
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

          {/* Dropdown panel */}
          {showHistory && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-float z-50 overflow-hidden chat-history-dropdown">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-bold text-black">Chat History</p>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-200 hover:text-black hover:bg-neutral-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {historyGroups.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-bold text-black uppercase tracking-wider px-4 py-2 bg-neutral-50/20">
                      {group.label}
                    </p>
                    {group.items.map(session => (
                      <button
                        key={session.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-primary-75 transition-colors group"
                        onClick={() => { toast(`Loading: "${session.title}"`); setShowHistory(false) }}
                      >
                        <p className="text-xs font-bold text-black truncate group-hover:text-primary-500 transition-colors">
                          {session.title}
                        </p>
                        <p className="text-[10px] text-neutral-200 mt-0.5">{session.time}</p>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3">
                <button
                  onClick={() => { setMessages([]); setShowHistory(false); toast.success('New chat started') }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> New Chat
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="text-sm font-bold text-black">AI Assistant</span>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full p-5">
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
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 transition-colors">
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
            <div className="p-4 space-y-4 max-w-2xl mx-auto w-full pr-6">
              {messages.map((msg, i) => (
                <div key={i} className={clsx('flex gap-2', msg.type === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.type === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                  <div className={clsx(
                    'max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed border border-neutral-100 shadow-card bg-white text-black',
                    msg.type === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                  )}>
                    <p className="!text-black">{msg.text}</p>
                    <p className="text-[10px] mt-1.5 text-neutral-200">
                      {msg.timestamp}
                    </p>
                  </div>
                  {msg.type === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-neutral-100">
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

        {/* ── Input area — centred, ~50% width, right margin maintained ── */}
        <div className="bg-white px-4 pb-20 lg:pb-6 pt-3 flex justify-center flex-shrink-0 border-t border-neutral-50/50">
          <div className="w-full max-w-xl pr-6">

            {/* Quick chips when conversation active */}
            {messages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-3">
                {quickSuggestions.slice(0, 4).map((sug, i) => {
                  const Icon = sug.icon
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(sug.query)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary-500 hover:text-white text-primary-500 text-[11px] font-semibold rounded-xl transition-all border border-neutral-100 hover:border-primary-500"
                    >
                      <Icon className="w-3 h-3" />
                      <span>{sug.label}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setMessages([])}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-200 text-[11px] font-semibold rounded-xl border border-neutral-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>New chat</span>
                </button>
              </div>
            )}

            {/* Textarea + send — smaller, centred */}
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                rows={2}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your fleet… (Enter to send)"
                className="flex-1 px-4 py-3 bg-white border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none min-h-[64px]"
              />
              <button
                onClick={() => sendMessage(query)}
                disabled={!query.trim() || isLoading}
                className="w-10 h-10 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 flex-shrink-0 self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

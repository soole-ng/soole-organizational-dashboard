import { Sparkles, TrendingUp, Car, Navigation, CreditCard, ClipboardCheck, Bot, Send } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'

const upcomingCapabilities = [
  { icon: TrendingUp,     label: 'Revenue insights' },
  { icon: Bot,            label: 'Occupancy analytics' },
  { icon: Car,            label: 'Driver performance' },
  { icon: Navigation,     label: 'Route recommendations' },
  { icon: ClipboardCheck, label: 'Verification reminders' },
  { icon: CreditCard,     label: 'Payout guidance' },
]

export function AIChatPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="AI Assistant" backHref="/" />

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary-500 rounded-3xl flex items-center justify-center shadow-float mb-4">
          <Sparkles className="w-8 h-8 text-accent-300" />
        </div>
        <h2 className="text-xl font-black text-primary-500 mb-1">AI Assistant — Coming Soon</h2>
        <p className="text-xs text-neutral-200 max-w-xs mb-6 leading-relaxed">
          We're building an assistant that can answer real questions about your fleet, revenue, drivers, and routes.
          It isn't connected yet, so it's disabled for now rather than showing placeholder answers.
        </p>

        <div className="w-full max-w-sm">
          <p className="text-[10px] font-bold text-neutral-200 uppercase tracking-wider mb-3">Planned capabilities</p>
          <div className="grid grid-cols-2 gap-2">
            {upcomingCapabilities.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 p-3 bg-white rounded-xl text-left border border-neutral-100 opacity-70"
              >
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary-500" />
                </div>
                <p className="text-[11px] font-semibold text-primary-400 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input Container */}
      <div className="p-4 border-t border-neutral-100 bg-white">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            disabled
            placeholder="Type a message... (AI Assistant is disabled during preview)"
            className="flex-1 h-[50px] bg-neutral-50 border border-neutral-100 rounded-2xl px-4 text-sm font-semibold text-neutral-400 cursor-not-allowed focus:outline-none"
          />
          <button
            disabled
            className="w-[50px] h-[50px] bg-neutral-100 text-neutral-300 rounded-2xl flex items-center justify-center cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

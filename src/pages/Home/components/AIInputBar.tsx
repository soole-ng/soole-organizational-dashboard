import { useState } from 'react'
import { Mic, Send, Sparkles, X } from 'lucide-react'
import { clsx } from 'clsx'

interface AIResponse {
  text: string
  link?: { label: string; href: string }
}

const mockResponses: Record<string, AIResponse> = {
  default: {
    text: 'Your Lagos–Ibadan route generated NGN 175,000 this week — up 12% from last week. Friday 6 AM is your best-performing slot.',
    link: { label: 'View revenue report', href: '/reports' },
  },
  fuel: {
    text: 'KJA 008 MN is estimated below 25% fuel. Chidi Okafor\'s Lagos–Abuja trip departs at 7:30 AM — consider alerting him to refuel.',
    link: { label: 'View vehicle', href: '/fleet/vehicles' },
  },
  money: {
    text: 'You have earned NGN 269,000 today across 3 trips. Your next payout of NGN 47,300 is scheduled for 1 Jul 2026.',
    link: { label: 'View money', href: '/money' },
  },
}

export function AIInputBar() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!query.trim()) return
    setLoading(true)
    setTimeout(() => {
      const lower = query.toLowerCase()
      if (lower.includes('fuel')) setResponse(mockResponses.fuel)
      else if (lower.includes('money') || lower.includes('earn') || lower.includes('revenue')) setResponse(mockResponses.money)
      else setResponse(mockResponses.default)
      setLoading(false)
      setQuery('')
    }, 1000)
  }

  return (
    <div className="px-4">
      <div className="bg-white rounded-2xl shadow-card border border-neutral-50 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Sparkles className="w-4 h-4 text-secondary-300 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask Soole AI anything about your fleet…"
            className="flex-1 text-sm bg-transparent outline-none text-primary-500 placeholder:text-neutral-100"
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || loading}
            className={clsx(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              query.trim() ? 'bg-primary-500 text-white' : 'bg-neutral-50 text-neutral-100',
            )}
            aria-label="Ask AI"
          >
            {loading
              ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
          <button className="w-7 h-7 rounded-lg bg-neutral-50 flex items-center justify-center" aria-label="Voice input">
            <Mic className="w-3.5 h-3.5 text-neutral-200" />
          </button>
        </div>

        {response && (
          <div className="border-t border-neutral-50 bg-secondary-50/30 px-3 py-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary-500 leading-relaxed">{response.text}</p>
                {response.link && (
                  <a href={response.link.href} className="text-xs text-secondary-300 font-semibold mt-1.5 inline-block">
                    {response.link.label} →
                  </a>
                )}
              </div>
              <button onClick={() => setResponse(null)} className="w-5 h-5 flex items-center justify-center">
                <X className="w-3 h-3 text-neutral-100" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

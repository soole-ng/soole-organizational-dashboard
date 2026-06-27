import { useState } from 'react'
import { HelpCircle, Search, MessageSquare, Mail, Phone, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const FAQS: FAQItem[] = [
  {
    category: 'Trips & Dispatch',
    question: 'How do I schedule a new trip?',
    answer: 'Navigate to the Trips page and click "New Trip" (or use the float button on mobile). Fill in the route, vehicle, driver, departure time, and base fare. Once saved, the trip status becomes Scheduled and is broadcast to the passenger apps.',
  },
  {
    category: 'Trips & Dispatch',
    question: 'How do I manage the passenger manifest?',
    answer: 'Click on any active or scheduled trip from your Trips list. Under the Manifest tab, you can view booked passengers, check them in as they board, or manually add passengers if they are paying cash at the terminal.',
  },
  {
    category: 'Fleet & Drivers',
    question: 'How do I approve a pending driver?',
    answer: 'Go to Fleet > Drivers. Click on the driver with the "Invite Pending" or "Review" status. Verify their driver\'s license and phone number, then toggle their status to Active. They will immediately receive an SMS notification to start taking trips.',
  },
  {
    category: 'Payments & Wallet',
    question: 'When are payouts processed?',
    answer: 'Payouts are automatically processed every Wednesday to your registered settlement bank account. The minimum payout threshold is NGN 10,000. You can view pending payouts and transaction histories on the Money page.',
  },
  {
    category: 'Technical Support',
    question: 'How do I install the Mobiliti PWA on my phone?',
    answer: 'On Android, open this dashboard in Chrome and tap "Add to Home Screen" or click the "Install" button in the top bar. On iOS, open Safari, tap the Share button, and select "Add to Home Screen". The PWA functions offline and supports push notifications.',
  },
]

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFaq, setActiveFaq] = useState<FAQItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const categories = ['All', 'Trips & Dispatch', 'Fleet & Drivers', 'Payments & Wallet', 'Technical Support']

  const filteredFaqs = FAQS.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Help & Support" />

      <div className="flex-1 p-4 space-y-6 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader 
          title="Help & Support" 
          subtitle="Get help with your fleet, payouts, and terminal operations" 
        />

        {/* Search & Hero Banner */}
        <div className="bg-primary-500 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-xl lg:text-2xl font-bold mb-2 !text-white">How can we help you today?</h2>
            <p className="text-xs lg:text-sm mb-6 !text-white/80">Search our knowledge base or get in touch with Soole support representative.</p>
            
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-neutral-300" />
              <input
                type="text"
                placeholder="Search FAQs, guides, and articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-primary-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300 placeholder-neutral-200 shadow-inner"
              />
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
            <HelpCircle className="w-64 h-64" />
          </div>
        </div>

        {/* Contact support channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://wa.me/2348000000000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="card hover:border-accent-300 transition-all hover:shadow-md flex items-start gap-4 p-5"
          >
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-accent-400 flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-500 mb-1 flex items-center gap-1.5">
                Chat on WhatsApp <ExternalLink className="w-3 h-3 opacity-60" />
              </h3>
              <p className="text-xs text-neutral-200">Instant support from our terminal operations desk.</p>
              <span className="text-[10px] font-bold text-accent-400 mt-2 block">Response time: ~5 mins</span>
            </div>
          </a>

          <a 
            href="mailto:support@soole.ng"
            className="card hover:border-primary-200 transition-all hover:shadow-md flex items-start gap-4 p-5"
          >
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary-400 flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-500 mb-1">Email Support</h3>
              <p className="text-xs text-neutral-200">Send us documents or billing questions.</p>
              <span className="text-[10px] font-bold text-primary-400 mt-2 block">support@soole.ng</span>
            </div>
          </a>

          <a 
            href="tel:+2341000000"
            className="card hover:border-teal-200 transition-all hover:shadow-md flex items-start gap-4 p-5"
          >
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-teal-400 flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-500 mb-1">Phone Hotline</h3>
              <p className="text-xs text-neutral-200">Call for critical route or dispatch emergencies.</p>
              <span className="text-[10px] font-bold text-teal-400 mt-2 block">Available 24/7</span>
            </div>
          </a>
        </div>

        {/* FAQs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-primary-500">Frequently Asked Questions</h3>
            <span className="text-xs text-neutral-200 font-medium">{filteredFaqs.length} results</span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  setActiveFaq(null)
                }}
                className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'bg-white text-neutral-200 border border-neutral-50 hover:bg-primary-75'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQs Accordion Replacement: Clicking triggers a centered modal */}
          <div className="card p-0 overflow-hidden divide-y divide-neutral-50">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                return (
                  <div key={index} className="transition-colors hover:bg-primary-75/30">
                    <button
                      onClick={() => setActiveFaq(faq)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none"
                    >
                      <span className="text-sm font-semibold text-primary-500">{faq.question}</span>
                      <span className="text-xs text-neutral-200 font-medium flex items-center gap-1">
                        Read full <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-neutral-200 text-sm">
                No FAQs match your search query. Try typing something else or contact support directly.
              </div>
            )}
          </div>
        </div>

        {/* Centered FAQ Detail Read Popup Modal */}
        {activeFaq && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setActiveFaq(null)}
          >
            <div
              className="bg-white w-full max-w-lg rounded-3xl shadow-float flex flex-col p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <span className="text-[9px] font-bold bg-primary-75 text-primary-500 uppercase px-2.5 py-1 rounded-full">{activeFaq.category}</span>
                </div>
                <button
                  onClick={() => setActiveFaq(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
                >&#x2715;</button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary-500 leading-snug">{activeFaq.question}</h3>
                <p className="text-xs text-primary-500 leading-relaxed bg-white p-4 rounded-2xl border border-neutral-100 whitespace-pre-wrap">{activeFaq.answer}</p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setActiveFaq(null)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                >
                  Done Reading
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Soole Brand & PWA Details */}
        <div className="bg-white border border-neutral-50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img src="/soole-icon.png" alt="Soole" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div>
              <h4 className="text-xs font-bold text-primary-500">Mobiliti Dashboard</h4>
              <p className="text-[10px] text-neutral-200">Powered by Mobiliti · Version 2.4.0 (PWA)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-300" />
            <span className="text-[10px] font-bold text-secondary-300">Terminal Server: Connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}

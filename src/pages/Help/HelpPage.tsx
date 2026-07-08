import { useEffect, useState } from 'react'
import { HelpCircle, Search, MessageSquare, Mail, Phone, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { supportApi } from '../../api/client'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const FAQS: FAQItem[] = [
  {
    category: 'Trips & Dispatch',
    question: 'How do I schedule a new trip?',
    answer: '1. Navigate to the Trips page.\n2. Click the "+ New Trip" button (or the floating action button on mobile).\n3. Fill in the route, vehicle, driver, departure time, and base fare.\n4. Click Save to publish the trip and broadcast it to the passenger apps.',
  },
  {
    category: 'Trips & Dispatch',
    question: 'How do I manage the passenger manifest?',
    answer: '1. Locate the active or scheduled trip in your Trips list.\n2. Click the trip card to open the details.\n3. Open the "Manifest" tab.\n4. Review bookings, check in passengers as they board, or manually register walk-in passengers paying cash at the terminal.',
  },
  {
    category: 'Fleet & Drivers',
    question: 'How do I approve a pending driver?',
    answer: '1. Go to Fleet > Drivers from the navigation menu.\n2. Find and click on the driver with the "Invite Pending" or "Review" status.\n3. Check their driver\'s license and phone number for accuracy.\n4. Change their status indicator to Active to notify them and allow them to take rides.',
  },
  {
    category: 'Payments & Wallet',
    question: 'When are payouts processed?',
    answer: '1. Payouts are computed automatically every Wednesday.\n2. Ensure your account meets the minimum payout limit of NGN 10,000.\n3. Funds are sent to your organization\'s registered settlement bank account.\n4. Review payout details and statement logs on the Money page.',
  },
  {
    category: 'Technical Support',
    question: 'How do I install the Mobiliti PWA on my phone?',
    answer: 'For iOS (iPhone/iPad):\n1. Open your Safari browser and visit this dashboard.\n2. Tap the "Share" button (the box with an upward arrow).\n3. Select "Add to Home Screen" from the menu.\n\nFor Android:\n1. Open your Google Chrome browser.\n2. Tap the menu dots or the install banner in the address bar.\n3. Tap "Install App" or "Add to Home Screen".',
  },
]

// Matches the backend's own AppConfig defaults (common/models.py) - shown
// until the real /common/app-config response arrives, and as a fallback
// if that request fails, so this page never shows a broken contact link.
const DEFAULT_APP_CONFIG = {
  support_email: 'support@soole.ng',
  support_hotline: '+2348000000000',
  whatsapp_number: '2348000000000',
  faq_website_url: 'https://www.soole.ng/faq',
}

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFaq, setActiveFaq] = useState<FAQItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')
  // Previously hardcoded (including a malformed "+2341000000" hotline
  // number - 7 digits after +234, not a real Nigerian number) - now reads
  // from the real /common/app-config endpoint, editable by staff via
  // Django Admin without a dashboard release.
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIG)

  useEffect(() => {
    supportApi.getAppConfig()
      .then(setAppConfig)
      .catch(() => {
        // Keep the defaults above - a broken contact page is worse than a
        // slightly stale one.
      })
  }, [])

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
            href={`https://wa.me/${appConfig.whatsapp_number}`}
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
            href={`mailto:${appConfig.support_email}`}
            className="card hover:border-primary-200 transition-all hover:shadow-md flex items-start gap-4 p-5"
          >
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary-400 flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-500 mb-1">Email Support</h3>
              <p className="text-xs text-neutral-200">Send us documents or billing questions.</p>
              <span className="text-[10px] font-bold text-primary-400 mt-2 block">{appConfig.support_email}</span>
            </div>
          </a>

          <a
            href={`tel:${appConfig.support_hotline}`}
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
        <div className="bg-white border border-neutral-50 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <img src="/soole-icon.png" alt="Soole" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div>
                <h4 className="text-xs font-bold text-primary-500">Mobiliti Dashboard</h4>
                <p className="text-[10px] text-neutral-200">Powered by Mobiliti · Version 2.4.0 (PWA)</p>
              </div>
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('start-soole-tour'))
              }}
              className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-75 text-primary-500 rounded-xl text-[10px] font-bold transition-colors border border-primary-100"
            >
              Start Website Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

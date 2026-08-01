import { Users, Map, CreditCard, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react'

export function LeftIllustration() {
  return (
    <div className="hidden lg:flex flex-col w-[50%] bg-[#02130A] text-white p-10 xl:p-12 relative overflow-hidden h-screen select-none justify-between border-r border-white/5">
      {/* Abstract light effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-[#16593a]/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#A7C957]/5 blur-[100px]" />

      {/* Top Left Logo Header */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/soole-icon.png" alt="Soole logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-display">Soole</span>
      </div>

      {/* Main Feature Pitch Area */}
      <div className="relative z-10 my-auto max-w-lg">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-400/10 text-accent-300 text-xs font-semibold mb-6 border border-accent-400/15">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
          Smart Fleet Operations
        </div>

        {/* Headline */}
        <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-4 leading-tight font-display text-white">
          Run your transport business <span className="text-accent-400">smarter.</span>
        </h2>

        {/* Subtitle */}
        <p className="text-neutral-300 text-sm leading-relaxed mb-8 max-w-md">
          Manage drivers, dispatch trips, track revenue and grow your fleet — all in one unified platform.
        </p>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: Users,
              title: 'Driver Management',
              desc: 'Verify, assign and monitor drivers'
            },
            {
              icon: Map,
              title: 'Route Planning',
              desc: 'Optimize routes and prices'
            },
            {
              icon: CreditCard,
              title: 'Instant Payouts',
              desc: 'Fast and secure payments'
            },
            {
              icon: Sparkles,
              title: 'AI-powered Insights',
              desc: 'Data that drives better decisions'
            }
          ].map(item => (
            <div
              key={item.title}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-400/10 flex items-center justify-center text-accent-400 mb-3 group-hover:scale-105 transition-transform duration-300">
                <item.icon className="w-4.5 h-4.5" strokeWidth={2} />
              </div>
              <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
              <p className="text-neutral-400 text-xs leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mockup Display + Footer */}
      <div className="relative z-10 w-full mt-auto">
        {/* CSS Mockup of Dashboard */}
        <div className="w-full bg-[#051a10] rounded-t-3xl border-t border-l border-r border-white/10 p-3 shadow-2xl relative overflow-hidden h-[240px] translate-y-6 flex gap-2">
          {/* Simulated Sidebar */}
          <div className="w-14 bg-[#03110a] rounded-xl flex flex-col items-center py-4 gap-4 flex-shrink-0 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-accent-400/10 flex items-center justify-center text-accent-400">
              <span className="w-3 h-3 bg-accent-400 rounded-sm" />
            </div>
            {ListArray(5).map(idx => (
              <div key={idx} className="w-5 h-2 bg-white/10 rounded-sm" />
            ))}
          </div>

          {/* Simulated Main Content */}
          <div className="flex-1 flex flex-col gap-3 py-2 pr-2 overflow-hidden">
            {/* Header info */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-white">Welcome back, Capital Transport 👋</div>
                <div className="text-[7px] text-neutral-400">Here's what's happening with your fleet today.</div>
              </div>
              <div className="w-5 h-5 rounded-full bg-white/10" />
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { title: 'Active Vehicles', val: '128', change: '+12% this month' },
                { title: 'Total Trips', val: '3,482', change: '+18% this month' },
                { title: 'Revenue', val: '₦24.5M', change: '↑ 32% this month' }
              ].map(card => (
                <div key={card.title} className="bg-[#0b2719] rounded-lg p-2 border border-white/[0.03]">
                  <div className="text-[6px] text-neutral-400 font-medium uppercase tracking-wider">{card.title}</div>
                  <div className="text-[10px] font-extrabold text-white mt-0.5">{card.val}</div>
                  <div className="text-[6px] text-accent-400 font-bold mt-0.5">{card.change}</div>
                </div>
              ))}
            </div>

            {/* Simulated Table/Map container */}
            <div className="flex-1 bg-[#0b2719] rounded-lg p-2.5 border border-white/[0.03] space-y-1.5">
              <div className="text-[7px] font-bold text-neutral-300">Trip Activity</div>
              {[
                { route: 'Lagos → Ibadan', status: 'On-going', color: 'text-accent-400 bg-accent-400/10' },
                { route: 'Abuja → Kaduna', status: 'Completed', color: 'text-secondary-300 bg-secondary-300/10' }
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-center text-[6px] bg-white/[0.01] p-1 rounded">
                  <span className="text-white font-medium">{row.route}</span>
                  <span className={`px-1 py-0.5 rounded font-bold ${row.color}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Revenue Growth Box Widget */}
          <div className="absolute right-4 top-14 bg-white text-[#042011] p-3 rounded-2xl shadow-2xl border border-neutral-100/50 flex flex-col gap-1 w-[124px] select-none hover:scale-105 transition-transform duration-300 z-20">
            <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider">Revenue Growth</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-extrabold text-[#042011] tracking-tight">+22%</span>
              <TrendingUp className="w-3.5 h-3.5 text-accent-500" strokeWidth={3} />
            </div>
            {/* Miniature bar chart visualization */}
            <div className="flex items-end gap-1.5 h-10 mt-1.5 pt-1 border-t border-neutral-100">
              {[20, 35, 25, 45, 55, 30, 65, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#042011] hover:bg-accent-500 transition-colors rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Trusted Seal */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-10">
          <ShieldCheck className="w-4 h-4 text-accent-400" />
          <span>Trusted by leading transport organizations across Nigeria</span>
        </div>
      </div>
    </div>
  )
}

function ListArray(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i)
}

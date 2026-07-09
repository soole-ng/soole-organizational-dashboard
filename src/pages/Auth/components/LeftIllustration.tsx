import { Car, MapPin, CreditCard, Sparkles } from 'lucide-react'

export function LeftIllustration() {
  return (
    <div className="hidden lg:flex flex-1 bg-primary-500 text-white items-center justify-center p-12 relative overflow-hidden h-screen select-none">
      {/* Abstract shapes */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-accent-300/10 blur-xl" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-secondary-300/10 blur-2xl" />
      <div className="absolute top-1/2 -right-6 w-24 h-24 rounded-full bg-accent-300/20" />

      <div className="relative z-10 text-center w-full max-w-sm">
        {/* Logo Mark */}
        <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <img src="/soole-icon.png" alt="Soole logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight font-display">Soole</h2>
        <p className="text-primary-100 text-sm leading-relaxed mb-12 max-w-xs mx-auto">
          Organization Dashboard by Soole.
          Manage your fleet, dispatch trips, and track revenue — all in one place.
        </p>

        <div className="space-y-4 text-left max-w-xs mx-auto">
          {[
            { icon: Car, text: 'Driver Management' },
            { icon: MapPin, text: 'Set routes and prices' },
            { icon: CreditCard, text: 'Instant payouts' },
            { icon: Sparkles, text: 'AI-powered insights' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-accent-300 flex-shrink-0">
                <item.icon className="w-4.5 h-4.5" strokeWidth={2} />
              </div>
              <p className="text-primary-200 text-sm font-semibold">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

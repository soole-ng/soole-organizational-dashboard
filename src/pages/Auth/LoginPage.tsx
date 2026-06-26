import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, ChevronDown, Phone, Car, MapPin, CreditCard, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

type Step = 'login' | 'otp'

const COUNTRY_CODES = [
  { code: '+234', flag: 'https://flagcdn.com/w40/ng.png', name: 'Nigeria' },
  { code: '+233', flag: 'https://flagcdn.com/w40/gh.png', name: 'Ghana' },
  { code: '+254', flag: 'https://flagcdn.com/w40/ke.png', name: 'Kenya' },
  { code: '+27',  flag: 'https://flagcdn.com/w40/za.png', name: 'South Africa' },
  { code: '+250', flag: 'https://flagcdn.com/w40/rw.png', name: 'Rwanda' },
  { code: '+256', flag: 'https://flagcdn.com/w40/ug.png', name: 'Uganda' },
  { code: '+237', flag: 'https://flagcdn.com/w40/cm.png', name: 'Cameroon' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState<Step>('login')
  const [country, setCountry]   = useState(COUNTRY_CODES[0])
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp]           = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCC, setShowCC]     = useState(false)
  const [loading, setLoading]   = useState(false)

  const fullPhone = `${country.code}${phone.replace(/^0/, '')}`

  const handleLogin = () => {
    if (!phone || !password) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('otp')
    }, 1000)
  }

  const handleOtp = () => {
    if (otp.length !== 6) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Welcome back to Mobiliti!')
      navigate('/')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row">
      {/* Left panel (desktop only) */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-6 w-24 h-24 rounded-full bg-accent-300/20" />

        <div className="relative z-10 text-center w-full max-w-sm">
          {/* Logo Mark without white background */}
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <img src="/soole-icon.png" alt="Soole logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight font-display">Mobiliti</h2>
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

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="bg-primary-500 px-6 pt-16 pb-12 text-white lg:hidden">
          <div className="w-16 h-16 flex items-center justify-start mb-6">
            <img src="/soole-icon.png" alt="Soole logo" className="h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2 font-display">
            {step === 'login' ? 'Welcome back' : 'Two-factor check'}
          </h1>
          <p className="text-primary-200 text-sm">
            {step === 'login'
              ? 'Sign in to your organization account'
              : 'Enter the 6-digit code sent to your authenticator app'}
          </p>
        </div>

        {/* Form card container made wider (max-w-[500px]) */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[500px]">
            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-4xl font-extrabold text-primary-500 mb-2 font-display">
                {step === 'login' ? 'Sign in' : 'Two-factor check'}
              </h1>
              <p className="text-neutral-300 text-base">
                {step === 'login'
                  ? 'Enter your phone number and password to continue'
                  : 'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            <div className="bg-white rounded-card shadow-card p-8 lg:p-10 space-y-7 -mt-6 lg:mt-0 relative z-10">
              {step === 'login' ? (
                <>
                  {/* Phone field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Phone Number
                    </label>
                    <div className="flex gap-3">
                      {/* Country code selector */}
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowCC(!showCC)}
                          className="flex items-center gap-2 h-[56px] px-4 bg-primary-75 border border-neutral-100 rounded-2xl text-sm font-semibold text-primary-500 hover:border-primary-200 transition-colors"
                        >
                          <img src={country.flag} alt={country.name} className="w-6 h-4 object-cover rounded-sm" />
                          <span className="text-sm font-bold">{country.code}</span>
                          <ChevronDown className={clsx('w-4 h-4 text-neutral-200 transition-transform', showCC && 'rotate-180')} />
                        </button>

                        {showCC && (
                          <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-float border border-neutral-50 overflow-hidden z-30 min-w-48">
                            {COUNTRY_CODES.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => { setCountry(c); setShowCC(false) }}
                                className={clsx(
                                  'w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-primary-75 text-left',
                                  country.code === c.code ? 'bg-primary-75 font-bold text-primary-500' : 'text-neutral-400',
                                )}
                              >
                                <img src={c.flag} alt={c.name} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                                <span className="font-bold text-xs">{c.code}</span>
                                <span className="flex-1 text-xs font-medium">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-base text-primary-500 placeholder:text-neutral-100 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                        placeholder="08031234567"
                        autoComplete="tel"
                        inputMode="tel"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                    {phone && (
                      <p className="text-xs text-neutral-200 mt-1">
                        Full number: <span className="font-semibold text-primary-400">{fullPhone}</span>
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-primary-400">Password</label>
                      <button type="button" className="text-xs text-secondary-300 font-bold hover:text-secondary-400 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 pr-12 text-base text-primary-500 placeholder:text-neutral-100 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-200 hover:text-neutral-400 transition-colors"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={!phone || !password || loading}
                    className={clsx('w-full bg-primary-500 text-white font-bold rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm', loading && 'opacity-70')}
                  >
                    {loading
                      ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</>
                      : 'Sign in'
                    }
                  </button>

                  {/* Not registered notice */}
                  <div className="rounded-2xl bg-primary-75 p-4 border border-primary-100">
                    <p className="text-xs text-neutral-300 text-center leading-relaxed font-medium">
                      Don't have an account?{' '}
                      <a
                        href="mailto:hello@soole.ng?subject=Organization Dashboard Access Request"
                        className="text-secondary-300 font-bold hover:text-secondary-400 transition-colors"
                      >
                        Contact Soole to register your organization
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                    <Shield className="w-5 h-5 text-secondary-300 flex-shrink-0" />
                    <p className="text-xs text-primary-400 leading-relaxed font-semibold">
                      Open your authenticator app and enter the 6-digit code for <strong>Soole</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-400">6-digit code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-bold text-primary-500 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all stat-number"
                      placeholder="000000"
                      onKeyDown={e => e.key === 'Enter' && handleOtp()}
                      autoFocus
                    />
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={clsx(
                            'w-2 h-2 rounded-full transition-colors',
                            i < otp.length ? 'bg-primary-500' : 'bg-neutral-100',
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleOtp}
                    disabled={otp.length !== 6 || loading}
                    className={clsx('w-full bg-primary-500 text-white font-bold rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm', loading && 'opacity-70')}
                  >
                    {loading
                      ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying…</>
                      : 'Verify & Sign in'
                    }
                  </button>

                  <button
                    onClick={() => { setStep('login'); setOtp('') }}
                    className="w-full text-primary-400 font-semibold rounded-2xl px-4 py-2 hover:bg-primary-75 active:scale-95 transition-all text-sm"
                  >
                    ← Back to login
                  </button>
                </>
              )}
            </div>

            <p className="text-center text-xs text-neutral-200 mt-8 font-medium">
              Protected by Soole · 2FA required for all organization accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

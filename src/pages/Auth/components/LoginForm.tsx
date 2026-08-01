import { useNavigate } from 'react-router-dom'
import { Phone, Lock, ChevronDown, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { COUNTRY_CODES } from '../utils/auth'

interface LoginFormProps {
  phone: string
  setPhone: (val: string) => void
  password: string
  setPassword: (val: string) => void
  country: typeof COUNTRY_CODES[0]
  setCountry: (val: typeof COUNTRY_CODES[0]) => void
  showCC: boolean
  setShowCC: (val: boolean) => void
  showPw: boolean
  setShowPw: (val: boolean) => void
  errors: string[]
  setErrors: (val: string[]) => void
  loading: boolean
  handleLogin: () => void
  setStep: (step: any) => void
  getBorderClass: (field: string) => string
}

export function LoginForm({
  phone,
  setPhone,
  password,
  setPassword,
  country,
  setCountry,
  showCC,
  setShowCC,
  showPw,
  setShowPw,
  errors,
  setErrors,
  loading,
  handleLogin,
  setStep,
  getBorderClass,
}: LoginFormProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      {/* Phone field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5 mb-1">
          <Phone className="w-3.5 h-3.5 text-neutral-400" />
          Phone number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 items-center">
          {/* Country code selector */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowCC(!showCC)}
              className={clsx(
                'flex items-center gap-1.5 h-[48px] px-3.5 bg-white border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-800 transition-colors focus:border-primary-500',
                getBorderClass('phone')
              )}
            >
              <img src={country.flag} alt={country.name} className="w-5 h-3.5 object-cover rounded-sm" />
              <span className="text-xs font-bold text-neutral-800">{country.code}</span>
              <ChevronDown className={clsx('w-3.5 h-3.5 text-neutral-400 transition-transform', showCC && 'rotate-180')} />
            </button>

            {showCC && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-float border border-neutral-50 overflow-hidden z-30 min-w-48">
                {COUNTRY_CODES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c)
                      setShowCC(false)
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3.5 py-2.5 text-xs transition-colors hover:bg-primary-50 text-left',
                      country.code === c.code ? 'bg-primary-50 font-bold text-neutral-900' : 'text-neutral-500'
                    )}
                  >
                    <img src={c.flag} alt={c.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                    <span className="font-bold text-xs text-neutral-800">{c.code}</span>
                    <span className="flex-1 text-xs font-semibold text-neutral-600">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={e => {
              setPhone(e.target.value.replace(/\D/g, '').replace(/^0/, ''))
              setErrors(errors.filter(err => err !== 'phone'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 py-0 text-sm text-neutral-800 font-semibold placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('phone')
            )}
            placeholder="803 123 4567"
            autoComplete="tel"
            inputMode="tel"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            Password <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setStep('forgot_password')
              setErrors([])
            }}
            className="text-xs font-bold text-secondary-300 hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              setErrors(errors.filter(err => err !== 'password'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 py-0 pr-11 text-sm text-neutral-800 font-semibold placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('password')
            )}
            placeholder="Enter your password"
            autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sign In Button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className={clsx(
          'w-full bg-primary-500 text-white font-bold rounded-xl px-6 h-[48px] text-sm active:scale-[0.98] hover:bg-[#07361d] transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm mt-6',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="w-4.5 h-4.5" />
          </>
        )}
      </button>

      {/* Secure Access Box */}
      <div className="flex items-start gap-3 p-3.5 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-left">
          <h5 className="font-bold text-xs text-emerald-950">Secure access</h5>
          <p className="text-[10px] text-emerald-800 leading-normal">
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>

      {/* Center Create Organization link */}
      <div className="text-center pt-2">
        <p className="text-xs text-neutral-400 font-medium">
          New to Soole?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-secondary-300 font-bold hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            Create your organization <span className="text-xs">→</span>
          </button>
        </p>
      </div>

      {/* Protected footnote */}
      <div className="text-center pt-6 mt-4 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400/80">
        <span>🔒</span>
        <span>Protected by Soole • 2FA enabled for all accounts</span>
      </div>
    </div>
  )
}

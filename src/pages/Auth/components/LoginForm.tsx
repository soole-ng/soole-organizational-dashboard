import { useNavigate } from 'react-router-dom'
import { Phone, ChevronDown, Eye, EyeOff } from 'lucide-react'
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
    <div className="space-y-6 sm:space-y-8">
      {/* Phone field */}
      <div className="space-y-2">
        <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-black flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-black" />
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 items-center">
          {/* Country code selector */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowCC(!showCC)}
              className={clsx(
                'flex items-center gap-2 h-[52px] px-4 bg-white border rounded-xl text-base font-black text-black transition-colors',
                getBorderClass('phone')
              )}
            >
              <img src={country.flag} alt={country.name} className="w-6 h-4 object-cover rounded-sm" />
              <span className="text-sm font-black text-black">{country.code}</span>
              <ChevronDown className={clsx('w-4 h-4 text-black transition-transform', showCC && 'rotate-180')} />
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
                      'w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-primary-75 text-left',
                      country.code === c.code ? 'bg-primary-75 font-black text-black' : 'text-neutral-400'
                    )}
                  >
                    <img src={c.flag} alt={c.name} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                    <span className="font-black text-xs text-black">{c.code}</span>
                    <span className="flex-1 text-xs font-black text-black">{c.name}</span>
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
              'w-full h-[52px] bg-white border rounded-xl px-5 py-0 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none transition-all',
              getBorderClass('phone')
            )}
            placeholder="8031234567"
            autoComplete="tel"
            inputMode="tel"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black uppercase tracking-wider text-black">
            Password <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setStep('forgot_password')
              setErrors([])
            }}
            className="text-xs font-black text-primary-500 hover:underline"
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
              'w-full h-[52px] bg-white border rounded-xl px-5 py-0 pr-12 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none transition-all',
              getBorderClass('password')
            )}
            placeholder="Password"
            autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-neutral-700 transition-colors"
          >
            {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 h-[56px] text-lg active:scale-98 hover:bg-primary-400 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm mt-4 mb-4',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <div className="rounded-2xl bg-primary-75 p-5 border border-primary-100">
        <p className="text-base text-primary-500 text-center leading-relaxed font-black">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-teal-300 font-black underline hover:text-teal-200 transition-colors inline"
          >
            Sign up your organization
          </button>
        </p>
      </div>

      <p className="block sm:hidden text-center text-xs text-neutral-300 mt-6 font-medium pb-4">
        Protected by Soole Secure Auth
      </p>
    </div>
  )
}

import { Shield, ChevronDown, ArrowRight, User, Building2, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import { COUNTRY_CODES } from '../utils/auth'

interface SignupFormProps {
  suOwnerFirstName: string
  setSuOwnerFirstName: (val: string) => void
  suOwnerLastName: string
  setSuOwnerLastName: (val: string) => void
  suPhone: string
  setSuPhone: (val: string) => void
  suOrgName: string
  setSuOrgName: (val: string) => void
  country: typeof COUNTRY_CODES[0]
  setCountry: (val: typeof COUNTRY_CODES[0]) => void
  showCC: boolean
  setShowCC: (val: boolean) => void
  errors: string[]
  setErrors: (val: string[]) => void
  loading: boolean
  handleSignupInitiate: () => void
  setStep: (step: any) => void
  getBorderClass: (field: string) => string
}

export function SignupForm({
  suOwnerFirstName,
  setSuOwnerFirstName,
  suOwnerLastName,
  setSuOwnerLastName,
  suPhone,
  setSuPhone,
  suOrgName,
  setSuOrgName,
  country,
  setCountry,
  showCC,
  setShowCC,
  errors,
  setErrors,
  loading,
  handleSignupInitiate,
  setStep,
  getBorderClass,
}: SignupFormProps) {
  return (
    <div className="space-y-5">
      {/* Info box */}
      <div className="flex items-start gap-3 p-3.5 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
        <Shield className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-800 leading-relaxed">
          Quick signup. You'll complete verification later to unlock all features.
        </p>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={suOwnerFirstName}
            onChange={e => {
              setSuOwnerFirstName(e.target.value)
              setErrors(errors.filter(err => err !== 'suOwnerFirstName'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('suOwnerFirstName')
            )}
            placeholder="Adekemi"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={suOwnerLastName}
            onChange={e => {
              setSuOwnerLastName(e.target.value)
              setErrors(errors.filter(err => err !== 'suOwnerLastName'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('suOwnerLastName')
            )}
            placeholder="Chukuma"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-neutral-400" />
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowCC(!showCC)}
              className={clsx(
                'flex items-center gap-1.5 h-[48px] px-3.5 bg-white border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-800 transition-colors focus:border-primary-500',
                getBorderClass('suPhone')
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
            value={suPhone}
            onChange={e => {
              setSuPhone(e.target.value.replace(/\D/g, '').replace(/^0/, ''))
              setErrors(errors.filter(err => err !== 'suPhone'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('suPhone')
            )}
            placeholder="803 123 4567"
            inputMode="tel"
          />
        </div>
      </div>

      {/* Company Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={suOrgName}
          onChange={e => {
            setSuOrgName(e.target.value)
            setErrors(errors.filter(err => err !== 'suOrgName'))
          }}
          className={clsx(
            'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
            getBorderClass('suOrgName')
          )}
          placeholder="E.g., Speedway Transport Ltd."
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSignupInitiate}
        disabled={loading || !suOrgName || !suOwnerFirstName || !suOwnerLastName || !suPhone}
        className={clsx(
          'w-full bg-primary-500 text-white font-bold rounded-xl px-6 h-[48px] text-sm active:scale-[0.98] hover:bg-[#07361d] transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Sending Code…
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4.5 h-4.5" />
          </>
        )}
      </button>

      <button
        onClick={() => {
          setStep('login')
          setErrors([])
        }}
        className="w-full text-neutral-500 font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-all"
      >
        ← Back to login
      </button>

      {/* Footer */}
      <div className="text-center pt-4 mt-2 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400/80">
        <span>🔒</span>
        <span>Protected by Soole • 2FA enabled for all accounts</span>
      </div>
    </div>
  )
}

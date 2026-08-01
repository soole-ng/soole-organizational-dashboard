import { Shield, ChevronDown } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
        <Shield className="w-5 h-5 text-black flex-shrink-0" />
        <p className="text-xs text-black leading-relaxed font-black">
          Quick signup. You'll complete additional verification later to unlock all features.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-black">
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
              'w-full h-10 sm:h-11 bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all',
              getBorderClass('suOwnerFirstName')
            )}
            placeholder="Adekemi"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-black">
            Last Name (Surname) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={suOwnerLastName}
            onChange={e => {
              setSuOwnerLastName(e.target.value)
              setErrors(errors.filter(err => err !== 'suOwnerLastName'))
            }}
            className={clsx(
              'w-full h-10 sm:h-11 bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all',
              getBorderClass('suOwnerLastName')
            )}
            placeholder="Chukuma"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-black">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 items-center">
          <div
            className={clsx(
              'relative flex-shrink-0'
            )}
          >
            <button
              type="button"
              onClick={() => setShowCC(!showCC)}
              className={clsx(
                'flex items-center gap-2 h-10 sm:h-11 px-3 bg-white border rounded-xl text-sm font-black text-black transition-colors',
                getBorderClass('suPhone')
              )}
            >
              <img src={country.flag} alt={country.name} className="w-5 h-3.5 object-cover rounded-sm" />
              <span>{country.code}</span>
              <ChevronDown className={clsx('w-3.5 h-3.5 text-black transition-transform', showCC && 'rotate-180')} />
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
            value={suPhone}
            onChange={e => {
              setSuPhone(e.target.value.replace(/\D/g, '').replace(/^0/, ''))
              setErrors(errors.filter(err => err !== 'suPhone'))
            }}
            className={clsx(
              'w-full h-10 sm:h-11 bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all',
              getBorderClass('suPhone')
            )}
            placeholder="8031234567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-black">
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
            'w-full h-10 sm:h-11 bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all',
            getBorderClass('suOrgName')
          )}
          placeholder="E.g., Speedway Transport Ltd."
        />
      </div>

      <button
        onClick={handleSignupInitiate}
        disabled={loading || !suOrgName || !suOwnerFirstName || !suOwnerLastName || !suPhone}
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Sending Code…
          </>
        ) : (
          'Continue'
        )}
      </button>
      <button
        onClick={() => {
          setStep('login')
          setErrors([])
        }}
        className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm"
      >
        ← Back to login
      </button>
    </div>
  )
}

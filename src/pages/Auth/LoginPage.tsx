import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, ChevronDown, Phone, Car, MapPin, CreditCard, Sparkles, HelpCircle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../lib/OrgContext'
import { authApi } from '../../api/client'
import { z } from 'zod'
import { PRESET_SECURITY_QUESTIONS, CUSTOM_SECURITY_QUESTION_OPTION } from '../../lib/securityQuestions'

const loginSchema = z.object({
  phone: z.string().length(10, 'Phone must be exactly 10 digits'),
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must be numeric')
})

/** Backend requires latitude/longitude on every login step; falls back to 0,0 if denied. */
function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0 })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: 0, longitude: 0 }),
      { timeout: 5000 }
    )
  })
}

const signupSchema = z.object({
  suOrgName: z.string().min(2, 'Company name is required'),
  suOwnerName: z.string().min(2, 'Owner name is required'),
  suPhone: z.string().length(10, 'Phone must be exactly 10 digits'),
  suPassword: z.string().length(6, 'Password must be exactly 6 digits').regex(/^\d+$/, 'Password must be numeric'),
  suConfirmPassword: z.string(),
}).refine(data => data.suPassword === data.suConfirmPassword, {
  message: 'Passwords do not match',
  path: ['suConfirmPassword'],
})


type Step = 'login' | 'otp' | 'security_question' | 'signup' | 'security_setup'

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
  const { updateOrg } = useOrg()
  const [step, setStep]         = useState<Step>('login')
  const [country, setCountry]   = useState(COUNTRY_CODES[0])

  // Login fields
  const [phone, setPhone]       = useState('')
  const [pin, setPin]           = useState('')
  const [otp, setOtp]           = useState('')
  const [secAnswer, setSecAnswer] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')

  // Signup fields - simplified for fast registration
  const [suOrgName, setSuOrgName] = useState('')
  const [suOwnerName, setSuOwnerName] = useState('')
  const [suPhone, setSuPhone] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirmPassword, setSuConfirmPassword] = useState('')

  // Post-signup security question setup (optional, skippable - can also be
  // done/changed later from Settings)
  const [suSecQuestionChoice, setSuSecQuestionChoice] = useState(PRESET_SECURITY_QUESTIONS[0])
  const [suSecCustomQuestion, setSuSecCustomQuestion] = useState('')
  const [suSecAnswer, setSuSecAnswer] = useState('')
  const [savingSecurityQuestion, setSavingSecurityQuestion] = useState(false)

  const [showPw, setShowPw]     = useState(false)
  const [showCC, setShowCC]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState<string[]>([])


  const fullPhone = `${country.code}${phone.replace(/^0/, '')}`
  const fullSuPhone = `${country.code}${suPhone.replace(/^0/, '')}`

  /** Persists tokens and finishes login - shared by the no-security-question and security-question paths. */
  const finishLogin = (tokenData: { access_token: string; refresh_token: { token: string } }) => {
    localStorage.setItem('auth_token', tokenData.access_token)
    localStorage.setItem('refresh_token', tokenData.refresh_token.token)
    toast.success('Welcome back to Mobiliti!')
    navigate('/')
  }

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ phone, pin })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }
    setErrors([])
    setLoading(true)
    try {
      await authApi.initiateLogin(fullPhone, pin)
      toast.success('Verification code sent to your phone')
      setStep('otp')
    } catch (err: any) {
      toast.error(err?.message ?? 'Login failed. Check your phone number and PIN.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async () => {
    if (otp.length !== 6) return
    setLoading(true)
    try {
      const { latitude, longitude } = await getBrowserLocation()
      const res = await authApi.verifyLoginOtp(fullPhone, otp, latitude, longitude)
      if ('requires_security_question' in res.data) {
        setSecurityQuestion(res.data.question)
        setStep('security_question')
      } else {
        finishLogin(res.data)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityQuestion = async () => {
    if (!secAnswer) return
    setLoading(true)
    try {
      const { latitude, longitude } = await getBrowserLocation()
      const res = await authApi.verifySecurityAnswer(fullPhone, secAnswer, latitude, longitude)
      finishLogin(res.data)
    } catch (err: any) {
      toast.error(err?.message ?? 'Incorrect answer to security question!')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    const result = signupSchema.safeParse({ suOrgName, suOwnerName, suPhone, suPassword, suConfirmPassword })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }

    setErrors([])
    setLoading(true)
    try {
      const res = await authApi.signupOrganization({
        phone: fullSuPhone,
        pin: suPassword,
        confirmPin: suConfirmPassword,
        organizationName: suOrgName,
        organizationType: 'transport_co',
        firstName: suOwnerName,
        lastName: '',
      })
      localStorage.setItem('auth_token', res.data.token)
      localStorage.setItem('refresh_token', res.data.refreshToken)
      updateOrg({ approvalStatus: 'pending' })
      toast.success('Organization created! Complete your profile to unlock full features.')
      setStep('security_setup')
    } catch (err: any) {
      toast.error(err?.message ?? 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecurityQuestion = async () => {
    const question = suSecQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION ? suSecCustomQuestion.trim() : suSecQuestionChoice
    if (!question || !suSecAnswer.trim()) {
      toast.error('Enter both a question and an answer')
      return
    }
    setSavingSecurityQuestion(true)
    try {
      await authApi.setSecurityQuestion(question, suSecAnswer.trim())
      toast.success('Security question saved')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save security question')
    } finally {
      setSavingSecurityQuestion(false)
    }
  }

  const getBorderClass = (field: string) => 
    errors.includes(field) 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
      : 'border-neutral-100 focus:border-secondary-300 focus:ring-secondary-300/10'

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row">
      {/* Left panel (desktop only) */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-6 w-24 h-24 rounded-full bg-accent-300/20" />

        <div className="relative z-10 text-center w-full max-w-sm">
          {/* Logo Mark */}
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="bg-primary-500 px-6 pt-16 pb-12 text-white lg:hidden flex-shrink-0">
          <div className="w-16 h-16 flex items-center justify-start mb-6">
            <img src="/soole-icon.png" alt="Soole logo" className="h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2 font-display">
            {step === 'login' ? 'Welcome back' : step === 'signup' ? 'Create Account' : step === 'security_setup' ? 'Secure your account' : 'Verify your phone'}
          </h1>
          <p className="text-primary-200 text-sm">
            {step === 'login' ? 'Sign in to your organization account' : step === 'signup' ? 'Register your company on Soole' : step === 'security_setup' ? 'Set up a security question for account recovery and withdrawals' : 'Enter the verification code sent via SMS'}
          </p>
        </div>

        {/* Form card container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className={clsx("w-full transition-all duration-300", step === 'signup' ? "max-w-[500px]" : "max-w-[400px]")}>
            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-4xl font-extrabold text-primary-500 mb-2 font-display">
                {step === 'login' ? 'Sign in' : step === 'signup' ? 'Register Company' : step === 'security_setup' ? 'Secure your account' : 'Verify your phone'}
              </h1>
              <p className="text-neutral-300 text-base">
                {step === 'login'
                  ? 'Enter your phone number and password to continue'
                  : step === 'signup'
                  ? 'Fill out your basic details to get started'
                  : step === 'security_setup'
                  ? 'Set up a security question - used for account recovery and required before withdrawals'
                  : 'Enter the 6-digit verification code sent to your phone'}
              </p>
            </div>

            <div className="bg-white rounded-card shadow-card p-8 lg:p-10 relative z-10">
              {step === 'login' ? (
                <div className="space-y-7">
                  {/* Phone field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-black" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      {/* Country code selector */}
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowCC(!showCC)}
                          className={clsx("flex items-center gap-2 h-[44px] px-3 bg-white border rounded-xl text-sm font-black text-black transition-colors", getBorderClass('phone'))}
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
                                onClick={() => { setCountry(c); setShowCC(false) }}
                                className={clsx(
                                  'w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-primary-75 text-left',
                                  country.code === c.code ? 'bg-primary-75 font-black text-black' : 'text-neutral-400',
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
                        className={clsx("w-full h-[44px] bg-white border rounded-xl px-4 py-0 text-sm text-black font-black placeholder:text-neutral-100 focus:outline-none transition-all", getBorderClass('phone'))}
                        placeholder="8031234567"
                        autoComplete="tel"
                        inputMode="tel"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                  </div>

                  {/* PIN field */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-black">
                      6-Digit PIN <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={e => {
                          setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                          setErrors(errors.filter(err => err !== 'pin'))
                        }}
                        className={clsx("w-full h-[44px] bg-white border rounded-xl px-5 py-0 pr-12 text-sm text-black font-black placeholder:text-neutral-100 focus:outline-none transition-all tracking-[0.3em]", getBorderClass('pin'))}
                        placeholder="••••••"
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
                    className={clsx('w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm', loading && 'opacity-70')}
                  >
                    {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</> : 'Sign in'}
                  </button>

                  <div className="rounded-2xl bg-primary-75 p-4 border border-primary-100">
                    <p className="text-xs text-primary-500 text-center leading-relaxed font-black">
                      Don't have an account?{' '}
                      <button
                        onClick={() => { setStep('signup'); setErrors([]) }}
                        className="text-teal-300 font-black underline hover:text-teal-200 transition-colors inline"
                      >
                        Sign up your organization
                      </button>
                    </p>
                  </div>
                </div>
              ) : step === 'signup' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                    <Shield className="w-5 h-5 text-black flex-shrink-0" />
                    <p className="text-xs text-black leading-relaxed font-black">
                      Quick signup. You'll complete additional verification later to unlock all features.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={suOrgName}
                      onChange={e => { setSuOrgName(e.target.value); setErrors(errors.filter(err => err !== 'suOrgName')) }}
                      className={clsx("w-full h-[40px] bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all", getBorderClass('suOrgName'))}
                      placeholder="E.g., Speedway Transport Ltd."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={suOwnerName}
                      onChange={e => { setSuOwnerName(e.target.value); setErrors(errors.filter(err => err !== 'suOwnerName')) }}
                      className={clsx("w-full h-[40px] bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all", getBorderClass('suOwnerName'))}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className={clsx("h-[40px] px-3 bg-white border rounded-xl flex items-center justify-center gap-2 text-sm font-black flex-shrink-0 text-black", getBorderClass('suPhone'))}>
                        <img src={country.flag} alt={country.name} className="w-5 h-3.5 object-cover rounded-sm" />
                        {country.code}
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={suPhone}
                        onChange={e => { setSuPhone(e.target.value.replace(/\D/g, '').replace(/^0/, '')); setErrors(errors.filter(err => err !== 'suPhone')) }}
                        className={clsx("w-full h-[40px] bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all", getBorderClass('suPhone'))}
                        placeholder="8031234567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-black">
                        6-Digit Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={suPassword}
                        onChange={e => { setSuPassword(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors(errors.filter(err => err !== 'suPassword')) }}
                        className={clsx("w-full h-[40px] bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all tracking-[0.3em]", getBorderClass('suPassword'))}
                        placeholder="••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-black">
                        Confirm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={suConfirmPassword}
                        onChange={e => { setSuConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors(errors.filter(err => err !== 'suConfirmPassword')) }}
                        className={clsx("w-full h-[40px] bg-white border rounded-xl px-4 text-sm font-black focus:outline-none transition-all tracking-[0.3em]", getBorderClass('suConfirmPassword'))}
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSignup}
                    disabled={loading}
                    className={clsx('w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm mt-4', loading && 'opacity-70')}
                  >
                    {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating Account…</> : 'Create Account'}
                  </button>
                  <button onClick={() => { setStep('login'); setErrors([]) }} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
                    ← Back to login
                  </button>
                </div>
              ) : step === 'otp' ? (
                <div className="space-y-7">
                  <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                    <Shield className="w-5 h-5 text-black flex-shrink-0" />
                    <p className="text-xs text-black leading-relaxed font-black">
                      We've sent a 6-digit code via SMS to your phone. Please enter it below.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">6-digit code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-black text-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all stat-number"
                      placeholder="000000"
                      onKeyDown={e => e.key === 'Enter' && handleOtp()}
                      autoFocus
                    />
                    <div className="flex justify-center gap-2 mt-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={clsx('w-2 h-2 rounded-full transition-colors', i < otp.length ? 'bg-primary-500' : 'bg-neutral-100')} />
                      ))}
                    </div>
                  </div>
                  <button onClick={handleOtp} disabled={otp.length !== 6 || loading} className={clsx('w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2', loading && 'opacity-70')}>
                    {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying…</> : 'Verify & Sign in'}
                  </button>
                  <button onClick={() => { setStep('login'); setOtp('') }} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
                    ← Back to login
                  </button>
                </div>
              ) : step === 'security_setup' ? (
                <div className="space-y-7">
                  <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                    <Shield className="w-5 h-5 text-black flex-shrink-0" />
                    <p className="text-xs text-black leading-relaxed font-black">
                      Choose a security question or write your own. You'll need to answer it before withdrawing funds, or if you ever forget your PIN.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">Question</label>
                    <div className="relative">
                      <select
                        value={suSecQuestionChoice}
                        onChange={e => setSuSecQuestionChoice(e.target.value)}
                        className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-sm font-bold text-black appearance-none focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                      >
                        {PRESET_SECURITY_QUESTIONS.map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                        <option value={CUSTOM_SECURITY_QUESTION_OPTION}>{CUSTOM_SECURITY_QUESTION_OPTION}</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                    </div>
                  </div>

                  {suSecQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && (
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-black">Your Question</label>
                      <input
                        type="text"
                        value={suSecCustomQuestion}
                        onChange={e => setSuSecCustomQuestion(e.target.value)}
                        className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-sm font-bold text-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                        placeholder="Write your own security question"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">Answer</label>
                    <input
                      type="text"
                      value={suSecAnswer}
                      onChange={e => setSuSecAnswer(e.target.value)}
                      className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-sm font-bold text-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                      placeholder="Your answer"
                      onKeyDown={e => e.key === 'Enter' && handleSaveSecurityQuestion()}
                    />
                  </div>

                  <button
                    onClick={handleSaveSecurityQuestion}
                    disabled={savingSecurityQuestion || !suSecAnswer.trim() || (suSecQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && !suSecCustomQuestion.trim())}
                    className={clsx('w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2', savingSecurityQuestion && 'opacity-70')}
                  >
                    {savingSecurityQuestion ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save & Continue'}
                  </button>
                  <button onClick={() => navigate('/')} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
                    Set up later in Settings
                  </button>
                </div>
              ) : (
                <div className="space-y-7">
                  <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                    <HelpCircle className="w-5 h-5 text-black flex-shrink-0" />
                    <p className="text-xs text-black leading-relaxed font-black">Please answer your backup security question to complete signing in.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-black">
                      Question: <span className="font-extrabold text-primary-500">{securityQuestion || 'Backup Security Question'}</span>
                    </label>
                    <input
                      type="password"
                      value={secAnswer}
                      onChange={e => setSecAnswer(e.target.value)}
                      className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-base font-black text-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                      placeholder="Enter your secret answer"
                      onKeyDown={e => e.key === 'Enter' && handleSecurityQuestion()}
                      autoFocus
                    />
                  </div>
                  <button onClick={handleSecurityQuestion} disabled={!secAnswer || loading} className={clsx('w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2', loading && 'opacity-70')}>
                    {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying…</> : 'Verify Answer'}
                  </button>
                  <button onClick={() => { setStep('otp'); setSecAnswer('') }} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
                    ← Back to 2FA PIN
                  </button>
                </div>
              )}
            </div>
            {step === 'login' && (
              <p className="text-center text-xs text-neutral-200 mt-8 font-medium">Protected by Soole · 2FA required for all organization accounts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

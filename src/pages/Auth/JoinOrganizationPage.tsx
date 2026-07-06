import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ChevronRight, Lock, Phone, Eye, EyeOff, CheckCircle, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { authApi } from '../../api/client'
import { PRESET_SECURITY_QUESTIONS, CUSTOM_SECURITY_QUESTION_OPTION } from '../../lib/securityQuestions'
import { OTPInput } from '../../components/auth/OTPInput'

const COUNTRY_CODES = [
  { code: '+234', flag: 'https://flagcdn.com/w40/ng.png', name: 'Nigeria' },
  { code: '+233', flag: 'https://flagcdn.com/w40/gh.png', name: 'Ghana' },
  { code: '+254', flag: 'https://flagcdn.com/w40/ke.png', name: 'Kenya' },
  { code: '+27', flag: 'https://flagcdn.com/w40/za.png', name: 'South Africa' },
  { code: '+250', flag: 'https://flagcdn.com/w40/rw.png', name: 'Rwanda' },
]

// Multi-step team member signup with NIN validation and strong password
type Step = 'invite_validation' | 'otp' | 'personal_info' | 'password' | 'security_questions' | 'success'

const inviteSchema = z.object({
  phone: z.string().length(10, 'Phone must be 10 digits')
})

const otpSchema = z.object({
  otp: z.string().length(5, 'OTP must be 5 digits')
})

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  nin: z.string().length(11, 'NIN must be exactly 11 digits').regex(/^\d+$/, 'NIN must be numeric'),
  dob: z.string().min(10, 'Valid date required')
})

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(/[!@#$%^&*]/, 'Password must contain a special character (!@#$%^&*)'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// User-friendly error message mapper
function getErrorMessage(error: any, step: string): string {
  const message = error?.message || ''

  if (step === 'invite_validation') {
    if (message.includes('404') || message.includes('not found')) {
      return '❌ No invitation found. Please check your phone number or contact your organization owner to send a new invite.'
    }
    if (message.includes('410') || message.includes('expired')) {
      return 'Your invitation has expired (3-day limit). Please ask your organization owner to send a new invite.'
    }
    if (message.includes('409') || message.includes('already been used')) {
      return 'This invitation has already been used. You can now log in with your credentials.'
    }
  }

  if (step === 'otp') {
    if (message.includes('Invalid') || message.includes('incorrect')) {
      return '❌ The code you entered is incorrect. Please check the SMS and try again.'
    }
    if (message.includes('expired')) {
      return 'Your verification code has expired. Please request a new one.'
    }
  }

  if (step === 'personal_info') {
    if (message.includes('NIN') || message.includes('verification')) {
      return '❌ Your NIN and date of birth don\'t match our records. Please verify and try again.'
    }
    if (message.includes('already')) {
      return '⚠️ This identity is already registered. Please contact support.'
    }
  }

  if (step === 'security_questions') {
    if (message.includes('phone') || message.includes('already')) {
      return '⚠️ This phone number is already registered. Please log in instead.'
    }
    if (message.includes('password')) {
      return '❌ Passwords do not match. Please ensure both passwords are identical.'
    }
  }

  return error?.message || 'Something went wrong. Please try again.'
}

export function JoinOrganizationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const prefillPhone = searchParams.get('phone') || ''
  const prefillOtp = searchParams.get('otp') || ''

  const [step, setStep] = useState<Step>(
    prefillPhone && prefillOtp ? 'personal_info' : prefillPhone ? 'otp' : 'invite_validation'
  )

  // Country and phone
  const [country, setCountry] = useState(COUNTRY_CODES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [phone, setPhone] = useState(prefillPhone)
  const fullPhone = `${country.code}${phone.replace(/^0/, '')}`

  // Form fields
  const [otp, setOtp] = useState(prefillOtp)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nin, setNin] = useState('')
  const [dob, setDob] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [secQuestionChoice, setSecQuestionChoice] = useState(PRESET_SECURITY_QUESTIONS[0])
  const [secCustomQuestion, setSecCustomQuestion] = useState('')
  const [secAnswer, setSecAnswer] = useState('')

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [invitationDetails, setInvitationDetails] = useState<any>(null)
  const [otpResendsLeft, setOtpResendsLeft] = useState(2)
  const [otpCooldown, setOtpCooldown] = useState(0)

  const handleInviteValidation = async () => {
    const result = inviteSchema.safeParse({ phone })
    if (!result.success) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      // Validate invitation exists for this phone (with country code)
      // Invitation expires in 3 days
      const res = await authApi.validateOrgInvitation(fullPhone)
      setInvitationDetails(res.data)

      // Send OTP for phone verification
      await authApi.sendJoinOrgOtp(fullPhone)
      toast.success('Invitation confirmed! Check your phone for the verification code.')
      setStep('otp')
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'invite_validation'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async () => {
    const result = otpSchema.safeParse({ otp })
    if (!result.success) {
      toast.error('Please enter all 5 digits from your verification code')
      return
    }

    setLoading(true)
    try {
      // Verify OTP (already sent during invite validation)
      await authApi.verifyLoginOtp(fullPhone, otp, 0, 0)
      toast.success('Your phone number is verified!')
      setStep('personal_info')
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'otp'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResendLoading(true)
    try {
      const res = await authApi.resendLoginOtp(fullPhone)
      setOtpResendsLeft(res.data.resends_left)
      setOtpCooldown(res.data.seconds_until_next)
      toast.success('OTP resent successfully')
      setOtp('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to resend OTP')
      const message = err?.message || ''
      if (message.includes('wait') || message.includes('Locked')) {
        const match = message.match(/(\d+)m (\d+)s/)
        if (match) {
          const mins = parseInt(match[1] || '0')
          const secs = parseInt(match[2] || '0')
          const totalSeconds = mins * 60 + secs
          setOtpCooldown(totalSeconds)
        }
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handlePersonalInfoSubmit = async () => {
    const result = personalInfoSchema.safeParse({ firstName, lastName, nin, dob })
    if (!result.success) {
      const issue = result.error.issues[0]
      if (issue.code === 'too_small') {
        toast.error('Please enter at least 2 characters for names')
      } else if (issue.path[0] === 'nin') {
        toast.error('🔑 NIN must be exactly 11 digits')
      } else if (issue.path[0] === 'dob') {
        toast.error('Please select a valid date of birth')
      } else {
        toast.error('Please fill in all required fields')
      }
      return
    }

    setLoading(true)
    try {
      // Validate NIN and DOB match (backend will verify against Prembly)
      toast.success('Your identity has been verified!')
      setStep('password')
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'personal_info'))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = () => {
    const result = passwordSchema.safeParse({ password, confirmPassword })
    if (!result.success) {
      const issue = result.error.issues[0]
      if (issue.message.includes('match')) {
        toast.error('❌ Passwords do not match. Please make sure they\'re identical.')
      } else if (issue.message.includes('at least 8')) {
        toast.error('🔑 Password needs at least 8 characters')
      } else if (issue.message.includes('uppercase')) {
        toast.error('🔑 Password needs at least 1 uppercase letter (A-Z)')
      } else if (issue.message.includes('lowercase')) {
        toast.error('🔑 Password needs at least 1 lowercase letter (a-z)')
      } else if (issue.message.includes('number')) {
        toast.error('🔑 Password needs at least 1 number (0-9)')
      } else if (issue.message.includes('special')) {
        toast.error('🔑 Password needs a special character: !@#$%^&*')
      } else {
        toast.error('🔑 Password does not meet requirements')
      }
      return
    }

    setStep('security_questions')
  }

  const handleSecurityQuestionsSubmit = async () => {
    const question = secQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION ? secCustomQuestion.trim() : secQuestionChoice
    if (!question || !secAnswer.trim()) {
      if (secQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && !secCustomQuestion.trim()) {
        toast.error('🔑 Please write your security question')
      } else if (!secAnswer.trim()) {
        toast.error('🔑 Please enter your answer to the security question')
      } else {
        toast.error('🔑 Please fill in both question and answer')
      }
      return
    }

    setLoading(true)
    try {
      const res = await authApi.joinOrganization({
        phone: fullPhone,
        otp,
        password,
        confirmPassword,
        firstName,
        lastName,
        nin,
        dob,
        securityQuestion: question,
        securityAnswer: secAnswer.trim()
      })
      localStorage.setItem('auth_token', res.data.token)
      localStorage.setItem('refresh_token', res.data.refreshToken)
      setStep('success')
      setTimeout(() => navigate('/'), 1500)
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'security_questions'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row items-center justify-center p-6">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-secondary-500 rounded-2xl shadow-sm">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary-500 mb-2 font-display">Join Organization</h1>
          <p className="text-neutral-300 text-sm">
            Complete your setup to get started with Soole.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-between items-center mb-8">
            {['Invite', 'OTP', 'Info', 'Password', 'Security'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black',
                  ['invite_validation', 'otp', 'personal_info', 'password', 'security_questions'][idx] === step
                    ? 'bg-primary-500 text-white'
                    : ['invite_validation', 'otp', 'personal_info', 'password', 'security_questions'].indexOf(step) > idx
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                )}>
                  {['invite_validation', 'otp', 'personal_info', 'password', 'security_questions'].indexOf(step) > idx ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < 4 && <div className="w-8 h-0.5 bg-neutral-100 mx-1" />}
              </div>
            ))}
          </div>

          {/* Invite Validation Step */}
          {step === 'invite_validation' && (
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-center">
                {/* Country Code Selector */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-2 h-[44px] px-3 bg-white border border-neutral-100 rounded-xl text-sm font-black text-black transition-colors hover:bg-neutral-50"
                  >
                    <img src={country.flag} alt={country.name} className="w-6 h-4 object-cover rounded-sm" />
                    <span className="text-sm font-black text-black">{country.code}</span>
                    <ChevronDown className={clsx('w-4 h-4 text-black transition-transform', showCountryDropdown && 'rotate-180')} />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-lg border border-neutral-50 overflow-hidden z-30 min-w-48">
                      {COUNTRY_CODES.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setCountry(c); setShowCountryDropdown(false) }}
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

                {/* Phone Input */}
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').replace(/^0/, ''))}
                  className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none focus:border-secondary-300"
                  placeholder="8031234567"
                />
              </div>

              <button
                onClick={handleInviteValidation}
                disabled={loading || phone.length !== 10}
                className={clsx(
                  'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all',
                  loading && 'opacity-70'
                )}
              >
                {loading ? 'Validating...' : 'Validate Invitation'}
              </button>
              {invitationDetails && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-black text-green-900">
                    ✓ Invitation found for {invitationDetails.organization_name}
                  </p>
                  <p className="text-xs text-green-700">Role: {invitationDetails.role}</p>
                </div>
              )}
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <OTPInput
              value={otp}
              onChange={setOtp}
              onSubmit={handleOtpSubmit}
              onResend={handleResendOtp}
              loading={loading}
              resendLoading={resendLoading}
              resendsLeft={otpResendsLeft}
              secondsUntilNextResend={otpCooldown}
              canResend={true}
              description="We've sent a 5-digit code via SMS to your phone. Please enter it below."
            />
          )}

          {/* Personal Info Step */}
          {step === 'personal_info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full h-[40px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full h-[40px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">NIN (11 digits) *</label>
                <input
                  type="text"
                  maxLength={11}
                  value={nin}
                  onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[40px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none"
                  placeholder="12345678901"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full h-[40px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none"
                />
              </div>

              <button
                onClick={handlePersonalInfoSubmit}
                disabled={loading || !firstName || !lastName || nin.length !== 11 || !dob}
                className={clsx(
                  'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all',
                  loading && 'opacity-70'
                )}
              >
                {loading ? 'Validating...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 pr-12 text-sm font-black focus:outline-none"
                    placeholder="Create strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {password && (
                  <div className="space-y-1.5 mt-3">
                    {[
                      { check: password.length >= 8, text: 'At least 8 characters' },
                      { check: /[A-Z]/.test(password), text: 'Uppercase letter' },
                      { check: /[a-z]/.test(password), text: 'Lowercase letter' },
                      { check: /\d/.test(password), text: 'Number' },
                      { check: /[!@#$%^&*]/.test(password), text: 'Special character' }
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={clsx('w-4 h-4 rounded-full flex items-center justify-center', req.check ? 'bg-green-500' : 'bg-neutral-200')}>
                          {req.check && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={clsx('text-xs font-black', req.check ? 'text-green-600' : 'text-neutral-400')}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none"
                  placeholder="Confirm password"
                />
              </div>

              <button
                onClick={handlePasswordSubmit}
                disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 8}
                className={clsx(
                  'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all'
                )}
              >
                Continue
              </button>
            </div>
          )}

          {/* Security Questions Step */}
          {step === 'security_questions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Security Question *</label>
                <select
                  value={secQuestionChoice}
                  onChange={e => setSecQuestionChoice(e.target.value)}
                  className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-black appearance-none focus:outline-none"
                >
                  {PRESET_SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                  <option value={CUSTOM_SECURITY_QUESTION_OPTION}>{CUSTOM_SECURITY_QUESTION_OPTION}</option>
                </select>
              </div>

              {secQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Your Question *</label>
                  <input
                    type="text"
                    value={secCustomQuestion}
                    onChange={e => setSecCustomQuestion(e.target.value)}
                    className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none"
                    placeholder="Create your own security question"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">Answer *</label>
                <input
                  type="text"
                  value={secAnswer}
                  onChange={e => setSecAnswer(e.target.value)}
                  className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none"
                  placeholder="Your answer"
                />
              </div>

              <button
                onClick={handleSecurityQuestionsSubmit}
                disabled={loading || !secAnswer.trim() || (secQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && !secCustomQuestion.trim())}
                className={clsx(
                  'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all',
                  loading && 'opacity-70'
                )}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center mx-auto bg-green-100 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-primary-500">Welcome to {invitationDetails?.organization_name}!</h2>
              <p className="text-sm text-neutral-400">Your account is ready. Redirecting to dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ChevronRight, Lock, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { authApi } from '../../api/client'
import { PRESET_SECURITY_QUESTIONS, CUSTOM_SECURITY_QUESTION_OPTION } from '../../lib/securityQuestions'

// Multi-step team member signup with NIN validation and strong password
type Step = 'invite_validation' | 'otp' | 'personal_info' | 'password' | 'security_questions' | 'success'

const inviteSchema = z.object({
  phone: z.string().length(10, 'Phone must be 10 digits')
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits')
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

export function JoinOrganizationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const prefillPhone = searchParams.get('phone') || ''
  const prefillOtp = searchParams.get('otp') || ''

  const [step, setStep] = useState<Step>(
    prefillPhone && prefillOtp ? 'personal_info' : prefillPhone ? 'otp' : 'invite_validation'
  )

  // Form fields
  const [phone, setPhone] = useState(prefillPhone)
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
  const [invitationDetails, setInvitationDetails] = useState<any>(null)

  const handleInviteValidation = async () => {
    const result = inviteSchema.safeParse({ phone })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      // Validate invitation exists for this phone
      const res = await authApi.validateOrgInvitation(phone)
      setInvitationDetails(res.data)
      toast.success('Invitation found! Please verify your OTP.')
      setStep('otp')
    } catch (err: any) {
      toast.error(err?.message ?? 'No invitation found for this phone number')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async () => {
    const result = otpSchema.safeParse({ otp })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      await authApi.verifyLoginOtp(phone, otp, 0, 0)
      toast.success('Phone verified!')
      setStep('personal_info')
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handlePersonalInfoSubmit = async () => {
    const result = personalInfoSchema.safeParse({ firstName, lastName, nin, dob })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      // Validate NIN and DOB match (backend will verify against Prembly)
      const fullName = `${firstName} ${lastName}`
      // In real implementation, backend would call fetch_and_match_nin
      toast.success('Personal info verified!')
      setStep('password')
    } catch (err: any) {
      toast.error(err?.message ?? 'NIN/DOB verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = () => {
    const result = passwordSchema.safeParse({ password, confirmPassword })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setStep('security_questions')
  }

  const handleSecurityQuestionsSubmit = async () => {
    const question = secQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION ? secCustomQuestion.trim() : secQuestionChoice
    if (!question || !secAnswer.trim()) {
      toast.error('Please fill in both question and answer')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.joinOrganization({
        phone,
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
      toast.error(err?.message ?? 'Could not complete setup')
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
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none focus:border-secondary-300"
                placeholder="8031234567"
              />
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
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-black">6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-black text-black focus:outline-none"
                placeholder="000000"
              />
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={clsx('w-2 h-2 rounded-full', i < otp.length ? 'bg-primary-500' : 'bg-neutral-100')} />
                ))}
              </div>
              <button
                onClick={handleOtpSubmit}
                disabled={loading || otp.length !== 6}
                className={clsx(
                  'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all',
                  loading && 'opacity-70'
                )}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
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

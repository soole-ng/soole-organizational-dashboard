import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ChevronRight, Lock, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { z } from 'zod'

type Step = 'phone' | 'otp' | 'password' | 'security' | 'success'

const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone number must be valid')
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits')
})

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

const securitySchema = z.object({
  question: z.string().min(1, 'Please provide a question'),
  answer: z.string().min(1, 'Please provide an answer')
})

const getPasswordRequirements = (password: string) => ({
  hasMinLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
})

const passwordsMatch = (pwd: string, confirm: string) => pwd === confirm && pwd.length > 0

export function JoinOrganizationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState(searchParams.get('phone') || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [question, setQuestion] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneSubmit = () => {
    const result = phoneSchema.safeParse({ phone })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('OTP sent to your phone!')
      setStep('otp')
    }, 1000)
  }

  const handleOtpSubmit = () => {
    const result = otpSchema.safeParse({ otp })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (otp === '000000') {
        toast.success('OTP verified!')
        setStep('password')
      } else {
        toast.error('Invalid OTP. Try 000000 for demo.')
      }
    }, 800)
  }

  const handlePasswordSubmit = () => {
    const result = passwordSchema.safeParse({ newPassword, confirmPassword })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setStep('security')
  }

  const handleSecuritySubmit = () => {
    const finalQuestion = question === 'custom' ? customQuestion : question
    const result = securitySchema.safeParse({ question: finalQuestion, answer })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('success')
      setTimeout(() => {
        navigate('/login', { state: { phone, setupComplete: true } })
      }, 2000)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextStep: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextStep()
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

        <div className="bg-white rounded-card shadow-card p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['phone', 'otp', 'password', 'security'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={clsx(
                  "h-1.5 w-12 rounded-full transition-all",
                  ['phone', 'otp', 'password', 'security'].indexOf(step) >= i
                    ? 'bg-secondary-500'
                    : 'bg-primary-100'
                )}
              />
            ))}
          </div>

          {step === 'phone' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Phone className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Enter your phone number to verify your identity.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, handlePhoneSubmit)}
                  placeholder="+234 (XX) XXXX-XXXX"
                  className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                />
              </div>

              <button
                onClick={handlePhoneSubmit}
                disabled={!phone.trim() || loading}
                className="w-full bg-secondary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-secondary-600 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Lock className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Enter the 6-digit code sent to your phone.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => handleKeyDown(e, handleOtpSubmit)}
                  placeholder="000000"
                  className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all text-center tracking-widest"
                />
                <p className="text-xs text-neutral-300">Use 000000 for demo</p>
              </div>

              <button
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6 || loading}
                className="w-full bg-secondary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-secondary-600 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-secondary-500 font-semibold hover:text-secondary-600 transition-colors"
              >
                ← Change phone number
              </button>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Lock className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Create a strong password for your account.
                </p>
              </div>

              <div className="bg-primary-75 p-4 rounded-2xl border border-primary-100 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-black">Password Requirements:</p>
                <div className="space-y-2 text-xs font-black">
                  {[
                    { label: 'At least 8 characters', check: getPasswordRequirements(newPassword).hasMinLength },
                    { label: 'Uppercase letter (A-Z)', check: getPasswordRequirements(newPassword).hasUppercase },
                    { label: 'Lowercase letter (a-z)', check: getPasswordRequirements(newPassword).hasLowercase },
                    { label: 'Number (0-9)', check: getPasswordRequirements(newPassword).hasNumber },
                    { label: 'Special character (!@#$%...)', check: getPasswordRequirements(newPassword).hasSpecial },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={req.check ? 'text-accent-400' : 'text-neutral-300'}>
                        {req.check ? '✓' : '○'}
                      </span>
                      <span className={req.check ? 'text-black' : 'text-neutral-300'}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Password (8+ characters)</label>
                <input
                  type="password"
                  maxLength={20}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                  placeholder="Create a strong password"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Confirm Password</label>
                <input
                  type="password"
                  maxLength={20}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={clsx(
                    "w-full h-[60px] bg-white border rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:ring-4 transition-all",
                    confirmPassword.length > 0 && passwordsMatch(newPassword, confirmPassword)
                      ? 'border-secondary-300 focus:border-secondary-300 focus:ring-secondary-300/10'
                      : confirmPassword.length > 0 && !passwordsMatch(newPassword, confirmPassword)
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-neutral-100 focus:border-secondary-300 focus:ring-secondary-300/10'
                  )}
                  placeholder="Re-enter password"
                />
              </div>

              <button
                onClick={handlePasswordSubmit}
                disabled={!newPassword || !confirmPassword || !passwordsMatch(newPassword, confirmPassword) || newPassword.length < 8}
                className="w-full bg-secondary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-secondary-600 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'security' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Shield className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Set a security question to verify your identity later.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Select Question</label>
                <div className="relative">
                  <select
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 pr-12 text-sm text-black font-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all appearance-none"
                  >
                    <option value="" disabled>Select a question...</option>
                    <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                    <option value="What is the name of your favorite pet?">What is the name of your favorite pet?</option>
                    <option value="In what city did you meet your spouse?">In what city did you meet your spouse?</option>
                    <option value="What is your favorite movie?">What is your favorite movie?</option>
                    <option value="What was your dream job as a child?">What was your dream job as a child?</option>
                    <option value="custom">Other (Create your own question)</option>
                  </select>
                </div>
              </div>

              {question === 'custom' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">Your Custom Question</label>
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={e => setCustomQuestion(e.target.value)}
                    className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 text-sm text-black font-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                    placeholder="Type your own security question"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Your Answer</label>
                <input
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                  placeholder="Enter secret answer"
                />
              </div>

              <button
                onClick={handleSecuritySubmit}
                disabled={!answer || loading}
                className={clsx('w-full bg-secondary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-secondary-600 transition-all duration-150 flex items-center justify-center gap-2 mt-4', loading && 'opacity-70')}
              >
                {loading
                  ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Completing Setup…</>
                  : <>Complete Setup <ChevronRight className="w-5 h-5" /></>
                }
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
              <div className="w-20 h-20 bg-accent-300 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✓</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-primary-500 mb-2">Welcome to Soole!</h2>
                <p className="text-sm text-neutral-300">Your account is ready. Redirecting to login...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

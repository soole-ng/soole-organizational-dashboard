import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, ChevronRight, HelpCircle, ChevronDown, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../lib/OrgContext'
import { z } from 'zod'

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

// Password validation helpers
const getPasswordRequirements = (password: string) => ({
  hasMinLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
})

const passwordsMatch = (pwd: string, confirm: string) => pwd === confirm && pwd.length > 0

export function OnboardingFlow() {
  const navigate = useNavigate()
  const { org, updateOrg } = useOrg()
  const [step, setStep] = useState<'password' | 'security'>('password')
  
  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Security question state
  const [question, setQuestion] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  
  const [loading, setLoading] = useState(false)

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
      // Save the new security questions and remove the new user flag
      updateOrg({
        isNewUser: false,
        securityQuestions: [{ question: finalQuestion, answer }]
      })
      toast.success('Account secured successfully!')
      navigate('/')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row items-center justify-center p-6">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-primary-500 rounded-2xl shadow-sm">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary-500 mb-2 font-display">Secure Your Account</h1>
          <p className="text-neutral-300 text-sm">
            Please complete these quick steps to secure your new organization account.
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={clsx("h-1.5 w-12 rounded-full", step === 'password' ? 'bg-primary-500' : 'bg-primary-100')} />
            <div className={clsx("h-1.5 w-12 rounded-full", step === 'security' ? 'bg-primary-500' : 'bg-primary-100')} />
          </div>

          {step === 'password' ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Lock className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  For your security, please create a strong password.
                </p>
              </div>

              {/* Password Requirements Info */}
              <div className="bg-primary-75 p-4 rounded-2xl border border-primary-100 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-black">Password Requirements:</p>
                <div className="space-y-2 text-xs font-black">
                  {[
                    { label: 'At least 8 characters', check: getPasswordRequirements(newPassword).hasMinLength },
                    { label: 'Uppercase letter (A-Z)', check: getPasswordRequirements(newPassword).hasUppercase },
                    { label: 'Lowercase letter (a-z)', check: getPasswordRequirements(newPassword).hasLowercase },
                    { label: 'Number (0-9)', check: getPasswordRequirements(newPassword).hasNumber },
                    { label: 'Special character (!@#$%^&*...)', check: getPasswordRequirements(newPassword).hasSpecial },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {req.check ? (
                        <Check className="w-4 h-4 text-accent-400 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      )}
                      <span className={req.check ? 'text-black' : 'text-neutral-300'}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">New Password (8+ characters)</label>
                <input
                  type="password"
                  maxLength={20}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={clsx("w-full h-[60px] bg-white border rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:ring-4 transition-all",
                    newPassword.length > 0 && getPasswordRequirements(newPassword).hasMinLength
                      ? 'border-secondary-300 focus:border-secondary-300 focus:ring-secondary-300/10'
                      : 'border-neutral-100 focus:border-secondary-300 focus:ring-secondary-300/10'
                  )}
                  placeholder="Create a strong password"
                />
                <p className="text-xs text-neutral-300">{newPassword.length}/20 characters</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Confirm Password</label>
                <input
                  type="password"
                  maxLength={20}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={clsx("w-full h-[60px] bg-white border rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:ring-4 transition-all",
                    confirmPassword.length > 0 && passwordsMatch(newPassword, confirmPassword)
                      ? 'border-secondary-300 focus:border-secondary-300 focus:ring-secondary-300/10'
                      : confirmPassword.length > 0 && !passwordsMatch(newPassword, confirmPassword)
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-neutral-100 focus:border-secondary-300 focus:ring-secondary-300/10'
                  )}
                  placeholder="Re-enter password"
                />
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-black">
                    {passwordsMatch(newPassword, confirmPassword) ? (
                      <><Check className="w-4 h-4 text-accent-400" /> <span className="text-accent-400">Passwords match</span></>
                    ) : (
                      <><X className="w-4 h-4 text-red-500" /> <span className="text-red-500">Passwords do not match</span></>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handlePasswordSubmit}
                disabled={!newPassword || !confirmPassword || !passwordsMatch(newPassword, confirmPassword) || newPassword.length < 8}
                className="w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <HelpCircle className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Set a security question. This will be used to verify your identity.
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
                    <option value="In what city did you meet your spouse/significant other?">In what city did you meet your spouse/significant other?</option>
                    <option value="What is your favorite movie?">What is your favorite movie?</option>
                    <option value="What was your dream job as a child?">What was your dream job as a child?</option>
                    <option value="What is your oldest sibling's middle name?">What is your oldest sibling's middle name?</option>
                    <option value="custom">Other (Create your own question)</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
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
                className={clsx('w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all duration-150 flex items-center justify-center gap-2 mt-4', loading && 'opacity-70')}
              >
                {loading
                  ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Completing Setup…</>
                  : 'Complete Setup'
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

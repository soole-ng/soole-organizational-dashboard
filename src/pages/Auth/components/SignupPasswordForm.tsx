import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

interface SignupPasswordFormProps {
  suPassword: string
  setSuPassword: (val: string) => void
  suConfirmPassword: string
  setSuConfirmPassword: (val: string) => void
  showSuPw: boolean
  setShowSuPw: (val: boolean) => void
  showSuConfirmPw: boolean
  setShowSuConfirmPw: (val: boolean) => void
  errors: string[]
  setErrors: (val: string[]) => void
  loading: boolean
  handleSignupPassword: () => void
  setStep: (step: any) => void
  getBorderClass: (field: string) => string
}

const rules = [
  { label: 'Exactly 8 characters', test: (pw: string) => pw.length === 8 },
  { label: 'Uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'Number', test: (pw: string) => /\d/.test(pw) },
  { label: 'Special character (!@#$%^&*)', test: (pw: string) => /[!@#$%^&*]/.test(pw) },
]

export function SignupPasswordForm({
  suPassword,
  setSuPassword,
  suConfirmPassword,
  setSuConfirmPassword,
  showSuPw,
  setShowSuPw,
  showSuConfirmPw,
  setShowSuConfirmPw,
  errors,
  setErrors,
  loading,
  handleSignupPassword,
  setStep,
  getBorderClass,
}: SignupPasswordFormProps) {
  const allRulesPassed = rules.every(r => r.test(suPassword))

  return (
    <div className="space-y-5">
      {/* Password field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-neutral-400" />
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showSuPw ? 'text' : 'password'}
            value={suPassword}
            onChange={e => {
              setSuPassword(e.target.value)
              setErrors(errors.filter(err => err !== 'suPassword'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 pr-11 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('suPassword')
            )}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowSuPw(!showSuPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showSuPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password rule checklist */}
        {suPassword && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            {rules.map(rule => {
              const passed = rule.test(suPassword)
              return (
                <div key={rule.label} className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={clsx('w-3.5 h-3.5 flex-shrink-0', passed ? 'text-emerald-500' : 'text-neutral-300')}
                  />
                  <span className={clsx('text-[10px] font-semibold', passed ? 'text-emerald-700' : 'text-neutral-400')}>
                    {rule.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-neutral-500">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showSuConfirmPw ? 'text' : 'password'}
            value={suConfirmPassword}
            onChange={e => {
              setSuConfirmPassword(e.target.value)
              setErrors(errors.filter(err => err !== 'suConfirmPassword'))
            }}
            className={clsx(
              'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 pr-11 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
              getBorderClass('suConfirmPassword')
            )}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowSuConfirmPw(!showSuConfirmPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showSuConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {suConfirmPassword && suPassword !== suConfirmPassword && (
          <p className="text-xs text-red-500 font-semibold mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSignupPassword}
        disabled={
          loading ||
          !suPassword ||
          !suConfirmPassword ||
          suPassword !== suConfirmPassword ||
          !allRulesPassed
        }
        className={clsx(
          'w-full bg-primary-500 text-white font-bold rounded-xl px-6 h-[48px] text-sm active:scale-[0.98] hover:bg-[#07361d] transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Creating Account…
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="w-4.5 h-4.5" />
          </>
        )}
      </button>

      <button
        onClick={() => {
          setStep('signup_otp')
          setErrors([])
        }}
        className="w-full text-neutral-500 font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-all"
      >
        ← Back
      </button>

      {/* Footer */}
      <div className="text-center pt-4 mt-2 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400/80">
        <span>🔒</span>
        <span>Protected by Soole • 2FA enabled for all accounts</span>
      </div>
    </div>
  )
}

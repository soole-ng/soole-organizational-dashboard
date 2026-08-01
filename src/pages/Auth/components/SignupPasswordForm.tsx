import { Shield, Eye, EyeOff } from 'lucide-react'
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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
        <Shield className="w-5 h-5 text-black flex-shrink-0" />
        <p className="text-xs text-black leading-relaxed font-black">
          Create a strong password to secure your organization account.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-black">
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
              'w-full h-[44px] bg-white border rounded-xl px-4 pr-12 text-sm font-black focus:outline-none transition-all',
              getBorderClass('suPassword')
            )}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowSuPw(!showSuPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-neutral-700 transition-colors"
          >
            {showSuPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        {suPassword && (
          <div className="space-y-1.5 mt-3">
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  suPassword.length === 8 ? 'bg-green-500' : 'bg-neutral-200'
                )}
              >
                {suPassword.length === 8 && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={clsx('text-xs font-black', suPassword.length === 8 ? 'text-green-600' : 'text-neutral-400')}>
                Exactly 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  /[A-Z]/.test(suPassword) ? 'bg-green-500' : 'bg-neutral-200'
                )}
              >
                {/[A-Z]/.test(suPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={clsx('text-xs font-black', /[A-Z]/.test(suPassword) ? 'text-green-600' : 'text-neutral-400')}>
                Uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  /[a-z]/.test(suPassword) ? 'bg-green-500' : 'bg-neutral-200'
                )}
              >
                {/[a-z]/.test(suPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={clsx('text-xs font-black', /[a-z]/.test(suPassword) ? 'text-green-600' : 'text-neutral-400')}>
                Lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  /\d/.test(suPassword) ? 'bg-green-500' : 'bg-neutral-200'
                )}
              >
                {/\d/.test(suPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={clsx('text-xs font-black', /\d/.test(suPassword) ? 'text-green-600' : 'text-neutral-400')}>
                Number
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  /[!@#$%^&*]/.test(suPassword) ? 'bg-green-500' : 'bg-neutral-200'
                )}
              >
                {/[!@#$%^&*]/.test(suPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={clsx('text-xs font-black', /[!@#$%^&*]/.test(suPassword) ? 'text-green-600' : 'text-neutral-400')}>
                Special character (!@#$%^&*)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-black">
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
              'w-full h-[44px] bg-white border rounded-xl px-4 pr-12 text-sm font-black focus:outline-none transition-all',
              getBorderClass('suConfirmPassword')
            )}
            placeholder="Confirm password"
          />
          <button
            type="button"
            onClick={() => setShowSuConfirmPw(!showSuConfirmPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-neutral-700 transition-colors"
          >
            {showSuConfirmPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        {suConfirmPassword && suPassword !== suConfirmPassword && (
          <p className="text-xs text-red-500 font-black">Passwords do not match</p>
        )}
      </div>

      <button
        onClick={handleSignupPassword}
        disabled={
          loading ||
          !suPassword ||
          !suConfirmPassword ||
          suPassword !== suConfirmPassword ||
          suPassword.length < 8 ||
          !/[A-Z]/.test(suPassword) ||
          !/[a-z]/.test(suPassword) ||
          !/\d/.test(suPassword) ||
          !/[!@#$%^&*]/.test(suPassword)
        }
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Creating Account…
          </>
        ) : (
          'Create Account'
        )}
      </button>
      <button
        onClick={() => {
          setStep('signup_otp')
          setErrors([])
        }}
        className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm"
      >
        ← Back
      </button>
    </div>
  )
}

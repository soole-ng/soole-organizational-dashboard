import { Phone, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { COUNTRY_CODES, Step } from '../utils/auth'
import { OTPInput } from '../../../components/auth/OTPInput'

interface ForgotPasswordFlowProps {
  step: Step
  forgotPhone: string
  setForgotPhone: (val: string) => void
  otp: string
  setOtp: (val: string) => void
  newPassword: string
  setNewPassword: (val: string) => void
  confirmNewPassword: string
  setConfirmNewPassword: (val: string) => void
  showNewPw: boolean
  setShowNewPw: (val: boolean) => void
  showConfirmNewPw: boolean
  setShowConfirmNewPw: (val: boolean) => void
  errors: string[]
  setErrors: (val: string[]) => void
  loading: boolean
  resendLoading: boolean
  loginOtpResendsLeft: number
  loginOtpCooldown: number
  country: typeof COUNTRY_CODES[0]
  handleInitiateForgotPassword: () => Promise<void>
  handleVerifyForgotPasswordOtp: () => Promise<void>
  handleResetPassword: () => Promise<void>
  setStep: (step: any) => void
  getBorderClass: (field: string) => string
}

const passwordRules = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'Uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'Number', test: (pw: string) => /\d/.test(pw) },
  { label: 'Special character (!@#$%^&*)', test: (pw: string) => /[!@#$%^&*]/.test(pw) },
]

export function ForgotPasswordFlow({
  step,
  forgotPhone,
  setForgotPhone,
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  showNewPw,
  setShowNewPw,
  showConfirmNewPw,
  setShowConfirmNewPw,
  errors,
  setErrors,
  loading,
  resendLoading,
  loginOtpResendsLeft,
  loginOtpCooldown,
  country,
  handleInitiateForgotPassword,
  handleVerifyForgotPasswordOtp,
  handleResetPassword,
  setStep,
  getBorderClass,
}: ForgotPasswordFlowProps) {

  /* ─── Step 1: Enter Phone ─────────────────────────────────────── */
  if (step === 'forgot_password') {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <div
              className={clsx(
                'h-[48px] px-3.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold flex-shrink-0',
                getBorderClass('phone')
              )}
            >
              <img src={country.flag} alt={country.name} className="w-5 h-3.5 object-cover rounded-sm" />
              <span className="text-xs font-bold text-neutral-800">{country.code}</span>
            </div>
            <input
              type="tel"
              maxLength={10}
              value={forgotPhone}
              onChange={e => {
                setForgotPhone(e.target.value.replace(/\D/g, '').replace(/^0/, ''))
                setErrors(errors.filter(err => err !== 'phone'))
              }}
              className={clsx(
                'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 py-0 text-sm text-neutral-800 font-semibold placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
                getBorderClass('phone')
              )}
              placeholder="803 123 4567"
              autoComplete="tel"
              inputMode="tel"
              onKeyDown={e => e.key === 'Enter' && handleInitiateForgotPassword()}
            />
          </div>
        </div>

        <button
          onClick={handleInitiateForgotPassword}
          disabled={loading || !forgotPhone}
          className={clsx(
            'w-full bg-primary-500 text-white font-bold rounded-xl px-6 h-[48px] text-sm active:scale-[0.98] hover:bg-[#07361d] transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed',
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
              Send Reset Code
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          )}
        </button>

        <button
          onClick={() => { setStep('login'); setErrors([]) }}
          className="w-full text-neutral-500 font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-all"
        >
          ← Back to login
        </button>

        <div className="text-center pt-4 mt-2 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400/80">
          <span>🔒</span>
          <span>Protected by Soole • 2FA enabled for all accounts</span>
        </div>
      </div>
    )
  }

  /* ─── Step 2: Enter OTP ───────────────────────────────────────── */
  if (step === 'forgot_password_otp') {
    return (
      <div className="space-y-4">
        <OTPInput
          value={otp}
          onChange={setOtp}
          onSubmit={handleVerifyForgotPasswordOtp}
          onResend={handleInitiateForgotPassword}
          loading={loading}
          resendLoading={resendLoading}
          resendsLeft={loginOtpResendsLeft}
          secondsUntilNextResend={loginOtpCooldown}
          canResend={true}
          description="We've sent a 5-digit password reset code to your phone number. Please enter it below."
        />
        <button
          onClick={() => { setStep('forgot_password'); setOtp('') }}
          className="w-full text-neutral-500 font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-all"
        >
          ← Back
        </button>
      </div>
    )
  }

  /* ─── Step 3: Set New Password ────────────────────────────────── */
  if (step === 'forgot_password_reset') {
    const allRulesPassed = passwordRules.every(r => r.test(newPassword))

    return (
      <div className="space-y-5">
        {/* New password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPw ? 'text' : 'password'}
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value)
                setErrors(errors.filter(err => err !== 'password'))
              }}
              className={clsx(
                'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 pr-11 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
                getBorderClass('password')
              )}
              placeholder="Enter new password"
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {newPassword && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              {passwordRules.map(rule => {
                const passed = rule.test(newPassword)
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

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmNewPw ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={e => {
                setConfirmNewPassword(e.target.value)
                setErrors(errors.filter(err => err !== 'confirmPassword'))
              }}
              className={clsx(
                'w-full h-[48px] bg-white border border-neutral-200 rounded-xl px-4 pr-11 text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 focus:border-primary-500 focus:outline-none transition-all',
                getBorderClass('confirmPassword')
              )}
              placeholder="Confirm your password"
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPw(!showConfirmNewPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showConfirmNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-red-500 font-semibold mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          onClick={handleResetPassword}
          disabled={
            loading ||
            !newPassword ||
            !confirmNewPassword ||
            newPassword !== confirmNewPassword ||
            !allRulesPassed
          }
          className={clsx(
            'w-full bg-primary-500 text-white font-bold rounded-xl px-6 h-[48px] text-sm active:scale-[0.98] hover:bg-[#07361d] transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed',
            loading && 'opacity-70'
          )}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving Password…
            </>
          ) : (
            <>
              Reset Password
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          )}
        </button>

        <div className="text-center pt-4 mt-2 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400/80">
          <span>🔒</span>
          <span>Protected by Soole • 2FA enabled for all accounts</span>
        </div>
      </div>
    )
  }

  return null
}

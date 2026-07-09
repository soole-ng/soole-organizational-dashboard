import { Phone, Shield, Eye, EyeOff } from 'lucide-react'
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
  if (step === 'forgot_password') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-black" />
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <div
              className={clsx(
                'h-[52px] px-4 bg-white border rounded-xl flex items-center justify-center gap-2 text-base font-black flex-shrink-0 text-black',
                getBorderClass('phone')
              )}
            >
              <img src={country.flag} alt={country.name} className="w-6 h-4 object-cover rounded-sm" />
              <span className="text-sm font-black text-black">{country.code}</span>
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
                'w-full h-[52px] bg-white border rounded-xl px-5 py-0 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none transition-all',
                getBorderClass('phone')
              )}
              placeholder="8031234567"
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
            'w-full bg-primary-500 text-white font-black rounded-2xl px-6 h-[56px] text-lg active:scale-98 hover:bg-primary-400 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm mt-4',
            loading && 'opacity-70'
          )}
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Sending Code…
            </>
          ) : (
            'Send Reset Code'
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
          onClick={() => {
            setStep('forgot_password')
            setOtp('')
          }}
          className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm"
        >
          ← Back
        </button>
      </div>
    )
  }

  if (step === 'forgot_password_reset') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
          <Shield className="w-5 h-5 text-black flex-shrink-0" />
          <p className="text-xs text-black leading-relaxed font-black">
            Create a strong new password to secure your account.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
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
                'w-full h-[52px] bg-white border rounded-xl px-5 pr-12 text-base font-black focus:outline-none transition-all',
                getBorderClass('password')
              )}
              placeholder="Enter new password"
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-neutral-700 transition-colors"
            >
              {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {newPassword && (
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    newPassword.length >= 8 ? 'bg-green-500' : 'bg-neutral-200'
                  )}
                >
                  {newPassword.length >= 8 && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={clsx('text-xs font-black', newPassword.length >= 8 ? 'text-green-600' : 'text-neutral-400')}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    /[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-neutral-200'
                  )}
                >
                  {/[A-Z]/.test(newPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={clsx('text-xs font-black', /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-neutral-400')}>
                  Uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    /[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-neutral-200'
                  )}
                >
                  {/[a-z]/.test(newPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={clsx('text-xs font-black', /[a-z]/.test(newPassword) ? 'text-green-600' : 'text-neutral-400')}>
                  Lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    /\d/.test(newPassword) ? 'bg-green-500' : 'bg-neutral-200'
                  )}
                >
                  {/\d/.test(newPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={clsx('text-xs font-black', /\d/.test(newPassword) ? 'text-green-600' : 'text-neutral-400')}>
                  Number
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    /[!@#$%^&*]/.test(newPassword) ? 'bg-green-500' : 'bg-neutral-200'
                  )}
                >
                  {/[!@#$%^&*]/.test(newPassword) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span
                  className={clsx(
                    'text-xs font-black',
                    /[!@#$%^&*]/.test(newPassword) ? 'text-green-600' : 'text-neutral-400'
                  )}
                >
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
              type={showConfirmNewPw ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={e => {
                setConfirmNewPassword(e.target.value)
                setErrors(errors.filter(err => err !== 'confirmPassword'))
              }}
              className={clsx(
                'w-full h-[52px] bg-white border rounded-xl px-5 pr-12 text-base font-black focus:outline-none transition-all',
                getBorderClass('confirmPassword')
              )}
              placeholder="Confirm password"
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPw(!showConfirmNewPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-neutral-700 transition-colors"
            >
              {showConfirmNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-red-500 font-black">Passwords do not match</p>
          )}
        </div>

        <button
          onClick={handleResetPassword}
          disabled={
            loading ||
            !newPassword ||
            !confirmNewPassword ||
            newPassword !== confirmNewPassword ||
            newPassword.length < 8 ||
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/\d/.test(newPassword) ||
            !/[!@#$%^&*]/.test(newPassword)
          }
          className={clsx(
            'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
            loading && 'opacity-70'
          )}
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving Password…
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </div>
    )
  }

  return null
}

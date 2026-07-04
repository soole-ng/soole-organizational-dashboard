import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ChevronRight, Lock, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { authApi } from '../../api/client'

// The invite SMS's join link is https://dashboard.soole.ng/join?phone=X&otp=Y -
// the OTP was already sent then, there's no self-serve resend for this flow.
// If both arrive via the link we skip straight to setting a PIN; otherwise
// we ask for whatever's missing.
type Step = 'phone' | 'otp' | 'pin' | 'success'

const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone number must be valid')
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits')
})

const pinSchema = z.object({
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must be numeric'),
  confirmPin: z.string()
}).refine(data => data.pin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
})

export function JoinOrganizationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const prefillPhone = searchParams.get('phone') || ''
  const prefillOtp = searchParams.get('otp') || ''

  const [step, setStep] = useState<Step>(prefillPhone && prefillOtp ? 'pin' : prefillPhone ? 'otp' : 'phone')
  const [phone, setPhone] = useState(prefillPhone)
  const [otp, setOtp] = useState(prefillOtp)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneSubmit = () => {
    const result = phoneSchema.safeParse({ phone })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setStep('otp')
  }

  const handleOtpSubmit = () => {
    const result = otpSchema.safeParse({ otp })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setStep('pin')
  }

  const handlePinSubmit = async () => {
    const result = pinSchema.safeParse({ pin, confirmPin })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const res = await authApi.joinOrganization({ phone, otp, pin, confirmPin })
      localStorage.setItem('auth_token', res.data.token)
      localStorage.setItem('refresh_token', res.data.refreshToken)
      setStep('success')
      setTimeout(() => navigate('/'), 1500)
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not complete setup. Check your phone number and OTP.')
    } finally {
      setLoading(false)
    }
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
            {(['phone', 'otp', 'pin'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={clsx(
                  "h-1.5 w-12 rounded-full transition-all",
                  ['phone', 'otp', 'pin'].indexOf(step) >= i
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
                  Enter the phone number your invite was sent to.
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
                disabled={!phone.trim()}
                className="w-full bg-secondary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-secondary-600 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Lock className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Enter the 6-digit code from the invite SMS you already received.
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
                <p className="text-xs text-neutral-300">
                  Lost the code? Ask whoever invited you to resend it - there's no automatic resend here.
                </p>
              </div>

              <button
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6}
                className="w-full bg-secondary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-secondary-600 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-secondary-500 font-semibold hover:text-secondary-600 transition-colors"
              >
                ← Change phone number
              </button>
            </div>
          )}

          {step === 'pin' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
                <Lock className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-xs text-black leading-relaxed font-black">
                  Set a 6-digit PIN. You'll use it (with your phone number) to sign in from now on.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">6-Digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-[60px] bg-white border border-neutral-100 rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all tracking-[0.4em]"
                  placeholder="••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => handleKeyDown(e, handlePinSubmit)}
                  className={clsx(
                    "w-full h-[60px] bg-white border rounded-2xl px-5 text-base text-black font-black placeholder:text-neutral-200 focus:outline-none focus:ring-4 transition-all tracking-[0.4em]",
                    confirmPin.length > 0 && confirmPin === pin
                      ? 'border-secondary-300 focus:border-secondary-300 focus:ring-secondary-300/10'
                      : confirmPin.length > 0
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-neutral-100 focus:border-secondary-300 focus:ring-secondary-300/10'
                  )}
                  placeholder="••••••"
                />
              </div>

              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 6 || confirmPin !== pin || loading}
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
                <p className="text-sm text-neutral-300">Your account is ready. Redirecting...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

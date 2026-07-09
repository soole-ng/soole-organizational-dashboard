import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { Shield, Loader2 } from 'lucide-react'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onResend?: () => Promise<void>
  loading?: boolean
  resendLoading?: boolean
  resendsLeft?: number
  secondsUntilNextResend?: number
  canResend?: boolean
  description?: string
  showImmediateCountdown?: boolean
}

export function OTPInput({
  value,
  onChange,
  onSubmit,
  onResend,
  loading = false,
  resendLoading = false,
  resendsLeft = 2,
  secondsUntilNextResend = 0,
  canResend = true,
  description = "We've sent a 5-digit code via SMS to your phone. Please enter it below.",
  showImmediateCountdown = !!onResend,
}: OTPInputProps) {
  const [countdown, setCountdown] = useState(secondsUntilNextResend || (showImmediateCountdown ? 300 : 0))

  useEffect(() => {
    if (secondsUntilNextResend > 0) {
      setCountdown(secondsUntilNextResend)
    }
  }, [secondsUntilNextResend])

  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const handleResend = async () => {
    if (!onResend) return
    if (!canResend || countdown > 0 || resendsLeft <= 0) return

    try {
      await onResend()
      setCountdown(300) // 5 minutes = 300 seconds
    } catch (err: any) {
      const message = err?.message || 'Failed to resend OTP'
      if (message.includes('wait') || message.includes('Too many')) {
        // Extract countdown from error message (format: "5m 30s")
        const match = message.match(/(\d+)m (\d+)s/)
        if (match) {
          const mins = parseInt(match[1] || '0')
          const secs = parseInt(match[2] || '0')
          const totalSeconds = mins * 60 + secs
          setCountdown(totalSeconds)
        }
      }
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  const isResendBlocked = countdown > 0
  const isVerificationLocked = countdown > 300
  const canShowResend = onResend && !loading
  const resendDisabled = isResendBlocked || resendsLeft <= 0 || resendLoading

  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="flex items-center gap-3 p-3 sm:p-4 bg-primary-75 rounded-2xl border border-primary-100">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0" />
        <p className="text-sm sm:text-base text-black leading-relaxed font-black">{description}</p>
      </div>

      {/* OTP Input */}
      <div className="space-y-2">
        <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-black">
          5-digit code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-black text-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
          placeholder="00000"
          onKeyDown={(e) => e.key === 'Enter' && value.length === 5 && !loading && onSubmit()}
          autoFocus
        />
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={clsx('w-2 h-2 rounded-full transition-colors', i < value.length ? 'bg-primary-500' : 'bg-neutral-100')}
            />
          ))}
        </div>
      </div>

      {/* Rate Limit Message */}
      {isVerificationLocked && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-xs text-red-700 font-black">
            ⚠️ Too many attempts. Try again in {formatTime(countdown)}
          </p>
        </div>
      )}

      {/* Attempts Left */}
      {resendsLeft !== undefined && resendsLeft > 0 && (
        <p className="text-sm sm:text-base text-neutral-400 text-center font-black">
          {resendsLeft} resend{resendsLeft === 1 ? '' : 's'} remaining
        </p>
      )}

      {/* Verify Button */}
      <button
        onClick={onSubmit}
        disabled={value.length !== 5 || loading || isVerificationLocked}
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-3 sm:py-4 text-sm sm:text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2 min-h-12 sm:min-h-14',
          (loading || isVerificationLocked) && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Verifying…
          </>
        ) : isVerificationLocked ? (
          `Verify (blocked ${formatTime(countdown)})`
        ) : (
          'Verify & Continue'
        )}
      </button>

      {/* Resend Button */}
      {canShowResend && (
        <button
          onClick={handleResend}
          disabled={resendDisabled}
          className={clsx(
            'w-full text-black font-black rounded-2xl px-4 py-2 sm:py-3 transition-all text-xs sm:text-sm min-h-10 sm:min-h-12',
            resendDisabled ? 'opacity-50 cursor-not-allowed bg-neutral-100' : 'hover:bg-primary-75 bg-primary-75'
          )}
        >
          {resendLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block mr-2" />
              Resending…
            </>
          ) : isResendBlocked ? (
            countdown > 300 ? (
              `❌ Locked. Try again in ${formatTime(countdown)}`
            ) : (
              `Resend available in ${formatTime(countdown)}`
            )
          ) : resendsLeft <= 0 ? (
            '❌ No more resends (4-hour lockout)'
          ) : (
            `Resend Code (${resendsLeft}/3)`
          )}
        </button>
      )}
    </div>
  )
}

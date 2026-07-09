import { HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface SecurityVerificationProps {
  securityQuestion: string
  secAnswer: string
  setSecAnswer: (val: string) => void
  loading: boolean
  handleSecurityQuestion: () => void
  setStep: (step: any) => void
}

export function SecurityVerification({
  securityQuestion,
  secAnswer,
  setSecAnswer,
  loading,
  handleSecurityQuestion,
  setStep,
}: SecurityVerificationProps) {
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
        <HelpCircle className="w-5 h-5 text-black flex-shrink-0" />
        <p className="text-xs text-black leading-relaxed font-black">
          Please answer your backup security question to complete signing in.
        </p>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-black text-black">
          Question:{' '}
          <span className="font-extrabold text-primary-500">
            {securityQuestion || 'Backup Security Question'}
          </span>
        </label>
        <input
          type="password"
          value={secAnswer}
          onChange={e => setSecAnswer(e.target.value)}
          className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-base font-black text-black placeholder:text-neutral-200 focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
          placeholder="Enter your secret answer"
          onKeyDown={e => e.key === 'Enter' && handleSecurityQuestion()}
          autoFocus
        />
      </div>
      <button
        onClick={handleSecurityQuestion}
        disabled={!secAnswer || loading}
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2',
          loading && 'opacity-70'
        )}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Verifying…
          </>
        ) : (
          'Verify Answer'
        )}
      </button>
      <button
        onClick={() => {
          setStep('login')
          setSecAnswer('')
        }}
        className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm"
      >
        ← Back to login
      </button>
    </div>
  )
}

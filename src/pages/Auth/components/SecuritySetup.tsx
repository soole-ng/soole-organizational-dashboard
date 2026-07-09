import { Shield, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { PRESET_SECURITY_QUESTIONS, CUSTOM_SECURITY_QUESTION_OPTION } from '../../../lib/securityQuestions'

interface SecuritySetupProps {
  suSecQuestionChoice: string
  setSuSecQuestionChoice: (val: string) => void
  suSecCustomQuestion: string
  setSuSecCustomQuestion: (val: string) => void
  suSecAnswer: string
  setSuSecAnswer: (val: string) => void
  savingSecurityQuestion: boolean
  handleSaveSecurityQuestion: () => void
  onSkip: () => void
}

export function SecuritySetup({
  suSecQuestionChoice,
  setSuSecQuestionChoice,
  suSecCustomQuestion,
  setSuSecCustomQuestion,
  suSecAnswer,
  setSuSecAnswer,
  savingSecurityQuestion,
  handleSaveSecurityQuestion,
  onSkip,
}: SecuritySetupProps) {
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3 p-4 bg-primary-75 rounded-2xl border border-primary-100">
        <Shield className="w-5 h-5 text-black flex-shrink-0" />
        <p className="text-xs text-black leading-relaxed font-black">
          Choose a security question or write your own. You'll need to answer it before withdrawing funds, or if you ever forget your PIN.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-black">Question</label>
        <div className="relative">
          <select
            value={suSecQuestionChoice}
            onChange={e => setSuSecQuestionChoice(e.target.value)}
            className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-sm font-bold text-black appearance-none focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
          >
            {PRESET_SECURITY_QUESTIONS.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
            <option value={CUSTOM_SECURITY_QUESTION_OPTION}>{CUSTOM_SECURITY_QUESTION_OPTION}</option>
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
        </div>
      </div>

      {suSecQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && (
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">Your Question</label>
          <input
            type="text"
            value={suSecCustomQuestion}
            onChange={e => setSuSecCustomQuestion(e.target.value)}
            className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-sm font-bold text-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
            placeholder="Write your own security question"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-black">Answer</label>
        <input
          type="text"
          value={suSecAnswer}
          onChange={e => setSuSecAnswer(e.target.value)}
          className="w-full bg-white border border-neutral-100 rounded-2xl px-5 py-4 text-sm font-bold text-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
          placeholder="Your answer"
          onKeyDown={e => e.key === 'Enter' && handleSaveSecurityQuestion()}
        />
      </div>

      <button
        onClick={handleSaveSecurityQuestion}
        disabled={savingSecurityQuestion || !suSecAnswer.trim() || (suSecQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION && !suSecCustomQuestion.trim())}
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
          savingSecurityQuestion && 'opacity-70'
        )}
      >
        {savingSecurityQuestion ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save & Continue'}
      </button>
      <button onClick={onSkip} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
        Set up later in Settings
      </button>
    </div>
  )
}

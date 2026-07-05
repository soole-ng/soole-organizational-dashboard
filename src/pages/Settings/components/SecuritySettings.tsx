import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react'
import { useOrg } from '../../../lib/OrgContext'
import { authApi } from '../../../api/client'
import { PRESET_SECURITY_QUESTIONS, CUSTOM_SECURITY_QUESTION_OPTION } from '../../../lib/securityQuestions'
import toast from 'react-hot-toast'

export function SecuritySettings() {
  const { guardAction } = useOrg()
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)

  // Editing is gated behind a step-up check when a question is already set:
  // the account PIN (via guardAction, same as every other Settings change)
  // AND the CURRENT security answer - so hijacking just the PIN isn't enough
  // to silently swap out the recovery question underneath the real owner.
  const [showReverify, setShowReverify] = useState(false)
  const [reverifyAnswer, setReverifyAnswer] = useState('')
  const [reverifying, setReverifying] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  const [questionChoice, setQuestionChoice] = useState(PRESET_SECURITY_QUESTIONS[0])
  const [customQuestion, setCustomQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authApi.getSecurityQuestionStatus()
      .then((res: any) => {
        setConfigured(!!res.data?.configured)
        setCurrentQuestion(res.data?.question ?? null)
        setCanEdit(!res.data?.configured)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const startEdit = () => {
    guardAction(undefined, () => {
      setReverifyAnswer('')
      setShowReverify(true)
    })
  }

  const handleReverify = async () => {
    if (!reverifyAnswer.trim()) {
      toast.error('Answer your current security question to continue')
      return
    }
    setReverifying(true)
    try {
      await authApi.verifySecurityAnswerSelf(reverifyAnswer.trim())
      setCanEdit(true)
      setShowReverify(false)
      setReverifyAnswer('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Incorrect answer')
    } finally {
      setReverifying(false)
    }
  }

  const handleSave = () => {
    const question = questionChoice === CUSTOM_SECURITY_QUESTION_OPTION ? customQuestion.trim() : questionChoice
    if (!question || !answer.trim()) {
      toast.error('Enter both a question and an answer')
      return
    }
    guardAction(undefined, async () => {
      setSaving(true)
      try {
        await authApi.setSecurityQuestion(question, answer.trim())
        setConfigured(true)
        setCurrentQuestion(question)
        setCanEdit(false)
        setAnswer('')
        setCustomQuestion('')
        setQuestionChoice(PRESET_SECURITY_QUESTIONS[0])
        toast.success('Security question saved')
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to save security question')
      } finally {
        setSaving(false)
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100 animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-40" />
        <div className="h-16 bg-neutral-50 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
      <div>
        <h4 className="text-xs font-bold text-black uppercase tracking-wider">Security Question</h4>
        <p className="text-xs text-neutral-200 leading-relaxed mt-0.5">
          A second check, in addition to your PIN, required before withdrawing funds from your wallet.
        </p>
      </div>

      {configured && currentQuestion && (
        <div className="flex items-center justify-between gap-2 rounded-xl p-4 border border-primary-500 bg-primary-75/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-primary-500 uppercase">Current Question</p>
              <p className="text-sm font-semibold text-black mt-0.5">{currentQuestion}</p>
            </div>
          </div>
          {!canEdit && (
            <button
              onClick={startEdit}
              className="text-[10px] text-neutral-200 hover:text-primary-500 font-bold border border-neutral-100 rounded-lg px-2 py-1 hover:bg-neutral-50 flex-shrink-0"
            >
              Change
            </button>
          )}
        </div>
      )}

      {canEdit && (
        <div className="space-y-3 rounded-xl p-4 border border-neutral-100">
          <p className="text-[10px] font-bold text-primary-400 uppercase">
            {configured ? 'Set New Security Question' : 'Set Up Security Question'}
          </p>

          <div>
            <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Question</label>
            <div className="relative">
              <select
                value={questionChoice}
                onChange={e => setQuestionChoice(e.target.value)}
                className="input-field bg-white border border-neutral-200 appearance-none pr-10"
              >
                {PRESET_SECURITY_QUESTIONS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
                <option value={CUSTOM_SECURITY_QUESTION_OPTION}>{CUSTOM_SECURITY_QUESTION_OPTION}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
            </div>
          </div>

          {questionChoice === CUSTOM_SECURITY_QUESTION_OPTION && (
            <div>
              <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Your Question</label>
              <input
                type="text"
                value={customQuestion}
                onChange={e => setCustomQuestion(e.target.value)}
                className="input-field bg-white border border-neutral-200"
                placeholder="Write your own security question"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Answer</label>
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="input-field bg-white border border-neutral-200"
              placeholder="Your answer"
            />
          </div>

          <div className="flex items-start gap-2 text-[10px] text-neutral-200 bg-neutral-50 rounded-lg p-2">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Answers aren't case-sensitive and extra spaces are ignored. Choose something only you would know.</span>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving || (questionChoice === CUSTOM_SECURITY_QUESTION_OPTION && !customQuestion.trim()) || !answer.trim()}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : configured ? 'Update Security Question' : 'Save Security Question'}
            </button>
          </div>
        </div>
      )}

      {/* ── Re-verify current answer before allowing a change ── */}
      {showReverify && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setShowReverify(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-float flex flex-col p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary-500">Confirm it's you</h3>
                <p className="text-[10px] text-neutral-200 mt-0.5">Answer your current security question to change it</p>
              </div>
              <button
                onClick={() => setShowReverify(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">{currentQuestion}</label>
              <input
                type="text"
                autoFocus
                value={reverifyAnswer}
                onChange={e => setReverifyAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReverify()}
                className="input-field bg-white border border-neutral-200"
                placeholder="Your answer"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowReverify(false)}
                className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReverify}
                disabled={reverifying || !reverifyAnswer.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-xs font-semibold rounded-xl text-white transition-colors"
              >
                {reverifying ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

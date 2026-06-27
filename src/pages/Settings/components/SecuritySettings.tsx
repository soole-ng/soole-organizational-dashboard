import { useState } from 'react'
import { useOrg, type SecurityQuestion } from '../../../lib/OrgContext'
import toast from 'react-hot-toast'

export function SecuritySettings({ executeSecuredAction }: { executeSecuredAction: (action: () => void) => void }) {
  const { org, updateOrg } = useOrg()

  // Initialize with existing values or empty defaults
  const [questions, setQuestions] = useState<SecurityQuestion[]>(() => {
    const list = org.securityQuestions || []
    return [
      { question: list[0]?.question || '', answer: list[0]?.answer || '' },
      { question: list[1]?.question || '', answer: list[1]?.answer || '' },
      { question: list[2]?.question || '', answer: list[2]?.answer || '' },
    ]
  })

  const handleChange = (index: number, key: keyof SecurityQuestion, value: string) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [key]: value }
      return copy
    })
  }

  return (
    <div className="space-y-6 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
      <div className="space-y-4">
        <h4 className="text-sm font-black text-black">2FA Secret Security Questions</h4>
        <p className="text-xs text-black leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-100">
          Configure three backup security questions. To authorize sensitive changes, one of these questions will be selected at random (rotated) for verification.
        </p>
        
        <div className="space-y-5 divide-y divide-neutral-100">
          {[0, 1, 2].map(idx => (
            <div key={idx} className={idx > 0 ? 'pt-4 space-y-3' : 'space-y-3'}>
              <h5 className="text-xs font-bold text-primary-500 uppercase tracking-wider">Question #{idx + 1}</h5>
              <div>
                <label className="block text-[10px] font-bold text-black mb-1 uppercase tracking-wider">Secret Question</label>
                <input
                  type="text"
                  className="input-field bg-white text-black font-medium border border-neutral-200 focus:border-primary-500"
                  placeholder={`e.g. Question ${idx + 1}`}
                  value={questions[idx].question}
                  onChange={e => handleChange(idx, 'question', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-black mb-1 uppercase tracking-wider">Secret Answer</label>
                <input
                  type="password"
                  className="input-field bg-white text-black font-medium border border-neutral-200 focus:border-primary-500"
                  placeholder="Enter secret answer"
                  value={questions[idx].answer}
                  onChange={e => handleChange(idx, 'answer', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-100">
          <button
            onClick={() => {
              const invalid = questions.some(q => !q.question.trim() || !q.answer.trim())
              if (invalid) {
                toast.error('Please configure all three secret questions and answers')
                return
              }
              executeSecuredAction(() => {
                updateOrg({ securityQuestions: questions })
                toast.success('Three rotated security questions saved securely!')
              })
            }}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
          >
            Save Security Questions
          </button>
        </div>
      </div>
    </div>
  )
}

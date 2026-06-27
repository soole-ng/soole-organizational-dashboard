import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useOrg, type BankAccount } from '../../../lib/OrgContext'
import toast from 'react-hot-toast'

export function PayoutSettings() {
  const { org, updateOrg } = useOrg()
  const bankAccounts = org.bankAccounts || []

  const [showAddModal, setShowAddModal] = useState(false)
  const [modalStep, setModalStep] = useState(1) // 1: Bank info, 2: 2FA OTP, 3: Secret Question
  const [tempDetails, setTempDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  })
  const [otpCode, setOtpCode] = useState('')
  const [secretAnswer, setSecretAnswer] = useState('')
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)

  // Security action states for Deleting
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1) // 1: 2FA OTP, 2: Secret Question
  const [deleteOtp, setDeleteOtp] = useState('')
  const [deleteSecretAnswer, setDeleteSecretAnswer] = useState('')

  const activeQuestions = org.securityQuestions || [
    { question: 'What is your favourite food?', answer: 'Ojota' }
  ]
  const activeSecQuestion = activeQuestions[activeQuestionIdx]?.question || 'What is your favourite food?'
  const activeSecAnswer = activeQuestions[activeQuestionIdx]?.answer || 'Ojota'

  const handleCloseAdd = () => {
    setShowAddModal(false)
    setModalStep(1)
    setOtpCode('')
    setSecretAnswer('')
    setTempDetails({ bankName: '', accountNumber: '', accountName: '' })
  }

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false)
    setPendingDeleteId(null)
    setDeleteStep(1)
    setDeleteOtp('')
    setDeleteSecretAnswer('')
  }

  const handleSetPrimary = (id: string) => {
    const updated = bankAccounts.map(acc => ({
      ...acc,
      isPrimary: acc.id === id
    }))
    updateOrg({ bankAccounts: updated })
    toast.success('Primary withdrawal account updated!')
  }

  return (
    <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-black uppercase tracking-wider">Settlement Accounts</h4>
          <p className="text-xs text-neutral-200 leading-relaxed mt-0.5">
            Manage up to 3 bank accounts. Trip payouts will be deposited to your primary account.
          </p>
        </div>
        {bankAccounts.length < 3 && (
          <button
            onClick={() => {
              setModalStep(1)
              const list = org.securityQuestions || []
              if (list.length > 0) {
                setActiveQuestionIdx(Math.floor(Math.random() * list.length))
              }
              setShowAddModal(true)
            }}
            className="px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-xs font-bold rounded-xl text-white transition-colors flex items-center gap-1"
          >
            + Add Bank
          </button>
        )}
      </div>

      <div className="space-y-3">
        {bankAccounts.map((acc: BankAccount) => (
          <div
            key={acc.id}
            className={`rounded-xl p-4 border transition-all ${
              acc.isPrimary
                ? 'bg-white border-primary-500 shadow-sm'
                : 'bg-white border-neutral-100'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-primary-500">{acc.bankName}</p>
                <p className="text-sm font-semibold text-black mt-1">{acc.accountName}</p>
                <p className="text-xs font-mono font-bold text-neutral-200 mt-0.5">{acc.accountNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                {acc.isPrimary ? (
                  <span className="flex items-center gap-1 text-[10px] text-primary-500 font-bold bg-primary-75 px-2 py-0.5 rounded-lg border border-primary-100">
                    <CheckCircle2 className="w-3 h-3" /> PRIMARY
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPrimary(acc.id)}
                    className="text-[10px] text-neutral-200 hover:text-primary-500 font-bold border border-neutral-100 rounded-lg px-2 py-0.5 hover:bg-neutral-50"
                  >
                    Set Primary
                  </button>
                )}
                {bankAccounts.length > 1 && (
                  <button
                    onClick={() => {
                      setPendingDeleteId(acc.id)
                      const list = org.securityQuestions || []
                      if (list.length > 0) {
                        setActiveQuestionIdx(Math.floor(Math.random() * list.length))
                      }
                      setDeleteStep(1)
                      setShowDeleteConfirm(true)
                    }}
                    className="text-neutral-100 hover:text-danger-300 transition-colors p-1"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD BANK MODAL (White Background - Rendered in Body via Portal) */}
      {showAddModal && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={handleCloseAdd}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-float flex flex-col p-6 space-y-4 border border-neutral-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary-500">Add Bank Account</h3>
                <p className="text-[10px] text-neutral-200">Step {modalStep} of 3</p>
              </div>
              <button
                onClick={handleCloseAdd}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            {modalStep === 1 && (() => {
              const [isValidating, setIsValidating] = useState(false)
              const [resolvedName, setResolvedName] = useState(tempDetails.accountName)

              const triggerVerification = (bank: string, accNum: string) => {
                if (accNum.length === 10 && bank) {
                  setIsValidating(true)
                  setTimeout(() => {
                    setIsValidating(false)
                    const resolved = `Speedway Transport Ltd (${bank.split(' ')[0]})`
                    setResolvedName(resolved)
                    setTempDetails(p => ({ ...p, accountName: resolved }))
                    toast.success('Account verified successfully!')
                  }, 1000)
                }
              }

              return (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Account Number</label>
                    <input
                      type="text"
                      value={tempDetails.accountNumber}
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setTempDetails(p => ({ ...p, accountNumber: num }))
                        if (num.length === 10 && tempDetails.bankName) {
                          triggerVerification(tempDetails.bankName, num)
                        }
                      }}
                      className="input-field bg-white font-mono border border-neutral-200"
                      placeholder="Enter account number"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Select Bank</label>
                    <div className="relative">
                      <select
                        value={tempDetails.bankName}
                        onChange={e => {
                          const bank = e.target.value
                          setTempDetails(p => ({ ...p, bankName: bank }))
                          if (tempDetails.accountNumber.length === 10) {
                            triggerVerification(bank, tempDetails.accountNumber)
                          }
                        }}
                        className="input-field bg-white border border-neutral-200 appearance-none pr-10"
                      >
                        <option value="">Choose Bank</option>
                        <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                        <option value="Access Bank">Access Bank</option>
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                        <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                    </div>
                  </div>

                  {isValidating && (
                    <div className="flex items-center gap-2 justify-center py-2 text-xs text-primary-400 bg-white">
                      <span className="w-4 h-4 border-2 border-primary-400/40 border-t-primary-400 rounded-full animate-spin" />
                      Resolving account details...
                    </div>
                  )}

                  {resolvedName && !isValidating && (
                    <div>
                      <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Account Name</label>
                      <input
                        type="text"
                        value={resolvedName}
                        disabled
                        className="input-field bg-white border border-neutral-100 cursor-not-allowed font-semibold text-neutral-300"
                        placeholder="Resolved Account Name"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-2 bg-white">
                    <button
                      onClick={handleCloseAdd}
                      className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-semibold rounded-xl text-black transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (tempDetails.accountNumber.length < 10) {
                          toast.error('Account number must be 10 digits')
                          return
                        }
                        if (!tempDetails.bankName) {
                          toast.error('Please select a bank')
                          return
                        }
                        if (!resolvedName) {
                          toast.error('Unable to verify account details')
                          return
                        }
                        setModalStep(2)
                      }}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                    >
                      Next: 2FA Verification
                    </button>
                  </div>
                </div>
              )
            })()}

            {modalStep === 2 && (
              <div className="space-y-4 bg-white">
                <div className="bg-white p-3.5 rounded-2xl border border-primary-100">
                  <p className="text-xs text-primary-500 leading-relaxed">
                    We sent a 2FA OTP code to your registered mobile number for security purposes. Enter the code below to proceed.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">2FA OTP Code</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field bg-white border border-neutral-200 text-center font-mono tracking-widest text-lg"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 bg-white">
                  <button
                    onClick={() => setModalStep(1)}
                    className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-semibold rounded-xl text-black transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (otpCode.length < 6) {
                        toast.error('Please enter the 6-digit OTP code')
                        return
                      }
                      setModalStep(3)
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                  >
                    Next: Security Question
                  </button>
                </div>
              </div>
            )}

            {modalStep === 3 && (
              <div className="space-y-4 bg-white">
                <div className="bg-white p-3.5 rounded-2xl border border-primary-100">
                  <p className="text-xs text-primary-500 leading-relaxed font-bold">
                    Security Question Verification
                  </p>
                  <p className="text-xs text-primary-400 leading-relaxed mt-1">
                    {activeSecQuestion}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Your Secret Answer</label>
                  <input
                    type="password"
                    value={secretAnswer}
                    onChange={e => setSecretAnswer(e.target.value)}
                    className="input-field bg-white border border-neutral-200"
                    placeholder="Enter secret answer"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 bg-white">
                  <button
                    onClick={() => setModalStep(2)}
                    className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-semibold rounded-xl text-black transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!secretAnswer.trim()) {
                        toast.error('Please enter your secret answer')
                        return
                      }
                      if (secretAnswer.trim().toLowerCase() !== activeSecAnswer.toLowerCase()) {
                        toast.error('Incorrect secret answer. Please try again.')
                        return
                      }
                      
                      // Save bank account
                      const newBank: BankAccount = {
                        id: `bank-${Date.now()}`,
                        bankName: tempDetails.bankName,
                        accountName: tempDetails.accountName,
                        accountNumber: tempDetails.accountNumber,
                        isPrimary: bankAccounts.length === 0 // Make first primary
                      }

                      updateOrg({ bankAccounts: [...bankAccounts, newBank] })
                      handleCloseAdd()
                      toast.success('New bank account added successfully!')
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                  >
                    Save & Add Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL (White Background - Rendered in Body via Portal) */}
      {showDeleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={handleCloseDelete}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-float flex flex-col p-6 space-y-4 border border-neutral-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 bg-white">
              <div>
                <h3 className="text-sm font-bold text-danger-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Delete Bank Account
                </h3>
                <p className="text-[10px] text-neutral-200">Security verification required</p>
              </div>
              <button
                onClick={handleCloseDelete}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            {deleteStep === 1 && (
              <div className="space-y-4 bg-white">
                <div className="bg-white p-3.5 rounded-2xl border border-primary-100">
                  <p className="text-xs text-primary-500 leading-relaxed">
                    Confirm deletion of bank account. A 2FA OTP code was sent to your phone. Enter it below to proceed.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">2FA OTP Code</label>
                  <input
                    type="text"
                    value={deleteOtp}
                    onChange={e => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field bg-white border border-neutral-200 text-center font-mono tracking-widest text-lg"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 bg-white">
                  <button
                    onClick={handleCloseDelete}
                    className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-semibold rounded-xl text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteOtp.length < 6) {
                        toast.error('Please enter the 6-digit OTP code')
                        return
                      }
                      setDeleteStep(2)
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                  >
                    Next: Security Question
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div className="space-y-4 bg-white">
                <div className="bg-white p-3.5 rounded-2xl border border-primary-100">
                  <p className="text-xs text-primary-500 leading-relaxed font-bold">
                    Security Question Verification
                  </p>
                  <p className="text-xs text-primary-400 leading-relaxed mt-1">
                    {activeSecQuestion}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Your Secret Answer</label>
                  <input
                    type="password"
                    value={deleteSecretAnswer}
                    onChange={e => setDeleteSecretAnswer(e.target.value)}
                    className="input-field bg-white border border-neutral-200"
                    placeholder="Enter secret answer"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 bg-white">
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-semibold rounded-xl text-black transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!deleteSecretAnswer.trim()) {
                        toast.error('Please enter your secret answer')
                        return
                      }
                      if (deleteSecretAnswer.trim().toLowerCase() !== activeSecAnswer.toLowerCase()) {
                        toast.error('Incorrect secret answer. Please try again.')
                        return
                      }

                      // Perform deletion
                      if (pendingDeleteId) {
                        const targetAccount = bankAccounts.find(a => a.id === pendingDeleteId)
                        const filtered = bankAccounts.filter(a => a.id !== pendingDeleteId)
                        
                        // If we deleted the primary account, set first remaining as primary
                        if (targetAccount?.isPrimary && filtered.length > 0) {
                          filtered[0].isPrimary = true
                        }

                        updateOrg({ bankAccounts: filtered })
                        toast.success('Bank account deleted securely!')
                      }
                      handleCloseDelete()
                    }}
                    className="px-4 py-2 bg-danger-300 hover:bg-danger-400 text-xs font-semibold rounded-xl text-white transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

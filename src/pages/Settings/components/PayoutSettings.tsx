import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useOrg } from '../../../lib/OrgContext'
import { settingsApi, paymentsApi } from '../../../api/client'
import toast from 'react-hot-toast'

interface BankAccountRow {
  uuid: string
  bank_name: string
  account_number: string
  account_name: string
  is_primary: boolean
}

export function PayoutSettings() {
  const { guardAction, orgUuid } = useOrg()
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([])
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([])
  const [loading, setLoading] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [tempDetails, setTempDetails] = useState({ bankName: '', bankCode: '', accountNumber: '', accountName: '' })
  const [isValidating, setIsValidating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!orgUuid) return
    let cancelled = false
    Promise.all([
      settingsApi.getBankAccounts(orgUuid).catch(() => []),
      paymentsApi.getBanks().catch(() => ({ data: [] })),
    ]).then(([accountsRes, banksRes]: [any, any]) => {
      if (cancelled) return
      setBankAccounts(accountsRes || [])
      setBanks(banksRes.data || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [orgUuid])

  const triggerVerification = async (bankCode: string, accNum: string) => {
    setIsValidating(true)
    try {
      const res: any = await paymentsApi.verifyAccountNumber(accNum, bankCode)
      const name = res?.data?.account_name
      if (name) {
        setTempDetails(p => ({ ...p, accountName: name }))
        toast.success('Account verified successfully!')
      } else {
        toast.error('Could not resolve account name')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Account verification failed')
    } finally {
      setIsValidating(false)
    }
  }

  const handleCloseAdd = () => {
    setShowAddModal(false)
    setTempDetails({ bankName: '', bankCode: '', accountNumber: '', accountName: '' })
    setIsValidating(false)
  }

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false)
    setPendingDeleteId(null)
  }

  const handleSetPrimary = async (uuid: string) => {
    if (!orgUuid) return
    try {
      await settingsApi.setPrimaryBankAccount(orgUuid, uuid)
      setBankAccounts(prev => prev.map(acc => ({ ...acc, is_primary: acc.uuid === uuid })))
      toast.success('Primary withdrawal account updated!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update primary account')
    }
  }

  const handleSaveAccount = async () => {
    if (!orgUuid) return
    if (tempDetails.accountNumber.length < 10) {
      toast.error('Account number must be 10 digits')
      return
    }
    if (!tempDetails.bankName) {
      toast.error('Please select a bank')
      return
    }
    if (!tempDetails.accountName) {
      toast.error('Verify the account before saving')
      return
    }

    setSaving(true)
    try {
      const res: any = await settingsApi.addBankAccount(orgUuid, {
        bank_name: tempDetails.bankName,
        account_number: tempDetails.accountNumber,
        account_name: tempDetails.accountName,
      })
      setBankAccounts(prev => [...prev, {
        uuid: res.uuid,
        bank_name: res.bank_name,
        account_number: res.account_number,
        account_name: res.account_name,
        is_primary: res.is_primary ?? prev.length === 0,
      }])
      handleCloseAdd()
      toast.success('New bank account added successfully!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add bank account')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDeleteId || !orgUuid) return
    try {
      await settingsApi.deleteBankAccount(orgUuid, pendingDeleteId)
      setBankAccounts(prev => prev.filter(a => a.uuid !== pendingDeleteId))
      toast.success('Bank account removed')
      handleCloseDelete()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to remove bank account. Make it non-primary first if it is your primary account.')
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-black uppercase tracking-wider">Settlement Accounts</h4>
          <p className="text-xs text-neutral-200 leading-relaxed mt-0.5">
            Manage up to 3 bank accounts. Trip payouts will be deposited to your primary account.
          </p>
        </div>
        {bankAccounts.length < 3 && (
          <button
            onClick={() => guardAction(undefined, () => setShowAddModal(true))}
            className="px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-xs font-bold rounded-xl text-white transition-colors flex items-center gap-1"
          >
            + Add Bank
          </button>
        )}
      </div>

      <div className="space-y-3">
        {bankAccounts.length === 0 ? (
          <p className="text-xs text-neutral-200 py-4 text-center">No bank accounts on file yet.</p>
        ) : bankAccounts.map((acc) => (
          <div
            key={acc.uuid}
            className={`rounded-xl p-4 border transition-all ${
              acc.is_primary
                ? 'bg-white border-primary-500 shadow-sm'
                : 'bg-white border-neutral-100'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-primary-500">{acc.bank_name}</p>
                <p className="text-sm font-semibold text-black mt-1">{acc.account_name}</p>
                <p className="text-xs font-mono font-bold text-neutral-200 mt-0.5">{acc.account_number}</p>
              </div>
              <div className="flex items-center gap-3">
                {acc.is_primary ? (
                  <span className="flex items-center gap-1 text-[10px] text-primary-500 font-bold bg-primary-75 px-2 py-0.5 rounded-lg border border-primary-100">
                    <CheckCircle2 className="w-3 h-3" /> PRIMARY
                  </span>
                ) : (
                  <button
                    onClick={() => guardAction(undefined, () => handleSetPrimary(acc.uuid))}
                    className="text-[10px] text-neutral-200 hover:text-primary-500 font-bold border border-neutral-100 rounded-lg px-2 py-0.5 hover:bg-neutral-50"
                  >
                    Set Primary
                  </button>
                )}
                {bankAccounts.length > 1 && (
                  <button
                    onClick={() => guardAction(undefined, () => {
                      setPendingDeleteId(acc.uuid)
                      setShowDeleteConfirm(true)
                    })}
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

      {/* ADD BANK MODAL */}
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
              </div>
              <button
                onClick={handleCloseAdd}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Select Bank</label>
                <div className="relative">
                  <select
                    value={tempDetails.bankCode}
                    onChange={e => {
                      const code = e.target.value
                      const bank = banks.find(b => b.code === code)
                      setTempDetails(p => ({ ...p, bankCode: code, bankName: bank?.name ?? '', accountName: '' }))
                      if (bank && tempDetails.accountNumber.length === 10) {
                        triggerVerification(code, tempDetails.accountNumber)
                      }
                    }}
                    className="input-field bg-white border border-neutral-200 appearance-none pr-10"
                  >
                    <option value="">Choose Bank</option>
                    {banks.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Account Number</label>
                <input
                  type="text"
                  value={tempDetails.accountNumber}
                  onChange={e => {
                    const num = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setTempDetails(p => ({ ...p, accountNumber: num, accountName: '' }))
                    if (num.length === 10 && tempDetails.bankCode) {
                      triggerVerification(tempDetails.bankCode, num)
                    }
                  }}
                  className="input-field bg-white font-mono border border-neutral-200"
                  placeholder="Enter account number"
                  maxLength={10}
                />
              </div>

              {isValidating && (
                <div className="flex items-center gap-2 justify-center py-2 text-xs text-primary-400 bg-white">
                  <span className="w-4 h-4 border-2 border-primary-400/40 border-t-primary-400 rounded-full animate-spin" />
                  Resolving account details...
                </div>
              )}

              {tempDetails.accountName && !isValidating && (
                <div>
                  <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Account Name</label>
                  <input
                    type="text"
                    value={tempDetails.accountName}
                    disabled
                    className="input-field bg-white border border-neutral-100 cursor-not-allowed font-semibold text-neutral-300"
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
                  onClick={handleSaveAccount}
                  disabled={saving || !tempDetails.accountName}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Account'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
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
              </div>
              <button
                onClick={handleCloseDelete}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            <p className="text-xs text-neutral-300">Are you sure you want to remove this bank account? This cannot be undone.</p>

            <div className="flex gap-2 justify-end pt-2 bg-white">
              <button
                onClick={handleCloseDelete}
                className="px-4 py-2 border border-neutral-100 hover:bg-neutral-50 text-xs font-semibold rounded-xl text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-danger-300 hover:bg-danger-400 text-xs font-semibold rounded-xl text-white transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

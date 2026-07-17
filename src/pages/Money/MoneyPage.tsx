import { useState, useEffect, useMemo } from 'react'
import { Calendar, ArrowUpRight, ArrowDownLeft, ShieldCheck, X, ChevronDown, Eye, EyeOff, Filter, AlertCircle, Download, Loader2 } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { MoneyDisplay } from '../../components/ui/MoneyDisplay'
import { StatusPill } from '../../components/ui/StatusPill'
import { useApiData } from '../../lib/useApiData'
import { moneyApi, authApi } from '../../api/client'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../lib/OrgContext'
import { Link } from 'react-router-dom'

const tabs = ['Transactions', 'Payouts']

export function MoneyPage() {
  const { org, updateOrg, guardAction, orgUuid } = useOrg()
  const isProfileIncomplete = org.approvalStatus === 'incomplete'
  const { data, loading, error, refetch } = useApiData()
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleAction = () => {
    if (isProfileIncomplete) {
      setShowProfileModal(true)
      return
    }
  }
  const [activeTab, setActiveTab] = useState('Transactions')
  const [balance, setBalance] = useState({ available: 0, withdrawable: 0 })
  const [hasWithdrawalPin, setHasWithdrawalPin] = useState<boolean | null>(null)
  const [showSetPinModal, setShowSetPinModal] = useState(false)
  const [setPinValue, setSetPinValue] = useState('')
  const [setPinConfirmValue, setSetPinConfirmValue] = useState('')
  const [isSettingPin, setIsSettingPin] = useState(false)
  // Sourced from the shared useApiData cache, not a page-local fetch - so
  // adding/removing/set-primary in Settings > Payout (which invalidates
  // that cache) is reflected here without needing a reload.
  const bankAccounts = data.bankAccounts

  useEffect(() => {
    if (!orgUuid) return
    let cancelled = false
    moneyApi.getBalance(orgUuid).catch(() => null).then((balanceRes: any) => {
      if (cancelled || !balanceRes) return
      setBalance({
        available: Number(balanceRes.available_balance ?? 0),
        withdrawable: Number(balanceRes.withdrawable_balance ?? 0),
      })
      setHasWithdrawalPin(Boolean(balanceRes.has_withdrawal_pin))
    })
    return () => { cancelled = true }
  }, [orgUuid])

  const isHidden = org.isBalanceHidden || false
  const primaryAccount = bankAccounts.find(a => a.is_primary) || bankAccounts[0]

  // Withdrawal confirmation state
  const [showModal, setShowModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPin, setWithdrawPin] = useState('')
  const [withdrawSecurityAnswer, setWithdrawSecurityAnswer] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null)
  const [securityQuestionConfigured, setSecurityQuestionConfigured] = useState<boolean | null>(null)

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exportingCsv, setExportingCsv] = useState(false)
  // Caps rendered rows instead of rendering all of them at once -
  // allTransactions/filteredPayouts can each be up to 500 rows
  // (useApiData's fetch cap), and this list previously had no pagination
  // or windowing at all.
  const [visibleTxCount, setVisibleTxCount] = useState(30)
  const [visiblePayoutCount, setVisiblePayoutCount] = useState(30)

  const handleExportCsv = async () => {
    if (!orgUuid) return
    setExportingCsv(true)
    try {
      await moneyApi.exportTransactionsCsv(orgUuid, startDate || undefined, endDate || undefined)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to export transactions')
    } finally {
      setExportingCsv(false)
    }
  }

  const selectedAccount = bankAccounts.find(a => a.uuid === selectedAccountId) || primaryAccount

  // data.transactions/data.payouts can each be up to 500 rows (useApiData's
  // fetch cap) - both were re-filtered on every render (including
  // unrelated ones, e.g. typing in the withdrawal PIN field).
  const allTransactions = useMemo(() => {
    if (!(startDate && endDate)) return data.transactions
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime() + 86400000 // include the end day
    return data.transactions.filter(t => {
      const time = new Date(t.date).getTime()
      return time >= start && time <= end
    })
  }, [data.transactions, startDate, endDate])

  const allPayouts = data.payouts
  const filteredPayouts = useMemo(() => allPayouts.filter(p => {
    if (!startDate || !endDate) return true
    const payoutTime = new Date(p.dateInitiated).getTime()
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime() + 86400000
    return payoutTime >= start && payoutTime <= end
  }), [allPayouts, startDate, endDate])

  // Sourced from GET /money/weekly-revenue (data.weeklyRevenue, via
  // useApiData) instead of re-derived from the raw transactions list -
  // that re-derivation used a rolling 7-day window instead of the
  // backend's actual calendar-week logic, and never reflected the
  // real-ledger fix to weekly-revenue at all.
  const bookingsThisWeekCount = data.weeklyRevenue.reduce((sum, day) => sum + day.bookings, 0)
  const totalEarningsThisWeek = data.weeklyRevenue.reduce((sum, day) => sum + day.gross, 0)

  const handleWithdrawClick = () => {
    handleAction()
    if (!isProfileIncomplete) {
      guardAction(undefined, () => {
        if (hasWithdrawalPin === false) {
          setSetPinValue('')
          setSetPinConfirmValue('')
          setShowSetPinModal(true)
          return
        }
        setSelectedAccountId(primaryAccount?.uuid || '')
        setWithdrawAmount('')
        setWithdrawPin('')
        setWithdrawSecurityAnswer('')
        setShowModal(true)
        authApi.getSecurityQuestionStatus()
          .then((res: any) => {
            setSecurityQuestionConfigured(!!res.data?.configured)
            setSecurityQuestion(res.data?.question ?? null)
          })
          .catch(() => setSecurityQuestionConfigured(false))
      })
    }
  }

  const handleSetWithdrawalPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgUuid) return
    if (setPinValue.length !== 4) {
      toast.error('PIN must be 4 digits')
      return
    }
    if (setPinValue !== setPinConfirmValue) {
      toast.error('PINs do not match')
      return
    }
    setIsSettingPin(true)
    try {
      await moneyApi.setWithdrawalPin(orgUuid, { pin: setPinValue, confirm_pin: setPinConfirmValue })
      toast.success('Withdrawal PIN set')
      setHasWithdrawalPin(true)
      setShowSetPinModal(false)
      setSelectedAccountId(primaryAccount?.uuid || '')
      setWithdrawAmount('')
      setWithdrawPin('')
      setWithdrawSecurityAnswer('')
      setShowModal(true)
      authApi.getSecurityQuestionStatus()
        .then((res: any) => {
          setSecurityQuestionConfigured(!!res.data?.configured)
          setSecurityQuestion(res.data?.question ?? null)
        })
        .catch(() => setSecurityQuestionConfigured(false))
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to set withdrawal PIN')
    } finally {
      setIsSettingPin(false)
    }
  }

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgUuid || !selectedAccountId) {
      toast.error('Select a withdrawal account')
      return
    }
    const amount = Number(withdrawAmount)
    if (!withdrawAmount || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter an amount to withdraw')
      return
    }
    if (amount > balance.withdrawable) {
      toast.error(`You can withdraw up to NGN ${balance.withdrawable.toLocaleString()}`)
      return
    }
    if (withdrawPin.length !== 4) {
      toast.error('Enter your 4-digit withdrawal PIN')
      return
    }
    if (!withdrawSecurityAnswer.trim()) {
      toast.error('Answer your security question to confirm')
      return
    }

    setIsProcessing(true)
    try {
      const res: any = await moneyApi.initiateWithdrawal(orgUuid, {
        amount,
        bank_account_id: selectedAccountId,
        pin: withdrawPin,
        security_answer: withdrawSecurityAnswer,
      })
      toast.success(res.message ?? `Withdrawal of NGN ${amount.toLocaleString()} initiated`)
      setShowModal(false)
      setWithdrawAmount('')
      setWithdrawPin('')
      setWithdrawSecurityAnswer('')
      refetch(['transactions', 'payouts'])
      moneyApi.getBalance(orgUuid).then((b: any) => setBalance({
        available: Number(b.available_balance ?? 0),
        withdrawable: Number(b.withdrawable_balance ?? 0),
      })).catch(() => {})
    } catch (err: any) {
      toast.error(err?.message ?? 'Withdrawal failed. Please try again.')
      setWithdrawPin('')
      setWithdrawSecurityAnswer('')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <TopBar title="Money" />
        <div className="bg-primary-500 px-4 pt-4 pb-6 w-full h-48 rounded-b-2xl" />
        <div className="flex-1 p-4 space-y-3 lg:pt-8 lg:px-8 w-full">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar title="Money" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-danger" />
          <p className="text-sm font-bold text-primary-500">Couldn't load your money data</p>
          <p className="text-xs text-neutral-300 max-w-xs">{error}</p>
          <button
            onClick={() => refetch()}
            className="btn-primary px-6 py-2.5 text-sm font-bold mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Money" />

      {/* Main Stats Banner */}
      <div className="bg-primary-500 px-4 pt-4 pb-6 lg:px-8 w-full lg:rounded-b-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-primary-200 text-xs mb-1">Available balance</p>
              <div className="flex items-center gap-3">
                <MoneyDisplay amount={balance.available} size="2xl" hidden={isHidden} className="text-white text-3xl sm:text-5xl font-black" />
                <button
                  onClick={() => updateOrg({ isBalanceHidden: !isHidden })}
                  className="p-2 bg-primary-400 hover:bg-primary-300 rounded-full text-white transition-colors"
                >
                  {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary-400 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-1 text-xs text-white mb-2">
            <Calendar className="w-3.5 h-3.5 text-accent-300" />
            <span className="font-medium text-primary-100">Withdrawable Now</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white stat-number">
            {isHidden ? '****' : `NGN ${balance.withdrawable.toLocaleString()}`}
          </p>
          <p className="text-[11px] text-primary-200 mt-1">
            {primaryAccount ? `Ready for withdrawal · ${primaryAccount.bank_name} ****${primaryAccount.account_number?.slice(-4)}` : 'Add a bank account in Settings to withdraw'}
          </p>
        </div>

        <div className="bg-primary-400 rounded-2xl p-4">
          <p className="text-xs text-primary-200 mb-3 font-semibold">This week so far</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Bookings', value: `${bookingsThisWeekCount}` },
              { label: 'Total Earnings', value: `NGN ${(totalEarningsThisWeek / 1000).toFixed(1)}K` },
              { label: 'Available Balance', value: `NGN ${(balance.available / 1000).toFixed(1)}K` },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl sm:text-3xl font-black text-white stat-number">
                  {isHidden ? '****' : s.value}
                </p>
                <p className="text-[11px] text-primary-200 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-neutral-50 flex w-full">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab ? 'border-primary-500 text-primary-500 font-bold' : 'border-transparent text-neutral-200',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Money" subtitle="Wallet, transactions & payouts" />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold hover:text-black transition-colors bg-white border border-neutral-100 rounded-lg px-3 py-1.5 shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" /> {startDate && endDate ? `${startDate} - ${endDate}` : 'Filter Date'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex items-center gap-1.5 text-xs text-secondary-300 font-semibold hover:underline disabled:opacity-60"
          >
            {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>
        </div>

        {activeTab === 'Transactions' && (
          <div className="space-y-2">
            {allTransactions.length === 0 ? (
              <div className="card text-center py-8 text-neutral-200 text-sm">No transactions yet.</div>
            ) : (
              allTransactions.slice(0, visibleTxCount).map(tx => (
                <div key={tx.id} className="card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white">
                        {tx.type === 'payout'
                          ? <ArrowUpRight className="w-5 h-5 text-primary-400" />
                          : tx.type === 'refund'
                          ? <ArrowDownLeft className="w-5 h-5 text-danger" />
                          : <ArrowDownLeft className="w-5 h-5 text-secondary-300" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-500 leading-snug">{tx.description}</p>
                        <p className="text-xs text-neutral-200 mt-0.5">{formatDateTime(tx.date)}</p>
                      </div>
                    </div>
                    <MoneyDisplay
                      amount={tx.net}
                      size="sm"
                      showSign
                      hidden={isHidden}
                      className={clsx('font-bold', tx.net > 0 ? 'text-secondary-300' : 'text-danger')}
                    />
                  </div>
                </div>
              ))
            )}
            {visibleTxCount < allTransactions.length && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleTxCount(c => c + 30)}
                  className="px-4 py-2 text-sm font-semibold text-primary-500 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Load more ({allTransactions.length - visibleTxCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Payouts' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-200 px-1">
              Withdrawals you've made from your Soole wallet to your bank account.
            </p>
            {filteredPayouts.length === 0 ? (
              <div className="card text-center py-8 text-neutral-200 text-sm">No withdrawals found.</div>
            ) : (
              filteredPayouts.slice(0, visiblePayoutCount).map(payout => (
                <div key={payout.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <MoneyDisplay amount={payout.amount} size="lg" hidden={isHidden} className="font-bold text-lg" />
                    <StatusPill status={payout.status} />
                  </div>
                  <div className="space-y-1 text-xs text-neutral-200">
                    <p>
                      {payout.dateCompleted
                        ? `Received: ${formatDate(payout.dateCompleted)}`
                        : `Initiated: ${formatDate(payout.dateInitiated)}`}
                    </p>
                    <p>Ref: {payout.reference}</p>
                    {payout.description && <p>{payout.description}</p>}
                  </div>
                </div>
              ))
            )}
            {visiblePayoutCount < filteredPayouts.length && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisiblePayoutCount(c => c + 30)}
                  className="px-4 py-2 text-sm font-semibold text-primary-500 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Load more ({filteredPayouts.length - visiblePayoutCount} remaining)
                </button>
              </div>
            )}

            <button
              onClick={handleWithdrawClick}
              className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-400 active:scale-95 transition-all duration-150"
            >
              Withdraw Instantly
            </button>
          </div>
        )}
      </div>

      {/* Date Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card w-full max-w-sm p-6 shadow-float relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowFilterModal(false)}
              className="absolute top-4 right-4 p-2 bg-neutral-50 hover:bg-neutral-100 rounded-full text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-black mb-1">Filter Transactions</h3>
            <p className="text-sm text-neutral-300 mb-6">Select a date range to filter your transaction history.</p>

            <form onSubmit={(e) => {
              e.preventDefault()
              setShowFilterModal(false)
              if (startDate && endDate) {
                setVisibleTxCount(30)
                setVisiblePayoutCount(30)
                toast.success('Transactions filtered!')
              } else {
                toast.error('Please select both start and end dates.')
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Start Date</label>
                <input 
                  type="date" 
                  required
                  className="input-field" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">End Date</label>
                <input 
                  type="date" 
                  required
                  className="input-field" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  className="btn-secondary flex-1"
                  onClick={() => { setStartDate(''); setEndDate(''); setShowFilterModal(false); }}
                >
                  Clear
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Payout Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card w-full max-w-md p-6 shadow-float relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-neutral-200 hover:text-primary-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary-500">Security Verification</h3>
                <p className="text-xs text-neutral-200">Verify identity to withdraw instantly</p>
              </div>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">Select Payout Destination</label>
                <div className="relative">
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="input-field bg-white border border-neutral-200 appearance-none pr-10"
                  >
                    {bankAccounts.length === 0 && <option value="">No bank accounts on file</option>}
                    {bankAccounts.map(acc => (
                      <option key={acc.uuid} value={acc.uuid}>
                        {acc.bank_name} - {acc.account_number} {acc.is_primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-primary-400">Amount to withdraw</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(balance.withdrawable))}
                    className="text-xs font-semibold text-secondary-300 hover:underline"
                  >
                    Withdraw all (NGN {balance.withdrawable.toLocaleString()})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-300">NGN</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={balance.withdrawable}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="input-field bg-white pl-12"
                    placeholder="0.00"
                  />
                </div>
                {Number(withdrawAmount) > balance.withdrawable && (
                  <p className="text-xs text-danger mt-1">Exceeds your withdrawable balance.</p>
                )}
              </div>

              <div className="bg-primary-75 border border-primary-100 rounded-xl p-3 text-xs text-primary-400">
                <p className="font-semibold text-primary-500">Payout details:</p>
                <p className="mt-1">Amount: NGN {(Number(withdrawAmount) || 0).toLocaleString()}</p>
                <p>Destination: {selectedAccount ? `${selectedAccount.bank_name} ****${selectedAccount.account_number?.slice(-4)}` : 'No account selected'}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">Enter your 4-digit withdrawal PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={withdrawPin}
                  onChange={e => setWithdrawPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field bg-white text-center tracking-[0.5em] text-lg font-black"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {securityQuestionConfigured === false ? (
                <div className="bg-secondary-500/10 border border-secondary-300 rounded-xl p-3 text-xs text-neutral-300">
                  <p className="font-semibold text-primary-500">Security question required</p>
                  <p className="mt-1">Set up a security question in Settings before you can withdraw.</p>
                  <Link
                    to="/settings"
                    onClick={() => setShowModal(false)}
                    className="mt-2 inline-block font-semibold text-secondary-600 underline"
                  >
                    Go to Settings
                  </Link>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-primary-400 mb-1.5">
                    {securityQuestion ? securityQuestion : 'Answer your security question to confirm'}
                  </label>
                  <input
                    type="text"
                    value={withdrawSecurityAnswer}
                    onChange={e => setWithdrawSecurityAnswer(e.target.value)}
                    className="input-field bg-white"
                    placeholder="Your answer"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isProcessing ||
                  !selectedAccountId ||
                  !withdrawAmount ||
                  Number(withdrawAmount) <= 0 ||
                  Number(withdrawAmount) > balance.withdrawable ||
                  withdrawPin.length < 4 ||
                  !securityQuestionConfigured ||
                  !withdrawSecurityAnswer.trim()
                }
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-400 active:scale-95 transition-all disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing Instant Payout…
                  </>
                ) : 'Confirm Instant Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Set Withdrawal PIN Modal - first-time setup, gates the withdraw
          flow above until a dedicated PIN exists (withdrawals previously
          checked the login password instead, which mismatched this
          modal's old 8-character field against actual login PINs). */}
      {showSetPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card w-full max-w-md p-6 shadow-float relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowSetPinModal(false)}
              className="absolute right-4 top-4 text-neutral-200 hover:text-primary-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary-500">Set Withdrawal PIN</h3>
                <p className="text-xs text-neutral-200">Create a 4-digit PIN to protect withdrawals</p>
              </div>
            </div>

            <form onSubmit={handleSetWithdrawalPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={setPinValue}
                  onChange={e => setSetPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field bg-white text-center tracking-[0.5em] text-lg font-black"
                  placeholder="••••"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={setPinConfirmValue}
                  onChange={e => setSetPinConfirmValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field bg-white text-center tracking-[0.5em] text-lg font-black"
                  placeholder="••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSettingPin || setPinValue.length !== 4 || setPinConfirmValue.length !== 4}
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-400 active:scale-95 transition-all disabled:opacity-60"
              >
                {isSettingPin ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Setting PIN…
                  </>
                ) : 'Set PIN & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Incomplete Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm p-6 shadow-float space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-secondary-500 rounded-3xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-primary-500">Profile Incomplete</h2>
              <p className="text-sm text-neutral-300">Please complete your profile to manage your wallet.</p>
            </div>
            <div className="bg-secondary-500/10 border border-secondary-300 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-black uppercase tracking-wider">What's needed:</p>
              <ul className="text-xs text-neutral-300 space-y-2 text-left">
                <li>✓ Organization details</li>
                <li>✓ Director information</li>
                <li>✓ Bank account setup</li>
                <li>✓ Security questions</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 bg-neutral-50 hover:bg-neutral-100 text-black font-semibold rounded-xl px-4 py-2 text-sm transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.dispatchEvent(new Event('require-profile-completion'))}
                className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all whitespace-nowrap"
              >
                Complete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

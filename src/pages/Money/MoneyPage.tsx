import { useState, useCallback } from 'react'
import { Settings, Download, Calendar, ArrowUpRight, ArrowDownLeft, ShieldCheck, X } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { MoneyDisplay } from '../../components/ui/MoneyDisplay'
import { StatusPill } from '../../components/ui/StatusPill'
import { useMockData } from '../../lib/useMockData'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const tabs = ['Transactions', 'Payouts']

export function MoneyPage() {
  const { data, loading } = useMockData()
  const [activeTab, setActiveTab] = useState('Transactions')
  const [balance, setBalance] = useState(47300)
  const [extraTransactions, setExtraTransactions] = useState<any[]>([])
  const [extraPayouts, setExtraPayouts] = useState<any[]>([])

  // Security verification states for withdrawal
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const allTransactions = [...extraTransactions, ...data.transactions]
  const allPayouts = [...extraPayouts, ...data.payouts]

  const handleWithdrawClick = () => {
    if (balance <= 0) {
      toast.error('No funds available for withdrawal.')
      return
    }
    setShowModal(true)
  }

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || !securityAnswer.trim()) {
      toast.error('Please enter both your password and security answer.')
      return
    }

    setIsProcessing(true)
    setTimeout(() => {
      const withdrawnAmount = balance
      setBalance(0)
      
      const newTx = {
        id: `tx-instant-${Date.now()}`,
        date: new Date().toISOString(),
        description: `Instant Payout to GTBank ****4521`,
        type: 'payout' as const,
        gross: -withdrawnAmount,
        commission: 0,
        net: -withdrawnAmount,
        balance: 0
      }
      
      const newPayout = {
        id: `po-instant-${Date.now()}`,
        date: new Date().toISOString(),
        amount: withdrawnAmount,
        status: 'received' as const,
        bankRef: 'GTBank ****4521',
        bookingCount: 11,
        expectedArrival: new Date().toISOString()
      }

      setExtraTransactions(prev => [newTx, ...prev])
      setExtraPayouts(prev => [newPayout, ...prev])
      setIsProcessing(false)
      setShowModal(false)
      setPassword('')
      setSecurityAnswer('')
      toast.success(`Instant Payout of NGN ${withdrawnAmount.toLocaleString()} successful!`)
    }, 1500)
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Money" />

      {/* Main Stats Banner */}
      <div className="bg-primary-500 px-4 pt-4 pb-6 lg:px-8 w-full lg:rounded-b-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-primary-200 text-xs mb-1">Available balance</p>
            <MoneyDisplay amount={balance} size="2xl" className="text-white text-3xl sm:text-5xl font-black" />
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-400" aria-label="Payout settings">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="bg-primary-400 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-primary-200 font-medium">Instant payout eligible</p>
            <div className="flex items-center gap-1 text-xs text-accent-300">
              <Calendar className="w-3 h-3" />
              <span>Instant Transfer Available</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white stat-number">NGN {balance.toLocaleString()}</p>
          <p className="text-[11px] text-primary-200 mt-1">Ready for withdrawal · GTBank ****4521</p>
        </div>

        <div className="bg-primary-400 rounded-2xl p-4">
          <p className="text-xs text-primary-200 mb-3 font-semibold">This week so far</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Bookings', value: `${allTransactions.filter(t => t.type === 'booking').length}` },
              { label: 'Total Earnings', value: 'NGN 269K' },
              { label: 'Available Balance', value: `NGN ${(balance / 1000).toFixed(1)}K` },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl sm:text-3xl font-black text-white stat-number">{s.value}</p>
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

        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 text-xs text-secondary-300 font-semibold hover:underline">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {activeTab === 'Transactions' && (
          <div className="space-y-2">
            {allTransactions.length === 0 ? (
              <div className="card text-center py-8 text-neutral-200 text-sm">No transactions yet.</div>
            ) : (
              allTransactions.map(tx => (
                <div key={tx.id} className="card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        tx.type === 'payout' ? 'bg-primary-75' : tx.type === 'refund' ? 'bg-danger-light' : 'bg-success-light',
                      )}>
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
                      className={clsx('font-bold', tx.net > 0 ? 'text-secondary-300' : 'text-danger')}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Payouts' && (
          <div className="space-y-3">
            {allPayouts.map(payout => (
              <div key={payout.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <MoneyDisplay amount={payout.amount} size="lg" className="font-bold text-lg" />
                  <StatusPill status={payout.status} />
                </div>
                <div className="space-y-1 text-xs text-neutral-200">
                  <p>Settled: {formatDate(payout.date)}</p>
                  <p>Bank: {payout.bankRef}</p>
                  <p>Covers {payout.bookingCount} bookings</p>
                </div>
              </div>
            ))}

            <button
              onClick={handleWithdrawClick}
              className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-400 active:scale-95 transition-all duration-150"
            >
              Withdraw Instantly
            </button>
          </div>
        )}
      </div>

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
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary-500">Security Verification</h3>
                <p className="text-xs text-neutral-200">Verify identity to withdraw instantly</p>
              </div>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">Account Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-400 mb-1.5">
                  Security Question: What is your favorite childhood keyword?
                </label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  className="input-field"
                  placeholder="Enter security answer"
                  required
                />
              </div>

              <div className="bg-primary-75 border border-primary-100 rounded-xl p-3 text-xs text-primary-400">
                <p className="font-semibold text-primary-500">Payout details:</p>
                <p className="mt-1">Amount: NGN {balance.toLocaleString()}</p>
                <p>Destination: GTBank ****4521</p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-400 active:scale-95 transition-all"
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
    </div>
  )
}

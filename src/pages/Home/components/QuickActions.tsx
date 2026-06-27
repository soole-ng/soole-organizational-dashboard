import { MessageSquare, Wallet, BellRing, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export function QuickActions() {
  const actions = [
    {
      icon: MessageSquare,
      label: 'Broadcast SMS',
      desc: 'Send update to all active drivers',
      color: 'bg-primary-50 text-primary-500 border-primary-100',
      onClick: () => {
        const msg = prompt('Enter message to broadcast via SMS:')
        if (msg) toast.success('Broadcast sent successfully!')
      }
    },
    {
      icon: Wallet,
      label: 'Request Payout',
      desc: 'Withdraw earnings to bank account',
      color: 'bg-secondary-50 text-secondary-300 border-secondary-100',
      onClick: () => {
        toast.success('Payout request of NGN 47,300 submitted!')
      }
    },
    {
      icon: BellRing,
      label: 'Create Fleet Alert',
      desc: 'Set custom safety or document warning',
      color: 'bg-accent-50 text-accent-400 border-accent-100',
      to: '/settings'
    }
  ]

  return (
    <div className="px-4">
      <div className="card">
        <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="space-y-2">
          {actions.map((act, i) => {
            const Icon = act.icon
            const content = (
              <div className="flex items-center gap-3 w-full text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black">{act.label}</p>
                  <p className="text-[10px] text-neutral-200 truncate mt-0.5">{act.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-200 flex-shrink-0" />
              </div>
            )

            if (act.to) {
              return (
                <Link
                  key={i}
                  to={act.to}
                  className="block w-full p-2.5 rounded-xl border border-neutral-50 hover:bg-neutral-50/50 transition-colors"
                >
                  {content}
                </Link>
              )
            }

            return (
              <button
                key={i}
                onClick={act.onClick}
                className="block w-full p-2.5 rounded-xl border border-neutral-50 hover:bg-neutral-50/50 transition-colors"
              >
                {content}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

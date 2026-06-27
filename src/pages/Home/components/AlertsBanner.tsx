/**
 * AlertsBanner — fixed to use useMockData hook instead of empty static array.
 * ≤ 400 lines
 */
import { AlertTriangle, XCircle, Info, X, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { clsx } from 'clsx'
import { useMockData } from '../../../lib/useMockData'
import type { Alert } from '../../../types'

function AlertItem({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const isWarning = alert.type === 'warning'
  const isDanger  = alert.type === 'danger'

  const iconEl = isWarning
    ? <AlertTriangle className="w-4 h-4 text-accent-400" />
    : isDanger
    ? <XCircle className="w-4 h-4 text-[#FF0000] !text-[#FF0000]" />
    : <Info className="w-4 h-4 text-accent-400" />

  const containerCls = 'bg-[#042011] border-[#042011]'

  const iconBg = 'bg-white'
  const textCls = isWarning 
    ? 'text-accent-400 font-bold' 
    : isDanger 
    ? 'text-[#FF0000] !text-[#FF0000] font-black' 
    : 'text-accent-400 font-bold'

  return (
    <div className={clsx('rounded-2xl p-3.5 flex gap-3 border', containerCls)}>
      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', iconBg)}>
        {iconEl}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-xs font-semibold mb-0.5', textCls)}>{alert.title}</p>
        <p className="text-xs leading-relaxed text-white/95 font-medium">
          {alert.message}
        </p>
        {alert.action && (
          <Link
            to={alert.action.href}
            className={clsx('inline-flex items-center gap-1 text-xs font-semibold mt-1.5 hover:underline', textCls)}
          >
            {alert.action.label}
            <ChevronRight className={clsx("w-3 h-3", isDanger ? "text-[#FF0000]" : "text-accent-400")} />
          </Link>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 flex-shrink-0 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="w-3.5 h-3.5 text-white/70" />
      </button>
    </div>
  )
}

interface AlertsBannerProps {
  notifications: any[]
  setNotifications: (notifs: any[]) => void
}

export function AlertsBanner({ notifications = [], setNotifications }: AlertsBannerProps) {
  if (!notifications) return null

  // Only show warning or danger type notifications (as active alerts)
  const visible = notifications.filter(n => n.type === 'warning' || n.type === 'danger')
  if (visible.length === 0) return null

  const handleDismiss = (id: string) => {
    if (setNotifications) {
      setNotifications(notifications.filter(n => n.id !== id))
    }
  }

  return (
    <div className="px-4 space-y-2">
      <p className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
        {visible.length} {visible.length === 1 ? 'alert' : 'alerts'} need your attention
      </p>
      {visible.map(alert => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={() => handleDismiss(alert.id)}
        />
      ))}
    </div>
  )
}

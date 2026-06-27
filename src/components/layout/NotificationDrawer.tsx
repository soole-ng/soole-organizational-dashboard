/**
 * NotificationDrawer — slide-in notification panel for mobile & desktop
 * ≤ 400 lines
 */
import { useEffect, useRef } from 'react'
import { X, AlertTriangle, XCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

export interface Notification {
  id: string
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  message: string
  read: boolean
  createdAt: string
  action?: { label: string; href: string }
}

interface NotificationDrawerProps {
  open: boolean
  notifications: Notification[]
  onClose: () => void
  onDismiss: (id: string) => void
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  onClearAll: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const typeConfig = {
  warning: { icon: AlertTriangle, bg: 'bg-white', border: 'border-neutral-100', iconCls: 'text-accent-400',    dot: 'bg-accent-300' },
  danger:  { icon: XCircle,       bg: 'bg-white', border: 'border-neutral-100', iconCls: 'text-danger-300',   dot: 'bg-danger-300' },
  info:    { icon: Info,          bg: 'bg-white', border: 'border-neutral-100', iconCls: 'text-teal-400',     dot: 'bg-teal-400' },
  success: { icon: CheckCircle2,  bg: 'bg-white', border: 'border-neutral-100', iconCls: 'text-secondary-300', dot: 'bg-secondary-300' },
}

function NotifItem({ n, onDismiss, onMarkRead }: { n: Notification; onDismiss: () => void; onMarkRead: () => void }) {
  const cfg = typeConfig[n.type]
  const Icon = cfg.icon

  return (
    <div
      onClick={() => { if (!n.read) onMarkRead() }}
      className="p-4 border-b border-neutral-50 flex gap-3 transition-colors cursor-pointer bg-transparent hover:bg-neutral-50/30"
    >
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg, 'border', cfg.border)}>
        <Icon className={clsx('w-4 h-4', cfg.iconCls)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-primary-500 leading-snug">{n.title}</p>
          {!n.read && (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 bg-[#FF0000] !bg-[#FF0000] unread-dot" />
          )}
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed mb-1.5">{n.message}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-200">{timeAgo(n.createdAt)}</span>
          {n.action && (
            <Link
              to={n.action.href}
              className="text-xs font-semibold text-secondary-300 flex items-center gap-0.5 hover:text-secondary-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // prevent triggering mark as read multiple times if link is clicked
                if (!n.read) onMarkRead();
              }}
            >
              {n.action.label}
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-200 hover:bg-neutral-50 hover:text-neutral-400 transition-colors flex-shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function NotificationDrawer({
  open, notifications, onClose, onDismiss, onMarkAllRead, onMarkRead, onClearAll,
}: NotificationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter(n => !n.read).length

  // Trap focus & close on Escape
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={clsx(
          'fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-float flex flex-col',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-50">
          <div>
            <h2 className="text-base font-bold text-primary-500">Notifications</h2>
            <p className="text-xs text-neutral-200">{unreadCount} unread</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className={clsx(
                'text-[10px] font-bold px-2 py-1 rounded-full transition-colors border',
                unreadCount > 0
                  ? 'text-secondary-300 border-secondary-100 hover:bg-secondary-50'
                  : 'text-neutral-200 border-neutral-100 cursor-not-allowed bg-transparent'
              )}
            >
              Read All
            </button>
            <button
              onClick={onClearAll}
              disabled={notifications.length === 0}
              className={clsx(
                'text-[10px] font-bold px-2 py-1 rounded-full transition-colors border',
                notifications.length > 0
                  ? 'text-[#FF5500] border-orange-100 hover:bg-orange-50'
                  : 'text-neutral-200 border-neutral-100 cursor-not-allowed bg-transparent'
              )}
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-50 text-primary-400 transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-secondary-300" />
              </div>
              <p className="text-sm font-semibold text-primary-500 mb-1">You're all caught up!</p>
              <p className="text-xs text-neutral-200">No new notifications at this time.</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotifItem
                key={n.id}
                n={n}
                onDismiss={() => onDismiss(n.id)}
                onMarkRead={() => onMarkRead(n.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}

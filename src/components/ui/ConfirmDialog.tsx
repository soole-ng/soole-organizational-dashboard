import { AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * App-styled replacement for window.confirm()/window.alert() - those are
 * rendered by the browser itself (inconsistent look, blocks the main
 * thread, can't be styled), not something we control. Use this for any
 * "are you sure?" action instead.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-float w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center', danger ? 'bg-danger-50' : 'bg-primary-75')}>
          <AlertTriangle className={clsx('w-6 h-6', danger ? 'text-danger-300' : 'text-primary-400')} />
        </div>

        <div className="text-center">
          <h2 className="text-base font-bold text-primary-500 mb-1">{title}</h2>
          <p className="text-sm text-neutral-200 leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl border border-neutral-100 text-sm font-semibold text-primary-400 hover:bg-primary-75 transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-colors disabled:opacity-60',
              danger ? 'bg-danger-300 hover:bg-danger-400' : 'bg-primary-500 hover:bg-primary-400',
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

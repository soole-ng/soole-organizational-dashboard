import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'

const config: Record<StatusVariant, { label: string; color: string }> = {
  verified:    { label: 'Verified',    color: '#00C853' },
  active:      { label: 'Active',      color: '#00C853' },
  completed:   { label: 'Completed',   color: '#00C853' },
  received:    { label: 'Received',    color: '#00C853' },
  pending:     { label: 'Pending',     color: '#FF5500' },
  scheduled:   { label: 'Scheduled',   color: '#0070FF' },
  sent:        { label: 'Sent',        color: '#0070FF' },
  boarding:    { label: '',            color: '#FF5500' },
  in_progress: { label: '',            color: '#FF5500' },
  rejected:    { label: 'Rejected',    color: '#FF5500' },
  failed:      { label: 'Failed',      color: '#FF5500' },
  cancelled:   { label: 'Cancelled',   color: '#9CA3AF' },
  suspended:   { label: 'Suspended',   color: '#9CA3AF' },
  inactive:    { label: 'Inactive',    color: '#9CA3AF' },
  draft:       { label: 'Draft',       color: '#9CA3AF' },
}

interface Props {
  status: StatusVariant
  size?: 'sm' | 'md'
  className?: string
}

export function StatusPill({ status, size = 'md', className }: Props) {
  const { label, color } = config[status] ?? config.inactive

  return (
    <span
      className={clsx(
        'inline-flex items-center font-black uppercase tracking-wider',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className,
      )}
      style={{ color }}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  )
}

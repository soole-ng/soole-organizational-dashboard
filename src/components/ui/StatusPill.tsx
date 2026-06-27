import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'

const config: Record<StatusVariant, { label: string; className: string }> = {
  verified:    { label: 'Verified',    className: 'text-secondary-300' },
  active:      { label: 'Active',      className: 'text-secondary-300' },
  completed:   { label: 'Completed',   className: 'text-secondary-300' },
  received:    { label: 'Received',    className: 'text-secondary-300' },
  pending:     { label: 'Pending',     className: 'text-warning' },
  scheduled:   { label: 'Scheduled',  className: 'text-info-400' },
  sent:        { label: 'Sent',        className: 'text-info-400' },
  boarding:    { label: 'Boarding',    className: 'text-teal-300' },
  in_progress: { label: 'In Progress', className: 'text-teal-300' },
  rejected:    { label: 'Rejected',   className: 'text-warning' },
  failed:      { label: 'Failed',     className: 'text-warning' },
  cancelled:   { label: 'Cancelled',  className: 'text-primary-400' },
  suspended:   { label: 'Suspended',  className: 'text-neutral-300' },
  inactive:    { label: 'Inactive',   className: 'text-neutral-300' },
  draft:       { label: 'Draft',      className: 'text-neutral-300' },
}

interface Props {
  status: StatusVariant
  size?: 'sm' | 'md'
  className?: string
}

export function StatusPill({ status, size = 'md', className }: Props) {
  const { label, className: statusClass } = config[status] ?? config.inactive

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        statusClass,
        className,
      )}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  )
}

import { clsx } from 'clsx'
import type { StatusVariant } from '../../types'

// StatusPill — only Soole brand colours
const config: Record<StatusVariant, { label: string; className: string; dot: string }> = {
  verified:    { label: 'Verified',    className: 'bg-primary-75 text-secondary-300 border-secondary-300',  dot: 'bg-secondary-300' },
  active:      { label: 'Active',      className: 'bg-primary-75 text-secondary-300 border-secondary-300',  dot: 'bg-secondary-300' },
  completed:   { label: 'Completed',   className: 'bg-primary-75 text-secondary-300 border-secondary-300',  dot: 'bg-secondary-300' },
  received:    { label: 'Received',    className: 'bg-primary-75 text-secondary-300 border-secondary-300',  dot: 'bg-secondary-300' },
  pending:     { label: 'Pending',     className: 'bg-primary-75 text-warning border-warning',              dot: 'bg-warning' },
  scheduled:   { label: 'Scheduled',  className: 'bg-primary-75 text-info-400 border-info-300',            dot: 'bg-info-300' },
  sent:        { label: 'Sent',        className: 'bg-primary-75 text-info-400 border-info-300',            dot: 'bg-info-300' },
  boarding:    { label: 'Boarding',    className: 'bg-primary-75 text-teal-400 border-teal-400',            dot: 'bg-teal-400' },
  in_progress: { label: 'In Progress', className: 'bg-primary-75 text-teal-400 border-teal-400',           dot: 'bg-teal-400' },
  rejected:    { label: 'Rejected',    className: 'bg-primary-75 text-warning border-warning',              dot: 'bg-warning' },
  failed:      { label: 'Failed',      className: 'bg-primary-75 text-warning border-warning',              dot: 'bg-warning' },
  cancelled:   { label: 'Cancelled',  className: 'bg-primary-75 text-primary-400 border-primary-400',       dot: 'bg-primary-400' },
  suspended:   { label: 'Suspended',  className: 'bg-primary-75 text-neutral-200 border-neutral-200',       dot: 'bg-neutral-200' },
  inactive:    { label: 'Inactive',   className: 'bg-primary-75 text-neutral-200 border-neutral-200',       dot: 'bg-neutral-200' },
  draft:       { label: 'Draft',      className: 'bg-primary-75 text-neutral-200 border-neutral-200',       dot: 'bg-neutral-200' },
}

interface Props {
  status: StatusVariant
  size?: 'sm' | 'md'
  className?: string
}

export function StatusPill({ status, size = 'md', className }: Props) {
  const { label, className: statusClass, dot } = config[status] ?? config.inactive

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold border rounded-full',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        statusClass,
        className,
      )}
      aria-label={`Status: ${label}`}
    >
      <span className={clsx('rounded-full flex-shrink-0', dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {label}
    </span>
  )
}

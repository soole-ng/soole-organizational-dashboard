import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-primary-500 mb-1">{title}</h3>
      <p className="text-sm text-neutral-200 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-6 text-sm px-5 py-3">
          {action.label}
        </button>
      )}
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="skeleton h-3 w-full last:w-3/4" />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}

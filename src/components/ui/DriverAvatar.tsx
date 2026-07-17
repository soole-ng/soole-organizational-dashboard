import { clsx } from 'clsx'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Shows the driver's real photo when one exists on their record; otherwise
 * falls back to their initials. There is no stock-photo substitute here -
 * the backend has no driver photo field populated yet for most drivers, and
 * showing a stranger's stock photo as if it were theirs is worse than a
 * plain initials avatar.
 */
export function DriverAvatar({ photoUrl, name, size = 'md' }: { photoUrl?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        className={clsx('rounded-full object-cover flex-shrink-0 border border-neutral-100/50', sizeClass)}
      />
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full flex-shrink-0 bg-[#042011] text-white font-bold flex items-center justify-center border border-neutral-100/50',
        sizeClass
      )}
    >
      {initials(name)}
    </div>
  )
}

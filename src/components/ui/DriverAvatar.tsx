import { clsx } from 'clsx'

export const getDriverAvatar = (driverId: string) => {
  const avatars: Record<string, string> = {
    'd1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'd2': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'd3': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    'd4': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  }
  return avatars[driverId] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
}

export function DriverAvatar({ driverId, name, size = 'md' }: { driverId: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-8 h-8'
  return (
    <img
      src={getDriverAvatar(driverId)}
      alt={name}
      className={clsx('rounded-full object-cover flex-shrink-0 border border-neutral-100/50', sizeClass)}
    />
  )
}

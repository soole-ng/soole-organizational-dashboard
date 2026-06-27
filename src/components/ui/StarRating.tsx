import { Star } from 'lucide-react'
import { clsx } from 'clsx'

export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const filled = Math.round(rating)
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  const hasRating = rating > 0
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const isFilled = hasRating && i <= filled
        return (
          <Star
            key={i}
            className={clsx(cls, isFilled ? 'text-accent fill-accent' : 'fill-white')}
            style={!isFilled ? { stroke: 'rgba(0, 0, 0, 0.4)' } : undefined}
          />
        )
      })}
    </div>
  )
}

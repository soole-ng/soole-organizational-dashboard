import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-primary-500/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative bg-white rounded-3xl shadow-float w-full max-w-lg mx-auto',
          'max-h-[90dvh] md:max-h-[85vh] flex flex-col',
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-neutral-50 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3 md:hidden" />
          {title && <h2 className="text-base font-semibold text-primary-500">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto -mr-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-neutral-200" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-6 safe-bottom scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}

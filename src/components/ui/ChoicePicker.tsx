import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'

export type Choice = {
  value: string
  label: string
  detail?: string
  /** Shown greyed out with this reason, and not choosable. */
  disabledReason?: string
}

/**
 * A pick-one list in Soole's own look.
 *
 * Replaces `<select>`, which on an Android phone opens the system's dark
 * popup - the one thing on New Trip that did not look like Soole
 * (2026-10-15). A sheet from the bottom on a phone, a dropdown on a
 * computer, the same as the date picker. A search box appears once the
 * list is long enough to need one.
 */
export function ChoicePicker({
  id,
  value,
  onChange,
  choices,
  placeholder,
  disabled,
  title,
}: {
  id?: string
  value: string
  onChange: (next: string) => void
  choices: Choice[]
  placeholder: string
  disabled?: boolean
  title: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = choices.find(c => c.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const q = query.trim().toLowerCase()
  const shown = q
    ? choices.filter(c => `${c.label} ${c.detail ?? ''}`.toLowerCase().includes(q))
    : choices

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="input-field py-2.5 w-full flex items-center justify-between gap-2 text-left disabled:bg-neutral-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className={clsx('block truncate', !current && 'text-neutral-200')}>
            {current ? current.label : placeholder}
          </span>
          {current?.detail && (
            <span className="block truncate text-[11px] text-neutral-300">{current.detail}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-neutral-300 flex-shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/30 sm:hidden" aria-hidden onClick={() => setOpen(false)} />
      )}
      {open && (
        <div
          role="listbox"
          aria-label={title}
          className="fixed inset-x-0 bottom-0 z-[61] max-h-[80dvh] flex flex-col rounded-t-2xl bg-white p-4 pb-[calc(1rem+var(--safe-bottom))] shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:z-30 sm:mt-2 sm:w-full sm:max-h-80 sm:rounded-2xl sm:border sm:border-neutral-100 sm:p-2"
        >
          <p className="sm:hidden text-sm font-bold text-primary-500 mb-3">{title}</p>
          {choices.length > 6 && (
            <label className="relative mb-2 block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                maxLength={60}
                placeholder="Search"
                className="input-field py-2 pl-9 text-sm"
              />
            </label>
          )}
          <div className="overflow-y-auto">
            {shown.length === 0 && <p className="text-sm text-neutral-300 px-3 py-4">Nothing matches.</p>}
            {shown.map(c => {
              const chosen = c.value === value
              const blocked = !!c.disabledReason
              return (
                <button
                  key={c.value}
                  type="button"
                  role="option"
                  aria-selected={chosen}
                  disabled={blocked}
                  onClick={() => {
                    onChange(c.value)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={clsx(
                    'w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
                    chosen ? 'bg-primary-75' : !blocked && 'hover:bg-neutral-50',
                    blocked && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-black truncate">{c.label}</span>
                    <span className="block text-xs text-neutral-300 truncate">
                      {c.disabledReason ?? c.detail}
                    </span>
                  </span>
                  {chosen && <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

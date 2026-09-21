import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import clsx from 'clsx'

/**
 * A departure date and time, picked from a real calendar.
 *
 * Replaces `<input type="datetime-local">`, which hands the job to the
 * browser. On an Android phone that is a three-column spinner - Sep / 22 /
 * 2026 - with no weekday anywhere on it, so a dispatcher scheduling a
 * Saturday run has to know off the top of their head which number Saturday
 * is. It also renders in the system's own palette, which is why it was the
 * one thing on the page that did not look like Soole.
 *
 * Product owner, 2026-09-21: "deisgn a well custom page for this use
 * calendar for date please proper calendar look that we can select that
 * shows days of the week, etc ... and also use the 24hrs clock".
 *
 * TWENTY-FOUR HOUR, everywhere and always. Intercity departures are
 * written 05:30 and 17:30 on every timetable and ticket in the country,
 * and an AM/PM control is one mis-tap away from a trip leaving twelve
 * hours from when it should.
 *
 * The value in and out is the same `YYYY-MM-DDTHH:mm` local string the
 * native input used, so nothing downstream changes.
 */
export function DateTimePicker({
  value,
  onChange,
  min,
  id,
}: {
  value: string
  onChange: (next: string) => void
  /** Earliest allowed, same format. Days before it are not selectable. */
  min?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on an outside click, the same way the location search above does.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const selected = parseLocal(value)
  const minDate = parseLocal(min)

  // Which month the grid is showing. Starts on the selected date, or on
  // the earliest allowed one, so it never opens on a month where every day
  // is greyed out.
  const [cursor, setCursor] = useState(() =>
    startOfMonth(selected ?? minDate ?? new Date()),
  )

  useEffect(() => {
    if (selected) setCursor(startOfMonth(selected))
    // Only when the value itself changes from outside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const days = useMemo(() => monthGrid(cursor), [cursor])

  const hour = selected ? selected.getHours() : 6
  const minute = selected ? selected.getMinutes() : 0

  const commit = (date: Date, h: number, m: number) => {
    const next = new Date(date)
    next.setHours(h, m, 0, 0)

    // Never hand back a moment already gone.
    //
    // Picking today carried the current time across - 06:00 by default -
    // which on an evening shift is a departure eight hours in the past.
    // The time column greys those out, but only after the day has already
    // been committed, so the field showed an invalid value with Done
    // enabled and left the trip to be refused at submit.
    //
    // Rounded up to the next five minutes, because that is the step the
    // minute column offers; landing on 17:23 would show a time the user
    // cannot then re-pick.
    if (minDate && next < minDate) {
      const floor = new Date(minDate)
      const step = 5
      const over = floor.getMinutes() % step
      if (over !== 0) floor.setMinutes(floor.getMinutes() + (step - over))
      floor.setSeconds(0, 0)
      onChange(formatLocal(floor))
      return
    }

    onChange(formatLocal(next))
  }

  const pickDay = (day: Date) => {
    commit(day, hour, minute)
  }

  const dayIsBlocked = (day: Date) =>
    !!minDate && endOfDay(day) < minDate

  // A time earlier today is in the past; the same time tomorrow is not.
  const timeIsBlocked = (h: number, m: number) => {
    if (!minDate || !selected) return false
    const candidate = new Date(selected)
    candidate.setHours(h, m, 0, 0)
    return candidate < minDate
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-field py-2.5 w-full flex items-center justify-between gap-2 text-left"
      >
        <span
          className={clsx(
            'truncate',
            !selected && 'text-neutral-200',
          )}
        >
          {selected ? longLabel(selected) : 'Choose a date and time'}
        </span>
        <Calendar className="w-4 h-4 text-neutral-300 flex-shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-2 w-full max-w-[22rem] rounded-2xl border border-neutral-100 bg-white p-3 shadow-xl"
          role="dialog"
          aria-label="Choose a date and time"
        >
          {/* Month, and the way through the months. */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor(addMonths(cursor, -1))}
              className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-xs font-bold text-black">
              {cursor.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* The whole point of a calendar over a spinner. */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <span
                key={d}
                className="text-center text-[10px] font-semibold text-neutral-200 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map(({ date, inMonth }) => {
              const blocked = dayIsBlocked(date)
              const isSelected = !!selected && sameDay(date, selected)
              const isToday = sameDay(date, new Date())
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={blocked}
                  onClick={() => pickDay(date)}
                  className={clsx(
                    'h-9 rounded-lg text-xs stat-number transition-colors',
                    isSelected && 'bg-primary-500 text-white font-bold',
                    !isSelected && inMonth && !blocked &&
                      'text-black hover:bg-primary-50',
                    !isSelected && !inMonth && !blocked && 'text-neutral-200',
                    blocked && 'text-neutral-100 cursor-not-allowed',
                    !isSelected && isToday && 'ring-1 ring-inset ring-primary-200',
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-neutral-300" />
              <p className="text-[11px] font-semibold text-primary-400">
                Departure time
              </p>
              <span className="ml-auto text-[10px] text-neutral-200">
                24-hour
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TimeColumn
                label="Hour"
                values={HOURS}
                current={hour}
                disabled={h => timeIsBlocked(h, minute)}
                onPick={h => selected && commit(selected, h, minute)}
              />
              <span className="text-sm font-bold text-neutral-300 pt-5">:</span>
              <TimeColumn
                label="Minute"
                values={MINUTES}
                current={minute}
                disabled={m => timeIsBlocked(hour, m)}
                onPick={m => selected && commit(selected, hour, m)}
              />
            </div>

            {!selected && (
              <p className="mt-2 text-[11px] text-neutral-200">
                Pick a day first, then the time.
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="btn-secondary py-2 text-xs flex-1"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => setOpen(false)}
              className={clsx(
                'btn-primary py-2 text-xs flex-1',
                !selected && 'opacity-50 cursor-not-allowed',
              )}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * One scrolling column of hours or minutes.
 *
 * A list rather than a `<select>`: the native dropdown is the same
 * system-styled control this component exists to get away from, and on a
 * phone it opens yet another sheet over the one already open.
 */
function TimeColumn({
  label,
  values,
  current,
  disabled,
  onPick,
}: {
  label: string
  values: number[]
  current: number
  disabled: (v: number) => boolean
  onPick: (v: number) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  // Open with the chosen value in view, not at midnight.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-current="true"]')
    el?.scrollIntoView({ block: 'center' })
  }, [current])

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-neutral-200 mb-1">{label}</p>
      <div
        ref={listRef}
        className="h-28 overflow-y-auto rounded-lg border border-neutral-100"
      >
        {values.map(v => {
          const off = disabled(v)
          const isCurrent = v === current
          return (
            <button
              key={v}
              type="button"
              disabled={off}
              data-current={isCurrent}
              onClick={() => onPick(v)}
              className={clsx(
                'w-full py-1.5 text-xs stat-number',
                isCurrent && 'bg-primary-500 text-white font-bold',
                !isCurrent && !off && 'text-black hover:bg-primary-50',
                off && 'text-neutral-100 cursor-not-allowed',
              )}
            >
              {String(v).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Monday first: a Nigerian working week, and how every timetable is laid out.
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)
// Five-minute steps. Departures are scheduled to the five minutes, and sixty
// rows to scroll through is a worse control, not a more precise one.
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function parseLocal(value?: string): Date | null {
  if (!value) return null
  // Parsed by hand rather than new Date(value): a bare "YYYY-MM-DDTHH:mm"
  // is read as local by browsers, but the same string with a Z or an
  // offset is not, and one inconsistent parse here moves a departure by
  // hours.
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  return new Date(+y, +mo - 1, +d, +h, +mi, 0, 0)
}

function formatLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function longLabel(date: Date): string {
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${day}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function addMonths(d: Date, by: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + by, 1)
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Six weeks of days, so the grid never changes height between months. */
function monthGrid(cursor: Date): { date: Date; inMonth: boolean }[] {
  const first = startOfMonth(cursor)
  // getDay() is Sunday-first; shift so Monday is column one.
  const lead = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - lead)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return { date, inMonth: date.getMonth() === cursor.getMonth() }
  })
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { addDays, format, formatDistanceToNowStrict, subDays } from 'date-fns'
import { Bell, CalendarClock, CheckCircle2, Clock3, LogOut, Maximize2, Minimize2, RefreshCw, Search, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { opsApi, opsSession, type LiveTrip, type RecentTrip, type TripStatusFilter } from './api'
import { OpsMap, vehicleTone } from './OpsMap'
import { TripPanel } from './TripPanel'

type Tab = 'live' | 'past'
type Kind = 'all' | 'company' | 'independent'

const LIVE_EVERY = 15_000

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const TONE_DOT: Record<string, string> = {
  sos: 'bg-[#d92d20]',
  nogps: 'bg-[#b7791f]',
  company: 'bg-[#0e7c86]',
  independent: 'bg-[#5e8c1f]',
}

function rank(t: LiveTrip) {
  return t.flags.sos ? 0 : t.flags.no_gps ? 1 : 2
}

function LiveRow({ t, selected, onOpen }: { t: LiveTrip; selected: boolean; onOpen: () => void }) {
  const tone = vehicleTone(t)
  return (
    <li>
      <button
        onClick={onOpen}
        className={clsx(
          'w-full text-left px-4 py-3 border-b border-[#e3e9e5] hover:bg-[#f4f6f3] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0e7c86]',
          selected && 'bg-[#eaf2ee]',
          t.flags.sos && 'border-l-4 border-l-[#d92d20]',
        )}
      >
        <div className="flex items-center gap-2">
          <span className={clsx('w-2.5 h-2.5 shrink-0', t.kind === 'company' ? 'rounded-[2px]' : 'rounded-full', TONE_DOT[tone])} aria-hidden />
          <span className="font-semibold text-[#13241b]">{t.vehicle.plate ?? 'No plate'}</span>
          <span className="text-sm text-[#5e7266] truncate">{t.driver.name ?? ''}</span>
          {t.flags.sos && <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-white bg-[#d92d20] rounded px-1.5 py-0.5">SOS</span>}
          {!t.flags.sos && t.flags.no_gps && <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-[#8a5a12] bg-[#fdf3e1] rounded px-1.5 py-0.5">No GPS</span>}
        </div>
        <p className="text-sm text-[#3d4f45] mt-1 truncate">
          {t.origin ?? '?'} <span className="text-[#8a9b91]">→</span> {t.destination ?? '?'}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#5e7266] tabular-nums">
          <span>{t.kind === 'company' ? t.company ?? 'Company' : 'Independent'}</span>
          <span>{t.passengers.waiting} waiting · {t.passengers.on_board} on board · {t.passengers.dropped_off} out</span>
          {t.eta && <span>Arrives {format(new Date(t.eta), 'h:mm a')}</span>}
        </div>
      </button>
    </li>
  )
}

// How each past trip ended, at a glance - so a trip can be traced back
// (product owner, 2026-10-15).
const TRIP_STATE: Record<string, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  completed: { label: 'Completed', icon: CheckCircle2, tone: 'text-[#1d754c]' },
  cancelled: { label: 'Cancelled', icon: XCircle, tone: 'text-[#c0392b]' },
  expired: { label: 'Expired', icon: Clock3, tone: 'text-[#b7791f]' },
  upcoming: { label: 'Booked', icon: CalendarClock, tone: 'text-[#0e7c86]' },
  available: { label: 'Booked', icon: CalendarClock, tone: 'text-[#0e7c86]' },
  full: { label: 'Booked', icon: CalendarClock, tone: 'text-[#0e7c86]' },
}

const STATUS_CHIPS: { value: TripStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
  { value: 'booked', label: 'Booked' },
]

function PastRow({ t, selected, onOpen }: { t: RecentTrip; selected: boolean; onOpen: () => void }) {
  const state = TRIP_STATE[t.status] ?? { label: t.status, icon: Clock3, tone: 'text-[#5e7266]' }
  const Icon = state.icon
  return (
    <li>
      <button
        onClick={onOpen}
        className={clsx(
          'w-full text-left px-4 py-3 border-b border-[#e3e9e5] hover:bg-[#f4f6f3] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0e7c86]',
          selected && 'bg-[#eaf2ee]',
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={clsx('shrink-0', state.tone)} aria-label={state.label} />
          <span className="font-semibold text-[#13241b]">{t.vehicle.plate ?? 'No plate'}</span>
          <span className="text-sm text-[#5e7266] truncate">{t.driver.name ?? ''}</span>
          {!t.has_unconfirmed_passengers && (
            <span className={clsx('ml-auto text-[11px] font-semibold', state.tone)}>{state.label}</span>
          )}
          {t.has_unconfirmed_passengers && (
            <span className="ml-auto text-[11px] font-semibold text-[#9a3412] bg-[#fff1e8] rounded px-1.5 py-0.5">
              Unconfirmed arrival
            </span>
          )}
        </div>
        <p className="text-sm text-[#3d4f45] mt-1 truncate">
          {t.origin ?? '?'} <span className="text-[#8a9b91]">→</span> {t.destination ?? '?'}
        </p>
        <p className="text-xs text-[#5e7266] mt-1.5">
          {t.kind === 'company' ? t.company ?? 'Company' : 'Independent'}
          {t.ended_at
            ? <> · ended {format(new Date(t.ended_at), 'EEE d MMM, h:mm a')}</>
            : t.departure_at && <> · leaves {format(new Date(t.departure_at), 'EEE d MMM, h:mm a')}</>}
          {typeof t.booked_seats === 'number' && <> · {t.booked_seats} booked</>}
        </p>
      </button>
    </li>
  )
}

export function OpsBoard() {
  const navigate = useNavigate()
  const staff = opsSession.staff()
  const [tab, setTab] = useState<Tab>('live')
  const [kind, setKind] = useState<Kind>('all')
  const [query, setQuery] = useState('')
  const [days, setDays] = useState<number | 'custom'>(7)
  const [status, setStatus] = useState<TripStatusFilter>('all')
  // A picked range: 30 days at most, nothing older than 90 days back - the
  // backend refuses wider, so the list stays quick (2026-10-15).
  const today = format(new Date(), 'yyyy-MM-dd')
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [to, setTo] = useState(today)
  const earliest = format(subDays(new Date(), 90), 'yyyy-MM-dd')
  const latest = format(addDays(new Date(), 30), 'yyyy-MM-dd')
  const custom = days === 'custom'
  const [selected, setSelected] = useState<string | null>(null)
  const q = useDebounced(query.trim())

  useEffect(() => {
    document.title = 'Soole Ops'
  }, [])

  // Full screen for a wall display or a second monitor.
  const [fullScreen, setFullScreen] = useState(false)
  useEffect(() => {
    const sync = () => setFullScreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  const canFullScreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen
  function toggleFullScreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }

  const live = useQuery({
    queryKey: ['ops-live', kind, q],
    queryFn: () => opsApi.liveTrips({ kind, q }),
    refetchInterval: LIVE_EVERY,
    staleTime: 0,
  })

  const past = useQuery({
    queryKey: ['ops-past', kind, q, days, status, custom ? from : '', custom ? to : ''],
    queryFn: () =>
      opsApi.recentTrips({
        kind,
        q,
        status,
        days: custom ? undefined : days,
        from: custom ? from : undefined,
        to: custom ? to : undefined,
      }),
    enabled: tab === 'past',
    staleTime: 30_000,
  })

  const isLiveTrip = !!selected && !!live.data?.some(t => t.trip_uuid === selected)

  const detail = useQuery({
    queryKey: ['ops-trip', selected],
    queryFn: () => opsApi.trip(selected!),
    enabled: !!selected,
    refetchInterval: isLiveTrip ? LIVE_EVERY : false,
    staleTime: 0,
  })

  const trail = useQuery({
    queryKey: ['ops-trail', selected],
    queryFn: () => opsApi.trail(selected!),
    enabled: !!selected,
    refetchInterval: isLiveTrip ? 30_000 : false,
    staleTime: 0,
  })

  const liveTrips = useMemo(
    () => [...(live.data ?? [])].sort((a, b) => rank(a) - rank(b)),
    [live.data],
  )
  const sos = liveTrips.filter(t => t.flags.sos).length
  const noGps = liveTrips.filter(t => t.flags.no_gps).length

  const open = useCallback((uuid: string) => setSelected(uuid), [])

  const [menu, setMenu] = useState<'alerts' | 'me' | null>(null)
  const alerts = liveTrips.filter(t => t.flags.sos || t.flags.no_gps)
  const who = staff?.name || staff?.email || 'Soole staff'
  const initials = who.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('')
  const refreshing = live.isFetching || past.isFetching
  function refresh() {
    void live.refetch()
    void past.refetch()
  }

  function signOut() {
    opsSession.clear()
    navigate('/login', { replace: true })
  }

  const listError = (tab === 'live' ? live.error : past.error) as Error | null
  const listLoading = tab === 'live' ? live.isLoading : past.isLoading

  return (
    <div className="h-[100dvh] flex flex-col bg-[#f4f6f3] text-[#13241b]">
      <header className="bg-[#0f1d16] text-[#e8efe9] px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 mr-2">
          <img src="/soole-icon.png" alt="" className="w-8 h-8 rounded-lg bg-[#254832] p-0.5 object-contain" />
          <span className="font-semibold">Soole Live Map</span>
        </div>

        <nav className="flex rounded-lg bg-[#172a20] p-0.5" aria-label="View">
          {(['live', 'past'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(null) }}
              aria-pressed={tab === t}
              className={clsx(
                'px-3 h-8 rounded-md text-sm font-medium',
                tab === t ? 'bg-[#e8efe9] text-[#0f1d16]' : 'text-[#b9c9bf] hover:text-white',
              )}
            >
              {t === 'live' ? 'Live' : 'Past trips'}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="rounded-full bg-[#172a20] px-2.5 py-1">{liveTrips.length} live</span>
          {sos > 0 && <span className="rounded-full bg-[#d92d20] text-white font-semibold px-2.5 py-1">{sos} SOS</span>}
          {noGps > 0 && <span className="rounded-full bg-[#5a4317] text-[#ffd98f] px-2.5 py-1">{noGps} no GPS</span>}
        </div>

        <div className="relative flex items-center gap-2 ml-auto">
          {/* As on the company dashboard: refresh, alerts, and you. */}
          <button
            onClick={refresh}
            title="Refresh"
            aria-label="Refresh"
            className="w-8 h-8 grid place-items-center rounded-full text-[#b9c9bf] hover:text-white hover:bg-[#172a20]"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : undefined} />
          </button>
          <button
            onClick={() => setMenu(m => (m === 'alerts' ? null : 'alerts'))}
            title="Alerts"
            aria-label={`Alerts: ${alerts.length}`}
            aria-expanded={menu === 'alerts'}
            className="relative w-8 h-8 grid place-items-center rounded-full text-[#b9c9bf] hover:text-white hover:bg-[#172a20]"
          >
            <Bell size={16} />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#d92d20] text-white text-[10px] font-semibold grid place-items-center tabular-nums">
                {alerts.length}
              </span>
            )}
          </button>
          {canFullScreen && (
            <button
              onClick={toggleFullScreen}
              className="h-8 px-2.5 rounded-md text-sm inline-flex items-center gap-1.5 text-[#b9c9bf] hover:text-white hover:bg-[#172a20]"
            >
              {fullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {fullScreen ? 'Exit full screen' : 'Full screen'}
            </button>
          )}
          <button
            onClick={() => setMenu(m => (m === 'me' ? null : 'me'))}
            title={who}
            aria-label="Your account"
            aria-expanded={menu === 'me'}
            className="w-8 h-8 grid place-items-center rounded-full bg-[#a7c957] text-[#0f1d16] text-xs font-semibold"
          >
            {initials || 'S'}
          </button>

          {menu === 'alerts' && (
            <div className="absolute right-0 top-10 z-50 w-72 rounded-xl bg-white text-[#13241b] shadow-xl overflow-hidden">
              <p className="px-4 py-2.5 text-xs font-semibold text-[#5e7266] border-b border-[#e3e9e5]">Alerts on live trips</p>
              {alerts.length === 0 ? (
                <p className="px-4 py-4 text-sm text-[#5e7266]">No SOS and no lost GPS right now.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {alerts.map(t => (
                    <li key={t.trip_uuid}>
                      <button
                        onClick={() => { setTab('live'); open(t.trip_uuid); setMenu(null) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#f3f6f4] flex items-start gap-2"
                      >
                        <span className={clsx('mt-1 w-2 h-2 rounded-full shrink-0', t.flags.sos ? 'bg-[#d92d20]' : 'bg-[#b7791f]')} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{t.flags.sos ? 'SOS open' : 'No GPS 10+ min'}</span>
                          <span className="block text-xs text-[#5e7266] truncate">
                            {t.vehicle.plate ?? 'No plate'} · {t.driver.name ?? 'Driver'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {menu === 'me' && (
            <div className="absolute right-0 top-10 z-50 w-64 rounded-xl bg-white text-[#13241b] shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e3e9e5]">
                <p className="text-sm font-semibold truncate">{staff?.name || 'Soole staff'}</p>
                {staff?.email && <p className="text-xs text-[#5e7266] truncate">{staff.email}</p>}
                <p className="text-xs text-[#5e7266] mt-0.5">{staff?.is_superuser ? 'Soole admin' : 'Soole staff'}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2.5 text-sm inline-flex items-center gap-2 text-[#a8231a] hover:bg-[#fdf1f0]"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <section className="lg:w-[360px] lg:shrink-0 flex flex-col min-h-0 h-[45%] lg:h-auto bg-white border-r border-[#dce3de] order-2 lg:order-1">
          <div className="p-3 border-b border-[#e3e9e5] flex flex-col gap-2">
            <label className="relative">
              <span className="sr-only">Search</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9b91]" />
              <input
                id="ops-search"
                value={query} maxLength={60}
                onChange={e => setQuery(e.target.value)}
                placeholder="Plate, driver, passenger or place"
                className="h-9 w-full rounded-lg border border-[#dce3de] pl-9 pr-3 text-sm outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86]/20"
              />
            </label>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-[#dce3de] p-0.5 text-xs" role="group" aria-label="Trip type">
                {(['all', 'company', 'independent'] as Kind[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={clsx(
                      'px-2.5 h-7 rounded-md font-medium',
                      kind === k ? 'bg-[#13241b] text-white' : 'text-[#3d4f45] hover:bg-[#f4f6f3]',
                    )}
                  >
                    {k === 'all' ? 'All' : k === 'company' ? 'Company' : 'Independent'}
                  </button>
                ))}
              </div>
              {tab === 'past' && (
                <select
                  id="ops-days"
                  value={days}
                  onChange={e => setDays(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                  aria-label="How far back"
                  className="ml-auto h-8 rounded-lg border border-[#dce3de] text-xs px-2 bg-white"
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value="custom">Pick dates…</option>
                </select>
              )}
            </div>
            {tab === 'past' && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Trip status">
                {STATUS_CHIPS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setStatus(c.value)}
                    aria-pressed={status === c.value}
                    className={clsx(
                      'h-7 px-2.5 rounded-md text-xs font-medium border',
                      status === c.value
                        ? 'bg-[#13241b] text-white border-[#13241b]'
                        : 'bg-white text-[#3d4f45] border-[#dce3de] hover:bg-[#f4f6f3]',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {tab === 'past' && custom && (
              <div className="flex items-end gap-2 text-xs">
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[#5e7266]">From</span>
                  <input
                    id="ops-from"
                    type="date"
                    value={from}
                    min={[earliest, format(subDays(new Date(to), 29), 'yyyy-MM-dd')].sort().pop()}
                    max={to}
                    onChange={e => e.target.value && setFrom(e.target.value)}
                    className="h-8 rounded-lg border border-[#dce3de] px-2 bg-white"
                  />
                </label>
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[#5e7266]">To</span>
                  <input
                    id="ops-to"
                    type="date"
                    value={to}
                    min={from}
                    max={[latest, format(addDays(new Date(from), 29), 'yyyy-MM-dd')].sort()[0]}
                    onChange={e => e.target.value && setTo(e.target.value)}
                    className="h-8 rounded-lg border border-[#dce3de] px-2 bg-white"
                  />
                </label>
              </div>
            )}
            {tab === 'past' && custom && (
              <p className="text-[11px] text-[#8a9b91] -mt-1">Up to 30 days at a time, back to {format(new Date(earliest), 'd MMM')}.</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {listError && <p className="p-4 text-sm text-[#a8231a]">{listError.message}</p>}
            {listLoading && <p className="p-4 text-sm text-[#5e7266]">Loading…</p>}
            {tab === 'live' && !live.isLoading && liveTrips.length === 0 && !live.error && (
              <p className="p-4 text-sm text-[#5e7266]">No trips are in progress right now.</p>
            )}
            {tab === 'past' && past.data && past.data.length === 0 && (
              <p className="p-4 text-sm text-[#5e7266]">No trips match these filters.</p>
            )}
            <ul>
              {tab === 'live'
                ? liveTrips.map(t => (
                    <LiveRow key={t.trip_uuid} t={t} selected={t.trip_uuid === selected} onOpen={() => open(t.trip_uuid)} />
                  ))
                : (past.data ?? []).map(t => (
                    <PastRow key={t.trip_uuid} t={t} selected={t.trip_uuid === selected} onOpen={() => open(t.trip_uuid)} />
                  ))}
            </ul>
          </div>
          {tab === 'live' && live.dataUpdatedAt > 0 && (
            <p className="px-4 py-2 text-[11px] text-[#8a9b91] border-t border-[#e3e9e5]">
              Updated {formatDistanceToNowStrict(live.dataUpdatedAt)} ago · refreshes every 15 seconds
            </p>
          )}
        </section>

        <section className="relative flex-1 min-h-0 order-1 lg:order-2">
          <OpsMap
            trips={tab === 'live' ? liveTrips : []}
            selectedUuid={selected}
            detail={detail.data ?? null}
            trail={trail.data ?? []}
            onSelect={open}
          />
          {selected && (
            <div className="fixed inset-0 z-20 lg:absolute lg:inset-auto lg:top-0 lg:right-0 lg:bottom-0 lg:w-[420px] shadow-xl">
              <TripPanel
                trip={detail.data ?? null}
                loading={detail.isLoading}
                error={detail.error ? (detail.error as Error).message : null}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { ChevronDown, History } from 'lucide-react'
import { clsx } from 'clsx'
import { useOrg } from '../../../lib/OrgContext'
import { auditApi } from '../../../api/client'
import { formatDateTime } from '../../../lib/formatters'

interface AuditLogEntry {
  uuid: string
  action: string
  entity_type: string | null
  entity_id: string | null
  before: Record<string, any> | null
  after: Record<string, any> | null
  created_at: string
  actor_id: string | null
  actor_name: string
}

function actionLabel(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function AuditLogSettings() {
  const { orgUuid } = useOrg()
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!orgUuid) return
    let cancelled = false
    setLoading(true)
    auditApi.getAuditLog(orgUuid, 100)
      .then(res => { if (!cancelled) setEntries(res) })
      .catch((err: any) => { if (!cancelled) setError(err?.message ?? 'Failed to load activity log') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [orgUuid])

  if (loading) {
    return <p className="text-xs text-neutral-200 py-4 text-center">Loading activity…</p>
  }

  if (error) {
    return <p className="text-xs text-danger py-4 text-center">{error}</p>
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <History className="w-8 h-8 text-neutral-100 mx-auto mb-2" />
        <p className="text-xs text-neutral-200">No activity recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 max-h-[28rem] overflow-y-auto">
      {entries.map(entry => {
        const isOpen = expandedId === entry.uuid
        const hasDetail = entry.before || entry.after
        return (
          <div key={entry.uuid} className="border border-neutral-50 rounded-xl overflow-hidden">
            <button
              onClick={() => hasDetail && setExpandedId(isOpen ? null : entry.uuid)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                hasDetail && 'hover:bg-primary-75/30 cursor-pointer',
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-black truncate">{actionLabel(entry.action)}</p>
                <p className="text-[11px] text-neutral-200 truncate">
                  {entry.actor_name} · {formatDateTime(entry.created_at)}
                  {entry.entity_type && <> · {entry.entity_type}</>}
                </p>
              </div>
              {hasDetail && (
                <ChevronDown className={clsx('w-3.5 h-3.5 flex-shrink-0 text-neutral-100 transition-transform', isOpen && 'rotate-180')} />
              )}
            </button>
            {isOpen && hasDetail && (
              <div className="px-3 pb-3 pt-1 bg-neutral-50/50 border-t border-neutral-50 space-y-1.5">
                {entry.before && (
                  <div className="text-[11px]">
                    <span className="font-semibold text-neutral-300">Before: </span>
                    <span className="text-neutral-200 break-all">{JSON.stringify(entry.before)}</span>
                  </div>
                )}
                {entry.after && (
                  <div className="text-[11px]">
                    <span className="font-semibold text-neutral-300">After: </span>
                    <span className="text-neutral-200 break-all">{JSON.stringify(entry.after)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

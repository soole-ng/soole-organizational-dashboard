export function formatMoney(amount: number): string {
  return `NGN ${amount.toLocaleString('en-NG')}`
}

export function formatMoneyCompact(amount: number): string {
  if (amount >= 1_000_000) return `NGN ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `NGN ${(amount / 1_000).toFixed(1)}K`
  return `NGN ${amount.toLocaleString('en-NG')}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = d.getTime() - now.getTime()
  const mins = Math.round(diff / 60000)
  const hours = Math.round(diff / 3600000)

  if (Math.abs(mins) < 1) return 'Just now'
  if (mins > 0) {
    if (mins < 60) return `In ${mins} min`
    if (hours < 24) return `In ${hours}h`
    return `Tomorrow ${formatTime(dateStr)}`
  } else {
    if (Math.abs(mins) < 60) return `${Math.abs(mins)} min ago`
    if (Math.abs(hours) < 24) return `${Math.abs(hours)}h ago`
    return formatDate(dateStr)
  }
}

export function formatOccupancy(booked: number, capacity: number): string {
  return `${booked}/${capacity}`
}

export function formatOccupancyPct(booked: number, capacity: number): number {
  return Math.round((booked / capacity) * 100)
}

// `rate` should always be the org's real commission_rate (see
// OrgContext/useOrg) - the default here is only a fallback matching
// settings.SOOLE_FEE_PERCENTAGE's backend default, never a value to rely on.
export function commissionAmount(gross: number, rate = 0.1): number {
  return Math.round(gross * rate)
}

export function netAmount(gross: number, rate = 0.1): number {
  return gross - commissionAmount(gross, rate)
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('en-NG')} km`
}

export function formatSpeed(kph: number): string {
  return `${kph} km/h`
}

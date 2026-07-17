/**
 * OrgContext — stores organization profile data.
 * Organizations can set their own logo & name in Settings.
 * The Soole platform logo is shown separately (powered by).
 */
import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { orgApi, settingsApi, authApi } from '../api/client'

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  isPrimary: boolean
}

/** Matches organization.models.OrgMemberRole's real values. */
export type OrgRole = 'owner' | 'finance' | 'manager' | 'viewer'

interface OrgProfile {
  name: string
  logoUrl: string | null   // org's own uploaded logo
  /** The signed-in user's real role in this org, fetched from GET /organizations/{org_uuid}/members/. */
  role: OrgRole
  commissionPct: number
  email?: string
  phone?: string
  bankAccounts?: BankAccount[]
  isBalanceHidden?: boolean
  approvalStatus?: 'incomplete' | 'pending' | 'approved'
  verificationStatus?: 'incomplete' | 'complete'  // Whether owner completed NIN/DOB/RC/CAC verification
  registrationDetails?: {
    firstName?: string
    lastName?: string
    phone?: string
    dob?: string
    nin?: string
    companyName?: string
    companyRegNum?: string
    numCars?: string
    numDrivers?: string
    cacDocumentUrl?: string
  }
}

interface OrgContextValue {
  org: OrgProfile
  orgUuid: string | null
  updateOrg: (patch: Partial<OrgProfile>) => void
  guardAction: (e?: React.SyntheticEvent, callback?: () => void) => boolean
}

// Deliberately no fake company name/email/phone/security-answers here -
// those used to be hardcoded ("Speedway Transport", "Ojota", etc.) and were
// shown to users as if they were their own saved data before anything had
// actually loaded from the backend.
const DEFAULT_ORG: OrgProfile = {
  name: '',
  logoUrl: null,
  role: 'viewer',
  // Fallback only, used before GET /organizations/mine/ resolves (or if it
  // fails) - matches settings.SOOLE_FEE_PERCENTAGE's real backend default.
  // The real, authoritative value always comes from primary.commission_rate.
  commissionPct: 10,
  bankAccounts: [],
  isBalanceHidden: false,
  // Keep both statuses as undefined on first load so banners don't flash
  // before the real API data has arrived — they're only set by the effect below.
  approvalStatus: undefined,
  verificationStatus: undefined
}

const OrgContext = createContext<OrgContextValue>({
  org: DEFAULT_ORG,
  orgUuid: null,
  updateOrg: () => {},
  guardAction: () => true
})

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<OrgProfile>(() => {
    try {
      const saved = localStorage.getItem('soole_org_profile')
      // Restore cached profile but clear statuses — they'll be re-verified
      // from the API on mount. Keeping stale statuses in cache was causing
      // the 'pending' / 'incomplete' banners to flash on every open even
      // after the org had been approved, until the effect below completed.
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_ORG, ...parsed, approvalStatus: undefined, verificationStatus: undefined }
      }
      return DEFAULT_ORG
    } catch {
      return DEFAULT_ORG
    }
  })

  const [orgUuid, setOrgUuid] = useState<string | null>(() => localStorage.getItem('org_uuid'))

  const updateOrg = useCallback((patch: Partial<OrgProfile>) => {
    setOrg(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem('soole_org_profile', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Bootstrap the real org profile (role, approval/verification status,
  // settings) from the backend on every mount - not gated on orgUuid
  // already being known.
  useEffect(() => {
    if (!localStorage.getItem('auth_token')) return
    let cancelled = false

    orgApi.getMine()
      .then(async (orgs) => {
        if (cancelled || !orgs || orgs.length === 0) return
        const primary = orgs[0]
        localStorage.setItem('org_uuid', primary.uuid)
        setOrgUuid(primary.uuid)

        const verificationStatus = primary.verification_status
          ? (primary.verification_status as 'incomplete' | 'complete')
          : (primary.rc_number ? 'complete' : 'incomplete')

        // verificationStatus is checked FIRST. The backend sets
        // approval_status='pending' by default for every new org at signup -
        // before they've submitted NIN/RC/CAC. If we read that value first,
        // a brand-new org that hasn't submitted anything at all would show
        // the 'pending approval' banner instead of 'complete your profile'.
        const approvalStatus: 'incomplete' | 'pending' | 'approved' =
          verificationStatus === 'incomplete'
            ? 'incomplete'
            : primary.approval_status === 'approved'
            ? 'approved'
            : 'pending'

        let name = primary.name
        let logoUrl = primary.logo_url ?? null
        let email = undefined
        let phone = undefined

        try {
          const settings = await settingsApi.getSettings(primary.uuid) as any
          if (!cancelled) {
            name = settings.name ?? primary.name
            logoUrl = settings.logo_url ?? primary.logo_url ?? null
            email = settings.contact_email ?? undefined
            phone = settings.contact_phone ?? undefined
          }
        } catch {
          // Settings fetch failing shouldn't block org_uuid bootstrap
        }

        let role = DEFAULT_ORG.role
        try {
          const [currentUser, members] = await Promise.all([
            authApi.getCurrentUser(),
            settingsApi.getMembers(primary.uuid) as Promise<any[]>,
          ])
          if (!cancelled) {
            const myMembership = members.find(m => m.user_uuid === currentUser.uuid)
            if (myMembership) {
              role = myMembership.role as OrgRole
            }
          }
        } catch {
          // Role fetch failing shouldn't block org_uuid bootstrap - default
          // role stays 'viewer' (the safest/most restrictive fallback)
        }

        // Sync the backend's authoritative submission timestamp into localStorage
        // so the 48hr countdown in AppShell works on any device, not just the
        // one where the form was originally submitted.
        if (primary.verification_submitted_at) {
          const ms = new Date(primary.verification_submitted_at).getTime()
          if (!isNaN(ms)) {
            localStorage.setItem('soole_verification_submitted_at', String(ms))
          }
        }

        if (cancelled) return

        updateOrg({
          name,
          logoUrl,
          role,
          commissionPct: typeof primary.commission_rate === 'number'
            ? primary.commission_rate * 100
            : DEFAULT_ORG.commissionPct,
          approvalStatus,
          verificationStatus,
          email,
          phone,
        })
      })
      .catch(() => {
        // No orgs yet / not authenticated — leave org_uuid unset, guarded pages will handle it
      })

    return () => { cancelled = true }
  }, [updateOrg])

  const guardAction = useCallback((e?: React.SyntheticEvent, callback?: () => void) => {
    // Reads `org` directly from closure instead of going through setOrg's
    // updater - setOrg is async/deferred in React 18, so a synchronous
    // `allowed` flag set inside the updater was always still `true` by the
    // time it was read below, making this check a permanent no-op.
    if (org.approvalStatus === 'incomplete') {
      if (e) e.preventDefault()
      window.dispatchEvent(new Event('require-profile-completion'))
      return false
    }
    if (org.approvalStatus === 'pending') {
      if (e) e.preventDefault()
      window.dispatchEvent(new CustomEvent('require-approval-toast', { detail: 'Your account is pending approval. You are currently in read-only mode.' }))
      return false
    }
    if (callback) callback()
    return true
  }, [org.approvalStatus])

  // Unmemoized, this was a new object every OrgProvider render, forcing
  // every one of the 25+ useOrg() consumers app-wide to re-render on any
  // state change here (e.g. isBalanceHidden toggling), not just the ones
  // that actually depend on the field that changed.
  const value = useMemo(
    () => ({ org, orgUuid, updateOrg, guardAction }),
    [org, orgUuid, updateOrg, guardAction],
  )

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  return useContext(OrgContext)
}

/** Returns initials from org name for fallback avatar */
export function orgInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * OrgContext — stores organization profile data.
 * Organizations can set their own logo & name in Settings.
 * The Soole platform logo is shown separately (powered by).
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
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
  approvalStatus: 'approved',
  verificationStatus: 'incomplete'
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
      return saved ? { ...DEFAULT_ORG, ...JSON.parse(saved) } : DEFAULT_ORG
    } catch {
      return DEFAULT_ORG
    }
  })

  const [orgUuid, setOrgUuid] = useState<string | null>(() => localStorage.getItem('org_uuid'))

  // Bootstrap the real org profile (role, approval/verification status,
  // settings) from the backend on every mount - not gated on orgUuid
  // already being known. role/approvalStatus/verificationStatus are never
  // persisted to localStorage['soole_org_profile'] (only updateOrg() persists,
  // and this effect intentionally bypasses it so stale cached values can't
  // shadow the backend's current truth) - so skipping this fetch just
  // because orgUuid was already cached from a prior session left `org.role`
  // (and approval/verification status) permanently stuck at DEFAULT_ORG's
  // fallback values after the very first page load.
  useEffect(() => {
    if (!localStorage.getItem('auth_token')) return
    let cancelled = false

    orgApi.getMine()
      .then(async (orgs) => {
        if (cancelled || !orgs || orgs.length === 0) return
        const primary = orgs[0]
        localStorage.setItem('org_uuid', primary.uuid)
        setOrgUuid(primary.uuid)
        setOrg(prev => ({
          ...prev,
          approvalStatus: primary.verification_status === 'incomplete'
            ? 'incomplete'
            : primary.approval_status === 'approved' ? 'approved' : 'pending',
          verificationStatus: primary.verification_status as 'incomplete' | 'complete',
          // commission_rate is a 0-1 fraction (e.g. 0.1) from the backend's
          // OrgResponseSchema - commissionPct stores it as a whole percent
          // (10). Previously this field was never populated from the
          // real API response at all, so it stayed stuck at DEFAULT_ORG's
          // hardcoded fallback (8) everywhere it was read.
          commissionPct: typeof primary.commission_rate === 'number'
            ? primary.commission_rate * 100
            : prev.commissionPct,
        }))

        try {
          const settings = await settingsApi.getSettings(primary.uuid) as any
          if (cancelled) return
          setOrg(prev => ({
            ...prev,
            name: settings.name ?? primary.name,
            logoUrl: settings.logo_url ?? primary.logo_url ?? null,
            email: settings.contact_email ?? undefined,
            phone: settings.contact_phone ?? undefined,
          }))
        } catch {
          // Settings fetch failing shouldn't block org_uuid bootstrap
        }

        try {
          const [currentUser, members] = await Promise.all([
            authApi.getCurrentUser(),
            settingsApi.getMembers(primary.uuid) as Promise<any[]>,
          ])
          if (cancelled) return
          const myMembership = members.find(m => m.user_uuid === currentUser.uuid)
          if (myMembership) {
            setOrg(prev => ({ ...prev, role: myMembership.role as OrgRole }))
          }
        } catch {
          // Role fetch failing shouldn't block org_uuid bootstrap - default
          // role stays 'viewer' (the safest/most restrictive fallback)
        }
      })
      .catch(() => {
        // No orgs yet / not authenticated — leave org_uuid unset, guarded pages will handle it
      })

    return () => { cancelled = true }
  }, [])

  const updateOrg = useCallback((patch: Partial<OrgProfile>) => {
    setOrg(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem('soole_org_profile', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

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

  return (
    <OrgContext.Provider value={{ org, orgUuid, updateOrg, guardAction }}>
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

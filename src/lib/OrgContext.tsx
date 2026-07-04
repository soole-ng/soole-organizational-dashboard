/**
 * OrgContext — stores organization profile data.
 * Organizations can set their own logo & name in Settings.
 * The Soole platform logo is shown separately (powered by).
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { orgApi, settingsApi } from '../api/client'

export interface SecurityQuestion {
  question: string
  answer: string
}

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  isPrimary: boolean
}

interface OrgProfile {
  name: string
  logoUrl: string | null   // org's own uploaded logo
  role: string
  activeRole: 'admin' | 'dispatcher' | 'finance'
  commissionPct: number
  email?: string
  phone?: string
  securityQuestions?: SecurityQuestion[]
  bankAccounts?: BankAccount[]
  isBalanceHidden?: boolean
  isNewUser?: boolean
  approvalStatus?: 'incomplete' | 'pending' | 'approved'
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

const DEFAULT_ORG: OrgProfile = {
  name: 'Speedway Transport',
  logoUrl: null,
  role: 'Owner',
  activeRole: 'admin',
  commissionPct: 8,
  email: 'contact@speedway.ng',
  phone: '+234 803 123 4567',
  securityQuestions: [
    { question: 'What is your favourite food?', answer: 'Ojota' },
    { question: 'What was the name of your first school?', answer: 'Lagos Primary' },
    { question: 'What is your mother\'s maiden name?', answer: 'Alabi' },
  ],
  bankAccounts: [],
  isBalanceHidden: false,
  isNewUser: false,
  approvalStatus: 'approved'
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

  // Bootstrap the real org_uuid + profile from the backend on first load.
  useEffect(() => {
    if (orgUuid || !localStorage.getItem('auth_token')) return
    let cancelled = false

    orgApi.getMine()
      .then(async (orgs) => {
        if (cancelled || !orgs || orgs.length === 0) return
        const primary = orgs[0]
        localStorage.setItem('org_uuid', primary.uuid)
        setOrgUuid(primary.uuid)

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
      })
      .catch(() => {
        // No orgs yet / not authenticated — leave org_uuid unset, guarded pages will handle it
      })

    return () => { cancelled = true }
  }, [orgUuid])

  const updateOrg = useCallback((patch: Partial<OrgProfile>) => {
    setOrg(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem('soole_org_profile', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const guardAction = useCallback((e?: React.SyntheticEvent, callback?: () => void) => {
    let allowed = true
    setOrg(currentOrg => {
      if (currentOrg.approvalStatus === 'incomplete') {
        if (e) e.preventDefault()
        window.dispatchEvent(new Event('require-profile-completion'))
        allowed = false
      } else if (currentOrg.approvalStatus === 'pending') {
        if (e) e.preventDefault()
        window.dispatchEvent(new CustomEvent('require-approval-toast', { detail: 'Your account is pending approval. You are currently in read-only mode.' }))
        allowed = false
      }
      return currentOrg
    })
    if (allowed && callback) callback()
    return allowed
  }, [])

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

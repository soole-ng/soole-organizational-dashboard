/**
 * OrgContext — stores organization profile data.
 * Organizations can set their own logo & name in Settings.
 * The Soole platform logo is shown separately (powered by).
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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
  commissionPct: number
  email?: string
  phone?: string
  securityQuestions?: SecurityQuestion[]
  bankAccounts?: BankAccount[]
  isBalanceHidden?: boolean
}

interface OrgContextValue {
  org: OrgProfile
  updateOrg: (patch: Partial<OrgProfile>) => void
}

const DEFAULT_ORG: OrgProfile = {
  name: 'Speedway Transport',
  logoUrl: null,
  role: 'Owner',
  commissionPct: 8,
  email: 'contact@speedway.ng',
  phone: '+234 803 123 4567',
  securityQuestions: [
    { question: 'What is your favourite food?', answer: 'Ojota' },
    { question: 'What was the name of your first school?', answer: 'Lagos Primary' },
    { question: 'What is your mother\'s maiden name?', answer: 'Alabi' },
  ],
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'Guaranty Trust Bank (GTB)',
      accountName: 'Speedway Transport Limited',
      accountNumber: '0123456789',
      isPrimary: true
    }
  ],
  isBalanceHidden: false
}

const OrgContext = createContext<OrgContextValue>({
  org: DEFAULT_ORG,
  updateOrg: () => {},
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

  const updateOrg = useCallback((patch: Partial<OrgProfile>) => {
    setOrg(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem('soole_org_profile', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return (
    <OrgContext.Provider value={{ org, updateOrg }}>
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

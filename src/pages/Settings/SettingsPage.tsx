import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Wallet, Bell, RefreshCw, HelpCircle, ChevronRight, AlertTriangle, FileText, ShieldCheck } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { useApiData } from '../../lib/useApiData'
import { settingsApi, authApi } from '../../api/client'
import { clsx } from 'clsx'
import { useOrg } from '../../lib/OrgContext'
import toast from 'react-hot-toast'

import { BusinessProfile } from './components/BusinessProfile'
import { OrganizationTeam } from './components/OrganizationTeam'
import { AlertSettings } from './components/AlertSettings'
import { NotificationSettings } from './components/NotificationSettings'
import { PayoutSettings } from './components/PayoutSettings'
import { SecuritySettings } from './components/SecuritySettings'
import { CompleteProfileSection } from './components/CompleteProfileSection'

export function SettingsPage() {
  const { org, updateOrg, guardAction, orgUuid } = useOrg()
  const { data } = useApiData()

  const [members, setMembers] = useState<any[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Reset the open accordion whenever the verification status flips to
  // 'complete' — the 'Complete Business Verification' section disappears
  // from the list at that point, but if it was open, activeSection was
  // still set to it, causing the panel to remain visually expanded on the
  // next render until something else closed it.
  useEffect(() => {
    if (org.verificationStatus === 'complete') {
      setActiveSection(prev => prev === 'Complete Business Verification' ? null : prev)
    }
  }, [org.verificationStatus])

  const [speedLimit, setSpeedLimit] = useState(100)
  const [alertChannels, setAlertChannels] = useState({ push: true, sms: true, email: false })

  useEffect(() => {
    if (!orgUuid) return
    settingsApi.getAlertSettings(orgUuid)
      .then(res => {
        setSpeedLimit(res.speed_limit)
        setAlertChannels(prev => ({ ...prev, ...res.alert_channels }))
      })
      .catch(() => {})
  }, [orgUuid])

  const saveAlertSettings = async () => {
    if (!orgUuid) return
    try {
      await settingsApi.updateAlertSettings(orgUuid, { speed_limit: speedLimit, alert_channels: alertChannels })
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save alert settings')
      throw err
    }
  }

  const saveBusinessProfile = async () => {
    if (!orgUuid) return
    try {
      await settingsApi.updateSettings(orgUuid, {
        name: org.name,
        contact_email: org.email,
        contact_phone: org.phone,
        logo_url: org.logoUrl,
      })
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save business profile')
      throw err
    }
  }
  
  // Settings-changing actions require re-entering the account PIN, verified
  // for real against POST /accounts/login/verify-pin (the same PIN used to
  // log in - stored server-side as the user's Django password). This
  // replaced an old "security confirmation" modal that asked for an account
  // password and a secret question but checked neither against anything
  // real: any password was accepted, and the secret answer fell back to a
  // hardcoded default ("Ojota") baked into the shipped frontend bundle.
  const [showPinConfirm, setShowPinConfirm] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [verifyingPin, setVerifyingPin] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const executeSecuredAction = (action: () => void) => {
    guardAction(undefined, () => {
      setPendingAction(() => action)
      setPinValue('')
      setShowPinConfirm(true)
    })
  }

  const closePinConfirm = () => {
    setShowPinConfirm(false)
    setPinValue('')
    setPendingAction(null)
  }

  const handleConfirmPin = async () => {
    if (pinValue.length !== 8) {
      toast.error('Must be your 8-character login password')
      return
    }
    setVerifyingPin(true)
    try {
      await authApi.verifyPin(pinValue)
      pendingAction?.()
      closePinConfirm()
    } catch (err: any) {
      toast.error(err?.message ?? 'Incorrect password')
      setPinValue('')
    } finally {
      setVerifyingPin(false)
    }
  }

  useEffect(() => {
    setMembers(data.organizationMembers || [])
  }, [data.organizationMembers])

  // Pending invites (sent via invite-with-otp but not yet accepted) live on
  // the backend as real OrgInvitation rows - previously this list only
  // ever existed in OrganizationTeam's local React state, so it silently
  // vanished on every refresh with no way to revoke a still-live invite.
  const fetchPendingInvitations = useCallback(() => {
    if (!orgUuid) return
    settingsApi.getPendingInvitations(orgUuid)
      .then(invitations => {
        setPendingInvitations((invitations || []).map(inv => ({
          id: inv.uuid,
          name: inv.name || inv.phone || inv.email || 'Pending invite',
          phone: inv.phone,
          email: inv.email,
          role: inv.role,
          status: 'pending',
          joinedAt: '',
        })))
      })
      .catch(() => setPendingInvitations([]))
  }, [orgUuid])

  useEffect(() => {
    fetchPendingInvitations()
  }, [fetchPendingInvitations])

  const sections = [
    ...(org.verificationStatus === 'incomplete' ? [
      { icon: AlertTriangle, label: 'Complete Business Verification', desc: 'Add NIN, DOB, RC number, and CAC certificate', priority: true }
    ] : []),
    { icon: Building2, label: 'Business Profile', desc: 'Name, logo, contact and public page' },
    // Active members only - pendingInvitations are shown in the team list
    // itself but shouldn't inflate this "N members" count.
    { icon: Users, label: 'Organization Team', desc: `${members.length} members`, badge: members.length },
    { icon: Wallet, label: 'Payout Settings', desc: 'Bank account and payout schedule' },
    { icon: ShieldCheck, label: 'Security Question', desc: 'Required to withdraw funds' },
    { icon: Bell, label: 'Notifications', desc: 'Alerts and notification channels' },
    { icon: AlertTriangle, label: 'Alert Settings', desc: 'Speed limits and custom fleet safety alerts' },
    { icon: RefreshCw, label: 'Refund Policy', desc: 'Set your cancellation and refund rules' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs, chat and contact Soole', to: '/help' },
    { icon: FileText, label: 'Terms & Conditions', desc: 'Terms of service & user agreement', href: 'https://www.soole.ng/privacy-policy' },
  ]

  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Settings" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Settings" subtitle="Organization profile, team and account settings" />

        <div className="card p-0 overflow-hidden divide-y divide-neutral-50">
          {sections.map(({ icon: Icon, label, desc, badge, to, href, priority }: any) => {
            const isOpen = activeSection === label;
            return (
              <div key={label} className="transition-colors hover:bg-primary-75/30">
                <button
                  onClick={() => {
                    if (href) {
                      window.open(href, '_blank', 'noopener,noreferrer')
                    } else if (to) {
                      navigate(to)
                    } else {
                      setActiveSection(isOpen ? null : label)
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary-75 transition-colors text-left focus:outline-none"
                >
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", isOpen ? "bg-primary-500 text-white" : "bg-white text-primary-400")}>
                    <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-500">{label}</p>
                    <p className="text-xs text-neutral-200">{desc}</p>
                  </div>
                  {badge && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary-300 text-white text-[10px] font-bold">
                      {badge}
                    </span>
                  )}
                  {to || href ? (
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-neutral-100" />
                  ) : (
                    <ChevronRight className={clsx('w-4 h-4 flex-shrink-0 transition-transform', isOpen ? 'rotate-90 text-primary-400' : 'text-neutral-100')} />
                  )}
                </button>
                
                {/* Accordion Content */}
                {isOpen && !to && (
                  <div className="px-5 pb-5 pt-4 bg-white border-t border-neutral-100/50">
                    {label === 'Complete Business Verification' && (
                      <CompleteProfileSection
                        orgUuid={orgUuid || ''}
                        verificationStatus={org.verificationStatus as 'incomplete' | 'complete' | undefined}
                        onSuccess={(res) => {
                          updateOrg({
                            verificationStatus: res.verification_status as 'incomplete' | 'complete',
                            approvalStatus: res.approval_status === 'approved' ? 'approved' : 'pending',
                          })
                          setActiveSection(null)
                        }}
                      />
                    )}

                    {label === 'Business Profile' && (
                      <BusinessProfile executeSecuredAction={executeSecuredAction} onSave={saveBusinessProfile} />
                    )}

                    {label === 'Organization Team' && (
                      <OrganizationTeam
                        members={[...members, ...pendingInvitations]}
                        setMembers={setMembers}
                        onInvitationsChanged={fetchPendingInvitations}
                        executeSecuredAction={executeSecuredAction}
                      />
                    )}

                    {label === 'Payout Settings' && (
                      <PayoutSettings />
                    )}

                    {label === 'Security Question' && (
                      <SecuritySettings />
                    )}

                    {label === 'Notifications' && (
                      <NotificationSettings
                        alertChannels={alertChannels}
                        setAlertChannels={setAlertChannels}
                        executeSecuredAction={executeSecuredAction}
                        onSave={saveAlertSettings}
                      />
                    )}

                    {label === 'Alert Settings' && (
                      <AlertSettings
                        speedLimit={speedLimit}
                        setSpeedLimit={setSpeedLimit}
                        executeSecuredAction={executeSecuredAction}
                        onSave={saveAlertSettings}
                      />
                    )}

                    {label === 'Refund Policy' && (
                      <div className="py-6 px-8 text-center max-w-2xl bg-white rounded-2xl border border-primary-100 space-y-3">
                        <RefreshCw className="w-8 h-8 text-primary-500 mx-auto mb-2 animate-spin-slow" />
                        <h4 className="text-xs font-bold text-black uppercase tracking-wider">Refund Policy</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
                          A full refund is guaranteed for any passenger who does not board. 
                          Refunds are processed and credited in less than 2 hours after the vehicle's departure.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PIN Confirmation Modal ── */}
      {showPinConfirm && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={closePinConfirm}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-float flex flex-col p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary-500">Confirm with Password</h3>
                <p className="text-[10px] text-neutral-200">Enter your 8-character login password to continue</p>
              </div>
              <button
                onClick={closePinConfirm}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            <input
              type="password"
              maxLength={8}
              autoFocus
              value={pinValue}
              onChange={e => setPinValue(e.target.value.slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && handleConfirmPin()}
              className="input-field bg-white text-center tracking-[0.5em] text-lg font-black"
              placeholder="••••••••"
            />

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={closePinConfirm}
                className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPin}
                disabled={verifyingPin || pinValue.length !== 8}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-xs font-semibold rounded-xl text-white transition-colors flex items-center justify-center gap-2"
              >
                {verifyingPin ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying…</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

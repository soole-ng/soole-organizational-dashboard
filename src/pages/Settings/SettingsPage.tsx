import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Wallet, Bell, RefreshCw, HelpCircle, ChevronRight, AlertTriangle, FileText } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'
import { useOrg } from '../../lib/OrgContext'
import toast from 'react-hot-toast'

import { BusinessProfile } from './components/BusinessProfile'
import { OrganizationTeam } from './components/OrganizationTeam'
import { SecuritySettings } from './components/SecuritySettings'
import { AlertSettings } from './components/AlertSettings'
import { NotificationSettings } from './components/NotificationSettings'
import { PayoutSettings } from './components/PayoutSettings'

export function SettingsPage() {
  const { org, updateOrg, guardAction } = useOrg()
  const { data } = useMockData()
  
  const [members, setMembers] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [speedLimit, setSpeedLimit] = useState(100)
  const [alertChannels, setAlertChannels] = useState({ push: true, sms: true, email: false })
  
  // Secure Settings Verification States
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmSecretAnswer, setConfirmSecretAnswer] = useState('')
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)

  const activeQuestions = org.securityQuestions || [
    { question: 'What is your favourite food?', answer: 'Ojota' }
  ]
  const activeSecQuestion = activeQuestions[activeQuestionIdx]?.question || 'What is your favourite food?'
  const activeSecAnswer = activeQuestions[activeQuestionIdx]?.answer || 'Ojota'

  const executeSecuredAction = (action: () => void) => {
    guardAction(undefined, () => {
      setPendingAction(() => action)
      const list = org.securityQuestions || []
      if (list.length > 0) {
        setActiveQuestionIdx(Math.floor(Math.random() * list.length))
      }
      setShowSecurityConfirm(true)
    })
  }

  // Initialize members list with phone numbers
  useEffect(() => {
    if (data.organizationMembers) {
      const formatted = data.organizationMembers.map((m: any, idx: number) => ({
        ...m,
        // Make sure we always show their phone number instead of email
        phone: m.phone || `+234 803 111 ${2200 + idx * 11}`
      }))
      setMembers(formatted)
    }
  }, [data.organizationMembers])

  const sections = [
    { icon: Building2, label: 'Business Profile', desc: 'Name, logo, contact and public page' },
    { icon: Users, label: 'Organization Team', desc: `${members.length} members`, badge: members.length },
    { icon: Wallet, label: 'Payout Settings', desc: 'Bank account and payout schedule' },
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
          {sections.map(({ icon: Icon, label, desc, badge, to, href }) => {
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
                    {label === 'Business Profile' && (
                      <BusinessProfile executeSecuredAction={executeSecuredAction} />
                    )}

                    {label === 'Organization Team' && (
                      <OrganizationTeam
                        members={members}
                        setMembers={setMembers}
                        executeSecuredAction={executeSecuredAction}
                      />
                    )}

                    {label === 'Payout Settings' && (
                      <PayoutSettings />
                    )}

                    {label === 'Notifications' && (
                      <NotificationSettings
                        alertChannels={alertChannels}
                        setAlertChannels={setAlertChannels}
                        executeSecuredAction={executeSecuredAction}
                      />
                    )}

                    {label === 'Alert Settings' && (
                      <AlertSettings
                        speedLimit={speedLimit}
                        setSpeedLimit={setSpeedLimit}
                        executeSecuredAction={executeSecuredAction}
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
      {/* ── Global Settings Modification Security Confirmation Modal ── */}
      {showSecurityConfirm && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => {
            setShowSecurityConfirm(false)
            setConfirmPassword('')
            setConfirmSecretAnswer('')
            setPendingAction(null)
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-float flex flex-col p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary-500">Security Authorization</h3>
                <p className="text-[10px] text-neutral-200">Verification required to apply changes</p>
              </div>
              <button
                onClick={() => {
                  setShowSecurityConfirm(false)
                  setConfirmPassword('')
                  setConfirmSecretAnswer('')
                  setPendingAction(null)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors"
              >&#x2715;</button>
            </div>

            <div className="space-y-3">
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-100 text-xs text-neutral-300 leading-relaxed">
                To confirm updates to your organization profile or alert parameters, please verify your credentials.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary-400 mb-1.5 uppercase">Account Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field bg-white"
                  placeholder="Enter account password"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-primary-400 uppercase">Secret Security Question</label>
                </div>
                <p className="text-xs text-primary-500 mb-1.5 font-semibold bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">{activeSecQuestion}</p>
                <input
                  type="password"
                  value={confirmSecretAnswer}
                  onChange={e => setConfirmSecretAnswer(e.target.value)}
                  className="input-field bg-white"
                  placeholder="Enter secret answer"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowSecurityConfirm(false)
                  setConfirmPassword('')
                  setConfirmSecretAnswer('')
                  setPendingAction(null)
                }}
                className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!confirmPassword.trim()) {
                    toast.error('Please enter your account password')
                    return
                  }
                  if (!confirmSecretAnswer.trim()) {
                    toast.error('Please enter your security question answer')
                    return
                  }
                  // Verify security credentials
                  if (confirmSecretAnswer.trim().toLowerCase() !== activeSecAnswer.toLowerCase()) {
                    toast.error('Incorrect secret security answer')
                    return
                  }
                  // Simulate password check (accepts any mock password)
                  if (pendingAction) {
                    pendingAction()
                  }
                  setShowSecurityConfirm(false)
                  setConfirmPassword('')
                  setConfirmSecretAnswer('')
                  setPendingAction(null)
                  toast.success('Configuration updated and saved securely!')
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
              >
                Authorize & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

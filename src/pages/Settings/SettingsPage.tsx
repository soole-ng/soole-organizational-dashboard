import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Wallet, Bell, Shield, RefreshCw, HelpCircle, ChevronRight, ChevronDown, Upload, Mail, Phone, AlertTriangle } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'
import { useOrg } from '../../lib/OrgContext'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { org, updateOrg } = useOrg()
  const { data } = useMockData()
  
  const [members, setMembers] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [speedLimit, setSpeedLimit] = useState(100)
  const [alertChannels, setAlertChannels] = useState({ push: true, sms: true, email: false })
  
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '', role: 'dispatcher' })

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
    { icon: Shield, label: 'Security', desc: 'Password, 2FA and active sessions' },
    { icon: RefreshCw, label: 'Refund Policy', desc: 'Set your cancellation and refund rules' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs, chat and contact Soole', to: '/help' },
  ]

  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar title="Settings" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Settings" subtitle="Organization profile, team and account settings" />

        <div className="card p-0 overflow-hidden divide-y divide-neutral-50">
          {sections.map(({ icon: Icon, label, desc, badge, to }) => {
            const isOpen = activeSection === label;
            return (
              <div key={label} className="transition-colors hover:bg-primary-75/30">
                <button
                  onClick={() => to ? navigate(to) : setActiveSection(isOpen ? null : label)}
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
                  {to ? (
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-neutral-100" />
                  ) : (
                    <ChevronRight className={clsx('w-4 h-4 flex-shrink-0 transition-transform', isOpen ? 'rotate-90 text-primary-400' : 'text-neutral-100')} />
                  )}
                </button>
                
                {/* Accordion Content */}
                {isOpen && !to && (
                  <div className="px-5 pb-5 pt-4 bg-white border-t border-neutral-100/50">
                    
                    {label === 'Business Profile' && (
                      <div className="space-y-4 max-w-2xl">
                        {/* Logo Upload */}
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary-100">
                          <div className="w-16 h-16 rounded-2xl bg-primary-75 border-2 border-primary-100 overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-black text-primary-300">
                                {org.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary-500">Company Logo</p>
                            <p className="text-[10px] text-neutral-200 mb-2">JPG, PNG or GIF. Max 2MB.</p>
                            <input
                              type="file"
                              id="settings-logo-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onload = () => {
                                  updateOrg({ logoUrl: reader.result as string })
                                  toast.success('Logo updated successfully!')
                                }
                                reader.readAsDataURL(file)
                              }}
                            />
                            <label
                              htmlFor="settings-logo-upload"
                              className="px-3 py-1.5 bg-primary-75 border border-primary-100 text-xs font-bold rounded-xl text-primary-500 hover:bg-primary-100 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Photo
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Business Name */}
                          <div>
                            <label className="block text-xs font-semibold text-primary-400 mb-1.5">Business Name</label>
                            <input
                              type="text"
                              value={org.name}
                              onChange={(e) => updateOrg({ name: e.target.value })}
                              className="input-field bg-white"
                              placeholder="Speedway Transport"
                            />
                          </div>

                          {/* Profile Role Selector for Access Control Testing */}
                          <div>
                            <label className="block text-xs font-semibold text-primary-400 mb-1.5">My Profile Role (Access Control)</label>
                            <div className="relative">
                              <select
                                value={org.role}
                                onChange={(e) => updateOrg({ role: e.target.value })}
                                className="input-field bg-white appearance-none pr-10"
                              >
                                <option value="Owner">Owner (Access to Everything)</option>
                                <option value="Admin">Admin (Access ONLY to Money)</option>
                                <option value="Dispatcher">Dispatcher (Access to Everything BUT Money)</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Contact Phone */}
                          <div>
                            <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" /> Contact Phone
                            </label>
                            <input
                              type="tel"
                              value={org.phone || '+234 803 123 4567'}
                              onChange={(e) => updateOrg({ phone: e.target.value })}
                              className="input-field bg-white"
                              placeholder="+234 803 123 4567"
                            />
                          </div>

                          {/* Contact Email */}
                          <div>
                            <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> Contact Email
                            </label>
                            <input
                              type="email"
                              value={org.email || 'contact@speedway.ng'}
                              onChange={(e) => updateOrg({ email: e.target.value })}
                              className="input-field bg-white"
                              placeholder="contact@speedway.ng"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {label === 'Organization Team' && (
                      <div className="space-y-3 max-w-2xl">
                        <div className="bg-white rounded-2xl border border-primary-100 p-2 space-y-1">
                          {members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-primary-75 rounded-xl transition-colors">
                              <div className="w-9 h-9 rounded-full bg-[#042011] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-black truncate">{m.name}</p>
                                <p className="text-xs text-neutral-200 truncate">{m.phone}</p>
                              </div>
                              <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-neutral-100/50', m.role === 'admin' ? 'bg-[#042011] text-white' : 'bg-primary-75 text-primary-500')}>
                                {m.role}
                              </span>
                            </div>
                          ))}
                        </div>

                        {showInviteForm ? (
                          <div className="bg-white p-4 rounded-2xl border border-primary-100 space-y-3">
                            <h4 className="text-xs font-bold text-black uppercase tracking-wider">Invite New Team Member</h4>
                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-primary-400 mb-1 uppercase">Full Name</label>
                                <input
                                  type="text"
                                  className="input-field bg-white"
                                  placeholder="e.g. John Doe"
                                  value={inviteForm.name}
                                  onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-primary-400 mb-1 uppercase">Phone Number</label>
                                <input
                                  type="tel"
                                  className="input-field bg-white"
                                  placeholder="e.g. +234 803 111 2233"
                                  value={inviteForm.phone}
                                  onChange={e => setInviteForm(p => ({ ...p, phone: e.target.value }))}
                                />
                                <span className="text-[10px] text-secondary-300 font-bold block mt-1">
                                  * Must be registered to the Soole app.
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-primary-400 mb-1 uppercase">Role (Exactly two choices)</label>
                                <div className="relative">
                                  <select
                                    className="input-field bg-white appearance-none pr-10"
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                                  >
                                    <option value="admin">Admin (Only has access to Money)</option>
                                    <option value="dispatcher">Dispatcher (Access to everything except Money)</option>
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-200 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                onClick={() => setShowInviteForm(false)}
                                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (!inviteForm.name || !inviteForm.phone) {
                                    toast.error('Please enter name and phone number')
                                    return
                                  }
                                  const newMember = {
                                    id: `m-${Date.now()}`,
                                    name: inviteForm.name,
                                    phone: inviteForm.phone,
                                    role: inviteForm.role,
                                    joinedAt: new Date().toISOString().split('T')[0]
                                  }
                                  setMembers(p => [...p, newMember])
                                  setShowInviteForm(false)
                                  setInviteForm({ name: '', phone: '', role: 'dispatcher' })
                                  toast.success(`Invitation sent to ${inviteForm.name}!`)
                                }}
                                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
                              >
                                Send Invite
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowInviteForm(true)}
                            className="btn-secondary w-full text-sm py-2 bg-white hover:bg-primary-75 border-primary-100"
                          >
                            + Invite Member
                          </button>
                        )}
                      </div>
                    )}

                    {label === 'Security' && (
                      <div className="space-y-6 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
                        {/* Secret Question & Answer setup */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-black text-black">2FA Secret Security Question</h4>
                          <p className="text-xs text-black leading-relaxed">
                            Set up a backup security question. Once configured, you will be prompted to answer this question after entering your 2FA OTP code during sign-in.
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-black mb-1.5 uppercase tracking-wider">Secret Question</label>
                              <input
                                type="text"
                                className="input-field bg-white text-black font-medium border border-neutral-200 focus:border-primary-500"
                                placeholder="e.g. What was the name of your first school?"
                                value={org.securityQuestion || ''}
                                onChange={e => updateOrg({ securityQuestion: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-black mb-1.5 uppercase tracking-wider">Secret Answer</label>
                              <input
                                type="password"
                                className="input-field bg-white text-black font-medium border border-neutral-200 focus:border-primary-500"
                                placeholder="Enter secret answer"
                                value={org.securityAnswer || ''}
                                onChange={e => updateOrg({ securityAnswer: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {label === 'Alert Settings' && (
                      <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
                        <div>
                          <label className="text-xs font-bold text-black block mb-1.5 uppercase tracking-wider">Fleet Speed Limit (km/h)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              className="input-field bg-white text-black font-semibold border border-neutral-200 focus:border-primary-500 w-32"
                              value={speedLimit}
                              onChange={e => setSpeedLimit(Number(e.target.value))}
                              placeholder="e.g. 100"
                            />
                            <span className="text-sm font-black text-black">km/h</span>
                          </div>
                          <p className="text-[11px] text-black mt-2 font-medium">Set your custom speed limit for the fleet. Alerts will be generated if vehicles exceed this limit.</p>
                        </div>
                      </div>
                    )}

                    {label === 'Notifications' && (
                      <div className="space-y-2 max-w-2xl bg-white p-2 rounded-2xl border border-primary-100">
                        {(Object.keys(alertChannels) as Array<keyof typeof alertChannels>).map(channel => {
                          const isEmail = channel === 'email'
                          return (
                            <label
                              key={channel}
                              className={clsx(
                                'flex items-center justify-between p-3 rounded-xl transition-colors',
                                isEmail ? 'opacity-40 cursor-not-allowed bg-neutral-50/50' : 'hover:bg-primary-75 cursor-pointer'
                              )}
                            >
                              <span className="text-sm font-medium text-primary-500 capitalize">
                                {channel === 'sms' ? 'SMS Text Messages' : channel.charAt(0).toUpperCase() + channel.slice(1) + ' Notifications'}
                              </span>
                              <button
                                disabled={isEmail}
                                onClick={() => setAlertChannels(p => ({ ...p, [channel]: !p[channel] }))}
                                className={clsx(
                                  'w-10 h-6 rounded-full transition-colors relative',
                                  alertChannels[channel] && !isEmail ? 'bg-secondary-300' : 'bg-neutral-50',
                                )}
                                role="switch"
                                aria-checked={alertChannels[channel]}
                              >
                                <span className={clsx(
                                  'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow',
                                  alertChannels[channel] && !isEmail ? 'translate-x-5' : 'translate-x-1',
                                )} />
                              </button>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {['Payout Settings', 'Refund Policy'].includes(label) && (
                      <div className="py-6 text-center max-w-2xl bg-white rounded-2xl border border-primary-100">
                        <RefreshCw className="w-6 h-6 text-primary-200 mx-auto mb-2" />
                        <p className="text-xs text-neutral-200 max-w-xs mx-auto">This module is currently being configured. Please contact Soole support to update your {label.toLowerCase()}.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Building2, Users, Wallet, Bell, Shield, RefreshCw, HelpCircle, ChevronRight, Upload, Globe, Mail, Phone } from 'lucide-react'
import { TopBar, DesktopPageHeader } from '../../components/layout/TopBar'
import { useMockData } from '../../lib/useMockData'
import { clsx } from 'clsx'
import { useOrg } from '../../lib/OrgContext'
import toast from 'react-hot-toast'

const roleColors: Record<string, string> = {
  owner: 'bg-primary-500 text-white',
  admin: 'bg-secondary-300 text-white',
  dispatcher: 'bg-teal-400 text-white',
  finance: 'bg-accent-300 text-primary-500 font-bold',
  viewer: 'bg-neutral-300 text-white',
}

export function SettingsPage() {
  const { org, updateOrg } = useOrg()
  const { data } = useMockData()
  const organizationMembers = data.organizationMembers
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [speedLimit, setSpeedLimit] = useState(100)
  const [alertChannels, setAlertChannels] = useState({ push: true, sms: true, email: false })

  const sections = [
    { icon: Building2, label: 'Business Profile', desc: 'Name, logo, contact and public page' },
    { icon: Users, label: 'Organization Team', desc: `${organizationMembers.length} members`, badge: organizationMembers.length },
    { icon: Wallet, label: 'Payout Settings', desc: 'Bank account and payout schedule' },
    { icon: Bell, label: 'Notifications', desc: 'Alerts and notification channels' },
    { icon: Shield, label: 'Security', desc: 'Password, 2FA and active sessions' },
    { icon: RefreshCw, label: 'Refund Policy', desc: 'Set your cancellation and refund rules' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs, chat and contact Soole' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-primary-75">
      <TopBar title="Settings" />

      <div className="flex-1 p-4 space-y-4 lg:pt-8 lg:px-8 w-full">
        <DesktopPageHeader title="Settings" subtitle="Organization profile, team and account settings" />

        <div className="card p-0 overflow-hidden divide-y divide-neutral-50">
          {sections.map(({ icon: Icon, label, desc, badge }) => (
            <button
              key={label}
              onClick={() => setActiveSection(activeSection === label ? null : label)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary-75 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-75 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-primary-400" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-500">{label}</p>
                <p className="text-xs text-neutral-200">{desc}</p>
              </div>
              <ChevronRight className={clsx('w-4 h-4 flex-shrink-0 transition-transform', activeSection === label ? 'rotate-90 text-primary-400' : 'text-neutral-100')} />
            </button>
          ))}
        </div>

        {activeSection === 'Business Profile' && (
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-primary-500">Business Profile</h3>
            
            {/* Logo Upload */}
            <div className="flex items-center gap-4 p-4 bg-primary-75 rounded-2xl border border-primary-100">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-primary-100 overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
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
                  className="px-3 py-1.5 bg-white border border-primary-100 text-xs font-bold rounded-xl text-primary-500 hover:bg-primary-75 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                </label>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5">Business Name</label>
              <input
                type="text"
                value={org.name}
                onChange={(e) => updateOrg({ name: e.target.value })}
                className="input-field"
                placeholder="Speedway Transport"
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
                className="input-field"
                placeholder="contact@speedway.ng"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Contact Phone
              </label>
              <input
                type="tel"
                value={org.phone || '+234 803 123 4567'}
                onChange={(e) => updateOrg({ phone: e.target.value })}
                className="input-field"
                placeholder="+234 803 123 4567"
              />
            </div>
          </div>
        )}

        {activeSection === 'Organization Team' && (
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-primary-500">Organization Team Members ({organizationMembers.length})</h3>
            {organizationMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-300 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-500 truncate">{m.name}</p>
                  <p className="text-xs text-neutral-200 truncate">{m.email}</p>
                </div>
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', roleColors[m.role])}>
                  {m.role}
                </span>
              </div>
            ))}
            <button className="btn-secondary w-full text-sm">+ Invite Member</button>
          </div>
        )}

        {activeSection === 'Security' && (
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-primary-500">Fleet Safety</h3>
            <div>
              <label className="text-xs font-semibold text-primary-400 block mb-1.5">Speed Limit (km/h)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={60} max={120} step={10}
                  value={speedLimit}
                  onChange={e => setSpeedLimit(Number(e.target.value))}
                  className="flex-1 accent-primary-500"
                />
                <span className="text-sm font-bold text-primary-500 stat-number w-16 text-right">{speedLimit} km/h</span>
              </div>
              <p className="text-[11px] text-neutral-200 mt-1">Nigeria federal highway limit is 100 km/h</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary-400">Alert Channels</p>
              {(Object.keys(alertChannels) as Array<keyof typeof alertChannels>).map(channel => (
                <label key={channel} className="flex items-center justify-between py-2">
                  <span className="text-sm text-primary-500 capitalize">{channel === 'sms' ? 'SMS' : channel.charAt(0).toUpperCase() + channel.slice(1)}</span>
                  <button
                    onClick={() => setAlertChannels(p => ({ ...p, [channel]: !p[channel] }))}
                    className={clsx(
                      'w-10 h-6 rounded-full transition-colors relative',
                      alertChannels[channel] ? 'bg-secondary-300' : 'bg-neutral-50',
                    )}
                    role="switch"
                    aria-checked={alertChannels[channel]}
                  >
                    <span className={clsx(
                      'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow',
                      alertChannels[channel] ? 'translate-x-5' : 'translate-x-1',
                    )} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

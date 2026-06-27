import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface OrganizationTeamProps {
  members: any[]
  setMembers: React.Dispatch<React.SetStateAction<any[]>>
  executeSecuredAction: (action: () => void) => void
}

export function OrganizationTeam({ members, setMembers, executeSecuredAction }: OrganizationTeamProps) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '', role: 'dispatcher' })

  return (
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
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider', m.role === 'finance' ? 'text-primary-500' : 'text-primary-400')}>
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
                  <option value="finance">Finance (Only has access to Money)</option>
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
                executeSecuredAction(() => {
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
                })
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
  )
}

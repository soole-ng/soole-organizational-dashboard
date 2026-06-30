import { useState } from 'react'
import { ChevronDown, Copy, Check, Send, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../../lib/OrgContext'

interface OrganizationTeamProps {
  members: any[]
  setMembers: React.Dispatch<React.SetStateAction<any[]>>
  executeSecuredAction: (action: () => void) => void
}

export function OrganizationTeam({ members, setMembers, executeSecuredAction }: OrganizationTeamProps) {
  const { org, guardAction } = useOrg()
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null)
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '', role: 'dispatcher' })
  const [showInvitePreview, setShowInvitePreview] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const generateOTP = () => {
    return Math.random().toString().substring(2, 8).padEnd(6, '0')
  }

  const generateInviteLink = (phone: string, otp: string) => {
    return `${window.location.origin}/join?phone=${phone}&otp=${otp}`
  }

  const generateSMSMessage = (name: string, otp: string, link: string) => {
    return `Hi ${name}, you're invited to join Speedway Transport on Soole! Your OTP: ${otp}. Complete your setup: ${link}`
  }

  const handleSendInvite = () => {
    if (!inviteForm.name || !inviteForm.phone) {
      toast.error('Please enter name and phone number')
      return
    }

    const otp = generateOTP()
    setGeneratedOTP(otp)
    setShowInvitePreview(true)
  }

  const handleConfirmInvite = () => {
    executeSecuredAction(() => {
      const newMember = {
        id: `m-${Date.now()}`,
        name: inviteForm.name,
        phone: inviteForm.phone,
        role: inviteForm.role,
        joinedAt: new Date().toISOString().split('T')[0],
        status: 'pending'
      }
      setMembers(p => [...p, newMember])
      setShowInviteForm(false)
      setShowInvitePreview(false)
      setInviteForm({ name: '', phone: '', role: 'dispatcher' })
      setInviteSent(true)
      toast.success(`SMS invite sent to ${inviteForm.name}!`)
      setTimeout(() => setInviteSent(false), 3000)
    })
  }

  const handleConfirmRemove = () => {
    if (!memberToRemove) return
    const { id, name } = memberToRemove
    setMemberToRemove(null)
    executeSecuredAction(() => {
      setMembers(prev => prev.filter(m => m.id !== id))
      toast.success(`${name} has been removed from the team`)
    })
  }

  const copyLinkToClipboard = () => {
    const link = generateInviteLink(inviteForm.phone, generatedOTP)
    navigator.clipboard.writeText(link)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
    toast.success('Link copied to clipboard!')
  }

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
            {org.role === 'Owner' && m.role !== 'owner' && (
              <button
                onClick={() => setMemberToRemove(m)}
                className="p-1.5 rounded-lg text-neutral-200 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Remove member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showInviteForm && !showInvitePreview ? (
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
                * Will receive SMS with signup link
              </span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-primary-400 mb-1 uppercase">Role</label>
              <div className="relative">
                <select
                  className="input-field bg-white appearance-none pr-10"
                  value={inviteForm.role}
                  onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="finance">Finance (Money access only)</option>
                  <option value="dispatcher">Dispatcher (All except Money)</option>
                  <option value="driver">Driver (Trips & Fleet only)</option>
                  <option value="manager">Manager (Full access)</option>
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
              onClick={handleSendInvite}
              className="px-3 py-1.5 bg-secondary-500 hover:bg-secondary-600 text-xs font-semibold rounded-xl text-white transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Generate Invite
            </button>
          </div>
        </div>
      ) : showInvitePreview ? (
        <div className="bg-white p-4 rounded-2xl border border-secondary-300 space-y-3">
          <h4 className="text-xs font-bold text-black uppercase tracking-wider">Confirm Invite for {inviteForm.name}</h4>

          <div className="bg-primary-75 rounded-2xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-primary-400 uppercase">SMS Message Preview:</p>
            <div className="bg-white rounded-xl p-3 text-xs text-black space-y-2 border border-primary-100">
              <p className="font-semibold">To: {inviteForm.phone}</p>
              <p className="text-neutral-400 italic">{generateSMSMessage(inviteForm.name, generatedOTP, generateInviteLink(inviteForm.phone, generatedOTP))}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-black uppercase">Details:</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-neutral-50 rounded-lg p-2 space-y-1">
                <p className="text-neutral-400">Role</p>
                <p className="font-bold text-black capitalize">{inviteForm.role}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-2 space-y-1">
                <p className="text-neutral-400">OTP</p>
                <p className="font-bold text-secondary-500 font-mono">{generatedOTP}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => {
                setShowInvitePreview(false)
                setInviteForm({ name: '', phone: '', role: 'dispatcher' })
              }}
              className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={copyLinkToClipboard}
              className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-xs font-semibold rounded-xl text-primary-500 transition-colors flex items-center gap-1.5 border border-primary-100"
            >
              {copiedToClipboard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedToClipboard ? 'Copied' : 'Copy Link'}
            </button>
            <button
              onClick={handleConfirmInvite}
              className="px-3 py-1.5 bg-secondary-500 hover:bg-secondary-600 text-xs font-semibold rounded-xl text-white transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send SMS Invite
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => guardAction(undefined, () => setShowInviteForm(true))}
          className="btn-secondary w-full text-sm py-2 bg-white hover:bg-primary-75 border-primary-100"
        >
          + Invite Member
        </button>
      )}

      {/* ── Remove Member Confirmation Modal ── */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setMemberToRemove(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-float flex flex-col p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Remove Team Member?</h3>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  You are about to remove <span className="font-bold text-black">{memberToRemove.name}</span> from your organization. This action requires security verification.
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-neutral-300 uppercase font-bold tracking-wider">Role</p>
              <p className="text-xs font-bold text-primary-400 capitalize mt-0.5">{memberToRemove.role}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setMemberToRemove(null)}
                className="flex-1 px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold rounded-xl text-black transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-xs font-bold rounded-xl text-white transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

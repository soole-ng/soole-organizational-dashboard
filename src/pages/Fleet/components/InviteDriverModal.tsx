import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useOrg } from '../../../lib/OrgContext'
import { fleetApi } from '../../../api/client'

interface InviteDriverModalProps {
  onClose: () => void
}

export function InviteDriverModal({ onClose }: InviteDriverModalProps) {
  const { orgUuid } = useOrg()
  const [countryPrefix, setCountryPrefix] = useState('+234')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  const handleInvite = async () => {
    if (!form.name || !form.phone || !orgUuid) return
    setSending(true)
    try {
      await fleetApi.inviteDriver(orgUuid, {
        name: form.name,
        phone: `${countryPrefix}${form.phone}`,
      })
      toast.success(`Invite sent to ${form.name}`)
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#042011]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-md p-6 flex flex-col z-10 border border-neutral-100/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-primary-500">Invite a Driver</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-200" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Driver's Name</label>
            <input
              className="input-field"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={countryPrefix}
                onChange={e => setCountryPrefix(e.target.value)}
                className="input-field max-w-[100px] text-xs py-2 bg-white"
              >
                <option value="+234">🇳🇬 +234</option>
                <option value="+233">🇬🇭 +233</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <input
                className="input-field flex-1"
                type="tel"
                placeholder="803 123 4567"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
          </div>

          <p className="text-xs text-black bg-white rounded-xl p-3 leading-relaxed border border-neutral-100">
            {form.name ? `${form.name} (${countryPrefix}${form.phone})` : 'The driver'} will receive an SMS to download the Soole driver app and complete verification.
          </p>
          <button
            onClick={handleInvite}
            disabled={!form.name || !form.phone || sending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

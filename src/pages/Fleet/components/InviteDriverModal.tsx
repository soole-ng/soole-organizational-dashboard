import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface InviteDriverModalProps {
  onClose: () => void
}

export function InviteDriverModal({ onClose }: InviteDriverModalProps) {
  const [countryPrefix, setCountryPrefix] = useState('+234')
  const [isResolving, setIsResolving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    setForm(p => ({ ...p, phone: digits }))
    
    if (digits.length >= 10) {
      setIsResolving(true)
      setTimeout(() => {
        setIsResolving(false)
        const endDigit = digits.slice(-1)
        let resolvedName = 'Babajide Sanwo'
        if (endDigit === '7') resolvedName = 'Akin Bello'
        else if (endDigit === '1') resolvedName = 'Chidi Okafor'
        else if (endDigit === '2') resolvedName = 'Funke Adeleke'
        else if (endDigit === '0') resolvedName = 'Emeka Nwosu'
        
        setForm(p => ({ ...p, name: resolvedName }))
        toast.success(`Driver found: ${resolvedName}`)
      }, 800)
    }
  }

  const handleInvite = () => {
    if (!form.name || !form.phone) return
    toast.success(`Invite sent to ${form.name}`)
    onClose()
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
                onChange={e => handlePhoneChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Driver's Name</label>
            <input
              className="input-field bg-neutral-50/80 cursor-not-allowed text-neutral-300 font-semibold"
              placeholder="Resolves automatically..."
              value={form.name}
              disabled
            />
          </div>

          {isResolving && (
            <div className="flex items-center gap-2 justify-center py-2 text-xs text-primary-400">
              <span className="w-4 h-4 border-2 border-primary-400/40 border-t-primary-400 rounded-full animate-spin" />
              Checking Soole records...
            </div>
          )}

          <p className="text-xs text-black bg-white rounded-xl p-3 leading-relaxed border border-neutral-100">
            {form.name ? `${form.name} (${countryPrefix}${form.phone})` : 'The driver'} will receive an SMS to download the Soole driver app and complete verification.
          </p>
          <button
            onClick={handleInvite}
            disabled={!form.name || !form.phone || isResolving}
            className="btn-primary w-full"
          >
            Send Invite
          </button>
        </div>
      </div>
    </div>
  )
}

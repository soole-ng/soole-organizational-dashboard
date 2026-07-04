import { Upload, ChevronDown, Phone, Mail } from 'lucide-react'
import { useOrg } from '../../../lib/OrgContext'
import toast from 'react-hot-toast'

interface BusinessProfileProps {
  executeSecuredAction: (action: () => void) => void
  onSave: () => Promise<void>
}

export function BusinessProfile({ executeSecuredAction, onSave }: BusinessProfileProps) {
  const { org, updateOrg } = useOrg()

  return (
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
              <option value="owner">Owner (Access to Everything)</option>
              <option value="finance">Finance (Access ONLY to Money)</option>
              <option value="dispatcher">Dispatcher (Access to Everything BUT Money)</option>
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

      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            executeSecuredAction(() => {
              onSave().then(() => toast.success('Business Profile updated successfully!')).catch(() => {})
            })
          }}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
        >
          Save Profile Changes
        </button>
      </div>
    </div>
  )
}

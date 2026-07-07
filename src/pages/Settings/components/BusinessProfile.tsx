import { useState } from 'react'
import { Upload, Phone, Mail, Loader2 } from 'lucide-react'
import { useOrg } from '../../../lib/OrgContext'
import { uploadApi } from '../../../api/client'
import toast from 'react-hot-toast'

interface BusinessProfileProps {
  executeSecuredAction: (action: () => void) => void
  onSave: () => Promise<void>
}

export function BusinessProfile({ executeSecuredAction, onSave }: BusinessProfileProps) {
  const { org, updateOrg } = useOrg()
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)

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
            disabled={uploadingLogo}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setUploadingLogo(true)
              try {
                const publicUrl = await uploadApi.uploadFile(file, 'org_logo')
                updateOrg({ logoUrl: publicUrl })
                toast.success('Logo uploaded — click Save Profile Changes to apply it.')
              } catch (err: any) {
                toast.error(err?.message ?? 'Failed to upload logo')
              } finally {
                setUploadingLogo(false)
              }
            }}
          />
          <label
            htmlFor="settings-logo-upload"
            className="px-3 py-1.5 bg-primary-75 border border-primary-100 text-xs font-bold rounded-xl text-primary-500 hover:bg-primary-100 cursor-pointer inline-flex items-center gap-1.5 transition-colors aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
            aria-disabled={uploadingLogo}
          >
            {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploadingLogo ? 'Uploading…' : 'Upload Photo'}
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

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Phone */}
        <div>
          <label className="block text-xs font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Contact Phone
          </label>
          <input
            type="tel"
            value={org.phone || ''}
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
            value={org.email || ''}
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
              setSaving(true)
              onSave()
                .then(() => toast.success('Business Profile updated successfully!'))
                .catch(() => {})
                .finally(() => setSaving(false))
            })
          }}
          disabled={saving}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Profile Changes'}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Upload, Loader2, FileCheck, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { orgApi, uploadApi } from '../../../api/client'

interface CompleteProfileSectionProps {
  orgUuid: string
  verificationStatus?: 'incomplete' | 'complete'
  onSuccess?: (result: { verification_status: string; approval_status: string }) => void
}

export function CompleteProfileSection({ orgUuid, verificationStatus = 'incomplete', onSuccess }: CompleteProfileSectionProps) {
  const [nin, setNin] = useState('')
  const [dob, setDob] = useState('')
  const [rcNumber, setRcNumber] = useState('')
  const [cacUrl, setCacUrl] = useState('')
  const [cacFileName, setCacFileName] = useState('')
  const [uploadingCac, setUploadingCac] = useState(false)
  const [loading, setLoading] = useState(false)

  const isComplete = verificationStatus === 'complete'

  const handleCacUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadingCac(true)
    try {
      const publicUrl = await uploadApi.uploadFile(file, 'company_cert')
      setCacUrl(publicUrl)
      setCacFileName(file.name)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to upload CAC certificate')
    } finally {
      setUploadingCac(false)
    }
  }

  const handleSubmit = async () => {
    if (!nin || !dob || !rcNumber || !cacUrl) {
      toast.error('Please fill in all fields')
      return
    }

    if (nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      toast.error('NIN must be exactly 11 digits')
      return
    }

    if (rcNumber.length !== 9) {
      toast.error('CAC Registration Number must be exactly 9 characters')
      return
    }

    const today = new Date();
    const dobDate = new Date(dob);
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    if (age < 18) {
      toast.error('You must be at least 18 years old');
      return;
    }

    setLoading(true)
    try {
      const res = await orgApi.completeProfile(orgUuid, {
        nin,
        date_of_birth: dob,
        rc_number: rcNumber,
        cac_document_url: cacUrl,
      })
      // Record submission time so the 48-hour approval countdown can be
      // displayed in the pending-approval banner — frontend-only, no backend call.
      localStorage.setItem('soole_verification_submitted_at', String(Date.now()))
      toast.success('Profile completed successfully!')
      onSuccess?.(res)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-green-900">Profile Submitted</h3>
            <p className="text-sm text-green-700 mt-1">
              Your NIN, date of birth, and CAC document are submitted and awaiting review by our team.
              You'll be notified once your organization is approved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-900">
            Complete your business verification to unlock full access to all features.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            This takes ~48 hours for our team to review.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* NIN */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            National ID Number (NIN) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={11}
            value={nin}
            onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
            className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
            placeholder="11-digit NIN"
          />
          <p className="text-xs text-neutral-400">
            Exactly as it appears on your NIN record. We'll verify it matches your name and DOB.
          </p>
        </div>

        {/* DOB */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dob}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            onChange={e => setDob(e.target.value)}
            className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
          />
        </div>

        {/* RC Number */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            Company Registration Number (RC Number) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={rcNumber}
            maxLength={9}
            onChange={e => setRcNumber(e.target.value)}
            className="w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black focus:outline-none focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
            placeholder="CAC registration number"
          />
        </div>

        {/* CAC Certificate */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            CAC Certificate (Scanned Copy) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="cac-upload"
            accept="image/*,.pdf"
            className="hidden"
            disabled={uploadingCac}
            onChange={handleCacUpload}
          />
          <label
            htmlFor="cac-upload"
            className={clsx(
              "w-full h-[44px] bg-white border border-neutral-100 rounded-xl px-4 text-sm font-black transition-all flex items-center gap-2 cursor-pointer aria-disabled:opacity-60 aria-disabled:cursor-not-allowed",
            )}
            aria-disabled={uploadingCac}
          >
            {uploadingCac ? (
              <><Loader2 className="w-4 h-4 animate-spin text-neutral-300" /> Uploading…</>
            ) : cacUrl ? (
              <><FileCheck className="w-4 h-4 text-secondary-300" /> <span className="truncate">{cacFileName}</span></>
            ) : (
              <><Upload className="w-4 h-4 text-neutral-300" /> <span className="text-neutral-300 font-semibold">Upload scanned CAC certificate</span></>
            )}
          </label>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || uploadingCac || !nin || !dob || !rcNumber || !cacUrl}
        className={clsx(
          'w-full bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-base active:scale-98 hover:bg-primary-400 transition-all flex items-center justify-center gap-2',
          (loading || uploadingCac) && 'opacity-70'
        )}
      >
        {loading ? (
          <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting for Review…</>
        ) : (
          'Submit for Review'
        )}
      </button>
    </div>
  )
}

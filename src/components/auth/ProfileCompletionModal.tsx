import { useState, useRef } from 'react'
import { UploadCloud, CheckCircle, FileText, X } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useOrg } from '../../lib/OrgContext'
import { orgApi, uploadApi } from '../../api/client'

interface ProfileCompletionModalProps {
  onClose: () => void
}

export function ProfileCompletionModal({ onClose }: ProfileCompletionModalProps) {
  const { orgUuid, updateOrg } = useOrg()
  const [nin, setNin] = useState('')
  const [dob, setDob] = useState('')
  const [rcNumber, setRcNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!nin || !dob || !rcNumber || !file || !orgUuid) {
      toast.error('Please complete all fields and upload your CAC document')
      return
    }
    if (nin.length !== 11 || !/^\d+$/.test(nin)) {
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
      const cacDocumentUrl = await uploadApi.uploadFile(file, 'company_cert')
      const res = await orgApi.completeProfile(orgUuid, {
        nin,
        date_of_birth: dob,
        rc_number: rcNumber,
        cac_document_url: cacDocumentUrl,
      })
      updateOrg({
        verificationStatus: res.verification_status as 'incomplete' | 'complete',
        approvalStatus: res.approval_status === 'approved' ? 'approved' : 'pending',
      })
      toast.success('Profile details submitted for review!')
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit profile details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-500/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-card shadow-float overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-extrabold text-primary-500 font-display">Complete Your Profile</h2>
            <p className="text-sm text-neutral-400 mt-1">Verify your identity and company registration</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-primary-75 text-primary-500 rounded-full hover:bg-primary-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                NIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={nin}
                onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
                className="w-full h-[50px] bg-white border border-neutral-100 rounded-2xl px-4 text-base font-black focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
                placeholder="11-digit NIN"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                onChange={e => setDob(e.target.value)}
                className="w-full h-[50px] bg-white border border-neutral-100 rounded-2xl px-4 text-base font-black focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-secondary-500" />
              CAC Registration Number
            </label>
            <input
              type="text"
              value={rcNumber}
              maxLength={9}
              onChange={e => setRcNumber(e.target.value)}
              className="w-full h-[50px] bg-white border border-neutral-100 rounded-2xl px-4 text-base font-black focus:border-secondary-300 focus:ring-4 focus:ring-secondary-300/10 transition-all"
              placeholder="E.g., RC1234567"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black">
              Company Registration Certificate (CAC)
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                "w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
                file ? "border-green-500 bg-green-50" : "border-neutral-200 bg-primary-75 hover:border-primary-300 hover:bg-primary-100"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              {file ? (
                <>
                  <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                  <p className="text-sm font-black text-green-700">{file.name}</p>
                  <p className="text-xs text-green-600 mt-1">Click or drag to replace</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-primary-300 mb-3" />
                  <p className="text-sm font-black text-primary-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-neutral-400 mt-1">SVG, PNG, JPG or PDF (max. 10MB)</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 bg-white sticky bottom-0 z-10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-primary-75 text-primary-500 font-black rounded-2xl px-6 py-4 text-sm hover:bg-primary-100 transition-all"
          >
            I'll do this later
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nin || !dob || !rcNumber || !file || loading}
            className={clsx(
              "flex-1 bg-primary-500 text-white font-black rounded-2xl px-6 py-4 text-sm hover:bg-primary-400 transition-all shadow-sm flex items-center justify-center",
              loading && "opacity-70"
            )}
          >
            {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />Submitting…</> : 'Submit Details'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { AlertTriangle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface VerificationRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  action: string  // e.g., "create a driver", "withdraw money", "add vehicles"
}

export function VerificationRequiredModal({ isOpen, onClose, action }: VerificationRequiredModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-black">Complete Your Profile</h3>
              <p className="text-sm text-neutral-400 mt-1">
                To {action}, you need to complete your business verification.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-300 hover:text-neutral-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-primary-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-black text-primary-600">What you need to provide:</p>
          <ul className="text-xs text-primary-700 space-y-1">
            <li>✓ National ID Number (NIN)</li>
            <li>✓ Date of Birth</li>
            <li>✓ Company Registration Number</li>
            <li>✓ Scanned CAC Certificate</li>
          </ul>
          <p className="text-xs text-primary-600 mt-3">
            Our team will review within 48 hours.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-black text-black hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              navigate('/settings?tab=business-profile')
              onClose()
            }}
            className="flex-1 px-4 py-3 text-sm font-black text-white bg-primary-500 hover:bg-primary-400 rounded-xl transition-colors"
          >
            Complete Now
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { X, FileText, Image as ImageIcon, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { vehiclesApi } from '../../../api/client'
import { VehicleIcon } from '../../../components/ui/VehicleIcons'

type Category = 'images' | 'documents'

interface VehicleReviewModalProps {
  vehicle: any
  orgUuid: string
  canReview: boolean
  onClose: () => void
  onReviewed: () => void
}

/**
 * Combined-PDF reviewer view: one tab for a vehicle's photos, one for its
 * registration/road-worthiness/insurance paperwork, each backed by
 * organization_vehicles_api.py's combined-pdf endpoint (server-generated,
 * one page per uploaded file) so there's one document per category to
 * scroll through instead of the previous per-file chip list. Approve/Reject
 * applies to every file in that category at once via the /documents/review
 * endpoint, which is the same VehicleDocumentService.verify_document path
 * the Django Admin actions use - reviewer, decision, comment, and timestamp
 * all get recorded per document.
 */
export function VehicleReviewModal({ vehicle, orgUuid, canReview, onClose, onReviewed }: VehicleReviewModalProps) {
  const [category, setCategory] = useState<Category>('images')
  const [pdfUrls, setPdfUrls] = useState<Partial<Record<Category, string | null>>>({})
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const imageDocs = vehicle.documents.filter((d: any) => d.type === 'photo' || d.type === 'photo_front' || d.type === 'photo_back' || d.type === 'photo_interior')
  const documentDocs = vehicle.documents.filter((d: any) => !imageDocs.includes(d))
  const docsInCategory = category === 'images' ? imageDocs : documentDocs

  useEffect(() => {
    setShowRejectForm(false)
    setComment('')
    if (pdfUrls[category] !== undefined) return
    if (docsInCategory.length === 0) return

    let cancelled = false
    setLoadingPdf(true)
    setPdfError(null)
    vehiclesApi.getCombinedDocumentsPdfUrl(orgUuid, vehicle.id, category)
      .then(url => { if (!cancelled) setPdfUrls(prev => ({ ...prev, [category]: url })) })
      .catch(err => { if (!cancelled) setPdfError(err?.message ?? 'Failed to load PDF') })
      .finally(() => { if (!cancelled) setLoadingPdf(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, vehicle.id])

  useEffect(() => {
    return () => {
      Object.values(pdfUrls).forEach(url => { if (url) URL.revokeObjectURL(url) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDecision = async (approved: boolean) => {
    if (!approved && !comment.trim()) {
      setShowRejectForm(true)
      return
    }
    setSubmitting(true)
    try {
      await vehiclesApi.reviewDocuments(orgUuid, vehicle.id, category, approved, comment.trim() || undefined)
      toast.success(approved ? `${category === 'images' ? 'Photos' : 'Documents'} approved` : `${category === 'images' ? 'Photos' : 'Documents'} rejected`)
      setShowRejectForm(false)
      setComment('')
      onReviewed()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryStatus = docsInCategory.length === 0
    ? null
    : docsInCategory.every((d: any) => d.status === 'approved')
      ? 'approved'
      : docsInCategory.some((d: any) => d.status === 'rejected')
        ? 'rejected'
        : 'pending'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-float flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#042011]/60 flex items-center justify-center flex-shrink-0">
            <VehicleIcon type={vehicle.type} className="w-5 h-5 !text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-black">{vehicle.plate} — Review Submission</h2>
            <p className="text-[10px] text-neutral-200">{vehicle.model} · {vehicle.year}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-neutral-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {(['images', 'documents'] as Category[]).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                category === c ? 'bg-primary-75 text-primary-500' : 'text-neutral-300 hover:text-primary-400',
              )}
            >
              {c === 'images' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {c === 'images' ? 'Photos' : 'Documents'}
              <span className="text-xs font-medium text-neutral-200">({c === 'images' ? imageDocs.length : documentDocs.length})</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {docsInCategory.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-semibold text-black">Nothing uploaded yet</p>
              <p className="text-xs text-neutral-200 mt-1">
                No {category === 'images' ? 'photos' : 'documents'} have been uploaded for this vehicle.
              </p>
            </div>
          ) : loadingPdf ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : pdfError ? (
            <div className="text-center py-16">
              <p className="text-sm font-semibold text-danger-300">{pdfError}</p>
            </div>
          ) : pdfUrls[category] ? (
            <>
              <div className="border border-neutral-100 rounded-2xl overflow-hidden" style={{ height: '55vh' }}>
                <iframe src={pdfUrls[category]!} title={`${vehicle.plate} ${category}`} className="w-full h-full" />
              </div>
              <a
                href={pdfUrls[category]!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:underline"
              >
                Open in new tab <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          ) : null}

          {categoryStatus && (
            <div className={clsx(
              'text-xs font-bold uppercase tracking-wider',
              categoryStatus === 'approved' ? 'text-[#00C853]' : categoryStatus === 'rejected' ? 'text-danger-300' : 'text-[#FF5500]',
            )}>
              Current status: {categoryStatus}
            </div>
          )}

          {showRejectForm && (
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Rejection comment (required)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Explain what's wrong so the org can fix and resubmit..."
                className="w-full px-3 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-danger-300 focus:ring-1 focus:ring-danger-300"
              />
            </div>
          )}
        </div>

        {canReview && docsInCategory.length > 0 && (
          <div className="px-6 pb-5 pt-1 flex gap-2 flex-shrink-0">
            {showRejectForm && (
              <button
                onClick={() => { setShowRejectForm(false); setComment('') }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-100 text-sm font-semibold text-neutral-300 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => handleDecision(false)}
              disabled={submitting || (showRejectForm && !comment.trim())}
              className="flex-1 py-2.5 rounded-xl border border-danger-200 text-sm font-semibold text-danger-300 hover:bg-danger-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> {showRejectForm ? (submitting ? 'Submitting...' : 'Confirm Reject') : 'Reject'}
            </button>
            {!showRejectForm && (
              <button
                onClick={() => handleDecision(true)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Approve'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

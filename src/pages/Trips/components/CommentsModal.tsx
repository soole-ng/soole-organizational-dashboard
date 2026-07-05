import { MessageSquare, User } from 'lucide-react'
import { formatDate, formatTime } from '../../../lib/formatters'

interface TripComment {
  uuid: string
  author_uuid: string
  author_name: string
  text: string
  created_at: string
}

interface CommentsModalProps {
  tripRouteName: string
  comments: TripComment[]
  onClose: () => void
}

export function CommentsModal({ tripRouteName, comments, onClose }: CommentsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg mx-4 rounded-3xl shadow-float flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <div>
            <h2 className="text-sm font-bold text-primary-500">Comments</h2>
            <p className="text-[11px] text-neutral-200">{tripRouteName} &middot; Trip Chat</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-200 hover:text-primary-400 transition-colors text-lg font-light"
            aria-label="Close"
          >&#x2715;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-white">
          {comments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
              <MessageSquare className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-black">No comments yet</p>
              <p className="text-xs text-neutral-200 mt-1">Messages sent during this trip will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.uuid} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-neutral-100">
                      <User className="w-4 h-4 text-primary-400" />
                    </div>
                    <p className="text-sm font-bold text-black">{comment.author_name}</p>
                  </div>
                  <p className="text-xs text-black leading-relaxed">{comment.text}</p>
                  <p className="text-[9px] text-neutral-200 text-right mt-2">
                    {formatDate(comment.created_at)} &middot; {formatTime(comment.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

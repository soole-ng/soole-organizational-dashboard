import { useState } from 'react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface NotificationSettingsProps {
  alertChannels: { push: boolean; sms: boolean; email: boolean }
  setAlertChannels: React.Dispatch<React.SetStateAction<{ push: boolean; sms: boolean; email: boolean }>>
  executeSecuredAction: (action: () => void) => void
  onSave: () => Promise<void>
}

export function NotificationSettings({ alertChannels, setAlertChannels, executeSecuredAction, onSave }: NotificationSettingsProps) {
  const [saving, setSaving] = useState(false)
  return (
    <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
      <div className="space-y-2 rounded-xl border border-neutral-100 p-2">
        {(Object.keys(alertChannels) as Array<keyof typeof alertChannels>).map(channel => {
          const isEmail = channel === 'email'
          return (
            <label
              key={channel}
              className={clsx(
                'flex items-center justify-between p-3 rounded-xl transition-colors',
                isEmail ? 'opacity-40 cursor-not-allowed bg-neutral-50/50' : 'hover:bg-primary-75 cursor-pointer'
              )}
            >
              <span className="text-sm font-medium text-primary-500 capitalize">
                {channel === 'sms' ? 'SMS Text Messages' : channel.charAt(0).toUpperCase() + channel.slice(1) + ' Notifications'}
              </span>
              <button
                disabled={isEmail}
                onClick={() => setAlertChannels(p => ({ ...p, [channel]: !p[channel] }))}
                className={clsx(
                  'w-10 h-6 rounded-full transition-colors flex items-center px-0.5',
                  alertChannels[channel] && !isEmail ? 'bg-secondary-300' : 'bg-neutral-100',
                )}
                role="switch"
                aria-checked={alertChannels[channel]}
              >
                <span className={clsx(
                  'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                  alertChannels[channel] && !isEmail ? 'translate-x-5' : 'translate-x-0',
                )} />
              </button>
            </label>
          )
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            executeSecuredAction(() => {
              setSaving(true)
              onSave()
                .then(() => toast.success('Notification settings saved!'))
                .catch(() => {})
                .finally(() => setSaving(false))
            })
          }}
          disabled={saving}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  )
}

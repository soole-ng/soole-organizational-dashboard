import toast from 'react-hot-toast'

interface AlertSettingsProps {
  speedLimit: number
  setSpeedLimit: (limit: number) => void
  executeSecuredAction: (action: () => void) => void
}

export function AlertSettings({ speedLimit, setSpeedLimit, executeSecuredAction }: AlertSettingsProps) {
  return (
    <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-primary-100">
      <div>
        <label className="text-xs font-bold text-black block mb-1.5 uppercase tracking-wider">Fleet Speed Limit (km/h)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            className="input-field bg-white text-black font-semibold border border-neutral-200 focus:border-primary-500 w-32"
            value={speedLimit}
            onChange={e => setSpeedLimit(Number(e.target.value))}
            placeholder="e.g. 100"
          />
          <span className="text-sm font-black text-black">km/h</span>
        </div>
        <p className="text-[11px] text-black mt-2 font-medium">Set your custom speed limit for the fleet. Alerts will be generated if vehicles exceed this limit.</p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            executeSecuredAction(() => {
              toast.success('Fleet speed limit updated!')
            })
          }}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-xs font-semibold rounded-xl text-white transition-colors"
        >
          Save Speed Limit
        </button>
      </div>
    </div>
  )
}

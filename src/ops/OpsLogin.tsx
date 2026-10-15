import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { opsApi } from './api'

/** Staff sign-in: the same email or phone and password as the Django admin. */
export function OpsLogin() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Enter your email or phone number and your password.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await opsApi.login(identifier.trim(), password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#13241b] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <img src="/soole-icon.png" alt="Soole" className="w-10 h-10 rounded-xl bg-[#042011] p-1 object-contain" />
          <div>
            <p className="font-semibold leading-tight">Soole Live Map</p>
            <p className="text-xs text-[#5e7266]">Soole staff only</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-[#5e7266] mb-6">
          Use your Soole admin email or phone number and password.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5 text-sm">
            <span>Email or phone number</span>
            <input
              id="ops-identifier"
              autoComplete="username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="h-11 rounded-lg bg-white border border-[#cbd6cf] px-3 outline-none focus:border-[#1d754c] focus:ring-2 focus:ring-[#1d754c]/20"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span>Password</span>
            <span className="relative">
              <input
                id="ops-password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg bg-white border border-[#cbd6cf] pl-3 pr-11 outline-none focus:border-[#1d754c] focus:ring-2 focus:ring-[#1d754c]/20"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1 h-9 w-9 grid place-items-center rounded-md text-[#5e7266] hover:text-[#13241b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a7c957]"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm rounded-lg bg-[#fdeceb] border border-[#f3c1bc] text-[#a8231a] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-lg bg-[#042011] text-white font-semibold hover:bg-[#254832] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d754c]"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-[#5e7266] mt-8">
          Company owners sign in at dashboard.soole.ng.
        </p>
      </div>
    </main>
  )
}

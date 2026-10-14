import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
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
    <main className="min-h-screen bg-[#0f1d16] text-[#e8efe9] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#a7c957] text-[#0f1d16]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="font-semibold leading-tight">Soole Ops</p>
            <p className="text-xs text-[#8fa79a]">Staff only</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-[#8fa79a] mb-6">
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
              className="h-11 rounded-lg bg-[#172a20] border border-[#2b4337] px-3 outline-none focus:border-[#a7c957] focus:ring-2 focus:ring-[#a7c957]/30"
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
                className="h-11 w-full rounded-lg bg-[#172a20] border border-[#2b4337] pl-3 pr-11 outline-none focus:border-[#a7c957] focus:ring-2 focus:ring-[#a7c957]/30"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1 h-9 w-9 grid place-items-center rounded-md text-[#8fa79a] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a7c957]"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm rounded-lg bg-[#3a1512] border border-[#7a2a22] text-[#ffb4ab] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-lg bg-[#a7c957] text-[#0f1d16] font-semibold hover:bg-[#b8d66d] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a7c957]"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-[#8fa79a] mt-8">
          Company owners sign in at dashboard.soole.ng.
        </p>
      </div>
    </main>
  )
}

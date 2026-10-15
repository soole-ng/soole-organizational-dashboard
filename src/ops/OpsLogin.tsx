import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { opsApi } from './api'

const IDENTIFIER_MAX = 254
const PASSWORD_MAX = 128
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[\d\s-]{10,16}$/

/**
 * What is wrong with the identifier, in words, or null when it will do.
 * Checked here so a mistyped number is explained on the page instead of
 * coming back from the server as a refusal (2026-10-15).
 */
function identifierProblem(value: string): string | null {
  const v = value.trim()
  if (!v) return 'Enter your email or phone number.'
  if (v.includes('@')) return EMAIL.test(v) ? null : 'That email looks incomplete, e.g. name@soole.ng.'
  return PHONE.test(v) && v.replace(/\D/g, '').length >= 10
    ? null
    : 'Enter an 11-digit Nigerian number, e.g. 08031234567, or +2348031234567.'
}

/**
 * Staff sign-in: the same email or phone number and password as the Django
 * admin. White with the Soole forest green beside it (2026-10-15: "white
 * is good, but our forest green should show too").
 */
export function OpsLogin() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const idProblem = identifierProblem(identifier)
  const pwProblem = password ? null : 'Enter your password.'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (idProblem || pwProblem) return
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

  const field =
    'h-11 w-full rounded-lg bg-white border px-3 text-[#13241b] placeholder:text-[#a4b2aa] outline-none focus:border-[#1d754c] focus:ring-2 focus:ring-[#1d754c]/20'

  return (
    <main className="min-h-screen bg-white text-[#13241b] flex flex-col lg:flex-row">
      {/* Forest green: a band on a phone, a panel on a computer. */}
      <section className="bg-[#042011] text-white px-6 py-8 lg:py-0 lg:w-[42%] lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="flex items-center gap-3">
          <img src="/soole-icon.png" alt="Soole" className="w-11 h-11 rounded-xl bg-[#254832] p-1 object-contain" />
          <div>
            <p className="font-semibold text-lg leading-tight">Soole Live Map</p>
            <p className="text-xs text-[#a7c957]">Soole staff only</p>
          </div>
        </div>
        <p className="hidden lg:block mt-10 text-3xl font-semibold leading-tight max-w-sm">
          Every trip in progress, company and independent, on one map.
        </p>
        <p className="hidden lg:block mt-4 text-sm text-[#b9c9bf] max-w-sm">
          See who is driving, who is on board, where each passenger got out, and any SOS the moment it opens.
        </p>
      </section>

      <section className="flex-1 grid justify-items-center content-start lg:content-center lg:place-items-center lg:bg-[#f3f6f4] px-4 pt-8 pb-10 lg:py-10">
        <div className="w-full max-w-sm lg:max-w-md lg:bg-white lg:rounded-2xl lg:border lg:border-[#dfe6e1] lg:shadow-sm lg:p-9">
          <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-[#5e7266] mb-6">
            Use your Soole admin email or phone number and password.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Email or phone number</span>
              <input
                id="ops-identifier"
                autoComplete="username"
                inputMode="email"
                maxLength={IDENTIFIER_MAX}
                placeholder="08031234567 or name@soole.ng"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !!idProblem}
                className={`${field} ${touched && idProblem ? 'border-[#d92d20]' : 'border-[#cbd6cf]'}`}
              />
              {touched && idProblem ? (
                <span className="text-xs text-[#a8231a]">{idProblem}</span>
              ) : (
                <span className="text-xs text-[#8a9b91]">The phone number or email on your admin account.</span>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Password</span>
              <span className="relative">
                <input
                  id="ops-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  maxLength={PASSWORD_MAX}
                  placeholder="Your admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-invalid={touched && !!pwProblem}
                  className={`${field} pr-11 ${touched && pwProblem ? 'border-[#d92d20]' : 'border-[#cbd6cf]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1 h-9 w-9 grid place-items-center rounded-md text-[#5e7266] hover:text-[#13241b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d754c]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {touched && pwProblem && <span className="text-xs text-[#a8231a]">{pwProblem}</span>}
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
            No staff access yet? A Soole superuser can add you under Manage admins in the Django admin.
            Company owners sign in at dashboard.soole.ng.
          </p>
        </div>
      </section>
    </main>
  )
}

/**
 * admindashboard.soole.ng - Soole staff only.
 *
 * Built from this repo with VITE_APP_MODE=admin (a second Vercel project);
 * without it main.tsx renders the company dashboard exactly as before, and
 * none of this is loaded. Sign-in is the Django admin login; the backend
 * refuses every /ops endpoint to an account that is not staff.
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { opsSession } from './api'
import { OpsLogin } from './OpsLogin'
import { OpsBoard } from './OpsBoard'
import './ops.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
})

function SignedIn({ children }: { children: JSX.Element }) {
  return opsSession.isSignedIn() ? children : <Navigate to="/login" replace />
}

function SignedOut({ children }: { children: JSX.Element }) {
  return opsSession.isSignedIn() ? <Navigate to="/" replace /> : children
}

export default function OpsApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<SignedOut><OpsLogin /></SignedOut>} />
        <Route path="*" element={<SignedIn><OpsBoard /></SignedIn>} />
      </Routes>
    </QueryClientProvider>
  )
}

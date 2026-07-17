import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { OrgProvider } from './lib/OrgContext'
import { RoleGuard } from './components/layout/RoleGuard'

// Route-level code splitting - previously every page was statically
// imported here, so the very first load shipped all 17 pages (including
// ones like Reports/Admin/AI Chat that most sessions never visit) in one
// bundle. React.lazy defers each page's chunk until its route is actually
// navigated to.
const LoginPage = lazy(() => import('./pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })))
const JoinOrganizationPage = lazy(() => import('./pages/Auth/JoinOrganizationPage').then(m => ({ default: m.JoinOrganizationPage })))
const SignupChoicePage = lazy(() => import('./pages/Auth/SignupChoicePage').then(m => ({ default: m.SignupChoicePage })))
const HomePage = lazy(() => import('./pages/Home/HomePage').then(m => ({ default: m.HomePage })))
const TripsListPage = lazy(() => import('./pages/Trips/TripsListPage').then(m => ({ default: m.TripsListPage })))
const TripCreatePage = lazy(() => import('./pages/Trips/TripCreatePage').then(m => ({ default: m.TripCreatePage })))
const TripDetailPage = lazy(() => import('./pages/Trips/TripDetailPage').then(m => ({ default: m.TripDetailPage })))
const FleetPage = lazy(() => import('./pages/Fleet/FleetPage').then(m => ({ default: m.FleetPage })))
const DriversPage = lazy(() => import('./pages/Fleet/DriversPage').then(m => ({ default: m.DriversPage })))
const VehiclesPage = lazy(() => import('./pages/Fleet/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
const AddVehiclePage = lazy(() => import('./pages/Fleet/AddVehiclePage').then(m => ({ default: m.AddVehiclePage })))
const MoneyPage = lazy(() => import('./pages/Money/MoneyPage').then(m => ({ default: m.MoneyPage })))
const LiveMapPage = lazy(() => import('./pages/LiveMap/LiveMapPage').then(m => ({ default: m.LiveMapPage })))
const AIChatPage = lazy(() => import('./pages/AI/AIChatPage').then(m => ({ default: m.AIChatPage })))
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const HelpPage = lazy(() => import('./pages/Help/HelpPage').then(m => ({ default: m.HelpPage })))
const AdminPage = lazy(() => import('./pages/Admin/AdminPage').then(m => ({ default: m.AdminPage })))

// No defaultOptions meant every useQuery call used React Query's global
// default staleTime of 0 - QuickStats' two weekly-revenue queries were
// refetched from scratch every time HomePage remounted (nav away and
// back), on top of the identical fetch useApiData's own cache already
// makes. A minute of staleness is fine for revenue figures that don't
// change second-to-second.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
  },
})

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="w-8 h-8 border-2 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isAuth = !!localStorage.getItem('auth_token')
    if (!isAuth) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  return (
    <QueryClientProvider client={queryClient}>
      <OrgProvider>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
      <Route path="/signup" element={<SignupChoicePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join" element={<JoinOrganizationPage />} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />

        <Route path="/trips" element={<TripsListPage />} />
        <Route path="/trips/new" element={<TripCreatePage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />

        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/drivers" element={<DriversPage />} />
        <Route path="/fleet/vehicles" element={<VehiclesPage />} />
        <Route path="/fleet/vehicles/new" element={<AddVehiclePage />} />

        <Route path="/money" element={<RoleGuard allowedRoles={['owner', 'finance']}><MoneyPage /></RoleGuard>} />
        <Route path="/admin" element={<RoleGuard allowedRoles={['owner', 'manager']}><AdminPage /></RoleGuard>} />
        <Route path="/live-map" element={<LiveMapPage />} />
        <Route path="/ai" element={<AIChatPage />} />
        <Route path="/reports" element={<RoleGuard allowedRoles={['owner', 'finance']}><ReportsPage /></RoleGuard>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
        </Suspense>
      </OrgProvider>
    </QueryClientProvider>
  )
}

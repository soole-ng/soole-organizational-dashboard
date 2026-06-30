import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/Auth/LoginPage'
import { OnboardingFlow } from './pages/Auth/OnboardingFlow'
import { HomePage } from './pages/Home/HomePage'
import { TripsListPage } from './pages/Trips/TripsListPage'
import { TripCreatePage } from './pages/Trips/TripCreatePage'
import { TripDetailPage } from './pages/Trips/TripDetailPage'
import { OrgProvider } from './lib/OrgContext'
import { FleetPage } from './pages/Fleet/FleetPage'
import { DriversPage } from './pages/Fleet/DriversPage'
import { VehiclesPage } from './pages/Fleet/VehiclesPage'
import { AddVehiclePage } from './pages/Fleet/AddVehiclePage'
import { MoneyPage } from './pages/Money/MoneyPage'
import { LiveMapPage } from './pages/LiveMap/LiveMapPage'
import { AIChatPage } from './pages/AI/AIChatPage'
import { ReportsPage } from './pages/Reports/ReportsPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { HelpPage } from './pages/Help/HelpPage'
import { RoleGuard } from './components/layout/RoleGuard'

const queryClient = new QueryClient()

export default function App() {
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true'
    if (!isAuth) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  return (
    <QueryClientProvider client={queryClient}>
      <OrgProvider>
        <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />

        <Route path="/trips" element={<TripsListPage />} />
        <Route path="/trips/new" element={<TripCreatePage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />

        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/drivers" element={<DriversPage />} />
        <Route path="/fleet/vehicles" element={<VehiclesPage />} />
        <Route path="/fleet/vehicles/new" element={<AddVehiclePage />} />

        <Route path="/money" element={<RoleGuard allowedRoles={['admin', 'finance']}><MoneyPage /></RoleGuard>} />
        <Route path="/live-map" element={<LiveMapPage />} />
        <Route path="/ai" element={<AIChatPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
      </OrgProvider>
    </QueryClientProvider>
  )
}

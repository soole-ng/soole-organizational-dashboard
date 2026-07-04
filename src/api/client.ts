/**
 * API Client for Soole Company Dashboard
 * Integrates with soole-backend REST API — no mock data.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:8000/api'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  token?: string
}

/**
 * Generic API request handler.
 * Backend error responses use {data, message, status_code, success}.
 */
async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    token = localStorage.getItem('auth_token'),
  } = config

  const url = `${API_BASE_URL}${endpoint}`
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.detail || `API Error: ${response.status}`)
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

function getOrgUuid(): string {
  const uuid = localStorage.getItem('org_uuid')
  if (!uuid) throw new Error('No organization selected — org_uuid missing from localStorage')
  return uuid
}

/**
 * Organization core (organization/api.py)
 */
export const orgApi = {
  getMine: async () => apiRequest<Array<{ uuid: string; name: string; slug: string; org_type?: string; contact_email?: string; contact_phone?: string; logo_url?: string; status: string; rc_number?: string }>>('/organizations/mine/'),
  getOrganization: async (orgUuid: string) => apiRequest(`/organizations/${orgUuid}/`),
}

/**
 * Trips API — organization_trips_api.py, mounted at /organizations/
 * (Distinct from org_trip_api.py's read-only /organizations-trips/{org}/trips/ used by driversApi below.)
 */
export const organizationApi = {
  getTrips: async (orgUuid?: string, filters?: Record<string, any>) => {
    const uuid = orgUuid || getOrgUuid()
    const queryParams = new URLSearchParams(filters || {}).toString()
    const res = await apiRequest<{ trips: any[]; total: number; page: number; limit: number }>(
      `/organizations/${uuid}/trips${queryParams ? '?' + queryParams : ''}`
    )
    return res
  },

  getTripDetail: async (orgUuid: string, tripUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/trips/${tripUuid}`),

  createTrip: async (orgUuid: string, tripData: any) =>
    apiRequest(`/organizations/${orgUuid}/trips`, { method: 'POST', body: tripData }),

  updateTrip: async (orgUuid: string, tripUuid: string, tripData: any) =>
    apiRequest(`/organizations/${orgUuid}/trips/${tripUuid}`, { method: 'PUT', body: tripData }),

  updateTripStatus: async (orgUuid: string, tripUuid: string, status: string) =>
    apiRequest(`/organizations/${orgUuid}/trips/${tripUuid}/status`, { method: 'PATCH', body: { status } }),

  cancelTrip: async (orgUuid: string, tripUuid: string, reason?: string) =>
    apiRequest(`/organizations/${orgUuid}/trips/${tripUuid}`, { method: 'DELETE', body: reason ? { reason } : undefined }),

  refundPassenger: async (orgUuid: string, tripUuid: string, passengerId: string, refundData?: { reason?: string; amount?: number }) =>
    apiRequest(
      `/organizations/${orgUuid}/trips/${tripUuid}/passengers/${passengerId}/refund`,
      { method: 'POST', body: refundData || {} }
    ),

  boardPassenger: async (orgUuid: string, tripUuid: string, passengerId: string, boardedAt?: string) =>
    apiRequest(
      `/organizations/${orgUuid}/trips/${tripUuid}/passengers/${passengerId}/board`,
      { method: 'POST', body: { boarded_at: boardedAt || new Date().toISOString() } }
    ),

  addComment: async (orgUuid: string, tripUuid: string, text: string) =>
    apiRequest(`/organizations/${orgUuid}/trips/${tripUuid}/comments`, { method: 'POST', body: { text } }),

  getRoutes: async (orgUuid: string, search?: string) =>
    apiRequest<any[]>(`/organizations/${orgUuid}/routes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
}

/**
 * Reports API — organization_reports_api.py, mounted at /organizations/
 */
export const reportsApi = {
  getTripsReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/reports/trips${queryParams ? '?' + queryParams : ''}`)
  },
  getRevenueReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/reports/revenue${queryParams ? '?' + queryParams : ''}`)
  },
  getDriverReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/reports/drivers${queryParams ? '?' + queryParams : ''}`)
  },
  getVehicleReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/reports/vehicles${queryParams ? '?' + queryParams : ''}`)
  },
  getRouteReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/reports/routes${queryParams ? '?' + queryParams : ''}`)
  },
}

/**
 * Money/Finance API — organization_money_api.py, mounted at /organizations/
 */
export const moneyApi = {
  getBalance: async (orgUuid: string) => apiRequest(`/organizations/${orgUuid}/money/balance`),
  getTransactions: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/money/transactions${queryParams ? '?' + queryParams : ''}`)
  },
  getPayouts: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/money/payouts${queryParams ? '?' + queryParams : ''}`)
  },
  getWeeklyRevenue: async (orgUuid: string, weekOffset = 0) =>
    apiRequest(`/organizations/${orgUuid}/money/weekly-revenue?week_offset=${weekOffset}`),
  initiateWithdrawal: async (orgUuid: string, payload: { amount: number; bank_account_id: string; description?: string }) =>
    apiRequest(`/organizations/${orgUuid}/money/withdraw`, { method: 'POST', body: payload }),
}

/**
 * Vehicles API — organization_vehicles_api.py, mounted at /organizations/
 */
export const vehiclesApi = {
  getVehicles: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest<{ vehicles: any[]; total: number }>(`/organizations/${orgUuid}/vehicles${queryParams ? '?' + queryParams : ''}`)
  },
  getVehicleDetail: async (orgUuid: string, vehicleId: string) =>
    apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}`),
  createVehicle: async (orgUuid: string, vehicleData: any) =>
    apiRequest(`/organizations/${orgUuid}/vehicles`, { method: 'POST', body: vehicleData }),
  updateVehicle: async (orgUuid: string, vehicleId: string, vehicleData: any) =>
    apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}`, { method: 'PATCH', body: vehicleData }),
  updateVehicleStatus: async (orgUuid: string, vehicleId: string, status: string) =>
    apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}/status`, { method: 'PATCH', body: { status } }),
  getVehicleHistory: async (orgUuid: string, vehicleId: string) =>
    apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}/history`),
  getVehicleLocations: async (orgUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/live-tracking/vehicles`),
}

/**
 * Drivers API — org_trip_api.py, mounted at /organizations-trips/
 */
export const driversApi = {
  getDrivers: async (orgUuid: string) =>
    apiRequest<any[]>(`/organizations-trips/${orgUuid}/drivers/`),
  getSuspendedDrivers: async (orgUuid: string) =>
    apiRequest<any[]>(`/organizations-trips/${orgUuid}/drivers/suspended/`),
  getDriverDetail: async (orgUuid: string, driverId: string) =>
    apiRequest(`/organizations-trips/${orgUuid}/drivers/${driverId}/`),
  suspendDriver: async (orgUuid: string, driverId: string, reason?: string) =>
    apiRequest(`/organizations-trips/${orgUuid}/drivers/${driverId}/suspend/`, { method: 'POST', body: { reason } }),
  reinstateDriver: async (orgUuid: string, driverId: string) =>
    apiRequest(`/organizations-trips/${orgUuid}/drivers/${driverId}/reinstate/`, { method: 'POST' }),
  getDriverTrips: async (orgUuid: string, driverId: string) =>
    apiRequest<any[]>(`/organizations-trips/${orgUuid}/drivers/${driverId}/trips/`),
}

/**
 * Fleet API — fleet/api.py, mounted at /fleet/
 * Dedicated driver invite/update/remove flow - distinct from
 * settingsApi.inviteTeamMemberWithOtp, which is for org staff
 * (owner/admin/dispatcher/viewer), not drivers.
 */
export const fleetApi = {
  inviteDriver: async (orgUuid: string, payload: { name: string; phone: string; email?: string }) =>
    apiRequest<{ success: boolean; driver_id: string; invite_status: string; message: string }>(
      `/fleet/${orgUuid}/drivers/invite`, { method: 'POST', body: payload }
    ),
  updateDriver: async (orgUuid: string, driverId: string, payload: { name?: string; phone?: string; photo?: string }) =>
    apiRequest(`/fleet/${orgUuid}/drivers/${driverId}`, { method: 'PUT', body: payload }),
  removeDriver: async (orgUuid: string, driverId: string, payload: { reason?: string }) =>
    apiRequest(`/fleet/${orgUuid}/drivers/${driverId}`, { method: 'DELETE', body: payload }),
}

/**
 * Live tracking API — organization_tracking_api.py, mounted at /organizations/
 */
export const trackingApi = {
  getVehiclesLocations: async (orgUuid: string, status?: string) =>
    apiRequest<any[]>(`/organizations/${orgUuid}/live-tracking/vehicles${status ? `?status=${status}` : ''}`),
  getTripTracking: async (orgUuid: string, tripUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/live-tracking/trips/${tripUuid}`),
  updateLocation: async (orgUuid: string, tripUuid: string, payload: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
    apiRequest(`/organizations/${orgUuid}/live-tracking/trips/${tripUuid}/update-location`, { method: 'POST', body: payload }),
}

/**
 * Notifications API — organization_notifications_api.py, mounted at /organizations/
 */
export const notificationsApi = {
  getNotifications: async (orgUuid: string, filters?: { read?: boolean; type?: string; limit?: number }) => {
    const queryParams = new URLSearchParams(filters as any || {}).toString()
    return apiRequest<{ notifications: any[]; total: number; unread_count: number }>(
      `/organizations/${orgUuid}/notifications${queryParams ? '?' + queryParams : ''}`
    )
  },
  markRead: async (orgUuid: string, notificationUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/notifications/${notificationUuid}/read`, { method: 'PATCH', body: {} }),
  getSummary: async (orgUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/notifications/summary`),
}

/**
 * Settings API — organization_settings_api.py, mounted at /organizations/
 */
export const settingsApi = {
  getSettings: async (orgUuid: string) => apiRequest(`/organizations/${orgUuid}/settings`),
  updateSettings: async (orgUuid: string, payload: any) =>
    apiRequest(`/organizations/${orgUuid}/settings`, { method: 'PATCH', body: payload }),
  getMembers: async (orgUuid: string) =>
    apiRequest<{ members: any[] }>(`/organizations/${orgUuid}/members`),
  inviteMember: async (orgUuid: string, email: string, name: string, role: string) =>
    apiRequest(`/organizations/${orgUuid}/members/invite`, { method: 'POST', body: { email, name, role } }),
  /**
   * Invite via phone + OTP/SMS (organization/api.py's invite_team_member_with_otp).
   * The backend wraps this response in {data, message, status_code, success} via
   * api_response() - unlike most other endpoints here, so it needs unwrapping.
   */
  inviteTeamMemberWithOtp: async (orgUuid: string, payload: { name: string; phone: string; role: string }) => {
    const res = await apiRequest<{ data: { memberId: string; phone: string; otp: string; joinLink: string; expiresAt: string; smsMessage: string } }>(
      `/organizations/${orgUuid}/members/invite-with-otp/`, { method: 'POST', body: payload }
    )
    return res.data
  },
  changeMemberRole: async (orgUuid: string, memberUuid: string, role: string) =>
    apiRequest(`/organizations/${orgUuid}/members/${memberUuid}/role`, { method: 'PATCH', body: { role } }),
  removeMember: async (orgUuid: string, memberUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/members/${memberUuid}`, { method: 'DELETE' }),
  /** Returns a raw array - the real backend (organization/api.py) isn't wrapped in {accounts: [...]} */
  getBankAccounts: async (orgUuid: string) =>
    apiRequest<Array<{ uuid: string; bank_name: string; bank_code?: string; account_number: string; account_name: string; account_type: string; is_primary: boolean; verification_status: string; verification_date?: string }>>(
      `/organizations/${orgUuid}/bank-accounts/`
    ),
  addBankAccount: async (orgUuid: string, payload: { bank_name: string; account_number: string; account_name: string; account_type?: string; bank_code?: string }) =>
    apiRequest(`/organizations/${orgUuid}/bank-accounts/`, { method: 'POST', body: payload }),
  setPrimaryBankAccount: async (orgUuid: string, accountUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/bank-accounts/${accountUuid}/primary`, { method: 'PUT' }),
  deleteBankAccount: async (orgUuid: string, accountUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/bank-accounts/${accountUuid}/`, { method: 'DELETE' }),
  getAlertSettings: async (orgUuid: string) =>
    apiRequest<{ speed_limit: number; alert_channels: Record<string, boolean> }>(`/organizations/${orgUuid}/alerts/`),
  updateAlertSettings: async (orgUuid: string, payload: { speed_limit?: number; alert_channels?: Record<string, boolean> }) =>
    apiRequest(`/organizations/${orgUuid}/alerts/`, { method: 'PUT', body: payload }),
  leaveOrganisation: async (orgUuid: string, reason?: string) =>
    apiRequest(`/organizations/${orgUuid}/members/leave/`, { method: 'POST', body: reason ? { reason } : {} }),
}

/**
 * Payments API — payments/api.py, mounted at /payment/ (shared with mobile app)
 * Used here only for real bank list + account-name verification (Paystack-backed).
 */
export const paymentsApi = {
  getBanks: async () => apiRequest<{ data: Array<{ name: string; code: string }> }>('/payment/get-list-of-available-banks'),
  verifyAccountNumber: async (accountNumber: string, bankCode: string) =>
    apiRequest<{ data: { account_name: string; account_number: string } }>(
      `/payment/verify-account-number?account_number=${accountNumber}&bank_code=${bankCode}`
    ),
}

/**
 * Authentication API
 *
 * The dashboard uses the multi-step (OTP + optional security question)
 * login flow at /accounts/login/initiate|verify-otp|verify-security-answer -
 * distinct from the mobile app's single-step POST /accounts/login/, which
 * has no OTP/security-question step. Every step authenticates with a
 * 6-digit PIN, not a password.
 *
 * All three endpoints (and signup-organization) wrap their payload in
 * api_response()'s {data, message, status_code, success} envelope -
 * apiRequest() does NOT unwrap this, so every call site here reads
 * response.data.<field>, not response.<field> directly.
 */
type LoginEnvelope<T> = { data: T; message: string; status_code: number; success: boolean }
type RequiresOtpData = { phone_number: string; requires_otp: true }
type LoginTokenData = {
  data: { phone_number: string }
  access_token: string
  refresh_token: { token: string; header: string }
  token_type: string
}
type RequiresSecurityQuestionData = { phone_number: string; requires_security_question: true; question: string }
type SignupOrgData = {
  userId: string; phone: string; token: string; refreshToken: string
  organizationId: string; organizationName: string; approvalStatus: string; role: string
}

export const authApi = {
  initiateLogin: async (phoneNumber: string, pin: string) =>
    apiRequest<LoginEnvelope<RequiresOtpData>>('/accounts/login/initiate', { method: 'POST', body: { phone_number: phoneNumber, pin } }),
  verifyLoginOtp: async (phoneNumber: string, otpCode: string, latitude: number, longitude: number) =>
    apiRequest<LoginEnvelope<LoginTokenData | RequiresSecurityQuestionData>>('/accounts/login/verify-otp', {
      method: 'POST', body: { phone_number: phoneNumber, otp_code: otpCode, latitude, longitude },
    }),
  verifySecurityAnswer: async (phoneNumber: string, answer: string, latitude: number, longitude: number) =>
    apiRequest<LoginEnvelope<LoginTokenData>>('/accounts/login/verify-security-answer', {
      method: 'POST', body: { phone_number: phoneNumber, answer, latitude, longitude },
    }),
  signupOrganization: async (payload: {
    phone: string; pin: string; confirmPin: string; organizationName: string
    organizationType: string; contactEmail?: string; contactPhone?: string; rcNumber?: string
  }) => apiRequest<LoginEnvelope<SignupOrgData>>('/signup/signup-organization', { method: 'POST', body: payload }),
  refreshToken: async (refreshToken: string) =>
    apiRequest('/accounts/login/refresh-tokens', { method: 'POST', body: { refresh_token: refreshToken } }),
  getCurrentUser: async () => apiRequest('/accounts/login/get-user-profile'),
  logout: async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('org_uuid')
    return true
  },
}

/**
 * Export all API services
 */
export const apiClient = {
  org: orgApi,
  organization: organizationApi,
  reports: reportsApi,
  money: moneyApi,
  vehicles: vehiclesApi,
  drivers: driversApi,
  tracking: trackingApi,
  notifications: notificationsApi,
  settings: settingsApi,
  auth: authApi,
}

export default apiClient

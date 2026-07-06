/**
 * API Client for Soole Company Dashboard
 * Integrates with soole-backend REST API — no mock data.
 */

// Vite already surfaces VITE_-prefixed vars (from .env or the build-time shell
// env) on import.meta.env - `process` doesn't exist in the browser bundle, so
// a `process.env` fallback here throws ReferenceError and crashes the app
// whenever VITE_API_URL isn't set (which is always, since no .env exists yet).
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

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
    return apiRequest<{ trips: any[] }>(`/organizations/${orgUuid}/reports/trips${queryParams ? '?' + queryParams : ''}`)
  },
  getRevenueReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(`/organizations/${orgUuid}/reports/revenue${queryParams ? '?' + queryParams : ''}`)
  },
  getDriverReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest<{ drivers: any[] }>(`/organizations/${orgUuid}/reports/drivers${queryParams ? '?' + queryParams : ''}`)
  },
  getVehicleReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest<{ vehicles: any[] }>(`/organizations/${orgUuid}/reports/vehicles${queryParams ? '?' + queryParams : ''}`)
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
  initiateWithdrawal: async (orgUuid: string, payload: { amount: number; bank_account_id: string; pin: string; security_answer: string; description?: string }) =>
    apiRequest(`/organizations/${orgUuid}/money/withdraw`, { method: 'POST', body: payload }),
  /**
   * Downloads the CSV export directly (not JSON, so this bypasses apiRequest
   * and drives the browser's native file-save via a temporary blob link).
   */
  exportTransactionsCsv: async (orgUuid: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const query = params.toString()
    const token = localStorage.getItem('auth_token')

    const response = await fetch(`${API_BASE_URL}/organizations/${orgUuid}/money/transactions/export${query ? '?' + query : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error('Failed to export transactions')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `soole-transactions-${orgUuid}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
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
  /** docType must be one of: registration, road_worthiness, insurance, photo (organization.models.VehicleDocType). */
  uploadDocument: async (orgUuid: string, vehicleId: string, docType: string, fileUrl: string) =>
    apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}/documents`, {
      method: 'POST', body: { doc_type: docType, file_url: fileUrl },
    }),
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
  /** driverId here is the OrgInvitation's uuid for a still-pending (not yet signed up) driver. */
  resendInvite: async (orgUuid: string, driverId: string) =>
    apiRequest<{ success: boolean; driver_id: string; invite_status: string; message: string }>(
      `/fleet/${orgUuid}/drivers/${driverId}/resend-invite`, { method: 'POST' }
    ),
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
 * File upload API — common/api.py's file_upload_router, mounted at /permissions/
 * (shared with mobile app - the same presigned-S3-upload flow used there).
 */
export const uploadApi = {
  /**
   * Uploads a file to S3 via a presigned URL and returns its permanent public URL.
   * `purpose` namespaces the S3 key (e.g. 'org_logo', 'cac_document', 'vehicle_document').
   */
  uploadFile: async (file: File, purpose: string): Promise<string> => {
    const { upload_url, public_url } = await apiRequest<{ upload_url: string; object_key: string; public_url: string }>(
      '/permissions/generate-presigned-upload-url',
      { method: 'POST', body: { filename: file.name, content_type: file.type, purpose } }
    )
    const putResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!putResponse.ok) throw new Error('Failed to upload file to storage')
    return public_url
  },
}

/**
 * Settings API — organization_settings_api.py, mounted at /organizations/
 */
export const settingsApi = {
  getSettings: async (orgUuid: string) => apiRequest(`/organizations/${orgUuid}/settings`),
  updateSettings: async (orgUuid: string, payload: any) =>
    apiRequest(`/organizations/${orgUuid}/settings`, { method: 'PATCH', body: payload }),
  getMembers: async (orgUuid: string) =>
    apiRequest<any[]>(`/organizations/${orgUuid}/members/`),
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
  /** userUuid here is the member's USER uuid (organization.api.change_member_role takes it in the body, not the URL). */
  changeMemberRole: async (orgUuid: string, userUuid: string, newRole: string) =>
    apiRequest(`/organizations/${orgUuid}/members/role/`, { method: 'PATCH', body: { user_uuid: userUuid, new_role: newRole } }),
  /** userUuid here is the member's USER uuid, matching organization.api.remove_member's path param. */
  removeMember: async (orgUuid: string, userUuid: string) =>
    apiRequest(`/organizations/${orgUuid}/members/${userUuid}/`, { method: 'DELETE' }),
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
  signupOrganizationSendOtp: async (phone: string) =>
    apiRequest<LoginEnvelope<{ requires_otp: boolean }>>('/signup/signup-organization/send-otp', {
      method: 'POST', body: { phone }, token: null
    }),

  signupOrganization: async (payload: {
    phone: string; password: string; confirmPassword: string; organizationName: string
    organizationType: string; contactEmail?: string; contactPhone?: string; rcNumber?: string
    // Optional - for fast signup (completed later in Settings)
    cacDocumentUrl?: string
    // Optional - for fast signup (completed later in Settings)
    firstName?: string; lastName?: string; dob?: string; nin?: string
  }) => apiRequest<LoginEnvelope<SignupOrgData>>('/signup/signup-organization', {
    method: 'POST', body: payload, token: null
  }),
  /**
   * Team member completing signup from an invite SMS/link. One atomic call -
   * the OTP was already sent when the org invited them (no self-serve resend
   * for this flow), so phone+otp+pin+confirmPin all go together.
   */
  joinOrganization: async (payload: { phone: string; otp: string; pin: string; confirmPin: string }) =>
    apiRequest<LoginEnvelope<{ userId: string; phone: string; role: string; token: string; refreshToken: string; organizationId: string }>>(
      '/signup/join-organization', { method: 'POST', body: payload }
    ),
  refreshToken: async (refreshToken: string) =>
    apiRequest('/accounts/login/refresh-tokens', { method: 'POST', body: { refresh_token: refreshToken } }),
  /**
   * Re-confirms the signed-in user's own 6-digit PIN without a full OTP
   * re-login. Throws (via apiRequest) on an incorrect PIN - the caller
   * doesn't need to inspect the response body, just catch the rejection.
   */
  verifyPin: async (pin: string) =>
    apiRequest<{ data: boolean }>('/accounts/login/verify-pin', { method: 'POST', body: { pin } }),
  /**
   * Whether the signed-in user has a security question configured, and its
   * text (never the answer). Withdrawals require one to be set up first.
   */
  getSecurityQuestionStatus: async () =>
    apiRequest<{ data: { configured: boolean; question: string | null } }>('/accounts/login/security-question-status'),
  setSecurityQuestion: async (question: string, answer: string) =>
    apiRequest<{ data: { question: string } }>('/accounts/login/set-security-question', {
      method: 'POST', body: { question, answer },
    }),
  /**
   * Re-confirms the signed-in user's own security-question answer for a
   * step-up check inside an already-logged-in session (e.g. before changing
   * the security question itself, or before a withdrawal).
   */
  verifySecurityAnswerSelf: async (answer: string) =>
    apiRequest<{ data: boolean }>('/accounts/login/verify-security-answer-self', {
      method: 'POST', body: { answer },
    }),
  getCurrentUser: async () => {
    const res = await apiRequest<{ data: { uuid: string; fullname: string; email?: string; phone_number?: string } }>(
      '/accounts/login/get-user-profile'
    )
    return res.data
  },
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
  upload: uploadApi,
  auth: authApi,
}

export default apiClient

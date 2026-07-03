/**
 * API Client for Soole Company Dashboard
 * Integrates with soole-backend REST API
 */

// Get API base URL from environment
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000/api'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  token?: string
}

/**
 * Generic API request handler
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
    throw new Error(error.detail || error.message || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Organization/Trips API
 */
export const organizationApi = {
  // Get all trips for organization
  getTrips: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    const endpoint = `/organizations-trips/${orgUuid}/trips${queryParams ? '?' + queryParams : ''}`
    const response = await apiRequest(`${endpoint}`)
    return response
  },

  // Get trip details
  getTripDetail: async (orgUuid: string, tripUuid: string) => {
    return apiRequest(`/organizations-trips/${orgUuid}/trips/${tripUuid}`)
  },

  // Create new trip
  createTrip: async (orgUuid: string, tripData: any) => {
    return apiRequest(`/organizations-trips/${orgUuid}/trips`, {
      method: 'POST',
      body: tripData,
    })
  },

  // Update trip
  updateTrip: async (orgUuid: string, tripUuid: string, tripData: any) => {
    return apiRequest(`/organizations-trips/${orgUuid}/trips/${tripUuid}`, {
      method: 'PUT',
      body: tripData,
    })
  },

  // Process passenger refund
  refundPassenger: async (
    orgUuid: string,
    tripUuid: string,
    passengerId: string,
    refundData: any
  ) => {
    return apiRequest(
      `/organizations-trips/${orgUuid}/trips/${tripUuid}/passengers/${passengerId}/refund`,
      {
        method: 'POST',
        body: refundData,
      }
    )
  },

  // Board passenger (mark as boarded)
  boardPassenger: async (orgUuid: string, tripUuid: string, passengerId: string) => {
    return apiRequest(
      `/organizations-trips/${orgUuid}/trips/${tripUuid}/passengers/${passengerId}/board`,
      {
        method: 'POST',
      }
    )
  },
}

/**
 * Reports API (for revenue, driver, vehicle, route analytics)
 */
export const reportsApi = {
  // Get trips report
  getTripsReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/reports/trips${queryParams ? '?' + queryParams : ''}`
    )
  },

  // Get revenue report
  getRevenueReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/reports/revenue${queryParams ? '?' + queryParams : ''}`
    )
  },

  // Get driver report
  getDriverReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/reports/drivers${queryParams ? '?' + queryParams : ''}`
    )
  },

  // Get vehicle report
  getVehicleReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/reports/vehicles${queryParams ? '?' + queryParams : ''}`
    )
  },

  // Get route report
  getRouteReport: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/reports/routes${queryParams ? '?' + queryParams : ''}`
    )
  },
}

/**
 * Money/Finance API
 */
export const moneyApi = {
  // Get wallet balance
  getBalance: async (orgUuid: string) => {
    return apiRequest(`/organizations/${orgUuid}/money/balance`)
  },

  // Get transactions
  getTransactions: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/money/transactions${queryParams ? '?' + queryParams : ''}`
    )
  },

  // Get payouts
  getPayouts: async (orgUuid: string, filters?: any) => {
    const queryParams = new URLSearchParams(filters || {}).toString()
    return apiRequest(
      `/organizations/${orgUuid}/money/payouts${queryParams ? '?' + queryParams : ''}`
    )
  },

  // Process payout
  processPayout: async (orgUuid: string, payoutData: any) => {
    return apiRequest(`/organizations/${orgUuid}/money/payouts`, {
      method: 'POST',
      body: payoutData,
    })
  },
}

/**
 * Vehicles API
 */
export const vehiclesApi = {
  // Get all vehicles
  getVehicles: async (orgUuid: string) => {
    return apiRequest(`/organizations/${orgUuid}/vehicles`)
  },

  // Get vehicle details
  getVehicleDetail: async (orgUuid: string, vehicleId: string) => {
    return apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}`)
  },

  // Create vehicle
  createVehicle: async (orgUuid: string, vehicleData: any) => {
    return apiRequest(`/organizations/${orgUuid}/vehicles`, {
      method: 'POST',
      body: vehicleData,
    })
  },

  // Update vehicle
  updateVehicle: async (orgUuid: string, vehicleId: string, vehicleData: any) => {
    return apiRequest(`/organizations/${orgUuid}/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: vehicleData,
    })
  },

  // Get live vehicle locations
  getVehicleLocations: async (orgUuid: string) => {
    return apiRequest(`/organizations/${orgUuid}/vehicles/locations`)
  },
}

/**
 * Drivers/Team Members API
 */
export const driversApi = {
  // Get all drivers
  getDrivers: async (orgUuid: string) => {
    return apiRequest(`/organizations/${orgUuid}/team-members`)
  },

  // Get driver details
  getDriverDetail: async (orgUuid: string, driverId: string) => {
    return apiRequest(`/organizations/${orgUuid}/team-members/${driverId}`)
  },

  // Create/invite driver
  inviteDriver: async (orgUuid: string, inviteData: any) => {
    return apiRequest(`/organizations/${orgUuid}/team-members/invite`, {
      method: 'POST',
      body: inviteData,
    })
  },

  // Update driver
  updateDriver: async (orgUuid: string, driverId: string, driverData: any) => {
    return apiRequest(`/organizations/${orgUuid}/team-members/${driverId}`, {
      method: 'PUT',
      body: driverData,
    })
  },

  // Suspend driver
  suspendDriver: async (orgUuid: string, driverId: string) => {
    return apiRequest(`/organizations/${orgUuid}/team-members/${driverId}/suspend`, {
      method: 'POST',
    })
  },

  // Get driver earnings
  getDriverEarnings: async (orgUuid: string, driverId: string) => {
    return apiRequest(`/organizations/${orgUuid}/team-members/${driverId}/earnings`)
  },
}

/**
 * Authentication API
 */
export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    return apiRequest('/accounts/login/', {
      method: 'POST',
      body: { email, password },
    })
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    return apiRequest('/accounts/login/refresh-tokens', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    })
  },

  // Get current user profile
  getCurrentUser: async () => {
    return apiRequest('/accounts/login/get-user-profile')
  },

  // Logout
  logout: async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    return true
  },
}

/**
 * Export all API services
 */
export const apiClient = {
  organization: organizationApi,
  reports: reportsApi,
  money: moneyApi,
  vehicles: vehiclesApi,
  drivers: driversApi,
  auth: authApi,
}

export default apiClient

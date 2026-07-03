import { apiClient } from './client'

/**
 * Trips API Integration with Real Backend Endpoints
 */
export const tripsApi = {
  /**
   * Get all trips for the authenticated organization
   */
  getTrips: async (orgUuid?: string) => {
    try {
      // If orgUuid not provided, get from localStorage
      const uuid = orgUuid || localStorage.getItem('org_uuid')
      if (!uuid) throw new Error('Organization UUID not found')

      return await apiClient.organization.getTrips(uuid)
    } catch (error) {
      console.error('Failed to fetch trips:', error)
      throw error
    }
  },

  /**
   * Get dashboard statistics (trips, routes, vehicles, drivers)
   */
  getDashboardStats: async (orgUuid?: string) => {
    try {
      const uuid = orgUuid || localStorage.getItem('org_uuid')
      if (!uuid) throw new Error('Organization UUID not found')

      const [trips, tripsReport, driverReport, vehicleReport] = await Promise.all([
        apiClient.organization.getTrips(uuid),
        apiClient.reports.getTripsReport(uuid),
        apiClient.reports.getDriverReport(uuid),
        apiClient.reports.getVehicleReport(uuid),
      ])

      return {
        trips: trips.trips || [],
        tripsReport: tripsReport.trips || [],
        drivers: driverReport.drivers || [],
        vehicles: vehicleReport.vehicles || [],
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      throw error
    }
  },

  /**
   * Get revenue/financial data
   */
  getRevenue: async (orgUuid?: string) => {
    try {
      const uuid = orgUuid || localStorage.getItem('org_uuid')
      if (!uuid) throw new Error('Organization UUID not found')

      const report = await apiClient.reports.getRevenueReport(uuid)
      return report.revenue_data || []
    } catch (error) {
      console.error('Failed to fetch revenue:', error)
      throw error
    }
  },

  /**
   * Get trip details
   */
  getTripDetail: async (orgUuid: string, tripUuid: string) => {
    try {
      return await apiClient.organization.getTripDetail(orgUuid, tripUuid)
    } catch (error) {
      console.error('Failed to fetch trip details:', error)
      throw error
    }
  },

  /**
   * Create new trip
   */
  createTrip: async (orgUuid: string, tripData: any) => {
    try {
      return await apiClient.organization.createTrip(orgUuid, tripData)
    } catch (error) {
      console.error('Failed to create trip:', error)
      throw error
    }
  },

  /**
   * Update trip
   */
  updateTrip: async (orgUuid: string, tripUuid: string, tripData: any) => {
    try {
      return await apiClient.organization.updateTrip(orgUuid, tripUuid, tripData)
    } catch (error) {
      console.error('Failed to update trip:', error)
      throw error
    }
  },

  /**
   * Process passenger refund
   */
  refundPassenger: async (
    orgUuid: string,
    tripUuid: string,
    passengerId: string,
    refundData: any
  ) => {
    try {
      return await apiClient.organization.refundPassenger(
        orgUuid,
        tripUuid,
        passengerId,
        refundData
      )
    } catch (error) {
      console.error('Failed to process refund:', error)
      throw error
    }
  },

  /**
   * Board passenger
   */
  boardPassenger: async (orgUuid: string, tripUuid: string, passengerId: string) => {
    try {
      return await apiClient.organization.boardPassenger(orgUuid, tripUuid, passengerId)
    } catch (error) {
      console.error('Failed to board passenger:', error)
      throw error
    }
  },
}

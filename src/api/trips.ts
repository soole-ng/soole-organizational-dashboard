import { apiClient } from './client'
import { adaptTrip, adaptWeeklyRevenueDay } from '../lib/adapters'

/**
 * Trips API Integration with Real Backend Endpoints
 */
export const tripsApi = {
  /**
   * Get all trips for the authenticated organization, adapted to the frontend Trip shape.
   */
  getTrips: async (orgUuid?: string) => {
    try {
      const uuid = orgUuid || localStorage.getItem('org_uuid')
      if (!uuid) throw new Error('Organization UUID not found')

      const res: any = await apiClient.organization.getTrips(uuid)
      return (res.trips || []).map(adaptTrip)
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
   * Get this week's revenue broken down by day, plus week-over-week comparison.
   */
  getRevenue: async (orgUuid?: string) => {
    try {
      const uuid = orgUuid || localStorage.getItem('org_uuid')
      if (!uuid) throw new Error('Organization UUID not found')

      const week: any = await apiClient.money.getWeeklyRevenue(uuid)
      return (week.daily_breakdown || []).map(adaptWeeklyRevenueDay)
    } catch (error) {
      console.error('Failed to fetch revenue:', error)
      throw error
    }
  },

  /**
   * Get this week's total revenue plus week-over-week comparison summary.
   */
  getWeeklyRevenueSummary: async (orgUuid?: string) => {
    const uuid = orgUuid || localStorage.getItem('org_uuid')
    if (!uuid) throw new Error('Organization UUID not found')
    return apiClient.money.getWeeklyRevenue(uuid) as Promise<{
      total_revenue: number
      total_trips: number
      comparison_previous_week?: { revenue_change_percent: number; previous_week_revenue: string } | null
    }>
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

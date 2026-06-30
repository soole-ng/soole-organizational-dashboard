import { mockTrips, mockRoutes, mockVehicles, mockDrivers } from '../lib/mockData'

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const tripsApi = {
  getTrips: async () => {
    await delay(800) // Simulate network latency
    return mockTrips
  },
  
  getDashboardStats: async () => {
    await delay(600)
    return {
      trips: mockTrips,
      routes: mockRoutes,
      vehicles: mockVehicles,
      drivers: mockDrivers
    }
  },

  getRevenue: async () => {
    await delay(600)
    const res = await fetch('/mock-data.json')
    const data = await res.json()
    return data.weeklyRevenue || []
  }
}

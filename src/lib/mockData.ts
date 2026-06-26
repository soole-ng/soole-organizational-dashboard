import type { Driver, Vehicle, Route, Trip, Transaction, Payout, Alert, OrganizationMember } from '../types'

let cachedData: any = null;

async function loadData() {
  if (cachedData) return cachedData;
  try {
    const response = await fetch('/mock-data.json');
    if (!response.ok) throw new Error(`Failed to load mock data: ${response.status}`);
    cachedData = await response.json();
    return cachedData;
  } catch (error) {
    console.error('Error loading mock data:', error);
    throw error;
  }
}

export async function getMockData() {
  const data = await loadData();
  return {
    routes: data.routes as Route[],
    drivers: data.drivers as Driver[],
    vehicles: data.vehicles as Vehicle[],
    trips: data.trips as Trip[],
    transactions: data.transactions as Transaction[],
    payouts: data.payouts as Payout[],
    alerts: data.alerts as Alert[],
    organizationMembers: data.organizationMembers as OrganizationMember[],
    weeklyRevenue: data.weeklyRevenue,
    vehicleLocations: data.vehicleLocations,
    aiAssistantSuggestions: data.aiAssistantSuggestions,
  };
}

export const mockRoutes: Route[] = [];
export const mockDrivers: Driver[] = [];
export const mockVehicles: Vehicle[] = [];
export const mockTrips: Trip[] = [];
export const mockTransactions: Transaction[] = [];
export const mockPayouts: Payout[] = [];
export const mockAlerts: Alert[] = [];
export const mockOrganizationMembers: OrganizationMember[] = [];
export const weeklyRevenue: any[] = [];
export const mockVehicleLocations: any[] = [];

export const mockPassengers = (tripId: string) => [
  { id: `${tripId}-p1`, seatNumber: 1, name: 'Adaeze Okonkwo', phone: '+2348031112233', paymentStatus: 'paid' as const, boardingStatus: 'boarded' as const, boardedAt: '2026-06-26T06:02:00', fare: 5000 },
  { id: `${tripId}-p2`, seatNumber: 2, name: 'Emeka Nwosu', phone: '+2348044556677', paymentStatus: 'paid' as const, boardingStatus: 'boarded' as const, boardedAt: '2026-06-26T05:58:00', fare: 5000 },
  { id: `${tripId}-p3`, seatNumber: 3, name: 'Halima Abdullahi', phone: '+2348077889900', paymentStatus: 'paid' as const, boardingStatus: 'waiting' as const, fare: 5000 },
  { id: `${tripId}-p4`, seatNumber: 4, name: 'Tunde Fashola', phone: '+2348055667788', paymentStatus: 'pending' as const, boardingStatus: 'waiting' as const, fare: 5000 },
  { id: `${tripId}-p5`, seatNumber: 5, name: 'Ngozi Eze', phone: '+2348022334455', paymentStatus: 'paid' as const, boardingStatus: 'boarded' as const, boardedAt: '2026-06-26T06:05:00', fare: 5000 },
]

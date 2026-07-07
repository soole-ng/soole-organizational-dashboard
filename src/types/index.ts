export type StatusVariant =
  | 'verified' | 'pending' | 'rejected' | 'suspended' | 'active' | 'inactive'
  | 'scheduled' | 'boarding' | 'in_progress' | 'completed' | 'cancelled' | 'draft'
  | 'sent' | 'received' | 'failed' | 'retired'

export interface DriverReview {
  id: string
  passengerName: string
  rating: number
  comment: string
  date: string
  tripId?: string
  tripRoute?: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  photo?: string
  status: StatusVariant
  vehicleId?: string
  vehiclePlate?: string
  tripsCompleted: number
  joinedAt: string
  avgRating?: number
  reviews?: DriverReview[]
  /** True for a still-pending invited driver row (id is an OrgInvitation uuid, not a real user uuid) - can't be assigned to a vehicle/trip. */
  isPendingInvite?: boolean
}

export interface Vehicle {
  id: string
  plate: string
  model: string
  year: number
  capacity: number
  type: 'Sienna' | 'Hiace' | 'Coaster' | 'Other'
  fuelType: 'petrol' | 'diesel'
  status: StatusVariant
  /** The real operational status (active/suspended/retired) - `status` above overlays
   *  document-verification state on top of this and shouldn't be used to decide
   *  whether the vehicle is actually suspended/retired. */
  operationalStatus: 'active' | 'suspended' | 'retired'
  assignedDriverId?: string
  assignedDriverName?: string
  photo?: string
  fuelLevel: number
  totalKm: number
  documents: VehicleDocument[]
}

export interface VehicleDocument {
  type: 'registration' | 'road_worthiness' | 'insurance' | 'photo_front' | 'photo_back' | 'photo_interior'
  label: string
  status: 'uploaded' | 'pending' | 'approved' | 'rejected' | 'missing'
  expiresAt?: string
}

export interface Route {
  id: string
  origin: string
  destination: string
  baseFare: number
  durationMinutes: number
  distanceKm: number
}

export interface Trip {
  id: string
  routeId: string
  routeName: string
  origin: string
  destination: string
  vehicleId: string
  vehiclePlate: string
  driverId: string
  driverName: string
  departureAt: string
  capacity: number
  bookedSeats: number
  status: StatusVariant
  fare: number
  grossRevenue: number
  netRevenue: number
  passengers: Passenger[]
  distanceKm: number
  durationMinutes: number
  avgSpeedKmh: number
  estimatedFuelLiters: number
}

export interface Passenger {
  id: string
  seatNumber: number
  name: string
  phone: string
  paymentStatus: 'paid' | 'pending' | 'refunded'
  boardingStatus: 'waiting' | 'boarded' | 'no_show'
  boardedAt?: string
  fare: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  type: 'booking' | 'refund' | 'payout'
  gross: number
  commission: number
  net: number
  balance: number
  tripId?: string
}

export interface Payout {
  id: string
  date: string
  amount: number
  status: StatusVariant
  bankRef: string
  bookingCount: number
  expectedArrival: string
}

export interface Alert {
  id: string
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
  action?: { label: string; href: string }
  createdAt: string
}

export interface OrganizationMember {
  /** The member's USER uuid - remove/role-change endpoints operate on this, not a separate membership id. */
  id: string
  name: string
  email?: string
  phone?: string
  role: 'owner' | 'finance' | 'manager' | 'viewer'
  joinedAt: string
}

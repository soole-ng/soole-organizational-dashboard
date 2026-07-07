/**
 * Adapters — convert soole-backend response shapes (snake_case, Ninja schemas)
 * into the dashboard's frontend types (types/index.ts).
 */
import type {
  Driver, DriverReview, Vehicle, Trip, Transaction, Payout, Alert, OrganizationMember,
  Passenger, VehicleDocument, StatusVariant,
} from '../types'

// Fallback only, for the rare call site that can't reach OrgContext/the
// org's real commission_rate (see useApiData.ts/OrgContext.tsx) - matches
// settings.SOOLE_FEE_PERCENTAGE's backend default. Every real UI path
// passes the org's actual rate explicitly instead of relying on this.
const DEFAULT_COMMISSION_RATE = 0.1

function toStatusVariant(status: string | null | undefined): StatusVariant {
  const s = (status || '').toLowerCase()
  const known: StatusVariant[] = [
    'verified', 'pending', 'rejected', 'suspended', 'active', 'inactive',
    'scheduled', 'boarding', 'in_progress', 'completed', 'cancelled', 'draft',
    'sent', 'received', 'failed', 'retired',
  ]
  if ((known as string[]).includes(s)) return s as StatusVariant
  if (s === 'upcoming' || s === 'available') return 'scheduled'
  if (s === 'active') return 'active'
  return 'pending'
}

/** org_trip_api.OrgDriverResponseSchema — {uuid, fullname, phone_number, org_status, assigned_vehicle_plate} */
export function adaptDriverIdentity(raw: any): Driver {
  return {
    id: raw.uuid,
    name: raw.fullname,
    phone: raw.phone_number,
    photo: raw.photo ?? undefined,
    status: toStatusVariant(raw.org_status),
    vehiclePlate: raw.assigned_vehicle_plate ?? undefined,
    tripsCompleted: 0,
    joinedAt: '',
    avgRating: 0,
    reviews: [],
  }
}

/** organization_reports_api.DriverReportItemSchema — {id, name, trips_completed, total_earnings, average_rating, ...} */
export function mergeDriverStats(driver: Driver, stats: any | undefined): Driver {
  if (!stats) return driver
  return {
    ...driver,
    tripsCompleted: stats.trips_completed ?? driver.tripsCompleted,
    avgRating: stats.average_rating ?? driver.avgRating,
  }
}

/**
 * fleet.api.DriverListItemSchema — {id, name, phone, status, vehicle_id,
 * vehicle_plate, trips_completed, joined_at, avg_rating, ...}. Unlike
 * adaptDriverIdentity/mergeDriverStats (org_trip_api's thinner list, which
 * also only ever returns active drivers), this is a single call that
 * already includes trip/rating stats AND surfaces still-pending invited
 * drivers (id is an OrgInvitation uuid for those rows, matching
 * fleetApi.resendInvite's expectation).
 */
export function adaptFleetDriver(raw: any): Driver {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    photo: raw.photo ?? undefined,
    status: toStatusVariant(raw.status),
    vehicleId: raw.vehicle_id ?? undefined,
    vehiclePlate: raw.vehicle_plate ?? undefined,
    tripsCompleted: raw.trips_completed ?? 0,
    joinedAt: raw.joined_at ?? '',
    avgRating: raw.avg_rating ?? 0,
    // Backend now actually populates this (previously hardcoded []
    // server-side too - DriverDetailModal's whole "Passenger Comments"
    // section had nothing to show regardless of real review data).
    reviews: (raw.reviews || []).map(adaptDriverReview),
    isPendingInvite: raw.is_pending_invite ?? false,
  }
}

/** fleet.api.DriverReviewSchema / DriverDetailSchema.reviews — {id, passenger_name, rating, comment, date} */
export function adaptDriverReview(raw: any): DriverReview {
  return {
    id: raw.id,
    passengerName: raw.passenger_name,
    rating: raw.rating,
    comment: raw.comment ?? '',
    date: raw.date,
    tripId: raw.trip_id ?? undefined,
    tripRoute: raw.trip_route ?? undefined,
  }
}

/** organization_vehicles_api.VehicleResponseSchema */
export function adaptVehicle(raw: any): Vehicle {
  const documents: VehicleDocument[] = (raw.documents || []).map((d: any) => ({
    type: d.doc_type,
    label: d.doc_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    status: d.verified_at ? 'approved' : (d.rejection_reason ? 'rejected' : 'pending'),
    expiresAt: undefined,
  }))

  return {
    id: raw.id,
    plate: raw.plate,
    model: `${raw.brand ?? ''} ${raw.model ?? ''}`.trim(),
    year: raw.year,
    capacity: raw.capacity,
    type: (['Sienna', 'Hiace', 'Coaster'].includes(raw.vehicle_type) ? raw.vehicle_type : 'Other') as Vehicle['type'],
    fuelType: 'petrol',
    // verification_status and status (operational) are independent backend
    // fields - a suspended/retired vehicle keeps whatever verification_status
    // it already had, so showing "verified" unconditionally once documents
    // were approved would hide a real suspension/retirement from staff.
    // Operational status wins whenever it's not the default "active".
    status: raw.status && raw.status !== 'active'
      ? toStatusVariant(raw.status)
      : (raw.verification_status === 'verified' ? 'verified' : toStatusVariant(raw.status)),
    operationalStatus: (['active', 'suspended', 'retired'].includes(raw.status) ? raw.status : 'active') as Vehicle['operationalStatus'],
    assignedDriverId: raw.assigned_driver_id ?? undefined,
    assignedDriverName: raw.assigned_driver_name ?? undefined,
    fuelLevel: 0,
    totalKm: 0,
    documents,
  }
}

/** organization_trips_api.TripListResponseSchema / TripDetailResponseSchema */
export function adaptTrip(raw: any, commissionRate: number = DEFAULT_COMMISSION_RATE): Trip {
  const pricePerSeat = parseFloat(raw.price_per_seat ?? '0')
  const bookedSeats = raw.booked_seats ?? 0
  const gross = pricePerSeat * bookedSeats
  const net = gross * (1 - commissionRate)

  return {
    id: raw.uuid,
    routeId: '',
    routeName: `${raw.origin_address} → ${raw.destination_address}`,
    origin: raw.origin_address,
    destination: raw.destination_address,
    vehicleId: raw.vehicle_uuid ?? '',
    vehiclePlate: raw.vehicle_plate ?? 'Unassigned',
    driverId: raw.driver_uuid ?? '',
    driverName: raw.driver_name ?? 'Unassigned',
    departureAt: raw.departure_date,
    capacity: raw.total_seats,
    bookedSeats,
    status: toStatusVariant(raw.status),
    fare: pricePerSeat,
    grossRevenue: gross,
    netRevenue: net,
    passengers: (raw.passengers || []).map(adaptPassenger),
    distanceKm: raw.distance_km ?? 0,
    durationMinutes: raw.duration_minutes ?? 0,
    avgSpeedKmh: raw.avg_speed_kmh ?? 0,
    estimatedFuelLiters: raw.estimated_fuel_liters ?? 0,
  }
}

/** organization_trips_api.PassengerSchema */
export function adaptPassenger(raw: any): Passenger {
  return {
    id: raw.uuid,
    seatNumber: raw.seat_number ?? 0,
    name: raw.name,
    phone: raw.phone,
    paymentStatus: raw.payment_status === 'paid' || raw.payment_status === 'confirmed' ? 'paid'
      : raw.payment_status === 'refunded' ? 'refunded' : 'pending',
    boardingStatus: raw.status === 'onboard' ? 'boarded' : raw.status === 'no_show' ? 'no_show' : 'waiting',
    boardedAt: raw.boarded_at ?? undefined,
    fare: parseFloat(raw.fare ?? '0'),
  }
}

/** organization_money_api.TransactionItemSchema — {id, type, amount, status, description, date, related_trip_id} */
export function adaptTransaction(raw: any, commissionRate: number = DEFAULT_COMMISSION_RATE): Transaction {
  const gross = Number(raw.amount ?? 0)
  const commission = gross * commissionRate
  return {
    id: raw.id,
    date: raw.date,
    description: raw.description ?? raw.type,
    type: raw.type === 'trip_revenue' ? 'booking' : (raw.type === 'refund' ? 'refund' : 'payout'),
    gross,
    commission,
    net: gross - commission,
    balance: 0,
    tripId: raw.related_trip_id ?? undefined,
  }
}

/** organization_money_api.PayoutItemSchema — {id, driver_name, driver_phone, amount, trips_count, period_end, status, date_processed} */
export function adaptPayout(raw: any): Payout {
  return {
    id: raw.id,
    date: raw.date_processed ?? raw.period_end,
    amount: Number(raw.amount ?? 0),
    status: toStatusVariant(raw.status === 'processed' ? 'received' : raw.status),
    bankRef: `${raw.driver_name ?? 'Driver'} · ${raw.driver_phone ?? ''}`.trim(),
    bookingCount: raw.trips_count ?? 0,
    expectedArrival: raw.date_processed ?? raw.period_end,
  }
}

/** organization_tracking_api.VehicleLocationSchema */
export function adaptVehicleLocation(raw: any) {
  const onTrip = raw.status === 'in_progress' || raw.status === 'boarding'
  return {
    id: raw.vehicle_uuid ?? raw.trip_uuid,
    plate: raw.vehicle_plate ?? 'N/A',
    driver: raw.driver_name ?? 'Unassigned',
    status: (onTrip ? 'on_trip' : 'idle') as 'on_trip' | 'idle',
    lat: raw.latitude,
    lng: raw.longitude,
    trip: raw.trip_route ?? null,
    eta: raw.eta ?? null,
    speed: raw.speed ?? 0,
  }
}

/** organization_settings_api.TeamMemberResponseSchema */
export function adaptOrganizationMember(raw: any): OrganizationMember {
  return {
    id: raw.user_uuid,
    name: raw.user_fullname,
    email: raw.user_email ?? undefined,
    phone: raw.user_phone ?? undefined,
    role: (['owner', 'finance', 'manager', 'viewer'].includes(raw.role) ? raw.role : 'viewer') as OrganizationMember['role'],
    joinedAt: raw.joined_at,
  }
}

/** organization_notifications_api.NotificationSchema */
export function adaptAlert(raw: any): Alert {
  return {
    id: raw.uuid,
    type: (['warning', 'danger', 'info'].includes(raw.type) ? raw.type : 'info') as Alert['type'],
    title: raw.title,
    message: raw.message,
    action: raw.action_label && raw.action_href ? { label: raw.action_label, href: raw.action_href } : undefined,
    createdAt: raw.created_at,
  }
}

/** organization_money_api.WeeklyRevenueItemSchema — {date, day_name, trips, revenue, bookings, passengers} */
export function adaptWeeklyRevenueDay(raw: any, commissionRate: number = DEFAULT_COMMISSION_RATE) {
  const gross = Number(raw.revenue ?? 0)
  return {
    day: (raw.day_name || '').slice(0, 3),
    gross,
    net: gross * (1 - commissionRate),
  }
}

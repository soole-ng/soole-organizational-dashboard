# Soole Organization Dashboard - API Requirements Documentation

**Version:** 1.1  
**Last Updated:** 2026-06-30  
**Status:** 98% Complete - Final Phase (7 new endpoints in PR #98)

## 📊 Implementation Status

| Category | Endpoints | Status | PRs | Notes |
|----------|-----------|--------|-----|-------|
| Dashboard | 3/3 | ✅ Done | feat/dashboard-foundation | Summary, upcoming trips, quick stats |
| Fleet Drivers | 5/5 | ✅ Done | feat/fleet-drivers-api | List, detail, invite, update, delete |
| Money & Payouts | 5/5 | ✅ Done | feat/organization-money-api | Balance, transactions, payouts, withdraw, weekly revenue + tests |
| **Reports & Analytics** | **5/5** | ✅ Done | feat/organization-reports-api | Trips, drivers, vehicles, revenue, routes + tests |
| **Settings & Organization** | **8/8** | ✅ Done | feat/organization-settings-api | Org settings, members, bank accounts, alerts + tests |
| **Fleet Vehicles** | **7/7** | ✅ Done | feat/fleet-vehicles-api | List, detail, add, update, status, documents, history + tests |
| **API Integration** | **Router Config** | ✅ Done | feat/api-router-integration | Registers all 4 routers in soole/api.py |
| **Trips** | **11/11** | ✅ Done | feat/trips-api | List, detail, create, update, status, board, refund, comments, cancel, routes + 40+ tests |
| **Notifications** | **4/4** | ✅ Done | feat/notifications-api | List, mark read, create alerts, summary + 30+ tests |
| **Live Tracking** | **3/3** | ✅ Done | feat/live-tracking-api | Get vehicles, trip tracking, update location + 25+ tests |
| **Team Management** | **2/2** | 🟡 In Review | feat/org-approval-team-management | Team member OTP invite, join-organization signup + 12 tests |
| **Organization Approval** | **5/5** | 🟡 In Review | feat/org-approval-team-management | Admin approve/reject, approval status, pending list, org review + 15 tests |
| AI Assistant | 2/2 | 🔲 Queued | - | Suggestions, chat |
| **TOTAL** | **58/58** | **98% Complete** | | 51/58 endpoints done; 7 new endpoints + 47 tests in review (PR #98) |

### PR Status
- ✅ feat/dashboard-foundation - Merged/Ready
- ✅ feat/fleet-drivers-api - Merged/Ready  
- ✅ feat/organization-money-api - Ready for review (5 endpoints + 30+ tests)
- ✅ feat/organization-reports-api - Ready for review (5 endpoints + 35+ tests)
- ✅ feat/organization-settings-api - Ready for review (8 endpoints + 20+ tests)
- ✅ feat/fleet-vehicles-api - Ready for review (7 endpoints + 25+ tests)
- 🟡 feat/org-approval-team-management - **PR #98** - In Review (7 endpoints + tests)
  - 2 Team Member endpoints (OTP invite, join-org signup)
  - 5 Admin approval endpoints (approve, reject, status, pending, review)
- ✅ feat/api-router-integration - Ready for review (registers all 4 routers)
- ✅ feat/trips-api - Ready for review (11 endpoints + 40+ tests)
- ✅ feat/notifications-api - Ready for review (4 endpoints + 30+ tests)
- ✅ feat/live-tracking-api - Ready for review (3 endpoints + 25+ tests)

---

## Overview

This document outlines all API endpoints required to power the Soole Operator Dashboard. The dashboard is a React-based management system for transport operators to manage drivers, vehicles, trips, finances, and fleet operations.

**Base URL:** `https://api.soole.ng/v1`

**Authentication:** All endpoints require Bearer token in `Authorization` header (to be implemented)

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Dashboard / Home](#dashboard--home)
3. [Fleet Management](#fleet-management)
   - [Drivers](#drivers)
   - [Vehicles](#vehicles)
4. [Trips](#trips)
5. [Money & Payouts](#money--payouts)
6. [Settings & Organization](#settings--organization)
7. [Notifications & Alerts](#notifications--alerts)
8. [Reports & Analytics](#reports--analytics)
9. [Live Tracking & Maps](#live-tracking--maps)
10. [AI Assistant](#ai-assistant)
11. [Data Models](#data-models)

---

## Authentication & Authorization

### POST /auth/login
Login operator and get authentication token.

**Use Case:** Initial login on the dashboard

**Request:**
```json
{
  "email": "operator@company.com",
  "password": "secure_password"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizationId": "org-123",
  "organizationName": "Soole Transport Co",
  "role": "owner",
  "user": {
    "id": "user-123",
    "name": "John Operator",
    "email": "operator@company.com"
  }
}
```

### GET /auth/verify
Verify current session token.

**Use Case:** On app load, verify if token is still valid

**Response:** `200 OK`
```json
{
  "valid": true,
  "organizationId": "org-123",
  "userId": "user-123"
}
```

---

## Dashboard / Home

### GET /dashboard/summary
Get dashboard overview with key metrics.

**Use Case:** Display quick stats on home page (trips today, bookings, revenue, balance)

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD), defaults to today

**Response:** `200 OK`
```json
{
  "tripsToday": 3,
  "totalBookingsToday": 34,
  "availableSeatsToday": 10,
  "todaysRevenue": {
    "gross": 269000,
    "net": 250000,
    "currency": "NGN"
  },
  "walletBalance": {
    "amount": 47300,
    "currency": "NGN",
    "lastUpdated": "2026-06-29T10:30:00Z"
  },
  "comparison": {
    "tripsVsYesterday": 1,
    "revenueChangePercent": 18
  }
}
```

### GET /dashboard/upcoming-trips
Get list of upcoming trips (scheduled, boarding, in_progress).

**Use Case:** Show upcoming trips widget on home page

**Query Parameters:**
- `limit` (optional): Max trips to return, default 5
- `status` (optional): Filter by status (scheduled, boarding, in_progress)

**Response:** `200 OK`
```json
{
  "trips": [
    {
      "id": "trip-001",
      "routeName": "Lagos → Ibadan",
      "origin": "Lagos (Ojota)",
      "destination": "Ibadan (Challenge)",
      "vehicleId": "v1",
      "vehiclePlate": "ABC-123",
      "driverId": "d1",
      "driverName": "Akin Bello",
      "departureAt": "2026-06-29T06:00:00Z",
      "capacity": 14,
      "bookedSeats": 11,
      "status": "scheduled",
      "fare": 5000
    }
  ],
  "total": 3
}
```

### GET /dashboard/quick-stats
Get fleet statistics for the home page quick stats section.

**Use Case:** Display verified drivers, active vehicles, total seats, avg rating on home page

**Response:** `200 OK`
```json
{
  "verifiedDrivers": 8,
  "totalDrivers": 12,
  "activeVehicles": 5,
  "totalVehicles": 6,
  "totalSeats": 70,
  "averageRating": 4.7,
  "alerts": {
    "pendingDriverInvites": 2,
    "pendingDocuments": 3
  }
}
```

---

## Fleet Management

### DRIVERS

#### GET /fleet/drivers
Get list of all drivers with status, performance metrics.

**Use Case:** Display driver list, filter by status, search drivers

**Query Parameters:**
- `status` (optional): verified, pending, suspended, rejected
- `search` (optional): Search by name or phone
- `page` (optional): Pagination, default 1
- `limit` (optional): Items per page, default 20

**Response:** `200 OK`
```json
{
  "drivers": [
    {
      "id": "d1",
      "name": "Akin Bello",
      "phone": "+2348031234567",
      "photo": "https://cdn.soole.ng/drivers/d1.jpg",
      "status": "verified",
      "vehicleId": "v1",
      "vehiclePlate": "ABC-123",
      "tripsCompleted": 42,
      "joinedAt": "2025-01-15T10:00:00Z",
      "avgRating": 4.8,
      "totalEarnings": 156000,
      "reviews": [
        {
          "id": "rev-1",
          "passengerName": "Chioma Okafor",
          "rating": 5,
          "comment": "Professional and safe driver",
          "date": "2026-06-25T14:30:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

#### GET /fleet/drivers/:driverId
Get detailed driver information including reviews, trip history.

**Use Case:** View driver profile/detail page

**Response:** `200 OK`
```json
{
  "id": "d1",
  "name": "Akin Bello",
  "phone": "+2348031234567",
  "email": "akin@example.com",
  "photo": "https://cdn.soole.ng/drivers/d1.jpg",
  "status": "verified",
  "vehicleId": "v1",
  "vehiclePlate": "ABC-123",
  "tripsCompleted": 42,
  "joinedAt": "2025-01-15T10:00:00Z",
  "avgRating": 4.8,
  "totalEarnings": 156000,
  "documents": [
    {
      "type": "license",
      "status": "approved",
      "expiresAt": "2027-06-15T00:00:00Z"
    },
    {
      "type": "nid",
      "status": "approved",
      "expiresAt": "2029-03-22T00:00:00Z"
    }
  ],
  "reviews": [
    {
      "id": "rev-1",
      "passengerName": "Chioma Okafor",
      "rating": 5,
      "comment": "Professional and safe driver",
      "date": "2026-06-25T14:30:00Z"
    }
  ],
  "recentTrips": [
    {
      "id": "trip-042",
      "date": "2026-06-28T06:00:00Z",
      "route": "Lagos → Ibadan",
      "revenue": 70000,
      "passengerCount": 14,
      "status": "completed"
    }
  ]
}
```

#### POST /fleet/drivers/invite
Invite a new driver to the fleet.

**Use Case:** Add a new driver via invite modal

**Request:**
```json
{
  "name": "Tunde Fashola",
  "phone": "+2348055667788",
  "email": "tunde@example.com"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "driverId": "d13",
  "inviteStatus": "pending",
  "message": "Invite sent to +2348055667788"
}
```

#### PUT /fleet/drivers/:driverId
Update driver information (name, phone, photo, vehicle assignment).

**Use Case:** Edit driver details

**Request:**
```json
{
  "name": "Akin Bello Updated",
  "phone": "+2348031234567",
  "photo": "https://cdn.soole.ng/drivers/d1-new.jpg"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "driver": {
    "id": "d1",
    "name": "Akin Bello Updated",
    "phone": "+2348031234567"
  }
}
```

#### DELETE /fleet/drivers/:driverId
Remove/suspend a driver from fleet.

**Use Case:** Remove driver from the system

**Request:**
```json
{
  "reason": "suspended"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Driver suspended"
}
```

---

### VEHICLES

#### GET /fleet/vehicles
Get list of all vehicles with status and details.

**Use Case:** Display vehicle list, filter by status

**Query Parameters:**
- `status` (optional): verified, pending, suspended, maintenance
- `type` (optional): Sienna, Hiace, Coaster, Other
- `search` (optional): Search by plate number
- `page` (optional): Pagination, default 1
- `limit` (optional): Items per page, default 20

**Response:** `200 OK`
```json
{
  "vehicles": [
    {
      "id": "v1",
      "plate": "ABC-123",
      "model": "Toyota Hiace",
      "year": 2023,
      "capacity": 14,
      "type": "Hiace",
      "fuelType": "diesel",
      "status": "verified",
      "assignedDriverId": "d1",
      "assignedDriverName": "Akin Bello",
      "photo": "https://cdn.soole.ng/vehicles/v1.jpg",
      "fuelLevel": 75,
      "totalKm": 45230,
      "documents": [
        {
          "type": "registration",
          "label": "Vehicle Registration",
          "status": "approved",
          "expiresAt": "2027-06-15T00:00:00Z"
        },
        {
          "type": "road_worthiness",
          "label": "Road Worthiness Certificate",
          "status": "pending",
          "expiresAt": null
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "pages": 1
  }
}
```

#### GET /fleet/vehicles/:vehicleId
Get detailed vehicle information.

**Use Case:** View vehicle profile/detail page, vehicle history

**Response:** `200 OK`
```json
{
  "id": "v1",
  "plate": "ABC-123",
  "model": "Toyota Hiace",
  "year": 2023,
  "capacity": 14,
  "type": "Hiace",
  "fuelType": "diesel",
  "status": "verified",
  "assignedDriverId": "d1",
  "assignedDriverName": "Akin Bello",
  "photo": "https://cdn.soole.ng/vehicles/v1.jpg",
  "fuelLevel": 75,
  "totalKm": 45230,
  "documents": [
    {
      "type": "registration",
      "label": "Vehicle Registration",
      "status": "approved",
      "expiresAt": "2027-06-15T00:00:00Z"
    }
  ],
  "maintenanceHistory": [
    {
      "id": "maint-1",
      "date": "2026-06-20T10:00:00Z",
      "type": "oil_change",
      "cost": 15000,
      "notes": "Regular maintenance"
    }
  ],
  "fuelHistory": [
    {
      "date": "2026-06-28T08:30:00Z",
      "liters": 40,
      "cost": 28000,
      "filledBy": "d1"
    }
  ],
  "recentTrips": [
    {
      "id": "trip-042",
      "date": "2026-06-28T06:00:00Z",
      "route": "Lagos → Ibadan",
      "driver": "Akin Bello",
      "distance": 148,
      "status": "completed"
    }
  ]
}
```

#### POST /fleet/vehicles
Add a new vehicle.

**Use Case:** Add vehicle via "Add Vehicle" page

**Request:**
```json
{
  "plate": "XYZ-789",
  "model": "Toyota Sienna",
  "year": 2024,
  "capacity": 8,
  "type": "Sienna",
  "fuelType": "petrol"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "vehicleId": "v7",
  "message": "Vehicle added successfully"
}
```

#### PUT /fleet/vehicles/:vehicleId
Update vehicle information.

**Use Case:** Edit vehicle details, assign driver

**Request:**
```json
{
  "plate": "ABC-123",
  "assignedDriverId": "d1",
  "fuelLevel": 75,
  "totalKm": 45230
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "vehicle": {
    "id": "v1",
    "plate": "ABC-123",
    "assignedDriverId": "d1"
  }
}
```

#### POST /fleet/vehicles/:vehicleId/documents
Upload vehicle documents (registration, insurance, photos, etc).

**Use Case:** Upload documents for vehicle verification

**Request:** (multipart/form-data)
```
document_type: "registration"
file: <binary>
```

**Response:** `201 Created`
```json
{
  "success": true,
  "document": {
    "type": "registration",
    "status": "pending",
    "uploadedAt": "2026-06-29T10:00:00Z"
  }
}
```

#### GET /fleet/vehicles/:vehicleId/history
Get complete maintenance and fuel history.

**Use Case:** Display vehicle history modal

**Query Parameters:**
- `type` (optional): fuel, maintenance, all
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response:** `200 OK`
```json
{
  "maintenanceRecords": [
    {
      "id": "maint-1",
      "date": "2026-06-20T10:00:00Z",
      "type": "oil_change",
      "cost": 15000,
      "notes": "Regular maintenance",
      "nextDue": "2026-09-20T00:00:00Z"
    }
  ],
  "fuelRecords": [
    {
      "date": "2026-06-28T08:30:00Z",
      "liters": 40,
      "cost": 28000,
      "filledBy": "d1",
      "odometer": 45230
    }
  ]
}
```

---

## Trips

### GET /trips
Get list of all trips with filtering and pagination.

**Use Case:** Trips list page with search, filter, pagination

**Query Parameters:**
- `status` (optional): scheduled, boarding, in_progress, completed, cancelled
- `dateRange` (optional): today, this_week, all
- `search` (optional): Search by route, driver, plate, passenger name
- `page` (optional): Pagination, default 1
- `limit` (optional): Items per page, default 12

**Response:** `200 OK`
```json
{
  "trips": [
    {
      "id": "trip-001",
      "routeId": "r1",
      "routeName": "Lagos → Ibadan",
      "origin": "Lagos (Ojota)",
      "destination": "Ibadan (Challenge)",
      "vehicleId": "v1",
      "vehiclePlate": "ABC-123",
      "driverId": "d1",
      "driverName": "Akin Bello",
      "departureAt": "2026-06-29T06:00:00Z",
      "capacity": 14,
      "bookedSeats": 11,
      "status": "scheduled",
      "fare": 5000,
      "grossRevenue": 55000,
      "netRevenue": 50600,
      "passengerCount": 11
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 28,
    "pages": 3
  }
}
```

### GET /trips/:tripId
Get detailed trip information with passengers and tracking.

**Use Case:** Trip detail page

**Response:** `200 OK`
```json
{
  "id": "trip-001",
  "routeId": "r1",
  "routeName": "Lagos → Ibadan",
  "origin": "Lagos (Ojota)",
  "destination": "Ibadan (Challenge)",
  "vehicleId": "v1",
  "vehiclePlate": "ABC-123",
  "driverId": "d1",
  "driverName": "Akin Bello",
  "departureAt": "2026-06-29T06:00:00Z",
  "capacity": 14,
  "bookedSeats": 11,
  "status": "scheduled",
  "fare": 5000,
  "grossRevenue": 55000,
  "netRevenue": 50600,
  "passengers": [
    {
      "id": "p1",
      "seatNumber": 1,
      "name": "Adaeze Okonkwo",
      "phone": "+2348031112233",
      "paymentStatus": "paid",
      "boardingStatus": "waiting",
      "fare": 5000
    }
  ],
  "comments": [
    {
      "id": "c1",
      "author": "Akin Bello",
      "text": "Running on time",
      "timestamp": "2026-06-29T06:15:00Z"
    }
  ],
  "tracking": {
    "currentLocation": {
      "lat": 6.5244,
      "lng": 3.3792
    },
    "speed": 65,
    "eta": "2026-06-29T09:45:00Z"
  }
}
```

### POST /trips
Create a new trip.

**Use Case:** Trip creation form on "New Trip" page

**Request:**
```json
{
  "routeId": "r1",
  "vehicleId": "v1",
  "driverId": "d1",
  "departureAt": "2026-06-29T06:00:00Z",
  "fare": 5000
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "tripId": "trip-043",
  "status": "scheduled",
  "message": "Trip created successfully"
}
```

### PUT /trips/:tripId
Update trip details (only for scheduled trips).

**Use Case:** Edit scheduled trip

**Request:**
```json
{
  "departureAt": "2026-06-29T07:00:00Z",
  "fare": 5500
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "trip": {
    "id": "trip-001",
    "departureAt": "2026-06-29T07:00:00Z",
    "fare": 5500
  }
}
```

### PATCH /trips/:tripId/status
Update trip status (scheduled → boarding → in_progress → completed/cancelled).

**Use Case:** Change trip status via trip detail page

**Request:**
```json
{
  "status": "boarding",
  "notes": "Trip starting boarding"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "trip": {
    "id": "trip-001",
    "status": "boarding"
  }
}
```

### POST /trips/:tripId/passengers/:passengerId/board
Mark passenger as boarded.

**Use Case:** Check in passenger when boarding

**Request:**
```json
{
  "boardedAt": "2026-06-29T06:05:00Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "passenger": {
    "id": "p1",
    "boardingStatus": "boarded",
    "boardedAt": "2026-06-29T06:05:00Z"
  }
}
```

### POST /trips/:tripId/passengers/:passengerId/refund
Issue a refund for a passenger.

**Use Case:** Refund passenger via trip detail page

**Request:**
```json
{
  "passengerName": "Adaeze Okonkwo",
  "amount": 5000,
  "reason": "no_show"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "refundId": "ref-001",
  "message": "Refund processed",
  "expectedArrival": "2026-06-29T08:00:00Z"
}
```

### POST /trips/:tripId/comments
Add a comment/note to a trip.

**Use Case:** Add trip comments/updates during trip execution

**Request:**
```json
{
  "text": "Traffic near Sagamu interchange"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "comment": {
    "id": "c2",
    "author": "John Operator",
    "text": "Traffic near Sagamu interchange",
    "timestamp": "2026-06-29T07:30:00Z"
  }
}
```

### DELETE /trips/:tripId
Cancel a trip (only scheduled trips).

**Use Case:** Cancel a scheduled trip

**Request:**
```json
{
  "reason": "vehicle_breakdown"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "trip": {
    "id": "trip-001",
    "status": "cancelled",
    "reason": "vehicle_breakdown"
  }
}
```

### GET /routes
Get list of available routes.

**Use Case:** Populate route dropdown in trip creation form

**Query Parameters:**
- `search` (optional): Search by origin or destination

**Response:** `200 OK`
```json
{
  "routes": [
    {
      "id": "r1",
      "origin": "Lagos (Ojota)",
      "destination": "Ibadan (Challenge)",
      "baseFare": 5000,
      "durationMinutes": 165,
      "distanceKm": 148
    }
  ]
}
```

---

## Money & Payouts

### GET /money/balance
Get current wallet balance and instant transfer availability.

**Use Case:** Display balance on money page

**Response:** `200 OK`
```json
{
  "availableBalance": 47300,
  "pendingBalance": 12500,
  "totalEarnings": 500000,
  "currency": "NGN",
  "instantTransferAvailable": true,
  "lastUpdated": "2026-06-29T10:30:00Z"
}
```

### GET /money/transactions
Get transaction history.

**Use Case:** Display transaction list with filtering and exporting

**Query Parameters:**
- `type` (optional): booking, refund, payout
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `page` (optional): Pagination, default 1
- `limit` (optional): Items per page, default 20

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "tx-001",
      "date": "2026-06-28T14:30:00Z",
      "description": "Booking: Lagos → Ibadan (Trip #001)",
      "type": "booking",
      "gross": 55000,
      "commission": 4400,
      "net": 50600,
      "balance": 47300,
      "tripId": "trip-001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

### GET /money/payouts
Get payout history.

**Use Case:** Display payouts list

**Query Parameters:**
- `status` (optional): pending, received, failed
- `page` (optional): Pagination, default 1
- `limit` (optional): Items per page, default 20

**Response:** `200 OK`
```json
{
  "payouts": [
    {
      "id": "po-001",
      "date": "2026-06-27T00:00:00Z",
      "amount": 150000,
      "status": "received",
      "bankRef": "GTBank ****4521",
      "bookingCount": 28,
      "expectedArrival": "2026-06-27T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

### POST /money/withdraw
Request instant withdrawal to bank account.

**Use Case:** Instant payout via money page

**Request:**
```json
{
  "bankAccountId": "ba-001",
  "amount": 47300,
  "password": "secure_password",
  "securityAnswer": "answer_to_security_question"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "payoutId": "po-instant-001",
  "amount": 47300,
  "status": "received",
  "bankRef": "GTBank ****4521",
  "expectedArrival": "2026-06-29T14:00:00Z",
  "message": "Instant payout initiated successfully"
}
```

### GET /money/weekly-revenue
Get weekly revenue summary.

**Use Case:** Display revenue chart on reports page

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD

**Response:** `200 OK`
```json
{
  "weeklyRevenue": [
    {
      "day": "Mon",
      "gross": 45000,
      "net": 41400
    },
    {
      "day": "Tue",
      "gross": 62000,
      "net": 57040
    }
  ]
}
```

---

## Settings & Organization

### GET /organization
Get organization profile.

**Use Case:** Display organization info on settings page

**Response:** `200 OK`
```json
{
  "id": "org-123",
  "name": "Soole Transport Co",
  "email": "info@soole.ng",
  "phone": "+2348000000000",
  "website": "https://soole.ng",
  "logo": "https://cdn.soole.ng/org/logo.png",
  "address": "123 Ikorodu Road, Lagos",
  "bankAccounts": [
    {
      "id": "ba-001",
      "bankName": "GTBank",
      "accountNumber": "0123456789",
      "accountName": "Soole Transport Co",
      "isPrimary": true
    }
  ],
  "securityQuestions": [
    {
      "question": "What is your favourite food?",
      "answer": "Ojota"
    }
  ]
}
```

### PUT /organization
Update organization profile.

**Use Case:** Update business profile via settings page

**Request:**
```json
{
  "name": "Soole Transport Co",
  "email": "info@soole.ng",
  "phone": "+2348000000000",
  "website": "https://soole.ng",
  "logo": "https://cdn.soole.ng/org/logo.png",
  "address": "123 Ikorodu Road, Lagos"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "organization": {
    "id": "org-123",
    "name": "Soole Transport Co"
  }
}
```

### POST /organization/bank-accounts
Add a new bank account.

**Use Case:** Add bank account for payouts

**Request:**
```json
{
  "bankName": "Access Bank",
  "accountNumber": "0987654321",
  "accountName": "Soole Transport Co"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "bankAccountId": "ba-002",
  "isPrimary": false
}
```

### PUT /organization/bank-accounts/:bankAccountId/primary
Set bank account as primary payout destination.

**Use Case:** Set primary bank account

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Primary account updated"
}
```

### GET /organization/members
Get organization team members.

**Use Case:** Display team members on settings page

**Query Parameters:**
- `role` (optional): owner, admin, dispatcher, finance, viewer
- `page` (optional): Pagination, default 1

**Response:** `200 OK`
```json
{
  "members": [
    {
      "id": "user-001",
      "name": "John Owner",
      "email": "john@example.com",
      "phone": "+2348031112233",
      "role": "owner",
      "joinedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 3
  }
}
```

### POST /organization/members/invite
Invite a new team member.

**Use Case:** Invite team member via settings page

**Request:**
```json
{
  "email": "dispatcher@example.com",
  "name": "Dispatcher User",
  "role": "dispatcher"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Invite sent to dispatcher@example.com"
}
```

### DELETE /organization/members/:memberId
Remove team member.

**Use Case:** Remove team member from organization

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Member removed"
}
```

### GET /organization/alerts
Get alert settings (speed limits, custom alerts).

**Use Case:** Display alert settings

**Response:** `200 OK`
```json
{
  "speedLimit": 100,
  "alertChannels": {
    "push": true,
    "sms": true,
    "email": false
  },
  "customAlerts": [
    {
      "type": "speed_violation",
      "enabled": true,
      "threshold": 100
    }
  ]
}
```

### PUT /organization/alerts
Update alert settings.

**Use Case:** Update speed limits and alert preferences

**Request:**
```json
{
  "speedLimit": 100,
  "alertChannels": {
    "push": true,
    "sms": true,
    "email": false
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "alerts": {
    "speedLimit": 100,
    "alertChannels": {
      "push": true,
      "sms": true,
      "email": false
    }
  }
}
```

---

## Notifications & Alerts

### GET /notifications
Get list of notifications/alerts.

**Use Case:** Display notifications in notification drawer

**Query Parameters:**
- `read` (optional): true/false, filter read status
- `type` (optional): warning, danger, info
- `limit` (optional): Items to return, default 20

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "type": "warning",
      "title": "Speed limit exceeded — ABC-123",
      "message": "Driver is estimated to be travelling at ~120 km/h",
      "read": false,
      "createdAt": "2026-06-29T08:30:00Z",
      "action": {
        "label": "View on map",
        "href": "/live-map"
      }
    }
  ]
}
```

### PATCH /notifications/:notificationId/read
Mark notification as read.

**Use Case:** Mark notification as read when user opens it

**Response:** `200 OK`
```json
{
  "success": true,
  "notification": {
    "id": "notif-001",
    "read": true
  }
}
```

### POST /notifications/alerts
Create system alert.

**Use Case:** Create new alert (vehicle breakdown, driver issue, etc)

**Request:**
```json
{
  "type": "warning",
  "title": "Vehicle breakdown reported",
  "message": "Vehicle ABC-123 has reported a breakdown on route Lagos → Ibadan",
  "action": {
    "label": "View trip",
    "href": "/trips/trip-001"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "alert": {
    "id": "alert-001",
    "type": "warning"
  }
}
```

---

## Reports & Analytics

### GET /reports/trips
Get trip report with various filters.

**Use Case:** Display trip report on reports page

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `route` (optional): Filter by route ID
- `driver` (optional): Filter by driver ID
- `status` (optional): completed, cancelled

**Response:** `200 OK`
```json
{
  "trips": [
    {
      "id": "trip-001",
      "date": "2026-06-28T06:00:00Z",
      "route": "Lagos → Ibadan",
      "driver": "Akin Bello",
      "vehicle": "ABC-123",
      "status": "completed",
      "distance": 148,
      "duration": 180,
      "passengers": 11,
      "capacity": 14,
      "occupancy": 0.786,
      "revenue": 55000,
      "commission": 4400,
      "net": 50600
    }
  ],
  "summary": {
    "totalTrips": 28,
    "completedTrips": 25,
    "cancelledTrips": 3,
    "totalRevenue": 1400000,
    "totalCommission": 112000,
    "totalNet": 1288000,
    "averageOccupancy": 0.782
  }
}
```

### GET /reports/drivers
Get driver performance report.

**Use Case:** Display driver report on reports page

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response:** `200 OK`
```json
{
  "drivers": [
    {
      "id": "d1",
      "name": "Akin Bello",
      "tripsCompleted": 42,
      "totalEarnings": 156000,
      "averageRating": 4.8,
      "totalPassengers": 450,
      "totalDistance": 8500,
      "totalHours": 140,
      "speedViolations": 2,
      "safetyScore": 95
    }
  ]
}
```

### GET /reports/vehicles
Get vehicle performance report.

**Use Case:** Display vehicle report

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response:** `200 OK`
```json
{
  "vehicles": [
    {
      "id": "v1",
      "plate": "ABC-123",
      "model": "Toyota Hiace",
      "tripsCompleted": 42,
      "totalDistance": 8500,
      "totalFuelLiters": 850,
      "averageFuelConsumption": 10.0,
      "maintenanceCost": 125000,
      "downtime": 24,
      "utilization": 0.85
    }
  ]
}
```

### GET /reports/revenue
Get revenue report.

**Use Case:** Display revenue chart on reports page

**Query Parameters:**
- `range` (optional): today, this_week, this_month, custom
- `startDate` (optional): YYYY-MM-DD (if custom)
- `endDate` (optional): YYYY-MM-DD (if custom)
- `groupBy` (optional): day, week, month

**Response:** `200 OK`
```json
{
  "data": [
    {
      "date": "2026-06-22",
      "gross": 45000,
      "commission": 3600,
      "net": 41400,
      "trips": 9
    }
  ],
  "summary": {
    "totalGross": 490000,
    "totalCommission": 39200,
    "totalNet": 450800,
    "averagePerDay": 70000
  }
}
```

### GET /reports/routes
Get route performance report.

**Use Case:** Display which routes are most profitable

**Response:** `200 OK`
```json
{
  "routes": [
    {
      "id": "r1",
      "name": "Lagos → Ibadan",
      "tripsCompleted": 15,
      "totalRevenue": 412500,
      "averageOccupancy": 0.78,
      "averagePassengers": 11,
      "profitMargin": 0.92
    }
  ]
}
```

---

## Live Tracking & Maps

### GET /live-map/vehicles
Get real-time location of all active vehicles.

**Use Case:** Display live map with vehicle positions

**Query Parameters:**
- `status` (optional): on_trip, idle

**Response:** `200 OK`
```json
{
  "vehicles": [
    {
      "id": "v1",
      "plate": "ABC-123",
      "driver": "Akin Bello",
      "status": "on_trip",
      "lat": 6.5244,
      "lng": 3.3792,
      "trip": "trip-001",
      "eta": "2026-06-29T09:45:00Z",
      "speed": 65
    }
  ]
}
```

### GET /live-map/trips/:tripId/tracking
Get detailed tracking data for a specific trip.

**Use Case:** Display live tracking on trip detail page

**Response:** `200 OK`
```json
{
  "tripId": "trip-001",
  "vehicleId": "v1",
  "plate": "ABC-123",
  "driverId": "d1",
  "driverName": "Akin Bello",
  "currentLocation": {
    "lat": 6.5244,
    "lng": 3.3792,
    "timestamp": "2026-06-29T07:30:00Z"
  },
  "route": {
    "origin": "Lagos (Ojota)",
    "destination": "Ibadan (Challenge)",
    "waypoints": [
      { "lat": 6.5000, "lng": 3.3500 },
      { "lat": 6.4500, "lng": 3.3800 }
    ]
  },
  "tripStatus": "in_progress",
  "speed": 65,
  "heading": 45,
  "eta": "2026-06-29T09:45:00Z",
  "distanceRemaining": 50,
  "durationRemaining": 45,
  "speedLimit": 100,
  "speedViolationAlert": false
}
```

### WebSocket: ws://api.soole.ng/live-tracking/:tripId
Real-time tracking updates via WebSocket.

**Use Case:** Live vehicle tracking with real-time updates

**Message Format:**
```json
{
  "type": "location_update",
  "tripId": "trip-001",
  "vehicleId": "v1",
  "location": {
    "lat": 6.5244,
    "lng": 3.3792
  },
  "speed": 65,
  "timestamp": "2026-06-29T07:30:00Z"
}
```

---

## AI Assistant

### POST /ai/suggestions
Get AI suggestions for dashboard operations.

**Use Case:** AI-powered suggestions on home page

**Request:**
```json
{
  "context": "dashboard_home",
  "data": {
    "tripsToday": 3,
    "availableBalance": 47300,
    "pendingTrips": 5
  }
}
```

**Response:** `200 OK`
```json
{
  "suggestions": [
    "You have 5 pending trips scheduled for today. Consider reviewing driver assignments to ensure optimal load distribution.",
    "Your available balance has increased by 18% this week. Consider scheduling a payout to your bank account."
  ]
}
```

### POST /ai/chat
Send message to AI assistant.

**Use Case:** AI chat page for operator queries

**Request:**
```json
{
  "message": "How many trips did we complete this week?",
  "context": "general"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "response": "Based on your dashboard data, you completed 28 trips this week with an average occupancy of 78.2%.",
  "citations": [
    {
      "type": "metric",
      "label": "Trips This Week",
      "value": "28"
    }
  ]
}
```

---

## Data Models

### Status Variants
```
"verified" | "pending" | "rejected" | "suspended" | "active" | "inactive" |
"scheduled" | "boarding" | "in_progress" | "completed" | "cancelled" | "draft" |
"sent" | "received" | "failed"
```

### Driver Object
```json
{
  "id": "string",
  "name": "string",
  "phone": "string (+234...)",
  "email": "string",
  "photo": "string (url)",
  "status": "StatusVariant",
  "vehicleId": "string (optional)",
  "vehiclePlate": "string (optional)",
  "tripsCompleted": "number",
  "joinedAt": "ISO8601",
  "avgRating": "number (0-5)",
  "totalEarnings": "number",
  "reviews": ["DriverReview[]"]
}
```

### Vehicle Object
```json
{
  "id": "string",
  "plate": "string",
  "model": "string",
  "year": "number",
  "capacity": "number",
  "type": "Sienna | Hiace | Coaster | Other",
  "fuelType": "petrol | diesel",
  "status": "StatusVariant",
  "assignedDriverId": "string (optional)",
  "assignedDriverName": "string (optional)",
  "photo": "string (url)",
  "fuelLevel": "number (0-100)",
  "totalKm": "number",
  "documents": ["VehicleDocument[]"]
}
```

### Trip Object
```json
{
  "id": "string",
  "routeId": "string",
  "routeName": "string",
  "origin": "string",
  "destination": "string",
  "vehicleId": "string",
  "vehiclePlate": "string",
  "driverId": "string",
  "driverName": "string",
  "departureAt": "ISO8601",
  "capacity": "number",
  "bookedSeats": "number",
  "status": "StatusVariant",
  "fare": "number",
  "grossRevenue": "number",
  "netRevenue": "number",
  "passengers": ["Passenger[]"],
  "comments": ["TripComment[]"] (optional)
}
```

### Passenger Object
```json
{
  "id": "string",
  "seatNumber": "number",
  "name": "string",
  "phone": "string",
  "paymentStatus": "paid | pending | refunded",
  "boardingStatus": "waiting | boarded | no_show",
  "boardedAt": "ISO8601 (optional)",
  "fare": "number"
}
```

### Transaction Object
```json
{
  "id": "string",
  "date": "ISO8601",
  "description": "string",
  "type": "booking | refund | payout",
  "gross": "number",
  "commission": "number",
  "net": "number",
  "balance": "number",
  "tripId": "string (optional)"
}
```

---

## Error Handling

All endpoints should follow standard HTTP status codes:

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "email": ["Invalid format"]
    }
  }
}
```

---

## Rate Limiting

- General endpoints: 100 requests/minute
- Search/list endpoints: 60 requests/minute
- File upload endpoints: 30 requests/minute

---

## Authentication Header

All requests require:
```
Authorization: Bearer {token}
```

---

## Version

- API Version: v1
- Last Updated: 2026-06-29
- Next Review: 2026-09-29

---

## Notes for Backend Team

1. **Mock Data:** Currently using `/mock-data.json` for frontend. Replace with actual API endpoints.
2. **Real-time Features:** Live tracking and notifications should support WebSocket for real-time updates.
3. **Security:** Implement proper password hashing, JWT token expiration, and role-based access control.
4. **Database:** Design schema to support all relationships (drivers ↔ vehicles ↔ trips, etc).
5. **File Storage:** Set up CDN/file storage for photos, documents, and logos.
6. **Commission Calculation:** Implement commission logic (currently using 8% default, verify requirement).
7. **Notifications:** Set up notification system (push, SMS, email) integration.
8. **Analytics:** Ensure database supports efficient queries for reports generation.


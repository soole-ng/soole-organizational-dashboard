# API Data Models & Database Schema Reference

This document defines the data structures used throughout the Soole Operator Dashboard API.

---

## Table of Contents

1. [Core Enums & Types](#core-enums--types)
2. [User & Organization](#user--organization)
3. [Fleet Management](#fleet-management)
4. [Trips & Passengers](#trips--passengers)
5. [Financial](#financial)
6. [Notifications & Alerts](#notifications--alerts)
7. [Documents & Files](#documents--files)

---

## Core Enums & Types

### Status Variants
```typescript
type StatusVariant = 
  | 'verified'      // Driver/Vehicle passed all verifications
  | 'pending'       // Awaiting verification/approval
  | 'rejected'      // Application rejected
  | 'suspended'     // Temporarily disabled
  | 'active'        // Currently active
  | 'inactive'      // Not currently active
  | 'scheduled'     // Trip scheduled for future
  | 'boarding'      // Passengers boarding
  | 'in_progress'   // Trip in progress
  | 'completed'     // Trip completed
  | 'cancelled'     // Trip/operation cancelled
  | 'draft'         // Draft/unsaved state
  | 'sent'          // Message/notification sent
  | 'received'      // Payment received
  | 'failed'        // Operation failed
```

### Payment Status
```typescript
type PaymentStatus = 
  | 'paid'          // Payment received
  | 'pending'       // Awaiting payment
  | 'refunded'      // Payment refunded
  | 'failed'        // Payment failed
```

### Boarding Status
```typescript
type BoardingStatus = 
  | 'waiting'       // Waiting to board
  | 'boarded'       // Boarded the vehicle
  | 'no_show'       // Did not show up
```

### Transaction Type
```typescript
type TransactionType = 
  | 'booking'       // Passenger booking
  | 'refund'        // Refund issued
  | 'payout'        // Operator payout
  | 'commission'    // Commission deducted
  | 'adjustment'    // Manual adjustment
```

### User Role
```typescript
type UserRole = 
  | 'owner'         // Organization owner
  | 'admin'         // Administrator
  | 'dispatcher'    // Trip dispatcher
  | 'finance'       // Finance officer
  | 'viewer'        // Read-only access
```

### Document Type
```typescript
type DocumentType = 
  | 'registration'      // Vehicle registration
  | 'road_worthiness'   // Road worthiness certificate
  | 'insurance'         // Insurance certificate
  | 'license'           // Driver's license
  | 'nid'               // National ID
  | 'photo_front'       // Vehicle front photo
  | 'photo_back'        // Vehicle back photo
  | 'photo_interior'    // Vehicle interior photo
```

### Document Status
```typescript
type DocumentStatus = 
  | 'uploaded'      // Uploaded, awaiting review
  | 'pending'       // Under review
  | 'approved'      // Approved/verified
  | 'rejected'      // Rejected/not acceptable
  | 'missing'       // Required document missing
```

### Alert Type
```typescript
type AlertType = 
  | 'warning'       // Warning level
  | 'danger'        // Danger/critical level
  | 'info'          // Informational
  | 'success'       // Success notification
```

### Vehicle Type
```typescript
type VehicleType = 
  | 'Sienna'        // 8-seat minibus
  | 'Hiace'         // 14-seat minibus
  | 'Coaster'       // 30+ seat bus
  | 'Other'         // Custom type
```

### Fuel Type
```typescript
type FuelType = 
  | 'petrol'        // Petrol/gasoline
  | 'diesel'        // Diesel
  | 'lpg'           // Liquefied petroleum gas
  | 'hybrid'        // Hybrid
```

---

## User & Organization

### User Model
```typescript
interface User {
  id: string;                    // UUID
  organizationId: string;        // Reference to Organization
  email: string;                 // Unique email address
  phone: string;                 // Phone number (+234...)
  name: string;                  // Full name
  role: UserRole;                // User role in organization
  password_hash: string;         // Hashed password (NOT in API responses)
  status: 'active' | 'inactive'; // Account status
  lastLogin?: string;            // ISO8601 timestamp
  securityQuestions?: Array<{    // For withdrawal security
    question: string;
    answerHash: string;          // Hashed answer
  }>;
  createdAt: string;             // ISO8601
  updatedAt: string;             // ISO8601
}

// API Response (excludes sensitive fields)
interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  organizationId: string;
  lastLogin?: string;
  createdAt: string;
}
```

### Organization Model
```typescript
interface Organization {
  id: string;                    // UUID
  name: string;                  // Organization name
  email: string;                 // Contact email
  phone: string;                 // Contact phone
  website?: string;              // Organization website
  logo?: string;                 // Logo URL
  description?: string;          // Organization description
  address: string;               // Physical address
  city: string;                  // City
  state: string;                 // State/Region
  country: string;               // Country (default: NG)
  registrationNumber?: string;   // Business registration number
  taxId?: string;                // Tax ID
  bankAccounts: BankAccount[];   // Array of bank accounts
  securityQuestions: Array<{     // Security questions for withdrawals
    question: string;
    answerHash: string;
  }>;
  settings: {
    speedLimit: number;          // Fleet speed limit (km/h)
    alertChannels: {
      push: boolean;
      sms: boolean;
      email: boolean;
    };
    commissionRate: number;      // Commission percentage (0-100)
    refundPolicy: {
      allowCancellation: boolean;
      cancellationDeadlineMinutes: number;
      refundPercentage: number;  // 0-100
    };
  };
  subscription: {
    tier: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    startDate: string;
    renewalDate: string;
  };
  status: StatusVariant;         // pending_approval | approved | rejected | suspended | active
  approvalStatus: 'pending' | 'approved' | 'rejected';  // Admin approval state
  approvedBy?: string;           // Admin user ID who approved
  approvalDate?: string;         // ISO8601 when approved
  rejectionReason?: string;      // If rejected, reason why
  createdAt: string;
  updatedAt: string;
}
```

### BankAccount Model
```typescript
interface BankAccount {
  id: string;                    // UUID
  organizationId: string;        // Reference to Organization
  bankName: string;              // Bank name (e.g., "GTBank")
  bankCode: string;              // Bank code (NIBSS code)
  accountNumber: string;         // 10-digit account number
  accountName: string;           // Account holder name
  accountType: 'savings' | 'checking';
  isPrimary: boolean;            // Default payout destination
  verificationStatus: 'verified' | 'pending' | 'failed';
  verificationDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### OrganizationMember Model
```typescript
interface OrganizationMember {
  id: string;                    // UUID (same as User.id)
  organizationId: string;        // Reference to Organization
  name: string;
  email?: string;                // Optional until signup complete
  phone: string;                 // Phone number, used for OTP verification
  role: UserRole;                // owner | admin | dispatcher | finance | viewer
  status: 'active' | 'pending' | 'inactive';  // pending = invited but not yet signed up
  inviteToken?: string;          // For pending invitations
  inviteOTP?: string;            // OTP sent via SMS for verification
  inviteExpiresAt?: string;      // When invitation expires (usually 7 days)
  inviteSentAt?: string;         // When SMS invite was sent
  joinedAt?: string;             // ISO8601 (when they actually completed signup)
  lastActiveAt?: string;         // Last login timestamp
  createdAt: string;
  updatedAt: string;
}
```

---

## Fleet Management

### Driver Model
```typescript
interface Driver {
  id: string;                    // UUID
  organizationId: string;        // Reference to Organization
  name: string;
  phone: string;                 // (+234...)
  email: string;
  dateOfBirth: string;           // YYYY-MM-DD
  gender: 'M' | 'F' | 'Other';
  address: string;
  photo?: string;                // Photo URL
  idType: 'nid' | 'passport' | 'drivers_license';
  idNumber: string;
  status: StatusVariant;         // verified | pending | suspended | rejected
  vehicleId?: string;            // Currently assigned vehicle (optional)
  vehiclePlate?: string;         // Current vehicle plate
  tripsCompleted: number;        // Total trips
  totalEarnings: number;         // In kobo (divide by 100 for display)
  avgRating: number;             // 0-5, 2 decimal places
  totalPassengers: number;
  totalKm: number;
  speedViolations: number;
  safetyScore: number;           // 0-100
  documents: DriverDocument[];   // Array of documents
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  joinedAt: string;              // ISO8601
  verificationDate?: string;
  lastTripDate?: string;
  status: StatusVariant;
  createdAt: string;
  updatedAt: string;
}

interface DriverDocument {
  id: string;
  driverId: string;
  type: DocumentType;            // license | nid | photo
  status: DocumentStatus;
  expiresAt?: string;            // ISO8601 (optional)
  filePath: string;              // URL to document
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}
```

### Vehicle Model
```typescript
interface Vehicle {
  id: string;                    // UUID
  organizationId: string;        // Reference to Organization
  plate: string;                 // Unique license plate
  vin?: string;                  // Vehicle Identification Number
  model: string;                 // e.g., "Toyota Hiace"
  brand: string;                 // e.g., "Toyota"
  year: number;                  // Manufacturing year
  capacity: number;              // Number of seats
  type: VehicleType;             // Sienna | Hiace | Coaster | Other
  fuelType: FuelType;            // petrol | diesel | lpg | hybrid
  registrationNumber?: string;
  color: string;
  photo?: string;                // Vehicle photo URL
  status: StatusVariant;         // verified | pending | suspended
  assignedDriverId?: string;
  assignedDriverName?: string;
  fuelLevel: number;             // 0-100 percentage
  totalKm: number;               // Total kilometers driven
  lastServiceKm: number;
  lastServiceDate?: string;
  documents: VehicleDocument[];
  maintenanceSchedule?: {
    frequency: number;           // Days between service
    lastService: string;
    nextService: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiresAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;            // registration | insurance | road_worthiness | photo_*
  label: string;                 // Human-readable label
  status: DocumentStatus;        // uploaded | pending | approved | rejected
  expiresAt?: string;            // ISO8601 (optional)
  filePath: string;              // URL to document
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}
```

---

## Trips & Passengers

### Route Model
```typescript
interface Route {
  id: string;                    // UUID
  organizationId: string;
  name: string;                  // e.g., "Lagos → Ibadan"
  origin: string;                // Starting location
  originLat: number;
  originLng: number;
  destination: string;           // Ending location
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  durationMinutes: number;       // Estimated duration
  baseFare: number;              // Base fare in kobo
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### Trip Model
```typescript
interface Trip {
  id: string;                    // UUID
  organizationId: string;
  routeId: string;               // Reference to Route
  routeName: string;             // e.g., "Lagos → Ibadan"
  origin: string;
  destination: string;
  vehicleId: string;             // Reference to Vehicle
  vehiclePlate: string;
  driverId: string;              // Reference to Driver
  driverName: string;
  departureAt: string;           // ISO8601 (scheduled departure)
  actualDepartureAt?: string;    // ISO8601 (actual departure)
  estimatedArrivalAt: string;    // ISO8601
  actualArrivalAt?: string;      // ISO8601
  capacity: number;              // Vehicle capacity
  bookedSeats: number;           // Booked seats count
  status: StatusVariant;         // scheduled | boarding | in_progress | completed | cancelled
  fare: number;                  // Passenger fare in kobo
  grossRevenue: number;          // Total revenue (bookedSeats × fare)
  commission: number;            // Platform commission
  netRevenue: number;            // grossRevenue - commission
  passengers: Passenger[];
  tracking?: {
    currentLat?: number;
    currentLng?: number;
    speed?: number;              // km/h
    heading?: number;            // 0-360 degrees
    lastUpdate?: string;         // ISO8601
  };
  comments?: TripComment[];
  route?: Route;                 // Embedded route details
  cancellationReason?: string;
  cancellationTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TripComment {
  id: string;
  tripId: string;
  authorId: string;
  author: string;
  initials: string;
  text: string;
  timestamp: string;            // ISO8601
  createdAt: string;
}
```

### Passenger Model
```typescript
interface Passenger {
  id: string;                    // UUID (unique within trip)
  tripId: string;                // Reference to Trip
  seatNumber: number;            // Seat number
  name: string;
  phone: string;
  email?: string;
  paymentStatus: PaymentStatus;  // paid | pending | refunded
  paymentMethod?: 'card' | 'cash' | 'wallet' | 'transfer';
  paymentReference?: string;
  boardingStatus: BoardingStatus; // waiting | boarded | no_show
  fare: number;                  // In kobo
  discount?: number;             // Discount amount
  boardedAt?: string;            // ISO8601
  createdAt: string;
}

interface PassengerRefund {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName: string;
  amount: number;                // In kobo
  reason: string;                // no_show | cancellation | other
  status: 'processed' | 'pending' | 'failed';
  refundMethod: 'wallet' | 'original_payment' | 'bank_transfer';
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Financial

### Transaction Model
```typescript
interface Transaction {
  id: string;                    // UUID
  organizationId: string;
  date: string;                  // ISO8601
  description: string;           // e.g., "Booking: Lagos → Ibadan"
  type: TransactionType;         // booking | refund | payout | commission | adjustment
  referenceId?: string;          // Trip ID or Refund ID
  gross: number;                 // In kobo (before commission)
  commission: number;            // Commission amount
  net: number;                   // After commission
  balance: number;               // Running balance
  status: 'completed' | 'pending' | 'failed';
  tripId?: string;
  refundId?: string;
  createdAt: string;
}
```

### Payout Model
```typescript
interface Payout {
  id: string;                    // UUID
  organizationId: string;
  bankAccountId: string;
  date: string;                  // ISO8601 (payout date)
  amount: number;                // In kobo
  status: StatusVariant;         // pending | received | failed
  bankRef: string;               // Bank reference (e.g., "GTBank ****4521")
  bankTransactionId?: string;    // Bank's transaction ID
  bookingCount: number;          // Number of bookings included
  expectedArrival: string;       // ISO8601
  processedAt?: string;
  failureReason?: string;
  notes?: string;
  transactionIds: string[];      // Array of transaction IDs included
  createdAt: string;
  updatedAt: string;
}
```

### Wallet Model (Optional for balance tracking)
```typescript
interface Wallet {
  id: string;
  organizationId: string;
  availableBalance: number;      // In kobo
  pendingBalance: number;        // In kobo
  totalEarnings: number;         // Cumulative earnings
  totalPayouts: number;          // Cumulative payouts
  currency: string;              // "NGN"
  lastUpdated: string;           // ISO8601
}
```

---

## Notifications & Alerts

### Notification Model
```typescript
interface Notification {
  id: string;                    // UUID
  organizationId: string;
  type: AlertType;               // warning | danger | info | success
  title: string;
  message: string;
  read: boolean;
  readAt?: string;               // ISO8601
  action?: {
    label: string;               // Button text
    href: string;                // Link/action
  };
  metadata?: {
    tripId?: string;
    driverId?: string;
    vehicleId?: string;
    [key: string]: any;
  };
  createdAt: string;
  expiresAt?: string;            // ISO8601 (auto-delete after)
}
```

### Alert Model (System alerts/rules)
```typescript
interface Alert {
  id: string;
  organizationId: string;
  type: string;                  // "speed_violation" | "vehicle_maintenance" | etc
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  trigger: {
    eventType: string;
    condition?: string;
    threshold?: number;
  };
  action: {
    type: 'notify' | 'email' | 'sms' | 'webhook';
    recipient?: string;
    webhookUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## Documents & Files

### FileMetadata Model
```typescript
interface FileMetadata {
  id: string;                    // UUID
  organizationId: string;
  uploadedBy: string;            // User ID
  fileName: string;
  fileType: DocumentType;
  filePath: string;              // S3/CDN URL
  fileSize: number;              // In bytes
  mimeType: string;              // e.g., "image/jpeg"
  associatedEntity: {
    type: 'driver' | 'vehicle' | 'trip';
    entityId: string;
  };
  status: DocumentStatus;
  expiresAt?: string;            // ISO8601
  uploadedAt: string;
  createdAt: string;
}
```

---

## Relationship Diagram

```
Organization (1) ──── (many) User
     │
     ├──── (many) Driver
     │      │
     │      └──── (many) DriverDocument
     │
     ├──── (many) Vehicle
     │      │
     │      └──── (many) VehicleDocument
     │
     ├──── (many) Trip
     │      │
     │      ├──── (many) Passenger
     │      │
     │      └──── (many) TripComment
     │
     ├──── (many) Route
     │
     ├──── (many) Transaction
     │
     ├──── (many) Payout
     │
     ├──── (many) BankAccount
     │
     ├──── (many) Notification
     │
     └──── (1) Wallet

Trip ──── (1) Driver
Trip ──── (1) Vehicle
Trip ──── (1) Route
Passenger ──── (1) Trip
Payout ──── (1) BankAccount
```

---

## Database Indexes

### Recommended Indexes for Performance

```sql
-- Users
CREATE INDEX idx_user_organization ON users(organization_id);
CREATE INDEX idx_user_email ON users(email);

-- Drivers
CREATE INDEX idx_driver_organization ON drivers(organization_id);
CREATE INDEX idx_driver_status ON drivers(status);
CREATE INDEX idx_driver_vehicle ON drivers(vehicle_id);

-- Vehicles
CREATE INDEX idx_vehicle_organization ON vehicles(organization_id);
CREATE INDEX idx_vehicle_status ON vehicles(status);
CREATE INDEX idx_vehicle_plate ON vehicles(plate);

-- Trips
CREATE INDEX idx_trip_organization ON trips(organization_id);
CREATE INDEX idx_trip_status ON trips(status);
CREATE INDEX idx_trip_driver ON trips(driver_id);
CREATE INDEX idx_trip_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trip_route ON trips(route_id);
CREATE INDEX idx_trip_departure ON trips(departure_at);

-- Passengers
CREATE INDEX idx_passenger_trip ON passengers(trip_id);
CREATE INDEX idx_passenger_status ON passengers(payment_status);

-- Transactions
CREATE INDEX idx_transaction_organization ON transactions(organization_id);
CREATE INDEX idx_transaction_date ON transactions(date);
CREATE INDEX idx_transaction_type ON transactions(type);

-- Payouts
CREATE INDEX idx_payout_organization ON payouts(organization_id);
CREATE INDEX idx_payout_status ON payouts(status);
```

---

## Validation Rules

### Phone Numbers
- Format: `+234[0-9]{10}` (Nigerian format)
- Must be unique per organization

### Email
- Must be valid email format
- Must be unique globally

### Amounts (Money)
- Stored as integers (kobo)
- Display as NGN with 2 decimal places
- Example: 5000 kobo = NGN 50.00

### Dates
- All timestamps in UTC (ISO8601)
- Format: `YYYY-MM-DDTHH:mm:ssZ`

### Rating
- Scale: 0-5
- 2 decimal places
- Example: 4.87

### Status Codes
- Must be exact string matches
- Case-sensitive
- No variations allowed

---

## Notes for Implementation

1. **Soft Deletes**: Consider soft-deleting drivers and vehicles instead of hard deletes
2. **Audit Trail**: Log all mutations with user ID and timestamp
3. **Timestamps**: Use UTC timestamps, never client time
4. **Encryption**: Encrypt sensitive fields (passwords, security answers)
5. **Hashing**: Hash passwords with bcrypt (min 10 rounds)
6. **Transactions**: Use DB transactions for financial operations
7. **Indexing**: Create indexes on frequently queried columns
8. **Pagination**: Limit returned items (default 20, max 100)
9. **Relationships**: Implement foreign keys with proper constraints
10. **Archiving**: Archive old transactions/payouts (>1 year) for performance

---

## Team Member Invitation Flow

### Step 1: Admin Invites Team Member
**Endpoint:** `POST /organization/members/invite`

Admin provides: `name`, `phone`, `role`

System generates:
- 6-digit OTP (e.g., "483927")
- Join link: `/join?phone=%2B234803111223&otp=483927`
- SMS message with OTP + link
- Member added to `organization_members` table with status=`pending`

### Step 2: Team Member Receives SMS
SMS format:
```
Hi {name}, you're invited to join Speedway Transport on Soole! 
Your OTP: {otp}. 
Complete your setup: {link}
```

### Step 3: Team Member Completes Signup
**Endpoint:** `POST /auth/join`

Team member enters:
- Phone number (from URL param or manual entry)
- OTP (from SMS)
- Password (8+ chars, validation rules)
- Confirm password
- Security questions

System:
- Verifies OTP matches & hasn't expired
- Creates User record with assigned role
- Updates OrganizationMember status from `pending` → `active`
- Auto-logs them in
- Redirects to dashboard

### Step 4: Member is Now Active
- Can access dashboard with their assigned role
- Can see assigned features (Finance, Dispatcher, Driver, Manager)
- Profile considered "incomplete" until they complete profile checklist

---

## Organization Approval Flow (Django Admin)

### Step 1: Company Signs Up
Company owner creates account at frontend. Organization status = `pending_approval`

### Step 2: Django Admin Reviews
Admin reviews in Django admin dashboard:
- Company info (name, address, registration number)
- Uploaded documents (if required)
- Owner verification

### Step 3: Admin Approves or Rejects

#### Approve:
```
POST /admin/organizations/:orgId/approve
{
  "approvedBy": "admin-user-123",
  "notes": "All documents verified. Registration valid."
}
```

Result:
- `organization.approvalStatus` → `approved`
- `organization.status` → `active`
- Owner gets notification
- Can now create team members & start operations

#### Reject:
```
POST /admin/organizations/:orgId/reject
{
  "rejectionReason": "Invalid business registration number. Please resubmit with valid documentation."
}
```

Result:
- `organization.approvalStatus` → `rejected`
- `organization.status` → `suspended`
- Owner gets notification with reason
- Cannot operate until reapplied

### Step 4: Owner Can Check Status
```
GET /organization/approval-status
```

Returns current approval state for dashboard display

---

## Security Rules for Team Member Management

### Who Can Invite?
- Organization Owner (always)
- Admin users (with admin role)
- NOT Dispatcher, Finance, or Driver roles

### Who Can Remove?
- Organization Owner (always)
- Admin users (with admin role)
- NOT Dispatcher, Finance, or Driver roles

### Permission Check:
```
if (user.role === 'owner' || user.role === 'admin') {
  // Allow invite/remove
} else {
  // Reject with 403 Forbidden
}
```

### OTP Validation Rules:
- 6-digit numeric code
- Generated fresh for each invitation
- Expires in 7 days
- Can only be used once
- Verified during signup step 2


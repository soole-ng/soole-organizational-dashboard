# Frontend-Backend API Integration Guide

This guide explains how the frontend is currently structured with mock data and how to transition to real API calls.

---

## Current Architecture

### Mock Data System
The frontend currently loads all data from a single JSON file:

**File:** `public/mock-data.json`

**Usage in Frontend:**
```typescript
// Current: All pages use useMockData hook
import { useMockData } from '../lib/useMockData'

function HomePage() {
  const { data, loading, error } = useMockData()
  // Returns: { drivers, vehicles, trips, routes, transactions, payouts, alerts, ... }
}
```

### Key Files Involved

1. **`src/lib/useMockData.ts`** - Hook that fetches and caches mock data
2. **`src/lib/mockData.ts`** - Mock data arrays and utilities
3. **`src/lib/refundApi.ts`** - Example API service (already set up for real calls)
4. **`public/mock-data.json`** - Static JSON file with all mock data
5. **`vite.config.ts`** - Vite configuration
6. **`src/lib/OrgContext.tsx`** - Organization state management

---

## Integration Path

### Phase 1: Create API Service Layer

Create API service files for each feature:

```typescript
// src/lib/api/auth.ts
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  localStorage.setItem('token', data.token)
  return data
}

// src/lib/api/dashboard.ts
export async function getDashboardSummary() {
  return apiCall('/dashboard/summary')
}

export async function getUpcomingTrips(limit = 5) {
  return apiCall(`/dashboard/upcoming-trips?limit=${limit}`)
}

// src/lib/api/drivers.ts
export async function getDrivers(page = 1, limit = 20) {
  return apiCall(`/fleet/drivers?page=${page}&limit=${limit}`)
}

export async function getDriver(id: string) {
  return apiCall(`/fleet/drivers/${id}`)
}

export async function inviteDriver(data: { name, phone, email }) {
  return apiCall('/fleet/drivers/invite', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// src/lib/api/trips.ts
export async function getTrips(filters: TripsFilter) {
  const params = new URLSearchParams(filters)
  return apiCall(`/trips?${params}`)
}

export async function getTrip(id: string) {
  return apiCall(`/trips/${id}`)
}

export async function createTrip(data: CreateTripInput) {
  return apiCall('/trips', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// src/lib/api/money.ts
export async function getBalance() {
  return apiCall('/money/balance')
}

export async function getTransactions(page = 1, filters = {}) {
  return apiCall(`/money/transactions?page=${page}&...`)
}

// src/lib/api/organization.ts
export async function getOrganization() {
  return apiCall('/organization')
}

export async function inviteTeamMember(data: { name, phone, role }) {
  return apiCall('/organization/members/invite', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function removeTeamMember(memberId: string) {
  return apiCall(`/organization/members/${memberId}`, {
    method: 'DELETE'
  })
}

export async function getApprovalStatus() {
  return apiCall('/organization/approval-status')
}

// src/lib/api/auth.ts (team member signup)
export async function joinOrganization(data: { 
  phone: string, 
  otp: string, 
  password: string,
  confirmPassword: string,
  securityQuestion: { question: string, answer: string }
}) {
  return apiCall('/auth/join', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Helper function
function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }
  
  return fetch(`${process.env.VITE_API_URL || 'https://api.soole.ng/v1'}${endpoint}`, {
    ...options,
    headers
  }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  })
}
```

### Phase 2: Create Data Hooks

Replace `useMockData` with real API hooks:

```typescript
// src/lib/hooks/useDrivers.ts
export function useDrivers(page = 1, limit = 20) {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    getDrivers(page, limit)
      .then(res => {
        setDrivers(res.drivers)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [page, limit])
  
  return { drivers, loading, error }
}

// src/lib/hooks/useTrips.ts
export function useTrips(filters = {}) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)
  
  useEffect(() => {
    getTrips(filters)
      .then(res => {
        setTrips(res.trips)
        setPagination(res.pagination)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [JSON.stringify(filters)])
  
  return { trips, pagination, loading, error }
}

// src/lib/hooks/useDashboard.ts
export function useDashboard() {
  const [summary, setSummary] = useState(null)
  const [upcomingTrips, setUpcomingTrips] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getUpcomingTrips(5)
    ])
    .then(([summary, trips]) => {
      setSummary(summary)
      setUpcomingTrips(trips.trips)
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])
  
  return { summary, upcomingTrips, loading }
}
```

### Phase 3: Update Components

Replace `useMockData` with specific hooks:

```typescript
// BEFORE (using mock data)
function FleetPage() {
  const { data, loading } = useMockData()
  
  const pendingDrivers = data.drivers.filter(...)
  const verifiedVehicles = data.vehicles.filter(...)
  // ...
}

// AFTER (using real API)
function FleetPage() {
  const { drivers, loading: driversLoading } = useDrivers()
  const { vehicles, loading: vehiclesLoading } = useVehicles()
  
  const loading = driversLoading || vehiclesLoading
  const pendingDrivers = drivers.filter(...)
  const verifiedVehicles = vehicles.filter(...)
  // ...
}
```

---

## Configuration

### Environment Variables

Create `.env` and `.env.local` files:

```bash
# .env
VITE_API_URL=https://api.soole.ng/v1

# .env.local (local development)
VITE_API_URL=http://localhost:3000/v1
```

### Vite Config Update

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

---

## Current Mock Data Structure

The `public/mock-data.json` contains:

```json
{
  "drivers": [ /* 12 drivers */ ],
  "vehicles": [ /* 6 vehicles */ ],
  "trips": [ /* 28 trips */ ],
  "routes": [ /* 5 routes */ ],
  "transactions": [ /* many transactions */ ],
  "payouts": [ /* payout history */ ],
  "alerts": [ /* alerts */ ],
  "organizationMembers": [ /* team members */ ],
  "weeklyRevenue": [ /* 7 days */ ],
  "vehicleLocations": [ /* current locations */ ],
  "aiAssistantSuggestions": [ /* suggestions */ ],
  "locations": [ /* city/location list */ ]
}
```

When you have a real backend, this file can be deleted and all data will come from API endpoints.

---

## Migration Checklist

### Week 1: Authentication & Setup
- [ ] Create API service layer (`src/lib/api/`)
- [ ] Set up token storage and refreshing
- [ ] Implement login/logout flow
- [ ] Add API interceptors for auth headers
- [ ] Test with backend auth endpoints

### Week 2: Core Data
- [ ] Replace dashboard endpoints (`useData` hooks)
- [ ] Replace fleet endpoints (drivers, vehicles)
- [ ] Replace trips endpoints
- [ ] Update home page
- [ ] Update fleet page
- [ ] Update trips list page

### Week 3: Mutations & Forms
- [ ] Implement create trip
- [ ] Implement driver/vehicle CRUD
- [ ] Implement passenger boarding
- [ ] Implement refund flow
- [ ] Implement payout withdrawal

### Week 4: Advanced Features
- [ ] Real-time tracking (WebSocket)
- [ ] Live notifications
- [ ] Reports/analytics data
- [ ] AI assistant integration
- [ ] Settings/organization updates

### Week 4: Team Management & Organization
- [ ] Implement team member invitation with OTP
- [ ] Implement team member removal
- [ ] Implement organization approval status check
- [ ] Add organization approval flow to dashboard
- [ ] Display approval status on settings page
- [ ] Add admin approval endpoints (for Django admin)

### Week 5: Testing & Polish
- [ ] End-to-end testing
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Data caching strategy
- [ ] Performance optimization

---

## Error Handling Pattern

```typescript
// Standardized error handling
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error?.message || 'Request failed',
        response.status,
        error.error?.code
      )
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle specific API errors
      if (error.status === 401) {
        // Redirect to login
      } else if (error.status === 403) {
        // Show permission error
      }
    }
    throw error
  }
}

class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}
```

---

## Data Caching Strategy

```typescript
// Simple cache implementation
const cache = new Map()

export async function getCachedData(key, fetcher, ttl = 5 * 60 * 1000) {
  const cached = cache.get(key)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data
  }
  
  const data = await fetcher()
  cache.set(key, { data, timestamp: now })
  return data
}

// Usage in hooks
export function useTrips(filters) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    getCachedData(
      `trips_${JSON.stringify(filters)}`,
      () => getTrips(filters),
      1 * 60 * 1000 // 1 minute cache
    ).then(setData)
  }, [filters])
  
  return data
}
```

---

## Real-time Updates with WebSocket

```typescript
// src/lib/api/websocket.ts
let ws = null

export function connectTracking(tripId: string) {
  if (ws) return
  
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://api.soole.ng/live-tracking/${tripId}`
  
  ws = new WebSocket(url)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // Dispatch to store or callback
    window.dispatchEvent(
      new CustomEvent('tracking-update', { detail: data })
    )
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  ws.onclose = () => {
    ws = null
  }
}

export function disconnectTracking() {
  if (ws) {
    ws.close()
    ws = null
  }
}

// Usage in component
export function LiveTracker({ tripId }) {
  const [location, setLocation] = useState(null)
  
  useEffect(() => {
    connectTracking(tripId)
    
    const handler = (event) => {
      setLocation(event.detail.location)
    }
    
    window.addEventListener('tracking-update', handler)
    
    return () => {
      window.removeEventListener('tracking-update', handler)
      disconnectTracking()
    }
  }, [tripId])
  
  return <MapView location={location} />
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/api.test.ts
import { getTrips, createTrip } from '../api/trips'

describe('Trips API', () => {
  beforeEach(() => {
    fetchMock.reset()
  })
  
  test('getTrips returns trip list', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ trips: [], pagination: {} })
    )
    
    const result = await getTrips({ page: 1 })
    expect(result.trips).toEqual([])
  })
  
  test('createTrip sends POST request', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, tripId: 'trip-1' })
    )
    
    const result = await createTrip({ vehicleId: 'v1', driverId: 'd1' })
    expect(result.success).toBe(true)
  })
})
```

### Integration Tests
```typescript
// __tests__/integration.test.ts
describe('Trip Flow', () => {
  test('Create trip → View details → Update status', async () => {
    // Create
    const createRes = await createTrip(tripData)
    const tripId = createRes.tripId
    
    // Retrieve
    const trip = await getTrip(tripId)
    expect(trip.status).toBe('scheduled')
    
    // Update
    const updateRes = await updateTripStatus(tripId, 'boarding')
    expect(updateRes.trip.status).toBe('boarding')
  })
})
```

---

## Performance Optimization

### 1. Query Pagination
Always use pagination for list endpoints:
```typescript
const [page, setPage] = useState(1)
const { trips } = useTrips({ page, limit: 20 })
```

### 2. Debounce Search
```typescript
import { useDebouncedCallback } from 'use-debounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebouncedCallback((q) => {
  setSearch(q)
}, 300)

// Usage
<input onChange={(e) => debouncedSearch(e.target.value)} />
```

### 3. Lazy Load Components
```typescript
const TripDetail = lazy(() => import('./TripDetail'))

<Suspense fallback={<Loading />}>
  <TripDetail tripId={id} />
</Suspense>
```

### 4. Memoize Expensive Calculations
```typescript
const pendingTrips = useMemo(
  () => trips.filter(t => t.status === 'scheduled'),
  [trips]
)
```

---

## Transition Timeline

**Week 1:**
- Backend team implements auth endpoints
- Frontend implements login flow
- Both teams test together

**Week 2:**
- Backend implements core data endpoints (trips, drivers, vehicles)
- Frontend replaces mock data with API calls
- Daily integration tests

**Week 3:**
- Backend implements mutations (create, update, delete)
- Frontend implements forms and modal submissions
- End-to-end testing

**Week 4:**
- Backend implements advanced features (tracking, notifications)
- Frontend integrates WebSocket and real-time features
- Full system testing

**Week 5:**
- Performance testing and optimization
- Security audit
- Production readiness

---

## Rollback Plan

If issues occur:

1. Keep mock data in codebase initially
2. Add feature flag to switch between mock and real API:
```typescript
const USE_MOCK_DATA = process.env.VITE_USE_MOCK_DATA === 'true'

export async function getTrips(filters) {
  if (USE_MOCK_DATA) {
    return getMockTrips(filters)
  }
  return apiGetTrips(filters)
}
```

3. Deploy with feature flag disabled (using real API)
4. If issues detected, enable flag to revert to mock data
5. Fix issues and redeploy with flag disabled

---

## Team Member Management Integration

### 1. Invite Team Member (Frontend)

**Location:** `src/pages/Settings/components/OrganizationTeam.tsx`

```typescript
// Step 1: Admin fills form
const handleInviteSubmit = async (name: string, phone: string, role: string) => {
  const response = await inviteTeamMember({ name, phone, role })
  
  // Response includes:
  // {
  //   "otp": "483927",
  //   "joinLink": "/join?phone=...&otp=...",
  //   "smsMessage": "Hi John, you're invited..."
  // }
  
  // Step 2: Show preview with OTP and SMS message
  setGeneratedOTP(response.otp)
  setShowInvitePreview(true)
}

// Step 3: Admin confirms and sends invite
const handleConfirmInvite = async () => {
  // Actually send SMS with the OTP and link
  // This would be done by backend in a real scenario
  // For now, just show success and add to members list
  
  setMembers(prev => [...prev, {
    id: `m-${Date.now()}`,
    name,
    phone,
    role,
    status: 'pending',
    joinedAt: new Date().toISOString().split('T')[0]
  }])
}
```

### 2. Team Member Signs Up (JoinOrganizationPage)

**Location:** `src/pages/Auth/JoinOrganizationPage.tsx`

```typescript
// Step 1: User extracts phone & OTP from URL
const urlParams = new URLSearchParams(window.location.search)
const phone = urlParams.get('phone')
const otp = urlParams.get('otp')

// Step 2: User verifies OTP
const handleVerifyOTP = async () => {
  // Verify the 6-digit OTP matches the one from SMS
  if (enteredOTP !== otp) {
    toast.error('Incorrect OTP')
    return
  }
  // Move to password step
  setCurrentStep(3)
}

// Step 3: User sets password (8+ chars, validation)
const handleSetPassword = () => {
  const requirements = getPasswordRequirements(password)
  
  if (!allRequirementsMet(requirements)) {
    toast.error('Password does not meet requirements')
    return
  }
  
  if (password !== confirmPassword) {
    toast.error('Passwords do not match')
    return
  }
  
  setCurrentStep(4) // Security questions
}

// Step 4: User sets security questions
const handleSetSecurityQuestion = async () => {
  const response = await joinOrganization({
    phone,
    otp,
    password,
    confirmPassword,
    securityQuestion: { question: selectedQuestion, answer: answer }
  })
  
  // Response: { success: true, user: {...}, token: "..." }
  // Auto-login and redirect
  localStorage.setItem('token', response.token)
  navigate('/') // Dashboard
}
```

### 3. Remove Team Member (Frontend)

**Location:** `src/pages/Settings/components/OrganizationTeam.tsx`

```typescript
const handleRemoveMember = async (memberId: string) => {
  if (!confirm('Are you sure? This action cannot be undone.')) {
    return
  }
  
  try {
    await removeTeamMember(memberId)
    
    // Update local state
    setMembers(prev => prev.filter(m => m.id !== memberId))
    toast.success('Team member removed')
  } catch (error) {
    toast.error(error.message)
  }
}
```

### Backend Implementation Requirements

#### Endpoint: POST /organization/members/invite
```
Input:
{
  "name": "John Doe",
  "phone": "+234 803 111 2233",
  "role": "dispatcher"
}

Output:
{
  "success": true,
  "data": {
    "memberId": "m-123",
    "otp": "483927",
    "joinLink": "/join?phone=%2B234803111223&otp=483927",
    "smsMessage": "Hi John, you're invited...",
    "expiresAt": "2026-07-07T10:30:00Z"
  }
}
```

#### Endpoint: DELETE /organization/members/:memberId
```
Input: memberId (UUID)

Authorization: User must be owner or admin

Output:
{
  "success": true,
  "message": "Team member removed successfully"
}

Errors:
- 404: Member not found
- 403: Insufficient permissions
```

#### Endpoint: POST /auth/join
```
Input:
{
  "phone": "+234 803 111 2233",
  "otp": "483927",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "securityQuestion": {
    "question": "What is your favorite food?",
    "answer": "Jollof"
  }
}

Output:
{
  "success": true,
  "data": {
    "userId": "u-123",
    "email": "john@example.com",
    "phone": "+234 803 111 2233",
    "role": "dispatcher",
    "token": "eyJhbGc..."
  }
}

Errors:
- 400: Invalid OTP
- 400: OTP expired
- 400: Password requirements not met
```

---

## Organization Approval Integration

### 1. Check Approval Status (Frontend)

**Location:** `src/pages/Settings/SettingsPage.tsx` or dashboard header

```typescript
const handleCheckApprovalStatus = async () => {
  const response = await getApprovalStatus()
  
  // Response:
  // {
  //   "approvalStatus": "pending",  // pending | approved | rejected
  //   "appliedAt": "2026-06-25T...",
  //   "approvedAt": null,
  //   "rejectionReason": null
  // }
  
  if (response.approvalStatus === 'approved') {
    // Show success - can operate
    showBanner('Organization approved! You can now create team members.')
  } else if (response.approvalStatus === 'rejected') {
    // Show error with reason
    showError(`Organization rejected: ${response.rejectionReason}`)
  } else {
    // Pending - show waiting message
    showInfo('Your organization is pending approval. We will notify you soon.')
  }
}
```

### 2. Django Admin Approval Flow

**For Backend Team:** Admin approvals happen in Django admin dashboard

```
Path: /admin/organizations/
Actions:
1. Admin views pending organizations
2. Reviews company info, registration, documents
3. Clicks "Approve" or "Reject"
4. System calls:
   - POST /admin/organizations/:orgId/approve (with admin token)
   - POST /admin/organizations/:orgId/reject (with admin token)
```

#### Endpoint: POST /admin/organizations/:orgId/approve
```
Authorization: Admin-only token required

Input:
{
  "approvedBy": "admin-user-id",
  "notes": "All documents verified"
}

Output:
{
  "success": true,
  "data": {
    "organizationId": "org-123",
    "approvalStatus": "approved",
    "status": "active",
    "approvedAt": "2026-06-30T10:30:00Z"
  }
}
```

#### Endpoint: POST /admin/organizations/:orgId/reject
```
Authorization: Admin-only token required

Input:
{
  "rejectionReason": "Invalid business registration"
}

Output:
{
  "success": true,
  "data": {
    "organizationId": "org-123",
    "approvalStatus": "rejected",
    "status": "suspended",
    "rejectionReason": "Invalid business registration"
  }
}
```

---

## Key Contacts & Resources

- **API Documentation:** See `API_REQUIREMENTS.md`
- **Data Models:** See `API_DATA_MODELS.md`
- **Quick Reference:** See `API_ENDPOINTS_QUICK_REFERENCE.md`
- **Backend Team:** [Contact info]
- **Deployment:** [Deployment process]

---

## Notes

- Keep `.env.local` in `.gitignore` for local API URLs
- Use same error codes in frontend and backend
- Implement exponential backoff for retries
- Add request timeouts (default 30s)
- Log API errors to monitoring service
- Test with network throttling in DevTools


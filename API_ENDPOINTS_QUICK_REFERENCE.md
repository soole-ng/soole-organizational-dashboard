# API Endpoints Quick Reference

**Base URL:** `https://api.soole.ng/v1`  
**Authentication:** `Authorization: Bearer {token}`

---

## 1. AUTHENTICATION (2 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| POST | `/auth/login` | Login and get token | 🔴 CRITICAL |
| GET | `/auth/verify` | Verify session token | 🟡 HIGH |

---

## 2. DASHBOARD / HOME (3 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/dashboard/summary` | Home page metrics (trips, revenue, balance) | 🔴 CRITICAL |
| GET | `/dashboard/upcoming-trips` | Upcoming trips widget | 🟡 HIGH |
| GET | `/dashboard/quick-stats` | Fleet stats (drivers, vehicles, seats) | 🟡 HIGH |

---

## 3. FLEET - DRIVERS (5 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/fleet/drivers` | List all drivers (search, filter, paginate) | 🔴 CRITICAL |
| GET | `/fleet/drivers/:driverId` | Driver profile & details | 🔴 CRITICAL |
| POST | `/fleet/drivers/invite` | Invite new driver | 🟡 HIGH |
| PUT | `/fleet/drivers/:driverId` | Update driver info | 🟡 HIGH |
| DELETE | `/fleet/drivers/:driverId` | Remove/suspend driver | 🟡 HIGH |

---

## 4. FLEET - VEHICLES (6 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/fleet/vehicles` | List all vehicles (search, filter) | 🔴 CRITICAL |
| GET | `/fleet/vehicles/:vehicleId` | Vehicle profile & details | 🔴 CRITICAL |
| POST | `/fleet/vehicles` | Add new vehicle | 🟡 HIGH |
| PUT | `/fleet/vehicles/:vehicleId` | Update vehicle info | 🟡 HIGH |
| POST | `/fleet/vehicles/:vehicleId/documents` | Upload vehicle documents | 🟡 HIGH |
| GET | `/fleet/vehicles/:vehicleId/history` | Maintenance & fuel history | 🟡 HIGH |

---

## 5. TRIPS (8 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/trips` | List all trips (search, filter, paginate) | 🔴 CRITICAL |
| GET | `/trips/:tripId` | Trip details with passengers | 🔴 CRITICAL |
| POST | `/trips` | Create new trip | 🔴 CRITICAL |
| PUT | `/trips/:tripId` | Update trip details | 🟡 HIGH |
| PATCH | `/trips/:tripId/status` | Change trip status | 🟡 HIGH |
| POST | `/trips/:tripId/passengers/:passengerId/board` | Board passenger | 🟡 HIGH |
| POST | `/trips/:tripId/passengers/:passengerId/refund` | Refund passenger | 🔴 CRITICAL |
| POST | `/trips/:tripId/comments` | Add trip comment | 🟡 HIGH |
| DELETE | `/trips/:tripId` | Cancel trip | 🟡 HIGH |
| GET | `/routes` | Get available routes | 🟡 HIGH |

---

## 6. MONEY & PAYOUTS (5 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/money/balance` | Current wallet balance | 🔴 CRITICAL |
| GET | `/money/transactions` | Transaction history (search, filter) | 🔴 CRITICAL |
| GET | `/money/payouts` | Payout history | 🔴 CRITICAL |
| POST | `/money/withdraw` | Request instant withdrawal | 🔴 CRITICAL |
| GET | `/money/weekly-revenue` | Weekly revenue chart data | 🟡 HIGH |

---

## 7. SETTINGS & ORGANIZATION (8 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/organization` | Organization profile | 🟡 HIGH |
| PUT | `/organization` | Update org profile | 🟡 HIGH |
| POST | `/organization/bank-accounts` | Add bank account | 🟡 HIGH |
| PUT | `/organization/bank-accounts/:id/primary` | Set primary bank account | 🟡 HIGH |
| GET | `/organization/members` | Team members list | 🟡 HIGH |
| POST | `/organization/members/invite` | Invite team member | 🟡 HIGH |
| DELETE | `/organization/members/:memberId` | Remove team member | 🟡 HIGH |
| GET | `/organization/alerts` | Alert settings | 🟡 HIGH |
| PUT | `/organization/alerts` | Update alert settings | 🟡 HIGH |

---

## 8. NOTIFICATIONS & ALERTS (3 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/notifications` | List notifications | 🟡 HIGH |
| PATCH | `/notifications/:notificationId/read` | Mark as read | 🟡 HIGH |
| POST | `/notifications/alerts` | Create system alert | 🟡 HIGH |

---

## 9. REPORTS & ANALYTICS (4 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/reports/trips` | Trip report with filters | 🟡 HIGH |
| GET | `/reports/drivers` | Driver performance report | 🟡 HIGH |
| GET | `/reports/vehicles` | Vehicle performance report | 🟡 HIGH |
| GET | `/reports/revenue` | Revenue chart data | 🟡 HIGH |
| GET | `/reports/routes` | Route profitability report | 🟡 HIGH |

---

## 10. LIVE TRACKING & MAPS (3 endpoints + WebSocket)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/live-map/vehicles` | All active vehicles locations | 🟡 HIGH |
| GET | `/live-map/trips/:tripId/tracking` | Trip tracking details | 🟡 HIGH |
| WS | `ws://api.soole.ng/live-tracking/:tripId` | Real-time tracking updates | 🟡 HIGH |

---

## 11. AI ASSISTANT (2 endpoints)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| POST | `/ai/suggestions` | Get AI suggestions | 🟢 MEDIUM |
| POST | `/ai/chat` | AI chat messages | 🟢 MEDIUM |

---

## ENDPOINT PRIORITY BREAKDOWN

### 🔴 CRITICAL (13 endpoints) - Required for MVP
- Auth login
- Dashboard summary, trips, stats
- Drivers list & detail
- Vehicles list & detail
- Trips list, detail, create
- Refund passenger
- Money balance, transactions, payouts
- Instant withdrawal

### 🟡 HIGH (28 endpoints) - Core functionality
- All CRUD operations on drivers/vehicles
- Trip status & boarding management
- Settings & organization management
- Notifications system
- Reports & analytics
- Live tracking

### 🟢 MEDIUM (2 endpoints) - Nice to have
- AI suggestions
- AI chat

---

## QUICK IMPLEMENTATION GUIDE

### Phase 1 - MVP (Week 1-2)
Implement all 🔴 CRITICAL endpoints first:
1. Auth endpoints
2. Dashboard endpoints
3. Drivers/Vehicles GET endpoints
4. Trips CRUD + refund
5. Money endpoints

### Phase 2 - Core (Week 2-3)
Implement all 🟡 HIGH endpoints:
1. Driver/Vehicle POST/PUT/DELETE
2. Trip status management
3. Organization settings
4. Notifications
5. Reports

### Phase 3 - Enhancement (Week 3-4)
1. Live tracking (WebSocket)
2. AI features
3. Advanced filters & search
4. File uploads for documents
5. Data export (CSV)

---

## COMMON QUERY PATTERNS

### Pagination
```
GET /endpoint?page=1&limit=20
Response includes: pagination { page, limit, total, pages }
```

### Search & Filter
```
GET /trips?status=completed&search=Lagos&dateRange=this_week
GET /fleet/drivers?status=verified&search=Akin
GET /money/transactions?type=booking&startDate=2026-06-01&endDate=2026-06-29
```

### Date Filters
```
GET /reports/trips?startDate=2026-06-01&endDate=2026-06-29
GET /reports/revenue?range=this_week
GET /reports/revenue?range=custom&startDate=2026-06-01&endDate=2026-06-29
```

---

## RESPONSE PATTERNS

### Success Response
```json
{
  "success": true,
  "data": { /* ... */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* validation details */ }
  }
}
```

### Paginated Response
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

---

## KEY METRICS TO TRACK

### Home Dashboard
- Trips today
- Total bookings today
- Today's revenue (gross & net)
- Wallet balance
- Verified drivers / total drivers
- Active vehicles / total vehicles
- Total seats
- Average driver rating

### Money Page
- Available balance
- Transaction list (with types: booking, refund, payout)
- Payout history
- Weekly revenue chart

### Fleet Page
- Driver status strip
- Vehicle status
- Driver performance metrics
- Vehicle maintenance records

### Trips Page
- Search by route, driver, plate
- Filter by status (scheduled, active, completed, cancelled)
- Pagination (12 per page)
- Trip details including passengers and comments

---

## DATA VALIDATION RULES

### Phone Numbers
- Format: +234XXXXXXXXXX (11 digits)
- Must be valid Nigerian number

### Account Numbers
- Must be 10 digits
- Validated against bank

### Dates
- ISO8601 format: YYYY-MM-DDTHH:mm:ssZ
- All timestamps in UTC

### Money Amounts
- Stored as integers (in kobo/lowest unit)
- Display as NGN with 2 decimal places
- Commission: 8% of transaction

### Statuses
- Use exact string values (case-sensitive)
- No typos in enum values

---

## SECURITY CONSIDERATIONS

1. **Authentication:** All endpoints except `/auth/login` require Bearer token
2. **CORS:** Configure for dashboard domain only
3. **Rate Limiting:** 100 req/min for general, 60 for search, 30 for uploads
4. **Password Security:** Require verification (password + security question) for sensitive operations:
   - Instant withdrawal
   - Update organization settings
   - Change alert settings
5. **Data Privacy:** Mask sensitive data (account numbers, etc) in responses
6. **Audit Trail:** Log all mutations (POST/PUT/DELETE) for compliance

---

## TESTING PRIORITIES

### Critical to Test
1. Authentication flow (login, token verification)
2. Dashboard metrics accuracy
3. Trip creation → status progression → completion
4. Refund processing
5. Payout calculation & withdrawal
6. Real-time vehicle tracking accuracy

### Important to Test
1. Search & filter functionality
2. Pagination
3. Data validation (phone, email, amounts)
4. Role-based access control
5. Error handling & error messages

---

**Total: 50+ Endpoints**
- 13 Critical (MVP)
- 28 High (Core)
- 2 Medium (Enhancement)
- Plus WebSocket for live tracking


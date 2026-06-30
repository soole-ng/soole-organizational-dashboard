# Backend API Implementation Guide

**Purpose**: Document all APIs needed for the Soole Operator Dashboard with implementation status and details.

**Status**: Work in progress — Backend team will implement these endpoints incrementally.

---

## Table of Contents

1. [Current Backend Architecture](#current-backend-architecture)
2. [Existing APIs (Already Implemented)](#existing-apis-already-implemented)
3. [New APIs to Implement](#new-apis-to-implement)
4. [API Priority & Timeline](#api-priority--timeline)
5. [Implementation Checklist](#implementation-checklist)

---

## Current Backend Architecture

### Framework: Django + Django Ninja (API framework)
- **Location**: `c:\Users\Admin\Desktop\Soole.ng\soole-backend\`
- **Structure**:
  - `accounts/` — User authentication & profiles
  - `organization/` — Organizations, members, vehicles, trips

### Base URL
- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://api.soole.ng/v1`

### Authentication
- JWT tokens via `JWTAuth()` decorator
- Token stored in `Authorization: Bearer {token}` header
- All authenticated endpoints require valid JWT token

---

## Existing APIs (Already Implemented)

### ✅ Authentication & Accounts

#### 1. **Send OTP for Signup**
```
POST /auth/send-otp
{
  "phone": "+234 803 111 2233"
}

Response:
{
  "success": true,
  "message": "OTP sent to phone"
}
```
**Status**: ✅ IMPLEMENTED (in `accounts/api.py`)

---

#### 2. **Create Soole Account**
```
POST /auth/create-soole-account
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+234 803 111 2233"
}

Response:
{
  "success": true,
  "data": {
    "userId": "u-123",
    "phone": "+234 803 111 2233",
    "token": "eyJhbGc..."
  }
}
```
**Status**: ✅ IMPLEMENTED (in `accounts/api.py`)

---

#### 3. **Login**
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "userId": "u-123",
    "email": "user@example.com",
    "token": "eyJhbGc..."
  }
}
```
**Status**: ✅ IMPLEMENTED (in `accounts/api.py`)

---

### ✅ Organization Management

#### 4. **Create Organization**
```
POST /organizations/
Auth: Bearer {token}

{
  "name": "Speedway Transport",
  "slug": "speedway-transport",
  "org_type": "transport_co",
  "contact_email": "info@speedway.com",
  "contact_phone": "+234 803 111 2233",
  "rc_number": "RC123456"
}

Response:
{
  "id": "org-123",
  "name": "Speedway Transport",
  "status": "active"
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 5. **Get My Organizations**
```
GET /organizations/mine/
Auth: Bearer {token}

Response:
[
  {
    "id": "org-123",
    "name": "Speedway Transport",
    "status": "active"
  }
]
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 6. **Get Organization Detail**
```
GET /organizations/{org_uuid}/
Auth: Bearer {token}

Response:
{
  "id": "org-123",
  "name": "Speedway Transport",
  "status": "active",
  "members": [...]
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 7. **Update Organization**
```
PATCH /organizations/{org_uuid}/
Auth: Bearer {token}

{
  "name": "New Name",
  "contact_email": "newemail@example.com"
}

Response:
{
  "id": "org-123",
  "name": "New Name"
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

### ✅ Team Member Management

#### 8. **List Organization Members**
```
GET /organizations/{org_uuid}/members/
Auth: Bearer {token}

Response:
[
  {
    "id": "member-123",
    "user": { "id": "u-123", "email": "john@example.com" },
    "role": "dispatcher",
    "status": "active",
    "joinedAt": "2026-06-25T10:00:00Z"
  }
]
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 9. **Change Member Role**
```
PATCH /organizations/{org_uuid}/members/role/
Auth: Bearer {token}

{
  "user_uuid": "u-123",
  "new_role": "admin"
}

Response:
{
  "id": "member-123",
  "role": "admin"
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 10. **Remove Member From Organization**
```
DELETE /organizations/{org_uuid}/members/{user_uuid}/
Auth: Bearer {token}

Response:
204 No Content
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

### ✅ Team Member Invitations

#### 11. **Send Team Member Invitation**
```
POST /organizations/{org_uuid}/invitations/
Auth: Bearer {token}

{
  "email": "newmember@example.com",
  "phone": "+234 803 111 2233",
  "role": "dispatcher"
}

Response:
{
  "id": "inv-123",
  "token": "uuid-123",
  "status": "pending",
  "expiresAt": "2026-07-07T10:00:00Z"
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 12. **List Pending Invitations**
```
GET /organizations/{org_uuid}/invitations/
Auth: Bearer {token}

Response:
[
  {
    "id": "inv-123",
    "email": "user@example.com",
    "phone": "+234 803 111 2233",
    "role": "dispatcher",
    "status": "pending"
  }
]
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 13. **Revoke Pending Invitation**
```
DELETE /organizations/{org_uuid}/invitations/{invitation_uuid}/
Auth: Bearer {token}

Response:
204 No Content
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 14. **Accept Organization Invitation**
```
POST /organizations/invitations/accept/
Auth: Bearer {token}

{
  "token": "uuid-123"
}

Response:
{
  "id": "member-123",
  "org": { "id": "org-123", "name": "Speedway" },
  "role": "dispatcher",
  "status": "active"
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

#### 15. **Reject Organization Invitation**
```
POST /organizations/invitations/reject/
Auth: Bearer {token}

{
  "token": "uuid-123"
}

Response:
{
  "detail": "Invitation rejected"
}
```
**Status**: ✅ IMPLEMENTED (in `organization/api.py`)

---

## New APIs to Implement

These are APIs needed by the frontend that are **NOT yet implemented** or need **modifications**.

---

### 🟡 HIGH PRIORITY

#### 1. **Team Member Invitation with OTP (NEW)**

**Purpose**: Admin invites team member via phone OTP instead of email token

**Endpoint**: `POST /organizations/{org_uuid}/members/invite-with-otp/`

**Request**:
```json
{
  "name": "John Doe",
  "phone": "+234 803 111 2233",
  "role": "dispatcher"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "memberId": "m-123",
    "phone": "+234 803 111 2233",
    "otp": "483927",
    "joinLink": "/join?phone=%2B234803111223&otp=483927",
    "expiresAt": "2026-07-07T10:00:00Z",
    "smsMessage": "Hi John, you're invited to join Speedway Transport on Soole! Your OTP: 483927. Complete your setup: https://soole.ng/join?phone=..."
  }
}
```

**Implementation Details**:
- Generate random 6-digit OTP
- Store OTP with expiry (7 days)
- Return SMS message for display in frontend preview
- Do NOT actually send SMS (frontend shows preview, user sends manually or we add Twilio later)

**Required DB Changes**:
- Add `otp_code` field to `OrgInvitation` model
- Add `otp_expires_at` field to `OrgInvitation` model
- Add `name` field to `OrgInvitation` model (currently not stored)

---

#### 2. **Join Organization with OTP (NEW)**

**Purpose**: Team member completes signup using OTP from SMS

**Endpoint**: `POST /auth/join-organization/`

**Request**:
```json
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
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "u-123",
    "email": "john@example.com",
    "phone": "+234 803 111 2233",
    "role": "dispatcher",
    "organizationId": "org-123",
    "token": "eyJhbGc..."
  }
}
```

**Implementation Details**:
- Verify OTP against `OrgInvitation.otp_code`
- Check OTP not expired
- Check OTP hasn't been used before
- Hash password with bcrypt
- Create User + OrgMember records in transaction
- Auto-login and return JWT token
- Validate password requirements (8+ chars, uppercase, lowercase, number, special)

**Security**:
- OTP single-use (mark as used after validation)
- Rate-limit OTP attempts (max 3 attempts)
- Must verify password meets requirements before creating

---

#### 3. **Check Organization Approval Status (NEW)**

**Purpose**: User can check if their organization is pending/approved/rejected by admin

**Endpoint**: `GET /organizations/{org_uuid}/approval-status/`

**Request**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "organizationId": "org-123",
    "approvalStatus": "pending",
    "appliedAt": "2026-06-25T14:20:00Z",
    "approvedAt": null,
    "approvedBy": null,
    "rejectionReason": null
  }
}
```

**Status Options**:
- `pending` — Awaiting admin review
- `approved` — Approved by admin, can operate
- `rejected` — Rejected by admin, see reason
- `suspended` — Suspended by admin

**Implementation Details**:
- Add `approval_status` field to `Organization` model (default: `pending`)
- Add `approved_by` ForeignKey to User
- Add `approved_at` DateTimeField
- Add `rejection_reason` CharField
- Return user-friendly status for dashboard display

---

#### 4. **Admin: Approve Organization (NEW - Django Admin Only)**

**Purpose**: Admin approves organization from Django admin dashboard

**Endpoint**: `POST /admin/organizations/{org_uuid}/approve/`

**Authentication**: Admin-only (needs special admin token or permission check)

**Request**:
```json
{
  "notes": "All documents verified. Registration valid."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "organizationId": "org-123",
    "approvalStatus": "approved",
    "approvedAt": "2026-06-30T10:30:00Z"
  }
}
```

**Implementation Details**:
- Check user is admin (`request.auth.is_admin` or special role)
- Update `Organization.approval_status` → `approved`
- Set `Organization.approved_by` → admin user
- Set `Organization.approved_at` → current time
- Set `Organization.status` → `active`
- Log action in audit trail

---

#### 5. **Admin: Reject Organization (NEW - Django Admin Only)**

**Purpose**: Admin rejects organization with reason

**Endpoint**: `POST /admin/organizations/{org_uuid}/reject/`

**Authentication**: Admin-only

**Request**:
```json
{
  "rejectionReason": "Invalid business registration number. Please resubmit with valid documentation."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "organizationId": "org-123",
    "approvalStatus": "rejected",
    "rejectionReason": "Invalid business registration number. Please resubmit with valid documentation."
  }
}
```

**Implementation Details**:
- Check user is admin
- Update `Organization.approval_status` → `rejected`
- Set `Organization.rejection_reason` → reason text
- Set `Organization.status` → `suspended`
- Log action in audit trail
- Consider: Send email notification to org owner

---

#### 6. **Admin: List Pending Organizations (NEW - Django Admin)**

**Purpose**: Admin dashboard to review pending organizations

**Endpoint**: `GET /admin/organizations/pending/`

**Authentication**: Admin-only

**Query Parameters**:
```
?page=1&limit=20&search=speedway
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "organizationId": "org-123",
      "name": "Speedway Transport",
      "rcNumber": "RC123456",
      "contactEmail": "info@speedway.com",
      "contactPhone": "+234 803 111 2233",
      "status": "pending",
      "appliedAt": "2026-06-25T14:20:00Z",
      "ownerName": "John Doe",
      "ownerEmail": "john@speedway.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Implementation Details**:
- Filter by `approval_status = 'pending'`
- Order by `created_at` (oldest first)
- Include owner information
- Allow search by name, email, RC number

---

#### 7. **Admin: View Organization Details for Approval (NEW)**

**Purpose**: Admin reviews full org details before approving/rejecting

**Endpoint**: `GET /admin/organizations/{org_uuid}/review/`

**Authentication**: Admin-only

**Response**:
```json
{
  "success": true,
  "data": {
    "organizationId": "org-123",
    "name": "Speedway Transport",
    "orgType": "transport_co",
    "rcNumber": "RC123456",
    "taxId": "TIN123",
    "contactEmail": "info@speedway.com",
    "contactPhone": "+234 803 111 2233",
    "address": "123 Main St, Lagos",
    "city": "Lagos",
    "state": "Lagos State",
    "country": "Nigeria",
    "status": "pending",
    "appliedAt": "2026-06-25T14:20:00Z",
    "owner": {
      "id": "u-123",
      "name": "John Doe",
      "email": "john@speedway.com",
      "phone": "+234 803 111 2233"
    },
    "documents": [
      {
        "type": "registration",
        "url": "https://...",
        "uploadedAt": "2026-06-25T14:20:00Z"
      }
    ]
  }
}
```

---

### 🟢 MEDIUM PRIORITY (Can be done after MVP)

#### 8. **Organization Team Member Removal with Security (MODIFY)**

**Current Status**: ✅ Endpoint exists, but needs adjustment for frontend flow

**Current Endpoint**: `DELETE /organizations/{org_uuid}/members/{user_uuid}/`

**Modify To**: Require security verification (password + security question) for sensitive operations

```
DELETE /organizations/{org_uuid}/members/{user_uuid}/
Auth: Bearer {token}

{
  "password": "SecurePass123!",
  "securityAnswer": "Jollof"
}
```

**Implementation Details**:
- Verify requester is owner or admin
- Verify password matches (hash comparison)
- Verify security answer matches (case-insensitive)
- Only then remove member
- Log who removed whom and when

---

#### 9. **Get Team Member Profile (NEW)**

**Purpose**: Get detailed info about a specific team member

**Endpoint**: `GET /organizations/{org_uuid}/members/{user_uuid}/`

**Authentication**: Bearer {token}

**Response**:
```json
{
  "success": true,
  "data": {
    "memberId": "member-123",
    "userId": "u-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+234 803 111 2233",
    "role": "dispatcher",
    "status": "active",
    "joinedAt": "2026-06-25T10:00:00Z",
    "lastActiveAt": "2026-06-30T15:30:00Z"
  }
}
```

---

## API Priority & Timeline

### Phase 1: MVP (Week 1-2) — CRITICAL
**Focus**: Team member onboarding flow

Endpoints to implement:
1. ✅ POST `/auth/create-soole-account` (already exists, may need tweaks)
2. 🔴 POST `/organizations/{org_uuid}/members/invite-with-otp/` (NEW)
3. 🔴 POST `/auth/join-organization/` (NEW)
4. 🔴 GET `/organizations/{org_uuid}/approval-status/` (NEW)

**Backend Work**:
- Add OTP fields to `OrgInvitation` model
- Add approval status fields to `Organization` model
- Create join-organization endpoint with full validation
- Add migration files

---

### Phase 2: Core (Week 2-3) — HIGH
**Focus**: Admin approval workflow

Endpoints to implement:
1. 🟡 POST `/admin/organizations/{org_uuid}/approve/` (NEW)
2. 🟡 POST `/admin/organizations/{org_uuid}/reject/` (NEW)
3. 🟡 GET `/admin/organizations/pending/` (NEW)
4. 🟡 GET `/admin/organizations/{org_uuid}/review/` (NEW)

**Backend Work**:
- Create admin-only permission checks
- Implement approval workflow
- Add audit logging for approvals
- Setup Django admin actions for bulk approvals

---

### Phase 3: Polish (Week 3-4) — MEDIUM
**Focus**: Enhanced security and member management

Endpoints to implement:
1. 🟢 Modify DELETE `/organizations/{org_uuid}/members/{user_uuid}/` (security verification)
2. 🟢 GET `/organizations/{org_uuid}/members/{user_uuid}/` (NEW)

---

## Implementation Checklist

### Database Schema Changes
- [ ] Add `otp_code`, `otp_expires_at`, `name` to `OrgInvitation`
- [ ] Add `approval_status`, `approved_by`, `approved_at`, `rejection_reason` to `Organization`
- [ ] Add migration files for both

### Authentication Endpoints
- [ ] POST `/auth/join-organization/` — Full implementation with OTP + password validation
- [ ] Ensure password validation rules: 8+ chars, uppercase, lowercase, number, special

### Organization Endpoints
- [ ] POST `/organizations/{org_uuid}/members/invite-with-otp/` — OTP generation + storage
- [ ] GET `/organizations/{org_uuid}/approval-status/` — Status check endpoint

### Admin Endpoints
- [ ] POST `/admin/organizations/{org_uuid}/approve/` — Admin approval
- [ ] POST `/admin/organizations/{org_uuid}/reject/` — Admin rejection
- [ ] GET `/admin/organizations/pending/` — List for review
- [ ] GET `/admin/organizations/{org_uuid}/review/` — Detail view
- [ ] Implement admin-only permission decorator

### Security & Validation
- [ ] OTP validation (6-digit, expiry check, single-use)
- [ ] Password requirements validation
- [ ] Security answer verification
- [ ] Rate limiting on OTP attempts
- [ ] Audit trail logging

### Testing
- [ ] Unit tests for OTP generation/validation
- [ ] Integration tests for full signup flow
- [ ] Admin approval workflow tests
- [ ] Permission tests (only owner/admin can approve)

### Django Admin
- [ ] Create `OrganizationAdmin` with approval actions
- [ ] Create `OrgMemberAdmin` with bulk operations
- [ ] Add filters for approval status

---

## Notes for Backend Team

### Important Constraints
1. **OTP Single-Use**: Once used in `/auth/join-organization/`, mark OTP as expired
2. **Atomic Transactions**: Signup should create User + OrgMember in a single transaction
3. **Security First**: Hash all sensitive data (passwords, security answers)
4. **Audit Trail**: Log all admin actions (approvals, rejections, removals)
5. **Email Notifications**: Consider sending approval/rejection emails to org owner

### Contribution Flow
1. Create feature branch: `feature/org-approval-system`
2. Implement endpoints with tests
3. Create migration files
4. Open PR with full description
5. Deploy to staging for integration testing

### Example Migration
```python
# organization/migrations/0002_org_approval_status.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('organization', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='approval_status',
            field=models.CharField(
                max_length=20,
                choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                default='pending'
            ),
        ),
        migrations.AddField(
            model_name='organization',
            name='approved_by',
            field=models.ForeignKey(null=True, blank=True, to='accounts.User', on_delete=models.SET_NULL),
        ),
        migrations.AddField(
            model_name='orginvitation',
            name='otp_code',
            field=models.CharField(max_length=6, null=True, blank=True),
        ),
    ]
```

---

## Frontend Integration Points

### From `JoinOrganizationPage.tsx`:
- Calls `POST /auth/join-organization/` with phone, OTP, password, security question

### From `OrganizationTeam.tsx`:
- Calls `POST /organizations/{org_uuid}/members/invite-with-otp/` to generate OTP
- Frontend displays SMS preview before sending
- Displays team members with pending status

### From Dashboard/Settings:
- Calls `GET /organizations/{org_uuid}/approval-status/` to show approval banner
- Shows approval status: pending/approved/rejected

---

**Last Updated**: 2026-06-30  
**Contact**: Backend Team Lead  
**Status**: Ready for implementation


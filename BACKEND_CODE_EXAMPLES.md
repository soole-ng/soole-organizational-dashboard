# Backend Implementation Code Examples

**Purpose**: Provide code patterns and examples for backend developers to implement the new APIs.

---

## Table of Contents

1. [Model Changes](#model-changes)
2. [API Endpoints - Django Ninja](#api-endpoints---django-ninja)
3. [Service Layer Examples](#service-layer-examples)
4. [Validation & Security](#validation--security)

---

## Model Changes

### 1. Organization Model Enhancement

```python
# organization/models.py

from django.db import models
from django.utils import timezone
from common.models import BaseModel

class ApprovalStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    SUSPENDED = 'suspended', 'Suspended'


class Organization(BaseModel):
    """Existing model + new approval fields"""
    
    # Existing fields...
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    rc_number = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=20, choices=OrgStatus.choices, default=OrgStatus.ACTIVE)
    
    # NEW FIELDS
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
        help_text="Admin approval state: pending, approved, rejected, suspended"
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_organizations',
        help_text="Admin who approved this organization"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this organization was approved"
    )
    rejection_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Reason for rejection, if rejected"
    )

    class Meta:
        db_table = 'organizations'
        indexes = [
            models.Index(fields=['approval_status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.name} [{self.approval_status}]"
```

### 2. OrgInvitation Model Enhancement

```python
# organization/models.py

from django.utils import timezone
from datetime import timedelta

class OrgInvitation(BaseModel):
    """Existing model + OTP fields for phone-based invitations"""
    
    # Existing fields...
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(max_length=20, choices=OrgMemberRole.choices)
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=InvitationStatus.choices)
    expires_at = models.DateTimeField()
    
    # NEW FIELDS for OTP-based invitations
    name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Name of invited team member (for SMS)"
    )
    otp_code = models.CharField(
        max_length=6,
        null=True,
        blank=True,
        help_text="6-digit OTP for phone verification"
    )
    otp_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the OTP expires (usually 7 days)"
    )
    otp_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When OTP was used (prevents reuse)"
    )
    otp_attempts = models.IntegerField(
        default=0,
        help_text="Number of failed OTP attempts"
    )

    class Meta:
        db_table = 'org_invitations'
        indexes = [
            models.Index(fields=['phone', 'otp_code']),
            models.Index(fields=['status', 'otp_expires_at']),
        ]

    @property
    def is_otp_expired(self):
        """Check if OTP has expired"""
        if not self.otp_expires_at:
            return False
        return self.otp_expires_at < timezone.now()

    @property
    def is_otp_used(self):
        """Check if OTP has already been used"""
        return self.otp_used_at is not None

    def mark_otp_used(self):
        """Mark OTP as used to prevent reuse"""
        self.otp_used_at = timezone.now()
        self.save(update_fields=['otp_used_at'])

    def can_attempt_otp(self):
        """Check if user can attempt OTP (max 3 attempts)"""
        return self.otp_attempts < 3

    def increment_otp_attempts(self):
        """Increment failed attempt counter"""
        self.otp_attempts += 1
        self.save(update_fields=['otp_attempts'])
```

### 3. Migration File

```python
# organization/migrations/0002_org_approval_system.py

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_alter_user_role_driverprofile'),
        ('organization', '0001_initial'),
    ]

    operations = [
        # Organization approval fields
        migrations.AddField(
            model_name='organization',
            name='approval_status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('approved', 'Approved'), 
                         ('rejected', 'Rejected'), ('suspended', 'Suspended')],
                db_index=True,
                default='pending',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='organization',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='approved_by',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_organizations', to='accounts.user'
            ),
        ),
        migrations.AddField(
            model_name='organization',
            name='rejection_reason',
            field=models.TextField(blank=True, null=True),
        ),
        
        # OrgInvitation OTP fields
        migrations.AddField(
            model_name='orginvitation',
            name='name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='orginvitation',
            name='otp_code',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name='orginvitation',
            name='otp_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='orginvitation',
            name='otp_used_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='orginvitation',
            name='otp_attempts',
            field=models.IntegerField(default=0),
        ),
        
        # Add index for approval status lookup
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['approval_status', 'created_at'], name='org_approval_idx'),
        ),
        migrations.AddIndex(
            model_name='orginvitation',
            index=models.Index(fields=['phone', 'otp_code'], name='inv_otp_idx'),
        ),
    ]
```

---

## API Endpoints - Django Ninja

### 1. Invite Team Member with OTP

```python
# organization/api.py

import secrets
import string
from datetime import timedelta
from ninja import Router, Schema
from ninja.errors import HttpError
from django.utils import timezone
from django.http import HttpRequest

router = Router(auth=JWTAuth(), tags=["Organizations"])


# ===== SCHEMAS =====
class InviteTeamMemberSchema(Schema):
    name: str
    phone: str  # e.g., "+234 803 111 2233"
    role: str   # finance | dispatcher | driver | manager


class InviteTeamMemberResponseSchema(Schema):
    memberId: str
    phone: str
    otp: str
    joinLink: str
    expiresAt: str
    smsMessage: str

    @staticmethod
    def from_invitation(invitation):
        otp = invitation.otp_code
        phone = invitation.phone
        
        join_link = f"https://dashboard.soole.ng/join?phone={phone}&otp={otp}"
        sms_message = (
            f"Hi {invitation.name}, you're invited to join Speedway Transport on Soole! "
            f"Your OTP: {otp}. Complete your setup: {join_link}"
        )
        
        return InviteTeamMemberResponseSchema(
            memberId=str(invitation.id),
            phone=phone,
            otp=otp,
            joinLink=join_link,
            expiresAt=invitation.otp_expires_at.isoformat(),
            smsMessage=sms_message
        )


# ===== ENDPOINT =====
@router.post(
    "/{org_uuid}/members/invite-with-otp/",
    response={201: InviteTeamMemberResponseSchema},
    summary="Invite team member via OTP (SMS)"
)
def invite_team_member_with_otp(
    request: HttpRequest,
    org_uuid: str,
    payload: InviteTeamMemberSchema
):
    """
    Admin invites team member via phone OTP.
    
    1. Validates requester is owner/admin
    2. Generates 6-digit OTP
    3. Creates OrgInvitation with OTP
    4. Returns OTP + SMS preview (frontend shows to user)
    5. User manually sends SMS or we integrate Twilio
    """
    # Get organization
    org = resolve_org_or_404(org_uuid)
    
    # Check permission: only owner/admin can invite
    member = OrgMemberSelector.get_member(org.id, request.auth.id)
    if not member or member.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise HttpError(403, "Only org owner or admin can invite members")
    
    # Normalize phone
    normalized_phone = normalize_phone_number_service(payload.phone)
    
    # Generate OTP: 6 random digits
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    
    # Create OrgInvitation
    from organization.models import OrgInvitation, InvitationStatus
    
    invitation = OrgInvitation.objects.create(
        org=org,
        name=payload.name,
        phone=normalized_phone,
        role=payload.role,
        invited_by=request.auth,
        status=InvitationStatus.PENDING,
        
        # OTP fields
        otp_code=otp,
        otp_expires_at=timezone.now() + timedelta(days=7),
        
        # Standard invitation fields (keep for compatibility)
        token=uuid.uuid4(),
        expires_at=timezone.now() + timedelta(days=7),
    )
    
    # Log action
    from organization.models import AuditLog
    AuditLog.objects.create(
        organization=org,
        actor=request.auth,
        action='INVITE_TEAM_MEMBER_OTP',
        target_data={
            'invitee_name': payload.name,
            'invitee_phone': normalized_phone,
            'role': payload.role,
            'otp_expires_days': 7
        },
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
    
    return 201, InviteTeamMemberResponseSchema.from_invitation(invitation)
```

---

### 2. Join Organization with OTP

```python
# accounts/api.py

from typing import Optional
from ninja import Schema
from pydantic import field_validator, EmailStr
from django.db import transaction
from django.contrib.auth.hashers import make_password
import re

class JoinOrganizationSchema(Schema):
    phone: str
    otp: str
    password: str
    confirmPassword: str
    securityQuestion: dict  # { "question": "...", "answer": "..." }
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        # Validate phone format
        if not re.match(r'^\+234\d{10}$', v):
            raise ValueError('Invalid phone format. Must be +234XXXXXXXXXX')
        return v
    
    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('OTP must be 6 digits')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain number')
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'"|,.<>/?]', v):
            raise ValueError('Password must contain special character')
        return v
    
    @field_validator('confirmPassword')
    @classmethod
    def validate_confirm(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class JoinOrganizationResponseSchema(Schema):
    userId: str
    email: Optional[str]
    phone: str
    role: str
    organizationId: str
    token: str


@csrf_exempt
@router.post(
    "/join-organization/",
    response={200: JoinOrganizationResponseSchema, 400: dict, 404: dict}
)
def join_organization(request, payload: JoinOrganizationSchema):
    """
    Team member completes signup using OTP from invitation SMS.
    
    1. Validate OTP against OrgInvitation
    2. Validate password requirements
    3. Create User + OrgMember in transaction
    4. Auto-login and return JWT
    """
    from organization.models import OrgInvitation, OrgMember, InvitationStatus
    from organization.selectors import OrgInvitationSelector
    from accounts.models import User
    from accounts.oauth import JWTAuth
    
    normalized_phone = normalize_phone_number_service(payload.phone)
    
    # Find pending invitation matching phone + OTP
    invitation = OrgInvitation.objects.filter(
        phone=normalized_phone,
        otp_code=payload.otp,
        status=InvitationStatus.PENDING
    ).first()
    
    if not invitation:
        raise HttpError(404, "Invitation not found or invalid OTP")
    
    # Check OTP not expired
    if invitation.is_otp_expired:
        raise HttpError(400, "OTP has expired. Please request a new invitation.")
    
    # Check OTP not already used
    if invitation.is_otp_used:
        raise HttpError(400, "This OTP has already been used.")
    
    # Check attempt limit
    if not invitation.can_attempt_otp():
        raise HttpError(400, "Too many failed OTP attempts. Please request new invitation.")
    
    # Create user and member in atomic transaction
    try:
        with transaction.atomic():
            # Check if user already exists with this phone
            user = User.objects.filter(phone=normalized_phone).first()
            
            if user:
                # User exists, just add to org
                member = OrgMember.objects.filter(
                    user=user,
                    org=invitation.org
                ).first()
                if member:
                    raise HttpError(400, "User is already a member of this organization")
            else:
                # Create new user
                user = User.objects.create(
                    phone=normalized_phone,
                    email=invitation.email,  # May be null
                    first_name=invitation.name.split()[0] if invitation.name else '',
                    last_name=' '.join(invitation.name.split()[1:]) if invitation.name else '',
                    password=make_password(payload.password),
                    is_active=True
                )
            
            # Create OrgMember with invited role
            member = OrgMember.objects.create(
                org=invitation.org,
                user=user,
                role=invitation.role,
                invited_by=invitation.invited_by,
                status=OrgMemberStatus.ACTIVE
            )
            
            # Store security question
            if payload.securityQuestion:
                user.security_questions.add(
                    question=payload.securityQuestion['question'],
                    answer_hash=hash_answer(payload.securityQuestion['answer'])
                )
            
            # Mark OTP as used
            invitation.mark_otp_used()
            invitation.status = InvitationStatus.ACCEPTED
            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=['status', 'accepted_at', 'otp_used_at'])
            
            # Generate JWT
            token = JWTAuth.generate_token(user)
            
            # Log action
            AuditLog.objects.create(
                organization=invitation.org,
                actor=user,
                action='MEMBER_JOINED',
                target_data={
                    'member_name': invitation.name,
                    'member_phone': normalized_phone,
                    'role': invitation.role
                },
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            return 200, JoinOrganizationResponseSchema(
                userId=str(user.id),
                email=user.email,
                phone=user.phone,
                role=member.role,
                organizationId=str(invitation.org.id),
                token=token
            )
    
    except Exception as e:
        invitation.increment_otp_attempts()
        raise HttpError(400, f"Signup failed: {str(e)}")
```

---

### 3. Check Organization Approval Status

```python
# organization/api.py

from datetime import datetime

class ApprovalStatusResponseSchema(Schema):
    organizationId: str
    approvalStatus: str  # pending | approved | rejected | suspended
    appliedAt: str      # ISO8601
    approvedAt: Optional[str] = None
    approvedBy: Optional[str] = None
    rejectionReason: Optional[str] = None


@router.get(
    "/{org_uuid}/approval-status/",
    response=ApprovalStatusResponseSchema,
    summary="Check organization approval status"
)
def get_approval_status(request: HttpRequest, org_uuid: str):
    """
    Get organization approval status for dashboard.
    User can see if org is pending/approved/rejected.
    """
    org = resolve_org_or_404(org_uuid)
    
    # Verify requester is member
    if not OrgMemberSelector.is_member(org.id, request.auth.id):
        raise HttpError(403, "You are not a member of this organization")
    
    return ApprovalStatusResponseSchema(
        organizationId=str(org.id),
        approvalStatus=org.approval_status,
        appliedAt=org.created_at.isoformat(),
        approvedAt=org.approved_at.isoformat() if org.approved_at else None,
        approvedBy=str(org.approved_by.id) if org.approved_by else None,
        rejectionReason=org.rejection_reason
    )
```

---

### 4. Admin: Approve Organization

```python
# organization/api.py

class AdminApproveOrgSchema(Schema):
    notes: Optional[str] = None


@router.post(
    "/{org_uuid}/approve/",
    response={200: OrgResponseSchema},
    summary="[ADMIN] Approve organization"
)
def admin_approve_organization(
    request: HttpRequest,
    org_uuid: str,
    payload: AdminApproveOrgSchema
):
    """
    Admin approves organization. Only callable by superusers/staff.
    """
    # Check admin permission
    if not request.auth.is_staff:
        raise HttpError(403, "Only admins can approve organizations")
    
    org = resolve_org_or_404(org_uuid)
    
    # Update org
    org.approval_status = ApprovalStatus.APPROVED
    org.approved_by = request.auth
    org.approved_at = timezone.now()
    org.status = OrgStatus.ACTIVE
    org.save(update_fields=['approval_status', 'approved_by', 'approved_at', 'status'])
    
    # Log action
    AuditLog.objects.create(
        organization=org,
        actor=request.auth,
        action='ADMIN_APPROVE_ORG',
        target_data={'notes': payload.notes},
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
    
    # Consider: Send email to org owner
    # send_org_approved_email(org.owner, org)
    
    return 200, OrgResponseSchema.from_org(org)
```

---

## Service Layer Examples

### 1. OTP Service

```python
# organization/services/otp_service.py

import secrets
import string
from datetime import timedelta
from django.utils import timezone


class OTPService:
    """Service for OTP operations"""
    
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate random OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    @staticmethod
    def validate_otp(
        otp_code: str,
        provided_otp: str,
        otp_expires_at: timezone.datetime,
        is_otp_used: bool,
        max_attempts: int = 3,
        attempts: int = 0
    ) -> tuple[bool, str]:
        """
        Validate OTP and return (is_valid, error_message)
        """
        # Check format
        if len(provided_otp) != 6 or not provided_otp.isdigit():
            return False, "OTP must be 6 digits"
        
        # Check match
        if provided_otp != otp_code:
            return False, "Invalid OTP"
        
        # Check expiry
        if timezone.now() > otp_expires_at:
            return False, "OTP has expired"
        
        # Check if already used
        if is_otp_used:
            return False, "OTP has already been used"
        
        # Check attempts
        if attempts >= max_attempts:
            return False, "Too many failed attempts"
        
        return True, ""
```

---

## Validation & Security

### 1. Password Requirements

```python
# accounts/validators.py

import re
from django.core.exceptions import ValidationError


class PasswordRequirementsValidator:
    """Validate password meets all requirements"""
    
    MIN_LENGTH = 8
    MAX_LENGTH = 20
    
    def __call__(self, value):
        errors = []
        
        # Length checks
        if len(value) < self.MIN_LENGTH:
            errors.append(f"At least {self.MIN_LENGTH} characters required")
        if len(value) > self.MAX_LENGTH:
            errors.append(f"Maximum {self.MAX_LENGTH} characters allowed")
        
        # Complexity checks
        if not re.search(r'[A-Z]', value):
            errors.append("Must contain uppercase letter")
        if not re.search(r'[a-z]', value):
            errors.append("Must contain lowercase letter")
        if not re.search(r'\d', value):
            errors.append("Must contain number")
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'"|,.<>/?]', value):
            errors.append("Must contain special character")
        
        if errors:
            raise ValidationError(errors)
```

### 2. Phone Number Normalization

```python
# accounts/services/otp.py

import re


def normalize_phone_number_service(phone: str) -> str:
    """
    Normalize Nigerian phone numbers to +234 format.
    Handles: 08012345678, 2348012345678, +2348012345678, +234 803 111 2233
    """
    # Remove all non-digit chars except leading +
    if phone.startswith('+'):
        digits = '+' + ''.join(c for c in phone if c.isdigit())
    else:
        digits = ''.join(c for c in phone if c.isdigit())
    
    # Handle 0-prefixed (domestic format)
    if digits.startswith('0'):
        digits = '+234' + digits[1:]
    
    # Handle 234-prefixed (without +)
    elif digits.startswith('234') and not digits.startswith('+'):
        digits = '+' + digits
    
    # Validate length: +234XXXXXXXXXX (13 chars)
    if not re.match(r'^\+234\d{10}$', digits):
        raise ValueError(f"Invalid Nigerian phone number: {phone}")
    
    return digits
```

---

## Testing Examples

### 1. Test OTP Validation

```python
# organization/tests.py

from django.test import TestCase
from organization.services.otp_service import OTPService


class OTPServiceTest(TestCase):
    def test_generate_otp(self):
        otp = OTPService.generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()
    
    def test_validate_otp_success(self):
        valid, msg = OTPService.validate_otp(
            otp_code='483927',
            provided_otp='483927',
            otp_expires_at=timezone.now() + timedelta(hours=1),
            is_otp_used=False,
            attempts=0
        )
        assert valid is True
        assert msg == ""
    
    def test_validate_otp_expired(self):
        valid, msg = OTPService.validate_otp(
            otp_code='483927',
            provided_otp='483927',
            otp_expires_at=timezone.now() - timedelta(hours=1),
            is_otp_used=False,
            attempts=0
        )
        assert valid is False
        assert "expired" in msg.lower()
```

### 2. Test Join Organization Endpoint

```python
# accounts/tests.py

from django.test import TestCase, Client
from organization.models import Organization, OrgInvitation, InvitationStatus


class JoinOrganizationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.org = Organization.objects.create(
            name="Test Org",
            slug="test-org"
        )
        self.invitation = OrgInvitation.objects.create(
            org=self.org,
            name="John Doe",
            phone="+234 803 111 2233",
            role='dispatcher',
            status=InvitationStatus.PENDING,
            otp_code='483927',
            otp_expires_at=timezone.now() + timedelta(days=7)
        )
    
    def test_join_with_valid_otp(self):
        response = self.client.post('/api/v1/auth/join-organization/', {
            'phone': '+234 803 111 2233',
            'otp': '483927',
            'password': 'SecurePass123!',
            'confirmPassword': 'SecurePass123!',
            'securityQuestion': {
                'question': 'Favorite food?',
                'answer': 'Jollof'
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data['data']['phone'] == '+234 803 111 2233'
        assert data['data']['role'] == 'dispatcher'
        assert 'token' in data['data']
    
    def test_join_with_invalid_otp(self):
        response = self.client.post('/api/v1/auth/join-organization/', {
            'phone': '+234 803 111 2233',
            'otp': '000000',  # Wrong
            'password': 'SecurePass123!',
            'confirmPassword': 'SecurePass123!',
            'securityQuestion': {'question': 'Q', 'answer': 'A'}
        })
        
        assert response.status_code == 404
```

---

**Last Updated**: 2026-06-30  
**For**: Backend Development Team


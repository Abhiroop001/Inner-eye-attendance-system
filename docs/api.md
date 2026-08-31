# REST API Specification & Envelopes

All API endpoints produce standardized JSON responses:

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "requestId": "req_1725102839123_abc"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid username or password"
  },
  "requestId": "req_1725102839123_abc"
}
```

---

## Endpoint Directory

### Authentication & Registration
- `POST /api/auth/login` - Authenticate with username/password.
- `POST /api/auth/mfa/verify` - Complete TOTP MFA challenge.
- `POST /api/auth/refresh` - Rotate refresh token family.
- `POST /api/auth/logout` - Invalidate refresh token session.
- `GET /api/auth/me` - Get current authenticated user profile.
- `POST /api/auth/change-password` - Rotate permanent password.
- `POST /api/registration/request` - Submit neutral activation request.
- `POST /api/registration/verify` - Validate 15-minute challenge token.
- `POST /api/registration/activate` - Set permanent username and password.

### Employee Self-Service (`/api/me/*`)
- `GET /api/me/dashboard` - Real-time daily punch, KPIs, and recent 14-day history.
- `GET /api/me/attendance` - Filterable attendance ledger.
- `POST /api/me/attendance/check-in` - Record check-in punch.
- `POST /api/me/attendance/check-out` - Record check-out punch.
- `GET /api/me/leave` - Get leave balances and historical requests.
- `POST /api/me/leave` - Submit new leave application.
- `GET /api/me/exceptions` - View late arrival exceptions.
- `POST /api/me/exceptions/:id/reason` - Submit explanation and attach documents.
- `POST /api/me/exceptions/:id/documents` - Upload supporting document (multipart).

### HR Operations Console (`/api/hr/*`)
- `GET /api/hr/dashboard` - Organization-wide headcount, attendance stats, and 7-day trend.
- `GET /api/hr/employees` - Search and filter employee master records.
- `POST /api/hr/employees` - Provision new employee master record.
- `GET /api/hr/employees/:id` - Drilldown employee profile and 90-day activity.
- `PATCH /api/hr/employees/:id` - Update status (ACTIVE / SUSPENDED).
- `GET /api/hr/attendance` - Organization daily attendance records.
- `GET /api/hr/leave` - Filterable leave requests queue.
- `POST /api/hr/leave/:id/approve` - Approve leave and deduct deterministic quota.
- `POST /api/hr/leave/:id/reject` - Reject leave request with justification.
- `GET /api/hr/exceptions` - Late exceptions adjudication queue.
- `POST /api/hr/exceptions/:id/adjudicate` - Adjudicate late exception.
- `GET /api/hr/documents/:id/download` - Secure stream of supporting certificate.
- `GET /api/hr/audit` - Immutable compliance audit stream.

### AI Intelligence (`/api/ai/*`)
- `POST /api/ai/employee-assistant` - Grounded policy Q&A assistant.
- `POST /api/ai/hr-insights` - Workforce attendance trends and risk insights.

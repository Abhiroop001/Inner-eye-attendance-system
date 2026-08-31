---
document_id: security-and-access-policy-v1
version: "1.0"
document_type: policy
title: Enterprise Identity, Access Control, and Information Security Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Enterprise Identity, Access Control, and Information Security Policy

## 1. Role-Based Access Control (RBAC) Architecture
The system enforces strict server-side authorization partitioned into two explicit roles:
1. **EMPLOYEE**:
   - Scope: Strictly confined to own employee profile (`employeeId === req.user.employeeId`).
   - Allowed Actions: View own dashboard, check-in, check-out, view own history, submit late reasons, upload own supporting documents, submit leave requests, use authorized policy AI assistant.
   - Forbidden Actions: Accessing records of other employees, modifying master records, adjudicating exceptions, reviewing HR audit logs.
2. **HR (Administrator)**:
   - Scope: Authorized to manage organization-wide employee masters, adjust attendance, adjudicate exceptions, approve leaves, review system audit logs, and configure work schedules.

## 2. Authentication & Credential Standards
- **Password Hashing**: Argon2id with recommended OWASP memory cost ($65536\text{ KiB}$), iterations ($3$), parallelism ($4$). Raw passwords are never persisted.
- **Session Tokens**: Short-lived JSON Web Tokens (15-minute access token) coupled with HTTP-Only, SameSite=Strict, Secure refresh cookies rotated on each refresh.
- **Multi-Factor Authentication (MFA)**:
  - Mandatory for all HR Administrator accounts using standard TOTP (RFC 6238).
  - One-time backup recovery codes issued during initial MFA enrollment.

## 3. Threat Mitigation & Rate Limiting
- **Brute Force Defense**: Maximum 5 failed consecutive login attempts per account or IP before a temporary 15-minute lockout is applied.
- **Enumeration Protection**: Public registration requests return identical responses irrespective of identifier presence.
- **Injection Defenses**: NoSQL parameter sanitization, strict Zod schema validation on all inputs, XSS output encoding, Content Security Policy headers, and CORS restrictions.

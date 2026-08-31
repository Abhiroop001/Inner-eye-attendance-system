---
document_id: hr-approval-policy-v1
version: "1.0"
document_type: policy
title: Human Resources Delegated Authority and Exception Approval Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - HR
---

# Human Resources Delegated Authority and Exception Approval Policy

## 1. Scope of HR Authority
HR Administrators and delegated People Ops managers hold exclusive authority over employee master management, exception adjudication, and regulatory compliance.

## 2. Controlled Decision Points
The following operational actions require explicit, authenticated HR review with mandatory audit trails:

1. **Late Arrival Reason Adjudication**:
   - HR reviews employee explanation narrative and verified supporting documents.
   - Outcomes: `ACCEPTED` (waives penalty), `REJECTED` (penalty stands), or `NEEDS_MORE_INFO` (requests clarification).
2. **Attendance Time Correction**:
   - When an employee submits a correction for missed biometric checkouts, HR validates physical badge logs or supervisor attestations before adjusting `checkOutAt`.
3. **Leave Applications**:
   - Review of multi-day privilege or sick leave requests against departmental coverage minimums (minimum 60% staff on duty).
4. **Security & Account Actions**:
   - Suspending compromised accounts (`accountStatus = SUSPENDED`).
   - Triggering administrative credential reset or MFA reset.
   - Reviewing immutable security event streams and anomaly alerts.

## 3. Four-Eyes Principle & Auditability
- Any manual modification to an attendance timestamp or leave balance generates an immutable `AuditLog` entry specifying `actorId`, `action`, `previousState`, `newState`, and `justificationReason`.
- Employees are strictly barred from approving their own exceptions or modifying their own attendance records.

---
document_id: attendance-policy-v1
version: "1.0"
document_type: policy
title: Corporate Attendance and Working Session Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Corporate Attendance and Working Session Policy

## 1. Purpose & Scope
This policy governs daily attendance recording, shift sessions, biometric/web check-in procedures, and working hour calculations for all full-time and contractual employees across all business entities.

## 2. Attendance Recording Rules
1. **Single Session Rule**: An employee may possess only one active attendance session per calendar business day. Duplicate check-in attempts on the same calendar date without prior checkout are prohibited and rejected by the system with a conflict error.
2. **Authorized Methods**: Attendance must be recorded via the official enterprise employee portal or authenticated hardware terminal.
3. **Session Lifecycle**:
   - **Check-In**: Marks the beginning of the working day. Recorded in UTC and displayed in the employee's assigned local timezone.
   - **Check-Out**: Marks the conclusion of the working session.
   - **Missed Check-Out**: Sessions left open after 23:59:59 local time are automatically flagged as `INCOMPLETE_SESSION` requiring HR adjustment.

## 3. Working Hours & Classifications
1. **Standard Daily Schedule**: 9:00 AM to 5:00 PM (480 minutes scheduled, 420 minutes minimum working time excluding 60 minutes lunch/unpaid break).
2. **Attendance Statuses**:
   - `PRESENT`: On-time arrival and completed shift (> minimum scheduled hours).
   - `LATE`: Arrival after scheduled start plus the designated grace period (15 minutes).
   - `HALF_DAY`: Total working duration between 210 and 359 minutes.
   - `ABSENT`: No attendance recorded by end of day without approved leave.
   - `ON_LEAVE`: Pre-approved leave for the business day.
   - `PENDING_EXCEPTION`: Late arrival or early departure awaiting HR reason review.
   - `HOLIDAY` / `WEEK_OFF`: Official public holiday or assigned rest day.

## 4. Timezone & Business Day Boundary
- All attendance records evaluate timestamps against the employee's assigned schedule timezone (default: `Asia/Kolkata` or `America/New_York` as defined in employee profile).
- Day boundary rolls over at 00:00:00 local time.

---
document_id: late-arrival-policy-v1
version: "1.0"
document_type: policy
title: Late Arrival and Punctuality Exception Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Late Arrival and Punctuality Exception Policy

## 1. Grace Period Definition
- The organization provides a standard **15-minute grace period** from the official shift start time.
- For a standard 09:00 AM shift, arrivals up to 09:15:00 AM are classified as `PRESENT` with zero penalty minutes.
- Check-ins recorded at 09:15:01 AM or later are automatically flagged as `LATE`.

## 2. Calculation Formula
$$\text{Late Minutes} = \max(0, \text{Actual Check-In Time} - \text{Scheduled Start Time} - \text{Grace Minutes})$$
*Example: An employee checking in at 09:35 AM on a 09:00 AM schedule incurs $\max(0, 35 - 0 - 15) = 20\text{ late minutes}$.*

## 3. Explanation & Exception Workflow
1. When an employee is flagged as `LATE`, a `LateReason` task is automatically generated in their portal.
2. The employee must submit:
   - **Reason Category**: `MEDICAL`, `TRAFFIC_TRANSIT`, `FAMILY_EMERGENCY`, `CLIENT_MEETING`, `TECHNICAL_GLITCH`, `OTHER`.
   - **Detailed Explanation**: Narrative explaining the operational or personal cause.
   - **Supporting Document**: Mandatory for medical reasons or lateness exceeding 60 minutes (medical certificate, transit delay slip, toll receipt).
3. The submission enters `UNDER_REVIEW` status for HR decision.
4. HR Review outcomes:
   - `ACCEPTED`: Status adjusted to `PRESENT` with reason waiver.
   - `REJECTED`: `LATE` status stands, late minutes deducted from monthly punctuality score.
   - `NEEDS_MORE_INFO`: Returned to employee with reviewer comments requesting supplementary proof.

## 4. Escalation & Repeat Lateness
- Accumulation of 3 unexcused late arrivals in a calendar month triggers an automated supervisory notification.
- 5 or more unexcused late arrivals within a rolling 30-day window results in HR disciplinary review and potential half-day leave deduction.

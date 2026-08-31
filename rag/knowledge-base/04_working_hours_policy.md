---
document_id: working-hours-policy-v1
version: "1.0"
document_type: policy
title: Working Hours, Breaks, and Overtime Computation Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Working Hours, Breaks, and Overtime Computation Policy

## 1. Schedule Parameters
- **Standard Day**: 09:00:00 to 17:00:00 (8 hours / 480 minutes elapsed).
- **Mandatory Unpaid Break**: 60 minutes (Lunch & Personal break).
- **Net Minimum Required Working Time**: 420 minutes (7 net hours) for full-day credit.
- **Half-Day Threshold**: 210 to 419 net working minutes.

## 2. Core Mathematical Formulations
All time computations are evaluated deterministically in integer minutes:

1. **Net Working Duration**:
   $$\text{workingMinutes} = \max\left(0, (\text{CheckOut} - \text{CheckIn}) - \text{unpaidBreakMinutes}\right)$$
2. **Late Arrival**:
   $$\text{lateMinutes} = \max\left(0, \text{CheckIn} - \text{ScheduledStart} - \text{graceMinutes}\right)$$
3. **Early Departure**:
   $$\text{earlyDepartureMinutes} = \max\left(0, \text{ScheduledEnd} - \text{CheckOut}\right)$$
4. **Overtime Duration**:
   $$\text{overtimeMinutes} = \max\left(0, \text{workingMinutes} - \text{scheduledWorkingMinutes}\right)$$
   *Overtime is accrued only if $\text{overtimeMinutes} \ge 30$ minutes and approved by HR.*

## 3. Shift Variations
- **General Day Shift**: 09:00 to 17:00
- **Morning Shift**: 06:00 to 14:00
- **Flexible Core Shift**: 10:00 to 18:00 (with mandatory core presence from 11:00 to 16:00)

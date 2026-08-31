---
document_id: leave-policy-v1
version: "1.0"
document_type: policy
title: Corporate Leave Entitlement and Deduction Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Corporate Leave Entitlement and Deduction Policy

## 1. Leave Categories
1. **Casual / Privilege Leave (CL/PL)**: 18 days per annum, credited quarterly (4.5 days/quarter). For personal recreation and urgent chores. Max consecutive: 4 days.
2. **Sick / Medical Leave (SL)**: 12 days per annum, credited on Jan 1st. Mandatory doctor certificate required for $\ge 2$ consecutive days.
3. **Emergency Leave (EL)**: 5 days per annum for unforeseen crises.
4. **Maternity / Paternity Leave**: Statutory compliance per jurisdiction (26 weeks / 2 weeks).
5. **Loss of Pay (LOP)**: Applied when approved leave balance is exhausted.

## 2. Balance & Deduction Mechanics
- **Available Balance Formula**:
  $$\text{Available} = \text{Opening Balance} + \text{Credited} + \text{Adjusted} - \text{Consumed} - \text{Pending Approval}$$
- **Working Day Computation**:
  - Leave calculations strictly exclude official public holidays and weekly rest days (Saturdays/Sundays for 5-day work schedules).
  - A leave request spanning Friday to Monday on a 5-day week counts as 2 days, not 4.
- **Half-Day Deductions**:
  - `FIRST_HALF`: Absence during morning hours (0.5 day deducted).
  - `SECOND_HALF`: Absence during afternoon hours (0.5 day deducted).

## 3. Request & Approval Lifecycle
1. Employee submits leave request with date range, leave type, and justification.
2. The engine performs deterministic validation:
   - Sufficient available balance $\ge$ requested working days.
   - No date collisions with existing approved leaves.
3. HR / Reporting Manager reviews request $\rightarrow$ `APPROVED` or `REJECTED`.
4. Upon approval, the balance is deducted deterministically and attendance dates are automatically populated with `ON_LEAVE`.

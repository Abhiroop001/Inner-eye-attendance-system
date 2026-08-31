---
document_id: employee-registration-policy-v1
version: "1.0"
document_type: policy
title: Authoritative Employee Provisioning and One-Time Activation Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Authoritative Employee Provisioning and One-Time Activation Policy

## 1. Fundamental Principle: HR-First Authoritative Record
Direct public employee registration is **strictly prohibited**. The organization operates on an authoritative pre-provisioning model:
1. HR Administrator creates the authoritative `Employee` master profile in the system.
2. The employee profile is initialized with status `NOT_REGISTERED`.
3. An onboarding employee submits a **Registration Request** via the portal.

## 2. Validation & Security Pipeline
When an employee requests registration:
1. **Schema & Rate-Limit Check**: Protects against automated probing and brute force attacks.
2. **Deterministic Lookup**:
   - Matches official corporate email (`workEmail`) and official employee identifier (`employeeId`).
   - Ensures `employmentStatus` is `ACTIVE` (not `SUSPENDED` or `TERMINATED`).
3. **State Validation**:
   - If `accountStatus == ACTIVE`, request is safely rejected with neutral messaging.
   - If `accountStatus == NOT_REGISTERED`, an `ActivationChallenge` is created.
4. **LangGraph Agent Analysis**: Analyzes anomalous request signatures and cross-validates semantic profile metadata if needed.

## 3. One-Time Activation Token Mechanics
- A cryptographically random high-entropy token (32 bytes / 64 hex characters) is generated.
- Only the Argon2id / SHA-256 hash of the token is persisted in the database.
- The challenge expires strictly after **15 minutes**.
- Single-Use Enforcement: Once consumed to establish the permanent password, the challenge is marked `CONSUMED` and cannot be replayed.
- Successful activation transitions `accountStatus` to `ACTIVE` and registers `registrationCompletedAt`.

## 4. Account Enumeration Defense
All public registration endpoints MUST return an identical, neutral response regardless of whether the identifiers match an existing record:
> *"Your request has been received and is being processed. If the information matches an eligible employee record, further instructions will be provided."*
Detailed success/rejection outcomes are logged exclusively to internal append-only audit streams.

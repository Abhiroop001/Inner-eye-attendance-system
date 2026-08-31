# Comprehensive Automated Testing & Verification Guide

## 1. Test Suite Architecture

The system includes automated tests covering deterministic calculations, security controls, and RBAC:

- **Unit Tests**:
  - `backend/tests/unit/attendanceCalculations.test.ts`:
    - Grace period check-in calculations (09:12 AM = 0 late mins).
    - Late penalty calculations (09:42 AM = 42 late mins).
    - Half-day session determination (< 4.0 hrs).
    - Overtime working minutes calculation.
  - `backend/tests/unit/leaveDeductions.test.ts`:
    - Working days calculation excluding Saturdays and Sundays.
    - Public holiday exclusion from leave deductions.
    - Half-day leave deduction (0.5 days).
    - Leave balance deduction and available quota updates.
- **Security Tests**:
  - `backend/tests/security/securityControls.test.ts`:
    - Argon2id password hashing and constant-time verification.
    - Cryptographic TOTP MFA token generation and verification.
    - JOSE JWT sign, verify, and expiration behavior.
    - Binary magic byte validation for PDF, PNG, and JPEG.
    - Anti-enumeration registration response equivalence.

---

## 2. Running Automated Tests

```bash
# Run unit and security tests in backend
cd backend
npm test

# Run tests across workspaces from root
npm test
```

---

## 3. RAG Policy Ingestion & Benchmarking

```bash
# Ingest and vector-embed all 11 Markdown policy documents into MongoDB
npm run rag:ingest

# Execute 30 synthetic policy evaluation queries with precision/recall scoring
npm run rag:evaluate
```

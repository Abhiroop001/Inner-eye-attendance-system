# Security Engineering & OWASP ASVS Architecture

## 1. Threat Modeling & Countermeasures

### 1.1 Account Takeover & Enumeration Defense
- **Threat**: Attackers query `/api/registration/request` to identify valid employee names and emails.
- **Countermeasure**: The endpoint returns an identical neutral response `Your request has been received and is being processed...` in constant time, regardless of whether the record exists, is unregistered, or already active.

### 1.2 Brute Force & Credential Stuffing
- **Threat**: Automated password guessing attacks.
- **Countermeasure**: Redis distributed token bucket rate limiter (`5 attempts / 15 minutes`). Exponential backoff and security audit telemetry logging upon violation.

### 1.3 Insecure Direct Object Reference (IDOR)
- **Threat**: Employee accesses or mutates another employee's attendance, leave balance, or medical certificates.
- **Countermeasure**: Mandatory `verifyOwnership` middleware verifies `req.user.employeeId === req.params.employeeId`. Role `HR` can bypass with mandatory audit record creation.

### 1.4 Cryptographic Hashing Standards
- **Passwords**: Argon2id ($m=65536\text{ KiB}, t=3, p=4$).
- **Tokens**: SHA-256 one-way hashing for activation challenges and refresh tokens.
- **MFA Secrets**: AES-256-GCM authenticated encryption at rest using `MFA_ENCRYPTION_KEY`.
- **Integrity**: SHA-256 checksum recorded for every uploaded supporting document.

### 1.5 Malicious File Upload Defense
- Verification of declared MIME against whitelist (`application/pdf`, `image/jpeg`, `image/png`).
- Verification of binary magic byte signatures (`%PDF-`, `PNG`, `JPEG`).
- Stripping original filename and replacing with UUID safe names.
- Private GridFS storage (not publicly exposed via static HTTP paths).

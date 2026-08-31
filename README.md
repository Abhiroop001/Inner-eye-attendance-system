# Enterprise Attendance Management System
## Security-First Architecture with MERN, LangGraph Agentic RAG, MongoDB Vector Search, Groq, and Redis

---

## Executive Summary

The Enterprise Attendance Management System is a production-grade workforce attendance, policy governance, and exception adjudication platform. Designed following ISO/IEC 27001 and OWASP ASVS (Application Security Verification Standard) guidelines, the system pairs deterministic time-accounting rules with an autonomous LangGraph agentic validation graph for automated policy interpretation and attendance exception review.

The platform is structured into two independent frontend applications:
1. **Employee Self-Service Portal** (`Frontend/` running on Port 5173): Provides biometric-style daily check-in/out terminals, real-time working hour calculations, leave balance tracking, document uploads, and self-service late explanation workflows.
2. **HR Operations and Security Console** (`Hr_dashboard/` running on Port 5174): Provides executive workforce intelligence, real-time presence telemetry, employee directory lifecycle management, leave approvals, exception adjudications with LangGraph AI advisory scores, cryptographic audit log inspection, and Redis cache controls.

---

## Technology Stack

### Backend Core
- **Runtime & Language**: Node.js (v20+), TypeScript 5.7 (ESM / NodeNext)
- **HTTP Engine**: Express.js with async exception wrapping
- **Database**: MongoDB Atlas with native Vector Search index integration and GridFS chunked document storage
- **Session & Caching**: Upstash Redis with TLS (`rediss://`) and in-memory fallback
- **Agentic AI & RAG**: LangGraph state machine, Groq API (`openai/gpt-oss-120b`), Hugging Face embeddings
- **Security & Cryptography**: `@node-rs/argon2` (m=65536, t=3, p=4), `otplib` (RFC 6238 TOTP), `jose` (JWT), `helmet`, `express-rate-limit`

### Frontend Applications
- **UI Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with enterprise color palettes and responsive layouts
- **State & Data Fetching**: TanStack Query (v5) with optimistic updates and window focus control
- **Visualizations**: Recharts (7-day distribution charts, monthly presence analytics)
- **Icons**: Lucide React

---

## Architecture Overview

```
                               +--------------------------------------------+
                               |              Clients & Users               |
                               +--------------------------------------------+
                                     |                                |
                                     v                                v
                    +--------------------------------+  +--------------------------------+
                    |    Employee Portal (:5173)     |  |      HR Console (:5174)        |
                    |    React 18 + Vite             |  |      React 18 + Vite           |
                    +--------------------------------+  +--------------------------------+
                                     \                                /
                                      \                              /
                                       v                            v
                               +--------------------------------------------+
                               |     Express API Gateway & Security (:5000) |
                               |     Helmet, CORS, Rate Limiting, Audit     |
                               +--------------------------------------------+
                                      /              |             \
                                     /               |              \
                                    v                v               v
                     +--------------------+ +-----------------+ +---------------------+
                     |   MongoDB Atlas    | |  Upstash Redis  | |   LangGraph Agent   |
                     |  - Attendance      | |  - Rate Limits  | |   - Vector Scoped   |
                     |  - Employees       | |  - Fast Caching | |   - Policy RAG      |
                     |  - GridFS Storage  | |  - Locks        | |   - Groq 120B Model |
                     +--------------------+ +-----------------+ +---------------------+
```

---

## Security Model & Compliance

The system implements multi-layered security controls designed to fulfill OWASP ASVS Level 2 requirements:

1. **Password Security**: Passwords are saved exclusively using the Argon2id memory-hard algorithm.
2. **Two-Factor Authentication (MFA)**: Built-in RFC 6238 TOTP generation and verification with single-use SHA-256 hashed recovery codes.
3. **Token Management**: Stateless access tokens issued via JOSE with short expiry, backed by HTTP-only refresh tokens.
4. **Rate Limiting & Anti-Brute Force**: Global and per-route rate limiters backed by Redis to mitigate credential stuffing and enumeration.
5. **Anti-Enumeration Responses**: Registration and verification endpoints return uniform timing and non-revealing response envelopes.
6. **File Security & Malware Inspection**: GridFS document uploads are validated by binary magic numbers (PDF, PNG, JPEG) and SHA-256 integrity hashing.
7. **Tamper-Evident Audit Logging**: System actions, administrative overrides, and cache operations generate immutable audit events stored in MongoDB.

---

## System Workspaces & Directory Structure

```
Inner-eye-project/
├── Frontend/                 # Employee Self-Service Web Application (Port 5173)
│   ├── src/
│   │   ├── components/       # Reusable UI widgets, PunchClockWidget, StatusBadge
│   │   ├── context/          # AuthContext with token handling
│   │   ├── pages/            # Employee dashboard, attendance, leaves, exceptions
│   │   └── services/         # Centralized API fetch client
│   ├── package.json
│   └── vite.config.ts
├── Hr_dashboard/             # HR Administrative Console Application (Port 5174)
│   ├── src/
│   │   ├── components/       # Executive navigation, cards, modals
│   │   ├── context/          # HR session management
│   │   ├── pages/            # Workforce analytics, directory, adjudication
│   │   └── services/         # Admin API client with download token embedding
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Centralized Express Backend API (Port 5000)
│   ├── src/
│   │   ├── ai/               # LangGraph validation workflows & Groq client
│   │   ├── audit/            # Structured audit logger
│   │   ├── config/           # Database, Redis, and environment configs
│   │   ├── controllers/      # Route controllers (Auth, Me, HR, Registration)
│   │   ├── middleware/       # Auth guards, RBAC, error handler
│   │   ├── models/           # Mongoose data schemas
│   │   └── services/         # Calculation engines and dashboard aggregators
│   ├── tests/                # Vitest unit and security test suites
│   └── package.json
├── docs/                     # Technical architecture, security, and demo guides
├── rag/                      # Grounding policy knowledge base markdown files
└── docker-compose.yml        # Multi-container deployment specification
```

---

## Getting Started

### Prerequisites
- Node.js version 20 or higher
- npm version 9 or higher
- MongoDB Atlas database cluster
- Upstash Redis instance (TLS enabled)
- Groq API Key (for LLM inference)

### 1. Environment Configuration

Create or update `backend/.env` with your authoritative credentials:

```env
NODE_ENV=development
PORT=5000
WEB_URL=http://localhost:5173

# Database & Cache
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/InnerEye?retryWrites=true&w=majority
REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379

# Groq LLM
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b

# Security Secrets
SESSION_SECRET=dev_enterprise_session_secret_32_chars_min_length_secure!
JWT_ACCESS_SECRET=dev_jwt_access_secret_32_chars_min_length_secure!
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_32_chars_min_length_secure!
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

# System Configuration
MFA_ISSUER=EnterpriseHR_Security
STORAGE_PROVIDER=gridfs
MALWARE_SCAN_ENABLED=true
MAX_UPLOAD_SIZE_MB=10
LOG_LEVEL=debug
DEV_SHOW_ACTIVATION_LINKS=true
```

### 2. Dependency Installation

Install dependencies across all root workspaces:

```bash
npm install
```

### 3. Database Seeding & RAG Ingestion

Populate authoritative employee master profiles, historical attendance records, and vectorize company policies:

```bash
# Seed personnel records, schedules, and attendance history
npm run seed

# Chunk and vectorize policy markdown into MongoDB vector storage
npm run rag:ingest
```

### 4. Running the Development Services

Run services concurrently across terminals:

```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Start Employee Self-Service Portal (Port 5173)
npm run dev:frontend

# Terminal 3: Start HR Administrative Console (Port 5174)
npm run dev:hr
```

---

## Authoritative Test Accounts

| Portal | Port | Username / Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **HR Administrative Console** | `5174` | `hr.admin@company.local` | `AdminSecurePass123!` | HR Administrator |
| **Employee Self-Service** | `5173` | `aarav.sharma@company.local` | `EmployeePass123!` | Engineering Lead |
| **Employee Self-Service** | `5173` | `priya.patel@company.local` | `EmployeePass123!` | Product Manager |

---

## Automated Testing & Verification

The test suite validates calculations and security invariants:

```bash
# Execute automated test suite
npm test --workspace=backend
```

### Test Coverage Areas:
- **Attendance Time Accounting**: Grace period thresholds, tardiness minute calculation, half-day session thresholds (< 4.0 hours), and overtime tracking.
- **Leave Deduction Logic**: Weekend skipping (Saturday/Sunday exclusion), public holiday exemption, half-day deduction (0.5 days), and balance decrementing.
- **Security & Cryptography**: Argon2id hash verification, TOTP validation, JOSE JWT lifecycle, binary magic byte inspection, and anti-enumeration response equivalence.

---

## Deployment Guide

### Vercel Deployment (Frontends)

1. **Deploy Employee Portal (`Frontend/`)**:
   - Root Directory: `Frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend-api-domain.com`

2. **Deploy HR Console (`Hr_dashboard/`)**:
   - Root Directory: `Hr_dashboard`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend-api-domain.com`

### Backend Deployment (Render / Docker)

The backend can be containerized via Docker:

```bash
docker-compose up --build -d
```

Ensure CORS configuration in `backend/src/app.ts` includes your production Vercel frontend URLs.

---

## License & Compliance

This repository is developed for enterprise assessment purposes adhering to standard software engineering best practices.

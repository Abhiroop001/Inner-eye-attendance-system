# Enterprise System Architecture

## 1. System Overview & Design Philosophy

The **Security-First Employee Attendance Management System** is architected to eliminate identity ambiguity, enforce deterministic business rules for time/payroll calculations, and provide contextual policy intelligence via stateful LangGraph agentic workflows.

### High-Level Topology
```
[ Browser / Mobile Client ]
             │  (HTTPS / REST / JSON)
             ▼
      [ NGINX Reverse Proxy ]
             │  (Port 80 -> Port 5000)
             ▼
[ Express.js REST API Server (NodeNext ESM) ]
  ├── Correlation & Security Middleware (Helmet, CORS, RequestContext)
  ├── Distributed Rate Limiter (Redis)
  ├── Cryptographic Auth & RBAC (Argon2id, JOSE JWT, TOTP MFA)
  ├── Deterministic Calculation Engines (Luxon)
  │     ├── Attendance Calculation Engine
  │     └── Leave Calculation Engine
  ├── LangGraph Agentic Workflows
  │     ├── Registration Validation State Machine (12 Nodes)
  │     ├── Late Arrival Assistant Graph
  │     ├── Employee Policy Assistant Graph
  │     └── HR Operations Intelligence Graph
  └── Private Binary Vault (GridFS)
             │
             ├──► [ Redis 7 (Tokens, Rate Limits, Cache, Distributed Locks) ]
             └──► [ MongoDB 7 (Collections + Atlas/Local Vector Search Index) ]
```

## 2. Core Separation of Responsibilities

1. **Deterministic Rule Engine (No AI in the Loop for Math)**:
   - Attendance minutes, late arrival tracking with 15-minute grace period, half-day thresholds, overtime, and leave quota deductions are evaluated strictly through deterministic algorithms written with Luxon.
   - LLM models never directly mutate database records, alter timestamps, or modify balances.

2. **LangGraph Agentic Layer (Advisory & Verification Guardrails)**:
   - **Registration Graph**: Performs structured 12-node identity validation, fuzzy email comparison, risk classification, and secure token issuance.
   - **Late Assistant Graph**: Categorizes reasons, checks document requirements, and computes policy-grounded recommendation scores for HR reviewers.
   - **Employee Policy RAG**: Vector-searches authorized company policy markdown documents using cosine similarity with authorization scope pre-filtering.

3. **Storage Tier**:
   - **MongoDB**: Primary document storage for 16 enterprise schemas + Vector Search collections + GridFS binary storage.
   - **Redis**: Rate limiting token buckets, refresh family revocation sets, dashboard aggregation caching, and distributed transaction locks.

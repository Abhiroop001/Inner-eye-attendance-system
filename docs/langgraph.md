# LangGraph Agentic Workflows Specification

## 1. Registration Validation State Machine (12 Nodes)

The registration workflow validates employee self-activation requests through a stateful graph:

```
[ START ]
   │
   ▼
[ Extract Identifiers ]
   │
   ▼
[ Normalize Identifiers ]
   │
   ▼
[ Query Master Database ]
   │
   ├── (Found) ──────────────────────────┐
   │                                     │
   ▼                                     ▼
[ Query Active Accounts ]      [ Fuzzy Email Match ]
   │                                     │
   ▼                                     ▼
[ Evaluate Account State ]     [ Calculate Levenshtein Distance ]
   │                                     │
   ▼                                     ▼
[ Check Active Challenges ]    [ Risk Classification Node ]
   │                                     │
   ▼                                     ▼
[ Generate 15m Token Challenge ]  [ Audit Logging Node ]
   │                                     │
   ▼                                     ▼
[ Save Hashed Challenge ] ──────────────►│
                                         ▼
                               [ Format Output Envelope ]
                                         │
                                         ▼
                                      [ END ]
```

### Key Graph Nodes:
- **`extractIdentifiers`**: Extracts and validates format of `workEmail` and `employeeId`.
- **`normalizeIdentifiers`**: Lowercases emails, trims whitespaces, and uppercases IDs.
- **`queryMasterRecord`**: Retrieves authoritative employee master record from MongoDB.
- **`checkAccountState`**: Verifies whether an active account already exists or if activation is pending.
- **`generateChallenge`**: Generates a cryptographically random 32-byte hexadecimal token with 15-minute TTL.
- **`hashAndPersist`**: Hashes the token using SHA-256 and persists it with reference link.
- **`auditLog`**: Emits security audit events without leaking whether the identifier was valid.

---

## 2. Late Arrival Assistant Graph

Analyzes late arrival reasons submitted by employees against company policy:
1. **`parseReason`**: Extracts reason category and text.
2. **`checkDocumentationRequirement`**: Evaluates whether supporting medical or transit documents are mandatory (>60 min or medical category).
3. **`generateAdvisoryScore`**: Formulates a recommendation (`WAIVE_PENALTY`, `PARTIAL_PENALTY`, `NEEDS_MORE_INFO`, `REJECT`) for HR review.

---

## 3. Employee Assistant RAG Graph

Answers employee queries regarding policies, shift rules, and leave entitlements:
1. **`retrieveContext`**: Pre-filters vector search by `accessScope: ['ALL', 'EMPLOYEE']`.
2. **`assemblePrompt`**: Enforces strict system guardrails against prompt injection and jailbreaking.
3. **`generateStructuredResponse`**: Returns structured JSON with citations and suggested follow-ups.

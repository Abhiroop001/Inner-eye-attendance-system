# MongoDB Database & Vector Search Schema Reference

## 1. Primary Collections Overview

| Collection Name | Purpose | Key Indexes |
|---|---|---|
| `employees` | Authoritative HR master records | `employeeId` (unique), `workEmail` (unique), `department` |
| `user_accounts` | Cryptographic authentication accounts | `username` (unique), `email` (unique), `employeeId`, `hrUserId` |
| `registration_requests` | Neutral activation verification records | `requestId`, `employeeId`, `workEmail`, `ipHash` |
| `activation_challenges` | Single-use 15m hashed activation tokens | `challengeId` (unique), `employeeId`, `tokenHash`, `expiresAt` (TTL) |
| `attendance` | Daily attendance records | `[employeeId, attendanceDate]` (unique composite), `status`, `department` |
| `attendance_events` | Immutable punch events | `eventId`, `attendanceId`, `employeeId`, `timestamp` |
| `late_reasons` | Submitted late explanations | `lateReasonId` (unique), `attendanceId`, `employeeId`, `status` |
| `supporting_documents` | File metadata & SHA-256 integrity digests | `documentId` (unique), `employeeId`, `sha256` |
| `leave_balances` | Real-time leave quotas & consumption | `[employeeId, leaveType]` (unique composite) |
| `leave_requests` | Leave requests & adjudication tracking | `leaveRequestId` (unique), `employeeId`, `status`, `startDate` |
| `leave_policies` | Policy definition templates | `leavePolicyId` (unique) |
| `work_schedules` | Shift timing & grace minutes definitions | `workScheduleId` (unique) |
| `holiday_calendars` | Gazetted calendar days | `[calendarYear, date]` (unique composite) |
| `audit_logs` | Immutable compliance logs | `auditId`, `actorId`, `action`, `createdAt` |
| `security_events` | Security incidents & lockout telemetry | `eventId`, `actorId`, `ipHash`, `eventType` |
| `rag_documents` | Vector embeddings & chunked policy text | `documentId`, `accessScope`, `embedding` (384-dim Vector Search) |

## 2. Vector Search Configuration

MongoDB Atlas Vector Search Index definition:
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 384,
        "similarity": "cosine"
      },
      "accessScope": {
        "type": "token"
      },
      "documentType": {
        "type": "token"
      }
    }
  }
}
```
Pre-filtering query pipeline:
```javascript
[
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: vector,
      numCandidates: 50,
      limit: 5,
      filter: {
        accessScope: { $in: ["ALL", "EMPLOYEE"] }
      }
    }
  }
]
```

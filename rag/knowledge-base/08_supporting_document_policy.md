---
document_id: supporting-document-policy-v1
version: "1.0"
document_type: policy
title: Supporting Document Ingestion, Storage Vault, and Malware Defense Policy
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Supporting Document Ingestion, Storage Vault, and Malware Defense Policy

## 1. Acceptable File Formats & Thresholds
- **Permitted MIME Types**: `application/pdf`, `image/jpeg`, `image/png`.
- **Maximum File Size**: 10 Megabytes ($10 \times 1024 \times 1024$ bytes) per document.
- **Allowed Document Types**: Medical certificates, traffic congestion attestations, public transit incident slips, flight delay notifications, death/bereavement notices.

## 2. Ingestion Security Pipeline
All document uploads pass through an unalterable multi-stage validation pipeline:
1. **Authentication & Authorization**: Verify that the uploading user owns the referenced `attendanceId` or `lateReasonId`.
2. **MIME & Magic Byte Verification**: Inspect initial binary file signatures to prevent executable masquerading (`.exe`, `.sh`, `.php`, `.js` disguised as `.pdf` or `.png`).
3. **Safe Identifier Sanitization**: Generate a secure UUID-based opaque storage key. The raw client-supplied filename is never used in server storage paths.
4. **Cryptographic Checksumming**: Compute and record SHA-256 digest of payload for tamper detection.
5. **Private Vault Storage**: Binary streams are stored in MongoDB GridFS or private object vaults located completely outside the public web root.
6. **Access Control**: Downloads require authenticated, signed short-lived session requests.

## 3. Retention & Deletion
- Supporting documents are retained for 3 years to satisfy statutory labor compliance requirements.
- Expired documents are permanently purged with an immutable audit entry.

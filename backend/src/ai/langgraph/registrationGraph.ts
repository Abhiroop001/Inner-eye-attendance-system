import crypto from 'crypto';
import { z } from 'zod';
import { Employee, IEmployee } from '../../models/Employee.js';
import { UserAccount, IUserAccount } from '../../models/UserAccount.js';
import { ActivationChallenge } from '../../models/ActivationChallenge.js';
import { RegistrationRequest } from '../../models/RegistrationRequest.js';
import { searchKnowledgeBase } from '../vectorStore.js';
import { executeStructuredInference } from '../groqClient.js';
import { logAuditEvent, logSecurityEvent } from '../../audit/auditLogger.js';

export const RegistrationDecisionSchema = z.object({
  decision: z.enum([
    'ACTIVATION_ALLOWED',
    'ACTIVATION_PENDING_REVIEW',
    'REJECTED',
    'ALREADY_REGISTERED',
    'TEMPORARILY_BLOCKED',
  ]),
  confidence: z.number().min(0).max(1),
  matchedEmployeeId: z.string().nullable(),
  reasons: z.array(z.string()),
  policySources: z.array(z.string()),
});

export type RegistrationDecision = z.infer<typeof RegistrationDecisionSchema>;

export interface RegistrationGraphState {
  requestId: string;
  publicReference: string;
  submittedEmail: string;
  submittedEmployeeId: string;
  ip: string;
  userAgent?: string;
  // Execution state
  normalizedEmail?: string;
  normalizedEmployeeId?: string;
  employeeRecord?: IEmployee | null;
  userAccountRecord?: IUserAccount | null;
  existingChallenge?: any | null;
  riskScore: number;
  riskReasons: string[];
  policySources: string[];
  decision?: RegistrationDecision;
  activationToken?: string;
  activationTokenHash?: string;
  challengeId?: string;
}

/**
 * 12-Node Deterministic Registration Validation Workflow
 * Deterministic rules govern identity, state, and credential challenge issuance.
 * AI RAG provides risk scoring, policy verification, and structured classification.
 */
export async function runRegistrationValidation(
  input: {
    submittedEmail: string;
    submittedEmployeeId: string;
    ip: string;
    userAgent?: string;
  }
): Promise<{
  publicReference: string;
  status: string;
  devActivationToken?: string;
  devChallengeId?: string;
}> {
  const requestId = 'reg_' + crypto.randomUUID();
  const publicReference = 'REF-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const state: RegistrationGraphState = {
    requestId,
    publicReference,
    submittedEmail: input.submittedEmail,
    submittedEmployeeId: input.submittedEmployeeId,
    ip: input.ip,
    userAgent: input.userAgent,
    riskScore: 0,
    riskReasons: [],
    policySources: [],
  };

  // Node 1: Normalize Input
  state.normalizedEmail = state.submittedEmail.trim().toLowerCase();
  state.normalizedEmployeeId = state.submittedEmployeeId.trim().toUpperCase();

  // Node 2: Validate Input Schema
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(state.normalizedEmail) || state.normalizedEmployeeId.length < 3) {
    state.riskScore += 50;
    state.riskReasons.push('Malformed email or employee ID structure');
  }

  // Node 3: Rate Limit / Anomaly Check
  const recentAttempts = await RegistrationRequest.countDocuments({
    submittedEmail: state.normalizedEmail,
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
  });
  if (recentAttempts > 5) {
    state.riskScore += 40;
    state.riskReasons.push('High frequency of registration attempts in last 15 minutes');
  }

  // Node 4: Deterministic Employee Lookup
  state.employeeRecord = await Employee.findOne({
    workEmail: state.normalizedEmail,
    employeeId: state.normalizedEmployeeId,
  });

  // Node 5: Vector Policy Retrieval (Supporting Evidence)
  const retrievedDocs = await searchKnowledgeBase({
    query: 'employee registration provisioning one-time activation policy duplicate check',
    limit: 2,
    accessScope: ['EMPLOYEE', 'HR'],
    documentType: 'policy',
  });
  state.policySources = retrievedDocs.map((d) => d.documentId);

  // Node 6: Employment Status Check
  let employmentActive = false;
  if (state.employeeRecord) {
    if (state.employeeRecord.employmentStatus === 'ACTIVE') {
      employmentActive = true;
    } else {
      state.riskScore += 80;
      state.riskReasons.push(`Employee status is ${state.employeeRecord.employmentStatus} (not ACTIVE)`);
    }
  }

  // Node 7: Duplicate Account Check
  if (state.employeeRecord) {
    state.userAccountRecord = await UserAccount.findOne({
      $or: [{ employeeId: state.employeeRecord.employeeId }, { email: state.normalizedEmail }],
    });
  }

  // Node 8: Active Challenge Check
  if (state.employeeRecord) {
    state.existingChallenge = await ActivationChallenge.findOne({
      employeeId: state.employeeRecord.employeeId,
      status: 'ISSUED',
      expiresAt: { $gt: new Date() },
    });
  }

  // Node 9: Risk & Anomaly LLM Advisory Evaluation
  const aiDecision = await executeStructuredInference<RegistrationDecision>({
    systemPrompt: `You are an enterprise identity verification advisor. Evaluate the employee registration request against company policy.
Rules:
- Authoritative match requires exact email and employee ID.
- If employmentStatus != ACTIVE, reject.
- If account is already ACTIVE, return ALREADY_REGISTERED.
- Vector search is supporting evidence only. Never activate without deterministic match.`,
    userPrompt: JSON.stringify({
      submittedEmail: state.normalizedEmail,
      submittedEmployeeId: state.normalizedEmployeeId,
      deterministicMatchFound: !!state.employeeRecord,
      employmentStatus: state.employeeRecord?.employmentStatus || 'NOT_FOUND',
      accountAlreadyActive: state.employeeRecord?.accountStatus === 'ACTIVE',
      hasExistingAccount: !!state.userAccountRecord,
      riskReasons: state.riskReasons,
      retrievedPolicies: state.policySources,
    }),
    schema: RegistrationDecisionSchema,
    fallbackGenerator: () => {
      if (!state.employeeRecord) {
        return {
          decision: 'REJECTED',
          confidence: 0.99,
          matchedEmployeeId: null,
          reasons: ['No matching employee record in master dataset'],
          policySources: state.policySources,
        };
      }
      if (state.employeeRecord.accountStatus === 'ACTIVE' || state.userAccountRecord) {
        return {
          decision: 'ALREADY_REGISTERED',
          confidence: 1.0,
          matchedEmployeeId: state.employeeRecord.employeeId,
          reasons: ['Account already provisioned and active'],
          policySources: state.policySources,
        };
      }
      if (!employmentActive) {
        return {
          decision: 'REJECTED',
          confidence: 0.95,
          matchedEmployeeId: state.employeeRecord.employeeId,
          reasons: ['Employment record is not active'],
          policySources: state.policySources,
        };
      }
      return {
        decision: 'ACTIVATION_ALLOWED',
        confidence: 0.98,
        matchedEmployeeId: state.employeeRecord.employeeId,
        reasons: ['Valid authoritative master record found, pending initial activation'],
        policySources: state.policySources,
      };
    },
  });

  // Node 10: Deterministic Override & Decision Enforcement
  // Hard constraint: Deterministic rules override AI if there is any contradiction
  let finalDecision = aiDecision.decision;
  if (!state.employeeRecord || !employmentActive) {
    finalDecision = 'REJECTED';
  } else if (state.employeeRecord.accountStatus === 'ACTIVE' || state.userAccountRecord) {
    finalDecision = 'ALREADY_REGISTERED';
  } else if (state.employeeRecord.accountStatus === 'NOT_REGISTERED' || state.employeeRecord.accountStatus === 'ACTIVATION_PENDING') {
    finalDecision = 'ACTIVATION_ALLOWED';
  }

  // Node 11: Create Activation Challenge (If Allowed)
  if (finalDecision === 'ACTIVATION_ALLOWED' && state.employeeRecord) {
    // Invalidate any older pending challenges
    await ActivationChallenge.updateMany(
      { employeeId: state.employeeRecord.employeeId, status: 'ISSUED' },
      { status: 'REVOKED' }
    );

    const rawToken = crypto.randomBytes(32).toString('hex'); // 64-char high entropy
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const challengeId = 'chn_' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await ActivationChallenge.create({
      challengeId,
      requestId,
      employeeId: state.employeeRecord.employeeId,
      tokenHash,
      status: 'ISSUED',
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
    });

    state.employeeRecord.accountStatus = 'ACTIVATION_PENDING';
    await state.employeeRecord.save();

    state.activationToken = rawToken;
    state.activationTokenHash = tokenHash;
    state.challengeId = challengeId;
  }

  // Node 12: Record Immutable Registration Request & Audit Event
  await RegistrationRequest.create({
    requestId,
    publicReference,
    employeeId: state.employeeRecord?.employeeId || null,
    submittedEmail: state.normalizedEmail,
    submittedEmployeeId: state.normalizedEmployeeId,
    resolutionConfidence: aiDecision.confidence,
    resolutionMethod: 'DETERMINISTIC',
    status: finalDecision === 'ACTIVATION_ALLOWED' ? 'CHALLENGE_ISSUED' : 'REJECTED',
    riskScore: state.riskScore,
    challengeId: state.challengeId || null,
    submittedAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    rejectionReasonCode: finalDecision !== 'ACTIVATION_ALLOWED' ? finalDecision : null,
    auditMetadata: {
      decision: finalDecision,
      reasons: aiDecision.reasons,
      policySources: state.policySources,
    },
  });

  await logAuditEvent({
    actorType: 'ANONYMOUS',
    actorId: state.normalizedEmail,
    action: 'REGISTRATION_REQUEST_EVALUATED',
    entityType: 'RegistrationRequest',
    entityId: requestId,
    result: finalDecision === 'ACTIVATION_ALLOWED' ? 'SUCCESS' : 'DENIED',
    reasonCode: finalDecision,
    ip: state.ip,
    requestId,
    metadata: {
      publicReference,
      matchedEmployeeId: state.employeeRecord?.employeeId,
      riskScore: state.riskScore,
    },
  });

  return {
    publicReference,
    status: 'PROCESSED',
    devActivationToken: state.activationToken,
    devChallengeId: state.challengeId,
  };
}

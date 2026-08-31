import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { runRegistrationValidation } from '../ai/langgraph/registrationGraph.js';
import { ActivationChallenge } from '../models/ActivationChallenge.js';
import { Employee } from '../models/Employee.js';
import { UserAccount } from '../models/UserAccount.js';
import { hashPassword } from '../security/password.js';
import { logAuditEvent, logSecurityEvent } from '../audit/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const RegistrationRequestSchema = z.object({
  workEmail: z.string().email('Valid official email address is required'),
  employeeId: z.string().min(3, 'Employee ID is required'),
});

const VerifyChallengeSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  token: z.string().min(10, 'Activation token is required'),
});

const CompleteActivationSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  token: z.string().min(10, 'Activation token is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function submitRegistrationRequest(req: Request, res: Response): Promise<void> {
  const { workEmail, employeeId } = RegistrationRequestSchema.parse(req.body);

  const result = await runRegistrationValidation({
    submittedEmail: workEmail,
    submittedEmployeeId: employeeId,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'],
  });

  // Strict non-enumerating neutral response for all public requests
  const responsePayload: any = {
    message:
      'Your request has been received and is being processed. If the information matches an eligible authoritative employee record, further activation instructions will be provided.',
    reference: result.publicReference,
  };

  // In development mode, optionally expose the activation challenge link for demo convenience
  if (env.DEV_SHOW_ACTIVATION_LINKS && result.devActivationToken && result.devChallengeId) {
    responsePayload.devActivationDetails = {
      challengeId: result.devChallengeId,
      activationToken: result.devActivationToken,
      activationUrl: `${env.WEB_URL}/activate?challengeId=${result.devChallengeId}&token=${result.devActivationToken}`,
    };
  }

  res.status(200).json({
    success: true,
    data: responsePayload,
    requestId: req.id,
  });
}

export async function verifyActivationToken(req: Request, res: Response): Promise<void> {
  const { challengeId, token } = VerifyChallengeSchema.parse(req.body);

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const challenge = await ActivationChallenge.findOne({ challengeId });

  if (!challenge) {
    throw new AppError('Activation challenge not found or invalid.', 404, 'CHALLENGE_NOT_FOUND');
  }

  if (challenge.status !== 'ISSUED') {
    throw new AppError(`Activation challenge is no longer valid (Status: ${challenge.status}).`, 400, 'CHALLENGE_INVALID');
  }

  if (challenge.expiresAt < new Date()) {
    challenge.status = 'EXPIRED';
    await challenge.save();
    throw new AppError('Activation challenge has expired. Please submit a new registration request.', 400, 'CHALLENGE_EXPIRED');
  }

  if (challenge.tokenHash !== tokenHash) {
    challenge.attempts += 1;
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.status = 'REVOKED';
      await logSecurityEvent({
        eventType: 'ACTIVATION_CHALLENGE_EXHAUSTED',
        severity: 'HIGH',
        actorId: challenge.employeeId,
        ip: req.ip || 'unknown',
        requestId: req.id,
      });
    }
    await challenge.save();
    throw new AppError('Invalid activation token provided.', 400, 'INVALID_TOKEN');
  }

  const employee = await Employee.findOne({ employeeId: challenge.employeeId });

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      employeeId: challenge.employeeId,
      legalName: employee?.legalName || '',
      workEmail: employee?.workEmail || '',
      department: employee?.department || '',
    },
    requestId: req.id,
  });
}

export async function completeActivation(req: Request, res: Response): Promise<void> {
  const { challengeId, token, username, password } = CompleteActivationSchema.parse(req.body);

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const challenge = await ActivationChallenge.findOne({ challengeId });

  if (!challenge || challenge.status !== 'ISSUED' || challenge.expiresAt < new Date() || challenge.tokenHash !== tokenHash) {
    throw new AppError('Activation challenge is invalid, expired, or already consumed.', 400, 'INVALID_ACTIVATION');
  }

  const employee = await Employee.findOne({ employeeId: challenge.employeeId });
  if (!employee) {
    throw new AppError('Associated employee record could not be found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  // Prevent double account provisioning
  const existingUser = await UserAccount.findOne({
    $or: [{ username: username.trim().toLowerCase() }, { employeeId: employee.employeeId }, { email: employee.workEmail }],
  });

  if (existingUser) {
    throw new AppError('An account with this username or for this employee already exists.', 409, 'ACCOUNT_EXISTS');
  }

  // Hash permanent password with Argon2id
  const passwordHash = await hashPassword(password);
  const accountId = 'acc_' + crypto.randomUUID();

  // Create authoritative UserAccount
  await UserAccount.create({
    accountId,
    employeeId: employee.employeeId,
    role: 'EMPLOYEE',
    username: username.trim().toLowerCase(),
    email: employee.workEmail,
    passwordHash,
    mfaEnabled: false,
    status: 'ACTIVE',
  });

  // Consume challenge permanently
  challenge.status = 'CONSUMED';
  challenge.consumedAt = new Date();
  await challenge.save();

  // Update employee record
  employee.accountStatus = 'ACTIVE';
  employee.registrationCompletedAt = new Date();
  await employee.save();

  await logAuditEvent({
    actorType: 'EMPLOYEE',
    actorId: accountId,
    action: 'EMPLOYEE_ACCOUNT_ACTIVATED',
    entityType: 'UserAccount',
    entityId: accountId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      employeeId: employee.employeeId,
      username: username.trim().toLowerCase(),
    },
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'Account activation completed successfully. You can now log in.',
      username: username.trim().toLowerCase(),
      employeeId: employee.employeeId,
    },
    requestId: req.id,
  });
}

import { Request, Response } from 'express';
import { z } from 'zod';
import { UserAccount } from '../models/UserAccount.js';
import { Employee } from '../models/Employee.js';
import { verifyPassword, hashPassword } from '../security/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../security/jwt.js';
import { verifyTotpToken, verifyRecoveryCode } from '../security/totp.js';
import { logAuditEvent, logSecurityEvent } from '../audit/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

const MfaVerifySchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().min(4, 'MFA Code or recovery code is required'),
  isRecovery: z.boolean().optional().default(false),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function login(req: Request, res: Response): Promise<void> {
  const { usernameOrEmail, password } = LoginSchema.parse(req.body);
  const normalized = usernameOrEmail.trim().toLowerCase();

  const user = await UserAccount.findOne({
    $or: [{ username: normalized }, { email: normalized }],
  });

  // Protect against timing attacks / enumeration
  if (!user) {
    await verifyPassword('$argon2id$v=19$m=65536,t=3,p=4$fakeSalt$fakeHash', 'dummy');
    await logAuditEvent({
      actorType: 'ANONYMOUS',
      actorId: normalized,
      action: 'LOGIN_ATTEMPT',
      entityType: 'UserAccount',
      entityId: 'UNKNOWN',
      result: 'FAILURE',
      reasonCode: 'INVALID_CREDENTIALS',
      ip: req.ip,
      requestId: req.id,
    });

    throw new AppError('Invalid username/email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Check account lockout
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMins = Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60));
    throw new AppError(
      `Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMins} minutes.`,
      403,
      'ACCOUNT_LOCKED'
    );
  }

  // Check account status
  if (user.status !== 'ACTIVE') {
    throw new AppError('This user account has been suspended or deactivated.', 403, 'ACCOUNT_SUSPENDED');
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, password);

  if (!isPasswordValid) {
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
      await logSecurityEvent({
        eventType: 'ACCOUNT_LOCKOUT_TRIGGERED',
        severity: 'HIGH',
        actorId: user.accountId,
        ip: req.ip || 'unknown',
        requestId: req.id,
        details: { failedAttempts: user.failedLoginCount },
      });
    }
    await user.save();

    await logAuditEvent({
      actorType: user.role,
      actorId: user.accountId,
      action: 'LOGIN_ATTEMPT',
      entityType: 'UserAccount',
      entityId: user.accountId,
      result: 'FAILURE',
      reasonCode: 'INVALID_PASSWORD',
      ip: req.ip,
      requestId: req.id,
    });

    throw new AppError('Invalid username/email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Reset failed login counter on success
  user.failedLoginCount = 0;
  user.lockUntil = null;
  await user.save();

  // If MFA is required and enabled
  if (user.mfaEnabled && user.mfaSecret) {
    const tempPayload: TokenPayload = {
      accountId: user.accountId,
      employeeId: user.employeeId,
      hrUserId: user.hrUserId,
      role: user.role,
      username: user.username,
      email: user.email,
      mfaAuthenticated: false,
    };
    const tempToken = await generateAccessToken(tempPayload);

    res.status(200).json({
      success: true,
      data: {
        mfaRequired: true,
        tempToken,
      },
      requestId: req.id,
    });
    return;
  }

  // Complete standard login
  const tokenPayload: TokenPayload = {
    accountId: user.accountId,
    employeeId: user.employeeId,
    hrUserId: user.hrUserId,
    role: user.role,
    username: user.username,
    email: user.email,
    mfaAuthenticated: true,
  };

  const accessToken = await generateAccessToken(tokenPayload);
  const { token: refreshToken, familyId } = await generateRefreshToken(tokenPayload);

  user.currentRefreshFamilyId = familyId;
  await user.save();

  if (user.employeeId) {
    await Employee.updateOne({ employeeId: user.employeeId }, { lastLoginAt: new Date() });
  }

  // Set HTTP-Only Refresh Cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await logAuditEvent({
    actorType: user.role,
    actorId: user.accountId,
    action: 'LOGIN_SUCCESS',
    entityType: 'UserAccount',
    entityId: user.accountId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
  });

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      user: {
        accountId: user.accountId,
        employeeId: user.employeeId,
        hrUserId: user.hrUserId,
        role: user.role,
        username: user.username,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
      },
    },
    requestId: req.id,
  });
}

export async function verifyMfa(req: Request, res: Response): Promise<void> {
  const { tempToken, code, isRecovery } = MfaVerifySchema.parse(req.body);

  const { verifyAccessToken } = await import('../security/jwt.js');
  const payload = await verifyAccessToken(tempToken);

  if (!payload) {
    throw new AppError('Invalid or expired MFA verification session.', 401, 'INVALID_SESSION');
  }

  const user = await UserAccount.findOne({ accountId: payload.accountId });
  if (!user || !user.mfaSecret) {
    throw new AppError('MFA not configured for this account.', 400, 'MFA_NOT_CONFIGURED');
  }

  let verified = false;

  if (isRecovery) {
    const recoveryResult = verifyRecoveryCode(code, user.mfaRecoveryCodes || []);
    if (recoveryResult.isValid) {
      verified = true;
      user.mfaRecoveryCodes = recoveryResult.updatedHashedCodes;
      await user.save();
    }
  } else {
    verified = verifyTotpToken(code, user.mfaSecret);
  }

  if (!verified) {
    await logSecurityEvent({
      eventType: 'MFA_VERIFICATION_FAILED',
      severity: 'MEDIUM',
      actorId: user.accountId,
      ip: req.ip || 'unknown',
      requestId: req.id,
    });
    throw new AppError('Invalid authentication code.', 400, 'INVALID_MFA_CODE');
  }

  const fullPayload: TokenPayload = {
    ...payload,
    mfaAuthenticated: true,
  };

  const accessToken = await generateAccessToken(fullPayload);
  const { token: refreshToken, familyId } = await generateRefreshToken(fullPayload);

  user.currentRefreshFamilyId = familyId;
  await user.save();

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      user: {
        accountId: user.accountId,
        employeeId: user.employeeId,
        hrUserId: user.hrUserId,
        role: user.role,
        username: user.username,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
      },
    },
    requestId: req.id,
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const oldRefreshToken = req.cookies?.refresh_token;
  if (!oldRefreshToken) {
    throw new AppError('No refresh token provided.', 401, 'MISSING_REFRESH_TOKEN');
  }

  const payload = await verifyRefreshToken(oldRefreshToken);
  if (!payload) {
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await UserAccount.findOne({ accountId: payload.accountId });
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError('User account suspended or not found.', 403, 'ACCOUNT_INACTIVE');
  }

  // Refresh token rotation reuse detection
  if (user.currentRefreshFamilyId && user.currentRefreshFamilyId !== payload.familyId) {
    // Potential token theft - invalidate all sessions
    user.currentRefreshFamilyId = null;
    await user.save();

    await logSecurityEvent({
      eventType: 'REFRESH_TOKEN_REUSE_DETECTED',
      severity: 'CRITICAL',
      actorId: user.accountId,
      ip: req.ip || 'unknown',
      requestId: req.id,
    });

    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    throw new AppError('Security violation detected. All active sessions invalidated.', 403, 'TOKEN_REUSE_REVOKED');
  }

  const tokenPayload: TokenPayload = {
    accountId: user.accountId,
    employeeId: user.employeeId,
    hrUserId: user.hrUserId,
    role: user.role,
    username: user.username,
    email: user.email,
    mfaAuthenticated: true,
  };

  const newAccessToken = await generateAccessToken(tokenPayload);
  const { token: newRefreshToken, familyId: newFamilyId } = await generateRefreshToken(tokenPayload);

  user.currentRefreshFamilyId = newFamilyId;
  await user.save();

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken },
    requestId: req.id,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await UserAccount.updateOne({ accountId: req.user.accountId }, { currentRefreshFamilyId: null });
    await logAuditEvent({
      actorType: req.user.role,
      actorId: req.user.accountId,
      action: 'LOGOUT',
      entityType: 'UserAccount',
      entityId: req.user.accountId,
      result: 'SUCCESS',
      ip: req.ip,
      requestId: req.id,
    });
  }

  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.status(200).json({
    success: true,
    data: { message: 'Successfully logged out.' },
    requestId: req.id,
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthenticated', 401, 'UNAUTHENTICATED');
  }

  let profileData: any = null;
  if (req.user.employeeId) {
    profileData = await Employee.findOne({ employeeId: req.user.employeeId });
  }

  res.status(200).json({
    success: true,
    data: {
      account: {
        accountId: req.user.accountId,
        role: req.user.role,
        username: req.user.username,
        email: req.user.email,
        employeeId: req.user.employeeId,
        hrUserId: req.user.hrUserId,
      },
      employee: profileData,
    },
    requestId: req.id,
  });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthenticated', 401, 'UNAUTHENTICATED');
  }

  const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);

  const user = await UserAccount.findOne({ accountId: req.user.accountId });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isValid = await verifyPassword(user.passwordHash, currentPassword);
  if (!isValid) {
    throw new AppError('Current password provided is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.currentRefreshFamilyId = null; // Invalidate other sessions
  await user.save();

  await logAuditEvent({
    actorType: req.user.role,
    actorId: req.user.accountId,
    action: 'PASSWORD_CHANGE',
    entityType: 'UserAccount',
    entityId: req.user.accountId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
  });

  res.status(200).json({
    success: true,
    data: { message: 'Password updated successfully. Please log in with your new password.' },
    requestId: req.id,
  });
}

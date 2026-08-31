import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../security/jwt.js';
import { UserAccount } from '../models/UserAccount.js';
import { logSecurityEvent } from '../audit/auditLogger.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token && req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required to access this resource.',
      },
      requestId: req.id,
    });
    return;
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Provided access token is invalid or has expired.',
      },
      requestId: req.id,
    });
    return;
  }

  // Verify account is still active in DB
  const userAccount = await UserAccount.findOne({ accountId: payload.accountId });
  if (!userAccount || userAccount.status !== 'ACTIVE') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'User account has been suspended or locked.',
      },
      requestId: req.id,
    });
    return;
  }

  // Check MFA requirement if enabled on account
  if (userAccount.mfaEnabled && !payload.mfaAuthenticated) {
    res.status(403).json({
      success: false,
      error: {
        code: 'MFA_REQUIRED',
        message: 'Multi-Factor Authentication verification is required.',
      },
      requestId: req.id,
    });
    return;
  }

  req.user = payload;
  next();
}

export function requireRole(allowedRoles: Array<'EMPLOYEE' | 'HR'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        requestId: req.id,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent({
        eventType: 'UNAUTHORIZED_ROLE_ACCESS_ATTEMPT',
        severity: 'MEDIUM',
        actorId: req.user.accountId,
        ip: req.ip || 'unknown',
        requestId: req.id,
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
        },
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not possess the required role permissions for this operation.',
        },
        requestId: req.id,
      });
      return;
    }

    next();
  };
}

export function requireEmployeeOwnerOrHR(getEmployeeIdFromReq: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Auth required' }, requestId: req.id });
      return;
    }

    const targetEmployeeId = getEmployeeIdFromReq(req);
    if (req.user.role === 'HR') {
      return next(); // HR has privileged operational access
    }

    if (req.user.role === 'EMPLOYEE' && req.user.employeeId === targetEmployeeId) {
      return next(); // Employee accessing own records
    }

    logSecurityEvent({
      eventType: 'IDOR_ATTEMPT_BLOCKED',
      severity: 'HIGH',
      actorId: req.user.accountId,
      ip: req.ip || 'unknown',
      requestId: req.id,
      details: {
        claimedEmployeeId: req.user.employeeId,
        targetEmployeeId,
        path: req.originalUrl,
      },
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'You are not authorized to view or mutate another employee’s records.',
      },
      requestId: req.id,
    });
  };
}

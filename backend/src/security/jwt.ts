import * as jose from 'jose';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface TokenPayload {
  accountId: string;
  employeeId?: string | null;
  hrUserId?: string | null;
  role: 'EMPLOYEE' | 'HR';
  username: string;
  email: string;
  mfaAuthenticated: boolean;
}

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('EnterpriseHR_Auth')
    .setAudience('EnterpriseHR_App')
    .setExpirationTime('15m')
    .sign(accessSecret);
}

export async function generateRefreshToken(payload: TokenPayload, familyId?: string): Promise<{ token: string; familyId: string; jti: string }> {
  const jti = crypto.randomUUID();
  const famId = familyId || crypto.randomUUID();

  const token = await new jose.SignJWT({
    accountId: payload.accountId,
    role: payload.role,
    familyId: famId,
    jti,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('EnterpriseHR_Auth')
    .setAudience('EnterpriseHR_App')
    .setExpirationTime('7d')
    .sign(refreshSecret);

  return { token, familyId: famId, jti };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, accessSecret, {
      issuer: 'EnterpriseHR_Auth',
      audience: 'EnterpriseHR_App',
    });
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ accountId: string; role: 'EMPLOYEE' | 'HR'; familyId: string; jti: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, refreshSecret, {
      issuer: 'EnterpriseHR_Auth',
      audience: 'EnterpriseHR_App',
    });
    return payload as unknown as { accountId: string; role: 'EMPLOYEE' | 'HR'; familyId: string; jti: string };
  } catch (error) {
    return null;
  }
}

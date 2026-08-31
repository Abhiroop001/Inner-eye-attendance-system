import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { env } from '../config/env.js';

authenticator.options = {
  window: 1, // Allow 1 step backward/forward clock skew
  step: 30,
};

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export async function generateTotpQrCode(username: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(username, env.MFA_ISSUER, secret);
  return await QRCode.toDataURL(otpauth);
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

export function generateRecoveryCodes(count = 8): { rawCodes: string[]; hashedCodes: string[] } {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars, e.g. A1B2C3D4E5
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    rawCodes.push(formatted);
    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push(hash);
  }

  return { rawCodes, hashedCodes };
}

export function verifyRecoveryCode(inputCode: string, hashedCodes: string[]): { isValid: boolean; updatedHashedCodes: string[] } {
  const inputHash = crypto.createHash('sha256').update(inputCode.trim().toUpperCase()).digest('hex');
  const index = hashedCodes.indexOf(inputHash);

  if (index !== -1) {
    const updated = [...hashedCodes];
    updated.splice(index, 1); // Single use - remove consumed code
    return { isValid: true, updatedHashedCodes: updated };
  }

  return { isValid: false, updatedHashedCodes: hashedCodes };
}

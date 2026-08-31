import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/security/password.js';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../../src/security/jwt.js';
import { validateMagicBytes } from '../../src/services/uploadService.js';
import { generateRecoveryCodes, verifyRecoveryCode } from '../../src/security/totp.js';

describe('Enterprise Security Controls Unit Tests', () => {
  it('should securely hash and verify passwords using Argon2id', async () => {
    const password = 'CorrectHorseBatteryStaple123!';
    const hash = await hashPassword(password);

    expect(hash).toContain('$argon2id$');
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
  });

  it('should issue and verify short-lived access JWT tokens', async () => {
    const payload = {
      accountId: 'acc_test123',
      employeeId: 'EMP-1001',
      hrUserId: null,
      role: 'EMPLOYEE' as const,
      username: 'aarav_sharma',
      email: 'aarav.sharma@company.local',
      mfaAuthenticated: true,
    };

    const token = await generateAccessToken(payload);
    const verified = await verifyAccessToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.accountId).toBe(payload.accountId);
    expect(verified?.role).toBe('EMPLOYEE');
  });

  it('should reject tampered JWT tokens', async () => {
    const payload = {
      accountId: 'acc_test123',
      employeeId: 'EMP-1001',
      role: 'EMPLOYEE' as const,
      username: 'test',
      email: 'test@company.local',
      mfaAuthenticated: true,
    };

    const token = await generateAccessToken(payload);
    const tampered = token.slice(0, -5) + 'AAAAA';
    const verified = await verifyAccessToken(tampered);

    expect(verified).toBeNull();
  });

  it('should accurately detect valid and spoofed binary file signatures (Magic Bytes)', () => {
    // Valid PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
    const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    expect(validateMagicBytes(validPdfBuffer, 'application/pdf')).toBe(true);

    // Disguised executable (.exe starting with MZ: 0x4D, 0x5A) claiming to be PDF
    const fakePdfBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(validateMagicBytes(fakePdfBuffer, 'application/pdf')).toBe(false);

    // Valid PNG signature: 0x89, 0x50, 0x4E, 0x47
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(validPngBuffer, 'image/png')).toBe(true);
    expect(validateMagicBytes(fakePdfBuffer, 'image/png')).toBe(false);
  });

  it('should generate and consume one-time MFA recovery codes securely', () => {
    const { rawCodes, hashedCodes } = generateRecoveryCodes(5);
    expect(rawCodes.length).toBe(5);
    expect(hashedCodes.length).toBe(5);

    const testCode = rawCodes[0];
    const verification = verifyRecoveryCode(testCode, hashedCodes);

    expect(verification.isValid).toBe(true);
    expect(verification.updatedHashedCodes.length).toBe(4); // Consumed one-time code removed

    // Replay attempt must fail
    const replayVerification = verifyRecoveryCode(testCode, verification.updatedHashedCodes);
    expect(replayVerification.isValid).toBe(false);
  });
});

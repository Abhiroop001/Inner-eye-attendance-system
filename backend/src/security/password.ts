import argon2 from 'argon2';

/**
 * Enterprise Argon2id Password Hasher
 * Uses OWASP recommended parameters:
 * Memory cost: 64MB (65536 KiB)
 * Time cost: 3 iterations
 * Parallelism: 4 threads
 * Type: Argon2id (hybrid defense against side-channel and GPU attacks)
 */
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch (error) {
    return false;
  }
}

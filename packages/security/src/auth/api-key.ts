import { createHash, randomBytes } from 'node:crypto';

const API_KEY_PREFIX = 'hydra_';
const API_KEY_BYTES = 32;

/**
 * Generate a new API key
 *
 * @returns Object containing the plaintext key and its prefix for identification
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const rawKey = randomBytes(API_KEY_BYTES).toString('hex');
  const key = `${API_KEY_PREFIX}${rawKey}`;
  const prefix = key.slice(0, 12);
  const hash = hashApiKey(key);

  return { key, prefix, hash };
}

/**
 * Hash an API key for storage
 *
 * @param key - The plaintext API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against a stored hash
 *
 * @param key - The plaintext API key to verify
 * @param storedHash - The stored SHA-256 hash
 * @returns true if the key matches
 */
export function verifyApiKey(key: string, storedHash: string): boolean {
  const computedHash = hashApiKey(key);
  return computedHash === storedHash;
}

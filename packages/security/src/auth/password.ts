import { randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Hash a password using scrypt (Argon2 requires native deps - scrypt is built-in)
 *
 * @param password - The plaintext password
 * @returns The hashed password string (salt:hash format)
 */
export async function hashPassword(password: string): Promise<string> {
  const { scrypt } = await import('node:crypto');
  const salt = randomBytes(32).toString('hex');

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a hash
 *
 * @param password - The plaintext password to verify
 * @param hash - The stored hash (salt:hash format)
 * @returns true if the password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { scrypt } = await import('node:crypto');
  const [salt, key] = hash.split(':');
  if (!salt || !key) {
    return false;
  }

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      const keyBuffer = Buffer.from(key, 'hex');
      resolve(timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}

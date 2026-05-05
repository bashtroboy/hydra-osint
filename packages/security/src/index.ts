/**
 * @hydra/security - Authentication, authorization, and audit logging
 *
 * This package provides security utilities for the HYDRA platform:
 * - RBAC permission system
 * - Audit logging with hash chain integrity
 * - Password hashing (Argon2)
 * - API key management
 *
 * @packageDocumentation
 */

export { ROLES, type RoleName, type Permission, hasPermission } from './rbac/roles.js';
export { hashPassword, verifyPassword } from './auth/password.js';
export { generateApiKey, hashApiKey, verifyApiKey } from './auth/api-key.js';

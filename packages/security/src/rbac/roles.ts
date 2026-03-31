/**
 * Role-Based Access Control (RBAC) definitions
 */

/** Available permission actions */
type Action = 'create' | 'read' | 'update' | 'delete' | 'list';

/** Permission string format: "resource:action" */
export type Permission = `${string}:${Action}` | '*';

/** Role definition with associated permissions */
interface RoleDefinition {
  readonly description: string;
  readonly permissions: readonly Permission[];
}

/** Available role names */
export type RoleName = keyof typeof ROLES;

/** RBAC role definitions */
export const ROLES = {
  admin: {
    description: 'Full system access',
    permissions: ['*'] as const,
  },
  analyst: {
    description: 'Read data and create correlations/events',
    permissions: [
      'entities:read',
      'entities:list',
      'positions:read',
      'positions:list',
      'events:read',
      'events:create',
      'events:list',
      'correlations:read',
      'correlations:create',
      'correlations:list',
      'sources:read',
      'sources:list',
    ] as const,
  },
  operator: {
    description: 'Read-only data access plus source monitoring',
    permissions: [
      'entities:read',
      'entities:list',
      'positions:read',
      'positions:list',
      'events:read',
      'events:list',
      'sources:read',
      'sources:list',
    ] as const,
  },
  viewer: {
    description: 'Basic read-only access',
    permissions: ['entities:read', 'positions:read', 'events:read'] as const,
  },
} as const satisfies Record<string, RoleDefinition>;

/**
 * Check if a role has a specific permission
 *
 * @param role - The role name to check
 * @param permission - The required permission string
 * @returns true if the role has the permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const roleDefinition = ROLES[role as RoleName];
  if (!roleDefinition) {
    return false;
  }

  const perms = roleDefinition.permissions as readonly string[];

  if (perms.includes('*')) {
    return true;
  }

  return perms.includes(permission);
}

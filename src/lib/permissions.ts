export const PERMISSIONS = {
  SUPER_ADMIN: {
    dashboard: ["read"],
    transactions: ["create", "read", "update", "delete"],
    customers: ["create", "read", "update", "delete"],
    rates: ["read", "update"],
    cashier: ["create", "read"],
    expenses: ["create", "read", "update", "delete"],
    reports: ["read"],
    settings: ["read", "update"],
    users: ["create", "read", "update", "delete"],
    tenants: ["create", "read", "update", "delete"],
  },
  MANAGER: {
    dashboard: ["read"],
    transactions: ["create", "read", "update"],
    customers: ["create", "read", "update"],
    rates: ["read", "update"],
    cashier: ["create", "read"],
    expenses: ["create", "read"],
    reports: ["read"],
    settings: ["read"],
    users: ["read"],
    tenants: [],
  },
  EMPLOYEE: {
    dashboard: ["read"],
    transactions: ["create", "read"],
    customers: ["read"],
    rates: ["read"],
    cashier: ["read"],
    expenses: ["read"],
    reports: [],
    settings: [],
    users: [],
    tenants: [],
  },
} as const;

export type Permission = "create" | "read" | "update" | "delete";
export type Resource = keyof typeof PERMISSIONS.SUPER_ADMIN;
export type Role = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, resource: Resource, action: Permission): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  const resourcePerms = perms[resource];
  if (!resourcePerms) return false;
  return (resourcePerms as readonly Permission[]).includes(action);
}

export function canAccess(role: Role, resource: Resource): boolean {
  return hasPermission(role, resource, "read");
}

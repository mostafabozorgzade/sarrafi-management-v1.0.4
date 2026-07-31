export const PERMISSIONS = {
  SUPER_ADMIN: {
    dashboard: ["read"],
    transactions: ["create", "read", "update", "delete"],
    orders: ["create", "read", "update", "delete"],
    customers: ["create", "read", "update", "delete"],
    rates: ["read", "update"],
    cashier: ["create", "read", "update"],
    expenses: ["create", "read", "update", "delete"],
    reports: ["read"],
    settings: ["read", "update"],
    users: ["create", "read", "update", "delete"],
    currencies: ["create", "read", "update", "delete"],
    tenants: ["create", "read", "update", "delete"],
  },
  OWNER: {
    dashboard: ["read"],
    transactions: ["create", "read", "update", "delete"],
    orders: ["create", "read", "update", "delete"],
    customers: ["create", "read", "update", "delete"],
    rates: ["read", "update"],
    cashier: ["create", "read", "update"],
    expenses: ["create", "read", "update", "delete"],
    reports: ["read"],
    settings: ["read", "update"],
    users: ["create", "read", "update", "delete"],
    currencies: ["create", "read", "update", "delete"],
  },
  MANAGER: {
    dashboard: ["read"],
    transactions: ["create", "read", "update"],
    orders: ["create", "read", "update"],
    customers: ["create", "read", "update"],
    rates: ["read", "update"],
    cashier: ["create", "read"],
    expenses: ["create", "read"],
    reports: ["read"],
    settings: ["read"],
    users: ["read"],
    currencies: ["read"],
  },
  CASHIER: {
    dashboard: ["read"],
    transactions: ["create", "read"],
    orders: ["create", "read", "update"],
    customers: ["read", "update"],
    rates: ["read", "update"],
    cashier: ["read"],
    expenses: ["read"],
    reports: [],
    settings: [],
    users: [],
    currencies: ["read"],
  },
  ACCOUNTANT: {
    dashboard: ["read"],
    transactions: ["read"],
    orders: ["read"],
    customers: ["read", "update"],
    rates: ["read"],
    cashier: ["read"],
    expenses: ["create", "read", "update"],
    reports: ["read"],
    settings: [],
    users: [],
    currencies: ["read"],
  },
} as const;

export type Permission = "create" | "read" | "update" | "delete";
export type Resource = keyof typeof PERMISSIONS.OWNER;
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

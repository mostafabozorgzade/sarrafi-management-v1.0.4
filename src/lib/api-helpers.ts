import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type JwtPayload } from "@/lib/auth";

export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(message: string = "دسترسی ندارید") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function getTenantFilter(user: JwtPayload): Record<string, unknown> {
  if (user.role === "SUPER_ADMIN") return {};
  if (!user.tenantId) return { tenantId: "__no_access__" };
  return { tenantId: user.tenantId };
}

export function requireTenantId(user: JwtPayload): string | null {
  if (user.role === "SUPER_ADMIN") return null;
  return user.tenantId;
}

export function isSuperAdmin(user: JwtPayload): boolean {
  return user.role === "SUPER_ADMIN";
}

export function requireSuperAdmin(user: JwtPayload): NextResponse | null {
  if (user.role !== "SUPER_ADMIN") {
    return forbidden();
  }
  return null;
}

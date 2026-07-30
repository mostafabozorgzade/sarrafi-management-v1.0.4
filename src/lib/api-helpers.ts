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

export function getTenantFilter(user: JwtPayload): Record<string, unknown> {
  if (user.role === "SUPER_ADMIN") return {};
  if (!user.tenantId) return { tenantId: "__no_access__" };
  return { tenantId: user.tenantId };
}

export function requireTenantId(user: JwtPayload): string | null {
  if (user.role === "SUPER_ADMIN") return null;
  return user.tenantId;
}

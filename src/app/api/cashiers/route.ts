import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson([]);

  const registers = await prisma.cashRegister.findMany({
    where: getTenantFilter(user),
    include: { entries: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  return safeJson(registers);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { name, type, tenantId: bodyTenantId } = body;

    const tenantId = user.role === "SUPER_ADMIN" ? (bodyTenantId || user.tenantId) : user.tenantId;
    if (!tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

    const register = await prisma.cashRegister.create({
      data: { tenantId, name, type },
    });

    return safeJson(register);
  } catch (err) {
    console.error("Cash register creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد صندوق";
    return safeJson({ error: message }, { status: 500 });
  }
}

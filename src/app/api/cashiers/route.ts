import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const registers = await prisma.cashRegister.findMany({
    where: { tenantId: user.tenantId },
    include: { entries: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  return safeJson(registers);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { name, type } = body;

  const register = await prisma.cashRegister.create({
    data: { tenantId: user.tenantId, name, type },
  });

  return safeJson(register);
}

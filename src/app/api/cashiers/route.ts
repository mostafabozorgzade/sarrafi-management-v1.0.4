import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId! };

  const registers = await prisma.cashRegister.findMany({
    where,
    include: { entries: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  return NextResponse.json(registers);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return NextResponse.json({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { name, type } = body;

  const register = await prisma.cashRegister.create({
    data: { tenantId: user.tenantId, name, type },
  });

  return NextResponse.json(register);
}

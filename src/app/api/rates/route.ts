import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "OWNER" ? {} : { tenantId: user.tenantId! };

  const rates = await prisma.currencyRate.findMany({
    where,
    include: {
      currency: { select: { code: true, name: true } },
      changedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rates);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return NextResponse.json({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { currencyId, buyRate, sellRate } = body;

  if (!currencyId || !buyRate || !sellRate) {
    return NextResponse.json({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const rate = await prisma.currencyRate.upsert({
    where: { tenantId_currencyId: { tenantId: user.tenantId, currencyId } },
    update: { buyRate: Number(buyRate), sellRate: Number(sellRate), changedById: user.userId },
    create: { tenantId: user.tenantId, currencyId, buyRate: Number(buyRate), sellRate: Number(sellRate), changedById: user.userId },
    include: { currency: { select: { code: true, name: true } }, changedBy: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(rate);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId! };

  const rates = await prisma.currencyRate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rates);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return NextResponse.json({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { currency, buyRate, sellRate } = body;

  if (!currency || !buyRate || !sellRate) {
    return NextResponse.json({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const rate = await prisma.currencyRate.upsert({
    where: { tenantId_currency: { tenantId: user.tenantId, currency } },
    update: { buyRate: Number(buyRate), sellRate: Number(sellRate), changedBy: user.name },
    create: {
      tenantId: user.tenantId,
      currency,
      buyRate: Number(buyRate),
      sellRate: Number(sellRate),
      changedBy: user.name,
    },
  });

  return NextResponse.json(rate);
}

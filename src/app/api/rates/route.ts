import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const rates = await prisma.currencyRate.findMany({
    where: { tenantId: user.tenantId },
    include: {
      currency: { select: { code: true, name: true } },
      changedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return safeJson(rates);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  if (user.role !== "OWNER" && user.role !== "MANAGER") {
    return safeJson({ error: "فقط مدیر یا صراف اجازه تغییر نرخ دارد" }, { status: 403 });
  }

  const body = await request.json();
  const { currencyId, marketRate, buyRate, sellRate } = body;

  if (!currencyId || !buyRate || !sellRate) {
    return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const marketRateNum = Number(marketRate || 0);
  const buyRateNum = Number(buyRate);
  const sellRateNum = Number(sellRate);

  const rate = await prisma.currencyRate.upsert({
    where: { tenantId_currencyId: { tenantId: user.tenantId, currencyId } },
    update: {
      marketRate: marketRateNum,
      buyRate: buyRateNum,
      sellRate: sellRateNum,
      changedById: user.userId,
    },
    create: {
      tenantId: user.tenantId,
      currencyId,
      marketRate: marketRateNum,
      buyRate: buyRateNum,
      sellRate: sellRateNum,
      changedById: user.userId,
    },
    include: {
      currency: { select: { code: true, name: true } },
      changedBy: { select: { firstName: true, lastName: true } },
    },
  });

  await prisma.rateHistory.create({
    data: {
      tenantId: user.tenantId,
      currencyId,
      marketRate: marketRateNum,
      buyRate: buyRateNum,
      sellRate: sellRateNum,
      changedById: user.userId,
    },
  });

  return safeJson(rate);
}

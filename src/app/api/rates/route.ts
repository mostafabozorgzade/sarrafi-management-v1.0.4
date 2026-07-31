import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson([]);

  const rates = await prisma.currencyRate.findMany({
    where: getTenantFilter(user),
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

  try {
    const body = await request.json();
    const { currencyId, marketRate, buyRate, sellRate, tenantId: bodyTenantId } = body;

    const tenantId = user.role === "SUPER_ADMIN" ? (bodyTenantId || user.tenantId) : user.tenantId;
    if (!tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

    if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER") {
      return safeJson({ error: "فقط مدیر یا صراف اجازه تغییر نرخ دارد" }, { status: 403 });
    }

    if (!currencyId || !buyRate || !sellRate) {
      return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const marketRateNum = Number(marketRate || 0);
    const buyRateNum = Number(buyRate);
    const sellRateNum = Number(sellRate);

    const rate = await prisma.currencyRate.upsert({
      where: { tenantId_currencyId: { tenantId, currencyId } },
      update: {
        marketRate: BigInt(marketRateNum),
        buyRate: BigInt(buyRateNum),
        sellRate: BigInt(sellRateNum),
        changedById: user.userId,
      },
      create: {
        tenantId,
        currencyId,
        marketRate: BigInt(marketRateNum),
        buyRate: BigInt(buyRateNum),
        sellRate: BigInt(sellRateNum),
        changedById: user.userId,
      },
      include: {
        currency: { select: { code: true, name: true } },
        changedBy: { select: { firstName: true, lastName: true } },
      },
    });

    await prisma.rateHistory.create({
      data: {
        tenantId,
        currencyId,
        marketRate: BigInt(marketRateNum),
        buyRate: BigInt(buyRateNum),
        sellRate: BigInt(sellRateNum),
        changedById: user.userId,
      },
    });

    return safeJson(rate);
  } catch (err) {
    console.error("Rate update error:", err);
    const message = err instanceof Error ? err.message : "خطا در بروزرسانی نرخ";
    return safeJson({ error: message }, { status: 500 });
  }
}

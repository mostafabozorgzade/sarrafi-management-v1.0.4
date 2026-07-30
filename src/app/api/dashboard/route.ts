import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson([]);

  const where = getTenantFilter(user);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const completedStatus = "COMPLETED" as const;

  const [
    todayBuyProfit,
    todaySellProfit,
    activeOrders,
    rates,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { ...where, createdAt: { gte: startOfDay }, status: completedStatus },
      _sum: { buyMarketProfitAmount: true },
    }),
    prisma.order.aggregate({
      where: { ...where, createdAt: { gte: startOfDay }, status: completedStatus },
      _sum: { sellMarketProfitAmount: true },
    }),
    prisma.order.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.currencyRate.findMany({
      where,
      select: { id: true, currency: { select: { code: true, name: true } }, buyRate: true, sellRate: true, marketRate: true },
    }),
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        currency: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return safeJson({
    stats: {
      todayBuyProfit: todayBuyProfit._sum.buyMarketProfitAmount || 0,
      todaySellProfit: todaySellProfit._sum.sellMarketProfitAmount || 0,
      activeOrders,
    },
    rates,
    recentOrders,
  });
}

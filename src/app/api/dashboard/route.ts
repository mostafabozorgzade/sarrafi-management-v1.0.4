import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const where = { tenantId: user.tenantId };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    todayTransactions,
    todayProfit,
    todayVolume,
    totalProfit,
    totalCustomers,
    activeOrders,
    registers,
    rates,
    recentOrders,
  ] = await Promise.all([
    prisma.transaction.count({ where: { ...where, createdAt: { gte: startOfDay } } }),
    prisma.transaction.aggregate({ where: { ...where, createdAt: { gte: startOfDay } }, _sum: { profit: true } }),
    prisma.transaction.aggregate({ where: { ...where, createdAt: { gte: startOfDay } }, _sum: { totalToman: true } }),
    prisma.transaction.aggregate({ where, _sum: { profit: true } }),
    prisma.customer.count({ where }),
    prisma.order.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.cashRegister.findMany({ where, select: { id: true, name: true, type: true, balance: true } }),
    prisma.currencyRate.findMany({
      where,
      include: { currency: { select: { code: true, name: true } } },
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
      todayTransactions,
      todayProfit: todayProfit._sum.profit || 0,
      todayVolume: todayVolume._sum.totalToman || 0,
      totalProfit: totalProfit._sum.profit || 0,
      totalCustomers,
      activeOrders,
    },
    registers,
    rates,
    recentOrders,
    profitByEmployee: [],
  });
}

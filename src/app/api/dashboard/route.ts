import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId! };

  const [totalTransactions, todayTransactions, totalProfit, todayProfit, totalCustomers, totalVolume] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.count({ where: { ...where, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.transaction.aggregate({ where, _sum: { profit: true } }),
    prisma.transaction.aggregate({ where: { ...where, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { profit: true } }),
    prisma.customer.count({ where }),
    prisma.transaction.aggregate({ where: { ...where, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { totalToman: true } }),
  ]);

  const rates = await prisma.currencyRate.findMany({ where: user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId! } });
  const recentTransactions = await prisma.transaction.findMany({
    where,
    include: { customer: { select: { name: true } }, user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    stats: {
      totalTransactions,
      todayTransactions,
      totalProfit: totalProfit._sum.profit || 0,
      todayProfit: todayProfit._sum.profit || 0,
      totalCustomers,
      todayVolume: totalVolume._sum.totalToman || 0,
    },
    rates,
    recentTransactions,
  });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const orderType = searchParams.get("orderType");
  const status = searchParams.get("status");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedStatus = "COMPLETED" as const;

  const whereBase = { tenantId: user.tenantId };

  const dateFilter: Prisma.DateTimeFilter = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

  const where: Prisma.OrderWhereInput = {
    ...whereBase,
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    ...(orderType && orderType !== "all" ? { orderType: orderType as Prisma.EnumOrderTypeFilter["equals"] } : {}),
    status: (status && status !== "all" ? status : completedStatus) as Prisma.EnumOrderStatusFilter["equals"],
  };

  const todayWhere: Prisma.OrderWhereInput = { ...whereBase, createdAt: { gte: startOfDay }, status: completedStatus };
  const weekWhere: Prisma.OrderWhereInput = { ...whereBase, createdAt: { gte: startOfWeek }, status: completedStatus };
  const monthWhere: Prisma.OrderWhereInput = { ...whereBase, createdAt: { gte: startOfMonth }, status: completedStatus };
  const allTimeWhere: Prisma.OrderWhereInput = { ...whereBase, status: completedStatus };

  const [
    todayStats,
    weekStats,
    monthStats,
    allTimeStats,
    orders,
    profitByType,
    dailyProfit,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: todayWhere,
      _sum: { profit: true, totalToman: true, calculatedPkr: true, buyProfitAmount: true, sellProfitAmount: true, totalProfitAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: weekWhere,
      _sum: { profit: true, totalToman: true, calculatedPkr: true, buyProfitAmount: true, sellProfitAmount: true, totalProfitAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: monthWhere,
      _sum: { profit: true, totalToman: true, calculatedPkr: true, buyProfitAmount: true, sellProfitAmount: true, totalProfitAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: allTimeWhere,
      _sum: { profit: true, totalToman: true, calculatedPkr: true, buyProfitAmount: true, sellProfitAmount: true, totalProfitAmount: true },
      _count: true,
    }),
    prisma.order.findMany({
      where,
      select: {
        id: true, orderType: true, status: true, amount: true, rate: true, totalToman: true,
        calculatedPkr: true, fee: true, profit: true, buyProfitAmount: true, sellProfitAmount: true, totalProfitAmount: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.groupBy({
      by: ["orderType"],
      where: allTimeWhere,
      _sum: { profit: true, totalToman: true, calculatedPkr: true, buyProfitAmount: true, sellProfitAmount: true, totalProfitAmount: true },
      _count: true,
    }),
    prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*)::int as "orderCount",
        COALESCE(SUM(profit), 0)::bigint as profit,
        COALESCE(SUM(buy_profit_amount), 0)::bigint as "buyProfit",
        COALESCE(SUM(sell_profit_amount), 0)::bigint as "sellProfit",
        COALESCE(SUM(total_profit_amount), 0)::bigint as "totalProfit",
        COALESCE(SUM(total_toman), 0)::bigint as "totalToman"
      FROM orders
      WHERE tenant_id = ${user.tenantId}::uuid
        AND status = 'COMPLETED'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  ]);

  const extractSum = (sum: typeof todayStats._sum) => ({
    profit: sum?.profit || 0,
    totalToman: sum?.totalToman || 0,
    totalPkr: sum?.calculatedPkr || 0,
    buyProfit: sum?.buyProfitAmount || 0,
    sellProfit: sum?.sellProfitAmount || 0,
    totalProfit: sum?.totalProfitAmount || 0,
  });

  return safeJson({
    summary: {
      today: { ...extractSum(todayStats._sum), orderCount: todayStats._count },
      thisWeek: { ...extractSum(weekStats._sum), orderCount: weekStats._count },
      thisMonth: { ...extractSum(monthStats._sum), orderCount: monthStats._count },
      allTime: { ...extractSum(allTimeStats._sum), orderCount: allTimeStats._count },
    },
    profitByType: profitByType.map((p) => ({
      orderType: p.orderType,
      profit: p._sum?.profit || 0,
      totalToman: p._sum?.totalToman || 0,
      totalPkr: p._sum?.calculatedPkr || 0,
      buyProfit: p._sum?.buyProfitAmount || 0,
      sellProfit: p._sum?.sellProfitAmount || 0,
      totalProfit: p._sum?.totalProfitAmount || 0,
      count: p._count,
    })),
    dailyProfit: dailyProfit,
    filteredOrders: orders,
  });
}
